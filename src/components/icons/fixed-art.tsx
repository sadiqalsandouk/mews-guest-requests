import { IconBase, type IconProps } from "./base";

export function FixedArt(props: IconProps) {
  return (
    <IconBase viewBox="0 0 120 120" width="120" height="120" className="size-[120px] shrink-0" strokeWidth="2.5" {...props}>
      <g data-part="badge" className="gr-pop" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="60" cy="60" r="33" fill="var(--mews-orchid-tint)" />
        <path d="m44 60 10 10 22-22" strokeWidth="4" strokeLinecap="round" />
      </g>
    </IconBase>
  );
}
