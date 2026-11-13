import { connection, NextResponse } from "next/server";
import { listRequests } from "@/lib/requests";
import { OPTIONS } from "@/lib/options";
import { getGuest } from "@/lib/guest-session";
import { readStore } from "@/lib/store-sync";
import { POST as createRequest } from "@/app/api/requests/route";

const signedOut = () => NextResponse.json({ error: "not signed in" }, { status: 401 });

// Only this guest's room. The filter runs here on the server, so the phone
// never receives anyone else's requests.
export async function GET() {
  await connection();
  const guest = await getGuest();
  if (!guest) return signedOut();
  return NextResponse.json(await readStore(() => listRequests().filter((r) => r.room === guest.room)));
}

// New request: the room comes from the session, whatever the body says.
// Tapped options are grouped by team, so "towels + broken TV" becomes one
// Housekeeping request and one Maintenance request. The guest's words go
// with the team(s) whose options they described, or with every team if the
// words didn't match any option.
export async function POST(req: Request) {
  const guest = await getGuest();
  if (!guest) return signedOut();
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 500) : "";
  const picked = OPTIONS.filter((o) => Array.isArray(body.options) && body.options.includes(o.id));
  if (!text && !picked.length) return NextResponse.json({ error: "Pick an option or tell us what you need" }, { status: 400 });

  const send = async (payload: Record<string, unknown>) => {
    const res = await createRequest(
      new Request(req.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, room: guest.room, source: "guest" }),
      }),
    );
    return res.ok ? ((await res.json()) as { id: string }).id : null;
  };

  const ids: string[] = [];
  if (!picked.length) {
    const id = await send({ text });
    if (id) ids.push(id);
  } else {
    const fromWords = new Set(Array.isArray(body.fromWords) ? body.fromWords : []);
    const described = picked.filter((o) => fromWords.has(o.id)).map((o) => o.category);
    const teams = [...new Set(picked.map((o) => o.category))];
    for (const category of teams) {
      const labels = picked.filter((o) => o.category === category).map((o) => o.label);
      const withWords = text && (!described.length || described.includes(category));
      const id = await send({ text: withWords ? `${labels.join(", ")}: ${text}` : labels.join(", "), category });
      if (id) ids.push(id);
    }
  }
  return ids.length
    ? NextResponse.json({ ids }, { status: 201 })
    : NextResponse.json({ error: "Couldn't send that. Please try again." }, { status: 500 });
}
