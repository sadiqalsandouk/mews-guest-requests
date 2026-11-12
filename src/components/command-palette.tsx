"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  StatusOverdueIcon,
  ViewTimelineIcon,
  StatusClosedIcon,
  StatusOpenIcon,
  RoomDoorIcon,
  LastWeekIcon,
  RequestsBoardIcon,
  ViewListIcon,
  AddIcon,
  ResetDemoIcon,
  SearchIcon,
  SettingsIcon,
  GuestViewIcon,
  LogRequestIcon,
  TimeLimitIcon,
} from "@/components/icons";

import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CATEGORIES, isOverdue, ROOMS, STEPS, stepIndex, type GuestRequest } from "@/lib/requests";
import { useLive } from "@/lib/use-live";
import { cn } from "@/lib/utils";
import { Command as CommandPrimitive } from "cmdk";

export const OPEN_SEARCH_EVENT = "gr:open-search";

// Makes each command's URL unique, so running the same one twice still applies.
let commandSeq = 0;

type Item = {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  icon: typeof SearchIcon;
  iconClass?: string;
  run: () => void;
};

const tokens = (q: string) => q.toLowerCase().split(/\s+/).filter(Boolean);
const matchAll = (hay: string, q: string) => {
  const h = hay.toLowerCase();
  return tokens(q).every((t) => h.includes(t));
};
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function when(t: number) {
  const d = new Date(t);
  const today = new Date();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === today.toDateString()
    ? `Today ${time}`
    : d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

function statusLabel(r: GuestRequest) {
  if (r.status !== "confirmed" && (r.reopened || isOverdue(r))) return r.reopened ? "Reopened" : "Overdue";
  return r.status === "confirmed" ? "Closed" : STEPS[stepIndex(r.status)].staff;
}

// Spotlight-style global search for the staff app: ⌘K / Ctrl+K.
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data: requests } = useLive<GuestRequest[]>(open ? "/api/requests" : null, 5000);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  // Commands reach the board through the URL, so they work from any page.
  const board = "/staff";
  const go = (params: Record<string, string>) => {
    setOpen(false);
    setQ("");
    router.push(`${board}?${new URLSearchParams({ ...params, t: String(++commandSeq) })}`);
  };
  const nav = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  const query = q.trim();
  const all = requests ?? [];
  const roomInQuery = query.match(/\b(\d{3,4})\b/)?.[1];
  const rest = roomInQuery ? query.replace(roomInQuery, "").trim() : query;
  const knownRoom = roomInQuery && (ROOMS.includes(roomInQuery) || all.some((r) => r.room === roomInQuery));

  // --- Top hits: understand "214 towels" style queries
  const top: Item[] = [];
  if (roomInQuery && rest) {
    top.push({
      id: "log-room-note",
      icon: LogRequestIcon,
      iconClass: "text-orchid",
      label: <>Log “{cap(rest)}” for room {roomInQuery}</>,
      hint: "Opens the form, filled in",
      run: () => go({ new: "1", room: roomInQuery, note: cap(rest) }),
    });
  }
  if (roomInQuery && knownRoom) {
    const roomReqs = all.filter((r) => r.room === roomInQuery);
    const openCount = roomReqs.filter((r) => r.status !== "confirmed").length;
    top.push({
      id: "room",
      icon: RoomDoorIcon,
      label: <>Room {roomInQuery}</>,
      hint: `${openCount} open · ${roomReqs.length} in the last month`,
      run: () => go({ room: roomInQuery }),
    });
    if (!rest) {
      top.push({
        id: "log-room",
        icon: AddIcon,
        label: <>Log a request for room {roomInQuery}</>,
        run: () => go({ new: "1", room: roomInQuery }),
      });
    }
  }

  // --- Requests
  const requestHits = (
    query
      ? all.filter((r) =>
          matchAll(
            `${r.room} room ${r.text} ${r.original?.text ?? ""} ${r.category} ${statusLabel(r)} ${r.source === "staff" ? "desk phone" : ""}`,
            query,
          ),
        )
      : all.filter((r) => r.status !== "confirmed" && (r.reopened || isOverdue(r)))
  )
    .sort((a, b) => Number(a.status === "confirmed") - Number(b.status === "confirmed") || b.createdAt - a.createdAt)
    .slice(0, 6)
    .map<Item>((r) => {
      const closed = r.status === "confirmed";
      const late = !closed && (r.reopened || isOverdue(r));
      return {
        id: `req-${r.id}`,
        icon: closed ? StatusClosedIcon : late ? StatusOverdueIcon : StatusOpenIcon,
        iconClass: closed ? "text-dot-green" : late ? "text-dot-red" : "text-orchid",
        label: (
          <span className="min-w-0 truncate">
            <span className="font-medium">Room {r.room}</span> · <span dir="auto">{r.text}</span>
          </span>
        ),
        hint: `${statusLabel(r)} · ${when(r.createdAt)}`,
        run: () => go({ open: r.id, request: r.id }),
      };
    });

  // --- Filters, actions and pages, matched on label + keywords
  const pick = (list: (Item & { keywords: string })[]) =>
    list.filter((i) => !query || matchAll(`${typeof i.label === "string" ? i.label : ""} ${i.keywords}`, query));

  const filters = pick([
    { id: "f-attention", icon: StatusOverdueIcon, label: "Needs attention", keywords: "overdue late red escalated reopened urgent", run: () => go({ tab: "attention" }) },
    { id: "f-open", icon: StatusOpenIcon, label: "Open requests", keywords: "open active pending", run: () => go({ tab: "open" }) },
    { id: "f-closed", icon: StatusClosedIcon, label: "Closed requests", keywords: "closed done fixed resolved confirmed", run: () => go({ tab: "closed", week: "0" }) },
    ...CATEGORIES.map((c) => ({
      id: `f-${c}`,
      icon: ViewListIcon,
      label: c,
      keywords: `department ${c === "Maintenance" ? "repair broken engineering" : c === "Housekeeping" ? "cleaning towels hk" : "reception concierge"}`,
      run: () => go({ dept: c }),
    })),
  ]);

  const actions = pick([
    { id: "a-new", icon: AddIcon, label: "New request", keywords: "log create add phone call", hint: "N", run: () => go({ new: "1" }) },
    { id: "a-timeline", icon: ViewTimelineIcon, label: "Timeline view", keywords: "calendar week schedule", run: () => go({ view: "timeline" }) },
    { id: "a-list", icon: ViewListIcon, label: "List view", keywords: "table", run: () => go({ view: "list" }) },
    { id: "a-this-week", icon: ViewTimelineIcon, label: "This week", keywords: "today now", run: () => go({ week: "0" }) },
    { id: "a-last-week", icon: LastWeekIcon, label: "Last week", keywords: "previous history past", run: () => go({ week: "-1", tab: "all" }) },
    {
      id: "a-reset",
      icon: ResetDemoIcon,
      label: "Reset demo data",
      keywords: "demo restart clear",
      run: async () => {
        await fetch("/api/reset", { method: "POST" });
        go({ week: "0", tab: "open" });
      },
    },
  ]);

  const guestRoom = roomInQuery ?? "507";
  const pages = pick([
    { id: "p-board", icon: RequestsBoardIcon, label: "Requests board", keywords: "home staff dashboard", run: () => nav("/staff") },
    { id: "p-settings", icon: SettingsIcon, label: "Settings", keywords: "admin preferences configure", run: () => nav("/staff/settings") },
    { id: "p-escalation", icon: TimeLimitIcon, label: "Escalation rules", keywords: "time limits minutes overdue settings sla", run: () => nav("/staff/settings") },
    { id: "p-guest", icon: GuestViewIcon, label: `Guest view for room ${guestRoom}`, keywords: "guest phone qr customer", run: () => nav(`/guest?room=${guestRoom}`) },
  ]);

  const groups: [string, Item[]][] = [
    ["Top hits", top],
    [query ? "Requests" : "Needs attention", requestHits],
    ["Filters", query ? filters : []],
    ["Actions", query ? actions : actions.slice(0, 3)],
    ["Go to", query ? pages : pages.slice(0, 2)],
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => (setOpen(o), o || setQ(""))}>
      <DialogContent showCloseButton={false} className="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">Search requests, rooms, actions and pages</DialogDescription>
        <Command shouldFilter={false} loop className="rounded-none! p-0">
          <div className="flex items-center gap-3 border-b px-4">
            <SearchIcon className="size-5 shrink-0 text-muted-foreground" />
            <CommandPrimitive.Input
              value={q}
              onValueChange={setQ}
              placeholder="Search requests, rooms, actions…"
              className="h-14 w-full bg-transparent text-base outline-hidden placeholder:text-muted-foreground"
            />
            <kbd className="rounded-sm border px-1.5 text-[10px] text-muted-foreground">esc</kbd>
          </div>
          <CommandList className="max-h-[min(60vh,440px)] p-2">
            <CommandEmpty className="py-10 text-muted-foreground">
              No matches. Try a room number, “towels” or “overdue”.
            </CommandEmpty>
            {groups.map(([heading, items]) =>
              items.length ? (
                <CommandGroup key={heading} heading={heading}>
                  {items.map((i) => {
                    const Icon = i.icon;
                    return (
                      <CommandItem key={i.id} value={i.id} onSelect={i.run} className="gap-3 py-2.5">
                        <Icon className={cn("text-muted-foreground", i.iconClass)} />
                        <span className="flex min-w-0 flex-1 items-center">{i.label}</span>
                        {i.hint && <span className="shrink-0 text-xs text-muted-foreground">{i.hint}</span>}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : null,
            )}
          </CommandList>
          <div className="flex items-center gap-4 border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
            <span><kbd className="font-sans">↑↓</kbd> move</span>
            <span><kbd className="font-sans">↵</kbd> open</span>
            <span className="ml-auto">Try “214 towels”</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
