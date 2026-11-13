import { isOverdue, needsFollowUp, STEPS, stepIndex, type GuestRequest } from "@/lib/requests";

// Status shown the way the PMS shows room state: a coloured dot + label.
export function statusOf(r: GuestRequest, now: number) {
  if (needsFollowUp(r)) return { dot: "bg-dot-red", label: `Rated ${r.rating}★` };
  if (r.status !== "confirmed" && (r.reopened || isOverdue(r, now)))
    return { dot: "bg-dot-red", label: r.reopened ? "Reopened" : "Overdue" };
  switch (r.status) {
    case "received":
      return { dot: "bg-orchid", label: "New" };
    case "assigned":
    case "on_the_way":
      return { dot: "bg-dot-amber", label: STEPS[stepIndex(r.status)].staff };
    case "fixed":
      return { dot: "bg-slate", label: r.guestConfirmedAt ? "Guest says fixed" : "Awaiting guest" };
    case "confirmed":
      return { dot: "bg-dot-green", label: "Closed" };
  }
}
