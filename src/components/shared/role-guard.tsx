"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_HOME } from "@/lib/constants";
import type { UserRole } from "@/types/domain";

export function RoleGuard({ allow, children }: { allow: UserRole; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // TEMPORARY — remove once the spinner is diagnosed
  console.log("[RoleGuard]", {
    allow,
    isLoading,
    hasUser: Boolean(user),
    role: user?.role,
    email: user?.email,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login");
    else if (user.role !== allow) router.replace(ROLE_HOME[user.role]);
  }, [user, isLoading, allow, router]);

  if (isLoading || !user || user.role !== allow) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-muted" aria-label="Loading" />
      </div>
    );
  }

  return <>{children}</>;
}