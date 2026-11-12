import { PRESETS } from "@/lib/presets";
import { categorise, type Category } from "@/lib/requests";

// Instant, no-AI reading of a typed staff note, so the form fills in as they type:
// "214 shower's freezing, urgent" → room 214, Shower / water, Maintenance, urgent.

const PRESET_WORDS: Record<string, string[]> = {
  towels: ["towel"],
  pillows: ["pillow"],
  cleaning: ["clean", "tidy", "hoover", "vacuum", "dirty", "make up the room"],
  shower: ["shower", "hot water", "cold water", "no water", "tap", "bath"],
  heating: ["heating", "heater", "air con", "aircon", "a/c", " ac ", "too hot", "too cold", "freezing", "radiator"],
  tv: ["tv", "telly", "wifi", "wi-fi", "internet", "remote"],
  broken: ["broken", "not working", "isn't working", "won't", "doesn't work", "leak", "stuck"],
  checkout: ["late checkout", "late check-out", "check out late", "checkout"],
  taxi: ["taxi", "cab", "uber", "airport"],
};

const URGENT_WORDS = [
  "urgent", "asap", "emergency", "right now", "immediately", "locked out", "leak", "flood",
  "no water", "fire", "smoke", "gas", "sparks", "injured",
];

// "room 214", "rm 214", "#214", or a bare 3–4 digit number.
// Takes a little word before it too ("guest in 302 wants…" → "guest wants…").
const ROOM_RE = /(?:\b(?:in|for|at|to|from)\s+)?(?:\b(?:room|rm)\s*|#)?\b(\d{3,4})\b[,:.\s-]*/i;

export type QuickParse = {
  room: string | null;
  presetId: string | null;
  category: Category;
  urgent: boolean;
  text: string; // the note without the room number
};

export function quickParse(note: string): QuickParse {
  const m = note.match(ROOM_RE);
  const text = (m ? note.replace(m[0], " ") : note).replace(/^[\s,:.-]+/, "").replace(/\s+/g, " ").trim();
  const t = ` ${text.toLowerCase()} `;
  const presetId = PRESETS.find((p) => PRESET_WORDS[p.id]?.some((w) => t.includes(w)))?.id ?? null;
  return {
    room: m?.[1] ?? null,
    presetId,
    category: PRESETS.find((p) => p.id === presetId)?.category ?? categorise(text),
    urgent: URGENT_WORDS.some((w) => t.includes(w)),
    text: text && text[0].toUpperCase() + text.slice(1),
  };
}

// Letters outside Latin scripts (Arabic, Chinese, Cyrillic…): worth sending to the AI to translate.
export const needsTranslating = (s: string) => /[^\p{Script=Latin}\p{N}\p{P}\p{S}\s]/u.test(s);
