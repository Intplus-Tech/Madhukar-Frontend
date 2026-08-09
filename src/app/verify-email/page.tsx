"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { AuthShell } from "@/components/auth";
import { authService } from "@/lib/api";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<"working" | "done" | "failed">("working");

  useEffect(() => {
    if (!token) return setState("failed");
    authService
      .verifyEmail(token)
      .then(() => setState("done"))
      .catch(() => setState("failed"));
  }, [token]);

  return (
    <AuthShell
      title={state === "done" ? "Email verified" : "Verifying your email"}
      subtitle={
        state === "done" ? "Your account is ready to use" : "This only takes a moment"
      }
    >
      <div className="rounded-card border border-line bg-surface p-6 text-center">
        {state === "working" && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-ink-muted" aria-hidden />
            <p className="mt-3 text-body text-ink-muted">Checking your verification link…</p>
          </>
        )}

        {state === "done" && (
          <>
            <CheckCircle2 className="mx-auto h-8 w-8 text-success" aria-hidden />
            <p className="mt-3 text-body text-ink">You can sign in now.</p>
            <Link href="/login" className="mt-5 block">
              <Button size="block">Go to login</Button>
            </Link>
          </>
        )}

        {state === "failed" && (
          <>
            <AlertCircle className="mx-auto h-8 w-8 text-danger" aria-hidden />
            <p className="mt-3 text-body text-ink">
              That verification link is invalid or has expired.
            </p>
            <p className="mt-1.5 text-meta text-ink-muted">
              Request a fresh one from the registration screen.
            </p>
            <Link href="/register" className="mt-5 block">
              <Button variant="secondary" size="block">
                Back to sign up
              </Button>
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Skeleton className="h-dvh w-full" />}>
      <VerifyEmailInner />
    </Suspense>
  );
}
