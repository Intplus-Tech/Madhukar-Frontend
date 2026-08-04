"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CalendarDays, CheckCircle2, Download } from "lucide-react";
import { Button, CardSkeleton, ProgressBar, Table, TableWrap, Td, Th } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { BillingModal } from "@/components/accounts";
import { reportService, orderService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";

export default function AccountsDashboardPage() {
  const [billingOrderId, setBillingOrderId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: qk.accountsOverview,
    queryFn: () => reportService.accountsOverview(),
  });

  async function exportData() {
    const blob = await orderService.exportCsv({});
    downloadBlob(blob, `sales-orders-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-display-sm font-semibold text-ink">System Overview</h1>
          <p className="mt-1 text-body text-ink-muted">
            Financial summary for the current fiscal period.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary">
            <CalendarDays className="h-4 w-4" aria-hidden />
            This Week
          </Button>
          <Button onClick={() => void exportData()}>
            <Download className="h-4 w-4" aria-hidden />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading || !data ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Orders pending billing"
              value={data.ordersPendingBilling}
              trailing={
                <span className="text-meta font-medium text-danger">
                  +{data.pendingTrendPercent}%
                </span>
              }
              footer={<ProgressBar value={68} />}
            />
            <StatCard
              label="Blocked orders"
              value={
                <span className="flex items-baseline gap-2">
                  <span className="text-danger">{data.blockedOrders}</span>
                  <span className="text-body font-normal text-ink-muted">Stock Issues</span>
                </span>
              }
              trailing={<AlertCircle className="h-[18px] w-[18px] text-danger" aria-hidden />}
              footer={
                <span className="inline-flex rounded bg-danger-deep px-2 py-1 text-meta font-medium text-ink-inverse">
                  Action Required
                </span>
              }
            />
            <StatCard
              label="Total bills of the day"
              value={data.totalBillsToday}
              trailing={<CheckCircle2 className="h-[18px] w-[18px] text-success" aria-hidden />}
            />
          </>
        )}
      </div>

      <section className="rounded-card border border-line bg-surface">
        <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-sm font-semibold text-ink">Needs Attention</h2>
          <p className="text-body text-ink-muted">Orders Pending &gt; 3 Days</p>
        </div>

        <TableWrap className="rounded-none border-0">
          <Table>
            <thead>
              <tr>
                <Th>Order ID</Th>
                <Th>Dealer / Client</Th>
                <Th>Sales Representative</Th>
                <Th>Pending</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {(data?.needsAttention ?? []).map((row, i) => (
                <tr key={`${row.id}-${i}`} className="transition-colors hover:bg-surface-muted">
                  <Td className="font-medium">{row.orderNumber}</Td>
                  <Td>
                    <span className="block font-medium text-ink">{row.dealerName}</span>
                    <span className="text-meta text-ink-muted">Area: {row.area}</span>
                  </Td>
                  <Td>{row.salesRepName}</Td>
                  <Td>
                    <span className="inline-flex rounded bg-danger-soft px-2 py-0.5 text-meta font-medium text-danger-ink">
                      {row.pendingDays} Day{row.pendingDays === 1 ? "" : "s"}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <Button size="sm" onClick={() => setBillingOrderId(row.id)}>
                      Bill Now
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>

        <div className="px-5 py-4 text-center">
          <Link
            href="/accounts/orders?status=pending"
            className="text-eyebrow font-semibold uppercase tracking-wide text-ink underline-offset-4 hover:underline"
          >
            View all pending ({data?.ordersPendingBilling ?? 0})
          </Link>
        </div>
      </section>

      <BillingModal
        orderId={billingOrderId}
        open={Boolean(billingOrderId)}
        onClose={() => setBillingOrderId(null)}
      />
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
