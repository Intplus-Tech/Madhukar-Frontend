"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Button, Select, useToast } from "@/components/ui";
import { teamService } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TeamMember, TeamPosition, WeekDay } from "@/types/domain";

const DAYS: Array<{ value: WeekDay; label: string }> = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
];

const POSITIONS: TeamPosition[] = ["Sales Rep", "Accountant", "Manager"];

export function EditTeamMemberModal({
  member,
  open,
  onClose,
}: {
  member: TeamMember | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const [name, setName] = useState("");
  const [position, setPosition] = useState<TeamPosition>("Sales Rep");
  const [routeId, setRouteId] = useState("");
  const [quota, setQuota] = useState(0);
  const [schedule, setSchedule] = useState<WeekDay[]>([]);
  const [allowOrderCreation, setAllowOrderCreation] = useState(false);
  const [allowDiscountOverride, setAllowDiscountOverride] = useState(false);

  const { data: routes = [] } = useQuery({
    queryKey: ["routes", "options"],
    queryFn: () => teamService.routeOptions(),
    enabled: open,
  });

  useEffect(() => {
    if (!member) return;
    setName(member.name);
    setPosition(member.position);
    setRouteId(member.routeId ?? "");
    setQuota(member.plannedTotal);
    setSchedule(member.schedule);
    setAllowOrderCreation(member.permissions.allowOrderCreation);
    setAllowDiscountOverride(member.permissions.allowDiscountOverride);
  }, [member]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const save = useMutation({
    mutationFn: () =>
      teamService.update({
        id: member!.id,
        name,
        position,
        routeId: routeId || undefined,
        plannedTotal: quota,
        schedule,
        permissions: { allowOrderCreation, allowDiscountOverride },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team"] });
      notify("Team member updated");
      onClose();
    },
    onError: () => notify("Couldn't save changes. Try again.", "error"),
  });

  if (!open || !member || typeof document === "undefined") return null;

  const toggleDay = (day: WeekDay) =>
    setSchedule((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-ink/40" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-member-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-[670px] flex-col overflow-hidden rounded-xl bg-surface shadow-modal animate-slide-up"
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-8 py-6">
          <h2 id="edit-member-title" className="text-title font-bold text-ink">
            Edit Team Member Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-6">
          <SectionLabel>User profile</SectionLabel>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="member-name">
              <input
                id="member-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-lg border border-line bg-surface px-3.5 text-body text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </Field>

            <Field label="Role" htmlFor="member-role">
              <Select
                id="member-role"
                className="h-11 rounded-lg"
                options={POSITIONS.map((p) => ({ label: p, value: p }))}
                value={position}
                onChange={(e) => setPosition(e.target.value as TeamPosition)}
              />
            </Field>
          </div>

          <Divider />

          <SectionLabel>Planning &amp; route assignment</SectionLabel>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field label="Assigned Route" htmlFor="member-route">
              <Select
                id="member-route"
                className="h-11 rounded-lg"
                placeholder="Unassigned"
                options={routes}
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
              />
            </Field>

            <Field label="Visit Quota Target (Planned Total)" htmlFor="member-quota">
              <input
                id="member-quota"
                type="number"
                min={0}
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value) || 0)}
                className="h-11 w-full rounded-lg border border-line bg-surface px-3.5 text-body text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </Field>
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2 text-body text-ink">Assigned Days / Schedule</legend>
            <div className="flex flex-wrap gap-2.5">
              {DAYS.map((day) => {
                const checked = schedule.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2.5 text-body transition-colors",
                      checked ? "bg-line-faint text-ink" : "bg-surface-muted text-ink-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-[18px] w-[18px] items-center justify-center rounded border transition-colors",
                        checked ? "border-brand bg-brand text-white" : "border-line-strong bg-surface",
                      )}
                    >
                      {checked && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
                    </span>
                    {day.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Divider />

          <SectionLabel>System permissions</SectionLabel>
          <div className="mt-4 space-y-4">
            <PermissionRow
              checked={allowOrderCreation}
              onChange={setAllowOrderCreation}
              title="Allow Order Creation on behalf of dealers"
              description="Enables the rep to submit sales orders directly into the ERP system."
            />
            <PermissionRow
              checked={allowDiscountOverride}
              onChange={setAllowDiscountOverride}
              title="Allow Manual Discount Overrides"
              description="Permits applying custom discounts outside predefined pricing tiers."
            />
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-line px-8 py-5">
          <Button variant="secondary" className="rounded-lg" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="rounded-lg bg-brand hover:bg-brand-hover"
            loading={save.isPending}
            onClick={() => save.mutate()}
          >
            Save Changes
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-eyebrow font-semibold uppercase tracking-[0.06em] text-brand-ink/70">
      {children}
    </p>
  );
}

function Divider() {
  return <hr className="my-7 border-line" />;
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-body text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

function PermissionRow({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors",
          checked ? "border-brand bg-brand text-white" : "border-line-strong bg-surface",
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
      </button>
      <div className="min-w-0">
        <p className="text-body text-ink">{title}</p>
        <p className="mt-0.5 text-meta text-ink-muted">{description}</p>
      </div>
    </div>
  );
}
