import type {
  AccountsOverview,
  AdminDashboardSummary,
  DashboardPeriod,
  PlanVsAchievedPoint,
  SalesReport,
  TeamPerformance,
} from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
import { mapSalesOrder, type ApiSalesOrder } from "../mappers";

interface VarianceRow {
  visitDate?: string;
  createdAt?: string;
  plannedAmountSnapshot?: number;
  plannedAmount?: number;
  collectedAmount?: number;
  variance?: number;
}

/** The chart's period tabs map onto the endpoint's dateFrom/dateTo. */
function periodRange(period: DashboardPeriod) {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now);

  if (period === "wtd") from.setDate(now.getDate() - now.getDay());
  else if (period === "mtd") from.setDate(1);

  return { dateFrom: from.toISOString().slice(0, 10), dateTo: to };
}

function formatChartDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function daysSince(iso: string) {
  if (!iso) return 0;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}
import { db } from "../mock/db";

export const reportService = {
  /** Sales rep's own end-of-day report. */
  async salesReport(salesRepId: string): Promise<SalesReport> {
    if (!USE_MOCK) {
      const res = await http.get<{
        overallPerformance?: { achievedPercent?: number; planned?: number; achieved?: number };
        dealerVisitsCount?: number;
        dealerVisits?: Array<{
          dealerId?: string;
          dealerName?: string;
          location?: string;
          address?: string;
          plannedAmount?: number;
          collectedAmount?: number | null;
          orderPlaced?: boolean;
          visited?: boolean;
        }>;
      }>("/reports/end-of-day");

      const perf = res.overallPerformance ?? {};
      const planned = perf.planned ?? 0;
      const achieved = perf.achieved ?? 0;
      const percent = perf.achievedPercent ?? (planned ? Math.round((achieved / planned) * 100) : 0);

      return {
        achievedPercent: percent,
        plannedTotal: planned,
        achievedTotal: achieved,
        remainingGap: Math.max(0, planned - achieved),
        performanceLabel: percent >= 90 ? "Above Avg" : percent >= 70 ? "On Track" : "Below Avg",
        visits: (res.dealerVisits ?? []).map((v, i) => ({
          id: `${v.dealerId ?? "visit"}-${i}`,
          dealerId: v.dealerId ?? "",
          dealerName: v.dealerName ?? "Dealer",
          address: v.location ?? v.address ?? "",
          outcome: v.orderPlaced
            ? "order_placed"
            : (v.collectedAmount ?? 0) > 0
              ? "payment_collected"
              : v.visited
                ? "visited"
                : "not_visited",
          plannedAmount: v.plannedAmount ?? 0,
          achievedAmount: v.collectedAmount ?? null,
        })),
      };
    }

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
    if (!USE_MOCK) {
      /*
        /reports/sales-summary doesn't document its key names, so the counts
        come from the orders endpoint instead — one row per status, reading the
        `total` out of the pagination meta.
      */
      const countFor = async (status: string) => {
        const res = await http.get<Record<string, unknown>>("/sales-orders", {
          status,
          page: 1,
          limit: 1,
        });
        const meta = (res.meta ?? res) as { total?: number };
        return meta.total ?? 0;
      };

      const [pendingCount, blockedCount, completedCount, pendingRows] = await Promise.all([
        countFor("pending"),
        countFor("rejected"),
        countFor("completed"),
        http.get<{ data?: ApiSalesOrder[]; items?: ApiSalesOrder[] }>("/sales-orders", {
          status: "pending",
          limit: 10,
        }),
      ]);

      const rows = pendingRows.data ?? pendingRows.items ?? [];

      return {
        ordersPendingBilling: pendingCount,
        pendingTrendPercent: 0,
        blockedOrders: blockedCount,
        totalBillsToday: completedCount,
        needsAttention: rows.slice(0, 6).map((o) => ({
          id: o._id,
          orderNumber: o._id.slice(-8).toUpperCase(),
          dealerName: o.dealerName ?? "Dealer",
          area: "—",
          salesRepName: o.salesRepName ?? "—",
          pendingDays: daysSince(o.orderDate ?? o.createdAt ?? ""),
        })),
      };
    }

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
    if (!USE_MOCK) {
      /*
        Same approach as the accounts overview: /reports/sales-summary doesn't
        document its key names, so counts come from the orders endpoint's
        pagination totals instead.
      */
      const countFor = async (status?: string) => {
        const res = await http.get<Record<string, unknown>>("/sales-orders", {
          status,
          page: 1,
          limit: 1,
        });
        const meta = (res.meta ?? res) as { total?: number };
        return meta.total ?? 0;
      };

      const [completed, pending, planned, latest, variance] = await Promise.all([
        countFor("completed"),
        countFor("pending"),
        http
          .get<Record<string, unknown>>("/visit-plans", { page: 1, limit: 1 })
          .then((r) => ((r.meta ?? r) as { total?: number }).total ?? 0)
          .catch(() => 0),
        http
          .get<{ data?: ApiSalesOrder[]; items?: ApiSalesOrder[] }>("/sales-orders", { limit: 5 })
          .catch(() => ({ data: [] as ApiSalesOrder[], items: [] as ApiSalesOrder[] })),
        /*
          Rows come from the VisitUpdate collection and carry
          plannedAmountSnapshot rather than plannedAmount. The endpoint takes
          dateFrom/dateTo, not a period keyword.
        */
        http
          .get<{
            data?: VarianceRow[];
            items?: VarianceRow[];
          }>("/reports/visit-variance", { ...periodRange(period), limit: 30 })
          .catch(() => ({ data: [] as VarianceRow[], items: [] as VarianceRow[] })),
      ]);

      const varianceRows = variance.data ?? variance.items ?? [];

      return {
        totalPlanned: planned,
        totalBills: completed,
        pendingBills: pending,
        planVsAchieved: [],
        latestOrders: (latest.data ?? latest.items ?? []).map(mapSalesOrder),
        chart: varianceRows.map((row) => ({
          label: formatChartDate(row.visitDate ?? row.createdAt),
          plan: row.plannedAmountSnapshot ?? row.plannedAmount ?? 0,
          actual: row.collectedAmount ?? 0,
        })),
      };
    }

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
