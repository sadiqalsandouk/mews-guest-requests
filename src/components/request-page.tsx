"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BackIcon } from "@/components/icons";

import { AppNav } from "@/components/app-nav";
import { HotelMenu } from "@/components/hotel-menu";
import { MewsWordmark } from "@/components/mews-logo";
import { RequestDetail } from "@/components/request-detail";
import { requestKey, type GuestRequest } from "@/lib/requests";
import { useLive } from "@/lib/use-live";
import { useNow } from "@/lib/use-now";

// Full-page view of one request (Jira's /browse/KEY). Shareable link.
export function RequestPage() {
  const { id } = useParams<{ id: string }>();
  const { data: all } = useLive<GuestRequest[]>("/api/requests");
  const now = useNow();
  const r = all?.find((x) => x.id === id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card px-4 py-3">
        <AppNav />
        <Link href="/staff" aria-label="Requests board" className="shrink-0">
          <MewsWordmark className="h-3.5 w-auto" />
        </Link>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
          <Link href="/staff" className="text-muted-foreground hover:text-foreground">
            Requests
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="truncate font-mono text-xs font-medium">{requestKey({ id })}</span>
        </nav>
        <HotelMenu />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
        <Link href="/staff" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <BackIcon className="size-4" /> Back to board
        </Link>
        {!all || now === null ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : r ? (
          <RequestDetail r={r} all={all} now={now} />
        ) : (
          <div className="rounded-lg border p-6">
            <p className="font-medium">{requestKey({ id })} doesn&apos;t exist.</p>
            <p className="text-sm text-muted-foreground">It may have been removed when the demo data was reset.</p>
          </div>
        )}
      </main>
    </div>
  );
}
