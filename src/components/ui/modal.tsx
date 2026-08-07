"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  eyebrow,
  title,
  children,
  footer,
  className,
  /** When false, clicking the backdrop and pressing Escape leave the panel open. */
  dismissOnBackdrop = true,
  /** Renders a minimise control beside the close button. */
  onMinimise,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  dismissOnBackdrop?: boolean;
  onMinimise?: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // A docked review panel shouldn't vanish on a stray Escape
      if (onMinimise) onMinimise();
      else if (dismissOnBackdrop) onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, dismissOnBackdrop, onMinimise]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      {/*
        Clicking away dismisses the panel, but a review session isn't thrown
        out: when `onMinimise` is supplied the panel docks to the right edge
        with its ticked items and note intact, so the user can pick it back up.
      */}
      <button
        aria-label={onMinimise ? "Minimise dialog" : "Close dialog"}
        onClick={onMinimise ?? (dismissOnBackdrop ? onClose : undefined)}
        disabled={!onMinimise && !dismissOnBackdrop}
        className="absolute inset-0 bg-ink/30 backdrop-blur-[1px] disabled:cursor-default"
      />

      {/*
        Figma shows this anchored to the right edge on desktop and filling the
        screen on mobile, so it behaves as a sheet on small viewports.
      */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "relative z-10 ml-auto flex h-full w-full flex-col bg-surface shadow-modal outline-none",
          "sm:max-w-[520px] sm:animate-slide-in-right",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line bg-surface-muted px-5 py-4">
          <div>
            {eyebrow && <p className="text-meta text-ink-muted">{eyebrow}</p>}
            <h2 className="mt-0.5 text-eyebrow font-semibold uppercase tracking-[0.08em] text-ink">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {onMinimise && (
              <button
                onClick={onMinimise}
                aria-label="Minimise to side"
                title="Minimise — reopen from the tab on the right"
                className="rounded p-1 text-ink-muted transition-colors hover:bg-line-faint hover:text-ink"
              >
                <Minus className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded p-1 text-ink transition-colors hover:bg-line-faint"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5">{children}</div>

        {footer && (
          <footer className="border-t border-line bg-surface px-5 py-4 pb-safe">{footer}</footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
