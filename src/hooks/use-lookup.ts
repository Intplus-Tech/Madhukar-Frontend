"use client";

import { useCallback } from "react";
import { db } from "@/lib/api/mock/db";
import { USE_MOCK } from "@/lib/api";

/**
 * Dealer/rep name lookups for table cells.
 *
 * The mock layer resolves these locally. Once the real API is wired, the list
 * endpoints should return `dealerName` and `salesRepName` on each row so this
 * hook can be deleted rather than turned into an N+1 fetch.
 */
export function useLookup() {
  const dealerName = useCallback(
    (id: string) => (USE_MOCK ? db.dealerName(id) : id),
    [],
  );
  const repName = useCallback((id: string) => (USE_MOCK ? db.repName(id) : id), []);
  const reps = USE_MOCK
    ? db.users.filter((u) => u.role === "sales").map((u) => ({ label: u.name, value: u.id }))
    : [];

  return { dealerName, repName, reps };
}
