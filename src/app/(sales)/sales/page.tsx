"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, ChevronRight, Receipt, Store } from "lucide-react";
import { useState } from "react";
import { MobileHeader } from "@/components/layout";
import { Card, ProgressBar, Skeleton } from "@/components/ui";
import { planningService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useAuth } from "@/providers/auth-provider";
import { cn, formatCurrency, formatLongDate, formatWeekday, greetingFor } from "@/lib/utils";

export default function SalesDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: qk.salesDashboard(user?.id ?? ""),
    queryFn: () => planningService.dashboard(user!.id),
    enabled: Boolean(user),
  });

  return (
    <>
      <MobileHeader title="Dashboard" />

      <div className="space-y-4 px-4 pt-5">
        {isLoading || !data ? (
          <DashboardSkeleton />
        ) : (
          <>
            <section>
              <p className="text-eyebrow font-semibold uppercase tracking-[0.08em] text-ink-muted">
                {formatWeekday(data.date)} — {data.routeName}
              </p>
              <h2 className="mt-1 text-[30px] font-bold leading-tight tracking-[-0.02em] text-ink">
                {greetingFor()}, {data.repName}!
              </h2>
              <p className="mt-1 text-body-lg text-ink-muted">{formatLongDate(data.date)}</p>
            </section>

            {!data.planSubmitted && (
              <Link
                href="/sales/plan"
                className="flex items-start gap-3 rounded-card border-l-4 border-danger bg-danger-soft/60 px-4 py-3.5 transition-colors hover:bg-danger-soft"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-body-lg font-semibold text-danger">
                    Order Plan not submitted yet
                  </span>
                  <span className="mt-0.5 block text-body text-danger-ink/80">
                    Complete your plan before starting the route.
                  </span>
                </span>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-danger" aria-hidden />
              </Link>
            )}

            <div className="grid grid-cols-2 gap-3">
              <TileCard
                icon={<Store className="h-5 w-5" />}
                eyebrow="Today"
                value={String(data.dealersScheduled)}
                caption="Dealers Scheduled"
              />
              <TileCard
                icon={<Receipt className="h-5 w-5" />}
                value={formatCurrency(data.orderPlanValue)}
                caption="Order Plan"
              />
            </div>

            <Card className="bg-surface-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
                    Plan Progress
                  </p>
                  <p className="mt-1 text-title font-semibold text-ink">
                    {data.plannedCount} / {data.totalCount} Planned
                  </p>
                </div>
                <span className="rounded-pill bg-info-soft px-2.5 py-1 text-meta font-medium text-info-ink">
                  {Math.round((data.plannedCount / Math.max(1, data.totalCount)) * 100)}% Complete
                </span>
              </div>
              <ProgressBar
                className="mt-3"
                value={(data.plannedCount / Math.max(1, data.totalCount)) * 100}
              />
            </Card>

            <section>
              <h3 className="mb-2.5 text-title-sm font-semibold text-ink">Upcoming Activity</h3>
              <div className="space-y-3">
                {data.upcomingActivity.map((activity) => (
                  <ActivityRow
                    key={activity.dealerId}
                    name={activity.dealerName}
                    purpose={activity.purpose}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

function TileCard({
  icon,
  eyebrow,
  value,
  caption,
}: {
  icon: React.ReactNode;
  eyebrow?: string;
  value: string;
  caption: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-ink-muted">
        <span aria-hidden>{icon}</span>
        {eyebrow && (
          <span className="text-eyebrow font-semibold uppercase tracking-wide">{eyebrow}</span>
        )}
      </div>
      <p className="mt-3 text-[26px] font-bold leading-none text-ink">{value}</p>
      <p className="mt-1.5 text-body text-ink-muted">{caption}</p>
    </Card>
  );
}

function ActivityRow({ name, purpose }: { name: string; purpose: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate text-body-lg font-semibold text-ink">{name}</span>
          <span className="mt-0.5 block truncate text-body text-ink-muted">{purpose}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-ink-muted transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div className="border-t border-line px-4 py-3.5 animate-slide-up">
          <Link
            href="/sales/plan"
            className="inline-flex items-center gap-1.5 text-body font-medium text-ink underline-offset-4 hover:underline"
          >
            Add plan for this dealer
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-20 w-full rounded-card" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </div>
      <Skeleton className="h-24 w-full rounded-card" />
    </div>
  );
}
