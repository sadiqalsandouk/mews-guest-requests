import { NextResponse } from "next/server";
import { COOKIE, cookieOptions, encodeSession, findBooking, getGuest } from "@/lib/guest-session";

// Who's signed in on this phone (room + surname), or 401.
export async function GET() {
  const guest = await getGuest();
  return guest ? NextResponse.json(guest) : NextResponse.json({ error: "not signed in" }, { status: 401 });
}

// Sign in: surname + room must match someone checked in.
// Production: matched against Mews reservations, with rate limiting.
export async function POST(req: Request) {
  const { surname, room } = await req.json().catch(() => ({}));
  const s = typeof surname === "string" ? surname.trim() : "";
  const r = typeof room === "string" ? room.trim() : "";
  if (!/^[\p{L}][\p{L}' -]{0,39}$/u.test(s) || !/^\d{1,4}$/.test(r)) {
    return NextResponse.json({ error: "Enter your surname and room number" }, { status: 400 });
  }
  const guest = findBooking(s, r);
  if (!guest) {
    // Same message whichever part is wrong, so it can't be used to find names.
    return NextResponse.json(
      { error: "We couldn't find that booking. Check your surname and room number." },
      { status: 404 },
    );
  }
  const res = NextResponse.json(guest);
  res.cookies.set(COOKIE, encodeSession(guest), cookieOptions);
  return res;
}

// Sign out.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
