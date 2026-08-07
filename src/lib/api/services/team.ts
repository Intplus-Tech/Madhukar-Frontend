import type { TeamMember, TeamTab, UpdateTeamMemberPayload } from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
import { db } from "../mock/db";

/** Seeded to match the Team & Access Management design. */
const seedTeam: TeamMember[] = [
  {
    id: "u4",
    name: "Sachin",
    email: "sachin@ledgerflow.com",
    position: "Sales Rep",
    status: "on_field",
    plannedCount: 74,
    plannedTotal: 200,
    routeId: "route-u4",
    routeName: "Route A (North Axis)",
    schedule: ["mon", "wed", "fri"],
    isFullTime: false,
    permissions: { allowOrderCreation: true, allowDiscountOverride: false },
  },
  {
    id: "u3",
    name: "Ashwin",
    email: "ashwin@ledgerflow.com",
    position: "Sales Rep",
    status: "on_field",
    plannedCount: 142,
    plannedTotal: 200,
    routeId: "route-u3",
    routeName: "Route B (South Axis)",
    schedule: ["tue", "thu", "sat"],
    isFullTime: false,
    permissions: { allowOrderCreation: true, allowDiscountOverride: true },
  },
  {
    id: "u7",
    name: "Alice Johnson",
    email: "alice@ledgerflow.com",
    position: "Accountant",
    status: "active",
    plannedCount: 180,
    plannedTotal: 180,
    schedule: ["mon", "tue", "wed", "thu", "fri"],
    isFullTime: true,
    permissions: { allowOrderCreation: false, allowDiscountOverride: false },
  },
  {
    id: "u11",
    name: "Smitha",
    email: "smitha@ledgerflow.com",
    position: "Accountant",
    status: "active",
    plannedCount: 142,
    plannedTotal: 200,
    schedule: ["mon", "tue", "wed", "thu", "fri"],
    isFullTime: true,
    permissions: { allowOrderCreation: false, allowDiscountOverride: false },
  },
];

// Kept module-level so edits made in the modal survive until reload.
let teamState: TeamMember[] = structuredClone(seedTeam);

export const teamService = {
  async list(tab: TeamTab = "all"): Promise<TeamMember[]> {
    if (!USE_MOCK) return http.get<TeamMember[]>("/team", { tab });

    const rows =
      tab === "sales"
        ? teamState.filter((m) => m.position === "Sales Rep")
        : tab === "accounts"
          ? teamState.filter((m) => m.position === "Accountant")
          : teamState;

    return delay(structuredClone(rows));
  },

  /** Tab labels carry counts, so they need the unfiltered totals. */
  async counts(): Promise<Record<TeamTab, number>> {
    if (!USE_MOCK) return http.get<Record<TeamTab, number>>("/team/counts");
    return delay({
      all: teamState.length,
      sales: teamState.filter((m) => m.position === "Sales Rep").length,
      accounts: teamState.filter((m) => m.position === "Accountant").length,
    });
  },

  async update(payload: UpdateTeamMemberPayload): Promise<TeamMember> {
    if (!USE_MOCK) return http.patch<TeamMember>(`/team/${payload.id}`, payload);

    const index = teamState.findIndex((m) => m.id === payload.id);
    if (index === -1) throw new Error("Team member not found");

    const next: TeamMember = {
      ...teamState[index]!,
      name: payload.name,
      position: payload.position,
      routeId: payload.routeId,
      routeName: db.routes.find((r) => r.id === payload.routeId)?.name ?? "Unassigned",
      plannedTotal: payload.plannedTotal,
      schedule: payload.schedule,
      permissions: payload.permissions,
    };

    teamState = [...teamState.slice(0, index), next, ...teamState.slice(index + 1)];
    return delay(structuredClone(next));
  },

  /** Route options for the modal's Assigned Route select. */
  async routeOptions(): Promise<Array<{ label: string; value: string }>> {
    if (!USE_MOCK)
      return http.get<Array<{ label: string; value: string }>>("/routes/options");
    return delay(db.routes.map((r) => ({ label: r.name, value: r.id })));
  },
};
