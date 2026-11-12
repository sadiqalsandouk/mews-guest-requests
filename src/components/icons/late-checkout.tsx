import { IconBase, type IconProps } from "./base";

export function LateCheckoutIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="M6 9h12v10q0 2-2 2H8q-2 0-2-2Z" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <path d="M6 9V6a6 6 0 0 1 12 0v13q0 2-2 2H8q-2 0-2-2V9h6" /><circle cx="12" cy="5.5" r="2" /><circle cx="12" cy="14.5" r="3.5" /><path d="M12 12.5v2h1.5" />
    </IconBase>
  );
}
