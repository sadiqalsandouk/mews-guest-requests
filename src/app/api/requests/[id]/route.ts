import { connection, NextResponse, type NextRequest } from "next/server";
import { addNote, applyAction, assignTo, TEAMS, getRequest, rateRequest, setStage, STEPS, withOverdue, type Action, type Status } from "@/lib/requests";
import { readStore, writeStore } from "@/lib/store-sync";

const ACTIONS: Action[] = ["advance", "confirm", "reopen", "followUp"];
const notFound = () => NextResponse.json({ error: "not found" }, { status: 404 });

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/requests/[id]">) {
  await connection();
  const id = (await ctx.params).id;
  const r = await readStore(() => {
    const found = getRequest(id);
    return found ? withOverdue(found) : null;
  });
  return r ? NextResponse.json(r) : notFound();
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/requests/[id]">) {
  const { action, status, rating, comment, tags, text, name } = await req.json();
  const id = (await ctx.params).id;

  // Validate first, then change the demo state in one go.
  if (action === "note" && (typeof text !== "string" || !text.trim())) {
    return NextResponse.json({ error: "note text is required" }, { status: 400 });
  }
  if (action === "rate" && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "rating must be 1 to 5" }, { status: 400 });
  }
  if (action === "assign" && !TEAMS.some((t) => t.members.includes(name))) {
    return NextResponse.json({ error: "unknown team member" }, { status: 400 });
  }
  const isSet = action === "set" && STEPS.some((s) => s.key === status);
  if (!["note", "rate", "assign"].includes(action) && !isSet && !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  const r = await writeStore(() => {
    let changed;
    if (action === "assign") {
      changed = assignTo(id, name, "Duty manager");
    } else if (action === "note") {
      changed = addNote(id, text.trim().slice(0, 1000), "Duty manager");
    } else if (action === "rate") {
      changed = rateRequest(
        id,
        rating,
        typeof comment === "string" ? comment.slice(0, 500) : undefined,
        Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string").slice(0, 5) : [],
      );
    } else if (isSet) {
      changed = setStage(id, status as Status); // demo stepper
    } else {
      changed = applyAction(id, action);
    }
    return changed ? withOverdue(changed) : null;
  });
  return r ? NextResponse.json(r) : notFound();
}
