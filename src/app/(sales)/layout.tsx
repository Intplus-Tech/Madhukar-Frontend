import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout";
import { RoleGuard } from "@/components/shared";

/**
 * The sales app is phone-first. On tablets and desktops the content stays in a
 * centred 430px column so the layout never stretches into something the design
 * never accounted for.
 */
export default function SalesLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow="sales">
      <div className="min-h-dvh bg-app">
        <div className="mx-auto flex min-h-dvh w-full max-w-mobile flex-col border-line sm:border-x sm:bg-app">
          <div className="flex-1 pb-[calc(var(--bottom-nav-h)+16px)]">{children}</div>
        </div>
        <BottomNav />
      </div>
    </RoleGuard>
  );
}
