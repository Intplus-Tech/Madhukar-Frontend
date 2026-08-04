"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Receipt,
  BarChart3,
  LifeBuoy,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { NavItem } from "@/lib/constants";

const ICONS: Record<string, LucideIcon> = {
  LayoutGrid,
  Receipt,
  BarChart3,
};

export type SidebarTone = "admin" | "accounts";

export function Sidebar({
  tone,
  brand,
  subtitle,
  items,
  showSupport = false,
  onNavigate,
}: {
  tone: SidebarTone;
  brand: string;
  subtitle?: string;
  items: NavItem[];
  showSupport?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isAdmin = tone === "admin";

  return (
    <aside
      className={cn(
        "flex h-full w-[240px] shrink-0 flex-col",
        isAdmin ? "bg-admin-sidebar" : "bg-accounts-sidebar",
      )}
    >
      <div className={cn("px-6", isAdmin ? "pt-8 pb-6" : "pt-9 pb-8")}>
        <p
          className={cn(
            "font-display",
            isAdmin
              ? "text-body-lg font-medium text-white/90"
              : "text-title font-semibold text-white",
          )}
        >
          {brand}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-body text-white/45">{subtitle}</p>
        )}
      </div>

      <nav className="flex-1 px-3" aria-label="Main">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutGrid;
            // Exact match for index routes so /admin doesn't stay lit on /admin/orders
            const active =
              pathname === item.href || (item.href !== "/admin" && item.href !== "/accounts" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-field px-3 py-2.5 text-body transition-colors",
                    active
                      ? isAdmin
                        ? "bg-admin-sidebar-active font-medium text-admin-sidebar"
                        : "bg-white font-medium text-ink"
                      : isAdmin
                        ? "text-admin-sidebar-text hover:bg-white/5 hover:text-white"
                        : "text-accounts-sidebar-text hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-1 px-3 pb-8">
        {showSupport && (
          <Link
            href="/support"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-field px-3 py-2.5 text-body text-admin-sidebar-text transition-colors hover:bg-white/5 hover:text-white"
          >
            <LifeBuoy className="h-[18px] w-[18px]" aria-hidden />
            Support
          </Link>
        )}
        <button
          onClick={() => void logout()}
          className={cn(
            "flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-body transition-colors hover:bg-white/5 hover:text-white",
            isAdmin ? "text-admin-sidebar-text" : "text-accounts-sidebar-text",
          )}
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
