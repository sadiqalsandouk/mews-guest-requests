import { Suspense } from "react";
import type { Metadata } from "next";
import { CommandPalette } from "@/components/command-palette";
import { RequestPage } from "@/components/request-page";

export const metadata: Metadata = { title: "Request · Mews Guest Requests" };

export default function Page() {
  return (
    <Suspense>
      <RequestPage />
      <CommandPalette />
    </Suspense>
  );
}
