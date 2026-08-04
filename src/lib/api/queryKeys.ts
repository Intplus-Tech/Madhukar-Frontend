import type { SalesOrderFilters, DashboardPeriod } from "@/types/domain";

/** Centralised React Query keys so invalidation never guesses. */
export const qk = {
  me: ["me"] as const,
  salesDashboard: (repId: string) => ["sales", "dashboard", repId] as const,
  visitPlans: (repId: string, date?: string) => ["sales", "plans", repId, date] as const,
  salesReport: (repId: string) => ["sales", "report", repId] as const,
  dealerSearch: (q: string, repId?: string) => ["dealers", "search", q, repId] as const,
  dealer: (id: string) => ["dealers", id] as const,
  route: (repId: string) => ["routes", "current", repId] as const,
  products: (q: string) => ["products", q] as const,
  orders: (filters: SalesOrderFilters, page: number) => ["orders", filters, page] as const,
  order: (id: string) => ["orders", id] as const,
  accountsOverview: ["accounts", "overview"] as const,
  adminDashboard: (period: DashboardPeriod) => ["admin", "dashboard", period] as const,
  teamPerformance: (period: string) => ["admin", "team", period] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
  unreadCount: (userId: string) => ["notifications", "unread", userId] as const,
};
