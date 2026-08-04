"use client";

import { useState, type ReactNode } from "react";
import { Sidebar, type SidebarTone } from "./sidebar";
import { TopBar } from "./topbar";
import type { NavItem } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the two desktop roles. The sidebar is fixed from `lg` up
 * and becomes an off-canvas drawer below that, so the dense tables stay usable
 * on tablets and phones.
 */
export function DesktopShell({
  tone,
  brand,
  subtitle,
  topbarBrand,
  items,
  showSupport,
  showRefresh,
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
  onRefresh?: () => void;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-app">
      {/* Persistent sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar
            tone={tone}
            brand={brand}
            subtitle={subtitle}
            items={items}
            showSupport={showSupport}
          />
        </div>
      </div>

      {/* Off-canvas drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 h-full animate-slide-in-right">
            <Sidebar
              tone={tone}
              brand={brand}
              subtitle={subtitle}
              items={items}
              showSupport={showSupport}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          brand={topbarBrand}
          showRefresh={showRefresh}
          onRefresh={onRefresh}
          onOpenMenu={() => setDrawerOpen(true)}
        />
        <main className={cn("flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8")}>{children}</main>
      </div>
    </div>
  );
}
