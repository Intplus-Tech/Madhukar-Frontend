"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/api/mock/db";
import { USE_MOCK, teamService } from "@/lib/api";

/**
 * Dealer and rep lookups for tables and filter dropdowns.
 *
 * List endpoints already return `dealerName` and `salesRepName` on each row,
 * so the name helpers are only a fallback. The rep options, though, have to be
 * fetched — the filter dropdown can't offer names it doesn't have.
 */
export function useLookup() {
  const { data: team = [] } = useQuery({
    queryKey: ["team", "all"],
    queryFn: () => teamService.list("all"),
    staleTime: 5 * 60_000,
  });

  const dealerName = useCallback((id: string) => (USE_MOCK ? db.dealerName(id) : id), []);

  const repName = useCallback(
    (id: string) => team.find((m) => m.id === id)?.name ?? (USE_MOCK ? db.repName(id) : id),
    [team],
  );

  const reps = useMemo(
    () =>
      team
        .filter((m) => m.position === "Sales Rep")
        .map((m) => ({ label: m.name, value: m.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [team],
  );

  return { dealerName, repName, reps };
}
