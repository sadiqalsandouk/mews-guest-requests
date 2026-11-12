import { IconBase, type IconProps } from "./base";

export function DeptHousekeepingIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="M3 10h18v9H3Z" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <path d="M3 21V5q0-2 2-2h14q2 0 2 2v16M3 10h18v9H3m12-9v6l6-6" /><path d="M7 7h3m4 0h3" />
    </IconBase>
  );
}
