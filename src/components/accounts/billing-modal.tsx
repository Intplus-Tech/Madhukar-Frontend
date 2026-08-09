"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CircleX } from "lucide-react";
import { Avatar, Badge, Button, Modal, Skeleton, Textarea, useToast } from "@/components/ui";
import { orderService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useAuth } from "@/providers/auth-provider";
import { cn, formatDate } from "@/lib/utils";

/**
 * Accounts ticks the line items they were able to bill.
 *  - all ticked  → "Confirm order"           → order becomes Completed
 *  - some missed → "Send feedback to Sales"  → order becomes Blocked, rep notified
 *
 * The footer button changes identity based on that state, exactly as the two
 * Figma frames show.
 */
export function BillingModal({
  orderId,
  open,
  onClose,
  onMinimise,
  onAdvance,
  queuePosition,
}: {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
  /** Docks the panel instead of discarding it. */
  onMinimise?: () => void;
  /** Called after a successful confirm/feedback so the queue can load the next order. */
  onAdvance?: () => boolean;
  /** e.g. { index: 3, total: 84 } — shown in the header. */
  queuePosition?: { index: number; total: number };
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const [billed, setBilled] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: qk.order(orderId ?? ""),
    queryFn: () => orderService.getById(orderId!),
    enabled: Boolean(orderId) && open,
  });

  // Pre-tick anything already billed when the order loads
  useEffect(() => {
    if (!order) return;
    setBilled(new Set(order.items.filter((i) => i.isBilled).map((i) => i.id)));
    setNote("");
  }, [order]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["orders"] });
    void queryClient.invalidateQueries({ queryKey: qk.accountsOverview });
  };

  const confirm = useMutation({
    mutationFn: () =>
      orderService.confirmBilling({ orderId: orderId!, billedItemIds: [...billed], note }),
    onSuccess: () => {
      invalidate();
      notify("Order confirmed");
      // Stay open and pull in the next bill; only close if the queue is empty
      const advanced = onAdvance?.() ?? false;
      if (!advanced) onClose();
    },
    onError: () => notify("Couldn't confirm the order. Try again.", "error"),
  });

  const sendFeedback = useMutation({
    mutationFn: () =>
      orderService.sendFeedback({
        orderId: orderId!,
        message:
          note.trim() ||
          "Some items could not be billed. Check stock availability and confirm with the dealer.",
        fromUserId: user!.id,
        fromRole: "accounts",
        toRoles: ["sales"],
      }),
    onSuccess: () => {
      invalidate();
      notify("Feedback sent to the sales rep");
      const advanced = onAdvance?.() ?? false;
      if (!advanced) onClose();
    },
    onError: () => notify("Couldn't send feedback. Try again.", "error"),
  });

  const allBilled = Boolean(order && order.items.every((i) => billed.has(i.id)));
  const noneBilled = billed.size === 0;

  function toggleItem(id: string) {
    setBilled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissOnBackdrop={false}
      onMinimise={onMinimise}
      eyebrow={
        order ? (
          <span className="flex items-center gap-2">
            {formatDate(order.createdAt)}
            {queuePosition && (
              <span className="text-meta text-ink-faint">
                · {queuePosition.index} of {queuePosition.total}
              </span>
            )}
          </span>
        ) : undefined
      }
      title="Order Review & Billing"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex-1 rounded-none" onClick={onClose}>
            Cancel
          </Button>
          {allBilled ? (
            <Button
              variant="success"
              className="flex-1 rounded-none"
              loading={confirm.isPending}
              onClick={() => confirm.mutate()}
            >
              Confirm order
            </Button>
          ) : (
            <Button
              variant="danger"
              className="flex-1 rounded-none text-white"
              disabled={noneBilled && !note.trim()}
              loading={sendFeedback.isPending}
              onClick={() => sendFeedback.mutate()}
            >
              Send feedback to Sales
            </Button>
          )}
        </div>
      }
    >
      {isLoading || !order ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-none" />
          <Skeleton className="h-40 w-full rounded-none" />
          <Skeleton className="h-32 w-full rounded-none" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-none bg-surface-muted px-4 py-3">
            <p className="text-meta text-ink-muted">Account Rep</p>
            <p className="mt-0.5 text-body-lg font-semibold text-ink">{order.salesRep.name}</p>
          </div>

          <section className="rounded-none border border-line p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-body-lg font-semibold text-ink">Dealer Information</h3>
              {order.priority === "urgent" && (
                <Badge className="bg-danger-soft text-danger-ink">Urgent</Badge>
              )}
            </div>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
                  Primary contact
                </p>
                <div className="mt-2 flex items-center gap-2.5">
                  <Avatar name={order.dealer.contactPerson ?? order.dealer.name} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold text-ink">
                      {order.dealer.contactPerson ?? "—"}
                    </p>
                    <p className="text-meta text-ink-muted">Procurement Director</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
                  Billing address
                </p>
                <p className="mt-2 text-eyebrow font-semibold uppercase tracking-wide text-ink">
                  {order.dealer.name}
                </p>
                <address className="mt-1 not-italic text-body text-ink-muted">
                  {order.dealer.address}
                </address>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-eyebrow font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Line items
            </h3>

            <div className="mt-3 grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-line pb-2 rounded-none">
              <span className="text-meta text-ink-muted">Item</span>
              <span className="text-meta text-ink-muted">Qty</span>
              <span className="text-meta text-ink-muted">Status</span>
            </div>

            <ul className="mt-2 space-y-2">
              {order.items.map((item) => {
                const isBilled = billed.has(item.id);
                return (
                  <li
                    key={item.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 rounded-none border border-line px-3.5 py-3"
                  >
                    <span className="min-w-0 truncate text-body text-ink">{item.productName}</span>
                    <span className="text-body tabular-nums text-ink">{item.quantity}</span>

                    <span className="flex items-center gap-2">
                      <button
                        role="checkbox"
                        aria-checked={isBilled}
                        aria-label={`Mark ${item.productName} as billed`}
                        onClick={() => toggleItem(item.id)}
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                          isBilled
                            ? "border-success bg-success-soft text-success"
                            : "border-warning bg-transparent",
                        )}
                      >
                        {isBilled && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </button>

                      {!isBilled && (
                        <CircleX
                          className="h-4 w-4 text-danger"
                          aria-label="Not billed"
                        />
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-none border border-line p-4 ">
            <label
              htmlFor="order-note"
              className="text-eyebrow font-semibold uppercase tracking-wide text-ink rounded-none"
            >
              Order note
            </label>
            <Textarea
              id="order-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add specific billing instructions..."
              className="mt-2 bg-surface-muted rounded-none"
            />
            {!allBilled && (
              <p className="mt-2 text-meta text-ink-muted">
                This note is sent to the sales rep along with the unbilled items.
              </p>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
