import type { SVGProps } from 'react';

/** Geometric AnyLeet mark: angle-bracket DNA folded into an A. */
export function BrandMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    >
      <rect width="32" height="32" rx="7" fill="var(--color-signal)" />
      <path
        d="M8.2 22.5 15.1 8.4c.35-.72 1.4-.72 1.75 0l6.9 14.1"
        stroke="#140d0a"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.4 16.8h9.2"
        stroke="#140d0a"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M7 11.2 9.4 13.6 7 16"
        stroke="#fff6f1"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d="M25 11.2 22.6 13.6 25 16"
        stroke="#fff6f1"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}
