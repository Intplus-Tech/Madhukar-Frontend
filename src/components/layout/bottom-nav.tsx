"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Box, ClipboardList, type LucideIcon } from "lucide-react";
import { SALES_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = { Home, MapPin, Box, ClipboardList };

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-safe"
    >
      <ul className="mx-auto flex max-w-mobile items-stretch">
        {SALES_NAV.map((item) => {
          const Icon = ICONS[item.icon] ?? Home;
          const active =
            item.href === "/sales" ? pathname === "/sales" : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-2.5"
              >
                <span
                  className={cn(
                    "flex h-9 w-11 items-center justify-center rounded transition-colors",
                    active ? "bg-ink text-ink-inverse" : "text-ink-muted",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <span
                  className={cn(
                    "text-[11px] leading-none",
                    active ? "font-medium text-ink" : "text-ink-muted",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
