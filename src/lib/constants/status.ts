import type { SalesOrderStatus, VisitOutcome, OrderPriority } from "@/types/domain";

export const ORDER_STATUS_LABEL: Record<SalesOrderStatus, string> = {
  pending: "Pending",
  billed: "Billed",
  completed: "Completed",
  rejected: "Blocked",
};

/** Pill styling, transcribed from the Figma status chips. */
export const ORDER_STATUS_STYLE: Record<SalesOrderStatus, string> = {
  pending: "bg-warning-soft text-warning-ink",
  billed: "bg-info-soft text-info-ink",
  completed: "bg-success-soft text-success-ink",
  rejected: "bg-danger-soft text-danger-ink",
};

export const VISIT_OUTCOME_LABEL: Record<VisitOutcome, string> = {
  order_placed: "Order Placed",
  visited: "Visited",
  payment_collected: "Payment Collected",
  not_visited: "Not Visited",
};

export const VISIT_OUTCOME_STYLE: Record<VisitOutcome, string> = {
  order_placed: "bg-success-soft text-success-ink",
  visited: "bg-info-soft text-info-ink",
  payment_collected: "bg-accentPurple-soft text-accentPurple-ink",
  not_visited: "bg-line-faint text-ink-muted",
};

export const PRIORITY_LABEL: Record<OrderPriority, string> = {
  low: "Low",
  medium: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const APP_NAME = "Lakshya 72";
export const APP_TAGLINE = "Sales Order Management";
export const COMPANY = "Madhukar Domestic Appliances Pvt Ltd";
