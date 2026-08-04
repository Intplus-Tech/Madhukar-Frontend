"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, UserPlus } from "lucide-react";
import {
  Avatar,
  Button,
  Select,
  Table,
  TableSkeleton,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { reportService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { cn, formatCurrency } from "@/lib/utils";

const PERIOD_OPTIONS = [
  { label: "October 2026", value: "2026-10" },
  { label: "September 2026", value: "2026-09" },
  { label: "August 2026", value: "2026-08" },
];

export default function AdminReportsPage() {
  const [period, setPeriod] = useState(PERIOD_OPTIONS[0]!.value);

  const { data, isLoading } = useQuery({
    queryKey: qk.teamPerformance(period),
    queryFn: () => reportService.teamPerformance(period),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display font-semibold text-ink">Reports &amp; Team</h1>
        <p className="mt-1 text-body text-ink-muted">
          Manage sales performance and territory assignments.
        </p>
      </div>

      <section className="rounded-card border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-title-sm font-semibold text-ink">
            <BarChart3 className="h-[18px] w-[18px] text-ink-muted" aria-hidden />
            Monthly Sales Performance
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              options={PERIOD_OPTIONS}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="min-w-[160px]"
              aria-label="Reporting month"
            />
            <Button variant="secondary">
              <UserPlus className="h-4 w-4" aria-hidden />
              Add User
            </Button>
          </div>
        </div>

        {isLoading || !data ? (
          <TableSkeleton rows={4} cols={7} />
        ) : (
          <TableWrap className="rounded-none border-0">
            <Table className="min-w-[900px]">
              <thead>
                <tr>
                  <Th>Rep Name</Th>
                  <Th>Position</Th>
                  <Th className="text-right">Activity</Th>
                  <Th className="text-right">Actual Sales</Th>
                  <Th>% of Target</Th>
                  <Th className="text-right">Collected</Th>
                  <Th className="text-right">Outstanding</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.userId} className="transition-colors hover:bg-surface-muted">
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <Avatar name={row.name} size="sm" />
                        <span className="font-medium text-ink">{row.name}</span>
                      </span>
                    </Td>
                    <Td className="text-ink-muted">{row.position}</Td>
                    <Td className="text-right tabular-nums">{formatCurrency(row.activity)}</Td>
                    <Td className="text-right font-semibold tabular-nums">
                      {formatCurrency(row.actualSales)}
                    </Td>
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "w-10 shrink-0 text-body font-medium tabular-nums",
                            targetTone(row.targetPercent),
                          )}
                        >
                          {row.targetPercent}%
                        </span>
                        <span className="h-1.5 w-20 overflow-hidden rounded-pill bg-line-faint">
                          <span
                            className={cn("block h-full rounded-pill", targetBar(row.targetPercent))}
                            style={{ width: `${Math.min(100, row.targetPercent)}%` }}
                          />
                        </span>
                      </span>
                    </Td>
                    <Td className="text-right tabular-nums">{formatCurrency(row.collected)}</Td>
                    <Td
                      className={cn(
                        "text-right tabular-nums",
                        row.outstanding > 0 ? "text-danger" : "text-ink",
                      )}
                    >
                      {formatCurrency(row.outstanding)}
                    </Td>
                  </tr>
                ))}

                <tr className="bg-surface-muted font-semibold">
                  <Td className="text-eyebrow uppercase tracking-wide text-ink-muted">
                    Team Totals
                  </Td>
                  <Td />
                  <Td className="text-right tabular-nums">{formatCurrency(data.totals.activity)}</Td>
                  <Td className="text-right tabular-nums">
                    {formatCurrency(data.totals.actualSales)}
                  </Td>
                  <Td className="tabular-nums">{data.totals.targetPercent}%</Td>
                  <Td className="text-right tabular-nums">
                    {formatCurrency(data.totals.collected)}
                  </Td>
                  <Td className="text-right tabular-nums text-danger">
                    {formatCurrency(data.totals.outstanding)}
                  </Td>
                </tr>
              </tbody>
            </Table>
          </TableWrap>
        )}
      </section>
    </div>
  );
}

function targetTone(pct: number) {
  if (pct >= 100) return "text-success";
  if (pct >= 90) return "text-ink";
  return "text-danger";
}

function targetBar(pct: number) {
  if (pct >= 100) return "bg-success";
  if (pct >= 90) return "bg-ink";
  return "bg-danger";
}
