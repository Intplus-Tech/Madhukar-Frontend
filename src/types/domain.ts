/**
 * Domain types — derived from the team lead's walkthrough transcript.
 *
 * Anything marked CONFIRM is an inference, not something the walkthrough
 * stated. Check these against the backend swagger when it arrives.
 *
 * Conventions:
 *  - IDs are strings (works for both UUIDs and numeric IDs serialised as strings)
 *  - Timestamps are ISO 8601 strings; dates without time are 'YYYY-MM-DD'
 *  - Money is a plain number in major units (e.g. 45 = ₹45). CONFIRM: backend
 *    may send minor units (4500) or strings for decimal precision.
 */

// ─────────────────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────────────────

export type ID = string;
export type ISODateTime = string; // '2026-08-04T14:30:00Z'
export type ISODate = string;     // '2026-08-04'

export type UserRole = 'sales' | 'accounts' | 'admin';

export interface User {
  id: ID;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
}

/** Sales rep — the walkthrough calls them "sales representative". */
export interface SalesRep extends User {
  role: 'sales';
  routeIds: ID[];
}

// ─────────────────────────────────────────────────────────────
// Dealers & routes
// ─────────────────────────────────────────────────────────────

export interface Dealer {
  id: ID;
  name: string;                 // "Apex Motors"
  code?: string;                // CONFIRM: dealer/customer code from accounting software
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  /**
   * The rep who owns this dealer. Important: the walkthrough says sales order
   * search is NOT limited to the current route — "it can be any dealer under
   * their list, under their name". So ownership is by rep, and route is a
   * separate, narrower grouping used only for visit planning.
   */
  salesRepId: ID;
  routeId?: ID;
  outstandingAmount?: number;   // CONFIRM: shown in the dealer detail modal?
  createdAt: ISODateTime;
}

export interface Route {
  id: ID;
  name: string;
  salesRepId: ID;
  dealerIds: ID[];
  /** CONFIRM: are routes tied to a weekday, or picked ad hoc each day? */
  scheduledDay?: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  isActive: boolean;
}

// ─────────────────────────────────────────────────────────────
// Schemes / offers
// ─────────────────────────────────────────────────────────────

export type SchemeType = 'combo' | 'festive' | 'discount' | 'other';

export interface Scheme {
  id: ID;
  name: string;
  type: SchemeType;
  description?: string;
  validFrom?: ISODate;
  validTo?: ISODate;
  isActive: boolean;
}

// ─────────────────────────────────────────────────────────────
// Visit planning
// ─────────────────────────────────────────────────────────────

export type VisitPlanStatus =
  | 'planned'      // submitted in the morning, not yet actioned
  | 'completed'    // rep filed a VisitUpdate
  | 'missed';      // day passed with no update — CONFIRM whether backend
                   // computes this or it stays 'planned' forever

/**
 * Created when the rep taps a dealer on the dashboard and fills the plan form.
 * The walkthrough shows four optional blocks: order plan, payment plan,
 * service, notes — plus scheme selection.
 */
export interface VisitPlan {
  id: ID;
  dealerId: ID;
  salesRepId: ID;
  routeId?: ID;
  plannedDate: ISODate;
  status: VisitPlanStatus;

  /** "I add order plan" — intent to take an order on this visit. */
  hasOrderPlan: boolean;
  orderPlanNotes?: string;

  /** "if I have payment plan" — the 45 in "my plan was to collect 45". */
  hasPaymentPlan: boolean;
  plannedCollectionAmount?: number;

  /** "if I have service done" */
  hasServicePlan: boolean;
  servicePlanNotes?: string;

  notes?: string;
  schemeIds: ID[];

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/**
 * Filed in the evening: "I have collected 45, or I have collected 25".
 * Modelled as a separate entity rather than fields on VisitPlan because
 * plan-vs-actual is the core reporting axis and you want both preserved.
 * CONFIRM: backend may flatten this onto VisitPlan instead.
 */
export interface VisitUpdate {
  id: ID;
  visitPlanId: ID;
  dealerId: ID;
  salesRepId: ID;

  visited: boolean;
  actualCollectionAmount?: number;
  serviceCompleted: boolean;      // the toggle in the update form
  orderPlaced: boolean;           // drives "order placed or visited" in reports
  salesOrderId?: ID;              // set if orderPlaced

