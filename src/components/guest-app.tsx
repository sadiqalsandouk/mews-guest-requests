"use client";

import { TowelsIcon, PillowsIcon, RoomCleaningIcon, SomethingBrokenIcon, ToiletriesIcon, DrinksIcon, ShowerWaterIcon, HeatingAcIcon, TvWifiIcon, LateCheckoutIcon, TaxiIcon, LuggageIcon, ReceivedArt, AssignedArt, OnTheWayArt, FixedArt, ConfirmedArt } from "@/components/icons";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TranslatedIcon, ChevronDownIcon, LoggedByDeskIcon, DeptHousekeepingIcon, StatusReceivedIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, DeptFrontDeskIcon, RoomDoorIcon, PauseIcon, PlayIcon, RatingIcon, DeptMaintenanceIcon } from "@/components/icons";

import { useIsTopWindow } from "@/components/demo-exit";
import { MewsWordmark } from "@/components/mews-logo";
import { Button } from "@/components/ui/button";
import { VoiceTextarea } from "@/components/voice-input";
import { useCanRecord } from "@/lib/use-recorder";
import { HotelBrand } from "@/components/hotel-logo";
import { DICTS, LANGS, LangContext, isRtl, setLang, useL, useLang, type Lang } from "@/lib/guest-i18n";
import { OPTIONS, type OptionId } from "@/lib/options";
import { BAD_TAGS, GOOD_TAGS, canRate, TIP_AMOUNTS, staffName, stepIndex, type Category, type GuestRequest, type Status } from "@/lib/requests";
import { patchRequest, sendAction, useLive } from "@/lib/use-live";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

// One icon per option (the options themselves live in lib/options.ts).
const OPTION_ICON: Record<OptionId, typeof TowelsIcon> = {
  towels: TowelsIcon, pillows: PillowsIcon, toiletries: ToiletriesIcon, drinks: DrinksIcon, cleaning: RoomCleaningIcon,
  hotWater: ShowerWaterIcon, temperature: HeatingAcIcon, tvWifi: TvWifiIcon, broken: SomethingBrokenIcon,
  lateCheckout: LateCheckoutIcon, taxi: TaxiIcon, luggage: LuggageIcon,
};
// The tile groups, in the order shown.
const GROUPS = [{ name: "For your room" }, { name: "Something's not working" }, { name: "Front desk" }] as const;
const DEPT_ICON: Record<Category, typeof DeptMaintenanceIcon> = {
  Maintenance: DeptMaintenanceIcon,
  Housekeeping: DeptHousekeepingIcon,
  "Front desk": DeptFrontDeskIcon,
};
// Guest-only API: the server only ever returns this guest's room.
const API = "/api/guest/requests";
type Guest = { room: string; surname: string };

// The 4 segments of the progress bar (confirmed = all done).
const SEGMENTS: Status[] = ["received", "assigned", "on_the_way", "fixed"];

// Guests always see their request in their own words; staff see the English.
const guestText = (r: GuestRequest) => r.original?.text ?? r.text;

