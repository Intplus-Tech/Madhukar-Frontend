"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, UserPlus } from "lucide-react";
import { Button, FieldLabel, Input, Select, useToast } from "@/components/ui";
import { AuthShell, PasswordField } from "@/components/auth";
import { authService, validateEmail, validatePassword, PASSWORD_RULES, ApiRequestError } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/constants";
import type { UserRole } from "@/types/domain";

const ROLE_OPTIONS: Array<{ label: string; value: UserRole }> = [
  { label: ROLE_LABEL.sales, value: "sales" },
  { label: ROLE_LABEL.accounts, value: "accounts" },
  { label: ROLE_LABEL.admin, value: "admin" },
];

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("sales");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const { notify } = useToast();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) return setError("Enter your full name.");
    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);
    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);
    if (password !== confirm) return setError("Passwords don't match.");

    setSubmitting(true);
    try {
      const { message } = await authService.register({ fullName, email, role, password });
      setDone(message);
      notify("Account created");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.status === 409
            ? "An account with that email already exists."
            : err.message
          : "We couldn't create your account. Try again.",
      );
      notify("Registration failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="Almost there" subtitle="One more step to activate your account">
        <div className="rounded-card border border-line bg-surface p-5 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-success" aria-hidden />
          <p className="mt-3 text-body text-ink">{done}</p>
          <p className="mt-2 text-meta text-ink-muted">
            We sent a link to {email}. Open it to verify your address, then sign in.
          </p>

          <div className="mt-5 space-y-2.5">
            <Button size="block" onClick={() => router.push("/login")}>
              Go to login
            </Button>
            <Button
              variant="secondary"
              size="block"
              onClick={async () => {
                await authService.resendVerification(email);
                notify("Verification email sent");
              }}
            >
              Resend verification email
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <FieldLabel>Full name</FieldLabel>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Akshay Kumar"
            autoComplete="name"
            autoCapitalize="words"
          />
        </div>

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
          />
        </div>

        <div>
          <FieldLabel>Role</FieldLabel>
          <Select
            id="role"
            className="h-12"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          />
          <p className="mt-1.5 text-meta text-ink-muted">
            This decides which version of the app you see after signing in.
          </p>
        </div>

        <PasswordField
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint={PASSWORD_RULES.hint}
        />

        <PasswordField
          id="confirm"
          label="Confirm password"
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
          Create account
          {!submitting && <UserPlus className="h-4 w-4" aria-hidden />}
        </Button>
      </form>
    </AuthShell>
  );
}