  notes?: string;
  submittedAt: ISODateTime;
}

/** Convenience shape for the planned list + report rows. */
export interface VisitPlanWithUpdate extends VisitPlan {
  dealer: Pick<Dealer, 'id' | 'name' | 'address' | 'phone'>;
  update?: VisitUpdate;
}

// ─────────────────────────────────────────────────────────────
// Sales orders
// ─────────────────────────────────────────────────────────────

export type OrderPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Walkthrough statuses:
 *   pending   — punched by rep, sitting on the accounts dashboard
 *   billed    — accounts marked items as billed but hasn't confirmed
 *   completed — accounts confirmed; moves to "completed" on the dashboard
 *   rejected  — couldn't be billed (e.g. stock issue); feedback sent to rep
 *
 * CONFIRM: 'billed' may not exist as a distinct state — accounts might tick
 * items and confirm in one action, making it pending → completed | rejected.
 * I've kept it because partial billing is clearly possible.
 */
export type SalesOrderStatus = 'pending' | 'billed' | 'completed' | 'rejected';

export interface Product {
  id: ID;
  name: string;
  sku?: string;
  unit?: string;        // 'pcs', 'box', 'ltr'
  unitPrice?: number;
  inStock?: boolean;    // CONFIRM: does the rep see stock at order time?
}

export interface OrderItem {
  id: ID;
  productId: ID;
  productName: string;   // denormalised so historical orders survive renames
  sku?: string;
  unit?: string;

  quantity: number;      // what the rep asked for
  unitPrice?: number;
  lineTotal?: number;

  /** Filled in by accounts. Partial fulfilment is possible. */
  billedQuantity?: number;
  isBilled: boolean;
  unbilledReason?: string; // "stock issue"
}

export interface SalesOrder {
  id: ID;
  orderNumber: string;        // human-readable, e.g. 'SO-2026-00142'
  dealerId: ID;
  salesRepId: ID;
  items: OrderItem[];
  priority: OrderPriority;
  status: SalesOrderStatus;

  totalAmount?: number;
  notes?: string;

  createdAt: ISODateTime;     // when the rep submitted
  billedAt?: ISODateTime;
  billedById?: ID;            // accounts user
  confirmedAt?: ISODateTime;
}

/** What the accounts "bill now" modal and admin detail view need. */
export interface SalesOrderDetail extends SalesOrder {
  dealer: Dealer;
  salesRep: Pick<User, 'id' | 'name' | 'phone' | 'email'>;
  feedback: Feedback[];
}

// ─────────────────────────────────────────────────────────────
// Feedback
// ─────────────────────────────────────────────────────────────

/**
 * Two flows in the walkthrough:
 *   accounts → sales  ("this isn't billed yet")
 *   admin → accounts + sales (from the admin order detail view)
 * So recipients is a list, not a single user.
 *
 * CONFIRM: is this a thread (replies) or fire-and-forget? I've modelled a flat
 * list attached to an order, which supports both.
 */
export interface Feedback {
  id: ID;
  salesOrderId: ID;
  message: string;
  fromUserId: ID;
  fromRole: UserRole;
  toUserIds: ID[];
  toRoles: UserRole[];
  createdAt: ISODateTime;
}

// ─────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'order_feedback'      // accounts/admin → rep: couldn't bill
  | 'order_billed'
  | 'order_completed'
  | 'order_received'      // rep punched an order → accounts
  | 'visit_reminder';     // CONFIRM: does this exist?

export type NotificationEntity = 'sales_order' | 'visit_plan' | 'dealer';

export interface Notification {
  id: ID;
  userId: ID;             // recipient
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntity;
  entityId: ID;           // deep-link target
  isRead: boolean;
  createdAt: ISODateTime;
}

// ─────────────────────────────────────────────────────────────
// Reports & dashboards
// ─────────────────────────────────────────────────────────────

/** Sales rep's own report page: planned vs achieved. */
export interface SalesRepReport {
  salesRepId: ID;
  periodStart: ISODate;
  periodEnd: ISODate;

