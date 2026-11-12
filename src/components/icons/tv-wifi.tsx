import { IconBase, type IconProps } from "./base";

export function TvWifiIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <rect x="3" y="8" width="18" height="11" rx="2" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <rect x="3" y="8" width="18" height="11" rx="2" /><path d="M8 22h8m-4-3v3M7 4q5-4 10 0m-7 2q2-2 4 0" />
    </IconBase>
  );
}
