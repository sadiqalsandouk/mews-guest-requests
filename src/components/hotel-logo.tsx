// The fictional demo hotel's own mark, in the spirit of classic hotel crests:
// a navy badge, a gold arched doorway (the hotel's front door) with a keystone
// star, and a thin gold frame. Guest pages lead with the hotel's brand; Mews
// only signs off in the footer.
const NAVY = "#14213d";
const GOLD = "#c9a24a";

export function HotelLogo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="Hotel Run Well">
      <rect width="40" height="40" rx="9" fill={NAVY} />
      <rect x="2.75" y="2.75" width="34.5" height="34.5" rx="6.75" fill="none" stroke={GOLD} strokeWidth="0.6" opacity="0.65" />
      {/* Arched doorway, with a door line and two steps */}
      <path d="M13 31V19.5a7 7 0 0 1 14 0V31" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M17 31V21a3 3 0 0 1 6 0v10" fill={GOLD} opacity="0.25" />
      <path d="M20 18v13" stroke={GOLD} strokeWidth="0.6" opacity="0.8" />
      <path d="M10.5 31h19M12 33.3h16" stroke={GOLD} strokeWidth="1" strokeLinecap="round" />
      {/* Keystone star */}
      <path d="m20 6.2 1.05 2.15 2.35.34-1.7 1.66.4 2.35L20 11.6l-2.1 1.1.4-2.35-1.7-1.66 2.35-.34Z" fill={GOLD} />
    </svg>
  );
}

/** Logo + name, as in the guest app header. */
export function HotelBrand({ sub }: { sub: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <HotelLogo className="size-10 shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase leading-none tracking-[0.3em] text-[#9a7a2e]">Hotel</p>
        <p className="font-serif text-[17px] font-semibold leading-tight tracking-tight">Run Well</p>
        <div className="truncate text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

/** Logo + stacked wordmark, larger, for the QR welcome page. */
export function HotelWordmark() {
  return (
    <div className="flex items-center justify-center gap-3">
      <HotelLogo className="size-12" />
      <div className="text-start">
        <p className="text-[10px] font-semibold uppercase leading-none tracking-[0.35em] text-[#9a7a2e]">Hotel</p>
        <p className="font-serif text-2xl font-semibold leading-tight tracking-tight">Run Well</p>
      </div>
    </div>
  );
}
