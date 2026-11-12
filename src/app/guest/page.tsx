import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { DemoExit } from "@/components/demo-exit";
import { GuestApp } from "@/components/guest-app";
import { HOTEL_NAME } from "@/lib/hotel";

export const metadata: Metadata = { title: `Your request · ${HOTEL_NAME}` };
export const viewport: Viewport = { themeColor: "#1c1b1c" };

// The page a guest reaches by scanning the QR code in their room.
export default function GuestPage() {
  // Exactly one screen tall: header and footer stay put, only the middle scrolls if it must.
  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden sm:my-8 sm:h-[calc(100dvh-4rem)] sm:rounded-xl sm:border sm:shadow-sm">
      <Suspense>
        <GuestApp />
      </Suspense>
      <DemoExit />
    </main>
  );
}
