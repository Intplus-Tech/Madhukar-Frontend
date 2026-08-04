import type {
  Feedback,
  OrderPriority,
  Paginated,
  SalesOrder,
  SalesOrderDetail,
  SalesOrderFilters,
} from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
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
}

export const orderService = {
  async list(
    filters: SalesOrderFilters = {},
    page = 1,
    pageSize = 15,
  ): Promise<Paginated<SalesOrder>> {
    if (!USE_MOCK)
      return http.get<Paginated<SalesOrder>>("/sales-orders", {
        status: filters.status,
        salesRepId: filters.salesRepId,
        dealerId: filters.dealerId,
        priority: filters.priority,
        search: filters.search,
        from: filters.dateRange?.from,
        to: filters.dateRange?.to,
        page,
        pageSize,
      });

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
    if (!USE_MOCK) return http.get<SalesOrderDetail>(`/sales-orders/${id}`);

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
    if (!USE_MOCK) return http.post<SalesOrder>("/sales-orders", payload);

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
    if (!USE_MOCK)
      return http.post<SalesOrder>(`/sales-orders/${payload.orderId}/confirm`, payload);

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
    if (!USE_MOCK)
      return http.post<Feedback>(`/sales-orders/${payload.orderId}/feedback`, payload);

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

  /** Server-driven export keeps the filter logic in one place. */
  async exportCsv(filters: SalesOrderFilters = {}): Promise<Blob> {
    if (!USE_MOCK) {
      const res = await fetch("/api/export", { method: "POST", body: JSON.stringify(filters) });
      return res.blob();
    }

    const { data } = await orderService.list(filters, 1, 10_000);
    const header = ["Order ID", "Dealer", "Representative", "Date", "Status", "Priority", "Amount"];
    const rows = data.map((o) => [
      o.orderNumber,
      db.dealerName(o.dealerId),
      db.repName(o.salesRepId),
      o.createdAt.slice(0, 10),
      o.status,
      o.priority,
      String(o.totalAmount ?? 0),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
  },
};
