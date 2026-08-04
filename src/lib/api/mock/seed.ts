import type {
  Dealer,
  Product,
  Route,
  SalesOrder,
  User,
  Notification,
  Feedback,
} from "@/types/domain";

/**
 * Seed data lifted from the Figma screens so the UI renders with the exact
 * content the designs show. Replace wholesale when the backend is live.
 */

export const users: User[] = [
  { id: "u1", name: "Akshay Kumar", email: "akshay@mdapl.com", role: "sales", isActive: true },
  { id: "u2", name: "Maruthi", email: "maruthi@mdapl.com", role: "sales", isActive: true },
  { id: "u3", name: "Ashwin", email: "ashwin@mdapl.com", role: "sales", isActive: true },
  { id: "u4", name: "Sachin", email: "sachin@mdapl.com", role: "sales", isActive: true },
  { id: "u5", name: "Nagesh", email: "nagesh@mdapl.com", role: "sales", isActive: true },
  { id: "u6", name: "Sarah Jenkins", email: "sarah@mdapl.com", role: "accounts", isActive: true },
  { id: "u7", name: "Alice Johnson", email: "alice@mdapl.com", role: "accounts", isActive: true },
  { id: "u8", name: "Priya Menon", email: "priya@mdapl.com", role: "admin", isActive: true },
];

export const dealers: Dealer[] = [
  {
    id: "d1",
    name: "Apex Motors",
    code: "APX-001",
    contactPerson: "Jonathan Smith",
    phone: "+91 98450 11223",
    address: "24 Industrial Estate, Lagos Central",
    city: "Chickpet",
    salesRepId: "u1",
    routeId: "r1",
    outstandingAmount: 10400,
    createdAt: "2025-04-02T09:00:00Z",
  },
  {
    id: "d2",
    name: "Downtown Spare Parts",
    code: "DSP-002",
    contactPerson: "Ravi Shankar",
    phone: "+91 98450 22334",
    address: "Suite 12, Heritage Mall, Ikeja",
    city: "Sultanpet",
    salesRepId: "u1",
    routeId: "r1",
    outstandingAmount: 3200,
    createdAt: "2025-04-02T09:00:00Z",
  },
  {
    id: "d3",
    name: "Elite Automotive Solutions",
    code: "EAS-003",
    contactPerson: "Meena Iyer",
    phone: "+91 98450 33445",
    address: "Plot 4B, Commercial Way, Victoria Island",
    city: "Chamrajpet",
    salesRepId: "u1",
    routeId: "r1",
    outstandingAmount: 0,
    createdAt: "2025-05-11T09:00:00Z",
  },
  {
    id: "d4",
    name: "Global Auto Logistics",
    code: "GAL-004",
    contactPerson: "Arun Prakash",
    phone: "+91 98450 44556",
    address: "118 Airport Road, Ikeja Gra",
    city: "Chickpet",
    salesRepId: "u1",
    routeId: "r1",
    outstandingAmount: 12100,
    createdAt: "2025-05-11T09:00:00Z",
  },
  {
    id: "d5",
    name: "Apex Distribution North",
    code: "ADN-005",
    contactPerson: "Jonathan Smith",
    phone: "+1 312 555 0119",
    address: "1402 Commerce Way, Suite 500, Chicago, IL 60601",
    city: "Chickpet",
    salesRepId: "u2",
    outstandingAmount: 22500,
    createdAt: "2025-01-20T09:00:00Z",
  },
  { id: "d6", name: "Blue Horizon Retail", code: "BHR-006", address: "9 Market Rd", city: "Sultanpet", salesRepId: "u3", outstandingAmount: 4100, createdAt: "2025-02-01T09:00:00Z" },
  { id: "d7", name: "Global Logistics Co.", code: "GLC-007", address: "44 Transit Ave", city: "Chamrajpet", salesRepId: "u4", outstandingAmount: 8800, createdAt: "2025-02-01T09:00:00Z" },
  { id: "d8", name: "Vanguard Enterprises", code: "VGE-008", address: "77 Enterprise Park", city: "Chickpet", salesRepId: "u5", outstandingAmount: 1500, createdAt: "2025-02-01T09:00:00Z" },
  { id: "d9", name: "Midwest Supply Co.", code: "MSC-009", address: "210 Warehouse Ln", city: "Sultanpet", salesRepId: "u5", outstandingAmount: 6700, createdAt: "2025-03-14T09:00:00Z" },
  { id: "d10", name: "Highland Tools", code: "HLT-010", address: "8 Highland St", city: "Chamrajpet", salesRepId: "u5", outstandingAmount: 900, createdAt: "2025-03-14T09:00:00Z" },
  { id: "d11", name: "Mainland Parts", code: "MLP-011", address: "5 Mainland Rd", city: "Chickpet", salesRepId: "u3", outstandingAmount: 0, createdAt: "2025-03-14T09:00:00Z" },
  { id: "d12", name: "Oceanic Importers", code: "OCI-012", address: "31 Harbour View", city: "Sultanpet", salesRepId: "u3", outstandingAmount: 2400, createdAt: "2025-03-14T09:00:00Z" },
];

export const routes: Route[] = [
  {
    id: "r1",
    name: "Route A",
    salesRepId: "u1",
    dealerIds: ["d1", "d2", "d3", "d4"],
    scheduledDay: "mon",
    isActive: true,
  },
];

