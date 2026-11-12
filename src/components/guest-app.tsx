"use client";

import { TowelsIcon, PillowsIcon, RoomCleaningIcon, SomethingBrokenIcon, ReceivedArt, AssignedArt, OnTheWayArt, FixedArt, ConfirmedArt } from "@/components/icons";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TranslatedIcon, BackIcon, DeptHousekeepingIcon, StatusReceivedIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, DeptFrontDeskIcon, RoomDoorIcon, PauseIcon, PlayIcon, RatingIcon, DeptMaintenanceIcon } from "@/components/icons";

import { useIsTopWindow } from "@/components/demo-exit";
import { MewsWordmark } from "@/components/mews-logo";
import { Button } from "@/components/ui/button";
import { VoiceTextarea } from "@/components/voice-input";
import { useCanRecord } from "@/lib/use-recorder";
import { HOTEL_NAME } from "@/lib/hotel";
import { BAD_TAGS, GOOD_TAGS, STAFF, stepIndex, type Category, type GuestRequest, type Status } from "@/lib/requests";
import { patchRequest, sendAction, useLive } from "@/lib/use-live";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

const QUICK = [
  ["Extra towels", TowelsIcon], ["Extra pillows", PillowsIcon],
  ["Room cleaning", RoomCleaningIcon], ["Something is broken", SomethingBrokenIcon],
] as const;
const DEPT_ICON: Record<Category, typeof DeptMaintenanceIcon> = {
  Maintenance: DeptMaintenanceIcon,
  Housekeeping: DeptHousekeepingIcon,
  "Front desk": DeptFrontDeskIcon,
};
// The 4 segments of the progress bar (confirmed = all done).
const SEGMENTS: Status[] = ["received", "assigned", "on_the_way", "fixed"];

// Guests always see their request in their own words; staff see the English.
const guestText = (r: GuestRequest) => r.original?.text ?? r.text;

const time = (t?: number) => (t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

// Headline + subline for each stage, written for the guest.
function stageCopy(r: GuestRequest) {
  const name = STAFF[r.category];
  if (r.reopened && r.status !== "confirmed" && r.status !== "fixed")
    return { title: `Sending ${name} back`, sub: "Sorry it's not sorted yet. It's now a priority." };
  switch (r.status) {
    case "received":
      return { title: "Request received", sub: "We've got it and we're finding the right person." };
    case "assigned":
      return { title: `${name} is on it`, sub: `${name} from ${r.category} has your request.` };
    case "on_the_way":
      return { title: `${name} is on the way`, sub: `Heading to room ${r.room} now.` };
    case "fixed":
      return { title: "Marked as fixed", sub: "Can you check it's all good?" };
    case "confirmed":
      return { title: "All sorted", sub: "Thanks for letting us know. Enjoy your stay." };
  }
}

export function GuestApp() {
  const params = useSearchParams();
  const router = useRouter();
  const room = params.get("room") ?? "214";
  const id = params.get("id");

  const go = (nextId: string | null) => router.replace(nextId ? `?room=${room}&id=${nextId}` : `?room=${room}`);

  // Review prompt: opens by itself once a request in this room is confirmed
  // (within the last hour) and not yet rated, unless the guest said "Not now".
  const { data: all } = useLive<GuestRequest[]>("/api/requests", 2000);
  const now = useNow(15_000);
  const [sheet, setSheet] = useState<{ id: string; stars: number } | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const promptKey = (r: GuestRequest) => `${r.id}:${r.closedAt ?? ""}`;
  const due = (all ?? [])
    .filter(
      (r) =>
        r.room === room &&
        r.status === "confirmed" &&
        !r.rating &&
        now !== null &&
        now - (r.closedAt ?? 0) < 3_600_000 &&
        !skipped.includes(promptKey(r)),
    )
    .sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))[0];
  if (!sheet && due) setSheet({ id: due.id, stars: 0 });
  const sheetReq = sheet && (all ?? []).find((r) => r.id === sheet.id);
  const rate: RateFn = (rid, stars) => setSheet({ id: rid, stars });
  const closeSheet = () => {
    if (sheetReq) setSkipped((s) => [...s, promptKey(sheetReq)]);
    setSheet(null);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between border-b px-5 py-4">
        <div>
          <p className="text-sm font-semibold">{HOTEL_NAME}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RoomDoorIcon className="size-3.5" aria-hidden /> Room {room}
          </p>
        </div>
        {id && (
          <Button variant="ghost" size="sm" onClick={() => go(null)}>
            <BackIcon /> Home
          </Button>
        )}
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {id ? <Tracker id={id} onRate={rate} /> : <Home room={room} onOpen={go} onRate={rate} />}
      </div>
      {sheetReq && <RatingSheet key={`${sheetReq.id}-${sheet!.stars}`} r={sheetReq} initial={sheet!.stars} onClose={closeSheet} />}
      <DemoStepper room={room} id={id} />
      {/* The hotel's brand leads on guest pages; Mews signs off quietly. */}
      <footer className="flex shrink-0 flex-col items-center gap-0.5 border-t py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          Powered by <MewsWordmark className="h-2 w-auto" />
        </span>
        <span className="text-[10px] opacity-80">Concept prototype · not an official Mews product</span>
      </footer>
    </div>
  );
}

