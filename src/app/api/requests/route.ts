import { connection, NextResponse } from "next/server";
import { hasSafetyWord, parseRequest } from "@/lib/ai";
import { CATEGORIES, createRequest, listRequests, type Category } from "@/lib/requests";
import { aiAllowed, readStore, writeStore } from "@/lib/store-sync";

export async function GET() {
  await connection(); // always read the live store, never a build-time snapshot
  return NextResponse.json(await readStore(listRequests));
}

export async function POST(req: Request) {
  const { room, text, category, source, urgent, original } = await req.json();
  if (typeof room !== "string" || typeof text !== "string" || !room.trim() || !text.trim()) {
    return NextResponse.json({ error: "room and text are required" }, { status: 400 });
  }
  let orig =
    original && typeof original.text === "string" && typeof original.lang === "string"
      ? { text: original.text.slice(0, 500), lang: original.lang.slice(0, 40) }
      : undefined;
  let finalText = text.trim().slice(0, 500);
  let aiCategory: Category | undefined;
  let aiUrgent = false;
  let aiSafety = false;

  // Guest requests: the AI translates for staff, picks the department and spots
  // urgency. If it fails, the request still goes through (keyword routing).
  if (source !== "staff" && (await aiAllowed())) {
    try {
      const p = await parseRequest({ text: `Guest in room ${room}: ${finalText}` });
      aiCategory = p.category;
      aiUrgent = p.urgent;
      aiSafety = p.safety; // catches danger in any language, beyond the word list
      if (p.originalText) {
        orig = { text: finalText, lang: p.language };
        finalText = p.request;
      }
    } catch (e) {
      console.error("[requests] AI step failed, using keyword routing", e);
    }
  }
  // Safety words are checked here too, whoever logged it and whatever the AI said.
  const safety = aiSafety || hasSafetyWord(text) || (orig ? hasSafetyWord(orig.text) : false);
  const r = await writeStore(() =>
    createRequest(room.trim().slice(0, 10), finalText, {
      category: CATEGORIES.includes(category) ? (category as Category) : aiCategory,
      source: source === "staff" ? "staff" : "guest",
      urgent: urgent === true || aiUrgent || safety,
      safety,
      original: orig,
    }),
  );
  return NextResponse.json(r, { status: 201 });
}
