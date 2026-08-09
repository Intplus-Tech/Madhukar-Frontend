import type {
  SalesDashboardSummary,
  VisitPlan,
  VisitPlanWithUpdate,
  VisitUpdate,
} from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
import { mapVisitPlan, type ApiVisitPlan } from "../mappers";
import { db } from "../mock/db";

export interface SubmitPlanPayload {
  dealerId: string;
  salesRepId: string;
  routeId?: string;
  plannedDate: string;
  orderPlanValue: number;
  paymentPlanValue: number;
  hasServiceIssue: boolean;
  serviceIssueNote?: string;
  remarks?: string;
}

export interface SubmitUpdatePayload {
  visitPlanId: string;
  actualCollectionAmount: number;
  actualOrderValue: number;
  serviceCompleted: boolean;
  serviceNote?: string;
  remarks?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export const planningService = {
  async dashboard(salesRepId: string): Promise<SalesDashboardSummary> {
    if (!USE_MOCK) {
      const res = await http.get<{
        date?: string;
        dealersScheduled?: number;
        orderPlanTotal?: number;
        planProgress?: { planned?: number; total?: number; completed?: number };
        upcomingActivity?: Array<{
          dealerId?: string;
          _id?: string;
          dealerName?: string;
          name?: string;
          purpose?: string;
          title?: string;
        }>;
      }>("/reports/dashboard-summary");

      const planned = res.planProgress?.planned ?? res.planProgress?.completed ?? 0;
      const total = res.planProgress?.total ?? res.dealersScheduled ?? 0;

      return {
        repName: "there",
        routeName: "Today's route",
        date: (res.date ?? new Date().toISOString()).slice(0, 10),
        dealersScheduled: res.dealersScheduled ?? 0,
        orderPlanValue: res.orderPlanTotal ?? 0,
        plannedCount: planned,
        totalCount: total,
        planSubmitted: planned > 0,
        upcomingActivity: (res.upcomingActivity ?? []).map((a) => ({
          dealerId: a.dealerId ?? a._id ?? "",
          dealerName: a.dealerName ?? a.name ?? "Dealer",
          purpose: a.purpose ?? a.title ?? "Scheduled visit",
        })),
      };
    }

    const route = db.routes.find((r) => r.salesRepId === salesRepId) ?? db.routes[0];
    const dealerIds = route?.dealerIds ?? [];
    const plans = db.visitPlans.filter(
      (p) => p.salesRepId === salesRepId && p.plannedDate === today(),
    );

    return delay({
      repName: db.repName(salesRepId).split(" ")[0]!,
      routeName: route?.name ?? "Unassigned",
      date: today(),
      dealersScheduled: 12,
      orderPlanValue: plans.reduce((s, p) => s + (p.plannedCollectionAmount ?? 0), 0),
      plannedCount: plans.length,
      totalCount: 12,
      planSubmitted: plans.length > 0,
      upcomingActivity: dealerIds.slice(0, 4).map((id, i) => ({
        dealerId: id,
        dealerName: db.dealerName(id),
        purpose: i === 0 ? "Inventory Check & Restock" : "Quarterly Review Meeting",
      })),
    });
  },

  async listPlans(salesRepId: string, date = today()): Promise<VisitPlanWithUpdate[]> {
    if (!USE_MOCK) {
      const res = await http.get<{ items?: ApiVisitPlan[] }>("/visit-plans", {
        salesRepId,
        visitDate: date,
        limit: 100,
      });
      return (res.items ?? []).map((raw) => ({
        ...mapVisitPlan(raw),
        dealer: { id: raw.dealerId, name: raw.dealerName ?? "Dealer" },
        notes: raw.remarks,
      }));
    }

    const route = db.routes.find((r) => r.salesRepId === salesRepId) ?? db.routes[0];
    const dealerIds = route?.dealerIds ?? [];

    // Every dealer on the route appears; a plan may or may not exist yet.
    const rows = dealerIds.map<VisitPlanWithUpdate>((dealerId, index) => {
      const dealer = db.dealers.find((d) => d.id === dealerId)!;
      const existing = db.visitPlans.find(
        (p) => p.dealerId === dealerId && p.plannedDate === date,
      );
      const update = existing
        ? db.visitUpdates.find((u) => u.visitPlanId === existing.id)
        : undefined;

      const base: VisitPlan = existing ?? {
        id: `draft-${dealerId}`,
        dealerId,
        salesRepId,
        routeId: route?.id,
        plannedDate: date,
        status: "planned",
        hasOrderPlan: false,
        hasPaymentPlan: false,
        hasServicePlan: false,
        schemeIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ...base,
        dealer: {
          id: dealer.id,
          name: dealer.name,
          address: dealer.address,
          phone: dealer.phone,
        },
        update,
        // Purpose text shown under the dealer name in the Figma
        notes: base.notes ?? (index === 0 ? "Inventory Check & Restock" : "Quarterly Review Meeting"),
      };
    });

    return delay(rows);
  },

  async submitPlan(payload: SubmitPlanPayload): Promise<VisitPlan> {
    if (!USE_MOCK) {
      const created = await http.post<ApiVisitPlan>("/visit-plans", {
        dealerId: payload.dealerId,
        visitDate: payload.plannedDate,
        plannedAmount: payload.paymentPlanValue,
        orderPlanAmount: payload.orderPlanValue,
        hasServiceIssue: payload.hasServiceIssue,
        serviceIssueNote: payload.serviceIssueNote,
        remarks: payload.remarks,
      });
      // Creating and submitting are separate calls — "SUBMIT PLAN" does both
      const submitted = await http.post<ApiVisitPlan>(`/visit-plans/${created._id}/submit`);
      return mapVisitPlan(submitted ?? created);
    }

    const now = new Date().toISOString();
    const plan: VisitPlan = {
      id: db.nextId("vp"),
      dealerId: payload.dealerId,
      salesRepId: payload.salesRepId,
      routeId: payload.routeId,
      plannedDate: payload.plannedDate,
      status: "planned",
      hasOrderPlan: payload.orderPlanValue > 0,
      orderPlanNotes: undefined,
      hasPaymentPlan: payload.paymentPlanValue > 0,
      plannedCollectionAmount: payload.paymentPlanValue,
      hasServicePlan: payload.hasServiceIssue,
      servicePlanNotes: payload.serviceIssueNote,
      notes: payload.remarks,
      schemeIds: [],
      createdAt: now,
      updatedAt: now,
    };

    db.visitPlans = [
      ...db.visitPlans.filter(
        (p) => !(p.dealerId === plan.dealerId && p.plannedDate === plan.plannedDate),
      ),
      plan,
    ];
    return delay(plan);
  },

  async submitUpdate(payload: SubmitUpdatePayload): Promise<VisitUpdate> {
    if (!USE_MOCK) {
      const raw = await http.post<{
        _id: string;
        visitPlanId: string;
        dealerId: string;
        salesRepId: string;
        collectedAmount?: number;
        hasServiceIssue?: boolean;
        remarks?: string;
        createdAt?: string;
      }>("/visit-updates", {
        visitPlanId: payload.visitPlanId,
        collectedAmount: payload.actualCollectionAmount,
        hasServiceIssue: payload.serviceCompleted,
        serviceIssueNote: payload.serviceNote,
        remarks: payload.remarks,
      });

      return {
        id: raw._id,
        visitPlanId: raw.visitPlanId,
        dealerId: raw.dealerId,
        salesRepId: raw.salesRepId,
        visited: true,
        actualCollectionAmount: raw.collectedAmount,
        serviceCompleted: raw.hasServiceIssue ?? false,
        orderPlaced: payload.actualOrderValue > 0,
        notes: raw.remarks,
        submittedAt: raw.createdAt ?? new Date().toISOString(),
      };
    }

    const plan = db.visitPlans.find((p) => p.id === payload.visitPlanId);
    const update: VisitUpdate = {
      id: db.nextId("vu"),
      visitPlanId: payload.visitPlanId,
      dealerId: plan?.dealerId ?? "",
      salesRepId: plan?.salesRepId ?? "",
      visited: true,
      actualCollectionAmount: payload.actualCollectionAmount,
      serviceCompleted: payload.serviceCompleted,
      orderPlaced: payload.actualOrderValue > 0,
      notes: payload.remarks,
      submittedAt: new Date().toISOString(),
    };

    db.visitUpdates = [
      ...db.visitUpdates.filter((u) => u.visitPlanId !== update.visitPlanId),
      update,
    ];
    if (plan) plan.status = "completed";

    return delay(update);
  },
};
