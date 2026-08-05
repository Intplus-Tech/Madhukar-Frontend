"use client";

import { Bell, Menu, RefreshCw, Search, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { notificationService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useAuth } from "@/providers/auth-provider";

export function TopBar({
  brand,
  searchPlaceholder = "Search orders...",
  searchAlign = "end",
  showRefresh = false,
  onOpenMenu,
  onRefresh,
  className,
}: {
  brand?: string;
  searchPlaceholder?: string;
  /** Figma places the search left on accounts and right-of-centre on admin. */
  searchAlign?: "start" | "end";
  showRefresh?: boolean;
  onOpenMenu: () => void;
  onRefresh?: () => void;
  className?: string;
}) {
  const { user } = useAuth();
  const { data: unread = 0 } = useQuery({
    queryKey: qk.unreadCount(user?.id ?? "anon"),
    queryFn: () => notificationService.unreadCount(user!.id),
    enabled: Boolean(user),
  });

  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center gap-4 border-b border-line bg-surface px-4 lg:px-6",
        className,
      )}
    >
      {/*
        The two roles place the search differently in Figma: accounts pins it
        to the left of the content area, admin sits it beside the icons. The
        flex-1 side groups make either position stable as the header resizes.
      */}
      <div
        className={cn(
          "flex min-w-0 items-center gap-3",
          searchAlign === "end" ? "flex-1" : "shrink-0",
        )}
      >
        <button
          onClick={onOpenMenu}
          className="-ml-2 rounded-field p-2 text-ink transition-colors hover:bg-surface-muted lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {brand && (
          <span className="hidden truncate font-display text-body-lg font-medium text-ink lg:block">
            {brand}
          </span>
        )}
      </div>

      <div className={cn("w-full min-w-0 max-w-md shrink", searchAlign === "start" && "mr-auto")}>
        <label className="sr-only" htmlFor="global-search">
          Search
        </label>
        <div className="flex h-10 items-center gap-2 rounded-field bg-surface-muted px-3">
          <Search className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
          <input
            id="global-search"
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {showRefresh && (
          <IconButton label="Refresh data" onClick={onRefresh}>
            <RefreshCw className="h-[18px] w-[18px]" />
          </IconButton>
        )}

        <IconButton label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <span className="relative block">
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-pill bg-danger ring-2 ring-surface" />
            )}
          </span>
        </IconButton>

        <IconButton label="Settings" className="hidden sm:inline-flex">
          <Settings className="h-[18px] w-[18px]" />
        </IconButton>

        <Avatar name={user?.name ?? "User"} size="md" className="ml-1" />
      </div>
    </header>
  );
}

function IconButton({
  children,
  label,
  className,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-field text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}