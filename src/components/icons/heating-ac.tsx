import { IconBase, type IconProps } from "./base";

export function HeatingAcIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <rect x="2.5" y="3" width="19" height="10" rx="3" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <rect x="2.5" y="3" width="19" height="10" rx="3" /><path d="M6 10h12M6 16q3 2 0 5m6-5q3 2 0 5m6-5q3 2 0 5" />
    </IconBase>
  );
}
