"use client";

import { useState } from "react";
import {
  CheckIcon,
  LoggedByDeskIcon,
  RepeatIssueIcon,
  StatusOverdueIcon,
  TranslatedIcon,
} from "@/components/icons";

import { Stars } from "@/components/guest-app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  isOverdue,
  isRepeat,
  needsFollowUp,
  requestKey,
  STAFF,
  STEPS,
  stepIndex,
  type GuestRequest,
} from "@/lib/requests";
import { statusOf } from "@/lib/status";
import { patchRequest, sendAction } from "@/lib/use-live";
import { cn } from "@/lib/utils";

const fmt = (t?: number) =>
  t
    ? new Date(t).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

type Event = { at: number; who: string; text: string; tone?: "bad" | "good" | "note" };

// Everything that happened to the request, newest first (like Jira's activity).
function activity(r: GuestRequest, now: number): Event[] {
  const staff = STAFF[r.category];
  const ev: Event[] = [
    {
      at: r.createdAt,
      who: r.source === "staff" ? "Front desk" : "Guest",
      text: r.source === "staff" ? "logged this request for the guest" : "sent this request from the guest app",
    },
  ];
  if (r.stepAt?.assigned) ev.push({ at: r.stepAt.assigned, who: "System", text: `assigned it to ${r.assignee ?? staff}` });
  if (r.stepAt?.on_the_way) ev.push({ at: r.stepAt.on_the_way, who: staff, text: "is on the way" });
  if (r.reopened && r.dueFrom) ev.push({ at: r.dueFrom, who: "Guest", text: "said it isn't fixed. Reopened", tone: "bad" });
  if (r.dueBy && r.status !== "confirmed" && isOverdue(r, now))
    ev.push({ at: r.dueBy, who: "System", text: "escalated it to the duty manager (past the time limit)", tone: "bad" });
  if (r.stepAt?.fixed) ev.push({ at: r.stepAt.fixed, who: staff, text: "marked it as fixed" });
  if (r.stepAt?.confirmed) ev.push({ at: r.stepAt.confirmed, who: "Guest", text: "confirmed it's fixed", tone: "good" });
  if (r.rating && r.ratedAt)
    ev.push({ at: r.ratedAt, who: "Guest", text: `rated it ${r.rating}★`, tone: r.rating <= 3 ? "bad" : "good" });
  if (r.followedUpAt) ev.push({ at: r.followedUpAt, who: "Duty manager", text: "followed up with the guest", tone: "good" });
  for (const n of r.notes ?? []) ev.push({ at: n.at, who: n.by, text: n.text, tone: "note" });
  return ev.sort((a, b) => b.at - a.at);
}

