import { IconBase, type IconProps } from "./base";

export function LuggageIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <rect x="6" y="7" width="12" height="13" rx="2" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <path d="M9 7V4h6v3M6 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2ZM10 11v5m4-5v5M8 20v1m8-1v1" />
    </IconBase>
  );
}
