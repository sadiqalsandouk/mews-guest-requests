"use client";

import { LoggedByDeskIcon, RepeatIssueIcon } from "@/components/icons";

import { DAY, isOverdue, isRepeat, ROOMS, type GuestRequest } from "@/lib/requests";
import { cn } from "@/lib/utils";

const DAYS = 7;
const LANE_H = 30;
// Requests last minutes, columns are days: keep blocks wide enough to read.
const MIN_BLOCK_PCT = 11;

const floorOf = (room: string) => (room.length > 2 ? room.slice(0, -2) : "0");

type Placed = { r: GuestRequest; left: number; width: number; lane: number };

function accent(r: GuestRequest, now: number) {
  if (r.status === "confirmed") return "bg-dot-green/60";
  if (r.reopened || isOverdue(r, now)) return "bg-dot-red";
  if (r.status === "fixed") return "bg-slate";
  return "bg-orchid";
}

function roomDot(rs: GuestRequest[], now: number) {
  const open = rs.filter((r) => r.status !== "confirmed");
  if (open.some((r) => r.reopened || isOverdue(r, now))) return "bg-dot-red";
  if (open.length) return "bg-dot-amber";
  return "bg-dot-green";
}

// Week view, like the PMS timeline: rooms down the side, days across the top.
export function RequestTimeline({
  requests,
  allRequests,
  weekStart,
  now,
  selectedId,
  onSelect,
}: {
  requests: GuestRequest[];
  allRequests: GuestRequest[];
  weekStart: number;
  now: number;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const span = DAYS * DAY;
  const pct = (t: number) => ((Math.min(Math.max(t, weekStart), weekStart + span) - weekStart) / span) * 100;
  const showNow = now >= weekStart && now < weekStart + span;
  const todayIndex = showNow ? Math.floor((now - weekStart) / DAY) : -1;

  const inWeek = requests.filter((r) => r.createdAt < weekStart + span && (r.closedAt ?? now) >= weekStart);
  const rooms = [...new Set([...ROOMS, ...inWeek.map((r) => r.room)])].sort(
    (a, b) => Number(a) - Number(b) || a.localeCompare(b),
  );
  const floors = [...new Set(rooms.map(floorOf))];

  // Overlapping requests in one room stack into lanes.
  const placedByRoom = new Map<string, Placed[]>();
  for (const room of rooms) {
    const laneEnds: number[] = [];
    placedByRoom.set(
      room,
      inWeek
        .filter((r) => r.room === room)
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((r) => {
          const start = pct(r.createdAt);
          const width = Math.max(pct(r.closedAt ?? now) - start, MIN_BLOCK_PCT);
          // Late-Sunday requests: nudge left so the block stays readable.
          const left = Math.min(start, 100 - width);
          let lane = laneEnds.findIndex((e) => e <= left);
          if (lane === -1) lane = laneEnds.length;
          laneEnds[lane] = left + width;
          return { r, left, width, lane };
        }),
    );
  }

  const days = Array.from({ length: DAYS }, (_, i) => new Date(weekStart + i * DAY));
  const cols = { gridTemplateColumns: `repeat(${DAYS}, minmax(0, 1fr))` };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="min-w-[760px] text-sm">
        <div className="grid grid-cols-[96px_1fr] border-b">
          <div className="sticky left-0 z-20 border-r bg-muted" />
          <div className="grid" style={cols}>
            {days.map((d, i) => (
              <div key={i} className={cn("border-r px-2 py-2 last:border-r-0", i === todayIndex && "bg-orchid-tint")}>
                <span className={cn("block text-xs text-muted-foreground", i === todayIndex && "text-brand-strong")}>
                  {d.toLocaleDateString([], { weekday: "short" })}
                </span>
                <span className="font-medium">{d.toLocaleDateString([], { day: "numeric", month: "short" })}</span>
              </div>
            ))}
          </div>
        </div>

        {floors.map((floor) => (
          <div key={floor} className="grid grid-cols-[24px_72px_1fr] border-b last:border-b-0">
            {/* Vertical group label, like "Single rooms" on the PMS */}
            <div className="sticky left-0 z-20 flex items-center justify-center border-r bg-muted">
              <span className="-rotate-90 whitespace-nowrap text-xs text-muted-foreground">Floor {floor}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              {rooms
                .filter((r) => floorOf(r) === floor)
                .map((room) => {
                  const placed = placedByRoom.get(room) ?? [];
                  const lanes = Math.max(1, ...placed.map((p) => p.lane + 1));
                  return (
                    <div key={room} className="grid grid-cols-[72px_1fr] border-b last:border-b-0">
                      <div className="sticky left-6 z-20 flex items-center gap-2 border-r bg-card px-3 font-medium">
                        <span className={cn("size-2 rounded-full", roomDot(inWeek.filter((r) => r.room === room), now))} aria-hidden />
                        {room}
                      </div>
                      <div className="relative" style={{ height: lanes * LANE_H + 10 }}>
                        <div className="absolute inset-0 grid" style={cols}>
                          {days.map((_, i) => (
                            <div key={i} className={cn("border-r last:border-r-0", i === todayIndex ? "bg-orchid-tint" : "bg-muted/40")} />
                          ))}
                        </div>
                        {showNow && (
                          <div className="absolute inset-y-0 w-px bg-orchid" style={{ left: `${pct(now)}%` }} aria-hidden />
                        )}
                        {placed.map(({ r, left, width, lane }) => {
                          const closed = r.status === "confirmed";
                          return (
                            <button
                              key={r.id}
                              onClick={() => onSelect(r.id)}
                              title={r.text}
                              className={cn(
                                "absolute flex items-center gap-1.5 overflow-hidden rounded-sm border bg-card pr-2 pl-3 text-left text-xs shadow-xs hover:border-foreground/40",
                                closed && "bg-muted text-muted-foreground shadow-none",
                                r.id === selectedId && "border-foreground ring-1 ring-foreground",
                              )}
                              style={{ left: `${left}%`, width: `${width}%`, top: 5 + lane * LANE_H, height: LANE_H - 4 }}
                            >
                              <span className={cn("absolute inset-y-0 left-0 w-1", accent(r, now))} aria-hidden />
                              <span dir="auto" className={cn("min-w-0 flex-1 truncate", !closed && "font-medium")}>
                                {r.text}
                              </span>
                              {r.source === "staff" && (
                                <LoggedByDeskIcon className="size-3 shrink-0 text-muted-foreground" aria-label="Logged by staff" />
                              )}
                              {isRepeat(r, allRequests) && (
                                <RepeatIssueIcon className="size-3 shrink-0 text-muted-foreground" aria-label="Repeat issue in this room" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
