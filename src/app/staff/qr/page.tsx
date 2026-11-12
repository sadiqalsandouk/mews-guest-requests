import type { Metadata } from "next";
import { QrPage } from "@/components/qr-page";

export const metadata: Metadata = { title: "Guest QR code · Mews Guest Requests" };

export default function Page() {
  return <QrPage />;
}
