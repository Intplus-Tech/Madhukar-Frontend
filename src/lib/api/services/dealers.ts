import type { Dealer, Product, Route } from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
import { db } from "../mock/db";

export const dealerService = {
  /** Dealers on today's route — drives the Planning screen sequence. */
  async listForRoute(routeId: string): Promise<Dealer[]> {
    if (!USE_MOCK) return http.get<Dealer[]>(`/routes/${routeId}/dealers`);
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
    if (!USE_MOCK) return http.get<Dealer[]>("/dealers", { search: query, salesRepId });
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
    if (!USE_MOCK) return http.get<Dealer>(`/dealers/${id}`);
    return delay(db.dealers.find((d) => d.id === id) ?? null);
  },

  async currentRoute(salesRepId: string): Promise<Route | null> {
    if (!USE_MOCK) return http.get<Route>("/routes/current", { salesRepId });
    return delay(db.routes.find((r) => r.salesRepId === salesRepId) ?? db.routes[0] ?? null);
  },
};

export const productService = {
  async search(query: string): Promise<Product[]> {
    if (!USE_MOCK) return http.get<Product[]>("/products", { search: query });
    const q = query.trim().toLowerCase();
    return delay(
      db.products.filter(
        (p) => !q || p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q),
      ),
      150,
    );
  },
};
