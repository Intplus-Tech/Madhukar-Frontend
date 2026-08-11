import type { Dealer, Product, Route } from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
import { mapDealer, mapProduct, type ApiDealer, type ApiProduct } from "../mappers";
import { db } from "../mock/db";

export const dealerService = {
  /** Dealers on today's route — drives the Planning screen sequence. */
  async listForRoute(routeId: string): Promise<Dealer[]> {
    if (!USE_MOCK) {
      const res = await http.get<{ data?: ApiDealer[]; items?: ApiDealer[] }>("/dealers", {
        routeId,
        limit: 100,
      });
      return (res.data ?? res.items ?? []).map(mapDealer) as Dealer[];
    }
    const route = db.routes.find((r) => r.id === routeId);
    if (!route) return delay([]);
    const ordered = route.dealerIds
      .map((id) => db.dealers.find((d) => d.id === id))
      .filter((d): d is Dealer => Boolean(d));
    return delay(ordered);
  },

  /**
   * Order search is deliberately NOT limited to the current route — the
   * walkthrough is explicit that a rep can order for any dealer under them.
   */
  async search(query: string, salesRepId?: string): Promise<Dealer[]> {
    if (!USE_MOCK) {
      /*
        salesRepId is ignored for the sales role — the API scopes to the caller
        — so it's only meaningful when an admin browses someone else's dealers.
      */
      const res = await http.get<{ data?: ApiDealer[]; items?: ApiDealer[] }>("/dealers", {
        search: query || undefined,
        salesRepId,
        limit: 50,
      });
      return (res.data ?? res.items ?? []).map(mapDealer) as Dealer[];
    }
    const q = query.trim().toLowerCase();
    const results = db.dealers.filter((d) => {
      const ownedByRep = !salesRepId || d.salesRepId === salesRepId;
      if (!ownedByRep) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        (d.city ?? "").toLowerCase().includes(q) ||
        (d.address ?? "").toLowerCase().includes(q)
      );
    });
    return delay(results);
  },

  async getById(id: string): Promise<Dealer | null> {
    if (!USE_MOCK) {
      try {
        const raw = await http.get<ApiDealer>(`/dealers/${id}`);
        return mapDealer(raw) as Dealer;
      } catch {
        /*
          GET /dealers/{id} is admin-only, but a rep needs the dealer's details
          on the order screen. The list endpoint is open to them, so fall back
          to finding the record there.
        */
        const res = await http.get<{ data?: ApiDealer[]; items?: ApiDealer[] }>("/dealers", {
          limit: 100,
        });
        const match = (res.data ?? res.items ?? []).find((d) => d._id === id);
        return match ? (mapDealer(match) as Dealer) : null;
      }
    }
    return delay(db.dealers.find((d) => d.id === id) ?? null);
  },

  async currentRoute(salesRepId: string): Promise<Route | null> {
    if (!USE_MOCK) {
      // /routes/me/today is scoped to the authenticated user by the token
      const res = await http.get<{
        scheduled?: boolean;
        routeId?: string;
        routeName?: string;
        stops?: Array<{ dealerId: string; sequence?: number }>;
      }>("/routes/me/today");

      if (!res?.routeId) return null;
      return {
        id: res.routeId,
        name: res.routeName ?? "Today's route",
        salesRepId,
        dealerIds: (res.stops ?? [])
          .slice()
          .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
          .map((stop) => stop.dealerId),
        isActive: res.scheduled ?? true,
      };
    }
    return delay(db.routes.find((r) => r.salesRepId === salesRepId) ?? db.routes[0] ?? null);
  },
};

export const productService = {
  async search(query: string): Promise<Product[]> {
    if (!USE_MOCK) {
      const res = await http.get<{ data?: ApiProduct[]; items?: ApiProduct[] }>("/products", {
        search: query || undefined,
        limit: 50,
      });
      return (res.data ?? res.items ?? []).map(mapProduct);
    }
    const q = query.trim().toLowerCase();
    return delay(
      db.products.filter(
        (p) => !q || p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q),
      ),
      150,
    );
  },
};
