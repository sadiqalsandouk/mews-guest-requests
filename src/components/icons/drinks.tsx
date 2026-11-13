import { IconBase, type IconProps } from "./base";

export function DrinksIcon(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" width="24" height="24" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="M4 10h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z" fill="var(--icon-accent, var(--mews-pink-light))" stroke="none" />
      <path d="M4 10h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5ZM16 12h1.5a2.5 2.5 0 0 1 0 5H16M8 3v4m4-4v4" />
    </IconBase>
  );
}
