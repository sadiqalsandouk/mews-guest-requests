import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { GuestApp } from "@/components/guest-app";
import { PhoneFrame } from "@/components/phone-frame";
import { HOTEL_NAME } from "@/lib/hotel";

export const metadata: Metadata = { title: `Your request · ${HOTEL_NAME}` };
export const viewport: Viewport = { themeColor: "#1c1b1c" };

// The page a guest reaches by scanning the QR code in their room.
// A separate product from the staff app: no links back into it.
export default function GuestPage() {
  // Exactly one screen tall: header and footer stay put, only the middle scrolls if it must.
  return (
    <PhoneFrame>
      <Suspense>
        <GuestApp />
      </Suspense>
    </PhoneFrame>
  );
}
