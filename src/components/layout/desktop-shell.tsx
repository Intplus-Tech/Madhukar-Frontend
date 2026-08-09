"use client";

import { useState, type ReactNode } from "react";
import { Sidebar, type SidebarTone } from "./sidebar";
import { TopBar } from "./topbar";
import type { NavItem } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the two desktop roles.
 *
 * `topbarSpan` reflects a real difference between the Figma frames:
 *   "full"    — admin: the bar runs edge to edge, sidebar starts beneath it
 *   "content" — accounts: sidebar runs full height, bar sits only over content
 *
 * The sidebar is fixed from `lg` up and becomes an off-canvas drawer below
 * that, so the dense tables stay usable on tablets and phones.
 */
export function DesktopShell({
  tone,
  brand,
  subtitle,
  topbarBrand,
  items,
  showSupport,
  showRefresh,
  searchAlign,
  topbarSpan = "content",
  onRefresh,
  children,
}: {
  tone: SidebarTone;
  brand: string;
  subtitle?: string;
  topbarBrand?: string;
  items: NavItem[];
  showSupport?: boolean;
  showRefresh?: boolean;
  searchAlign?: "start" | "end";
  topbarSpan?: "full" | "content";
  onRefresh?: () => void;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isFullSpan = topbarSpan === "full";

  const sidebar = (onNavigate?: () => void) => (
    <Sidebar
      tone={tone}
      brand={brand}
      subtitle={subtitle}
      items={items}
      showSupport={showSupport}
      onNavigate={onNavigate}
    />
  );

  const topbar = (
    <TopBar
      brand={topbarBrand}
      searchAlign={searchAlign}
      showRefresh={showRefresh}
      onRefresh={onRefresh}
      onOpenMenu={() => setDrawerOpen(true)}
    />
  );

  const drawer = drawerOpen && (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <button
        aria-label="Close navigation"
        className="absolute inset-0 bg-ink/40"
        onClick={() => setDrawerOpen(false)}
      />
      <div className="relative z-10 h-full animate-slide-in-right">
        {sidebar(() => setDrawerOpen(false))}
      </div>
    </div>
  );

  const main = <main className={cn("flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8")}>{children}</main>;

  if (isFullSpan) {
    return (
      <div className="flex min-h-dvh flex-col bg-app [--radius-card:px]">
        <div className="sticky top-0 z-40">{topbar}</div>
        {drawer}

        <div className="flex flex-1 min-h-0">
          <div className="hidden lg:block">
            {/* h-16 is the top bar; the sidebar fills what's left below it */}
            <div className="sticky top-16 h-[calc(100dvh-4rem)]">{sidebar()}</div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col">{main}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-app [--radius-card:0px] rounded-none">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-dvh">{sidebar()}</div>
      </div>

      {drawer}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-40">{topbar}</div>
        {main}
      </div>
    </div>
  );
}
