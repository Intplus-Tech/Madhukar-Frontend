import type { SalesOrderFilters, SalesOrderStatus } from "@/types/domain";

export interface UiFilterState {
  date: string;
  salesRepId: string;
  status: string;
  search: string;
}

/** Translates the filter bar's flat form state into the API filter shape. */
export function toApiFilters(state: UiFilterState): SalesOrderFilters {
  return {
    status: state.status ? (state.status as SalesOrderStatus) : undefined,
    salesRepId: state.salesRepId || undefined,
    dateRange: state.date ? { from: state.date, to: state.date } : undefined,
    search: state.search?.trim() || undefined,
  };
}
