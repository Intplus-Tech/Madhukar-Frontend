import { Pill } from "@/components/ui";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE,
  VISIT_OUTCOME_LABEL,
  VISIT_OUTCOME_STYLE,
} from "@/lib/constants";
import type { SalesOrderStatus, VisitOutcome } from "@/types/domain";
import { cn } from "@/lib/utils";

export function OrderStatusPill({ status }: { status: SalesOrderStatus }) {
  return (
    <Pill className={cn("uppercase tracking-wide text-[11px]", ORDER_STATUS_STYLE[status])}>
      {ORDER_STATUS_LABEL[status]}
    </Pill>
  );
}

export function VisitOutcomePill({ outcome }: { outcome: VisitOutcome }) {
  return <Pill className={VISIT_OUTCOME_STYLE[outcome]}>{VISIT_OUTCOME_LABEL[outcome]}</Pill>;
}
