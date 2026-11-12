"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BackIcon } from "@/components/icons";

const noopSubscribe = () => () => {};
// Hidden if the guest page is embedded in a frame.
const isTopWindow = () => window.self === window.top;

export const useIsTopWindow = () => useSyncExternalStore(noopSubscribe, isTopWindow, () => false);

// Demo-only way back to the staff app: a small button, or Esc.
export function DemoExit() {
  const router = useRouter();
  const show = useIsTopWindow();

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target as HTMLElement).closest("input, textarea")) router.push("/staff");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, router]);

  if (!show) return null;
  return (
    <button
      onClick={() => router.push("/staff")}
      className="fixed top-4 left-4 z-50 flex max-sm:hidden items-center gap-1.5 rounded-full border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur hover:text-foreground"
    >
      <BackIcon className="size-3.5" /> Back to staff view
      <kbd className="hidden rounded-sm border px-1 text-[10px] sm:inline">Esc</kbd>
    </button>
  );
}
