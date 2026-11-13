// Shared request model + an in-memory store for the demo.
// Everything resets when the dev server restarts. A real build would use
// a hotel platform's tasks + webhooks instead (see "Going to production" in the README).

export type Status = "received" | "assigned" | "on_the_way" | "fixed" | "confirmed";
export type Category = "Maintenance" | "Housekeeping" | "Front desk";

export type GuestRequest = {
  id: string;
  room: string;
  category: Category;
  text: string;
  original?: { text: string; lang: string };
  status: Status;
  assignee?: string;
  createdAt: number;
  // When the escalation clock started; restarts if the guest reopens it.
  dueFrom?: number;
  fixedAt?: number;
  // The guest said "yes, it's fixed". Feedback only: staff still close it.
  guestConfirmedAt?: number;
  closedAt?: number;
  reopened?: boolean;
  // "staff" = logged at the desk on the guest's behalf (phone call, in person).
  source?: "guest" | "staff";
  // How the department was chosen: the guest tapped an option, the decision
  // model (with how sure it was), or keyword rules when the AI was unavailable.
  routedBy?: { by: "guest" | "ai" | "rules"; confidence?: number };
  // Safety risk or the guest can't use the room: top of every list.
  urgent?: boolean;
  safety?: boolean;
  // Guest's review once it's sorted (1–5). Low scores need a follow-up.
  rating?: number;
  ratingComment?: string;
  // Quick tags the guest picked, e.g. "Fixed first time" or "Had to chase".
  ratingTags?: string[];
  followedUp?: boolean;
  ratedAt?: number;
  followedUpAt?: number;
  // Optional tip after a good rating (mock payment, whole pounds).
  tip?: number;
  tippedAt?: number;
  // Reassignments and similar, for the activity history.
  history?: { at: number; by: string; text: string }[];
  // Internal staff notes (not shown to the guest).
  notes?: { at: number; by: string; text: string }[];
  // When each step happened (for the guest's timeline).
  stepAt?: Partial<Record<Status, number>>;
  // Set by the API from the hotel's escalation limits.
  overdue?: boolean;
  // The hotel's target time to have it fixed (start + limit), set by the API.
  dueBy?: number;
};

// Who picks requests up (fictional demo staff). Showing a name, not just a
// status, is what made Deliveroo's rider tracking feel human.
export const STAFF: Record<Category, string> = {
  Maintenance: "Tomás",
  Housekeeping: "Aisha",
  "Front desk": "Lena",
};

// Who can be assigned, by team (fictional demo staff). The first member of
// each team is the default on-call person above.
export const TEAMS: { team: Category; label: string; members: string[] }[] = [
  { team: "Maintenance", label: "Maintenance · engineers", members: ["Tomás", "Priya", "Omar"] },
  { team: "Housekeeping", label: "Housekeeping", members: ["Aisha", "Grace", "Joseph"] },
  { team: "Front desk", label: "Front desk", members: ["Lena", "Marco"] },
];

// The person actually on it (assignee is stored as "Name · Team").
export const staffName = (r: Pick<GuestRequest, "assignee" | "category">) =>
  r.assignee?.split(" · ")[0] ?? STAFF[r.category];

export const CATEGORIES: Category[] = ["Maintenance", "Housekeeping", "Front desk"];

export const STEPS: { key: Status; staff: string; guest: string }[] = [
  { key: "received", staff: "New", guest: "Request received" },
  { key: "assigned", staff: "Assigned", guest: "Passed to the team" },
  { key: "on_the_way", staff: "On the way", guest: "Someone is on the way" },
  { key: "fixed", staff: "Marked fixed", guest: "Marked as fixed" },
  { key: "confirmed", staff: "Closed", guest: "Closed by the team" },
];

export const stepIndex = (s: Status) => STEPS.findIndex((x) => x.key === s);

// Escalation rule: minutes before an unfinished request counts as overdue.
// Demo settings only, not researched targets.
export type Limits = Record<Category, number>;

// Default escalation limits; admins change them on the settings page.
export const TIME_LIMIT_MIN: Limits = {
  Maintenance: 30,
  Housekeeping: 20,
  "Front desk": 15,
};

export const minutesAgo = (r: GuestRequest, now = Date.now()) =>
  Math.max(0, Math.floor((now - r.createdAt) / 60_000));

// The API sends `overdue` worked out with the hotel's current limits;
// otherwise fall back to computing it.
export const isOverdue = (r: GuestRequest, now = Date.now(), limits: Limits = TIME_LIMIT_MIN) =>
  r.overdue ??
  (stepIndex(r.status) < stepIndex("fixed") &&
    now - (r.dueFrom ?? r.createdAt) >= limits[r.category] * 60_000);

