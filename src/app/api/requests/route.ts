import { connection, NextResponse } from "next/server";
import { hasSafetyWord, routeGuestRequest } from "@/lib/ai";
import { CATEGORIES, clearRequests, createRequest, listRequests, type Category } from "@/lib/requests";
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
  let routedBy: { by: "guest" | "ai" | "rules"; confidence?: number } | undefined;

  // Guest requests: the decision model picks the department and spots urgency
  // and danger in any language; staff get an English translation. If the AI
  // fails or is slow, the request still goes through (keyword routing).
  if (source !== "staff") {
    routedBy = { by: "rules" };
    if (await aiAllowed()) {
      try {
        const d = await routeGuestRequest(finalText);
        aiCategory = d.category;
        aiUrgent = d.urgent;
        aiSafety = d.safety;
        routedBy = { by: "ai", confidence: Math.round(d.confidence * 100) / 100 };
        if (d.english) {
          orig = { text: finalText, lang: d.language };
          finalText = d.english;
        }
      } catch (e) {
        console.error("[requests] AI step failed, using keyword routing", e);
      }
    }
  }
  // Safety words are checked here too, whoever logged it and whatever the AI said.
  const safety = aiSafety || hasSafetyWord(text) || (orig ? hasSafetyWord(orig.text) : false);
  // The guest tapped an option: that decides the department, not the AI.
  if (source !== "staff" && CATEGORIES.includes(category)) routedBy = { by: "guest" };
  const r = await writeStore(() =>
    createRequest(room.trim().slice(0, 10), finalText, {
      category: CATEGORIES.includes(category) ? (category as Category) : aiCategory,
      source: source === "staff" ? "staff" : "guest",
      urgent: urgent === true || aiUrgent || safety,
      safety,
      original: orig,
      routedBy,
    }),
  );
  return NextResponse.json(r, { status: 201 });
}

// Demo tool: delete every request on the board.
export async function DELETE() {
  await writeStore(() => clearRequests());
  return NextResponse.json({ ok: true });
}
