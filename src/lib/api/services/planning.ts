import type {
  SalesDashboardSummary,
  VisitPlan,
  VisitPlanWithUpdate,
  VisitUpdate,
} from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
import { mapVisitPlan, type ApiDealer, type ApiVisitPlan } from "../mappers";
import { db } from "../mock/db";

export interface SubmitPlanPayload {
  /** Set when re-planning a dealer, so the existing record is updated. */
  existingPlanId?: string;
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

/**
 * A stop from /routes/me/today. The dealer arrives as a nested object rather
 * than the flat dealerId the spec describes, so both shapes are accepted.
 */
interface RouteStop {
  sequence?: number;
  dealerId?: string;
  dealerName?: string;
  dealer?: { _id?: string; id?: string; name?: string; location?: string };
}

/** Today's plan for a dealer, if one exists. */
async function findPlanForDealer(dealerId: string, date: string) {
  try {
    const res = await http.get<{ data?: ApiVisitPlan[]; items?: ApiVisitPlan[] }>(
      "/visit-plans",
      { limit: 100 },
    );
    return (res.data ?? res.items ?? []).find(
      (plan) => plan.dealerId === dealerId && (plan.visitDate ?? "").slice(0, 10) === date,
    );
  } catch {
    return undefined;
  }
}

const stopDealerId = (stop: RouteStop) =>
  stop.dealer?._id ?? stop.dealer?.id ?? stop.dealerId ?? "";

const stopDealerName = (stop: RouteStop, byId: Map<string, string>) =>
  stop.dealer?.name ?? stop.dealerName ?? byId.get(stopDealerId(stop)) ?? "Dealer";

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

      /*
        The summary has no route name and reports 0 dealers before any plan
        exists, so today's route is the more reliable source for both.
      */
      let routeName = "No route assigned";
      let stops: RouteStop[] = [];
      try {
        const route = await http.get<{ routeName?: string; stops?: RouteStop[] }>(
          "/routes/me/today",
        );
        if (route?.routeName) routeName = route.routeName;
        stops = route?.stops ?? [];
      } catch {
        // A rep with no route assigned isn't an error worth surfacing here
      }

      /*
        The summary's activity rows arrive without dealer names, so pull the
        rep's dealers once and resolve names by id.
      */
      let dealerNameById = new Map<string, string>();
      try {
        const dealerRes = await http.get<{ data?: ApiDealer[]; items?: ApiDealer[] }>("/dealers", {
          salesRepId,
          limit: 100,
        });
        dealerNameById = new Map(
          (dealerRes.data ?? dealerRes.items ?? []).map((d) => [d._id, d.name]),
        );
      } catch {
        // Names are cosmetic here — the counts still work without them
      }

      /*
        Progress is "plans submitted / dealers on today's route". The API's
        planProgress.total counts the plans themselves, so it always reads
        100% — the route's stop count is the correct denominator.
      */
      const scheduled = stops.length || res.dealersScheduled || 0;

      /*
        Progress is "how many of today's dealers have a plan", so it counts
        DISTINCT DEALERS rather than plan records — editing a plan leaves the
        number unchanged, and it can never exceed the dealers on the route.
      */
      const routeDealerIds = new Set(stops.map(stopDealerId).filter(Boolean));
      let planned = 0;
      let orderPlanTotal = 0;

      try {
        const planRes = await http.get<{ data?: ApiVisitPlan[]; items?: ApiVisitPlan[] }>(
          "/visit-plans",
          { limit: 100 },
        );
        const todaysPlans = (planRes.data ?? planRes.items ?? []).filter(
          (plan) => (plan.visitDate ?? "").slice(0, 10) === today(),
        );

        const plannedDealers = new Set(
          todaysPlans
            .map((plan) => plan.dealerId)
            .filter((id) => routeDealerIds.size === 0 || routeDealerIds.has(id)),
        );
        planned = plannedDealers.size;

        // One entry per dealer, so an edited plan isn't counted twice
        const latestByDealer = new Map<string, ApiVisitPlan>();
        todaysPlans.forEach((plan) => latestByDealer.set(plan.dealerId, plan));
        orderPlanTotal = [...latestByDealer.values()].reduce(
          (sum, plan) => sum + (plan.orderPlanAmount ?? 0),
          0,
        );
      } catch {
        planned = res.planProgress?.planned ?? 0;
      }

      const total = scheduled || res.planProgress?.total || 0;
      // A plan for an off-route dealer shouldn't push the bar past 100%
      planned = total > 0 ? Math.min(planned, total) : planned;