// The full ticket: main column + details sidebar. Used in the modal and the full page.
export function RequestDetail({
  r,
  all,
  now,
  onChange,
}: {
  r: GuestRequest;
  all: GuestRequest[];
  now: number;
  onChange?: () => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const s = statusOf(r, now);
  const next = STEPS[stepIndex(r.status) + 1];
  const done = () => onChange?.();

  const addNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    await patchRequest(r.id, { action: "note", text: note });
    setSaving(false);
    setNote("");
    done();
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
      {/* Main column */}
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Room {r.room}</Badge>
            {(r.urgent || r.safety) && (
              <Badge className="bg-dot-red text-white">{r.safety ? "Safety risk" : "Urgent"}</Badge>
            )}
            {r.source === "staff" && (
              <Badge variant="outline">
                <LoggedByDeskIcon /> By desk
              </Badge>
            )}
          </div>
          <h1 dir="auto" className="text-2xl font-semibold tracking-tight">{r.text}</h1>
        </div>

        {/* Alerts */}
        {r.safety && r.status !== "confirmed" && (
          <Alert tone="bad" icon={StatusOverdueIcon}>
            <strong>Possible safety risk.</strong> Make sure the duty manager knows right now.
          </Alert>
        )}
        {r.status !== "confirmed" && isOverdue(r, now) && (
          <Alert tone="bad" icon={StatusOverdueIcon}>
            Past the time limit for {r.category.toLowerCase()}. Escalated to the duty manager.
          </Alert>
        )}
        {r.reopened && r.status !== "confirmed" && (
          <Alert tone="bad" icon={StatusOverdueIcon}>
            The guest says this still isn&apos;t fixed.
          </Alert>
        )}
        {isRepeat(r, all) && (
          <Alert tone="info" icon={RepeatIssueIcon}>
            Room {r.room} had another {r.category.toLowerCase()} request in the past week. Worth checking the root cause.
          </Alert>
        )}

        {r.original && (
          <section className="flex flex-col gap-1.5">
            <h2 className="text-sm font-semibold">What the guest said</h2>
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="mb-1 flex items-center gap-1 text-muted-foreground">
                <TranslatedIcon className="size-3.5" /> {r.original.lang}, translated above
              </p>
              <p dir="auto" className="text-base">{r.original.text}</p>
            </div>
          </section>
        )}

        {r.rating !== undefined && (
          <section className="flex flex-col gap-1.5">
            <h2 className="text-sm font-semibold">Guest review</h2>
            <div className={cn("flex flex-col gap-2 rounded-md bg-muted p-3 text-sm", needsFollowUp(r) && "border-l-4 border-dot-red")}>
              <Stars value={r.rating} />
              {!!r.ratingTags?.length && (
                <div className="flex flex-wrap gap-1">
                  {r.ratingTags.map((t) => (
                    <Badge key={t} variant="outline" className="bg-background">{t}</Badge>
                  ))}
                </div>
              )}
              {r.ratingComment && <p dir="auto">“{r.ratingComment}”</p>}
              {needsFollowUp(r) && <p>Low rating. Call or visit the guest before they check out.</p>}
            </div>
          </section>
        )}

        {/* Activity + internal notes */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Activity</h2>
          <div className="flex flex-col gap-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote();
              }}
              placeholder="Add an internal note (the guest won't see it)…"
              className="min-h-16"
            />
            {note.trim() && (
              <Button size="sm" className="self-start" disabled={saving} onClick={addNote}>
                {saving ? "Saving…" : "Save note"}
              </Button>
            )}
          </div>
          <ol className="flex flex-col">
            {activity(r, now).map((e, i) => (
              <li key={i} className="flex gap-3 border-b py-2.5 text-sm last:border-b-0">
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    e.tone === "bad" ? "bg-dot-red/15 text-dot-red" : e.tone === "good" ? "bg-status-done" : "bg-muted",
                  )}
                  aria-hidden
                >
                  {e.who[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn(e.tone === "note" && "whitespace-pre-wrap")}>
                    <span className="font-medium">{e.who}</span>{" "}
                    {e.tone === "note" ? <span className="text-muted-foreground">added a note</span> : e.text}
                  </p>
                  {e.tone === "note" && <p className="mt-1 rounded-md bg-muted p-2">{e.text}</p>}
                  <p className="text-xs text-muted-foreground">{fmt(e.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Details sidebar */}
      <aside className="flex flex-col gap-4 md:sticky md:top-0 md:self-start">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className={cn("size-2 rounded-full", s.dot)} aria-hidden /> {s.label}
          </span>
          {r.status === "fixed" ? (
            <p className="text-sm text-muted-foreground">Waiting for the guest to confirm.</p>
          ) : r.status === "confirmed" ? (
            <p className="flex items-center gap-1 text-sm">
              <CheckIcon className="size-4 text-dot-green" /> Closed by the guest
            </p>
          ) : (
            <Button
              size="lg"
              onClick={async () => {
                await sendAction(r.id, "advance");
                done();
              }}
            >
              Mark as {next.staff.toLowerCase()}
            </Button>
          )}
          {needsFollowUp(r) && (
            <Button
              variant="outline"
              size="lg"
              onClick={async () => {
                await sendAction(r.id, "followUp");
                done();
              }}
            >
              <CheckIcon /> Mark followed up
            </Button>
          )}
        </div>

        <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2.5 rounded-lg border p-4 text-sm">
          <dt className="text-muted-foreground">Assignee</dt>
          <dd className="flex items-center gap-2">
            {r.assignee ? (
              <>
                <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                  {r.assignee[0]}
                </span>
                {r.assignee.split(" · ")[0]}
              </>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </dd>
          <dt className="text-muted-foreground">Department</dt>
          <dd>{r.category}</dd>
          <dt className="text-muted-foreground">Room</dt>
          <dd>{r.room}</dd>
          <dt className="text-muted-foreground">Priority</dt>
          <dd className={cn((r.urgent || r.safety) && "font-medium text-dot-red")}>
            {r.safety ? "Safety" : r.urgent ? "Urgent" : "Normal"}
          </dd>
          <dt className="text-muted-foreground">Source</dt>
          <dd>{r.source === "staff" ? "Front desk (phone or in person)" : "Guest app"}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{fmt(r.createdAt)}</dd>
          {r.status !== "confirmed" && (
            <>
              <dt className="text-muted-foreground">Due by</dt>
              <dd className={cn(isOverdue(r, now) && "text-dot-red")}>{fmt(r.dueBy)}</dd>
            </>
          )}
          {r.closedAt && (
            <>
              <dt className="text-muted-foreground">Closed</dt>
              <dd>{fmt(r.closedAt)}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Key</dt>
          <dd className="font-mono text-xs leading-5">{requestKey(r)}</dd>
        </dl>
      </aside>
    </div>
  );
}

function Alert({
  tone,
  icon: Icon,
  children,
}: {
  tone: "bad" | "info";
  icon: typeof StatusOverdueIcon;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("flex items-start gap-2 rounded-md border-l-4 bg-muted p-3 text-sm", tone === "bad" ? "border-dot-red" : "border-slate")}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "bad" ? "text-dot-red" : "text-muted-foreground")} />
      <span>{children}</span>
    </p>
  );
}
