"use client";

import { useRouter } from "next/navigation";
import { CheckIcon, ChevronDownIcon, SignOutIcon } from "@/components/icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HOTEL_NAME } from "@/lib/hotel";

// Top right: who's signed in and which property. Pages live in the hamburger.
export function HotelMenu() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ml-auto flex shrink-0 items-center gap-2 rounded-md py-1 pr-1.5 pl-1 text-sm font-medium hover:bg-muted data-popup-open:bg-muted">
        <span className="flex size-7 items-center justify-center rounded-full bg-orchid-tint text-xs font-semibold" aria-hidden>
          DM
        </span>
        <span className="max-sm:sr-only">{HOTEL_NAME}</span>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-1.5 py-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-orchid-tint text-sm font-semibold">DM</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Duty manager</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Property</DropdownMenuLabel>
          <DropdownMenuItem>
            <span className="flex-1">{HOTEL_NAME}</span>
            <CheckIcon className="text-orchid" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/staff")}>
          <SignOutIcon /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
