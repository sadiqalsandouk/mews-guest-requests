import type { Metadata } from "next";
import { CommandPalette } from "@/components/command-palette";
import { SettingsPage } from "@/components/settings-page";

export const metadata: Metadata = { title: "Settings · Mews Guest Requests" };

export default function Settings() {
  return (
    <>
      <SettingsPage />
      <CommandPalette />
    </>
  );
}
