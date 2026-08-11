"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pagination } from "@/components/ui";
import {
  EMPTY_FILTERS,
  OrderFilterBar,
  OrdersTable,
  type OrderFilterState,
} from "@/components/shared";
import { OrderDetailModal } from "@/components/admin";
import { orderService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useLookup } from "@/hooks/use-lookup";
import { toApiFilters } from "@/lib/utils/filters";
import { formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 15;

export default function AdminOrdersPage() {
  const [draft, setDraft] = useState<OrderFilterState>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<OrderFilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const { dealerName, repName, reps } = useLookup();
  const filters = toApiFilters(applied);

  const { data, isLoading } = useQuery({
    queryKey: qk.orders(filters, page),
    queryFn: () => orderService.list(filters, page, PAGE_SIZE),
  });

  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  const awaiting = (data?.data ?? [])
    .filter((o) => o.status === "pending")
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-display font-semibold text-ink">Sales Order</h1>
          <p className="mt-1 text-body text-ink-muted">
            Manage billing queue and partial fulfillments
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-[140px] rounded-card border border-line bg-surface px-4 py-3">
            <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
              Total Queue
            </p>
            <p className="mt-1 text-title font-semibold text-ink">{data?.total ?? 0}</p>
          </div>
          <div className="min-w-[140px] rounded-card border border-line bg-surface px-4 py-3">
            <p className="text-eyebrow font-semibold uppercase tracking-wide text-info">
              Awaiting Bill
            </p>
            <p className="mt-1 text-title font-semibold text-info">
              {formatCurrency(awaiting, { compact: true })}
            </p>
          </div>
        </div>
      </div>

      <OrderFilterBar
        value={draft}
        reps={reps}
        onChange={setDraft}
        onApply={() => {
          setApplied(draft);
          setPage(1);
        }}
        onClear={() => {
          setDraft(EMPTY_FILTERS);
          setApplied(EMPTY_FILTERS);
          setPage(1);
        }}
      />

      <OrdersTable
        orders={data?.data ?? []}
        loading={isLoading}
        dealerName={dealerName}
        repName={repName}
        onAction={(order) => setDetailOrderId(order.id)}
      />

      <OrderDetailModal
        orderId={detailOrderId}
        open={Boolean(detailOrderId)}
        onClose={() => setDetailOrderId(null)}
      />

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={data.pageSize}
          onChange={setPage}
        />
      )}
    </div>
  );
}