export const products: Product[] = [
  { id: "p1", name: "ORB Mixer Grinder", sku: "ORB-MG-750", unit: "pcs", unitPrice: 4200, inStock: true },
  { id: "p2", name: "Spark Electric Kettle", sku: "SPK-EK-15", unit: "pcs", unitPrice: 1450, inStock: true },
  { id: "p3", name: "Heavy Duty Rivet Set (500pc)", sku: "HD-RV-500", unit: "box", unitPrice: 2800, inStock: true },
  { id: "p4", name: "Industrial Adhesive G-90", sku: "IND-AG-90", unit: "ltr", unitPrice: 960, inStock: false },
  { id: "p5", name: "Aura Induction Cooktop", sku: "AUR-IC-20", unit: "pcs", unitPrice: 3600, inStock: true },
  { id: "p6", name: "Nova Ceiling Fan 1200mm", sku: "NOV-CF-12", unit: "pcs", unitPrice: 2150, inStock: true },
];

const REP_NAME: Record<string, string> = {
  u1: "Akshay Kumar",
  u2: "Maruthi",
  u3: "Ashwin",
  u4: "Sachin",
  u5: "Nagesh",
};

export const REP_NAMES = REP_NAME;

function order(
  id: string,
  orderNumber: string,
  dealerId: string,
  salesRepId: string,
  status: SalesOrder["status"],
  priority: SalesOrder["priority"],
  createdAt: string,
  items: Array<[string, number, boolean]>,
): SalesOrder {
  const lineItems = items.map(([productId, quantity, isBilled], i) => {
    const p = products.find((x) => x.id === productId)!;
    return {
      id: `${id}-li${i + 1}`,
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      unit: p.unit,
      quantity,
      unitPrice: p.unitPrice,
      lineTotal: (p.unitPrice ?? 0) * quantity,
      billedQuantity: isBilled ? quantity : 0,
      isBilled,
      unbilledReason: isBilled ? undefined : "Stock issue",
    };
  });

  return {
    id,
    orderNumber,
    dealerId,
    salesRepId,
    items: lineItems,
    priority,
    status,
    totalAmount: lineItems.reduce((sum, li) => sum + (li.lineTotal ?? 0), 0),
    notes:
      priority === "urgent"
        ? "Client requested split billing if stock of G-90 is delayed past 24 hours. Verify inventory levels with Nagesh before final processing."
        : undefined,
    createdAt,
    billedAt: status === "completed" ? createdAt : undefined,
    billedById: status === "completed" ? "u6" : undefined,
    confirmedAt: status === "completed" ? createdAt : undefined,
  };
}

export const salesOrders: SalesOrder[] = [
  order("o1", "SO-8921-X", "d5", "u2", "completed", "urgent", "2026-10-24T09:12:00Z", [["p3", 12, true], ["p4", 12, true], ["p4", 40, true]]),
  order("o2", "SO-8922-P", "d7", "u4", "completed", "medium", "2026-10-24T09:40:00Z", [["p1", 6, true], ["p5", 4, true]]),
  order("o3", "SO-8923-Y", "d9", "u5", "pending", "medium", "2026-10-24T10:05:00Z", [["p2", 20, false], ["p6", 10, false]]),
  order("o4", "SO-8924-Z", "d9", "u5", "pending", "high", "2026-10-24T10:32:00Z", [["p1", 8, false]]),
  order("o5", "SO-8925-Z", "d10", "u5", "pending", "medium", "2026-10-24T11:02:00Z", [["p3", 4, false], ["p4", 6, false]]),
  order("o6", "SO-8926-Z", "d11", "u3", "completed", "low", "2026-10-24T11:20:00Z", [["p6", 15, true]]),
  order("o7", "SO-8927-Z", "d12", "u3", "completed", "medium", "2026-10-24T12:00:00Z", [["p5", 9, true], ["p2", 12, true]]),
  order("o8", "SO-8928-Z", "d1", "u1", "rejected", "urgent", "2026-10-23T15:10:00Z", [["p4", 25, false], ["p1", 5, true]]),
  order("o9", "SO-8929-Z", "d6", "u3", "pending", "medium", "2026-10-23T16:00:00Z", [["p1", 3, false]]),
  order("o10", "SO-8930-Z", "d8", "u5", "pending", "high", "2026-10-23T16:45:00Z", [["p2", 30, false]]),
  order("o11", "SO-8931-Z", "d2", "u1", "completed", "low", "2026-10-22T09:15:00Z", [["p6", 7, true]]),
  order("o12", "SO-8932-Z", "d3", "u1", "billed", "medium", "2026-10-22T10:00:00Z", [["p5", 5, true], ["p3", 2, false]]),
];

export const feedback: Feedback[] = [
  {
    id: "f1",
    salesOrderId: "o8",
    message:
      "Industrial Adhesive G-90 is out of stock until Thursday. Confirm with the dealer whether to part-ship the rivet sets now.",
    fromUserId: "u6",
    fromRole: "accounts",
    toUserIds: ["u1"],
    toRoles: ["sales"],
    createdAt: "2026-10-23T17:30:00Z",
  },
];

export const notifications: Notification[] = [
  {
    id: "n1",
    userId: "u1",
    type: "order_feedback",
    title: "SO-8928-Z could not be billed",
    message: "Accounts flagged a stock issue on Industrial Adhesive G-90.",
    entityType: "sales_order",
    entityId: "o8",
    isRead: false,
    createdAt: "2026-10-23T17:30:00Z",
  },
  {
    id: "n2",
    userId: "u1",
    type: "order_completed",
    title: "SO-8931-Z billed",
    message: "Downtown Spare Parts order has been billed and confirmed.",
    entityType: "sales_order",
    entityId: "o11",
    isRead: true,
    createdAt: "2026-10-22T11:00:00Z",
  },
];
