"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pagination, Skeleton } from "@/components/ui";
import {
  EMPTY_FILTERS,
  OrderFilterBar,
  OrdersTable,
  type OrderFilterState,
} from "@/components/shared";
import { BillingModal } from "@/components/accounts";
import { orderService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useLookup } from "@/hooks/use-lookup";
import { toApiFilters } from "@/lib/utils/filters";

const PAGE_SIZE = 15;

function AccountsOrdersInner() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "";

  const [draft, setDraft] = useState<OrderFilterState>({ ...EMPTY_FILTERS, status: initialStatus });
  const [applied, setApplied] = useState<OrderFilterState>({
    ...EMPTY_FILTERS,
    status: initialStatus,
  });
  const [page, setPage] = useState(1);
  const [billingOrderId, setBillingOrderId] = useState<string | null>(null);

  const { dealerName, repName, reps } = useLookup();
  const filters = toApiFilters(applied);

  const { data, isLoading } = useQuery({
    queryKey: qk.orders(filters, page),
    queryFn: () => orderService.list(filters, page, PAGE_SIZE),
  });

  const totals = useQuery({
    queryKey: qk.orders({}, 0),
    queryFn: () => orderService.list({}, 1, 1000),
  });

  const totalBills = totals.data?.data.filter((o) => o.status === "completed").length ?? 0;
  const pendingBills = totals.data?.data.filter((o) => o.status === "pending").length ?? 0;

  async function exportCsv() {
    const blob = await orderService.exportCsv(filters);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-title-sm font-semibold text-ink">Sales Orders</h1>
          <p className="mt-0.5 text-body text-ink-muted">
            Manage billing queue and partial fulfillments
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:w-auto">
          <MiniStat label="Total Bills" value={totalBills} />
          <MiniStat label="Pending Bills" value={pendingBills} valueClassName="text-info" />
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
        onExport={() => void exportCsv()}
      />

      <OrdersTable
        orders={data?.data ?? []}
        loading={isLoading}
        dealerName={dealerName}
        repName={repName}
        onAction={(order) => setBillingOrderId(order.id)}
        actionLabel="Review and bill"
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

      <BillingModal
        orderId={billingOrderId}
        open={Boolean(billingOrderId)}
        onClose={() => setBillingOrderId(null)}
      />
    </div>
  );
}

function MiniStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-[130px] rounded-card border border-line bg-surface px-4 py-3">
      <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1 text-title font-semibold text-ink ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}

export default function AccountsOrdersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" />}>
      <AccountsOrdersInner />
    </Suspense>
  );
}