// Open request, and the same room + department had one in the 7 days before:
// a hint to fix the root cause rather than patch it again.
export const isRepeat = (r: GuestRequest, all: GuestRequest[]) =>
  r.status !== "confirmed" &&
  all.some(
    (o) =>
      o.id !== r.id &&
      o.room === r.room &&
      o.category === r.category &&
      o.createdAt <= r.createdAt &&
      r.createdAt - o.createdAt < 7 * DAY,
  );

export const DAY = 86_400_000;

// The hotel's rooms (mock).
export const ROOMS = ["101", "104", "112", "118", "203", "207", "214", "220", "302", "305", "311", "501", "507", "512"];

// Mock history: closed requests over the past few weeks, so the week view
// has something to show. Deterministic, so every reset looks the same.
const HISTORY_TEXT: Record<Category, string[]> = {
  Maintenance: ["The light by the bed is flickering.", "The sink drains slowly.", "The TV remote doesn't work.",
    "The air con is very noisy.", "The safe won't open.", "No hot water in the shower."],
  Housekeeping: ["Extra towels please.", "Could we get more coffee pods?", "Room cleaning please.",
    "Need an extra blanket.", "Fresh sheets please."],
  "Front desk": ["Can we have a late checkout?", "Please book a taxi for 7am.", "Can you hold our luggage?"],
};

function history(now: number): GuestRequest[] {
  let x = 7;
  const rand = () => ((x = (x * 48271) % 2147483647) / 2147483647);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const out: GuestRequest[] = [];
  for (let d = 1; d <= 27; d++) {
    const perDay = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < perDay; i++) {
      const category = CATEGORIES[Math.floor(rand() * 3)];
      const texts = HISTORY_TEXT[category];
      const created = today.getTime() - d * DAY + (7 + rand() * 15) * 3_600_000;
      const fixMin = 10 + Math.floor(rand() * 80);
      out.push({
        id: String(100 + out.length),
        room: ROOMS[Math.floor(rand() * ROOMS.length)],
        category,
        text: texts[Math.floor(rand() * texts.length)],
        status: "confirmed",
        assignee: `${category} on call`,
        createdAt: created,
        fixedAt: created + fixMin * 60_000,
        closedAt: created + (fixMin + 5) * 60_000,
        source: rand() < 0.3 ? "staff" : "guest",
      });
    }
  }
  return out;
}

// Stand-in for the AI categoriser: simple keyword rules.
// Housekeeping first so "toilet paper" doesn't land in Maintenance.
const RULES: { category: Category; words: string[] }[] = [
  {
    category: "Housekeeping",
    words: ["towel", "pillow", "clean", "sheet", "blanket", "toilet paper", "amenit", "soap"],
  },
  {
    category: "Maintenance",
    words: ["broken", "not working", "isn't working", "won't", "shower", "stove", "leak", "light",
      "air con", "aircon", "heating", "toilet", "tv", "wifi", "door", "lock", "water", "الدش", "الماء"],
  },
];

export function categorise(text: string): Category {
  const t = text.toLowerCase();
  return RULES.find((r) => r.words.some((w) => t.includes(w)))?.category ?? "Front desk";
}

type Store = { requests: GuestRequest[]; nextId: number; limits?: Limits; lastWrite?: number };

function seed(): Store {
  const now = Date.now();
  const ago = (min: number) => now - min * 60_000;
  // Earlier today, already closed: gives the timeline some history.
  const done = (
    id: string, room: string, category: Category, text: string, from: number, fixed: number, closed: number,
  ): GuestRequest => ({
    id, room, category, text, status: "confirmed", assignee: `${category} on call`,
    createdAt: ago(from), fixedAt: ago(fixed), closedAt: ago(closed), source: "guest",
  });
  return {
    nextId: 1000,
    limits: { ...TIME_LIMIT_MIN },
    requests: [
      ...history(now),
      done("201", "507", "Maintenance", "The air con is very noisy.", 410, 350, 340),
      done("202", "302", "Housekeeping", "Fresh towels please.", 360, 335, 330),
      done("203", "214", "Maintenance", "The stove isn't heating properly.", 300, 250, 245),
      done("204", "118", "Front desk", "Can we have a late checkout?", 190, 180, 178),
      done("205", "203", "Housekeeping", "Room cleaning after 2pm.", 150, 95, 90),
      {
        id: "1",
        room: "214",
        category: "Maintenance",
        text: "The stove in the kitchenette won't turn on.",
        status: "assigned",
        assignee: "Tomás · Maintenance",
        createdAt: ago(34),
        stepAt: { received: ago(34), assigned: ago(26) },
      },
      {
        id: "2",
        room: "507",
        category: "Maintenance",
        text: "The shower isn't working, the water is cold.",
        original: { text: "الدش لا يعمل، الماء بارد", lang: "Arabic" },
        status: "received",
        createdAt: ago(3),
        stepAt: { received: ago(3) },
      },
      {
        id: "3",
        room: "118",
        category: "Housekeeping",
        text: "Could we have two extra pillows please?",
        status: "on_the_way",
        assignee: "Aisha · Housekeeping",
        createdAt: ago(12),
        stepAt: { received: ago(12), assigned: ago(9), on_the_way: ago(4) },
      },
    ],
  };
}