/* ---------------- Home: live status cards + new request ---------------- */

function Home({ room, onOpen, onRate }: { room: string; onOpen: (id: string) => void; onRate: RateFn }) {
  const canRecord = useCanRecord();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { data: all } = useLive<GuestRequest[]>("/api/requests", 2000);
  const now = useNow(15_000);
  // Open requests, plus ones closed in the last hour (so "All sorted" lingers briefly).
  const mine = (all ?? []).filter(
    (r) => r.room === room && (r.status !== "confirmed" || (now !== null && now - (r.closedAt ?? 0) < 3_600_000)),
  );

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, text }),
    });
    setSending(false);
    if (res.ok) onOpen((await res.json()).id);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 py-5">
      {mine.length > 0 && (
        <section aria-label="Your requests" className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live updates</h2>
          {mine.map((r) => (
            <StatusCard key={r.id} r={r} onOpen={() => onOpen(r.id)} onRate={onRate} />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mine.length ? "Anything else?" : "How can we help?"}
        </h1>
        <label htmlFor="req" className="text-sm text-muted-foreground">
          {canRecord ? "Type or tap the mic. Any language is fine." : "Type your request. Any language is fine."}
        </label>
        <VoiceTextarea
          id="req"
          value={text}
          onChange={setText}
          // Guests see their own words; the server translates for staff on send.
          onVoice={(r) => setText(r.transcript)}
          placeholder="e.g. The shower is cold"
        />
        <div className="flex flex-wrap gap-2">
          {QUICK.map(([q, Icon]) => (
            <button
              key={q}
              onClick={() => setText(q)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
            >
              <Icon className="mr-1.5 inline-block size-5 align-text-bottom" />{q}
            </button>
          ))}
        </div>
        <Button size="lg" className="h-11 text-base" disabled={!text.trim() || sending} onClick={submit}>
          {sending ? "Sending…" : "Send request"}
        </Button>
      </section>
    </div>
  );
}

// Compact live card, like the pinned order tracker in Uber Eats.
function StatusCard({ r, onOpen, onRate }: { r: GuestRequest; onOpen: () => void; onRate: RateFn }) {
  const copy = stageCopy(r);
  const Icon = DEPT_ICON[r.category];
  const done = r.status === "confirmed";
  return (
    <div className="gr-rise relative overflow-hidden rounded-lg border bg-card shadow-xs transition-shadow hover:shadow-md">
    <button onClick={onOpen} className="flex w-full flex-col gap-3 p-4 text-left">
      <span className={cn("absolute inset-y-0 left-0 w-1", done ? "bg-dot-green" : "bg-orchid")} aria-hidden />
      <div className="flex items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", done ? "bg-status-done" : "bg-orchid-tint")}>
          {done ? <CheckIcon className="gr-pop size-5 text-dot-green" /> : <Icon className={cn("size-5", r.status === "on_the_way" && "gr-float")} />}
        </span>
        <div className="min-w-0 flex-1">
          <p key={r.status} className="gr-rise font-semibold">{copy.title}</p>
          <p dir="auto" className="truncate text-sm text-muted-foreground">{guestText(r)}</p>
          {r.original && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <TranslatedIcon className="size-3 shrink-0" /> <span className="truncate">{r.text}</span>
            </p>
          )}
        </div>
        <ChevronRightIcon className="mt-2 size-4 shrink-0 text-muted-foreground" />
      </div>
      <ProgressBar r={r} />
    </button>
    {done && !r.rating && (
      // Rate right from the card: one tap opens the sheet with that score.
      <div className="flex items-center justify-between gap-3 border-t bg-orchid-tint px-4 py-3">
        <span className="text-sm font-medium">How was {STAFF[r.category]}&apos;s help?</span>
        <RateStars r={r} onRate={onRate} size="size-6" />
      </div>
    )}
    {done && r.rating && (
      <div className="flex items-center gap-2 border-t px-4 py-2.5 text-sm text-muted-foreground">
        <Stars value={r.rating} /> Thanks for rating
      </div>
    )}
    </div>
  );
}

