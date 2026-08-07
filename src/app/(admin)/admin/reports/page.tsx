"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Plus } from "lucide-react";
import { Avatar, Button, EmptyRow, Table, TableSkeleton, TableWrap, Td, Th } from "@/components/ui";
import { EditTeamMemberModal } from "@/components/admin";
import { teamService } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TeamMember, TeamMemberStatus, TeamTab, WeekDay } from "@/types/domain";

const DAY_LABEL: Record<WeekDay, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat",
};

const STATUS_STYLE: Record<TeamMemberStatus, string> = {
  on_field: "bg-success-soft text-success-ink",
  active: "bg-info-soft text-info-ink",
  inactive: "bg-line-faint text-ink-muted",
};

const STATUS_LABEL: Record<TeamMemberStatus, string> = {
  on_field: "On Field", active: "Active", inactive: "Inactive",
};

export default function AdminReportsPage() {
  const [tab, setTab] = useState<TeamTab>("all");
  const [editing, setEditing] = useState<TeamMember | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ["team", tab],
    queryFn: () => teamService.list(tab),
  });

  const { data: counts } = useQuery({
    queryKey: ["team", "counts"],
    queryFn: () => teamService.counts(),
  });

  const tabs: Array<{ value: TeamTab; label: string }> = [
    { value: "all", label: `All Members (${counts?.all ?? 0})` },
    { value: "sales", label: `Sales Team (${counts?.sales ?? 0})` },
    { value: "accounts", label: `Accounting Team (${counts?.accounts ?? 0})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-display-sm font-bold text-ink">
            Team &amp; Access Management
          </h1>
          <p className="mt-1 text-body text-ink-muted">
            Manage system roles, execution planning, and user access.
          </p>
        </div>

        <Button className="rounded-lg bg-brand hover:bg-brand-hover">
          <Plus className="h-4 w-4" aria-hidden />
          Add Team Member
        </Button>
      </div>

      <div role="tablist" aria-label="Team filter" className="flex gap-8 border-b border-line">
        {tabs.map((option) => {
          const active = tab === option.value;
          return (
            <button
              key={option.value}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(option.value)}
              className={cn(
                "-mb-px border-b-2 pb-3 text-body transition-colors",
                active
                  ? "border-brand font-medium text-brand"
                  : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <TableWrap>
          <TableSkeleton rows={4} cols={6} />
        </TableWrap>
      ) : (
        <TableWrap className="rounded-lg">
          <Table className="min-w-[880px]">
            <thead>
              <tr>
                <Th className="px-6">Team Member</Th>
                <Th>Role</Th>
                <Th>
                  Planning
                  <span className="block font-normal normal-case tracking-normal">
                    (Achieved / Total)
                  </span>
                </Th>
                <Th>Schedule</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {!members?.length ? (
                <EmptyRow colSpan={6}>No team members in this group yet.</EmptyRow>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="transition-colors hover:bg-surface-muted">
                    <Td className="px-6">
                      <span className="flex items-center gap-3">
                        <Avatar name={member.name} size="md" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">{member.name}</span>
                          <span className="block truncate text-meta text-ink-muted">{member.email}</span>
                        </span>
                      </span>
                    </Td>

                    <Td className="text-ink-muted">{member.position}</Td>
                    <Td><PlanningCell member={member} /></Td>

                    <Td className="whitespace-nowrap text-ink-muted">
                      {member.isFullTime
                        ? "Mon – Fri (Full Time)"
                        : member.schedule.map((d) => DAY_LABEL[d]).join(", ")}
                    </Td>

                    <Td>
                      <span className={cn("inline-flex rounded-pill px-2.5 py-1 text-meta font-medium", STATUS_STYLE[member.status])}>
                        {STATUS_LABEL[member.status]}
                      </span>
                    </Td>

                    <Td className="text-right">
                      <button
                        onClick={() => setEditing(member)}
                        className="rounded-lg border border-brand-border px-4 py-1.5 text-body font-medium text-brand transition-colors hover:bg-brand-soft"
                      >
                        Edit
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableWrap>
      )}

      <EditTeamMemberModal member={editing} open={Boolean(editing)} onClose={() => setEditing(null)} />
    </div>
  );
}

function PlanningCell({ member }: { member: TeamMember }) {
  const pct = Math.round((member.plannedCount / Math.max(1, member.plannedTotal)) * 100);
  // Reps plan visits; accountants process bills — same bar, different verb.
  const verb = member.position === "Sales Rep" ? "Planned" : "Processed";

  return (
    <span className="flex items-center gap-2.5 whitespace-nowrap">
      <span className="h-1.5 w-12 shrink-0 overflow-hidden rounded-pill bg-line">
        <span className="block h-full rounded-pill bg-brand transition-[width] duration-500" style={{ width: `${Math.min(100, pct)}%` }} />
      </span>
      <BarChart3 className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
      <span className="text-body text-ink">
        {member.plannedCount}/{member.plannedTotal} {verb}
        {member.position === "Sales Rep" && ` (${pct}%)`}
      </span>
    </span>
  );
}
