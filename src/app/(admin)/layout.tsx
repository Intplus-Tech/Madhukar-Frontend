"use client";

import type { ReactNode } from "react";
import { DesktopShell } from "@/components/layout";
import { RoleGuard } from "@/components/shared";
import { ADMIN_NAV } from "@/lib/constants";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow="admin">
      <DesktopShell
        tone="admin"
        brand="Manager's View"
        subtitle="Institutional Portal"
        topbarBrand="LedgerFlow"
        items={ADMIN_NAV}
        showSupport
      >
        {children}
      </DesktopShell>
    </RoleGuard>
  );
}
