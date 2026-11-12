import { IconBase, type IconProps } from "./base";

export function ReceivedArt(props: IconProps) {
  return (
    <IconBase viewBox="0 0 120 120" width="120" height="120" className="size-[120px] shrink-0" strokeWidth="2.5" {...props}>
      <path d="M35 77c6-7 7-14 7-26a18 18 0 0 1 36 0c0 12 1 19 7 26Z" fill="var(--mews-orchid-tint)" />
      <path d="M35 77c6-7 7-14 7-26a18 18 0 0 1 36 0c0 12 1 19 7 26Z" />
      <path d="M56 28h8M32 83h56" strokeLinecap="round" />
      <g data-part="clapper" className="gr-wiggle" style={{ transformOrigin: "60px 83px" }}>
        <path d="M54 88a6 6 0 0 0 12 0" stroke="var(--mews-orchid)" strokeWidth="4" strokeLinecap="round" />
      </g>
      <path d="M29 47c0-6 2-11 5-15m52 0c3 4 5 9 5 15" stroke="var(--mews-orchid)" strokeLinecap="round" />
    </IconBase>
  );
}
