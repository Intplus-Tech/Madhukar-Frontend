"use client";

import { useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DesktopShell } from "@/components/layout";
import { RoleGuard } from "@/components/shared";
import { ACCOUNTS_NAV } from "@/lib/constants";

export default function AccountsLayout({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  /**
   * Refetches the cached queries instead of reloading the document.
   * A full `window.location.reload()` here is dangerous: if it is ever called
   * during render rather than on click, the page reloads forever.
   */
  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries();
  }, [queryClient]);

  return (
    <RoleGuard allow="accounts">
  <div className="[--radius-card:0px] ">
    <DesktopShell
      tone="accounts"
      brand="Accounts Dashboard"
      items={ACCOUNTS_NAV}
      searchAlign="start"
      showRefresh
      onRefresh={handleRefresh}
    >
      {children}
    </DesktopShell>
  </div>
</RoleGuard> 
  );
}