/* ---------------- Progress bar: segments, current one shimmers ---------------- */

function ProgressBar({ r, large = false }: { r: GuestRequest; large?: boolean }) {
  const current = stepIndex(r.status);
  const done = r.status === "confirmed";
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={Math.min(current + 1, 4)}>
      {SEGMENTS.map((s, i) => {
        const filled = i < current || done;
        const active = i === current && !done;
        return (
          <span key={s} className={cn("relative flex-1 overflow-hidden rounded-full bg-muted", large ? "h-2" : "h-1.5")}>
            <span
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out",
                done ? "bg-dot-green" : "bg-orchid",
              )}
              style={{ width: filled ? "100%" : active ? "45%" : "0%" }}
            />
            {active && <span className="gr-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent" />}
          </span>
        );
      })}
    </div>
  );
}

/* ---------------- Full tracker ---------------- */

function Tracker({ id, onRate }: { id: string; onRate: RateFn }) {
  const { data: r, refresh } = useLive<GuestRequest>(`/api/requests/${id}`, 1500);
  const now = useNow(15_000);

  if (!r) return <p className="px-5 py-5 text-muted-foreground">Loading…</p>;

  const copy = stageCopy(r);
  const done = r.status === "confirmed";
  const answer = async (action: "confirm" | "reopen") => {
    await sendAction(r.id, action);
    refresh();
  };
  const late = now !== null && r.dueBy !== undefined && now > r.dueBy && stepIndex(r.status) < stepIndex("fixed");

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 py-5">
      {/* Stage animation */}
      <StageArt r={r} />

      {/* Headline swaps with a small rise when the stage changes */}
      <div key={`${r.status}-${r.reopened}`} className="gr-rise">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-1 text-muted-foreground">{copy.sub}</p>
      </div>

      {r.safety && r.status !== "confirmed" && (
        // Safety words skip the queue: tell the guest to call, don't make them wait on an app.
        <div className="gr-pop rounded-lg border-l-4 border-dot-red bg-muted p-4">
          <p className="font-semibold">If anyone is in danger, call reception now.</p>
          <p className="text-sm text-muted-foreground">We&apos;ve alerted the duty manager and someone is coming now.</p>
        </div>
      )}

      <ProgressBar r={r} large />

      {!done && r.status !== "fixed" && r.dueBy && (
        <p className="text-sm">
          {late ? (
            <span className="text-dot-red">Taking longer than planned. The duty manager has been told.</span>
          ) : (
            <>
              <span className="text-muted-foreground">We aim to sort this by </span>
              <span className="font-semibold tabular-nums">{time(r.dueBy)}</span>
            </>
          )}
        </p>
      )}

      {r.status === "fixed" && (
        <div className="gr-pop rounded-lg border bg-orchid-tint p-4">
          <p className="mb-3 font-semibold">Is it fixed?</p>
          <div className="flex gap-2">
            <Button size="lg" className="flex-1" onClick={() => answer("confirm")}>
              Yes, all good
            </Button>
            <Button variant="outline" size="lg" className="flex-1 bg-background" onClick={() => answer("reopen")}>
              Not yet
            </Button>
          </div>
        </div>
      )}

      {done && <RateInline r={r} onRate={onRate} />}

      {/* Request + who has it */}
      <div className="flex items-center gap-3 rounded-lg border p-3">
        {stepIndex(r.status) >= 1 ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
            {STAFF[r.category][0]}
          </span>
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <StatusReceivedIcon className="size-4" />
          </span>
        )}
        <div className="min-w-0">
          <p dir="auto" className="font-medium">{guestText(r)}</p>
          {r.original && (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
              <TranslatedIcon className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Sent to the team in English: <span className="text-foreground">“{r.text}”</span>
              </span>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {stepIndex(r.status) >= 1 ? `${STAFF[r.category]} · ${r.category}` : r.category}
            {r.source === "staff" && " · logged by the front desk"}
          </p>
        </div>
      </div>

      {/* Step log with times */}
      <ol className="flex flex-col gap-2.5 text-sm">
        {(["received", "assigned", "on_the_way", "fixed", "confirmed"] as Status[]).map((s) => {
          const at = r.stepAt?.[s] ?? (s === "received" ? r.createdAt : undefined);
          const reached = stepIndex(r.status) >= stepIndex(s);
          const label = {
            received: "Request received",
            assigned: `Passed to ${STAFF[r.category]}`,
            on_the_way: "On the way",
            fixed: "Marked as fixed",
            confirmed: "You confirmed it's fixed",
          }[s];
          return (
            <li key={s} className={cn("flex items-center gap-3", !reached && "text-muted-foreground")}>
              <span className={cn("size-2 rounded-full", reached ? (done ? "bg-dot-green" : "bg-orchid") : "bg-input")} aria-hidden />
              <span className="flex-1">{label}</span>
              <span className="tabular-nums text-muted-foreground">{reached ? time(at) : ""}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------------- Review: prompted like Uber Eats ---------------- */
// Pops up by itself when a request is done, asks about a named person,
// one tap to rate, then quick tags and an optional comment. Easy to skip.

const RATING_WORDS = ["", "Poor", "Not great", "OK", "Good", "Excellent"];

type RateFn = (id: string, stars: number) => void;

// Tappable stars: on the home card and in the tracker. Opens the sheet.
function RateStars({ r, onRate, size = "size-7" }: { r: GuestRequest; onRate: RateFn; size?: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Rate" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={(e) => {
            e.stopPropagation();
            onRate(r.id, n);
          }}
          className="rounded-md p-0.5 transition-transform hover:scale-110 active:scale-90"
        >
          <RatingIcon className={cn(size, n <= hover ? "fill-orchid text-orchid" : "text-input")} />
        </button>
      ))}
    </div>
  );
}

// Inline in the tracker: the ask before rating, a thank-you after.
function RateInline({ r, onRate }: { r: GuestRequest; onRate: RateFn }) {
  const name = STAFF[r.category];
  if (r.rating) {
    return (
      <div className="gr-rise flex flex-col gap-1 rounded-lg border p-4">
        <Stars value={r.rating} />
        <p className="mt-1 font-medium">Thanks for rating {name}</p>
        <p className="text-sm text-muted-foreground">
          {r.rating <= 3 ? "Sorry it wasn't better. The duty manager will be in touch." : `We've passed it on to ${name}.`}
        </p>
      </div>
    );
  }
  return (
    <div className="gr-pop flex flex-col items-center gap-2 rounded-lg border bg-orchid-tint p-5 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-foreground text-lg font-semibold text-background">
        {name[0]}
      </span>
      <p className="font-semibold">How was {name}&apos;s help?</p>
      <RateStars r={r} onRate={onRate} size="size-8" />
    </div>
  );
}

function RatingSheet({
  r,
  initial,
  onClose,
}: {
  r: GuestRequest;
  initial: number;
  onClose: () => void;
}) {
  const name = STAFF[r.category];
  const [stars, setStars] = useState(initial);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [phase, setPhase] = useState<"rate" | "sending" | "thanks">("rate");

  const good = stars > 3;
  const options = good ? GOOD_TAGS : BAD_TAGS;
  const shown = hover || stars;

  const pick = (n: number) => {
    // Switching between good and bad clears tags that no longer apply.
    if (n > 3 !== stars > 3) setTags([]);
    setStars(n);
  };
  const toggle = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const submit = async () => {
    setPhase("sending");
    await patchRequest(r.id, { action: "rate", rating: stars, comment, tags });
    setPhase("thanks");
    setTimeout(onClose, 1800);
  };

  // Esc closes the sheet (and doesn't also leave the guest page).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  // Drawn inside the phone-sized guest card, not over the whole browser.
  return (
    <div className="absolute inset-0 z-40">
      <div className="absolute inset-0 animate-in bg-foreground/30 backdrop-blur-[2px] fade-in" onClick={onClose} aria-hidden />
      <div className="sticky top-0 flex h-dvh max-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`How was ${name}'s help?`}
          className="relative w-full animate-in rounded-2xl bg-background shadow-xl duration-200 fade-in zoom-in-95"
        >

        {phase === "thanks" ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="gr-pop flex size-14 items-center justify-center rounded-full bg-dot-green text-white">
              <CheckIcon className="size-7" />
            </span>
            <p className="text-lg font-semibold">Thanks for your feedback</p>
            <p className="text-sm text-muted-foreground">
              {good ? `We'll pass it on to ${name}.` : "Sorry it wasn't better. The duty manager will be in touch."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 px-6 pt-6 pb-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="gr-pop flex size-14 items-center justify-center rounded-full bg-foreground text-xl font-semibold text-background">
                {name[0]}
              </span>
              <p className="text-xl font-semibold tracking-tight">How was {name}&apos;s help?</p>
              <p dir="auto" className="line-clamp-1 text-sm text-muted-foreground">{guestText(r)}</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    role="radio"
                    aria-checked={stars === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onMouseEnter={() => setHover(n)}
                    onClick={() => pick(n)}
                    className="rounded-md p-1 transition-transform hover:scale-110 active:scale-90"
                  >
                    <RatingIcon
                      key={`${n}-${n <= stars}`}
                      className={cn("size-10", n <= shown ? "fill-orchid text-orchid" : "text-input", n <= stars && "gr-pop")}
                      style={{ animationDelay: `${(n - 1) * 40}ms` }}
                    />
                  </button>
                ))}
              </div>
              <p className="h-5 text-sm font-medium text-muted-foreground">{RATING_WORDS[shown]}</p>
            </div>

            {stars > 0 && (
              <div key={good ? "good" : "bad"} className="gr-rise flex flex-col gap-3">
                <p className="text-sm font-medium">{good ? "What went well?" : "What went wrong?"}</p>
                <div className="flex flex-wrap gap-2">
                  {options.map((t) => {
                    const on = tags.includes(t);
                    return (
                      <button
                        key={t}
                        aria-pressed={on}
                        onClick={() => toggle(t)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition-colors",
                          on ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  dir="auto"
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={good ? "Anything else to add? (optional)" : "Tell us more (optional)"}
                  className="w-full resize-none rounded-md border border-input bg-background p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Button size="lg" className="h-11 text-base" disabled={!stars || phase === "sending"} onClick={submit}>
                {phase === "sending" ? "Sending…" : "Submit"}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Not now
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-0.5", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <RatingIcon key={n} className={cn("size-4", n <= value ? "fill-orchid text-orchid" : "text-input")} />
      ))}
    </span>
  );
}

/* ---------------- Demo stepper: walk through every stage ---------------- */

const ALL_STAGES: Status[] = ["received", "assigned", "on_the_way", "fixed", "confirmed"];
const STAGE_LABEL: Record<Status, string> = {
  received: "Received",
  assigned: "Assigned",
  on_the_way: "On the way",
  fixed: "Fixed",
  confirmed: "Confirmed",
};

// Demo-only control for presenting (hidden if the page is embedded in a frame).
// Changes the real request, so the staff board follows along.
function DemoStepper({ room, id }: { room: string; id: string | null }) {
  const show = useIsTopWindow();
  const { data: all } = useLive<GuestRequest[]>(show ? "/api/requests" : null, 1500);
  // The open request, or this room's most recent one.
  const mine = (all ?? []).filter((x) => x.room === room).sort((a, b) => b.createdAt - a.createdAt);
  const r = (id ? mine.find((x) => x.id === id) : undefined) ?? mine.find((x) => x.status !== "confirmed") ?? mine[0];
  return show && r ? <StepperPanel key={r.id} r={r} /> : null;
}

function StepperPanel({ r }: { r: GuestRequest }) {
  const [playing, setPlaying] = useState(false);
  // Shown straight away on click; cleared once the server agrees.
  const [optimistic, setOptimistic] = useState<Status | null>(null);
  if (optimistic && r.status === optimistic) setOptimistic(null);
  const i = stepIndex(optimistic ?? r.status);

  const setStage = async (status: Status) => {
    setOptimistic(status);
    await patchRequest(r.id, { action: "set", status });
  };
  const step = (by: number) => {
    const next = ALL_STAGES[Math.min(ALL_STAGES.length - 1, Math.max(0, i + by))];
    if (next !== r.status) setStage(next);
  };

  // Play: start from the beginning, then a stage every 2.5s, stop at the end.
  useEffect(() => {
    if (!playing) return;
    if (i >= ALL_STAGES.length - 1) {
      const t = setTimeout(() => setPlaying(false), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage(ALL_STAGES[i + 1]), 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, i]);

  // ← / → to step
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="fixed top-16 left-4 z-50 flex w-52 flex-col gap-2 rounded-xl border bg-background/95 p-3 text-xs shadow-sm backdrop-blur max-sm:hidden">
      <p className="font-medium text-muted-foreground">Demo · guest journey</p>
      <p dir="auto" className="truncate text-muted-foreground">{r.text}</p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" aria-label="Previous stage" disabled={i === 0} onClick={() => step(-1)}>
          <ChevronLeftIcon />
        </Button>
        <span className="flex-1 text-center font-medium">
          {i + 1}/{ALL_STAGES.length} · {STAGE_LABEL[ALL_STAGES[i]]}
        </span>
        <Button variant="outline" size="icon-sm" aria-label="Next stage" disabled={i === ALL_STAGES.length - 1} onClick={() => step(1)}>
          <ChevronRightIcon />
        </Button>
      </div>
      <div className="flex gap-1">
        {ALL_STAGES.map((s, k) => (
          <button
            key={s}
            aria-label={`Go to ${STAGE_LABEL[s]}`}
            onClick={() => setStage(s)}
            className={cn("h-1.5 flex-1 rounded-full", k <= i ? "bg-orchid" : "bg-muted hover:bg-input")}
          />
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          if (playing) return setPlaying(false);
          if (i !== 0) await setStage("received");
          setPlaying(true);
        }}
      >
        {playing ? <PauseIcon /> : <PlayIcon />} {playing ? "Pause" : "Play from start"}
      </Button>
      <p className="text-muted-foreground">
        <kbd className="rounded-sm border px-1">←</kbd> <kbd className="rounded-sm border px-1">→</kbd> to step
      </p>
    </div>
  );
}

/* ---------------- Stage illustrations (2D, CSS + SVG) ---------------- */

function StageArt({ r }: { r: GuestRequest }) {
  const Icon = DEPT_ICON[r.category];
  const name = STAFF[r.category];
  return <div key={r.status} className="relative flex h-40 items-center justify-center overflow-hidden rounded-xl bg-orchid-tint">
    {r.status === "received" && <ReceivedArt />}
    {r.status === "assigned" && <div className="flex items-center gap-4"><AssignedArt /><div className="flex flex-col gap-1.5"><span className="rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm">{name}</span><span className="flex items-center gap-1.5 rounded-md bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm"><Icon className="size-3.5" /> {r.category}</span></div></div>}
    {r.status === "on_the_way" && <div className="w-full px-10"><OnTheWayArt className="mx-auto h-[120px] w-full" /><div className="flex justify-between text-xs text-muted-foreground"><span>{r.category}</span><span>Room {r.room}</span></div></div>}
    {r.status === "fixed" && <FixedArt />}
    {r.status === "confirmed" && <><Confetti /><ConfirmedArt /></>}
  </div>;
}

// A one-off burst. Deterministic pieces so it renders the same every time.
const PIECES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  dx: `${((i * 53) % 80) - 40}px`,
  delay: `${(i % 7) * 0.06}s`,
  color: ["var(--mews-orchid)", "var(--mews-pink)", "var(--mews-yellow)", "var(--mews-dot-green)", "var(--mews-black)"][i % 5],
  w: 6 + (i % 3) * 2,
}));

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="gr-confetti absolute top-0 rounded-[2px]"
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.w * 0.6,
              background: p.color,
              animationDelay: p.delay,
              "--dx": p.dx,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
