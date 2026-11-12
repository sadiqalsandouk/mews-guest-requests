"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const noop = () => () => {};
const canRecord = () =>
  typeof window !== "undefined" &&
  window.isSecureContext &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof MediaRecorder !== "undefined";

const MAX_MS = 30_000;

// Whether this browser can record here (needs https or localhost).
export const useCanRecord = () => useSyncExternalStore(noop, canRecord, () => false);

// Records a short voice note with the browser's microphone (works in Chrome,
// Safari, Firefox on https or localhost) and hands back the audio.
export function useRecorder(onAudio: (blob: Blob) => void) {
  const supported = useSyncExternalStore(noop, canRecord, () => false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const onAudioRef = useRef(onAudio);

  useEffect(() => {
    onAudioRef.current = onAudio;
  }, [onAudio]);

  const stop = useCallback(() => {
    if (recRef.current?.state === "recording") recRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone is blocked. Allow it in the browser, or type instead.");
      return;
    }
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const started = Date.now();
    const tick = setInterval(() => {
      const ms = Date.now() - started;
      setSeconds(Math.floor(ms / 1000));
      if (ms > MAX_MS) rec.stop();
    }, 250);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      clearInterval(tick);
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
      if (blob.size > 0 && Date.now() - started > 600) onAudioRef.current(blob);
    };
    recRef.current = rec;
    setSeconds(0);
    setRecording(true);
    rec.start();
  }, []);

  useEffect(() => () => recRef.current?.stream.getTracks().forEach((t) => t.stop()), []);

  return { supported, recording, seconds, error, start, stop };
}
