"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardSkeleton, Skeleton } from "@/components/ui";
import { OrdersTable, QueryError, StatCard } from "@/components/shared";
import { OrderDetailModal, PlanVsAchievedChart } from "@/components/admin";
import { reportService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useLookup } from "@/hooks/use-lookup";
import { cn } from "@/lib/utils";
import type { DashboardPeriod } from "@/types/domain";

const PERIODS: Array<{ label: string; value: DashboardPeriod }> = [
  { label: "Today", value: "today" },
  { label: "Week TD", value: "wtd" },
  { label: "Month TD", value: "mtd" },
];

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("today");
  const { dealerName, repName } = useLookup();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.adminDashboard(period),
    queryFn: () => reportService.adminDashboard(period),
  });

  // Admin inspects an order rather than billing it — billing belongs to accounts
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-display font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-body text-ink-muted">
            All dealers, all reps, all sales — today, this week &amp; this month
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Reporting period"
          className="inline-flex rounded-field border border-line bg-surface p-1"
        >
          {PERIODS.map((option) => (
            <button
              key={option.value}
              role="tab"
              aria-selected={period === option.value}
              onClick={() => setPeriod(option.value)}
              className={cn(
                "rounded-[7px] px-4 py-2 text-body transition-colors",
                period === option.value
                  ? "bg-surface-muted font-medium text-ink shadow-card"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isError && <QueryError error={error} onRetry={() => void refetch()} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : !data ? null : (
          <>
            <StatCard label="Planned" value={data.totalPlanned} />
            <StatCard label="Total Bills" value={data.totalBills} />
            <StatCard label="Pending Bills" value={data.pendingBills} />
          </>
        )}
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title-sm font-semibold text-ink">Order Value: Plan vs. Achieved</h2>
          <div className="flex items-center gap-4 text-meta text-ink-muted">
            <Legend swatch="bg-line-strong" label="Plan" />
            <Legend swatch="bg-success" label="Actual" />
          </div>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : !data?.chart.length ? (
            <p className="py-24 text-center text-body text-ink-muted">
              No plan or order activity in this period yet.
            </p>
          ) : (
            <PlanVsAchievedChart data={data.chart} />
          )}
        </div>
      </Card>

      <OrdersTable
        orders={data?.latestOrders ?? []}
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
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-pill", swatch)} aria-hidden />
      {label}
    </span>
  );
}
