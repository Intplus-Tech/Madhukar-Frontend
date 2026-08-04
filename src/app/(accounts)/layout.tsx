"use client";

import type { ReactNode } from "react";
import { DesktopShell } from "@/components/layout";
import { RoleGuard } from "@/components/shared";
import { ACCOUNTS_NAV } from "@/lib/constants";

export default function AccountsLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow="accounts">
      <DesktopShell
        tone="accounts"
        brand="Accounts Dashboard"
        items={ACCOUNTS_NAV}
        showRefresh
        onRefresh={() => window.location.reload()}
      >
        {children}
      </DesktopShell>
    </RoleGuard>
  );
}
