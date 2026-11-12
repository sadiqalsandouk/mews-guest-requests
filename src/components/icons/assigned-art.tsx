import { IconBase, type IconProps } from "./base";

export function AssignedArt(props: IconProps) {
  return (
    <IconBase viewBox="0 0 120 120" width="120" height="120" className="size-[120px] shrink-0" strokeWidth="2.5" {...props}>
      <g data-part="badge" className="gr-float">
        <rect x="33" y="27" width="54" height="68" rx="12" fill="var(--mews-orchid-tint)" />
        <rect x="49" y="21" width="22" height="12" rx="6" fill="var(--mews-orchid)" stroke="none" />
        <circle cx="60" cy="52" r="8" fill="currentColor" stroke="none" />
        <path d="M45 76v-3a15 15 0 0 1 30 0v3Z" fill="currentColor" stroke="none" />
        <path d="M51 85h18" stroke="var(--mews-orchid)" strokeLinecap="round" />
      </g>
    </IconBase>
  );
}
