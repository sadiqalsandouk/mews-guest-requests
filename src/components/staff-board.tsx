"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ViewTimelineIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, LanguageIcon, ViewListIcon, FilterIcon, LoggedByDeskIcon, RepeatIssueIcon, SearchIcon, TimeLimitIcon, AssignIcon, ClearIcon } from "@/components/icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OPEN_SEARCH_EVENT } from "@/components/command-palette";
import { MewsWordmark } from "@/components/mews-logo";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { RequestTimeline } from "@/components/request-timeline";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { RequestModal } from "@/components/request-modal";
import { NewRequestAlerts, useNewRequestAlerts } from "@/components/new-request-alerts";
import { HotelMenu } from "@/components/hotel-menu";
import {
  DAY,
  isOverdue,
  isRepeat,
  needsFollowUp,
  minutesAgo,
  stepIndex,
  type Category,
  type GuestRequest,
} from "@/lib/requests";
import { useNow } from "@/lib/use-now";
import { statusOf } from "@/lib/status";
import { sendAction, useLive } from "@/lib/use-live";
import { cn } from "@/lib/utils";


// Monday 00:00 of the week `offset` weeks from now.
function startOfWeek(now: number, offset: number) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return d.getTime();
}

function formatRange(from: number, to: number) {
  const f = (t: number, month: boolean) =>
    new Date(t).toLocaleDateString([], month ? { day: "numeric", month: "short" } : { day: "numeric" });
  const sameMonth = new Date(from).getMonth() === new Date(to).getMonth();
  return `${f(from, !sameMonth)} – ${f(to, true)}`;
}


type Tab = "all" | "open" | "attention" | "closed";
const TABS: { key: Tab; label: string; match: (r: GuestRequest, now: number) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "open", label: "Open", match: (r) => r.status !== "confirmed" },
  {
    key: "attention",
    label: "Needs attention",
    // Late/reopened, or closed with a low guest rating nobody has followed up yet.
    match: (r, now) => (r.status !== "confirmed" && (!!r.reopened || isOverdue(r, now))) || needsFollowUp(r),
  },
  { key: "closed", label: "Closed", match: (r) => r.status === "confirmed" },
];

const DEPARTMENTS: Category[] = ["Maintenance", "Housekeeping", "Front desk"];

