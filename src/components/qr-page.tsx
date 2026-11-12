"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { BackIcon } from "@/components/icons";

import { AppNav } from "@/components/app-nav";
import { HotelMenu } from "@/components/hotel-menu";
import { MewsWordmark } from "@/components/mews-logo";
import { cn } from "@/lib/utils";

const ROOMS = ["1601", "214", "507", "302"];
const noop = () => () => {};
// Built from the address this page was opened on, so it's right on Wi-Fi,
// a tunnel or a hosted version without changing anything.
const getOrigin = () => window.location.origin;
const getSecure = () => window.isSecureContext;

export function QrPage() {
  const origin = useSyncExternalStore(noop, getOrigin, () => "");
  const secure = useSyncExternalStore(noop, getSecure, () => true);
  const [room, setRoom] = useState("1601");
  const url = origin ? `${origin}/guest?room=${room}` : "";
  const local = /localhost|127\.0\.0\.1/.test(origin);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card px-4 py-3">
        <AppNav />
        <Link href="/staff" aria-label="Requests board" className="shrink-0">
          <MewsWordmark className="h-3.5 w-auto" />
        </Link>
        <span className="text-sm text-muted-foreground">Guest QR code</span>
        <HotelMenu />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 p-6 text-center sm:p-10">
        <Link href="/staff" className="self-start inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <BackIcon className="size-4" /> Back to board
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Scan to be the guest</h1>
          <p className="mt-2 text-muted-foreground">
            Opens the request page for room {room}, as if you’d scanned the code in the room.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          {url && <QRCodeSVG value={url} size={300} marginSize={1} />}
        </div>

        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Room">
          {ROOMS.map((r) => (
            <button
              key={r}
              onClick={() => setRoom(r)}
              aria-pressed={room === r}
              className={cn(
                "h-9 rounded-md border px-3 text-sm",
                room === r ? "border-orchid bg-orchid-tint font-medium" : "hover:bg-muted",
              )}
            >
              Room {r}
            </button>
          ))}
        </div>

        <p className="break-all font-mono text-xs text-muted-foreground">{url}</p>

        {(local || !secure) && (
          <p className="max-w-lg rounded-md border-l-4 border-dot-amber bg-muted p-3 text-left text-sm">
            {local
              ? "This page is open on localhost, so a phone can’t reach this link. Open it on the laptop’s Wi-Fi address or the secure tunnel link instead (see README)."
              : "This link isn’t https, so phones will hide the mic. Use the secure tunnel link for voice (see README)."}
          </p>
        )}
      </main>
    </div>
  );
}
