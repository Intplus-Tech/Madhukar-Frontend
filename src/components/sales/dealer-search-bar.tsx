"use client";

import { Map, Search } from "lucide-react";
import { Input } from "@/components/ui";

/** Search + map toggle pair used on the Planning screens. */
export function DealerSearchBar({
  value,
  onChange,
  onOpenMap,
  placeholder = "Search dealers or locations...",
}: {
  value: string;
  onChange: (next: string) => void;
  onOpenMap?: () => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-none">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        leading={<Search className="h-4 w-4" />}
        className="h-12 flex-1 border-line bg-surface rounded-none "
        aria-label="Search dealers"
      />
      <button
        type="button"
        onClick={onOpenMap}
        aria-label="View dealers on map"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-field border border-line bg-surface text-ink transition-colors hover:bg-surface-muted rounded-none"
      >
        <Map className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
