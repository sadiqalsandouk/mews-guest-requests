import { NextResponse } from "next/server";
import { resetStore } from "@/lib/requests";
import { writeStore } from "@/lib/store-sync";

// Puts the demo back to its starting data before a run-through.
export async function POST() {
  await writeStore(() => resetStore());
  return NextResponse.json({ ok: true });
}
