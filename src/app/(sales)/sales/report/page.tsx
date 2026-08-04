"use client";

import { useQuery } from "@tanstack/react-query";
import { Navigation, TrendingUp } from "lucide-react";
import { MobileHeader } from "@/components/layout";
import { Card, Pill, ProgressRing, Skeleton } from "@/components/ui";
import { VisitOutcomePill } from "@/components/shared";
import { reportService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useAuth } from "@/providers/auth-provider";
import { cn, formatCurrency } from "@/lib/utils";

export default function SalesReportPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: qk.salesReport(user?.id ?? ""),
    queryFn: () => reportService.salesReport(user!.id),
    enabled: Boolean(user),
  });

  return (
    <>
      <MobileHeader title="Report" />

      <div className="space-y-5 px-4 pt-4">
        {isLoading || !data ? (
          <>
            <Skeleton className="h-[340px] w-full rounded-card" />
            <Skeleton className="h-24 w-full rounded-card" />
          </>
        ) : (
          <>
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-title-sm font-semibold text-ink">Overall Performance</h2>
                  <p className="mt-0.5 text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
                    Daily sales target
                  </p>
                </div>
                <Pill className="gap-1 bg-success-soft text-success-ink">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  {data.performanceLabel}
                </Pill>
              </div>

              <div className="flex justify-center py-6">
                <ProgressRing
                  value={data.achievedPercent}
                  label={`${data.achievedPercent}%`}
                  caption="Achieved"
                  size={144}
                  stroke={11}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-body text-ink-muted">Planned Total</p>
                  <p className="mt-1 text-title font-bold text-ink">{data.plannedTotal}</p>
                </div>
                <div>
                  <p className="text-body text-ink-muted">Achieved Total</p>
                  <p className="mt-1 text-title font-bold text-success">{data.achievedTotal}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <span className="text-body text-ink-muted">Remaining Gap</span>
                <span className="text-body-lg font-semibold text-danger">{data.remainingGap}</span>
              </div>
            </Card>

            <section>
              <div className="mb-2.5 flex items-baseline justify-between gap-3">
                <h3 className="text-title-sm font-semibold text-ink">Dealer Visits</h3>
                <span className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
                  {data.visits.length} visits today
                </span>
              </div>

              <div className="space-y-3">
                {data.visits.map((visit, index) => (
                  <Card key={visit.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-pill text-meta font-semibold",
                          visit.outcome === "not_visited"
                            ? "bg-line text-ink-muted"
                            : "bg-ink text-ink-inverse",
                        )}
                      >
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-body-lg font-semibold text-ink">{visit.dealerName}</p>
                        <p className="mt-0.5 text-body text-ink-muted">{visit.address}</p>
                      </div>

                      <button
                        aria-label={`Navigate to ${visit.dealerName}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-surface-muted text-ink transition-colors hover:bg-line-faint"
                      >
                        <Navigation className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <VisitOutcomePill outcome={visit.outcome} />
                      <p className="text-body text-ink">
                        <span className="text-ink-muted">Plan:</span>{" "}
                        {formatCurrency(visit.plannedAmount)}
                        <span className="mx-1.5 text-line-strong">|</span>
                        <span className="text-ink-muted">Done:</span>{" "}
                        {visit.achievedAmount === null ? "--" : formatCurrency(visit.achievedAmount)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
