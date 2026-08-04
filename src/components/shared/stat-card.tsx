import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The metric tile used on all three dashboards. Label above, value below,
 * optional trailing indicator and footer slot.
 */
export function StatCard({
  label,
  value,
  trailing,
  footer,
  className,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  trailing?: ReactNode;
  footer?: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("rounded-card border border-line bg-surface p-5 shadow-card", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        {trailing}
      </div>
      <p className={cn("mt-2 text-display-sm font-semibold text-ink", valueClassName)}>{value}</p>
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
