"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, ChevronRight } from "lucide-react";
import { Button, Card, CurrencyInput, FieldLabel, Input, Textarea, Toggle } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import type { VisitPlanWithUpdate } from "@/types/domain";

export type PlanCardMode = "plan" | "update";

export interface PlanFormValues {
  orderPlanValue: number;
  paymentPlanValue: number;
  hasServiceIssue: boolean;
  serviceIssueNote: string;
  remarks: string;
}

/**
 * One dealer in the "Recommended Sequence" list.
 *
 * mode="plan"   — morning: rep enters intended order and collection values.
 * mode="update" — evening: the planned figures move to the right of the label
 *                 and the inputs capture what actually happened.
 *
 * CONFIRM: the update frame in Figma shows "PAYMENT PLAN" twice. Read here as
 * ORDER PLAN + PAYMENT PLAN, which is what the walkthrough describes.
 */
export function DealerPlanCard({
  row,
  mode,
  expanded,
  onToggle,
  onSubmit,
  submitting,
}: {
  row: VisitPlanWithUpdate;
  mode: PlanCardMode;
  expanded: boolean;
  onToggle: () => void;
  onSubmit: (values: PlanFormValues) => void;
  submitting?: boolean;
}) {
  const [values, setValues] = useState<PlanFormValues>({
    orderPlanValue: 0,
    paymentPlanValue: mode === "plan" ? (row.plannedCollectionAmount ?? 0) : 0,
    hasServiceIssue: false,
    serviceIssueNote: "",
    remarks: "",
  });

  const set = <K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const done = row.status === "completed";
  const isUpdate = mode === "update";

  if (!expanded) {
    return (
      <Card>
        <button
          onClick={onToggle}
          aria-expanded={false}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left rounded-none"
        >
          <span className="min-w-0">
            <span className="block truncate text-body-lg font-semibold text-ink">
              {row.dealer.name}
            </span>
            <span className="mt-0.5 block truncate text-body text-ink-muted">
              {row.notes ?? "Quarterly Review Meeting"}
            </span>
          </span>
          {done ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Plan submitted" />
          ) : (
            <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
          )}
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <button
        onClick={onToggle}
        aria-expanded
        className="flex w-full items-start justify-between gap-3 px-4 pb-3.5 pt-4 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate text-title-sm font-semibold text-ink">
            {row.dealer.name}
          </span>
          <span className="mt-0.5 block text-body text-ink-muted">Last visited: Oct 12</span>
        </span>
        <ChevronDown className="mt-1 h-5 w-5 shrink-0 rotate-180 text-ink-muted" aria-hidden />
      </button>

      <div className="border-t border-line px-4 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
          className="space-y-4"
        >
          <PlanField
            label="Order plan"
            plannedValue={isUpdate ? 0 : undefined}
            value={values.orderPlanValue}
            onChange={(v) => set("orderPlanValue", v)}
            placeholder={isUpdate ? "0" : "0.00"}
          />

          <PlanField
            label="Payment plan"
            plannedValue={isUpdate ? (row.plannedCollectionAmount ?? 45000) : undefined}
            value={values.paymentPlanValue}
            onChange={(v) => set("paymentPlanValue", v)}
            placeholder={isUpdate ? "0" : "45000"}
          />

          <div className="rounded-field bg-surface-muted p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-body-lg font-medium text-ink">
                {isUpdate ? "Service issue resolved?" : "Service Issue Today?"}
              </span>
              <Toggle
                checked={values.hasServiceIssue}
                onChange={(v) => set("hasServiceIssue", v)}
                label={isUpdate ? "Service issue resolved" : "Service issue today"}
              />
            </div>

            {/*
              Always visible, as drawn in the Figma — the field sits inside the
              grey block rather than appearing only once the toggle is on.
            */}
            <div className="mt-3">
              <Input
                value={values.serviceIssueNote}
                onChange={(e) => set("serviceIssueNote", e.target.value)}
                placeholder={
                  isUpdate ? "What was done about it?" : "Specify service issue..."
                }
                aria-label="Service issue detail"
                className="h-11 border-line bg-surface"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Remarks / FOC schemes</FieldLabel>
            <Textarea
              rows={3}
              value={values.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              placeholder="Enter notes on promotional items or special requests..."
            />
          </div>

          <Button type="submit" size="block" loading={submitting} className="tracking-[0.06em] text-white rounded-none">
            {isUpdate ? "SUBMIT TODAY'S REPORT" : "SUBMIT PLAN"}
          </Button>
        </form>
      </div>
    </Card>
  );
}

function PlanField({
  label,
  plannedValue,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  plannedValue?: number;
  value: number;
  onChange: (next: number) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <FieldLabel className="mb-0">{label}</FieldLabel>
        {plannedValue !== undefined && (
          <span className={cn("text-body font-medium text-ink")}>
            {formatCurrency(plannedValue)}
          </span>
        )}
      </div>
      <CurrencyInput
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder={placeholder}
      />
    </div>
  );
}