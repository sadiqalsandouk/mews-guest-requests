"use client";

import { useEffect, useState } from "react";
import {
  TowelsIcon,
  PillowsIcon,
  TaxiIcon,
  LateCheckoutIcon,
  AddIcon,
  ShowerWaterIcon,
  RoomCleaningIcon,
  HeatingAcIcon,
  TvWifiIcon,
  SomethingBrokenIcon,
  StatusOverdueIcon,
} from "@/components/icons";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { VoiceTextarea } from "@/components/voice-input";
import type { ParsedRequest } from "@/lib/ai";
import { PRESETS } from "@/lib/presets";
import { categorise, CATEGORIES, type Category } from "@/lib/requests";
import { cn } from "@/lib/utils";

const PRESET_ICON: Record<string, typeof TowelsIcon> = {
  towels: TowelsIcon,
  pillows: PillowsIcon,
  cleaning: RoomCleaningIcon,
  shower: ShowerWaterIcon,
  heating: HeatingAcIcon,
  tv: TvWifiIcon,
  broken: SomethingBrokenIcon,
  checkout: LateCheckoutIcon,
  taxi: TaxiIcon,
};

type Field = "room" | "preset" | "note" | "category" | "urgent";
type Phase = "idle" | "thinking" | "filled";

// Fields the AI just filled get a soft pink ring until staff touch them.
const aiRing = (on: boolean) => on && "ring-2 ring-orchid/50 ring-offset-1";