const time = (t?: number) => (t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

// Headline + subline for each stage, written for the guest.
function stageCopy(r: GuestRequest, L: ReturnType<typeof useL>) {
  const name = staffName(r);
  if (r.reopened && r.status !== "confirmed" && r.status !== "fixed")
    return { title: L.sendingBack(name), sub: L.notSortedYet };
  switch (r.status) {
    case "received":
      return { title: L.receivedTitle, sub: L.receivedSub };
    case "assigned":
      return { title: L.onIt(name), sub: L.hasIt(name, L.cat[r.category]) };
    case "on_the_way":
      return { title: L.onTheWayTitle(name), sub: L.heading(r.room) };
    case "fixed":
      return r.guestConfirmedAt
        ? { title: L.thanksChecking, sub: L.gladSorted }
        : { title: L.markedFixed, sub: L.checkAllGood };
    case "confirmed":
      return { title: L.allSorted, sub: L.enjoyStay };
  }
}

export function GuestApp() {
  // undefined = still checking, null = not signed in.
  const [guest, setGuest] = useState<Guest | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    // Guests stay signed in for their stay. For the demo only, /guest?signout
    // switches guest on this device (a hidden link, not shown in the app).
    const signOut = new URLSearchParams(window.location.search).has("signout");
    (signOut
      ? fetch("/api/guest/session", { method: "DELETE" }).then(() => window.history.replaceState(null, "", "/guest"))
      : Promise.resolve()
    )
      .then(() => fetch("/api/guest/session", { cache: "no-store" }))
      .then((res) => (res.ok ? res.json() : null))
      .then((g) => alive && setGuest(g))
      .catch(() => alive && setGuest(null));
    return () => {
      alive = false;
    };
  }, []);

  const lang = useLang();
  return (
    // The guest's language for every word on screen; Arabic reads right to left.
    <LangContext.Provider value={DICTS[lang]}>
      <div lang={lang} dir={isRtl(lang) ? "rtl" : "ltr"} className="flex h-full min-h-0 flex-1 flex-col">
        {guest === undefined ? (
          <p className="px-5 py-5 text-muted-foreground">{DICTS[lang].loading}</p>
        ) : !guest ? (
          <SignIn onSignedIn={setGuest} />
        ) : (
          <SignedInApp
            key={guest.room}
            guest={guest}
          />
        )}
      </div>
    </LangContext.Provider>
  );
}