// Kept on globalThis so hot reloads in dev don't wipe it.
const g = globalThis as unknown as { __requestStore?: Store };
const store = (g.__requestStore ??= seed());

export const getLimits = (): Limits => store.limits ?? { ...TIME_LIMIT_MIN };

export function setLimits(next: Limits) {
  store.limits = next;
}

// What the API returns: the request plus its overdue flag right now.
export const withOverdue = (r: GuestRequest, now = Date.now()): GuestRequest => ({
  ...r,
  overdue: isOverdue({ ...r, overdue: undefined }, now, getLimits()),
  dueBy: (r.dueFrom ?? r.createdAt) + getLimits()[r.category] * 60_000,
});

export const listRequests = () =>
  [...store.requests].sort((a, b) => b.createdAt - a.createdAt).map((r) => withOverdue(r));

export const getRequest = (id: string) => store.requests.find((r) => r.id === id);

export function createRequest(
  room: string,
  text: string,
  opts: {
    category?: Category;
    source?: "guest" | "staff";
    urgent?: boolean;
    safety?: boolean;
    original?: { text: string; lang: string };
    routedBy?: GuestRequest["routedBy"];
  } = {},
): GuestRequest {
  const r: GuestRequest = {
    id: String(store.nextId++),
    room,
    category: opts.category ?? categorise(text),
    text,
    status: "received",
    createdAt: Date.now(),
    stepAt: { received: Date.now() },
    source: opts.source ?? "guest",
    urgent: opts.urgent || undefined,
    safety: opts.safety || undefined,
    original: opts.original,
    routedBy: opts.routedBy,
  };
  store.requests.push(r);
  return r;
}

export type Action = "advance" | "confirm" | "guestConfirm" | "reopen" | "followUp";

// The guest can rate once they've said it's fixed, or once staff close it.
export const canRate = (r: GuestRequest) => r.status === "confirmed" || !!r.guestConfirmedAt;

// Ticket key shown to staff, like a Jira issue key.
export const requestKey = (r: Pick<GuestRequest, "id">) => `REQ-${r.id}`;

// Assign (or reassign) a request to a named team member.
export function assignTo(id: string, name: string, by: string): GuestRequest | undefined {
  const r = getRequest(id);
  const team = TEAMS.find((t) => t.members.includes(name));
  if (!r || !team) return r;
  const next = `${name} · ${team.team}`;
  if (r.assignee === next) return r;
  const now = Date.now();
  if (r.status === "received") {
    r.status = "assigned";
    r.stepAt = { ...r.stepAt, assigned: now };
  } else {
    r.history = [...(r.history ?? []), { at: now, by, text: `reassigned it to ${name} (${team.team})` }];
  }
  r.assignee = next;
  return r;
}

export function addNote(id: string, text: string, by: string): GuestRequest | undefined {
  const r = getRequest(id);
  if (!r) return undefined;
  r.notes = [...(r.notes ?? []), { at: Date.now(), by, text }];
  return r;
}

// A rating of 3 or below flags the request for a manager to follow up.
export const LOW_RATING = 3;
export const needsFollowUp = (r: GuestRequest) =>
  r.rating !== undefined && r.rating <= LOW_RATING && !r.followedUp;

// Tags offered after the star tap: praise for 4–5, problems for 1–3.
export const GOOD_TAGS = ["Quick", "Friendly", "Fixed first time", "Kept me updated", "Went the extra mile"];
export const BAD_TAGS = ["Too slow", "Not fully fixed", "No updates", "Had to chase", "Staff attitude"];

