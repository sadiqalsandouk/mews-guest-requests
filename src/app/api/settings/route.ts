import { connection, NextResponse } from "next/server";
import { CATEGORIES, getLimits, setLimits, type Limits } from "@/lib/requests";
import { readStore, writeStore } from "@/lib/store-sync";

export async function GET() {
  await connection();
  return NextResponse.json(await readStore(() => ({ limits: getLimits() })));
}

// Admin: update escalation limits (minutes per department, 1 to 480).
export async function PUT(req: Request) {
  const { limits } = await req.json();
  const next = {} as Limits;
  for (const c of CATEGORIES) {
    const v = Number(limits?.[c]);
    if (!Number.isInteger(v) || v < 1 || v > 480) {
      return NextResponse.json({ error: `${c}: enter whole minutes from 1 to 480` }, { status: 400 });
    }
    next[c] = v;
  }
  await writeStore(() => setLimits(next));
  return NextResponse.json({ limits: next });
}
