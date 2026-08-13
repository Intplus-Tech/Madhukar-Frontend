"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CircleX, X } from "lucide-react";
import { Avatar, Badge, Button, Skeleton, Textarea, useToast } from "@/components/ui";
import { orderService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useAuth } from "@/providers/auth-provider";
import { formatDate, relativeTime } from "@/lib/utils";

/**
 * The Order Detail view, as a modal rather than its own page.
 *
 * Same content as the Figma detail frame — dealer information, line items with
 * their billing status, the internal note, and the feedback action — but it
 * opens over the order list so a manager keeps their place in the queue.
 */
export function OrderDetailModal({
  orderId,
  open,
  onClose,
}: {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [note, setNote] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: qk.order(orderId ?? ""),
    queryFn: () => orderService.getById(orderId!),
    enabled: Boolean(orderId) && open,
  });

  useEffect(() => {
    setNote("");
  }, [orderId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  /** From the admin view, feedback reaches the rep and the accounts team. */
  const sendFeedback = useMutation({
    mutationFn: () =>
      orderService.sendFeedback({
        orderId: orderId!,
        message: note.trim(),
        fromUserId: user!.id,
        fromRole: "admin",
        toRoles: ["sales", "accounts"],
        recipientIds: order?.salesRep.id ? [order.salesRep.id] : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      notify("Feedback sent to sales and accounts");
      setNote("");
      onClose();
    },
    onError: (err) =>
      notify(err instanceof Error ? err.message : "Couldn't send feedback.", "error"),
  });

  if (!open || typeof document === "undefined") return null;

  /*
    Once every line item is billed there's nothing left to act on, so both
    footer buttons go inactive. While anything is outstanding, both are live.
  */
  const allBilled = Boolean(order && order.items.length > 0 && order.items.every((i) => i.isBilled));
  const isComplete = order?.status === "completed" || allBilled;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-ink/40" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-[880px] flex-col overflow-hidden rounded-card bg-surface shadow-modal animate-slide-up"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <p className="text-meta text-ink-muted">Billing Queue</p>
            <h2 id="order-detail-title" className="mt-0.5 text-title font-bold text-ink">
              Order Detail: {order?.orderNumber ?? "—"}
            </h2>
            {order && (
              <p className="mt-1 text-body text-ink-muted">
                Placed on {formatDate(order.createdAt)} by {order.salesRep.name} (Sales Rep)
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-6 py-5">
          {isLoading || !order ? (
            <>
              <Skeleton className="h-32 w-full rounded-card" />
              <Skeleton className="h-48 w-full rounded-card" />
            </>
          ) : (
            <>
              <section className="rounded-card border border-line p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-body-lg font-semibold text-ink">Dealer Information</h3>
                  {order.priority === "urgent" && (
                    <Badge className="border border-danger text-danger">Urgent</Badge>
                  )}
                </div>

                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-meta text-ink-muted">Primary Contact</p>
                    <div className="mt-2 flex items-center gap-3">
                      <Avatar name={order.dealer.contactPerson ?? order.dealer.name} size="lg" />
                      <div className="min-w-0">
                        <p className="truncate text-body-lg font-semibold text-ink">
                          {order.dealer.contactPerson ?? order.dealer.name}
                        </p>
                        <p className="text-body text-ink-muted">
                          {order.dealer.phone ?? "No contact on file"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-meta text-ink-muted">Billing Address</p>
                    <p className="mt-2 text-eyebrow font-semibold uppercase tracking-wide text-ink">
                      {order.dealer.name}
                    </p>
                    <address className="mt-1 not-italic text-body text-ink-muted">
                      {order.dealer.address || "No address on file"}
                    </address>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-card border border-line">
                <header className="border-b border-line bg-success-soft/40 px-5 py-3">
                  <h3 className="text-body font-medium text-ink">
                    Line Items ({order.items.length})
                  </h3>
                </header>

                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[480px]">
                    <thead>
                      <tr>
                        <th scope="col" className="px-5 py-3 text-left text-meta font-medium text-ink-muted">
                          Item Name
                        </th>
                        <th scope="col" className="px-5 py-3 text-right text-meta font-medium text-ink-muted">
                          Qty
                        </th>
                        <th scope="col" className="px-5 py-3 text-left text-meta font-medium text-ink-muted">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-t border-line">
                          <td className="px-5 py-4 text-body text-ink">{item.productName}</td>
                          <td className="px-5 py-4 text-right text-body tabular-nums text-ink">
                            {item.quantity}
                          </td>
                          <td className="px-5 py-4">
                            {item.isBilled ? (
                              <span
                                className="inline-flex h-5 w-5 items-center justify-center rounded border-2 border-success bg-success-soft text-success"
                                aria-label="Billed"
                              >
                                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                              </span>
                            ) : (
                              <CircleX className="h-5 w-5 text-danger" aria-label="Not billed" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-card border border-line p-5">
                <label
                  htmlFor="internal-note"
                  className="text-eyebrow font-semibold uppercase tracking-wide text-ink"
                >
                  Internal order note
                </label>
                <Textarea
                  id="internal-note"
                  rows={4}
                  value={note || order.notes || ""}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add context for the sales rep and accounts team..."
                  className="mt-2"
                />
              </section>

              {order.feedback.length > 0 && (
                <section className="rounded-card border border-line p-5">
                  <h3 className="text-body-lg font-semibold text-ink">Feedback history</h3>
                  <ul className="mt-3 space-y-3">
                    {order.feedback.map((entry) => (
                      <li key={entry.id} className="rounded-field bg-surface-muted px-4 py-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-meta font-medium capitalize text-ink">
                            {entry.fromRole} → {entry.toRoles.join(", ")}
                          </span>
                          <span className="text-meta text-ink-faint">
                            {relativeTime(entry.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-body text-ink-muted">{entry.message}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <footer className="flex flex-col gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body text-ink-muted">
            {order?.billedAt
              ? `Last updated ${relativeTime(order.billedAt)}`
              : "No billing activity yet"}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" disabled={isComplete} onClick={onClose}>
              Save Draft
            </Button>
            <Button
              variant="navy"
              disabled={isComplete}
              loading={sendFeedback.isPending}
              onClick={() => {
                /*
                  Live whenever the order is outstanding. The note requirement
                  is enforced on click rather than by grey-ing out the button,
                  which otherwise reads as "this order can't be actioned".
                */
                if (!note.trim()) {
                  notify("Add a note before notifying the team.", "error");
                  return;
                }
                sendFeedback.mutate();
              }}
            >
              {isComplete ? "Order Completed" : "Process Billing & Notify Team"}
            </Button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
