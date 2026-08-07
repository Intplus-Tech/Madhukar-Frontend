"use client";

import { FileText } from "lucide-react";

/**
 * The tab left behind when the review panel is minimised. Anchored to the
 * right edge so the user can return to a part-finished review at any time.
 */
export function DockedReviewTab({
  label,
  onRestore,
}: {
  label: string;
  onRestore: () => void;
}) {
  return (
    <button
      onClick={onRestore}
      className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-card border border-r-0 border-line bg-surface py-4 pl-4 pr-3 shadow-raised transition-colors hover:bg-surface-muted"
      aria-label={`Reopen order review for ${label}`}
    >
      <FileText className="h-4 w-4 text-ink-muted" aria-hidden />
      <span className="text-meta font-medium text-ink [writing-mode:vertical-rl] rotate-180">
        Resume {label}
      </span>
    </button>
  );
}
