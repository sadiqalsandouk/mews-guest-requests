import { IconBase, type IconProps } from "./base";

export function DeptMaintenanceIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="M13 3a6 6 0 0 0-2 8l2 2a6 6 0 0 0 8-7l-4 4-3-3 3-4Z" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <path d="M13 3a6 6 0 0 0-2 8l-7.5 7.5a2.1 2.1 0 0 0 3 3L14 14a6 6 0 0 0 7-8l-4 4-3-3 3-4Z" />
    </IconBase>
  );
}