export function rateRequest(id: string, rating: number, comment?: string, tags: string[] = []): GuestRequest | undefined {
  const r = getRequest(id);
  if (!r || !canRate(r)) return r;
  const allowed = rating > LOW_RATING ? GOOD_TAGS : BAD_TAGS;
  r.rating = rating;
  r.ratingTags = tags.filter((t) => allowed.includes(t));
  r.ratingComment = comment?.trim() || undefined;
  r.followedUp = false;
  r.ratedAt = Date.now();
  return r;
}

export const TIP_AMOUNTS = [2, 5, 10];

// Mock tip (no money moves). Only once the request is done, and only once.
export function tipRequest(id: string, amount: number): GuestRequest | undefined {
  const r = getRequest(id);
  if (!r || !canRate(r) || r.tip) return r;
  r.tip = amount;
  r.tippedAt = Date.now();
  return r;
}

// Demo only: jump a request straight to a stage (the guest page's stepper).
// Fills in times for the steps up to it and clears the ones after.
export function setStage(id: string, status: Status): GuestRequest | undefined {
  const r = getRequest(id);
  if (!r) return undefined;
  const now = Date.now();
  const upto = stepIndex(status);
  const stepAt: Partial<Record<Status, number>> = {};
  STEPS.forEach((s, i) => {
    if (i <= upto) stepAt[s.key] = r.stepAt?.[s.key] ?? (i === 0 ? r.createdAt : now);
  });
  r.status = status;
  r.stepAt = stepAt;
  r.reopened = false;
  // Fresh run-through: ask for the review again.
  r.rating = undefined;
  r.ratingTags = undefined;
  r.ratingComment = undefined;
  r.followedUp = undefined;
  r.ratedAt = undefined;
  r.followedUpAt = undefined;
  r.tip = undefined;
  r.tippedAt = undefined;
  r.assignee = upto >= 1 ? (r.assignee ?? `${STAFF[r.category]} · ${r.category}`) : undefined;
  if (upto < 1) r.history = undefined;
  r.fixedAt = upto >= stepIndex("fixed") ? stepAt.fixed : undefined;
  r.closedAt = status === "confirmed" ? stepAt.confirmed : undefined;
  if (upto < stepIndex("fixed")) r.guestConfirmedAt = undefined;
  return r;
}

export function applyAction(id: string, action: Action): GuestRequest | undefined {
  const r = getRequest(id);
  if (!r) return undefined;
  if (action === "advance") {
    const next = STEPS[stepIndex(r.status) + 1]?.key;
    if (next && next !== "confirmed") {
      r.status = next;
      r.assignee ??= `${STAFF[r.category]} · ${r.category}`;
      r.stepAt = { ...r.stepAt, [next]: Date.now() };
      if (next === "fixed") r.fixedAt = Date.now();
    }
  } else if (action === "guestConfirm" && r.status === "fixed") {
    // The guest's answer, not a close: the request stays with staff.
    r.guestConfirmedAt ??= Date.now();
  } else if (action === "confirm" && r.status === "fixed") {
    // Staff close it (the department lead or duty manager), not the guest.
    r.status = "confirmed";
    r.reopened = false;
    r.stepAt = { ...r.stepAt, confirmed: Date.now() };
    r.closedAt = Date.now();
  } else if (action === "followUp") {
    r.followedUp = true;
    r.followedUpAt = Date.now();
  } else if (action === "reopen" && r.status === "fixed") {
    // Guest says it's not fixed: back to the team, clock restarts.
    r.status = "assigned";
    r.reopened = true;
    r.fixedAt = undefined;
    r.guestConfirmedAt = undefined;
    r.stepAt = { received: r.stepAt?.received ?? r.createdAt, assigned: Date.now() };
    r.dueFrom = Date.now();
  }
  return r;
}

// Staff can remove a request (a duplicate, a test, logged by mistake).
export function deleteRequest(id: string): boolean {
  const before = store.requests.length;
  store.requests = store.requests.filter((r) => r.id !== id);
  return store.requests.length < before;
}

// Demo tool: an empty board, so a live run starts from nothing.
export function clearRequests() {
  store.requests = [];
}

export function resetStore() {
  Object.assign(store, seed());
}

// For the hosted demo (see lib/store-sync.ts): the same mock data, saved
// between requests so it survives serverless hosting. Not a data model.
export const snapshotStore = (): Store => store;
export function replaceStore(next: Store) {
  store.requests = next.requests;
  store.nextId = next.nextId;
  store.limits = next.limits;
  store.lastWrite = next.lastWrite;
}
export const freshStore = (): Store => seed();
