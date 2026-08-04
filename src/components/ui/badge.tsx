import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  uppercase = true,
}: {
  children: ReactNode;
  className?: string;
  uppercase?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-eyebrow font-semibold",
        uppercase && "uppercase tracking-wide",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Rounded pill used for visit outcomes on the sales Report screen. */
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 text-meta font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}
