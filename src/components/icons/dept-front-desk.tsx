import { IconBase, type IconProps } from "./base";

export function DeptFrontDeskIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="M4 17a8 8 0 0 1 16 0Z" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <path d="M4 17a8 8 0 0 1 16 0ZM2.5 21h19M12 9V5m-2-1h4" />
    </IconBase>
  );
}
