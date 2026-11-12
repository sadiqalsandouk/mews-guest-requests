import type { SVGProps } from "react";
export type IconProps = SVGProps<SVGSVGElement> & { title?: string };
export function IconBase({ title, children, className = "size-4", ...props }: IconProps) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className={className} {...props} aria-hidden={title ? undefined : true} role={title ? "img" : undefined} aria-label={title || undefined}>{title && <title>{title}</title>}{children}</svg>;
}
