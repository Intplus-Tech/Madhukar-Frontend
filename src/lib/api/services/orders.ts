import type {
  Feedback,
  OrderPriority,
  Paginated,
  SalesOrder,
  SalesOrderDetail,
  SalesOrderFilters,
} from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import {
  mapSalesOrder,
  mapPaginated,
  type ApiSalesOrder,
} from "../mappers";
import { db } from "../mock/db";

export interface CreateOrderPayload {
  dealerId: string;
  salesRepId: string;
  priority: OrderPriority;
  items: Array<{ productId: string; quantity: number }>;
  notes?: string;
}

export interface BillOrderPayload {
  orderId: string;
  billedItemIds: string[];
  note?: string;
}

export interface SendFeedbackPayload {
  orderId: string;
  message: string;
  fromUserId: string;
  fromRole: "accounts" | "admin";
  toRoles: Array<"sales" | "accounts">;
  /** Real API takes explicit user IDs; the mock derives them from roles. */
  recipientIds?: string[];
}

/** The day after the given date, so a same-day filter includes that day. */
function dayAfter(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** "Spark Electric Kettle (2), Nova Ceiling Fan 1200mm (1)" */
function itemSummary(order: SalesOrder) {
  if (order.items.length === 0) return "—";
  return order.items.map((li) => `${li.productName} (${li.quantity})`).join(", ");
}

/**
 * "11 Aug 2026" — short enough that Excel's default column width shows it in
 * full rather than collapsing to ####.
 */
function exportDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const orderService = {
  async list(
    filters: SalesOrderFilters = {},
    page = 1,
    pageSize = 15,
  ): Promise<Paginated<SalesOrder>> {
    if (!USE_MOCK) {
      const res = await http.get<{ items?: ApiSalesOrder[] } & Record<string, unknown>>(
        "/sales-orders",
        {
          status: Array.isArray(filters.status) ? filters.status[0] : filters.status,
          salesRepId: filters.salesRepId,
          dealerId: filters.dealerId,
          search: filters.search?.trim() || undefined,
          dateFrom: filters.dateRange?.from,
          /*
            orderDate is a full timestamp, so a dateTo of the same day would
            exclude everything recorded after midnight. Push the upper bound to
            the following day.
          */
          dateTo: filters.dateRange?.to ? dayAfter(filters.dateRange.to) : undefined,
          page,
          limit: pageSize,
        },
      );
      return mapPaginated(res as never, mapSalesOrder);
    }

    const statuses = filters.status
      ? Array.isArray(filters.status)
        ? filters.status
        : [filters.status]
      : null;

    const filtered = db.salesOrders.filter((o) => {
      if (statuses && !statuses.includes(o.status)) return false;
      if (filters.salesRepId && o.salesRepId !== filters.salesRepId) return false;
      if (filters.dealerId && o.dealerId !== filters.dealerId) return false;
      if (filters.priority && o.priority !== filters.priority) return false;
      if (filters.dateRange?.from && o.createdAt.slice(0, 10) < filters.dateRange.from) return false;
      if (filters.dateRange?.to && o.createdAt.slice(0, 10) > filters.dateRange.to) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matches =
          o.orderNumber.toLowerCase().includes(q) ||
          db.dealerName(o.dealerId).toLowerCase().includes(q) ||
          db.repName(o.salesRepId).toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const start = (page - 1) * pageSize;

    return delay({
      data: sorted.slice(start, start + pageSize),
      page,
      pageSize,
      total: sorted.length,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    });
  },

  async getById(id: string): Promise<SalesOrderDetail | null> {
    if (!USE_MOCK) {
      const raw = await http.get<ApiSalesOrder>(`/sales-orders/${id}`);
      const order = mapSalesOrder(raw);
      return {
        ...order,
        dealer: {
          id: raw.dealerId,
          name: raw.dealerName ?? "Unknown dealer",
          salesRepId: raw.salesRepId,
          createdAt: order.createdAt,
        },
        salesRep: { id: raw.salesRepId, name: raw.salesRepName ?? "Unassigned" },
        feedback: (raw.feedback ?? []).map((f, i) => ({
          id: `${raw._id}-fb${i}`,
          salesOrderId: raw._id,
          message: f.message,
          fromUserId: f.sentBy ?? "",
          fromRole: "accounts" as const,
          toUserIds: f.recipientIds ?? [],
          toRoles: ["sales" as const],
          createdAt: f.sentAt ?? order.createdAt,
        })),
      };
    }

    const order = db.salesOrders.find((o) => o.id === id);
    if (!order) return delay(null);
    const dealer = db.dealers.find((d) => d.id === order.dealerId)!;
    const rep = db.users.find((u) => u.id === order.salesRepId)!;

    return delay({
      ...order,
      dealer,
      salesRep: { id: rep.id, name: rep.name, phone: rep.phone, email: rep.email },
      feedback: db.feedback.filter((f) => f.salesOrderId === id),
    });
  },

  async create(payload: CreateOrderPayload): Promise<SalesOrder> {
    if (!USE_MOCK) {
      const raw = await http.post<ApiSalesOrder>("/sales-orders", {
        dealerId: payload.dealerId,
        items: payload.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        remarks: payload.notes,
      });
      return mapSalesOrder(raw);
    }

    const items = payload.items.map((line, i) => {
      const p = db.products.find((x) => x.id === line.productId)!;
      return {
        id: `new-li${i + 1}-${Date.now()}`,
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        unit: p.unit,
        quantity: line.quantity,
        unitPrice: p.unitPrice,
        lineTotal: (p.unitPrice ?? 0) * line.quantity,
        billedQuantity: 0,
        isBilled: false,
      };
    });

    const order: SalesOrder = {
      id: db.nextId("o"),
      orderNumber: db.nextOrderNumber(),
      dealerId: payload.dealerId,
      salesRepId: payload.salesRepId,
      items,
      priority: payload.priority,
      status: "pending",
      totalAmount: items.reduce((s, li) => s + (li.lineTotal ?? 0), 0),
      notes: payload.notes,
      createdAt: new Date().toISOString(),
    };

    db.salesOrders = [order, ...db.salesOrders];

    // The walkthrough: punching an order surfaces it on the accounts dashboard.
    db.notifications = [
      {
        id: db.nextId("n"),
        userId: "u6",
        type: "order_received",
        title: `${order.orderNumber} received`,
        message: `${db.repName(order.salesRepId)} placed an order for ${db.dealerName(order.dealerId)}.`,
        entityType: "sales_order",
        entityId: order.id,
        isRead: false,
        createdAt: order.createdAt,
      },
      ...db.notifications,
    ];

    return delay(order);
  },

  /** Accounts confirms billing. All items ticked → completed. */
  async confirmBilling(payload: BillOrderPayload): Promise<SalesOrder> {
    if (!USE_MOCK) {
      /*
        The API takes a per-item status list and recomputes the order status
        itself (pending → partially_billed → billed). Every item is sent, not
        just the ticked ones, so unticking works as well as ticking.
      */
      const current = await http.get<ApiSalesOrder>(`/sales-orders/${payload.orderId}`);
      const items = (current.items ?? []).map((li) => ({
        itemId: li._id,
        billingStatus: payload.billedItemIds.includes(li._id ?? "")
          ? ("billed" as const)
          : ("pending" as const),
      }));

      const raw = await http.patch<ApiSalesOrder>(
        `/sales-orders/${payload.orderId}/billing`,
        { items },
      );
      const order = mapSalesOrder(raw);
      if (order.items.every((li) => li.isBilled)) {
        const completed = await http.patch<ApiSalesOrder>(
          `/sales-orders/${payload.orderId}/status`,
          { status: "completed", remarks: payload.note || undefined },
        );
        return mapSalesOrder(completed);
      }
      return order;
    }

    const order = db.salesOrders.find((o) => o.id === payload.orderId);
    if (!order) throw new Error("Order not found");

    order.items = order.items.map((li) => ({
      ...li,
      isBilled: payload.billedItemIds.includes(li.id),
      billedQuantity: payload.billedItemIds.includes(li.id) ? li.quantity : 0,
    }));
    const allBilled = order.items.every((li) => li.isBilled);
    order.status = allBilled ? "completed" : "billed";
    order.billedAt = new Date().toISOString();
    order.billedById = "u6";
    if (allBilled) order.confirmedAt = order.billedAt;
    if (payload.note) order.notes = payload.note;

    db.notifications = [
      {
        id: db.nextId("n"),
        userId: order.salesRepId,
        type: "order_completed",
        title: `${order.orderNumber} billed`,
        message: `${db.dealerName(order.dealerId)} order has been billed and confirmed.`,
        entityType: "sales_order",
        entityId: order.id,
        isRead: false,
        createdAt: order.billedAt,
      },
      ...db.notifications,
    ];

    return delay(order);
  },

  /** Accounts or admin sends the order back with a reason. */
  async sendFeedback(payload: SendFeedbackPayload): Promise<Feedback> {
    if (!USE_MOCK) {
      /*
        recipientIds must contain at least one id. If the caller didn't supply
        one, fall back to the rep who placed the order — they're always the
        person who needs to hear about it.
      */
      let recipients = payload.recipientIds ?? [];
      if (recipients.length === 0) {
        const order = await http.get<ApiSalesOrder>(`/sales-orders/${payload.orderId}`);
        if (order?.salesRepId) recipients = [order.salesRepId];
      }
      if (recipients.length === 0) throw new Error("No recipient for this feedback.");

      /*
        Feedback is a message, not a rejection. Per the walkthrough, an order
        that couldn't be billed stays PENDING so it remains in the queue and in
        the pending export — it isn't closed off.
      */
      await http.post(`/sales-orders/${payload.orderId}/feedback`, {
        message: payload.message,
        recipientIds: recipients,
      });
      return {
        id: `${payload.orderId}-fb`,
        salesOrderId: payload.orderId,
        message: payload.message,
        fromUserId: payload.fromUserId,
        fromRole: payload.fromRole,
        toUserIds: recipients,
        toRoles: payload.toRoles,
        createdAt: new Date().toISOString(),
      };
    }

    const order = db.salesOrders.find((o) => o.id === payload.orderId);
    if (!order) throw new Error("Order not found");

    const recipients = new Set<string>();
    if (payload.toRoles.includes("sales")) recipients.add(order.salesRepId);
    if (payload.toRoles.includes("accounts"))
      db.users.filter((u) => u.role === "accounts").forEach((u) => recipients.add(u.id));

    const entry: Feedback = {
      id: db.nextId("f"),
      salesOrderId: payload.orderId,
      message: payload.message,
      fromUserId: payload.fromUserId,
      fromRole: payload.fromRole,
      toUserIds: [...recipients],
      toRoles: payload.toRoles,
      createdAt: new Date().toISOString(),
    };

    db.feedback = [entry, ...db.feedback];
    order.status = "rejected";
    db.notifications = [
      ...[...recipients].map((userId) => ({
        id: db.nextId("n"),
        userId,
        type: "order_feedback" as const,
        title: `${order.orderNumber} could not be billed`,
        message: payload.message,
        entityType: "sales_order" as const,
        entityId: order.id,
        isRead: false,
        createdAt: entry.createdAt,
      })),
      ...db.notifications,
    ];

    return delay(entry);
  },

  /**
   * The API has no export endpoint, so the workbook is built client-side from
   * the full filtered set — every page, not just the one on screen.
   *
   * Written as a real .xlsx with explicit column widths, so dates and amounts
   * are readable immediately rather than collapsing to ####.
   */
  async exportCsv(filters: SalesOrderFilters = {}): Promise<Blob> {
    const PAGE = 50;
    const MAX_PAGES = 100;
    const collected: SalesOrder[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await orderService.list(filters, page, PAGE);
      collected.push(...result.data);
      if (page >= result.totalPages || result.data.length === 0) break;
    }

    const XLSX = await import("xlsx");

    const sheetRows = collected.map((o) => ({
      "Order ID": o.orderNumber,
      Date: exportDate(o.createdAt),
      Dealer: o.dealerName ?? (USE_MOCK ? db.dealerName(o.dealerId) : o.dealerId),
      "Sales Rep": o.salesRepName ?? (USE_MOCK ? db.repName(o.salesRepId) : o.salesRepId),
      Items: itemSummary(o),
      "Total Qty": o.items.reduce((sum, li) => sum + li.quantity, 0),
      Billed: `${o.items.filter((li) => li.isBilled).length} of ${o.items.length}`,
      Status: ORDER_STATUS_LABEL[o.status],
      Priority: o.priority === "urgent" ? "Urgent" : "Normal",
      Value: o.totalAmount ?? 0,
      Notes: o.notes ?? "",
    }));

    const EMPTY = {
      "Order ID": "",
      Date: "",
      Dealer: "",
      "Sales Rep": "",
      Items: "",
      "Total Qty": "",
      Billed: "",
      Status: "",
      Priority: "",
      Value: "",
      Notes: "",
    };

    const sheet = XLSX.utils.json_to_sheet(sheetRows.length ? sheetRows : [EMPTY]);

    // Column widths in characters — wide enough that nothing renders as ####
    sheet["!cols"] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 26 },
      { wch: 18 },
      { wch: 46 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 14 },
      { wch: 40 },
    ];

    // Value column formatted as currency
    for (let row = 2; row <= sheetRows.length + 1; row += 1) {
      const cell = sheet[`J${row}`];
      if (cell) cell.z = "#,##0.00";
    }

    /*
      A second sheet with one row per line item, so nothing is summarised away
      — the first sheet answers "which orders", this one answers "what was in
      them and what was billed".
    */
    const itemRows = collected.flatMap((o) =>
      o.items.map((li) => ({
        "Order ID": o.orderNumber,
        Date: exportDate(o.createdAt),
        Dealer: o.dealerName ?? (USE_MOCK ? db.dealerName(o.dealerId) : o.dealerId),
        "Sales Rep": o.salesRepName ?? (USE_MOCK ? db.repName(o.salesRepId) : o.salesRepId),
        Item: li.productName,
        SKU: li.sku ?? "",
        Unit: li.unit ?? "",
        Qty: li.quantity,
        "Unit Price": li.unitPrice ?? 0,
        "Line Total": li.lineTotal ?? (li.unitPrice ?? 0) * li.quantity,
        "Billing Status": li.isBilled ? "Billed" : "Pending",
        "Qty Billed": li.billedQuantity ?? 0,
        "Order Status": ORDER_STATUS_LABEL[o.status],
      })),
    );

    const itemSheet = XLSX.utils.json_to_sheet(
      itemRows.length
        ? itemRows
        : [
            {
              "Order ID": "",
              Date: "",
              Dealer: "",
              "Sales Rep": "",
              Item: "",
              SKU: "",
              Unit: "",
              Qty: "",
              "Unit Price": "",
              "Line Total": "",
              "Billing Status": "",
              "Qty Billed": "",
              "Order Status": "",
            },
          ],
    );

    itemSheet["!cols"] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 26 },
      { wch: 18 },
      { wch: 32 },
      { wch: 14 },
      { wch: 8 },
      { wch: 7 },
      { wch: 12 },
      { wch: 13 },
      { wch: 14 },
      { wch: 11 },
      { wch: 13 },
    ];

    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Sales Orders");
    XLSX.utils.book_append_sheet(book, itemSheet, "Line Items");

    return new Blob([XLSX.write(book, { bookType: "xlsx", type: "array" })], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  },
};
