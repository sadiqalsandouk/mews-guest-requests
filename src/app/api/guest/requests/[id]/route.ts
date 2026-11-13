import { connection, NextRequest, NextResponse } from "next/server";
import { getRequest, withOverdue } from "@/lib/requests";
import { getGuest } from "@/lib/guest-session";
import { readStore } from "@/lib/store-sync";
import { PATCH as staffPatch } from "@/app/api/requests/[id]/route";

// What a guest may do to their own request. Not "confirm": only staff close.
// "set" is the demo stepper, standing in for staff moving the request along.
const GUEST_ACTIONS = ["guestConfirm", "reopen", "rate", "tip", "set"];
const notFound = () => NextResponse.json({ error: "not found" }, { status: 404 });

// Someone else's request looks the same as one that doesn't exist.
async function ownRequest(id: string) {
  const guest = await getGuest();
  if (!guest) return null;
  return readStore(() => {
    const r = getRequest(id);
    return r && r.room === guest.room ? withOverdue(r) : null;
  });
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/guest/requests/[id]">) {
  await connection();
  const r = await ownRequest((await ctx.params).id);
  return r ? NextResponse.json(r) : notFound();
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/guest/requests/[id]">) {
  const id = (await ctx.params).id;
  if (!(await ownRequest(id))) return notFound();
  const body = await req.json().catch(() => ({}));
  if (!GUEST_ACTIONS.includes(body.action)) return NextResponse.json({ error: "not allowed" }, { status: 403 });
  return staffPatch(
    new NextRequest(req.url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    { params: Promise.resolve({ id }) } as RouteContext<"/api/requests/[id]">,
  );
}
