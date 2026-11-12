import { IconBase, type IconProps } from "./base";

export function ShowerWaterIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="M8 11a6 6 0 0 1 12 0Z" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <path d="M3 21V6a4 4 0 0 1 8-1M8 11a6 6 0 0 1 12 0Z" /><path d="M10 15v2m4-2v4m4-4v2" />
    </IconBase>
  );
}
