"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RequestsBoardIcon, MenuIcon, ResetDemoIcon, SettingsIcon, GuestViewIcon, CloseIcon, DeleteIcon } from "@/components/icons";

import { MewsWordmark } from "@/components/mews-logo";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { HOTEL_NAME } from "@/lib/hotel";
import { HotelLogo } from "@/components/hotel-logo";
import { removeAllRequests } from "@/lib/use-live";
import { cn } from "@/lib/utils";

let resetSeq = 0;

const PAGES = [
  { href: "/staff", label: "Requests", icon: RequestsBoardIcon },
  { href: "/staff/settings", label: "Settings", icon: SettingsIcon },
];

// The guest app is a separate product, opened from the demo home page, not from here.
const DEMO = [{ href: "/", label: "Demo home", icon: GuestViewIcon }];

// Hamburger + slide-in side panel: where you go (pages), like the Mews PMS.
export function AppNav() {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const item = (active: boolean) =>
    cn(
      "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm",
      active ? "bg-orchid-tint font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  const reset = async () => {
    await fetch("/api/reset", { method: "POST" });
    setOpen(false);
    router.push(`/staff?week=0&tab=open&t=reset${++resetSeq}`);
  };

  // Two clicks, so a stray tap mid-demo doesn't empty the board.
  const clearAll = async () => {
    if (!confirmClear) return setConfirmClear(true);
    await removeAllRequests();
    setConfirmClear(false);
    setOpen(false);
    router.push(`/staff?week=0&tab=open&t=reset${++resetSeq}`);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="-ml-1.5 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <MenuIcon className="size-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 flex h-dvh w-72 max-w-[85vw] translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-xs data-open:zoom-in-100 data-open:slide-in-from-left data-closed:zoom-out-100 data-closed:slide-out-to-left"
        >
          <DialogTitle className="sr-only">Menu</DialogTitle>
          <DialogDescription className="sr-only">Pages and demo tools</DialogDescription>
          <div className="flex items-center justify-between border-b px-4 py-3.5">
            <MewsWordmark className="h-3.5 w-auto" />
            <DialogClose aria-label="Close menu" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
              <CloseIcon className="size-4" />
            </DialogClose>
          </div>

          <div className="border-b px-4 py-3">
            <p className="text-xs text-muted-foreground">Property</p>
            <p className="flex items-center gap-2 font-medium">
              <HotelLogo className="size-6" /> {HOTEL_NAME}
            </p>
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
            <p className="px-3 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">Guest Requests</p>
            {PAGES.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)} className={item(active)} aria-current={active ? "page" : undefined}>
                  {active && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-orchid" aria-hidden />}
                  <Icon className="size-4" /> {label}
                </Link>
              );
            })}

            <p className="mt-4 px-3 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">Demo</p>
            {DEMO.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className={item(pathname === href.split("?")[0])}>
                <Icon className="size-4" /> {label}
              </Link>
            ))}
            <button onClick={reset} className={item(false)}>
              <ResetDemoIcon className="size-4" /> Reset demo data
            </button>
            <button
              onClick={clearAll}
              onBlur={() => setConfirmClear(false)}
              className={cn(item(false), confirmClear && "bg-dot-red font-medium text-white hover:bg-dot-red hover:text-white")}
            >
              <DeleteIcon className="size-4" /> {confirmClear ? "Click again to delete all" : "Delete all requests"}
            </button>
          </nav>

          <p className="border-t px-4 py-3 text-xs text-muted-foreground">Concept prototype · mock data</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
