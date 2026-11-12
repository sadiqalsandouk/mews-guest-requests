"use client";

import { useState } from "react";
import { DictateIcon } from "@/components/icons";

import type { ParsedRequest } from "@/lib/ai";
import { useRecorder } from "@/lib/use-recorder";
import { cn } from "@/lib/utils";

// A text box with a mic in the corner (like WhatsApp or ChatGPT).
// Tap the mic, speak in any language, tap stop: the AI turns it into a
// request. Typing works as normal.
export function VoiceTextarea({
  id,
  value,
  onChange,
  onVoice,
  placeholder,
  rows = 3,
  className,
  autoFocus,
  onKeyDown,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  onVoice: (r: ParsedRequest) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
}) {
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorder = useRecorder(async (blob) => {
    setThinking(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("audio", blob, "voice");
      const res = await fetch("/api/ai/parse", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onVoice(json);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't catch that. Try again or type it.");
    } finally {
      setThinking(false);
    }
  });

  const busy = recorder.recording || thinking;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          "relative rounded-md border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          recorder.recording && "border-orchid ring-3 ring-orchid/30",
          className,
        )}
      >
        <textarea
          id={id}
          dir="auto"
          rows={rows}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          readOnly={busy}
          className={cn(
            "block w-full resize-none rounded-md bg-transparent p-3 pr-14 text-base outline-none placeholder:text-muted-foreground",
            busy && "opacity-0",
          )}
        />

        {/* While listening or transcribing, the field shows what's happening */}
        {busy && (
          <div className="absolute inset-0 flex items-center gap-3 p-3 pr-14" aria-live="polite">
            {recorder.recording ? (
              <>
                <span className="size-2 shrink-0 animate-pulse rounded-full bg-dot-red" aria-hidden />
                <span className="text-sm font-medium">Listening</span>
                <span className="flex h-5 flex-1 items-center gap-0.5 overflow-hidden" aria-hidden>
                  {Array.from({ length: 24 }, (_, i) => (
                    <span
                      key={i}
                      className="gr-float w-0.5 shrink-0 rounded-full bg-orchid"
                      style={{ height: 4 + ((i * 7) % 13), animationDelay: `${(i % 6) * 0.1}s`, animationDuration: "0.7s" }}
                    />
                  ))}
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  0:{String(recorder.seconds).padStart(2, "0")}
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium">Transcribing…</span>
                <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span className="gr-shimmer block h-full w-full bg-gradient-to-r from-transparent via-orchid/60 to-transparent" />
                </span>
              </>
            )}
          </div>
        )}

        {recorder.supported && (
          <button
            type="button"
            onClick={recorder.recording ? recorder.stop : recorder.start}
            disabled={thinking}
            aria-label={recorder.recording ? "Stop recording" : "Speak instead"}
            title={recorder.recording ? "Stop" : "Speak (any language)"}
            className={cn(
              "absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full transition-colors disabled:opacity-50",
              recorder.recording
                ? "bg-dot-red text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {recorder.recording ? <span className="size-3 rounded-[3px] bg-white" /> : <DictateIcon className="size-5" />}
          </button>
        )}
      </div>
      {(error || recorder.error) && <p className="text-xs text-dot-red">{error ?? recorder.error}</p>}
    </div>
  );
}
