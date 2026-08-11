"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileHeader } from "@/components/layout";
import { EmptyState, Skeleton, useToast } from "@/components/ui";
import { DealerPlanCard, DealerSearchBar, type PlanFormValues } from "@/components/sales";
import { planningService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useAuth } from "@/providers/auth-provider";

export default function PlanningPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data: rows, isLoading } = useQuery({
    queryKey: qk.visitPlans(user?.id ?? ""),
    queryFn: () => planningService.listPlans(user!.id),
    enabled: Boolean(user),
  });

  const submitPlan = useMutation({
    mutationFn: (input: { dealerId: string; values: PlanFormValues }) =>
      planningService.submitPlan({
        dealerId: input.dealerId,
        salesRepId: user!.id,
        plannedDate: new Date().toISOString().slice(0, 10),
        orderPlanValue: input.values.orderPlanValue,
        paymentPlanValue: input.values.paymentPlanValue,
        hasServiceIssue: input.values.hasServiceIssue,
        serviceIssueNote: input.values.serviceIssueNote,
        remarks: input.values.remarks,
      }),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: qk.visitPlans(user!.id) });
      void queryClient.invalidateQueries({ queryKey: qk.salesDashboard(user!.id) });
      notify("Plan submitted");
      setExpandedId(null);
      void input;
    },
    onError: () => notify("Couldn't submit the plan. Try again.", "error"),
  });

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.dealer.name.toLowerCase().includes(q) ||
        (r.dealer.address ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <>
      <MobileHeader title="Planning" />

      <div className="space-y-4 px-4 pt-4">
        <DealerSearchBar value={query} onChange={setQuery} />

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-title-sm font-semibold text-ink">Recommended Sequence</h2>
          <Link
            href="/sales/plan/update"
            className="text-meta font-medium text-ink underline-offset-4 hover:underline"
          >
            End-of-day update
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* An empty list means "no route" far more often than "no search hit" */
          query.trim() ? (
            <EmptyState
              title="No dealers match that search"
              description="Try a different name, or clear the search to see today's full route."
            />
          ) : (
            <EmptyState
              title="No dealers on today's route"
              description="Once a route is assigned to you, the dealers you're visiting today will appear here in order."
            />
          )
        ) : (
          <div className="space-y-3">
            {filtered.map((row, index) => (
              <DealerPlanCard
                key={`${row.dealerId || "row"}-${index}`}
                row={row}
                mode="plan"
                expanded={expandedId === String(index)}
                onToggle={() =>
                  setExpandedId((prev) => (prev === String(index) ? null : String(index)))
                }
                submitting={submitPlan.isPending}
                onSubmit={(values) => submitPlan.mutate({ dealerId: row.dealerId, values })}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
