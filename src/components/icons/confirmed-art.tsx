import { IconBase, type IconProps } from "./base";

export function ConfirmedArt(props: IconProps) {
  return (
    <IconBase viewBox="0 0 120 120" width="120" height="120" className="size-[120px] shrink-0" strokeWidth="2.5" {...props}>
      <g data-part="badge" className="gr-pop" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="60" cy="60" r="33" fill="var(--mews-dot-green)" stroke="none" />
        <path d="m44 60 10 10 22-22" stroke="var(--background)" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g data-part="burst" className="gr-float" stroke="var(--mews-orchid)" strokeWidth="3" strokeLinecap="round">
        <path d="m18 35-4-4m88 4 4-4M60 14V9m-42 65-5 2m89-2 5 2" />
      </g>
    </IconBase>
  );
}
