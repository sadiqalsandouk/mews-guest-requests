import { IconBase, type IconProps } from "./base";

export function TaxiIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="M6 7h12l3 7H3Z" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <path d="M6 7h12l3 7v6H3v-6ZM3 14h18M9 7V3h6v4M5 20v2m14-2v2" /><path d="M6 17h2m8 0h2" />
    </IconBase>
  );
}
