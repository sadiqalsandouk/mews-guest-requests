import { IconBase, type IconProps } from "./base";

export function OnTheWayArt(props: IconProps) {
  return (
    <IconBase viewBox="0 0 120 120" width="120" height="120" className="size-[120px] shrink-0" strokeWidth="2.5" {...props}>
      <path d="M20 88h78" stroke="var(--mews-orchid)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
      <rect x="83" y="29" width="25" height="49" rx="2" fill="var(--mews-orchid-tint)" />
      <path d="M87 78V34l17-5v49M99 55h2" strokeLinecap="round" />
      <path d="M79 79h33" strokeLinecap="round" />
      <g data-part="traveller" className="gr-travel">
        <rect x="7" y="41" width="30" height="37" rx="8" fill="var(--background)" />
        <rect x="16" y="37" width="12" height="7" rx="3.5" fill="var(--mews-orchid)" stroke="none" />
        <circle cx="22" cy="54" r="5" fill="currentColor" stroke="none" />
        <path d="M13 70a9 9 0 0 1 18 0Z" fill="currentColor" stroke="none" />
      </g>
    </IconBase>
  );
}
