import { IconBase, type IconProps } from "./base";

export function SomethingBrokenIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="M5 7h10v4a5 5 0 0 1-10 0Z" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <path d="M5 7h10v4a5 5 0 0 1-10 0ZM7 7V3m6 4V3M10 16v5" /><path d="m21 5-3 5 3 3-3 5" />
    </IconBase>
  );
}
