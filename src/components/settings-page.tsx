"use client";

import { useState } from "react";
import Link from "next/link";
import { BackIcon, CheckIcon, RemoveIcon, AddIcon, ResetDemoIcon, TimeLimitIcon } from "@/components/icons";

import { AppNav } from "@/components/app-nav";
import { HotelMenu } from "@/components/hotel-menu";
import { MewsWordmark } from "@/components/mews-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, isOverdue, TIME_LIMIT_MIN, type Category, type GuestRequest, type Limits } from "@/lib/requests";
import { useLive } from "@/lib/use-live";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

const HELP: Record<Category, string> = {
  Maintenance: "Repairs: showers, heating, TVs, anything broken.",
  Housekeeping: "Towels, pillows, cleaning, amenities.",
  "Front desk": "Late checkout, taxis, luggage, questions.",
};

const SECTIONS = [
  { id: "escalation", label: "Escalation rules", icon: TimeLimitIcon },
  { id: "demo", label: "Demo data", icon: ResetDemoIcon },
] as const;

export function SettingsPage() {
  const { data: saved, refresh } = useLive<{ limits: Limits }>("/api/settings", 10_000);
  const { data: requests } = useLive<GuestRequest[]>("/api/requests", 5_000);
  const now = useNow();
  const [draft, setDraft] = useState<Partial<Record<Category, string>>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("escalation");
  const [demoDone, setDemoDone] = useState<string | null>(null);

  const current = saved?.limits;
  const value = (c: Category) => draft[c] ?? String(current?.[c] ?? "");
  const parsed = Object.fromEntries(CATEGORIES.map((c) => [c, Number(value(c))])) as Limits;
  const valid = CATEGORIES.every((c) => Number.isInteger(parsed[c]) && parsed[c] >= 1 && parsed[c] <= 480);
  const dirty = !!current && CATEGORIES.some((c) => parsed[c] !== current[c]);

  // Live preview: how many open requests would be overdue with these limits.
  const open = (requests ?? []).filter((r) => r.status !== "confirmed");
  const overdueNow = now && current ? open.filter((r) => isOverdue({ ...r, overdue: undefined }, now, current)).length : null;
  const overdueDraft = now && valid ? open.filter((r) => isOverdue({ ...r, overdue: undefined }, now, parsed)).length : null;

  const set = (c: Category, v: string) => {
    setDraft((d) => ({ ...d, [c]: v }));
    setStatus("idle");
  };
  const step = (c: Category, by: number) => set(c, String(Math.min(480, Math.max(1, (parsed[c] || 0) + by))));

  const save = async () => {
    setStatus("saving");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limits: parsed }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Couldn't save");
      setStatus("error");
      return;
    }
    setDraft({});
    setError(null);
    setStatus("saved");
    refresh();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card px-4 py-3">
        <AppNav />
        <Link href="/" aria-label="Home" className="shrink-0">
          <MewsWordmark className="h-3.5 w-auto" />
        </Link>
        <span className="text-sm text-muted-foreground">Settings</span>
        <HotelMenu />
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-6 p-4 md:grid-cols-[200px_1fr] md:p-8">
        <nav aria-label="Settings sections" className="flex gap-1 md:flex-col">
          <Link href="/staff" className="mb-2 hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground md:flex">
            <BackIcon className="size-4" /> Back to requests
          </Link>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              aria-current={section === id ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
                section === id ? "bg-orchid-tint font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {section === id && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-orchid max-md:hidden" aria-hidden />}
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </nav>

        {section === "escalation" ? (
          <section className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Escalation rules</h1>
              <p className="mt-1 text-muted-foreground">
                If a request isn&apos;t marked fixed within the time limit, it turns red on the board and goes to the duty
                manager.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border bg-card">
              <div className="hidden grid-cols-[1fr_200px] gap-4 border-b bg-muted px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                <span>Department</span>
                <span>Time limit</span>
              </div>
              {CATEGORIES.map((c) => {
                const bad = value(c) !== "" && !(Number.isInteger(parsed[c]) && parsed[c] >= 1 && parsed[c] <= 480);
                return (
                  <div key={c} className="grid items-center gap-3 border-b px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_200px] sm:gap-4">
                    <div>
                      <label htmlFor={`limit-${c}`} className="font-medium">{c}</label>
                      <p className="text-sm text-muted-foreground">{HELP[c]}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon-lg" aria-label={`5 minutes less for ${c}`} onClick={() => step(c, -5)}>
                        <RemoveIcon />
                      </Button>
                      <Input
                        id={`limit-${c}`}
                        inputMode="numeric"
                        value={value(c)}
                        onChange={(e) => set(c, e.target.value.replace(/[^\d]/g, ""))}
                        aria-invalid={bad || undefined}
                        className="w-16 text-center tabular-nums"
                      />
                      <Button variant="outline" size="icon-lg" aria-label={`5 minutes more for ${c}`} onClick={() => step(c, 5)}>
                        <AddIcon />
                      </Button>
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {overdueDraft !== null && overdueNow !== null && (
              <p className="rounded-md border-l-4 border-orchid bg-muted p-3 text-sm">
                {dirty ? (
                  <>
                    With these limits, <strong>{overdueDraft}</strong> of {open.length} open requests would be overdue right now
                    (currently {overdueNow}).
                  </>
                ) : (
                  <>
                    <strong>{overdueNow}</strong> of {open.length} open requests are overdue right now.
                  </>
                )}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" disabled={!dirty || !valid || status === "saving"} onClick={save}>
                {status === "saving" ? "Saving…" : "Save changes"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                disabled={!current || CATEGORIES.every((c) => parsed[c] === TIME_LIMIT_MIN[c])}
                onClick={() => {
                  setDraft(Object.fromEntries(CATEGORIES.map((c) => [c, String(TIME_LIMIT_MIN[c])])));
                  setStatus("idle");
                }}
              >
                Restore defaults
              </Button>
              {status === "saved" && !dirty && (
                <span className="flex items-center gap-1 text-sm text-dot-green">
                  <CheckIcon className="size-4" /> Saved. The board updates within a few seconds.
                </span>
              )}
              {!valid && <span className="text-sm text-destructive">Use whole minutes from 1 to 480.</span>}
              {status === "error" && error && <span className="text-sm text-destructive">{error}</span>}
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Demo data</h1>
              <p className="mt-1 text-muted-foreground">
                The demo starts with a blank board. Load sample requests if you want a busy hotel to show.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Clear to a blank board", samples: false },
                { label: "Load sample data", samples: true },
              ].map(({ label, samples }) => (
                <Button
                  key={label}
                  variant={samples ? "default" : "outline"}
                  size="lg"
                  onClick={async () => {
                    await fetch(samples ? "/api/reset?samples=1" : "/api/reset", { method: "POST" });
                    setDraft({});
                    setStatus("idle");
                    refresh();
                    setDemoDone(label);
                    setTimeout(() => setDemoDone(null), 2500);
                  }}
                >
                  <ResetDemoIcon /> {label}
                </Button>
              ))}
            </div>
            {demoDone && (
              <span className="flex items-center gap-1 text-sm text-dot-green">
                <CheckIcon className="size-4" /> Done: {demoDone.toLowerCase()}.
              </span>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
