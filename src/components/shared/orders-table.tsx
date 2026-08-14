"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  Button,
  EmptyRow,
  Select,
  Table,
  TableSkeleton,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { OrderStatusPill } from "./status-pill";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { SalesOrder, SalesOrderStatus } from "@/types/domain";

export interface OrderFilterState {
  date: string;
  salesRepId: string;
  status: string;
  search: string;
}

export const EMPTY_FILTERS: OrderFilterState = {
  date: "",
  salesRepId: "",
  status: "",
  search: "",
};

/** Mirrors the API's status enum exactly — a value it doesn't know is ignored. */
const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Partially billed", value: "partially_billed" },
  { label: "Billed", value: "billed" },
  { label: "Completed", value: "completed" },
  { label: "Blocked", value: "rejected" },
];

export function OrderFilterBar({
  value,
  reps,
  onChange,
  onApply,
  onClear,
  onExport,
  applying,
}: {
  value: OrderFilterState;
  reps: Array<{ label: string; value: string }>;
  onChange: (next: OrderFilterState) => void;
  onApply: () => void;
  onClear?: () => void;
  onExport?: () => void;
  applying?: boolean;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,180px))_auto_auto] lg:items-end">
        <div>
          <label htmlFor="filter-search" className="mb-1.5 block text-body text-ink-muted">
            Search
          </label>
          <input
            id="filter-search"
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && onApply()}
            placeholder="Order ID or dealer"
            className="h-10 w-full rounded-field border border-line bg-surface px-3 text-body text-ink outline-none transition-colors focus:border-ink"
          />
        </div>

        <div>
          <label htmlFor="filter-date" className="mb-1.5 block text-body text-ink-muted">
            Date
          </label>
          <input
            id="filter-date"
            type="date"
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
            className="h-10 w-full rounded-field border border-line bg-surface px-3 text-body text-ink outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
          />
        </div>

        <div>
          <label htmlFor="filter-rep" className="mb-1.5 block text-body text-ink-muted">
            Representative
          </label>
          <Select
            id="filter-rep"
            options={[{ label: "All Reps", value: "" }, ...reps]}
            value={value.salesRepId}
            onChange={(e) => onChange({ ...value, salesRepId: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="filter-status" className="mb-1.5 block text-body text-ink-muted">
            Status
          </label>
          <Select
            id="filter-status"
            options={STATUS_OPTIONS}
            value={value.status}
            onChange={(e) => onChange({ ...value, status: e.target.value })}
          />
        </div>

        <Button onClick={onApply} loading={applying}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Apply Filters
        </Button>

        <div className="flex gap-2">
          {onClear && (
            <Button variant="secondary" onClick={onClear}>
              Clear
            </Button>
          )}
          {onExport && (
            <Button variant="secondary" onClick={onExport}>
              Export
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function OrdersTable({
  orders,
  loading,
  dealerName,
  repName,
  onAction,
  actionLabel = "View order",
  showValue = false,
}: {
  orders: SalesOrder[];
  loading?: boolean;
  dealerName: (id: string) => string;
  repName: (id: string) => string;
  onAction: (order: SalesOrder) => void;
  actionLabel?: string;
  /**
   * Accounts billing queue layout:
   *   Date | Order ID | Dealer Name | Rep | Value | Action(Bill Now)
   *
   * Admin layout (showValue = false):
   *   Order ID | Dealer Name | Rep | Value | Action(status), whole row clickable
   */
  showValue?: boolean;
}) {
  const columnCount = showValue ? 6 : 5;

  if (loading) {
    return (
      <TableWrap>
        <TableSkeleton rows={7} cols={columnCount} />
      </TableWrap>
    );
  }

  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            {showValue && <Th className="whitespace-nowrap">Date</Th>}
            <Th>Order ID</Th>
            <Th>Dealer Name</Th>
            <Th>Rep</Th>
            <Th className="text-right">Value</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </thead>

        <tbody>
          {orders.length === 0 ? (
            <EmptyRow colSpan={columnCount}>No orders match these filters.</EmptyRow>
          ) : (
            orders.map((order) => {
              const rowIsButton = !showValue;

              return (
                <tr
                  key={order.id}
                  onClick={rowIsButton ? () => onAction(order) : undefined}
                  tabIndex={rowIsButton ? 0 : undefined}
                  role={rowIsButton ? "button" : undefined}
                  aria-label={rowIsButton ? `${actionLabel} ${order.orderNumber}` : undefined}
                  onKeyDown={
                    rowIsButton
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onAction(order);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "transition-colors hover:bg-surface-muted",
                    rowIsButton && "cursor-pointer",
                  )}
                >
                  {showValue && (
                    <Td className="whitespace-nowrap">{formatDate(order.createdAt)}</Td>
                  )}

                  <Td className="font-medium">{order.orderNumber}</Td>

                  {/* Prefer the name the API sent; fall back to a lookup */}
                  <Td>{order.dealerName ?? dealerName(order.dealerId)}</Td>
                  <Td>{order.salesRepName ?? repName(order.salesRepId)}</Td>

                  <Td className="whitespace-nowrap text-right tabular-nums">
                    {formatCurrency(order.totalAmount ?? 0)}
                  </Td>

                  <Td className="text-right">
                    {showValue ? (
                      /*
                        Accounts act on a row rather than inspect it. A
                        completed order has nothing left to bill, so it shows
                        its status instead of a dead button.
                      */
                      order.status === "completed" ? (
                        <OrderStatusPill status={order.status as SalesOrderStatus} />
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction(order);
                          }}
                        >
                          Bill Now
                        </Button>
                      )
                    ) : (
                      <OrderStatusPill status={order.status as SalesOrderStatus} />
                    )}
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </TableWrap>
  );
}
