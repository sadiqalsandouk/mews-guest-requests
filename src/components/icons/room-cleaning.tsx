import { IconBase, type IconProps } from "./base";

export function RoomCleaningIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="M7 10h7l3 9q.5 2-2 2H6q-2.5 0-2-2Z" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <path d="M7 10h7l3 9q.5 2-2 2H6q-2.5 0-2-2ZM9 10V6H7V3h10v3h-5m2 0 2 3" /><path d="M20 4h.1M21 8h.1" strokeWidth="2.5" />
    </IconBase>
  );
}
