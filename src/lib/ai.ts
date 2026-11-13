import "server-only";
import { experimental_decide, generateText, Output } from "ai";
import { z } from "zod";
import { OPTIONS, type OptionId } from "@/lib/options";
import { PRESETS } from "@/lib/presets";
import { CATEGORIES, ROOMS, type Category } from "@/lib/requests";

// All AI goes through the Vercel AI SDK and AI Gateway (one key, any provider).
// - Guest requests: a decision model (Jev) picks the department and urgency,
//   with a probability we can act on. A small language model only translates.
// - Staff dictation: one language-model call turns a voice note into a form.
// Fixed rules run first for safety words, so emergencies never wait on the AI.

export type ParsedRequest = {
  transcript: string;
  language: string; // e.g. "English", "Arabic"
  room: string | null;
  request: string; // short, in English
  originalText: string | null; // what was said, if not English
  category: Category;
  presetId: string | null;
  urgent: boolean;
  safety: boolean; // gas, fire, smoke, flood…
  confidence: "high" | "low";
};

const DECISION_MODEL = process.env.DECISION_MODEL ?? "typesafe-ai/jev";
const TRANSLATE_MODEL = process.env.TRANSLATE_MODEL ?? "google/gemini-2.5-flash-lite";
const DICTATION_MODEL = process.env.DICTATION_MODEL ?? "google/gemini-2.5-flash";

// Checked before the AI (technical design: "safety skips AI").
const SAFETY_WORDS = [
  "gas", "fire", "smoke", "flood", "flooding", "burning", "sparks", "sparking", "electric shock",
  "unconscious", "not breathing", "bleeding",
  "حريق", "دخان", "غاز", "فيضان", "شرارة",
];
export const hasSafetyWord = (t: string) => {
  const s = t.toLowerCase();
  return SAFETY_WORDS.some((w) => s.includes(w));
};

const PARSED = z.object({
  transcript: z.string().describe("Exactly what was said, in its original language"),
  language: z.string().describe("Language of what was said, in English, e.g. English, Arabic"),
  room: z.string().nullable().describe("Room number as digits only, or null if not said"),
  request: z.string().describe("The request in short, plain English, without the room number. E.g. 'Shower has no hot water'"),
  category: z.enum(CATEGORIES as [Category, ...Category[]]),
  presetId: z.string().nullable(),
  urgent: z.boolean(),
  safety: z.boolean(),
  confidence: z.enum(["high", "low"]),
});

const PROMPT = `You help hotel front-desk staff log guest requests. Staff dictate or type quick notes like "room 214 shower's cold, guest is annoyed".

- room: digits only. Spoken numbers count ("two one four" = "214"). Known rooms: ${ROOMS.join(", ")} (others can exist). null if no room was said.
- request: short plain English, max 10 words, no room number. Translate if it was said in another language.
- category: Maintenance (repairs, anything broken, water, heating, AC, TV, Wi-Fi), Housekeeping (towels, pillows, cleaning, bedding, amenities), Front desk (checkout, taxis, luggage, bookings, questions, anything else).
- presetId: the closest of ${PRESETS.map((p) => `${p.id} (${p.text})`).join("; ")}. null if none fits well.
- urgent: true if it affects safety, health, or the guest can't use the room (no water, locked out, leak), or staff say it's urgent.
- safety: true only for danger: gas, fire, smoke, flooding, electrical sparks, medical emergency.
- confidence: low if the audio was unclear or you guessed.`;

/** Staff dictation or typed note → a filled-in request form. */
export async function parseRequest(input: { audio?: { data: string; mimeType: string }; text?: string }): Promise<ParsedRequest> {
  const content: ({ type: "text"; text: string } | { type: "file"; data: string; mediaType: string })[] = [
    { type: "text", text: PROMPT },
  ];
  if (input.audio) content.push({ type: "file", data: input.audio.data, mediaType: input.audio.mimeType });
  if (input.text) content.push({ type: "text", text: `Staff note: ${input.text}` });

  const { output: p } = await generateText({
    model: DICTATION_MODEL,
    output: Output.object({ schema: PARSED }),
    messages: [{ role: "user", content }],
    temperature: 0,
    abortSignal: AbortSignal.timeout(20_000),
  });

  // Never trust the model's shape blindly.
  const transcript = String(p.transcript ?? input.text ?? "").slice(0, 500);
  const language = String(p.language || "English");
  const room = typeof p.room === "string" && /^\d{1,5}$/.test(p.room.trim()) ? p.room.trim() : null;
  const category: Category = CATEGORIES.includes(p.category) ? p.category : "Front desk";
  const presetId = PRESETS.some((x) => x.id === p.presetId) ? p.presetId : null;
  const safety = Boolean(p.safety) || hasSafetyWord(transcript);
  const english = /^english$/i.test(language);
  return {
    transcript,
    language,
    room,
    request: String(p.request || transcript).slice(0, 200),
    originalText: english ? null : transcript,
    category,
    presetId,
    urgent: Boolean(p.urgent) || safety,
    safety,
    confidence: p.confidence === "low" ? "low" : "high",
  };
}

