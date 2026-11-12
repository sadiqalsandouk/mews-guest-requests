"use client";

import { useState } from "react";
import Link from "next/link";
import { CloseIcon } from "@/components/icons";

import { RequestDetail } from "@/components/request-detail";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { requestKey, type GuestRequest } from "@/lib/requests";

// Jira-style issue modal: opens over the board; the key and "Open full page"
// lead to /staff/requests/[id] (Cmd-click opens it in a new tab).
export function RequestModal({
  r,
  all,
  now,
  onClose,
  onChange,
}: {
  r: GuestRequest;
  all: GuestRequest[];
  now: number;
  onClose: () => void;
  onChange: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const href = `/staff/requests/${r.id}`;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-3rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none"
      >
        <DialogTitle className="sr-only">{`${requestKey(r)}: ${r.text}`}</DialogTitle>
        <DialogDescription className="sr-only">Request details, status and activity</DialogDescription>

        <div className="flex items-center gap-2 border-b px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">Requests</span>
          <span className="text-muted-foreground">/</span>
          <Link href={href} className="font-mono text-xs font-medium hover:underline" title="Open full page">
            {requestKey(r)}
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={async () => {
                await navigator.clipboard?.writeText(`${location.origin}${href}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {copied ? "Link copied" : "Copy link"}
            </button>
            <Link
              href={href}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Open full page
            </Link>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <RequestDetail r={r} all={all} now={now} onChange={onChange} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
