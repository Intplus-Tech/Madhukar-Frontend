import type {
  Dealer,
  Feedback,
  Notification,
  Product,
  Route,
  SalesOrder,
  User,
  VisitPlan,
  VisitUpdate,
} from "@/types/domain";
import * as seed from "./seed";

/**
 * A mutable in-memory store so mutations (submit plan, bill an order, send
 * feedback) actually change what later reads return. Resets on page reload,
 * which is the right behaviour for a mock.
 */
class MockDb {
  users: User[] = structuredClone(seed.users);
  dealers: Dealer[] = structuredClone(seed.dealers);
  routes: Route[] = structuredClone(seed.routes);
  products: Product[] = structuredClone(seed.products);
  salesOrders: SalesOrder[] = structuredClone(seed.salesOrders);
  feedback: Feedback[] = structuredClone(seed.feedback);
  notifications: Notification[] = structuredClone(seed.notifications);
  visitPlans: VisitPlan[] = [];
  visitUpdates: VisitUpdate[] = [];

  private counter = 1000;

  nextId(prefix: string) {
    this.counter += 1;
    return `${prefix}${this.counter}`;
  }

  nextOrderNumber() {
    this.counter += 1;
    return `SO-${this.counter}-N`;
  }

  dealerName(id: string) {
    return this.dealers.find((d) => d.id === id)?.name ?? "Unknown dealer";
  }

  repName(id: string) {
    return this.users.find((u) => u.id === id)?.name ?? "Unassigned";
  }
}

/**
 * Survives Fast Refresh in dev by hanging off globalThis, so submitted plans
 * don't vanish every time a file is saved.
 */
const globalRef = globalThis as unknown as { __lakshyaDb?: MockDb };
export const db = globalRef.__lakshyaDb ?? (globalRef.__lakshyaDb = new MockDb());
