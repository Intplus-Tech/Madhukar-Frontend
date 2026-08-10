"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Shown when a query fails. Without this a rejected request leaves the page
 * showing its loading skeleton forever, which reads as a hang.
 */
export function QueryError({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const status = error instanceof ApiRequestError ? error.status : undefined;

  const message =
    status === 403
      ? "Your account doesn't have permission to view this."
      : status === 401
        ? "Your session has expired. Sign in again."
        : error instanceof ApiRequestError
          ? error.message
          : "We couldn't load this. Check your connection and try again.";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <AlertTriangle className="h-6 w-6 text-danger" aria-hidden />
      <div>
        <p className="text-body font-medium text-ink">Couldn&apos;t load this section</p>
        <p className="mt-1 text-meta text-ink-muted">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}
