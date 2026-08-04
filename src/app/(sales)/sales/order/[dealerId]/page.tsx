"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Search, Store, Trash2, MapPin } from "lucide-react";
import { BackHeader } from "@/components/layout";
import { Button, Card, EmptyState, Input, Skeleton, useToast } from "@/components/ui";
import { dealerService, orderService, productService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useAuth } from "@/providers/auth-provider";
import { cn, formatCurrency } from "@/lib/utils";
import type { OrderPriority } from "@/types/domain";

interface Line {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export default function ComposeOrderPage({
  params,
}: {
  params: Promise<{ dealerId: string }>;
}) {
  const { dealerId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const [itemQuery, setItemQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [priority, setPriority] = useState<OrderPriority>("medium");

  const { data: dealer, isLoading } = useQuery({
    queryKey: qk.dealer(dealerId),
    queryFn: () => dealerService.getById(dealerId),
  });

  const { data: products } = useQuery({
    queryKey: qk.products(itemQuery),
    queryFn: () => productService.search(itemQuery),
    enabled: itemQuery.trim().length > 0,
  });

  const suggestions = useMemo(
    () => (products ?? []).filter((p) => !lines.some((l) => l.productId === p.id)),
    [products, lines],
  );

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const createOrder = useMutation({
    mutationFn: () =>
      orderService.create({
        dealerId,
        salesRepId: user!.id,
        priority,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      }),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      notify(`${order.orderNumber} sent to accounts`);
      router.push("/sales/order");
    },
    onError: () => notify("Couldn't submit the order. Try again.", "error"),
  });

  function addProduct(id: string, name: string, unitPrice: number) {
    setLines((prev) => [...prev, { productId: id, name, unitPrice, quantity: 1 }]);
    setItemQuery("");
  }

  function setQuantity(productId: string, next: number) {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, next) } : l)),
    );
  }

  return (
    <>
      <BackHeader label="Back to Search" href="/sales/order" />

      <div className="space-y-5 px-4">
        {/* Assigned dealer */}
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-card" />
        ) : !dealer ? (
          <EmptyState title="Dealer not found" description="Go back and pick a dealer to order for." />
        ) : (
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
                  Assigned dealer
                </p>
                <p className="mt-1 truncate text-title-sm font-semibold text-ink">{dealer.name}</p>
                <p className="mt-1.5 flex items-start gap-1.5 text-body text-ink-muted">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0">{dealer.address}</span>
                </p>
              </div>
              <Store className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
            </div>
          </Card>
        )}

        {/* Item picker */}
        <div>
          <p className="mb-1.5 text-body font-medium text-ink">Item</p>
          <Input
            value={itemQuery}
            onChange={(e) => setItemQuery(e.target.value)}
            placeholder="Search items..."
            leading={<Search className="h-4 w-4" />}
            className="border-line bg-surface"
            aria-label="Search items"
          />

          {itemQuery.trim() && suggestions.length > 0 && (
            <ul className="mt-2 overflow-hidden rounded-field border border-line bg-surface animate-slide-up">
              {suggestions.map((p) => (
                <li key={p.id} className="border-b border-line last:border-0">
                  <button
                    onClick={() => addProduct(p.id, p.name, p.unitPrice ?? 0)}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-surface-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-body text-ink">{p.name}</span>
                      <span className="text-meta text-ink-faint">{p.sku}</span>
                    </span>
                    <Plus className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selected lines */}
        {lines.length > 0 && (
          <div className="overflow-hidden rounded-field border border-line bg-surface">
            {lines.map((line) => (
              <div
                key={line.productId}
                className="flex items-center gap-3 border-b border-line px-3.5 py-3 last:border-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body text-ink">{line.name}</span>
                  <span className="text-meta text-ink-faint">
                    {formatCurrency(line.unitPrice * line.quantity)}
                  </span>
                </span>

                <div className="flex shrink-0 items-center rounded-field border border-line">
                  <StepButton
                    label={`Decrease ${line.name}`}
                    onClick={() => setQuantity(line.productId, line.quantity - 1)}
                    disabled={line.quantity <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </StepButton>
                  <span className="w-9 text-center text-body tabular-nums text-ink">
                    {line.quantity}
                  </span>
                  <StepButton
                    label={`Increase ${line.name}`}
                    onClick={() => setQuantity(line.productId, line.quantity + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </StepButton>
                </div>

                <button
                  onClick={() =>
                    setLines((prev) => prev.filter((l) => l.productId !== line.productId))
                  }
                  aria-label={`Remove ${line.name}`}
                  className="shrink-0 rounded p-1.5 text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Priority */}
        <div>
          <p className="mb-1.5 text-body font-medium text-ink">Priority level</p>
          <div
            role="radiogroup"
            aria-label="Priority level"
            className="flex rounded-field bg-surface-muted p-1"
          >
            {(
              [
                { value: "medium", label: "Normal" },
                { value: "urgent", label: "Urgent" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                role="radio"
                aria-checked={priority === option.value}
                onClick={() => setPriority(option.value)}
                className={cn(
                  "flex-1 rounded-[7px] py-2.5 text-body font-medium transition-colors",
                  priority === option.value
                    ? "bg-admin-sidebar text-ink-inverse shadow-card"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {lines.length > 0 && (
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-body text-ink-muted">Order total</span>
            <span className="text-title-sm font-semibold text-ink">{formatCurrency(total)}</span>
          </div>
        )}

        <Button
          size="block"
          disabled={lines.length === 0}
          loading={createOrder.isPending}
          onClick={() => createOrder.mutate()}
          className="tracking-[0.06em]"
        >
          SUBMIT ISSUE
        </Button>
      </div>
    </>
  );
}

function StepButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center text-info transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-ink-faint"
    >
      {children}
    </button>
  );
}