// Top right on every guest screen: the app in the guest's own language.
function LangPicker() {
  const lang = useLang();
  const L = useL();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={L.language}
        className="flex h-8 items-center gap-1.5 rounded-full border bg-background ps-2 pe-1.5 text-xs font-semibold uppercase hover:bg-muted"
      >
        <span className="text-base leading-none" aria-hidden>
          {current.flag}
        </span>
        {current.code}
        <ChevronDownIcon className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <ul
            role="listbox"
            aria-label={L.language}
            className="absolute end-0 top-10 z-50 w-44 animate-in overflow-hidden rounded-xl border bg-background p-1 shadow-lg duration-150 fade-in zoom-in-95"
          >
            {LANGS.map((l) => (
              <li key={l.code}>
                <button
                  role="option"
                  aria-selected={l.code === lang}
                  onClick={() => {
                    setLang(l.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm hover:bg-muted",
                    l.code === lang && "bg-muted font-medium",
                  )}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {l.flag}
                  </span>
                  <span className="flex-1">{l.name}</span>
                  {l.code === lang && <CheckIcon className="size-4 text-orchid" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ---------------- Sign-in: surname + room, like hotel Wi-Fi ---------------- */

function SignIn({ onSignedIn }: { onSignedIn: (g: Guest) => void }) {
  const L = useL();
  const [surname, setSurname] = useState("");
  const [room, setRoom] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    const res = await fetch("/api/guest/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surname, room }),
    });
    setSending(false);
    if (res.ok) onSignedIn(await res.json());
    else setError(res.status === 404 ? L.notFound : res.status === 400 ? L.enterBoth : L.genericError);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b px-5 py-3">
        <HotelBrand sub={L.guestRequests} />
        <LangPicker />
      </header>
      <form onSubmit={submit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{L.welcome}</h1>
          <p className="mt-1 text-muted-foreground">{L.signInSub}</p>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {L.surname}
          <input
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            autoComplete="family-name"
            autoCapitalize="words"
            required
            className="h-12 rounded-md border bg-card px-3 text-base font-normal"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {L.roomNumber}
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            pattern="[0-9]*"
            required
            className="h-12 rounded-md border bg-card px-3 text-base font-normal"
          />
        </label>
        {error && <p className="text-sm text-dot-red">{error}</p>}
        <Button type="submit" size="lg" className="h-12" disabled={sending || !surname.trim() || !room}>
          {sending ? L.signingIn : L.continue}
        </Button>
      </form>
      <footer className="flex shrink-0 flex-col items-center gap-0.5 border-t py-2 text-xs text-muted-foreground [@container(max-height:700px)]:flex-row [@container(max-height:700px)]:justify-center [@container(max-height:700px)]:gap-2 [@container(max-height:700px)]:py-1.5">
        <span className="flex items-center gap-1.5">
          Powered by <MewsWordmark className="h-2 w-auto" />
        </span>
        <span className="text-[10px] opacity-80">Concept prototype · not an official Mews product</span>
      </footer>
    </div>
  );
}

function SignedInApp({ guest }: { guest: Guest }) {
  const L = useL();
  const params = useSearchParams();
  const router = useRouter();
  const room = guest.room;
  const id = params.get("id");

  const go = (nextId: string | null) => router.replace(nextId ? `?id=${nextId}` : "?");

  // Review prompt: opens by itself once the guest says it's fixed (or staff
  // close it) within the last hour, if not yet rated and not "Not now".
  const { data: all } = useLive<GuestRequest[]>(API, 2000);
  const now = useNow(15_000);
  const [sheet, setSheet] = useState<{ id: string; stars: number } | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const doneAt = (r: GuestRequest) => r.guestConfirmedAt ?? r.closedAt ?? 0;
  const promptKey = (r: GuestRequest) => `${r.id}:${doneAt(r)}`;
  const due = (all ?? [])
    .filter(
      (r) =>
        r.room === room &&
        canRate(r) &&
        !r.rating &&
        now !== null &&
        now - doneAt(r) < 3_600_000 &&
        !skipped.includes(promptKey(r)),
    )
    .sort((a, b) => doneAt(b) - doneAt(a))[0];
  if (!sheet && due) setSheet({ id: due.id, stars: 0 });
  const sheetReq = sheet && (all ?? []).find((r) => r.id === sheet.id);
  const rate: RateFn = (rid, stars) => setSheet({ id: rid, stars });
  const closeSheet = () => {
    if (sheetReq) setSkipped((s) => [...s, promptKey(sheetReq)]);
    setSheet(null);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col bg-background">
      <header className="flex shrink-0 items-center gap-2 border-b px-5 py-3 [@container(max-height:700px)]:py-2">
        {id && (
          // Round back button, iOS style, before the hotel's logo
          <button
            onClick={() => go(null)}
            aria-label={L.home}
            title={L.home}
            className="-ms-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-accent active:scale-95"
          >
            <ChevronLeftIcon className="size-5 rtl:rotate-180" />
          </button>
        )}
        <HotelBrand
          sub={
            <span className="flex items-center gap-1.5">
              <RoomDoorIcon className="size-3.5" aria-hidden /> {L.room(room)} · {guest.surname}
            </span>
          }
        />
        <div className="ms-auto">
          <LangPicker />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {id ? <Tracker id={id} onRate={rate} /> : <Home room={room} onOpen={go} />}
      </div>
      {sheetReq && <RatingSheet key={`${sheetReq.id}-${sheet!.stars}`} r={sheetReq} initial={sheet!.stars} onClose={closeSheet} />}
      <DemoStepper room={room} id={id} />
      {/* The hotel's brand leads on guest pages; Mews signs off quietly. */}
      <footer className="flex shrink-0 flex-col items-center gap-0.5 border-t py-2 text-xs text-muted-foreground [@container(max-height:700px)]:flex-row [@container(max-height:700px)]:justify-center [@container(max-height:700px)]:gap-2 [@container(max-height:700px)]:py-1.5">
        <span className="flex items-center gap-1.5">
          Powered by <MewsWordmark className="h-2 w-auto" />
        </span>
        <span className="text-[10px] opacity-80">Concept prototype · not an official Mews product</span>
      </footer>
    </div>
  );
}

/* ---------------- Home: live status cards + new request ---------------- */

function Home({ room, onOpen }: { room: string; onOpen: (id: string | null) => void }) {
  const L = useL();
  const canRecord = useCanRecord();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  // What the decision model ticked from the guest's words, and what the guest
  // tapped themselves. A tap always wins over the model.
  const [suggested, setSuggested] = useState<OptionId[]>([]);
  const [english, setEnglish] = useState<string | null>(null);
  const [tapped, setTapped] = useState<Partial<Record<OptionId, boolean>>>({});
  const [thinking, setThinking] = useState(false);
  const { data: all } = useLive<GuestRequest[]>(API, 2000);
  const now = useNow(15_000);
  // Open requests, plus ones closed in the last hour (so "All sorted" lingers briefly).
  const mine = (all ?? []).filter(
    (r) => r.room === room && (r.status !== "confirmed" || (now !== null && now - (r.closedAt ?? 0) < 3_600_000)),
  );

  // Ask the decision model which options the words match, once typing pauses.
  useEffect(() => {
    const words = text.trim();
    let stale = false;
    const t = setTimeout(async () => {
      if (words.length < 3) {
        setSuggested([]);
        setEnglish(null);
        return;
      }
      setThinking(true);
      try {
        const res = await fetch("/api/guest/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: words }),
        });
        const { options, english } = await res.json();
        if (!stale) {
          setSuggested(Array.isArray(options) ? options : []);
          setEnglish(typeof english === "string" && english ? english : null);
        }
      } catch {
        // Suggestions are a nicety: never get in the guest's way.
      } finally {
        if (!stale) setThinking(false);
      }
    }, 450);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [text]);

  const isOn = (id: OptionId) => tapped[id] ?? suggested.includes(id);
  const selected = OPTIONS.filter((o) => isOn(o.id));
  const fromWords = !!text.trim() && selected.some((o) => tapped[o.id] === undefined);
  const toggle = (id: OptionId) => setTapped((t) => ({ ...t, [id]: !isOn(id) }));

  const submit = async () => {
    if (!text.trim() && !selected.length) return;
    setSending(true);
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The server takes the room from the sign-in.
      body: JSON.stringify({
        text,
        options: selected.map((o) => o.id),
        // Ticked from the words (not tapped): the words belong with these.
        fromWords: selected.filter((o) => tapped[o.id] === undefined).map((o) => o.id),
      }),
    });
    setSending(false);
    if (!res.ok) return;
    const { ids } = await res.json();
    setText("");
    setSuggested([]);
    setEnglish(null);
    setTapped({});
    // One request: show its tracker. Several (one per team): show them all here.
    onOpen(ids.length === 1 ? ids[0] : null);
  };

  return (
    // One screen, no scrolling: the newest live request, the words box,
    // then one row of tiles per group, and Send.
    <div className="flex flex-1 flex-col gap-3 px-5 py-4 [@container(max-height:700px)]:gap-2 [@container(max-height:700px)]:py-2.5">
      {mine.length > 0 && (
        <section aria-label="Your requests" className="flex flex-col gap-2">
          {/* The newest one; the rest are a tap away on its tracker's Home. */}
          <StatusCard r={mine[0]} onOpen={() => onOpen(mine[0].id)} />
          {mine.length > 1 && (
            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              {mine.slice(1).map((r) => (
                <button key={r.id} onClick={() => onOpen(r.id)} className="max-w-full truncate underline-offset-2 hover:underline">
                  {stageCopy(r, L).title}: {guestText(r)}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight [@container(max-height:700px)]:text-xl">{mine.length ? L.anythingElse : L.howCanWeHelp}</h1>
        <VoiceTextarea
          id="req"
          value={text}
          onChange={setText}
          // Guests see their own words; the server translates for staff on send.
          onVoice={(r) => setText(r.transcript)}
          placeholder={canRecord ? L.placeholderMic : L.placeholder}
          rows={2}
          // Short screens: one line, so everything still fits without scrolling
          className="[@container(max-height:700px)]:[&_textarea]:h-11 [@container(max-height:700px)]:[&_textarea]:py-2.5"
        />
        {english && text.trim() && (
          // What the team will read: the guest's words, in English
          <p className="gr-rise flex items-start gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs">
            <TranslatedIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span>
              <span className="text-muted-foreground">{L.inEnglish}</span> <span dir="ltr">{english}</span>
            </span>
          </p>
        )}
        <p className="h-4 text-xs text-muted-foreground" aria-live="polite">
          {thinking ? L.reading : fromWords ? L.ticked : L.orTap}
        </p>
      </section>

      {/* Tiles grow with the screen: compact on a small phone, roomier on a
          tall one, so there's no dead space above Send on any device. */}
      <section aria-label="What you need" className="flex min-h-0 flex-1 flex-col gap-[clamp(8px,1.8cqh,18px)]">
        {GROUPS.map(({ name }) => {
          const items = OPTIONS.filter((o) => o.group === name);
          return (
            <div key={name} className="flex max-h-[150px] min-h-0 flex-1 flex-col gap-1.5">
              <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{L.groups[name]}</h2>
              <div
                className="grid min-h-[46px] flex-1 gap-1.5"
                style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
              >
                {items.map((o) => {
                  const Icon = OPTION_ICON[o.id];
                  const on = isOn(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggle(o.id)}
                      aria-pressed={on}
                      aria-label={o.label}
                      className={cn(
                        "relative flex h-full flex-col items-center justify-center gap-[clamp(3px,0.8cqh,8px)] rounded-xl border px-1 text-center text-[clamp(11px,1.5cqh,13px)] leading-tight transition-colors",
                        on ? "border-orchid bg-orchid-tint font-medium" : "border-input bg-card hover:bg-accent",
                      )}
                    >
                      {on && (
                        <span className="gr-pop absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-orchid text-white">
                          <CheckIcon className="size-2.5" />
                        </span>
                      )}
                      <Icon className="size-[clamp(18px,3.2cqh,30px)] shrink-0" />
                      <span className="line-clamp-2 w-full text-balance">{L.tiles[o.id]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      <Button size="lg" className="mt-auto h-11 w-full shrink-0 text-base" disabled={(!text.trim() && !selected.length) || sending} onClick={submit}>
        {sending ? L.sending : selected.length > 1 ? L.sendItems(selected.length) : L.send}
      </Button>
      <p className="-mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <LoggedByDeskIcon className="size-3.5" aria-hidden /> {L.dialBefore} <b className="text-foreground">0</b> {L.dialAfter}
      </p>
    </div>
  );
}

// Slim live card, like the pinned order tracker in Uber Eats. Rating is
// prompted separately (the sheet pops up), so the card stays one line.
function StatusCard({ r, onOpen }: { r: GuestRequest; onOpen: () => void }) {
  const L = useL();
  const copy = stageCopy(r, L);
  const Icon = DEPT_ICON[r.category];
  const done = r.status === "confirmed";
  return (
    <button
      onClick={onOpen}
      className="gr-rise relative flex w-full flex-col gap-2 overflow-hidden rounded-lg border bg-card p-3 pl-4 text-left shadow-xs transition-shadow hover:shadow-md"
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", done ? "bg-dot-green" : "bg-orchid")} aria-hidden />
      <span className="flex items-center gap-3">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", done ? "bg-status-done" : "bg-orchid-tint")}>
          {done ? <CheckIcon className="gr-pop size-4 text-dot-green" /> : <Icon className={cn("size-4", r.status === "on_the_way" && "gr-float")} />}
        </span>
        <span className="min-w-0 flex-1">
          <span key={r.status} className="gr-rise block truncate text-sm font-semibold">{copy.title}</span>
          <span dir="auto" className="block truncate text-xs text-muted-foreground">{guestText(r)}</span>
          {r.original && (
            // What the team sees, in English
            <span className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <TranslatedIcon className="size-3 shrink-0" /> <span dir="ltr" className="truncate">{r.text}</span>
            </span>
          )}
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
      </span>
      <ProgressBar r={r} />
    </button>
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
  const L = useL();
  const { data: r, refresh, missing } = useLive<GuestRequest>(`${API}/${id}`, 1500);
  const now = useNow(15_000);

  // Staff deleted it (a duplicate or a mistake): say so rather than show old data.
  if (missing)
    return (
      <div className="px-5 py-5">
        <h1 className="text-2xl font-semibold tracking-tight">{L.removedTitle}</h1>
        <p className="mt-1 text-muted-foreground">{L.removedSub}</p>
      </div>
    );
  if (!r) return <p className="px-5 py-5 text-muted-foreground">{L.loading}</p>;

  const copy = stageCopy(r, L);
  const done = r.status === "confirmed";
  const answer = async (action: "guestConfirm" | "reopen") => {
    await sendAction(r.id, action, API);
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
          <p className="font-semibold">{L.dangerTitle}</p>
          <p className="text-sm text-muted-foreground">{L.dangerSub}</p>
        </div>
      )}

      <ProgressBar r={r} large />

      {!done && r.status !== "fixed" && r.dueBy && (
        <p className="text-sm">
          {late ? (
            <span className="text-dot-red">{L.takingLonger}</span>
          ) : (
            <>
              <span className="text-muted-foreground">{L.aimBy} </span>
              <span className="font-semibold tabular-nums">{time(r.dueBy)}</span>
            </>
          )}
        </p>
      )}

      {r.status === "fixed" && !r.guestConfirmedAt && (
        // The guest's answer goes to the team; staff close the request.
        <div className="gr-pop rounded-lg border bg-orchid-tint p-4">
          <p className="mb-3 font-semibold">{L.isItFixed}</p>
          <div className="flex gap-2">
            <Button size="lg" className="flex-1" onClick={() => answer("guestConfirm")}>
              {L.yesAllGood}
            </Button>
            <Button variant="outline" size="lg" className="flex-1 bg-background" onClick={() => answer("reopen")}>
              {L.notYet}
            </Button>
          </div>
        </div>
      )}

      {canRate(r) && <RateInline r={r} onRate={onRate} />}

      {/* Request + who has it */}
      <div className="flex items-center gap-3 rounded-lg border p-3">
        {stepIndex(r.status) >= 1 ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
            {staffName(r)[0]}
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
                {L.sentInEnglish} <span dir="ltr" className="text-foreground">“{r.text}”</span>
              </span>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {stepIndex(r.status) >= 1 ? `${staffName(r)} · ${L.cat[r.category]}` : L.cat[r.category]}
            {r.source === "staff" && ` · ${L.loggedByDesk}`}
          </p>
        </div>
      </div>

      {/* Step log with times */}
      <ol className="flex flex-col gap-2.5 text-sm">
        {(["received", "assigned", "on_the_way", "fixed", "confirmed"] as Status[]).map((s) => {
          const at = r.stepAt?.[s] ?? (s === "received" ? r.createdAt : undefined);
          const reached = stepIndex(r.status) >= stepIndex(s);
          const label = {
            received: L.stepReceived,
            assigned: L.stepPassed(staffName(r)),
            on_the_way: L.stepOnTheWay,
            fixed: L.stepFixed,
            confirmed: L.stepClosed,
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
  const L = useL();
  const name = staffName(r);
  if (r.rating) {
    return (
      <div className="gr-rise flex flex-col gap-1 rounded-lg border p-4">
        <Stars value={r.rating} />
        <p className="mt-1 font-medium">{L.thanksRating(name)}</p>
        <p className="text-sm text-muted-foreground">
          {r.rating <= 3 ? L.sorryDM : L.passedOn(name)}
        </p>
      </div>
    );
  }
  return (
    <div className="gr-pop flex flex-col items-center gap-2 rounded-lg border bg-orchid-tint p-5 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-foreground text-lg font-semibold text-background">
        {name[0]}
      </span>
      <p className="font-semibold">{L.howWas(name)}</p>
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
  const L = useL();
  const name = staffName(r);
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
    await patchRequest(r.id, { action: "rate", rating: stars, comment, tags }, API);
    setPhase("thanks");
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
          className="relative max-h-full w-full animate-in overflow-y-auto rounded-2xl bg-background shadow-xl duration-200 fade-in zoom-in-95"
        >

        {phase === "thanks" ? (
          <div className="flex flex-col gap-5 px-6 pt-8 pb-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="gr-pop flex size-14 items-center justify-center rounded-full bg-dot-green text-white">
                <CheckIcon className="size-7" />
              </span>
              <p className="text-lg font-semibold">{L.thanksFeedback}</p>
              <p className="text-sm text-muted-foreground">
                {good ? L.willPass(name) : L.sorryDM}
              </p>
            </div>
            {good && <TipCard r={r} />}
            <Button variant="ghost" onClick={onClose}>
              {L.done}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 px-6 pt-6 pb-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="gr-pop flex size-14 items-center justify-center rounded-full bg-foreground text-xl font-semibold text-background">
                {name[0]}
              </span>
              <p className="text-xl font-semibold tracking-tight">{L.howWas(name)}</p>
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
              <p className="h-5 text-sm font-medium text-muted-foreground">{L.ratingWords[shown]}</p>
            </div>

            {stars > 0 && (
              <div key={good ? "good" : "bad"} className="gr-rise flex flex-col gap-3">
                <p className="text-sm font-medium">{good ? L.wentWell : L.wentWrong}</p>
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
                        {L.tags[t] ?? t}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  dir="auto"
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={good ? L.anythingToAdd : L.tellMore}
                  className="w-full resize-none rounded-md border border-input bg-background p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Button size="lg" className="h-11 text-base" disabled={!stars || phase === "sending"} onClick={submit}>
                {phase === "sending" ? L.sending : L.submit}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                {L.notNow}
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Tip: after a good rating ---------------- */

// Mock Apple Pay tip, for guests who want to tip but carry no cash. No money moves.
function TipCard({ r }: { r: GuestRequest }) {
  const L = useL();
  const name = staffName(r);
  const [amount, setAmount] = useState<number | null>(null);
  const [phase, setPhase] = useState<"pick" | "paying" | "sent">(r.tip ? "sent" : "pick");

  const pay = async () => {
    if (!amount) return;
    setPhase("paying");
    await new Promise((ok) => setTimeout(ok, 1200)); // stand-in for the Apple Pay sheet
    await patchRequest(r.id, { action: "tip", amount }, API);
    setPhase("sent");
  };

  if (phase === "sent") {
    return (
      <div className="gr-pop flex items-center gap-3 rounded-lg border bg-orchid-tint p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-dot-green text-white">
          <CheckIcon className="size-5" />
        </span>
        <p className="text-sm">
          <span className="font-semibold">{L.tipSent(amount ?? r.tip ?? 0, name)}</span> {L.thankYou}
        </p>
      </div>
    );
  }
  return (
    <div className="gr-rise flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <p className="font-semibold">{L.tipAsk(name)}</p>
        <p className="text-sm text-muted-foreground">{L.noCash}</p>
      </div>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tip amount">
        {TIP_AMOUNTS.map((a) => (
          <button
            key={a}
            role="radio"
            aria-checked={amount === a}
            onClick={() => setAmount(a)}
            disabled={phase === "paying"}
            className={cn(
              "h-11 rounded-md border text-base font-medium transition-colors",
              amount === a ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
            )}
          >
            £{a}
          </button>
        ))}
      </div>
      <button
        onClick={pay}
        disabled={!amount || phase === "paying"}
        className="flex h-11 items-center justify-center rounded-md bg-black text-base font-medium text-white transition-opacity disabled:opacity-40"
      >
        {phase === "paying" ? L.paying : L.payWith(amount ?? undefined)}
      </button>
      <p className="text-center text-xs text-muted-foreground">{L.demoNoMoney}</p>
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
  confirmed: "Closed",
};

// Demo-only control for presenting (hidden if the page is embedded in a frame).
// Changes the real request, so the staff board follows along.
function DemoStepper({ room, id }: { room: string; id: string | null }) {
  const show = useIsTopWindow();
  const { data: all } = useLive<GuestRequest[]>(show ? API : null, 1500);
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
    await patchRequest(r.id, { action: "set", status }, API);
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
    <div dir="ltr" lang="en" className="fixed top-16 left-4 z-50 flex w-52 flex-col gap-2 rounded-xl border bg-background/95 p-3 text-xs shadow-sm backdrop-blur max-sm:hidden">
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
  const name = staffName(r);
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
