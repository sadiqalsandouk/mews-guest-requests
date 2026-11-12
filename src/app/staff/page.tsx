import { Suspense } from "react";
import type { Metadata } from "next";
import { CommandPalette } from "@/components/command-palette";
import { StaffBoard } from "@/components/staff-board";

export const metadata: Metadata = { title: "Staff · Mews Guest Requests" };

// Full-screen staff app: desktop first (front desk computers), works on phones too.
export default function StaffPage() {
  return (
    <Suspense>
      <StaffBoard fullScreen />
      <CommandPalette />
    </Suspense>
  );
}
