import "server-only";
import { PRESETS } from "@/lib/presets";
import { CATEGORIES, ROOMS, type Category } from "@/lib/requests";

// One Gemini call turns a spoken or typed staff note into a filled-in request:
// room, request (in English), department, matching preset, urgency, language.
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

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

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

const SCHEMA = {
  type: "OBJECT",
  properties: {
    transcript: { type: "STRING", description: "Exactly what was said, in its original language" },
    language: { type: "STRING", description: "Language of what was said, in English, e.g. English, Arabic" },
    room: { type: "STRING", nullable: true, description: "Room number as digits only, or null if not said" },
    request: { type: "STRING", description: "The request in short, plain English, without the room number. E.g. 'Shower has no hot water'" },
    category: { type: "STRING", enum: CATEGORIES },
    presetId: { type: "STRING", nullable: true, enum: PRESETS.map((p) => p.id) },
    urgent: { type: "BOOLEAN" },
    safety: { type: "BOOLEAN" },
    confidence: { type: "STRING", enum: ["high", "low"] },
  },
  required: ["transcript", "language", "room", "request", "category", "presetId", "urgent", "safety", "confidence"],
};

const PROMPT = `You help hotel front-desk staff log guest requests. Staff dictate or type quick notes like "room 214 shower's cold, guest is annoyed".

Return JSON only.
- room: digits only. Spoken numbers count ("two one four" = "214"). Known rooms: ${ROOMS.join(", ")} (others can exist). null if no room was said.
- request: short plain English, max 10 words, no room number. Translate if it was said in another language.
- category: Maintenance (repairs, anything broken, water, heating, AC, TV, Wi-Fi), Housekeeping (towels, pillows, cleaning, bedding, amenities), Front desk (checkout, taxis, luggage, bookings, questions, anything else).
- presetId: the closest of ${PRESETS.map((p) => `${p.id} (${p.text})`).join("; ")}. null if none fits well.
- urgent: true if it affects safety, health, or the guest can't use the room (no water, locked out, leak), or staff say it's urgent.
- safety: true only for danger: gas, fire, smoke, flooding, electrical sparks, medical emergency.
- confidence: low if the audio was unclear or you guessed.`;

export async function parseRequest(input: { audio?: { data: string; mimeType: string }; text?: string }): Promise<ParsedRequest> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const parts: object[] = [{ text: PROMPT }];
  if (input.audio) parts.push({ inline_data: { mime_type: input.audio.mimeType, data: input.audio.data } });
  if (input.text) parts.push({ text: `Staff note: ${input.text}` });

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
        temperature: 0,
        // A form fill doesn't need reasoning; skipping it roughly halves the wait.
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini returned no answer");
  const p = JSON.parse(raw);

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
