import { IconBase, type IconProps } from "./base";

export function PillowsIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="M5 4Q12 2 19 4q3 1 2 4-1 4 0 8 1 3-2 4-7 2-14 0-3-1-2-4 1-4 0-8-1-3 2-4Z" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <path d="M5 4Q12 2 19 4q3 1 2 4-1 4 0 8 1 3-2 4-7 2-14 0-3-1-2-4 1-4 0-8-1-3 2-4Z" /><path d="m6 7 1 1m10 8 1 1" />
    </IconBase>
  );
}
