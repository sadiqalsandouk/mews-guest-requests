import { NextResponse } from "next/server";
import { suggestOptions } from "@/lib/ai";
import { getGuest } from "@/lib/guest-session";
import { aiAllowed } from "@/lib/store-sync";

// As the guest types or speaks: which options their words ask for.
// Never blocks them: on any problem it just suggests nothing.
export async function POST(req: Request) {
  if (!(await getGuest())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { text } = await req.json().catch(() => ({}));
  if (typeof text !== "string" || text.trim().length < 3 || !(await aiAllowed("suggest"))) {
    return NextResponse.json({ options: [] });
  }
  try {
    return NextResponse.json({ options: await suggestOptions(text.trim().slice(0, 500)) });
  } catch (e) {
    console.error("[guest/suggest]", e);
    return NextResponse.json({ options: [] });
  }
}
