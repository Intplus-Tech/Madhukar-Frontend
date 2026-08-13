"use client";

import { MoreHorizontal, SlidersHorizontal } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SalesOrder, SalesOrderStatus } from "@/types/domain";

export interface OrderFilterState {
  date: string;
  salesRepId: string;
  status: string;
}

export const EMPTY_FILTERS: OrderFilterState = { date: "", salesRepId: "", status: "" };

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,200px))_auto_auto] lg:items-end">
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
  /** Adds the order value column — used on the accounts billing queue. */
  showValue?: boolean;
}) {
  if (loading) {
    return (
      <TableWrap>
        <TableSkeleton rows={7} cols={showValue ? 7 : 6} />
      </TableWrap>
    );
  }

  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <Th>Date</Th>
            <Th>Order ID</Th>
            <Th>Dealer Name</Th>
            <Th>Rep</Th>
            {showValue && <Th className="text-right">Value</Th>}
            <Th>Status</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <EmptyRow colSpan={showValue ? 7 : 6}>No orders match these filters.</EmptyRow>
          ) : (
            orders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-surface-muted">
                <Td className="font-medium">{order.orderNumber}</Td>
                {/* Prefer the name the API sent; fall back to a lookup */}
                <Td>{order.dealerName ?? dealerName(order.dealerId)}</Td>
                <Td>{order.salesRepName ?? repName(order.salesRepId)}</Td>
                <Td className="whitespace-nowrap">{formatDate(order.createdAt)}</Td>
                <Td>
                  <OrderStatusPill status={order.status as SalesOrderStatus} />
                </Td>
                <Td className="text-right">
                  <button
                    onClick={() => onAction(order)}
                    aria-label={`${actionLabel} ${order.orderNumber}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-ink-muted transition-colors hover:bg-line-faint hover:text-ink"
                  >
                    <MoreHorizontal className="h-5 w-5" aria-hidden />
                  </button>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </TableWrap>
  );
}
