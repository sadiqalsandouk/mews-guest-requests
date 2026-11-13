import { NextResponse } from "next/server";
import { resetStore } from "@/lib/requests";
import { writeStore } from "@/lib/store-sync";

// Puts the demo back to a blank board before a run-through.
// ?samples=1 loads sample requests instead (a few weeks of history), just in case.
export async function POST(req: Request) {
  const withSamples = new URL(req.url).searchParams.get("samples") === "1";
  await writeStore(() => resetStore(withSamples));
  return NextResponse.json({ ok: true });
}
