import { MewsWordmark } from "@/components/mews-logo";
import { cn } from "@/lib/utils";

// Mews names products "Mews" + a plain descriptor (Operations, Payments,
// POS, Guest Messaging) under one master logo. This follows that pattern.
export const PRODUCT_NAME = "Mews Guest Requests";

export function ProductLockup({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <MewsWordmark className="h-3.5 w-auto" />
      <span className="h-4 w-px bg-current opacity-30" aria-hidden />
      <span className="font-medium tracking-tight">Guest Requests</span>
    </span>
  );
}
