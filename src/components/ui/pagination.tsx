"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (next: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = buildPages(page, totalPages);

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-body text-ink-muted">
        Showing {from} to {to} of {total} results
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1.5">
        <PageButton
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-ink-faint">
              …
            </span>
          ) : (
            <PageButton
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(p === page && "border-ink bg-ink text-ink-inverse")}
            >
              {p}
            </PageButton>
          ),
        )}

        <PageButton
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </PageButton>
      </nav>
    </div>
  );
}

function PageButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-9 min-w-9 items-center justify-center rounded border border-line bg-surface px-2 text-body text-ink",
        "transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

function buildPages(page: number, totalPages: number): Array<number | "…"> {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, "…", totalPages];
  if (page >= totalPages - 2) return [1, "…", totalPages - 2, totalPages - 1, totalPages];
  return [1, "…", page, "…", totalPages];
}
