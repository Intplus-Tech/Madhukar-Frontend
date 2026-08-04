"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BackHeader } from "@/components/layout";
import { EmptyState, Skeleton, useToast } from "@/components/ui";
import { DealerPlanCard, DealerSearchBar, type PlanFormValues } from "@/components/sales";
import { planningService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useAuth } from "@/providers/auth-provider";

/** Evening pass: record what was actually collected against each plan. */
export default function PlanningUpdatePage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data: rows, isLoading } = useQuery({
    queryKey: qk.visitPlans(user?.id ?? "", "update"),
    queryFn: () => planningService.listPlans(user!.id),
    enabled: Boolean(user),
  });

  const submitUpdate = useMutation({
    mutationFn: (input: { visitPlanId: string; values: PlanFormValues }) =>
      planningService.submitUpdate({
        visitPlanId: input.visitPlanId,
        actualCollectionAmount: input.values.paymentPlanValue,
        actualOrderValue: input.values.orderPlanValue,
        serviceCompleted: input.values.hasServiceIssue,
        serviceNote: input.values.serviceIssueNote,
        remarks: input.values.remarks,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.visitPlans(user!.id, "update") });
      void queryClient.invalidateQueries({ queryKey: qk.salesReport(user!.id) });
      notify("Today's report submitted");
      setExpandedId(null);
    },
    onError: () => notify("Couldn't submit the report. Try again.", "error"),
  });

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.dealer.name.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <>
      <BackHeader label="Back" href="/sales/plan" />

      <div className="space-y-4 px-4">
        <DealerSearchBar value={query} onChange={setQuery} />
        <h2 className="text-title-sm font-semibold text-ink">Recommended Sequence</h2>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nothing to update"
            description="Submit a plan first, then come back to record the day's results."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((row) => (
              <DealerPlanCard
                key={row.dealerId}
                row={row}
                mode="update"
                expanded={expandedId === row.dealerId}
                onToggle={() =>
                  setExpandedId((prev) => (prev === row.dealerId ? null : row.dealerId))
                }
                submitting={submitUpdate.isPending}
                onSubmit={(values) => submitUpdate.mutate({ visitPlanId: row.id, values })}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
