import type {
  AccountsOverview,
  AdminDashboardSummary,
  DashboardPeriod,
  PlanVsAchievedPoint,
  SalesReport,
  TeamPerformance,
} from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
import { db } from "../mock/db";

export const reportService = {
  /** Sales rep's own end-of-day report. */
  async salesReport(salesRepId: string): Promise<SalesReport> {
    if (!USE_MOCK) return http.get<SalesReport>("/reports/sales", { salesRepId });

    return delay({
      achievedPercent: 85,
      plannedTotal: 10,
      achievedTotal: 8,
      remainingGap: 2,
      performanceLabel: "Above Avg",
      visits: [
        {
          id: "v1",
          dealerId: "d1",
          dealerName: "Apex Motors",
          address: "24 Industrial Estate, Lagos Central",
          outcome: "order_placed",
          plannedAmount: 50000,
          achievedAmount: 48500,
        },
        {
          id: "v2",
          dealerId: "d2",
          dealerName: "Downtown Spare Parts",
          address: "Suite 12, Heritage Mall, Ikeja",
          outcome: "visited",
          plannedAmount: 25000,
          achievedAmount: 0,
        },
        {
          id: "v3",
          dealerId: "d3",
          dealerName: "Elite Automotive Solutions",
          address: "Plot 4B, Commercial Way, Victoria Island",
          outcome: "payment_collected",
          plannedAmount: 120000,
          achievedAmount: 120000,
        },
        {
          id: "v4",
          dealerId: "d4",
          dealerName: "Global Auto Logistics",
          address: "118 Airport Road, Ikeja Gra",
          outcome: "not_visited",
          plannedAmount: 45000,
          achievedAmount: null,
        },
      ],
    });
  },

  async accountsOverview(): Promise<AccountsOverview> {
    if (!USE_MOCK) return http.get<AccountsOverview>("/reports/accounts-overview");

    const pending = db.salesOrders.filter((o) => o.status === "pending");
    const blocked = db.salesOrders.filter((o) => o.status === "rejected");

    return delay({
      ordersPendingBilling: 84,
      pendingTrendPercent: 12,
      blockedOrders: Math.max(16, blocked.length),
      totalBillsToday: 100,
      needsAttention: [
        { id: "o3", orderNumber: "SO-98231", dealerName: "Apex Distribution Ltd.", area: "Chickpet", salesRepName: "Maruthi", pendingDays: 1 },
        { id: "o4", orderNumber: "SO-98231", dealerName: "Blue Horizon Retail", area: "Sultanpet", salesRepName: "Ashwin", pendingDays: 2 },
        { id: "o5", orderNumber: "SO-98231", dealerName: "Global Logistics Co.", area: "Chamrajpet", salesRepName: "Sachin", pendingDays: 3 },
        { id: "o9", orderNumber: "SO-98231", dealerName: "Vanguard Enterprises", area: "Chickpet", salesRepName: "Nagesh", pendingDays: 1 },
      ].slice(0, Math.max(4, pending.length)),
    });
  },

  async adminDashboard(period: DashboardPeriod): Promise<
    AdminDashboardSummary & { chart: PlanVsAchievedPoint[] }
  > {
    if (!USE_MOCK)
      return http.get<AdminDashboardSummary & { chart: PlanVsAchievedPoint[] }>(
        "/reports/admin-dashboard",
        { period },
      );

    const labels = ["23rd Oct", "24th Oct", "25th Oct", "26th Oct", "27th Oct", "28th Oct", "29th Oct", "30th Oct"];

    return delay({
      totalPlanned: 140,
      totalBills: 50,
      pendingBills: 6,
      planVsAchieved: [],
      latestOrders: db.salesOrders.slice(0, 5),
      chart: labels.map((label) => ({ label, plan: 1_602_000, actual: 1_102_000 })),
    });
  },

  async teamPerformance(period: string): Promise<TeamPerformance> {
    if (!USE_MOCK) return http.get<TeamPerformance>("/reports/team", { period });

    const rows = [
      { userId: "u4", name: "Sachin", initials: "SA", position: "Sales Rep", activity: 120000, actualSales: 135400, targetPercent: 112, collected: 125000, outstanding: 10400 },
      { userId: "u3", name: "Ashwin", initials: "AS", position: "Sales Rep", activity: 95000, actualSales: 92100, targetPercent: 97, collected: 80000, outstanding: 12100 },
      { userId: "u7", name: "Alice Johnson", initials: "AJ", position: "Accountant", activity: 110000, actualSales: 85000, targetPercent: 77, collected: 85000, outstanding: 0 },
    ];

    return delay({
      period,
      rows,
      totals: {
        activity: rows.reduce((s, r) => s + r.activity, 0),
        actualSales: rows.reduce((s, r) => s + r.actualSales, 0),
        targetPercent: 96,
        collected: rows.reduce((s, r) => s + r.collected, 0),
        outstanding: rows.reduce((s, r) => s + r.outstanding, 0),
      },
    });
  },
};