  dealersPlanned: number;
  dealersVisited: number;
  plannedCollection: number;
  achievedCollection: number;
  ordersPlaced: number;
  servicesCompleted: number;
}

/** One bar/series in the admin "plans vs achieved" graph. */
export interface PlanVsAchieved {
  salesRepId: ID;
  salesRepName: string;
  planned: number;
  achieved: number;
}

export interface AdminDashboardSummary {
  totalPlanned: number;
  totalBills: number;
  pendingBills: number;
  planVsAchieved: PlanVsAchieved[];
  latestOrders: SalesOrder[];
}

export interface AccountsDashboardSummary {
  pendingOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  latestOrders: SalesOrder[];
}

// ─────────────────────────────────────────────────────────────
// Filtering, pagination, export
// ─────────────────────────────────────────────────────────────

export interface DateRange {
  from?: ISODate;
  to?: ISODate;
}

/** Drives the filter bar on accounts + admin order lists. */
export interface SalesOrderFilters {
  status?: SalesOrderStatus | SalesOrderStatus[];
  salesRepId?: ID;
  dealerId?: ID;
  priority?: OrderPriority;
  dateRange?: DateRange;
  search?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type ExportFormat = 'csv' | 'xlsx';

export interface ExportRequest {
  filters: SalesOrderFilters;
  format: ExportFormat;
  columns?: string[];
}

// ─────────────────────────────────────────────────────────────
// API envelope
// ─────────────────────────────────────────────────────────────
// CONFIRM: shape depends entirely on the backend. Placeholder until swagger.

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// ─────────────────────────────────────────────────────────────
// UI-only additions (screens, not backend contract)
// ─────────────────────────────────────────────────────────────

/** Visit outcome pill shown on the sales Report screen. */
export type VisitOutcome =
  | 'order_placed'
  | 'visited'
  | 'payment_collected'
  | 'not_visited';

export interface DealerVisitSummary {
  id: ID;
  dealerId: ID;
  dealerName: string;
  address: string;
  outcome: VisitOutcome;
  plannedAmount: number;
  achievedAmount: number | null;
  latitude?: number;
  longitude?: number;
}

/** Sales dashboard hero block. */
export interface SalesDashboardSummary {
  repName: string;
  routeName: string;
  date: ISODate;
  dealersScheduled: number;
  orderPlanValue: number;
  plannedCount: number;
  totalCount: number;
  planSubmitted: boolean;
  upcomingActivity: Array<{
    dealerId: ID;
    dealerName: string;
    purpose: string;
  }>;
}

/** Sales Report screen. */
export interface SalesReport {
  achievedPercent: number;
  plannedTotal: number;
  achievedTotal: number;
  remainingGap: number;
  performanceLabel: 'Above Avg' | 'On Track' | 'Below Avg';
  visits: DealerVisitSummary[];
}

/** Accounts dashboard "Needs Attention" row. */
export interface AttentionOrder {
  id: ID;
  orderNumber: string;
  dealerName: string;
  area: string;
  salesRepName: string;
  pendingDays: number;
}

export interface AccountsOverview {
  ordersPendingBilling: number;
  pendingTrendPercent: number;
  blockedOrders: number;
  totalBillsToday: number;
  needsAttention: AttentionOrder[];
}

/** Admin Reports & Team table row. */
export interface TeamPerformanceRow {
  userId: ID;
  name: string;
  initials: string;
  position: string;
  activity: number;
  actualSales: number;
  targetPercent: number;
  collected: number;
  outstanding: number;
}

export interface TeamPerformance {
  period: string;
  rows: TeamPerformanceRow[];
  totals: Omit<TeamPerformanceRow, 'userId' | 'name' | 'initials' | 'position'>;
}

/** Admin dashboard chart point. */
export interface PlanVsAchievedPoint {
  label: string;
  plan: number;
  actual: number;
}

export type DashboardPeriod = 'today' | 'wtd' | 'mtd';

// ─────────────────────────────────────────────────────────────
// Team & Access Management (admin › Reports & Team)
// ─────────────────────────────────────────────────────────────

export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export type TeamMemberStatus = 'on_field' | 'active' | 'inactive';

/** Position label shown in the Role column and the edit modal's select. */
export type TeamPosition = 'Sales Rep' | 'Accountant' | 'Manager';

export interface TeamMemberPermissions {
  /** "Allow Order Creation on behalf of dealers" */
  allowOrderCreation: boolean;
  /** "Allow Manual Discount Overrides" */
  allowDiscountOverride: boolean;
}

export interface TeamMember {
  id: ID;
  name: string;
  email: string;
  position: TeamPosition;
  status: TeamMemberStatus;

  /** Sales reps plan visits; accountants process bills. Same bar, different noun. */
  plannedCount: number;
  plannedTotal: number;

  routeId?: ID;
  routeName?: string;
  /** Empty for full-time office staff, which the UI renders as "Mon – Fri (Full Time)". */
  schedule: WeekDay[];
  isFullTime: boolean;

  permissions: TeamMemberPermissions;
}

export type TeamTab = 'all' | 'sales' | 'accounts';

export interface UpdateTeamMemberPayload {
  id: ID;
  name: string;
  position: TeamPosition;
  routeId?: ID;
  plannedTotal: number;
  schedule: WeekDay[];
  permissions: TeamMemberPermissions;
}
