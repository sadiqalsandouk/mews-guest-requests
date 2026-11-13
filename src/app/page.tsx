import type { Metadata } from "next";
import { DemoLauncher } from "@/components/demo-launcher";

export const metadata: Metadata = { title: "Guest Requests · prototype demo" };

// Demo home: the QR code guests scan to open the guest app.
export default function Home() {
  return <DemoLauncher />;
}
