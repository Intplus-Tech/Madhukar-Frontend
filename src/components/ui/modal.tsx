"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  eyebrow,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
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
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-ink transition-colors hover:bg-line-faint"
          >
            <X className="h-5 w-5" />
          </button>
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
