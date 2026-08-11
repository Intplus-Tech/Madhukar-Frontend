import type {
  Feedback,
  OrderPriority,
  Paginated,
  SalesOrder,
  SalesOrderDetail,
  SalesOrderFilters,
} from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
import { formatDate } from "@/lib/utils";
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
          search: filters.search,
          startDate: filters.dateRange?.from,
          endDate: filters.dateRange?.to,
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

      // Feedback is purely a message — the status change is a separate call
      await http.post(`/sales-orders/${payload.orderId}/feedback`, {
        message: payload.message,
        recipientIds: recipients,
      });
      await http.patch(`/sales-orders/${payload.orderId}/status`, {
        status: "rejected",
        remarks: payload.message.slice(0, 2000),
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
   * The API has no export endpoint, so the CSV is built client-side from the
   * full filtered set — paging through results rather than exporting only the
   * page currently on screen.
   */
  async exportCsv(filters: SalesOrderFilters = {}): Promise<Blob> {
    if (!USE_MOCK) {
      const PAGE = 50; // the API rejects large page sizes
      const MAX_PAGES = 50; // 5,000 rows — beyond that, ask for a real export endpoint
      const rows: SalesOrder[] = [];

      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const result = await orderService.list(filters, page, PAGE);
        rows.push(...result.data);
        if (page >= result.totalPages || result.data.length === 0) break;
      }

      const header = [
        "Order ID",
        "Dealer",
        "Representative",
        "Date",
        "Status",
        "Items",
        "Amount",
      ];

      /*
        Names come denormalised on each row, so the export shows what a person
        would recognise rather than database ids. The date is written as a
        readable string so spreadsheets don't reformat it into ####.
      */
      const body = rows.map((o) => [
        o.orderNumber,
        o.dealerName ?? o.dealerId,
        o.salesRepName ?? o.salesRepId,
        formatDate(o.createdAt),
        ORDER_STATUS_LABEL[o.status],
        String(o.items.length),
        String(o.totalAmount ?? 0),
      ]);
      const csvText = [header, ...body]
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      return new Blob([csvText], { type: "text/csv;charset=utf-8;" });
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
