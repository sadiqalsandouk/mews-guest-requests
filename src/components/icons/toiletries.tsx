import { IconBase, type IconProps } from "./base";

export function ToiletriesIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <rect x="5" y="9" width="8" height="12" rx="2" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <path d="M7 9V6h4v3M8 3h3v3M5 11a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2ZM16 13h3v8h-3ZM17.5 13v-2" />
    </IconBase>
  );
}
