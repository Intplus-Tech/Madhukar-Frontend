"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button, FieldLabel, Input, useToast } from "@/components/ui";
import { AuthShell, PasswordField } from "@/components/auth";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_HOME } from "@/lib/constants";
import { validateEmail } from "@/lib/api";
import { ApiRequestError } from "@/lib/api";

function LoginPageInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const { notify } = useToast();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);
    if (!password) return setError("Enter your password.");

    setSubmitting(true);
    try {
      const user = await login(email, password);
      router.replace(ROLE_HOME[user.role]);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.status === 401
            ? "Email or password is incorrect."
            : err.message
          : "We couldn't sign you in. Check your details and try again.";
      setError(message);
      notify("Sign in failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome"
      subtitle="Login to your account to continue"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-ink underline-offset-4 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      {expired && !error && (
        <p className="mb-4 rounded-field bg-warning-soft px-3.5 py-2.5 text-meta text-warning-ink">
          Your session expired. Please sign in again.
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <FieldLabel>Email ID</FieldLabel>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="akshay@mdapl.com"
            autoComplete="email"
            inputMode="email"
            invalid={Boolean(error)}
          />
        </div>

        <PasswordField value={password} onChange={setPassword} invalid={Boolean(error)} />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-meta text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <p role="alert" className="text-meta text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="block" loading={submitting}>
          Login
          {!submitting && <LogIn className="h-4 w-4" aria-hidden />}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
