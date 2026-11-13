import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Guest sign-in for the demo: surname + room number, kept in a signed cookie.
// The browser can't read it (HttpOnly) or change it (the signature breaks),
// and every guest API call takes the room from here, never from the client.
// In production: check surname + room against today's Mews reservations, and
// keep an opaque session ID in a database instead, so it can end at checkout.

export const COOKIE = "gr_guest";
const SECRET = process.env.GUEST_SESSION_SECRET ?? "demo-only-secret-change-me";
export const MAX_AGE = 60 * 60 * 24; // a day: long enough for the demo

export type GuestSession = { room: string; surname: string };

const sign = (payload: string) => createHmac("sha256", SECRET).update(payload).digest("base64url");

export function encodeSession(s: GuestSession) {
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(value: string | undefined): GuestSession | null {
  const [payload, sig] = value?.split(".") ?? [];
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof s.room === "string" && typeof s.surname === "string" ? s : null;
  } catch {
    return null;
  }
}

export async function getGuest(): Promise<GuestSession | null> {
  return decode((await cookies()).get(COOKIE)?.value);
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

// Who is checked in: stands in for today's Mews reservations. Kept in an
// environment variable, not the code, so real names never reach the repo.
// Format: "Oliveira|Cesar Oliveira:201,Vlnas:202" (first name is shown).
// Not set (local development): anyone can sign in.
const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}]+/gu, " ").trim();

function guestList() {
  return (process.env.GUEST_LIST ?? "")
    .split(",")
    .map((entry) => {
      const [names, room] = entry.split(":").map((x) => x?.trim());
      const all = (names ?? "").split("|").map((n) => n.trim()).filter(Boolean);
      return { display: all[0], names: all.map(norm), room };
    })
    .filter((g) => g.display && g.room);
}

/** The reservation matching this surname + room, or null. */
export function findBooking(surname: string, room: string): GuestSession | null {
  const list = guestList();
  if (!list.length) return { room, surname };
  const match = list.find((g) => g.room === room && g.names.includes(norm(surname)));
  return match ? { room: match.room, surname: match.display } : null;
}
