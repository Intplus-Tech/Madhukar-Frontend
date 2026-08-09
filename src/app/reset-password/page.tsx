"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, FieldLabel, Input, Skeleton, useToast } from "@/components/ui";
import { AuthShell, PasswordField } from "@/components/auth";
import { authService, validatePassword, PASSWORD_RULES, ApiRequestError } from "@/lib/api";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { notify } = useToast();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token.trim()) return setError("Enter the code from your email.");
    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);
    if (password !== confirm) return setError("Passwords don't match.");

    setSubmitting(true);
    try {
      await authService.resetPassword(token.trim(), password);
      notify("Password updated — sign in with your new password");
      router.replace("/login");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "That code didn't work. Request a new one and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Enter the code we emailed you"
      footer={
        <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <FieldLabel>Reset code</FieldLabel>
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="236477"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </div>

        <PasswordField
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint={PASSWORD_RULES.hint}
        />

        <PasswordField
          id="confirm"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />

        {error && (
          <p role="alert" className="text-meta text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="block" loading={submitting}>
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Skeleton className="h-dvh w-full" />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