export function NewRequestDialog({
  rooms,
  onCreated,
  prefill,
}: {
  rooms: string[];
  onCreated: (id: string) => void;
  // From the ⌘K search, e.g. "214 towels": opens the form filled in.
  prefill?: { room?: string; note?: string; nonce: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [room, setRoom] = useState("");
  const [preset, setPreset] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [categoryOverride, setCategoryOverride] = useState<Category | null>(null);
  const [urgent, setUrgent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [ai, setAi] = useState<ParsedRequest | null>(null);
  const [aiFrom, setAiFrom] = useState<"voice" | "note">("voice");
  const [aiError, setAiError] = useState<string | null>(null);
  const [filled, setFilled] = useState<Field[]>([]);
  const [seenNonce, setSeenNonce] = useState<string | null>(null);

  const reset = () => {
    setRoom("");
    setPreset(null);
    setNote("");
    setCategoryOverride(null);
    setUrgent(false);
    setPhase("idle");
    setAi(null);
    setAiError(null);
    setFilled([]);
  };

  if (prefill && prefill.nonce !== seenNonce) {
    setSeenNonce(prefill.nonce);
    reset();
    setRoom(prefill.room ?? "");
    setNote(prefill.note ?? "");
    setOpen(true);
  }

  // Staff touched a field: it's theirs now, drop the AI highlight.
  const touch = (f: Field) => setFilled((cur) => cur.filter((x) => x !== f));

  const applyAi = (r: ParsedRequest) => {
    const got: Field[] = ["note", "category"];
    setAi(r);
    setNote(r.request);
    setCategoryOverride(r.category);
    setPreset(r.presetId);
    if (r.presetId) got.push("preset");
    if (r.room) {
      setRoom(r.room);
      got.push("room");
    }
    setUrgent(r.urgent);
    if (r.urgent) got.push("urgent");
    setFilled(got);
    setPhase("filled");
  };

  const understand = async (body: Blob | string) => {
    setAiFrom(typeof body === "string" ? "note" : "voice");
    setPhase("thinking");
    setAiError(null);
    try {
      let res: Response;
      if (typeof body === "string") {
        res = await fetch("/api/ai/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: body }),
        });
      } else {
        const form = new FormData();
        form.append("audio", body, "note");
        res = await fetch("/api/ai/parse", { method: "POST", body: form });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      applyAi(json);
    } catch (e) {
      setAiError(e instanceof Error && e.message ? e.message : "Couldn't understand that. Fill it in by hand.");
      setPhase(ai ? "filled" : "idle");
    }
  };

  // "N" opens the form from anywhere on the board.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const p = PRESETS.find((x) => x.id === preset) ?? null;
  const n = note.trim();
  const text = n || p?.text || "";
  const category = categoryOverride ?? p?.category ?? (n ? categorise(n) : null);
  const ready = room.trim() !== "" && text !== "" && phase !== "thinking";

  const close = (next: boolean) => setOpen(next);

  const submit = async () => {
    if (!ready || saving) return;
    setSaving(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: room.trim(),
        text,
        category,
        urgent,
        source: "staff",
        // Keep what was actually said, if it was another language and staff kept the AI's wording.
        original: ai?.originalText && n === ai.request ? { text: ai.originalText, lang: ai.language } : undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) return;
    onCreated((await res.json()).id);
    reset();
    setOpen(false);
  };

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <AddIcon /> New request
        <kbd className="ml-1 rounded-sm border border-background/30 px-1 text-[10px] opacity-70">N</kbd>
      </Button>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New request</DialogTitle>
            <DialogDescription>Type or speak it, in any language. The guest can follow it on their phone.</DialogDescription>
          </DialogHeader>

          {/* Type or speak (mic in the box). The AI fills in the rest. */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="nr-note" className="text-sm font-medium">
                What&apos;s needed?
              </label>
              {phase === "thinking" ? (
                <span className="text-xs text-muted-foreground">Filling in the rest…</span>
              ) : (
                n &&
                !filled.includes("note") && (
                  <button
                    type="button"
                    onClick={() => understand(room ? `room ${room}: ${n}` : n)}
                    className="shrink-0 text-xs font-medium text-brand-strong hover:underline"
                  >
                    Fill the rest from this
                  </button>
                )
              )}
            </div>
            <VoiceTextarea
              id="nr-note"
              rows={2}
              autoFocus
              value={note}
              onChange={(v) => {
                setNote(v);
                touch("note");
              }}
              onVoice={(r) => {
                setAiFrom("voice");
                applyAi(r);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
              placeholder="Type or tap the mic: “Room 214, shower's freezing, it's urgent”"
              className={cn(aiRing(filled.includes("note")))}
            />
            {ai && phase === "filled" && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-brand-strong">Filled in from your {aiFrom}.</span>
                {ai.originalText && (
                  <>
                    {" "}
                    Translated from {ai.language}: <span dir="auto">“{ai.originalText}”</span>
                  </>
                )}
                {ai.confidence === "low" && <span className="text-dot-red"> Not sure I heard that right, please check.</span>}
              </p>
            )}
            {aiError && <p className="text-xs text-dot-red">{aiError}</p>}
          </div>

          {ai?.safety && (
            <div className="gr-pop flex items-start gap-2 rounded-md border-l-4 border-dot-red bg-muted p-3 text-sm">
              <StatusOverdueIcon className="mt-0.5 size-4 shrink-0 text-dot-red" />
              <span>
                <span className="font-semibold">Possible safety risk.</span> Call the duty manager now. This request is
                marked urgent.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="nr-room" className="text-sm font-medium">
              Room
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="nr-room"
                inputMode="numeric"
                autoComplete="off"
                value={room}
                onChange={(e) => {
                  setRoom(e.target.value);
                  touch("room");
                }}
                placeholder="e.g. 214"
                className={cn("w-24", aiRing(filled.includes("room")))}
              />
              {rooms
                .filter((r) => r !== room)
                .slice(0, 5)
                .map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRoom(r);
                      touch("room");
                    }}
                    className="h-9 rounded-md border px-3 text-sm hover:bg-muted"
                  >
                    {r}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Common requests</span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {PRESETS.map((pr) => {
                const Icon = PRESET_ICON[pr.id];
                const active = preset === pr.id;
                return (
                  <button
                    key={pr.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setPreset(active ? null : pr.id);
                      setCategoryOverride(null);
                      touch("preset");
                    }}
                    className={cn(
                      "flex h-11 items-center gap-2 rounded-md border px-2.5 text-left text-sm hover:bg-muted",
                      active && "border-orchid bg-orchid-tint hover:bg-orchid-tint",
                      active && aiRing(filled.includes("preset")),
                    )}
                  >
                    <Icon className="size-6 shrink-0 text-muted-foreground" />
                    <span className="truncate">{pr.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Send to</span>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategoryOverride(c);
                  touch("category");
                }}
                className={cn(
                  "rounded-sm border px-2 py-0.5 text-xs",
                  category === c ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
                  category === c && aiRing(filled.includes("category")),
                )}
              >
                {c}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={urgent}
              onClick={() => {
                setUrgent((u) => !u);
                touch("urgent");
              }}
              className={cn(
                "ml-auto flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs",
                urgent ? "border-dot-red bg-dot-red text-white" : "text-muted-foreground hover:bg-muted",
                urgent && aiRing(filled.includes("urgent")),
              )}
            >
              <StatusOverdueIcon className="size-3.5" /> Urgent
            </button>
          </div>

          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button size="lg" disabled={!ready || saving} onClick={submit}>
              {saving ? "Creating…" : room.trim() ? `Create for room ${room.trim()}` : "Create request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