      return {
        // Filled in by the page from the signed-in user
        repName: "",
        routeName,
        date: (res.date ?? new Date().toISOString()).slice(0, 10),
        dealersScheduled: scheduled,
        orderPlanValue: orderPlanTotal || (res.orderPlanTotal ?? 0),
        plannedCount: planned,
        totalCount: total,
        planSubmitted: planned > 0,
        /*
          The summary's activity rows arrive without dealerId or dealerName in
          practice, so today's route stops are the reliable source. The summary
          is only used if the route has none.
        */
        upcomingActivity: (stops.length
          ? stops
              .slice()
              .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
              .map((stop) => ({
                dealerId: stopDealerId(stop),
                dealerName: stopDealerName(stop, dealerNameById),
                purpose: "Scheduled visit",
              }))
          : (res.upcomingActivity ?? []).map((a, i) => {
              const id = a.dealerId ?? a._id ?? "";
              return {
                dealerId: id || `activity-${i}`,
                dealerName: a.dealerName ?? a.name ?? dealerNameById.get(id) ?? "Dealer",
                purpose: a.purpose ?? a.title ?? "Scheduled visit",
              };
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
      /*
        The planning list is driven by today's ROUTE, not by existing plans —
        a rep opens the screen before any plan exists and needs the dealers
        he's due to visit. Submitted plans are merged in on top so they show
        as done.
      */
      const [route, dealerRes, planRes] = await Promise.all([
        http
          .get<{ stops?: RouteStop[] }>("/routes/me/today")
          .catch(() => ({ stops: [] as RouteStop[] })),
        http
          .get<{ data?: ApiDealer[]; items?: ApiDealer[] }>("/dealers", { salesRepId, limit: 100 })
          .catch(() => ({ data: [] as ApiDealer[], items: [] as ApiDealer[] })),
        http
          /*
            visitDate comes back as a full timestamp, so filtering by a plain
            YYYY-MM-DD server-side misses. Fetch the recent set and match on the
            date portion here instead.
          */
          .get<{ data?: ApiVisitPlan[]; items?: ApiVisitPlan[] }>("/visit-plans", { limit: 100 })
          .catch(() => ({ data: [] as ApiVisitPlan[], items: [] as ApiVisitPlan[] })),
      ]);

      const dealers = dealerRes.data ?? dealerRes.items ?? [];
      const plans = (planRes.data ?? planRes.items ?? []).filter(
        (p) => (p.visitDate ?? "").slice(0, 10) === date,
      );
      const dealerById = new Map(dealers.map((d) => [d._id, d]));
      const stops = route.stops ?? [];
      const stopLocationById = new Map(
        stops
          .map((stop) => [stopDealerId(stop), stop.dealer?.location] as const)
          .filter(([, loc]) => Boolean(loc)) as Array<[string, string]>,
      );

      // Fall back to the rep's own dealers if the route has no stops yet
      const source = stops.length
        ? stops
            .slice()
            .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            .map((stop) => ({
              dealerId: stopDealerId(stop),
              dealerName: stopDealerName(
                stop,
                new Map(dealers.map((d) => [d._id, d.name])),
              ),
            }))
        : dealers.map((d) => ({ dealerId: d._id, dealerName: d.name }));

      return source.map((entry) => {
        const existing = plans.find((p) => p.dealerId === entry.dealerId);
        const base: VisitPlan = existing
          ? mapVisitPlan(existing)
          : {
              id: `draft-${entry.dealerId}`,
              dealerId: entry.dealerId,
              salesRepId,
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
            id: entry.dealerId,
            name: entry.dealerName,
            address:
              stopLocationById.get(entry.dealerId) ??
              dealerById.get(entry.dealerId)?.location ??
              undefined,
          },
          // Keep the saved remarks so re-opening a plan shows what was written
          notes: existing?.remarks || "Scheduled visit",
        };
      });
    }

    const route = db.routes.find((r) => r.salesRepId === salesRepId) ?? db.routes[0];
    const dealerIds = route?.dealerIds ?? [];

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
        dealer: { id: dealer.id, name: dealer.name, address: dealer.address, phone: dealer.phone },
        update,
        notes: base.notes ?? (index === 0 ? "Inventory Check & Restock" : "Quarterly Review Meeting"),
      };
    });

    return delay(rows);
  },

  async submitPlan(payload: SubmitPlanPayload): Promise<VisitPlan> {
    if (!USE_MOCK) {
      const body = {
        dealerId: payload.dealerId,
        visitDate: payload.plannedDate,
        plannedAmount: payload.paymentPlanValue,
        orderPlanAmount: payload.orderPlanValue,
        hasServiceIssue: payload.hasServiceIssue,
        serviceIssueNote: payload.serviceIssueNote,
        remarks: payload.remarks,
      };

      /*
        Re-planning a dealer updates that dealer's existing plan. Creating a
        second record would make Plan Progress climb past the number of dealers
        actually planned for.
      */
      if (payload.existingPlanId) {
        const updated = await http.patch<ApiVisitPlan>(
          `/visit-plans/${payload.existingPlanId}`,
          body,
        );
        return mapVisitPlan(updated);
      }

      try {
        const created = await http.post<ApiVisitPlan>("/visit-plans", body);
        // Creating and submitting are separate calls — "SUBMIT PLAN" does both
        const submitted = await http.post<ApiVisitPlan>(`/visit-plans/${created._id}/submit`);
        return mapVisitPlan(submitted ?? created);
      } catch (error) {
        /*
          The API treats dealer + date as unique. If the list this screen was
          built from is stale, the create is rejected — so find the plan that
          already exists and update that instead of surfacing an error the rep
          can do nothing about.
        */
        const existing = await findPlanForDealer(payload.dealerId, payload.plannedDate);
        if (!existing) throw error;

        const updated = await http.patch<ApiVisitPlan>(`/visit-plans/${existing._id}`, body);
        return mapVisitPlan(updated);
      }
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
      if (payload.visitPlanId.startsWith("draft-")) {
        throw new Error(
          "Submit a plan for this dealer first, then record the day's result.",
        );
      }

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
