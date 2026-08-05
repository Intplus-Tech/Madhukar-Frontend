"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, CircleX } from "lucide-react";
import { Avatar, Badge, Button, EmptyState, Skeleton, Textarea, useToast } from "@/components/ui";
import { orderService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useAuth } from "@/providers/auth-provider";
import { formatDate, relativeTime } from "@/lib/utils";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [note, setNote] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: qk.order(id),
    queryFn: () => orderService.getById(id),
  });

  /**
   * The walkthrough: from the admin detail view, feedback reaches both the
   * accounts team and the sales rep.
   */
  const sendFeedback = useMutation({
    mutationFn: () =>
      orderService.sendFeedback({
        orderId: id,
        message: note.trim(),
        fromUserId: user!.id,
        fromRole: "admin",
        toRoles: ["sales", "accounts"],
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.order(id) });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      notify("Feedback sent to sales and accounts");
      setNote("");
    },
    onError: () => notify("Couldn't send feedback. Try again.", "error"),
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order may have been removed. Head back to the queue."
        action={
          <Link href="/admin/orders">
            <Button variant="secondary">Back to sales orders</Button>
          </Link>
        }
      />
    );
  }

  const isComplete = order.status === "completed";

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-body text-ink-muted">
        <Link href="/admin/orders" className="hover:text-ink">
          Billing Queue
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden />
        <span className="text-info">{order.orderNumber}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-display-sm font-semibold text-ink">
            Order Detail: {order.orderNumber}
          </h1>
          <p className="mt-1 text-body text-ink-muted">
            Placed on {formatDate(order.createdAt)} by {order.salesRep.name} (Sales Rep)
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.back()} className="text-black bg-white">
          Back
        </Button>
      </div>

      <section className="rounded-card border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-body-lg font-semibold text-ink">Dealer Information</h2>
          {order.priority === "urgent" && (
            <Badge className="border border-danger text-danger">Urgent</Badge>
          )}
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-meta text-ink-muted">Primary Contact</p>
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={order.dealer.contactPerson ?? order.dealer.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-body-lg font-semibold text-ink">
                  {order.dealer.contactPerson ?? "—"}
                </p>
                <p className="text-body text-ink-muted">Procurement Director</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-meta text-ink-muted">Billing Address</p>
            <p className="mt-2 text-eyebrow font-semibold uppercase tracking-wide text-ink">
              {order.dealer.name}
            </p>
            <address className="mt-1 not-italic text-body text-ink-muted">
              {order.dealer.address}
            </address>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-card border border-line bg-surface">
        <header className="border-b border-line bg-success-soft/40 px-5 py-3">
          <h2 className="text-body font-medium text-ink">Line Items ({order.items.length})</h2>
        </header>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[520px]">
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

      <section className="rounded-card border border-line bg-surface p-5">
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
        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="text-body-lg font-semibold text-ink">Feedback history</h2>
          <ul className="mt-3 space-y-3">
            {order.feedback.map((entry) => (
              <li key={entry.id} className="rounded-field bg-surface-muted px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-meta font-medium capitalize text-ink">
                    {entry.fromRole} → {entry.toRoles.join(", ")}
                  </span>
                  <span className="text-meta text-ink-faint">{relativeTime(entry.createdAt)}</span>
                </div>
                <p className="mt-1 text-body text-ink-muted">{entry.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body text-ink-muted">
          {order.billedAt
            ? `Last updated ${relativeTime(order.billedAt)}`
            : "No billing activity yet"}
        </p>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" className="text-black bg-white">Save Draft</Button>
          <Button
            variant="navy"
            disabled={isComplete || !note.trim()}
            loading={sendFeedback.isPending}
            onClick={() => sendFeedback.mutate()}
          >
            {isComplete ? "Order completed" : "Send feedback & notify team"}
          </Button>
        </div>
      </footer>
    </div>
  );
}
