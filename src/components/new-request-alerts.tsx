"use client";

import { useCallback, useEffect, useState } from "react";
import { CloseIcon } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { requestKey, type GuestRequest } from "@/lib/requests";

// A soft two-note chime (Web Audio, no files). Browsers only allow sound
// after someone has clicked on the page, so this quietly does nothing before that.
function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1318.5].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.16;
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.5);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {}
}

// Watches the live list and pops an alert (with a chime) when a guest's
// request arrives, so staff don't have to keep checking the board.
export function useNewRequestAlerts(requests: GuestRequest[] | null) {
  const [seen, setSeen] = useState<Set<string> | null>(null);
  const [alerts, setAlerts] = useState<GuestRequest[]>([]);

  if (requests) {
    if (!seen) {
      setSeen(new Set(requests.map((r) => r.id)));
    } else {
      const fresh = requests.filter((r) => !seen.has(r.id));
      if (fresh.length) {
        setSeen(new Set([...seen, ...fresh.map((r) => r.id)]));
        // Only guests' requests: staff who just logged one don't need telling.
        const fromGuests = fresh.filter((r) => r.source !== "staff");
        if (fromGuests.length) setAlerts((cur) => [...fromGuests, ...cur].slice(0, 3));
      }
    }
  }

  const latest = alerts[0]?.id;
  useEffect(() => {
    if (latest) chime();
  }, [latest]);

  // "(2) Staff · …" in the tab title while alerts are waiting.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = alerts.length ? `(${alerts.length}) ${base}` : base;
  }, [alerts.length]);

  // Stable, so the auto-hide timer isn't restarted by every refresh.
  const dismiss = useCallback((id: string) => setAlerts((cur) => cur.filter((a) => a.id !== id)), []);
  return { alerts, dismiss, newIds: new Set(alerts.map((a) => a.id)) };
}

export function NewRequestAlerts({
  alerts,
  onOpen,
  onDismiss,
}: {
  alerts: GuestRequest[];
  onOpen: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  // Each alert hides itself after 12 seconds.
  const oldest = alerts.at(-1)?.id;
  useEffect(() => {
    if (!oldest) return;
    const t = setTimeout(() => onDismiss(oldest), 12_000);
    return () => clearTimeout(t);
  }, [oldest, onDismiss]);

  if (!alerts.length) return null;
  return (
    <div className="fixed right-4 bottom-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {alerts.map((r) => (
        <div key={r.id} className="gr-rise relative overflow-hidden rounded-lg border bg-card p-4 pl-5 shadow-lg">
          <span className="absolute inset-y-0 left-0 w-1 bg-orchid" aria-hidden />
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="size-2 animate-pulse rounded-full bg-orchid" aria-hidden />
                New request · Room {r.room}
                {r.urgent && <span className="rounded-sm bg-dot-red px-1.5 text-xs text-white">Urgent</span>}
              </p>
              <p dir="auto" className="mt-1 truncate text-sm">{r.text}</p>
              <p className="text-xs text-muted-foreground">
                {r.category} · {requestKey(r)}
              </p>
            </div>
            <button onClick={() => onDismiss(r.id)} aria-label="Dismiss" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
              <CloseIcon className="size-4" />
            </button>
          </div>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => {
              onOpen(r.id);
              onDismiss(r.id);
            }}
          >
            Open
          </Button>
        </div>
      ))}
    </div>
  );
}
