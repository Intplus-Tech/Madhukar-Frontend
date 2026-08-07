import type { Dealer, Route } from "@/types/domain";

/**
 * Dealer roster per sales rep, transcribed from the list the team lead shared.
 * Replace wholesale once the backend exposes real dealer records.
 */
const ROSTER: Record<string, { repId: string; dealers: string[] }> = {
  Ashwin: {
    repId: "u3",
    dealers: [
      "Ashwin Kitchenware",
      "Apex Motors",
      "Blue Sky Electronics",
      "Capital Traders",
      "Zenith Enterprises",
      "Matrix Hardware",
      "Sunrise Automobiles",
      "Nova Retail",
      "Vantage Distributors",
      "Crestline Agencies",
      "Prime Auto Components",
    ],
  },
  Maruthi: {
    repId: "u2",
    dealers: [
      "Maruthi United Motors",
      "National Traders",
      "Silverline Hardware",
      "Bright Future",
      "Retail Universal Spares",
      "Global Tech Agencies",
      "Alpha Distributors",
      "Supreme Auto Hub",
      "Ace Enterprises",
      "Victory Traders",
    ],
  },
  Sagar: {
    repId: "u9",
    dealers: [
      "Sagar Hardware",
      "Fortune Distributors",
      "Radiant Electronics",
      "Stellar Motors",
      "Crest Auto Spares",
      "Falcon Traders",
      "Infinity Retail",
      "Paramount Agencies",
      "Swift Logistics & Sales",
      "Dynamic Enterprise",
    ],
  },
  Karthik: {
    repId: "u10",
    dealers: [
      "Karthik Hotelware",
      "Monarch Motors",
      "Regal Traders",
      "Galaxy Electronics",
      "Prestige Hardware",
      "Platinum Auto Vanguard Supplies",
      "Heritage Agencies",
      "Diamond Retailers",
      "Beacon Enterprises",
      "Horizon Motors",
    ],
  },
  Nagesh: {
    repId: "u5",
    dealers: [
      "Nagesh Auto Parts",
      "Golden Gate Traders",
      "Urban Hardware",
      "Zenith Agencies",
      "Mastermind Electronics",
      "Imperial Motors",
      "Crown Distributors",
      "Prime Line Retail",
      "Velocity Spares",
      "Synergy Enterprises",
    ],
  },
  Sachin: {
    repId: "u4",
    dealers: [
      "Sachin Pioneer Spares",
      "Horizon Traders",
      "Royal Motors",
      "Acme Tech Solutions",
      "Summit Dealers",
      "Omega Supplies",
      "Evergreen Agencies",
      "Nexus Retail",
      "Trident Enterprise",
      "Elite Auto Parts",
    ],
  },
};

const AREAS = ["Chickpet", "Sultanpet", "Chamrajpet", "Malleshwaram", "Jayanagar"];

function slug(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

/** Flattened dealer records, one per name in the roster above. */
export const rosterDealers: Dealer[] = Object.values(ROSTER).flatMap((group, groupIndex) =>
  group.dealers.map<Dealer>((name, index) => ({
    id: `rd-${groupIndex}-${index}`,
    name,
    code: `${slug(name)}-${groupIndex}${String(index).padStart(2, "0")}`,
    contactPerson: undefined,
    phone: `+91 9${String(800000000 + groupIndex * 1000 + index).slice(0, 9)}`,
    address: `${10 + index} Industrial Estate, ${AREAS[index % AREAS.length]}`,
    city: AREAS[index % AREAS.length],
    salesRepId: group.repId,
    routeId: `route-${group.repId}`,
    outstandingAmount: 0,
    createdAt: "2026-01-05T09:00:00Z",
  })),
);

/** One route per rep, holding that rep's first four dealers as today's sequence. */
export const rosterRoutes: Route[] = Object.entries(ROSTER).map(([, group], i) => ({
  id: `route-${group.repId}`,
  name: `Route ${String.fromCharCode(65 + i)}`,
  salesRepId: group.repId,
  dealerIds: rosterDealers
    .filter((d) => d.salesRepId === group.repId)
    .slice(0, 4)
    .map((d) => d.id),
  scheduledDay: (["mon", "tue", "wed", "thu", "fri", "sat"] as const)[i % 6],
  isActive: true,
}));

export const ROSTER_REP_NAMES = Object.fromEntries(
  Object.entries(ROSTER).map(([name, group]) => [group.repId, name]),
);
