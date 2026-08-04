import { cn } from "@/lib/utils";

/**
 * Stand-in for the Lakshya 72 logo.
 * Drop the real artwork at /public/logo.svg and replace this component's body
 * with <Image src="/logo.svg" ... /> — nothing else references the mark.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 72"
      role="img"
      aria-label="Lakshya 72"
      className={cn("h-16 w-16", className)}
    >
      <circle cx="36" cy="36" r="34" fill="#F4C430" />
      <circle cx="36" cy="36" r="28" fill="#FFFFFF" />
      <circle cx="36" cy="36" r="21" fill="none" stroke="#1B4F9C" strokeWidth="3" />
      <circle cx="36" cy="36" r="13" fill="none" stroke="#1B4F9C" strokeWidth="3" />
      <circle cx="36" cy="36" r="5" fill="#C8102E" />
      <text
        x="36"
        y="59"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#1B4F9C"
        fontFamily="var(--font-display), sans-serif"
      >
        72
      </text>
    </svg>
  );
}
