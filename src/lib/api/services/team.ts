import type { TeamMember, TeamTab, UpdateTeamMemberPayload } from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
import { resolveRole, type ApiAuthUser } from "../mappers";
import { db } from "../mock/db";

/** GET /users returns { data: { users: [...] } }; field names vary by endpoint. */
interface ApiTeamUser extends ApiAuthUser {
  firstName?: string;
  lastName?: string;
  /** Visit plans this user has actually submitted — the "74" in "74/200". */
  submittedVisitPlanCount?: number;
}

function displayName(raw: ApiTeamUser) {
  if (raw.fullName) return raw.fullName;
  const joined = [raw.firstName, raw.lastName].filter(Boolean).join(" ");
  return joined || raw.name || raw.email.split("@")[0] || "User";
}

const POSITION_BY_ROLE = {
  sales: "Sales Rep",
  accounts: "Accountant",
  admin: "Manager",
} as const;

function mapTeamMember(raw: ApiTeamUser): TeamMember {
  const role = resolveRole(raw.role, raw.email);
  const schedule = (raw.scheduleDays ?? []) as TeamMember["schedule"];

  return {
    id: raw._id ?? raw.id ?? "",
    name: displayName(raw),
    email: raw.email,
    position: POSITION_BY_ROLE[role],
    status: raw.isActive === false ? "inactive" : role === "sales" ? "on_field" : "active",
    plannedCount: raw.submittedVisitPlanCount ?? 0,
    plannedTotal: raw.visitQuotaTarget ?? 0,
    routeId: raw.assignedRouteId ?? undefined,
    routeName: raw.assignedRouteName ?? undefined,
    schedule,
    isFullTime: schedule.length === 0 || schedule.length >= 5,
    permissions: {
      allowOrderCreation: raw.permissions?.allowOrderCreationOnBehalfOfDealers ?? false,
      allowDiscountOverride: raw.permissions?.allowManualDiscountOverrides ?? false,
    },
  };
}

async function fetchTeam(): Promise<TeamMember[]> {
  /*
    GET /users nests its page inside the success envelope, so after http.ts
    unwraps `data` the rows sit at `.data`. Older shapes are kept as fallbacks
    in case the response settles differently.
  */
  const res = await http.get<{
    data?: ApiTeamUser[];
    users?: ApiTeamUser[];
    items?: ApiTeamUser[];
  }>("/users", { limit: 100 });

  return (res.data ?? res.users ?? res.items ?? []).map(mapTeamMember);
}

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
    if (!USE_MOCK) {
      const all = await fetchTeam();
      if (tab === "sales") return all.filter((m) => m.position === "Sales Rep");
      if (tab === "accounts") return all.filter((m) => m.position === "Accountant");
      return all;
    }

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
    if (!USE_MOCK) {
      const all = await fetchTeam();
      return {
        all: all.length,
        sales: all.filter((m) => m.position === "Sales Rep").length,
        accounts: all.filter((m) => m.position === "Accountant").length,
      };
    }
    return delay({
      all: teamState.length,
      sales: teamState.filter((m) => m.position === "Sales Rep").length,
      accounts: teamState.filter((m) => m.position === "Accountant").length,
    });
  },

  async update(payload: UpdateTeamMemberPayload): Promise<TeamMember> {
    if (!USE_MOCK) {
      /*
        PATCH /users/{id} edits the chosen person. /users/profile/update was
        used here before and silently edited whoever was signed in instead,
        which is why saving appeared to do nothing.

        Note the role strings the API accepts: 'sales' | 'account' | 'admin'.
        'accounts' (plural) is rejected with a 400.
      */
      const apiRole =
        payload.position === "Sales Rep"
          ? "sales"
          : payload.position === "Accountant"
            ? "account"
            : "admin";

      const updated = await http.patch<ApiTeamUser>(`/users/${payload.id}`, {
        fullName: payload.name,
        role: apiRole,
        assignedRouteId: payload.routeId ?? null,
        visitQuotaTarget: payload.plannedTotal,
        scheduleDays: payload.schedule,
        permissions: {
          allowOrderCreationOnBehalfOfDealers: payload.permissions.allowOrderCreation,
          allowManualDiscountOverrides: payload.permissions.allowDiscountOverride,
        },
      });
      return mapTeamMember(updated);
    }

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
    if (!USE_MOCK) {
      // List endpoints nest their rows under `data`, not `items`
      const res = await http.get<{
        data?: Array<{ _id?: string; id?: string; name: string }>;
        items?: Array<{ _id?: string; id?: string; name: string }>;
      }>("/routes", { limit: 100 });

      return (res.data ?? res.items ?? []).map((r) => ({
        label: r.name,
        value: r._id ?? r.id ?? "",
      }));
    }
    return delay(db.routes.map((r) => ({ label: r.name, value: r.id })));
  },
};