/* ---------------- Guest requests: decide, then translate if needed ---------------- */

// Below this, the AI isn't sure enough to route: a person at the front desk triages.
const ROUTE_CONFIDENCE = 0.7;
const DEPARTMENT_KEYS = { maintenance: "Maintenance", housekeeping: "Housekeeping", frontDesk: "Front desk" } as const;

export type GuestRouting = {
  category: Category;
  urgent: boolean;
  safety: boolean;
  confidence: number; // the chosen department's probability, 0–1
  language: string;
  english: string | null; // translation, if the guest didn't write in English
};

/** A guest's request, in their own words → department, urgency, safety, translation. */
export async function routeGuestRequest(text: string): Promise<GuestRouting> {
  const { answers } = await experimental_decide({
    model: DECISION_MODEL,
    state: { guestMessage: text },
    questions: {
      department: {
        type: "choice",
        instructions: "Which hotel team should handle this guest request?",
        criteria: {
          maintenance: "Repairs, anything broken, water, heating, AC, TV, Wi-Fi",
          housekeeping: "Towels, pillows, cleaning, bedding, toiletries",
          frontDesk: "Checkout, taxis, luggage, bookings, questions, anything else",
        },
      },
      urgent: { type: "boolean", instructions: "Does this need handling now: a safety or health risk, or the guest can't use the room?" },
      safety: { type: "boolean", instructions: "Is anyone in danger: fire, smoke, gas, flooding, sparks, or a medical emergency?" },
      english: { type: "boolean", instructions: "Is the guest message written in English?" },
    },
    abortSignal: AbortSignal.timeout(8_000),
  });

  const choice = answers.department.choice as keyof typeof DEPARTMENT_KEYS;
  const confidence = answers.department.probabilities?.[choice] ?? 0;
  // Safety leans cautious: a false alarm costs a phone call, a miss costs far more.
  const safety = answers.safety.probability >= 0.5 || hasSafetyWord(text);
  const routing: GuestRouting = {
    category: confidence >= ROUTE_CONFIDENCE ? DEPARTMENT_KEYS[choice] : "Front desk",
    urgent: answers.urgent.probability >= 0.7 || safety,
    safety,
    confidence,
    language: "English",
    english: null,
  };

  if (answers.english.probability < 0.5) {
    const { output } = await generateText({
      model: TRANSLATE_MODEL,
      output: Output.object({ schema: z.object({ language: z.string(), english: z.string() }) }),
      prompt: `Translate this hotel guest request into short, plain English (max 12 words) and name its language in English.\n\nRequest: ${text}`,
      temperature: 0,
      abortSignal: AbortSignal.timeout(8_000),
    });
    routing.language = output.language.slice(0, 40);
    routing.english = output.english.slice(0, 200);
  }
  return routing;
}

/* ---------------- Live suggestions while the guest types or speaks ---------------- */

// Each option is its own yes/no question, so a message can tick several
// ("towels and a taxi"). Below this probability we leave it unticked.
const SUGGEST_THRESHOLD = 0.5;

/** What the guest has written so far → the options it asks for, plus an
 *  English version when they didn't write in English (shown under the box). */
export async function suggestOptions(text: string): Promise<{ options: OptionId[]; english: string | null }> {
  const { answers } = await experimental_decide({
    model: DECISION_MODEL,
    state: { guestMessage: text },
    questions: {
      ...Object.fromEntries(
        OPTIONS.map((o) => [
          o.id,
          { type: "boolean" as const, instructions: `${o.ask} Only answer yes if the message actually asks for or reports this.` },
        ]),
      ),
      isEnglish: { type: "boolean" as const, instructions: "Is the guest message written in English?" },
    },
    abortSignal: AbortSignal.timeout(5_000),
  });
  const yes = answers as Record<string, { probability: number } | undefined>;
  const options = OPTIONS.filter((o) => (yes[o.id]?.probability ?? 0) >= SUGGEST_THRESHOLD).map((o) => o.id);
  if ((yes.isEnglish?.probability ?? 1) >= 0.5) return { options, english: null };
  const { output } = await generateText({
    model: TRANSLATE_MODEL,
    output: Output.object({ schema: z.object({ english: z.string() }) }),
    prompt: `Translate this hotel guest message into short, plain English.\n\nMessage: ${text}`,
    temperature: 0,
    abortSignal: AbortSignal.timeout(6_000),
  });
  return { options, english: output.english.slice(0, 300) };
}
