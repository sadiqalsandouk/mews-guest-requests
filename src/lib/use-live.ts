"use client";

import { useCallback, useEffect, useState } from "react";

// After any change, every live view in this tab re-fetches at once,
// instead of waiting for its next poll.
const LIVE_REFRESH = "gr:live-refresh";
export const refreshAllLive = () => window.dispatchEvent(new Event(LIVE_REFRESH));

// Polls a JSON endpoint so the staff and guest screens stay in sync
// across devices. Good enough for a demo; production would push via webhooks.
export function useLive<T>(url: string | null, intervalMs = 1500) {
  const [data, setData] = useState<T | null>(null);
  const [missing, setMissing] = useState(false); // 404: e.g. staff deleted it

  const refresh = useCallback(async () => {
    if (!url) return;
    const res = await fetch(url, { cache: "no-store" });
    setMissing(res.status === 404);
    if (res.ok) setData(await res.json());
  }, [url]);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    const tick = () => fetch(url, { cache: "no-store" })
      .then((res) => {
        if (alive) setMissing(res.status === 404);
        return res.ok ? res.json() : null;
      })
      .then((json) => alive && json && setData(json))
      .catch(() => {});
    tick();
    const t = setInterval(tick, intervalMs);
    window.addEventListener(LIVE_REFRESH, tick);
    // Browsers slow down timers in background tabs; catch up the moment
    // the tab or window is looked at again.
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tick);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener(LIVE_REFRESH, tick);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tick);
    };
  }, [url, intervalMs]);

  return { data, refresh, missing };
}

export async function patchRequest(id: string, body: Record<string, unknown>, base = "/api/requests") {
  await fetch(`${base}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  refreshAllLive();
}

export async function removeRequest(id: string) {
  await fetch(`/api/requests/${id}`, { method: "DELETE" });
  refreshAllLive();
}

export async function removeAllRequests() {
  await fetch("/api/requests", { method: "DELETE" });
  refreshAllLive();
}

export const sendAction = (id: string, action: "advance" | "confirm" | "guestConfirm" | "reopen" | "followUp", base?: string) =>
  patchRequest(id, { action }, base);
