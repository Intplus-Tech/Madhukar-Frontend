import type { User, UserRole } from "@/types/domain";

/**
 * Raw shapes exactly as the backend returns them, plus mappers into the app's
 * domain types.
 *
 * Everything that differs between the API and the UI is isolated here — Mongo
 * `_id`, `fullName`, `location`, and so on. Components never see these shapes,
 * so a rename on the backend is a change to this file only.
 */

export interface ApiAuthUser {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email: string;
  role?: string;
  isActive?: boolean;
  status?: string;
  phoneNumber?: string | null;
  assignedRouteId?: string | null;
  assignedRouteName?: string | null;
  visitQuotaTarget?: number;
  scheduleDays?: string[];
  permissions?: {
    allowOrderCreationOnBehalfOfDealers?: boolean;
    allowManualDiscountOverrides?: boolean;
  };
}

export interface ApiAuthResponse {
  user: ApiAuthUser;
  token: string;
  refreshToken: string;
}

export interface ApiDealer {
  _id: string;
  name: string;
  location?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  billingAddress?: string | null;
  salesRepId?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

/**
 * TEMPORARY — the backend's role enum is currently ['user', 'admin'], but the
 * app needs three roles: sales, accounts, admin.
 *
 * Until the enum is widened, 'admin' maps straight through and everything else
 * falls back to inferring from the email prefix, exactly as the mock layer did.
 *
 * DELETE this function the moment login returns a real three-value role. It is
 * the only place in the codebase that guesses at a role.
 */
export function resolveRole(apiRole: string | undefined, email: string): UserRole {
  const role = (apiRole ?? "").toLowerCase();

  if (role === "admin" || role === "manager") return "admin";
  if (role === "accounts" || role === "account" || role === "accountant") return "accounts";
  if (role === "sales" || role === "sales_rep" || role === "salesrep") return "sales";

  // Fallback while the backend only distinguishes 'user' from 'admin'
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.startsWith("admin") || local.startsWith("manager")) return "admin";
  if (local.startsWith("accounts") || local.startsWith("account") || local.startsWith("finance"))
    return "accounts";
  return "sales";
}

export function mapUser(raw: ApiAuthUser): User {
  return {
    id: raw._id ?? raw.id ?? "",
    name: raw.fullName ?? raw.name ?? raw.email.split("@")[0] ?? "User",
    email: raw.email,
    phone: raw.phoneNumber ?? undefined,
    role: resolveRole(raw.role, raw.email),
    isActive: raw.isActive ?? (raw.status ? raw.status === "active" : true),
  };
}

export function mapDealer(raw: ApiDealer) {
  return {
    id: raw._id,
    name: raw.name,
    // billingAddress is the postal address; location is the area/territory
    address: raw.billingAddress ?? raw.location ?? undefined,
    city: raw.location ?? undefined,
    contactPerson: raw.contactName ?? undefined,
    email: raw.contactEmail ?? undefined,
    phone: raw.contactPhone ?? undefined,
    salesRepId: raw.salesRepId ?? "",
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

/** The backend paginates as { items, page, limit, total, totalPages } or similar. */
export function mapPaginated<TRaw, TOut>(
  payload: { items?: TRaw[]; data?: TRaw[]; meta?: ApiPaginationMeta } & ApiPaginationMeta,
  mapItem: (raw: TRaw) => TOut,
) {
  // The API nests rows under `data`; `items` kept as a fallback
  const rows = payload.data ?? payload.items ?? [];
  const meta = payload.meta ?? payload;
  const page = meta.page ?? 1;
  const pageSize = meta.limit ?? rows.length;
  const total = meta.total ?? rows.length;

  return {
    data: rows.map(mapItem),
    page,
    pageSize,
    total,
    totalPages: meta.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, pageSize))),
  };
}

// ─────────────────────────────────────────────────────────────
// Remaining API shapes
// ─────────────────────────────────────────────────────────────

import type {
  Notification,
  OrderPriority,
  Product,
  SalesOrder,
  SalesOrderStatus,
  VisitPlan,
} from "@/types/domain";

export interface ApiProduct {
  _id: string;
  name: string;
  sku?: string;
  category?: string;
  unitPrice?: number;
  isActive?: boolean;
}

export function mapProduct(raw: ApiProduct): Product {
  return {
    id: raw._id,
    name: raw.name,
    sku: raw.sku,
    unitPrice: raw.unitPrice,
    inStock: raw.isActive ?? true,
  };
}

