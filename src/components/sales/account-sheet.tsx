"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LogOut, X } from "lucide-react";
import { Avatar, Button, useToast } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_LABEL } from "@/lib/constants";

/**
 * Bottom sheet opened from the header avatar. The sales app has no sidebar,
 * so this is where account-level actions live.
 */
export function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const { notify } = useToast();

  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);

  /**
   * Held in a ref so the effect below doesn't depend on `onClose`'s identity.
   * The parent passes an inline arrow, which is a new function on every render;
   * without this the listener would be torn down and rebuilt on every unrelated
   * re-render (the unread-count query alone re-renders the header repeatedly).
   */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }

      // Keep Tab inside the sheet while it claims aria-modal
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the sheet — aria-modal is a lie without this
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      // Return focus to whatever opened the sheet
      (triggerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  const handleSignOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // Without this the sheet sits open with no explanation
      notify("Couldn't sign you out. Try again.", "error");
      onCloseRef.current();
    }
  }, [logout, notify]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end animate-fade-in">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-ink/40" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className="relative z-10 mx-auto w-full max-w-mobile rounded-t-[20px] bg-surface pb-safe animate-slide-up"
      >
        <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={user?.name ?? "User"} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-body-lg font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-body text-ink-muted">{user?.email}</p>
              {user && <p className="mt-0.5 text-meta text-ink-faint">{ROLE_LABEL[user.role]}</p>}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded p-1.5 text-ink-muted transition-colors hover:bg-surface-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-t border-line px-5 py-4">
         <Button size="block" className="text-white" onClick={() => void handleSignOut()}>
            <LogOut className="h-4 w-4 " aria-hidden />
            Sign out
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}