"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
    onError: (err) =>
      notify(
        err instanceof Error ? err.message : "Couldn't submit the report. Try again.",
        "error",
      ),
  });

  const filtered = useMemo(() => {
    if (!rows) return [];
    /*
      Only dealers with a real submitted plan can take an end-of-day report —
      a draft has no plan id for the update to attach to.
    */
    const planned = rows.filter((r) => !r.id.startsWith("draft-"));
    const q = query.trim().toLowerCase();
    if (!q) return planned;
    return planned.filter((r) => r.dealer.name.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <>
      <BackHeader label="Back" href="/sales/plan" />

      <div className="space-y-4 px-4">
        <DealerSearchBar value={query} onChange={setQuery} />

        <div role="tablist" aria-label="Planning stage" className="flex rounded-field bg-surface-muted p-1">
          <Link
            href="/sales/plan"
            role="tab"
            aria-selected={false}
            className="flex-1 rounded-[7px] py-2 text-center text-body text-ink-muted transition-colors hover:text-ink"
          >
            Morning plan
          </Link>
          <span
            role="tab"
            aria-selected
            className="flex-1 rounded-[7px] bg-surface py-2 text-center text-body font-medium text-ink shadow-card"
          >
            End-of-day report
          </span>
        </div>

        <h2 className="text-title-sm font-semibold text-ink">Today&apos;s planned visits</h2>
        <p className="-mt-2 text-meta text-ink-muted">
          Record what was actually collected against each plan.
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={query.trim() ? "No dealers match that search" : "Nothing to update yet"}
            description={
              query.trim()
                ? "Try a different name, or clear the search."
                : "Submit today's plan first, then come back in the evening to record what actually happened."
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((row, index) => (
              <DealerPlanCard
                key={`${row.dealerId || "row"}-${index}`}
                row={row}
                mode="update"
                expanded={expandedId === String(index)}
                onToggle={() =>
                  setExpandedId((prev) => (prev === String(index) ? null : String(index)))
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