export interface ApiSalesOrderItem {
  _id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  billingStatus?: "pending" | "billed";
}

export interface ApiSalesOrder {
  _id: string;
  dealerId: string;
  dealerName?: string;
  salesRepId: string;
  salesRepName?: string;
  items?: ApiSalesOrderItem[];
  orderAmount?: number;
  status?: string;
  orderDate?: string;
  remarks?: string;
  feedback?: Array<{
    message: string;
    recipientIds?: string[];
    sentBy?: string;
    sentByName?: string;
    sentAt?: string;
  }>;
  createdAt?: string;
}

/**
 * The API has a `partially_billed` state the original UI model didn't. It maps
 * onto `billed`, which the UI already treats as "some items done, not confirmed".
 */
function mapOrderStatus(status?: string): SalesOrderStatus {
  switch (status) {
    case "completed":
      return "completed";
    case "rejected":
      return "rejected";
    case "billed":
    case "partially_billed":
      return "billed";
    default:
      return "pending";
  }
}

export function mapSalesOrder(raw: ApiSalesOrder): SalesOrder {
  const items = (raw.items ?? []).map((li, i) => ({
    id: li._id ?? `${raw._id}-li${i}`,
    productId: li.productId,
    productName: li.productName,
    quantity: li.quantity,
    unitPrice: li.unitPrice,
    lineTotal: li.lineTotal ?? (li.unitPrice ?? 0) * li.quantity,
    billedQuantity: li.billingStatus === "billed" ? li.quantity : 0,
    isBilled: li.billingStatus === "billed",
  }));

  return {
    id: raw._id,
    // The API has no separate human-readable number, so the id doubles as one
    orderNumber: raw._id.slice(-8).toUpperCase(),
    dealerId: raw.dealerId,
    salesRepId: raw.salesRepId,
    items,
    priority: "medium",
    status: mapOrderStatus(raw.status),
    totalAmount: raw.orderAmount ?? items.reduce((s, li) => s + (li.lineTotal ?? 0), 0),
    notes: raw.remarks,
    dealerName: raw.dealerName,
    salesRepName: raw.salesRepName,
    createdAt: raw.orderDate ?? raw.createdAt ?? new Date().toISOString(),
  };
}

/** Denormalised names ride along on list rows, so tables never need a lookup. */
export function orderDisplayNames(raw: ApiSalesOrder) {
  return { dealerName: raw.dealerName ?? "—", salesRepName: raw.salesRepName ?? "—" };
}

export interface ApiVisitPlan {
  _id: string;
  dealerId: string;
  dealerName?: string;
  salesRepId: string;
  salesRepName?: string;
  visitDate?: string;
  plannedAmount?: number;
  orderPlanAmount?: number;
  hasServiceIssue?: boolean;
  serviceIssueNote?: string;
  remarks?: string;
  status?: "pending" | "submitted";
  createdAt?: string;
  updatedAt?: string;
}

export function mapVisitPlan(raw: ApiVisitPlan): VisitPlan {
  return {
    id: raw._id,
    dealerId: raw.dealerId,
    salesRepId: raw.salesRepId,
    plannedDate: (raw.visitDate ?? new Date().toISOString()).slice(0, 10),
    status: raw.status === "submitted" ? "completed" : "planned",
    hasOrderPlan: (raw.orderPlanAmount ?? 0) > 0,
    hasPaymentPlan: (raw.plannedAmount ?? 0) > 0,
    plannedCollectionAmount: raw.plannedAmount,
    hasServicePlan: raw.hasServiceIssue ?? false,
    servicePlanNotes: raw.serviceIssueNote,
    notes: raw.remarks,
    schemeIds: [],
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

export interface ApiNotification {
  _id: string;
  userId: string;
  type?: string;
  title: string;
  message: string;
  isRead?: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt?: string;
}

export function mapNotification(raw: ApiNotification): Notification {
  const entity =
    raw.relatedEntityType === "visitPlan"
      ? "visit_plan"
      : raw.relatedEntityType === "dealer"
        ? "dealer"
        : "sales_order";

  return {
    id: raw._id,
    userId: raw.userId,
    type: raw.type === "order" ? "order_feedback" : "order_completed",
    title: raw.title,
    message: raw.message,
    entityType: entity,
    entityId: raw.relatedEntityId ?? "",
    isRead: raw.isRead ?? false,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

/** UI has four priority levels; the API has two. */
export function toApiPriority(priority: OrderPriority): "normal" | "urgent" {
  return priority === "urgent" || priority === "high" ? "urgent" : "normal";
}
