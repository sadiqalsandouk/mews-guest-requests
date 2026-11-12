import { IconBase, type IconProps } from "./base";

export function TowelsIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <rect x="3" y="5" width="18" height="6" rx="3" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <rect x="3" y="5" width="18" height="6" rx="3" /><path d="M18 14H6a3 3 0 0 0 0 6h12a3 3 0 0 0 0-6ZM17 8h4m-4 9h4" />
    </IconBase>
  );
}