export function StaffBoard({ fullScreen = false }: { fullScreen?: boolean }) {
  const { data: requests, refresh } = useLive<GuestRequest[]>("/api/requests");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("open");
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<Category | null>(null);
  const [view, setView] = useState<"list" | "timeline">("list");
  // Week navigation: 0 = this week. `dir` drives the slide direction.
  const [weekOffset, setWeekOffset] = useState(0);
  const [dir, setDir] = useState<"prev" | "next" | null>(null);
  const now = useNow();
  const { alerts, dismiss, newIds } = useNewRequestAlerts(requests);

  const goWeek = (to: number) => {
    setDir(to < weekOffset ? "prev" : "next");
    setWeekOffset(to);
    setTab(to === 0 ? "open" : "all");
  };

  // Opening a request works like Jira: a modal over the board, with the URL
  // (?request=ID) so Back closes it. Cmd-click opens the full page instead.
  const router = useRouter();
  const pick = (id: string) => {
    setSelectedId(id);
    router.push(`/staff?request=${id}`, { scroll: false });
  };
  const closeModal = () => router.push("/staff", { scroll: false });

  // Commands from the ⌘K search arrive as URL params (?open=, ?room=, ?new=…).
  // Applied once per change, during render, once data is in.
  const params = useSearchParams();
  const sig = params.toString();
  const [appliedSig, setAppliedSig] = useState("");
  const [prefill, setPrefill] = useState<{ room?: string; note?: string; nonce: string } | null>(null);
  if (requests && now !== null && sig !== appliedSig) {
    setAppliedSig(sig);
    const get = (k: string) => params.get(k) ?? undefined;
    const target = get("open") && requests.find((r) => r.id === get("open"));
    if (target) {
      const off = Math.round((startOfWeek(target.createdAt, 0) - startOfWeek(now, 0)) / (7 * DAY));
      setWeekOffset(off);
      setDir(null);
      setQuery("");
      setDept(null);
      setTab(off === 0 && target.status !== "confirmed" ? "open" : "all");
      setSelectedId(target.id);
    }
    if (get("new")) {
      setPrefill({ room: get("room"), note: get("note"), nonce: sig });
    } else if (get("room")) {
      setQuery(get("room")!);
      setTab("all");
      setDept(null);
    }
    const tabParam = get("tab") as Tab | undefined;
    if (tabParam && TABS.some((t) => t.key === tabParam)) setTab(tabParam);
    const deptParam = get("dept") as Category | undefined;
    if (deptParam && DEPARTMENTS.includes(deptParam)) setDept(deptParam);
    const viewParam = get("view");
    if (viewParam === "list" || viewParam === "timeline") setView(viewParam);
    const weekParam = get("week");
    if (weekParam !== undefined && !Number.isNaN(Number(weekParam))) {
      setDir(Number(weekParam) < weekOffset ? "prev" : "next");
      setWeekOffset(Number(weekParam));
    }
  }

  if (!requests || now === null) {
    return <div className="rounded-lg border bg-card p-6 text-muted-foreground">Loading requests…</div>;
  }

  const weekStart = startOfWeek(now, weekOffset);
  const weekEnd = weekStart + 7 * DAY;
  const weekLabel =
    weekOffset === 0 ? "This week" : weekOffset === -1 ? "Last week" : formatRange(weekStart, weekEnd - DAY);

  const q = query.trim().toLowerCase();
  const tabDef = TABS.find((t) => t.key === tab)!;
  const filtered = requests.filter(
    (r) =>
      (!dept || r.category === dept) &&
      (!q || (/^\d+$/.test(q) ? r.room === q : r.text.toLowerCase().includes(q))) &&
      // In the selected week, plus anything still open when viewing this week
      ((r.createdAt >= weekStart && r.createdAt < weekEnd) || (weekOffset === 0 && r.status !== "confirmed")),
  );
  const slide = dir && cn("animate-in fade-in duration-300 ease-out", dir === "next" ? "slide-in-from-right-8" : "slide-in-from-left-8");
  // The timeline shows the whole day; tabs only apply to the list.
  // Urgent open requests first; otherwise newest first (as the API sends them).
  const visible = (view === "timeline" ? filtered : filtered.filter((r) => tabDef.match(r, now))).sort(
    (a, b) => Number(!!b.urgent && b.status !== "confirmed") - Number(!!a.urgent && a.status !== "confirmed"),
  );
  const modalId = params.get("request");
  const modalReq = modalId ? requests.find((r) => r.id === modalId) : undefined;
  const selected = requests.find((r) => r.id === (modalId ?? selectedId));
  const openRooms = [...new Set(requests.filter((r) => r.status !== "confirmed").map((r) => r.room))];

  const open = requests.filter((r) => r.status !== "confirmed");
  const attention = requests.filter((r) => TABS[2].match(r, now));
  const newCount = open.filter((r) => r.status === "received").length;
  // The next request to hit its time limit (not yet overdue, not yet fixed).
  const nextDue = open
    .filter((r) => r.dueBy && r.dueBy > now && stepIndex(r.status) < stepIndex("fixed"))
    .sort((x, y) => x.dueBy! - y.dueBy!)[0];

  return (
    <section
      className={cn(
        "@container flex flex-col bg-card",
        fullScreen ? "min-h-screen" : "overflow-hidden rounded-xl border",
      )}
    >
      {/* Product top bar */}
      <div className={cn("flex items-center gap-3 border-b px-4 py-3", fullScreen && "sticky top-0 z-30 bg-card")}>
        <AppNav />
        <Link href="/" aria-label="Home" className="shrink-0">
          <MewsWordmark className="h-3.5 w-auto" />
        </Link>
        <span className="hidden text-sm text-muted-foreground lg:inline">Guest Requests</span>
        <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">Staff</span>
        {/* Opens the global ⌘K search */}
        <button
          onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
          className="ml-2 flex h-9 max-w-sm min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted px-3 text-sm text-muted-foreground hover:border-foreground/20"
        >
          <SearchIcon className="size-4 shrink-0" />
          <span className="truncate">Search or jump to…</span>
          <kbd className="ml-auto hidden rounded-sm border bg-background px-1.5 text-[10px] sm:inline">⌘K</kbd>
        </button>
        <HotelMenu />
      </div>

      <div className="flex flex-1 flex-col gap-5 bg-background p-4 @5xl:p-6">
        {/* Date + filters, like the PMS timeline toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week navigation, skipping a week at a time */}
          <div className="mr-2 flex items-center">
            <Button variant="ghost" size="icon-lg" aria-label="Previous week" onClick={() => goWeek(weekOffset - 1)}>
              <ChevronLeftIcon />
            </Button>
            <div className="w-36 overflow-hidden text-center font-semibold" aria-live="polite">
              <span key={weekOffset} className={cn("block whitespace-nowrap", slide)}>
                {weekLabel}
              </span>
            </div>
            <Button variant="ghost" size="icon-lg" aria-label="Next week" onClick={() => goWeek(weekOffset + 1)}>
              <ChevronRightIcon />
            </Button>
            {weekOffset !== 0 && (
              <Button variant="outline" size="sm" className="ml-1" onClick={() => goWeek(0)}>
                Today
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="lg"
            className={cn(!dept && "text-muted-foreground")}
            onClick={() => setDept(DEPARTMENTS[(dept ? DEPARTMENTS.indexOf(dept) : -1) + 1] ?? null)}
          >
            <FilterIcon /> {dept ?? "All departments"} <ChevronDownIcon />
          </Button>
          {/* List / timeline switch */}
          <div className="flex rounded-md border p-0.5" role="group" aria-label="View">
            {([
              ["list", ViewListIcon, "List"],
              ["timeline", ViewTimelineIcon, "Timeline"],
            ] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-sm px-2.5 text-sm",
                  view === key ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" /> <span className="max-sm:sr-only">{label}</span>
              </button>
            ))}
          </div>
          {query && (
            <span className="flex h-8 items-center gap-1 rounded-md border bg-orchid-tint pr-1 pl-2.5 text-sm">
              {/^\d+$/.test(query) ? `Room ${query}` : `“${query}”`}
              <button aria-label="Clear filter" onClick={() => setQuery("")} className="rounded-sm p-0.5 hover:bg-background">
                <ClearIcon className="size-3.5" />
              </button>
            </span>
          )}
          <div className="ml-auto">
            <NewRequestDialog
              prefill={prefill}
              rooms={openRooms}
              onCreated={(id) => {
                setSelectedId(id);
                setTab("open");
                refresh();
              }}
            />
          </div>
        </div>

        {/* One-line summary: what's open, what needs attention, what's due next */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm">
          <button
            onClick={() => {
              goWeek(0);
              setTab("open");
            }}
            className="flex items-baseline gap-1.5 hover:underline"
          >
            <span className="text-xl font-semibold tabular-nums">{open.length}</span> open
          </button>
          <span className="h-5 w-px bg-border" aria-hidden />
          <button
            onClick={() => {
              goWeek(0);
              setTab("attention");
            }}
            className={cn("flex items-baseline gap-1.5 hover:underline", attention.length > 0 && "text-dot-red")}
          >
            <span className="text-xl font-semibold tabular-nums">{attention.length}</span> need attention
          </button>
          {nextDue && (
            <>
              <span className="h-5 w-px bg-border" aria-hidden />
              <button
                onClick={() => {
                  goWeek(0);
                  pick(nextDue.id);
                }}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <TimeLimitIcon className="size-4" /> Next due:
                <span className="font-medium text-foreground">Room {nextDue.room}</span>
                in {Math.max(1, Math.ceil((nextDue.dueBy! - now) / 60_000))} min
              </button>
            </>
          )}
          {newCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={async () => {
                await Promise.all(open.filter((r) => r.status === "received").map((r) => sendAction(r.id, "advance")));
                refresh();
              }}
            >
              <AssignIcon /> Assign {newCount} new
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-5">
        <div key={weekOffset} className={cn("@container/list flex min-w-0 flex-col gap-5", slide)}>
        {view === "timeline" ? (
          <RequestTimeline
            requests={visible}
            allRequests={requests}
            weekStart={weekStart}
            now={now}
            selectedId={selected?.id}
            onSelect={pick}
          />
        ) : (
        <>
        {/* Tabs with the pink underline */}
        <div role="tablist" className="flex gap-5 border-b">
          {TABS.map((t) => {
            const count = filtered.filter((r) => t.match(r, now)).length;
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  "-mb-px border-b-2 pb-2 text-sm transition-colors",
                  active ? "border-orchid font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label} <span className="text-muted-foreground">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Request list */}
        <div className="overflow-hidden rounded-lg border">
          <div className="hidden grid-cols-[80px_1fr_180px] gap-3 border-b bg-muted px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground @xl/list:grid">
            <span>Room</span>
            <span>Request</span>
            <span>Status</span>
          </div>
          {visible.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">Nothing here.</p>
          )}
          {visible.map((r) => {
            const s = statusOf(r, now);
            const isSel = r.id === selected?.id;
            return (
              <Link
                key={r.id}
                href={`/staff/requests/${r.id}`}
                onClick={(e) => {
                  // Cmd/Ctrl/Shift-click or middle-click: let the browser open the full page.
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  pick(r.id);
                }}
                className={cn(
                  "relative grid w-full grid-cols-[64px_1fr] items-center gap-3 border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-muted/60 @xl/list:grid-cols-[80px_1fr_180px]",
                  isSel && "bg-orchid-tint hover:bg-orchid-tint",
                  newIds.has(r.id) && "animate-pulse bg-orchid-tint",
                )}
              >
                {/* Accent bar, like a reservation block on the timeline */}
                <span
                  aria-hidden
                  className={cn("absolute inset-y-2 left-0 w-1 rounded-r", isSel || r.status === "received" ? "bg-orchid" : "bg-transparent")}
                />
                <span className="flex items-center gap-2 font-medium">
                  <span className={cn("size-2 rounded-full", s.dot)} aria-hidden />
                  {r.room}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span dir="auto" className="truncate font-medium">{r.text}</span>
                    {(r.safety || (r.urgent && r.status !== "confirmed")) && (
                      <Badge className="shrink-0 bg-dot-red text-white">{r.safety ? "Safety" : "Urgent"}</Badge>
                    )}
                  </span>
                  {/* Quiet second line: department, age, and small icons instead of labels */}
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {r.category} · {minutesAgo(r, now)}m ago
                      {r.assignee && <> · {r.assignee.split(" · ")[0]}</>}
                    </span>
                    <span className="@xl/list:hidden">· {statusOf(r, now).label}</span>
                    {r.original && <LanguageIcon className="size-3.5" title={`Translated from ${r.original.lang}`} />}
                    {r.source === "staff" && <LoggedByDeskIcon className="size-3.5" title="Logged at the desk" />}
                    {isRepeat(r, requests) && <RepeatIssueIcon className="size-3.5" title="Repeat problem in this room" />}
                  </span>
                </span>
                <span className="hidden items-center gap-2 @xl/list:flex">
                  <span className={cn("size-2 rounded-full", s.dot)} aria-hidden />
                  {s.label}
                </span>
              </Link>
            );
          })}
        </div>
        </>
        )}
        </div>

        </div>
      </div>
      <p className="bg-background px-4 pb-4 text-center text-xs text-muted-foreground">
        Concept prototype · not an official Mews product · mock data
      </p>
      <NewRequestAlerts alerts={alerts} onOpen={pick} onDismiss={dismiss} />
      {modalReq && <RequestModal r={modalReq} all={requests} now={now} onClose={closeModal} onChange={refresh} />}
    </section>
  );
}



