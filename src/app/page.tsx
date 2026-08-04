"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_HOME } from "@/lib/constants";

/** Sends each signed-in role to its own home; everyone else to login. */
export default function IndexPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? ROLE_HOME[user.role] : "/login");
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-ink-muted" aria-label="Loading" />
    </div>
  );
}
