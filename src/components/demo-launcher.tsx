"use client";

import { useState, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";

import { HotelWordmark } from "@/components/hotel-logo";
import { MewsWordmark } from "@/components/mews-logo";

const noop = () => () => {};
const getOrigin = () => window.location.origin;

// Demo home: one QR code, like the card in a hotel room. Big enough to scan
// from a projected screen; each person signs in with their own surname + room.
export function DemoLauncher() {
  const origin = useSyncExternalStore(noop, getOrigin, () => "");
  const [resetDone, setResetDone] = useState(false);

  const reset = async () => {
    await fetch("/api/reset", { method: "POST" });
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2500);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6 text-center">
      <div>
        <div className="mb-5">
          <HotelWordmark />
        </div>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">Need anything?</h1>
        <p className="mt-2 text-lg text-muted-foreground">Scan to ask, then follow it live.</p>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        {origin ? (
          <QRCodeSVG value={`${origin}/guest`} size={320} marginSize={1} className="h-auto w-[min(320px,70vw)]" />
        ) : (
          <div className="size-[min(320px,70vw)]" />
        )}
      </div>

      <p className="text-muted-foreground">Sign in with your surname and room number.</p>

      <footer className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          Powered by <MewsWordmark className="h-2 w-auto" />
        </span>
        <span>Concept prototype · mock data · not an official Mews product</span>
        <span className="flex gap-3">
          <a href="/guest" target="_blank" rel="noopener" className="underline-offset-2 hover:underline">
            Open on this device
          </a>
          <button onClick={reset} className="underline-offset-2 hover:underline">
            {resetDone ? "Demo reset" : "Reset demo"}
          </button>
        </span>
      </footer>
    </main>
  );
}
