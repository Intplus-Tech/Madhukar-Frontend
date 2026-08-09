"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button, FieldLabel, Input, useToast } from "@/components/ui";
import { AuthShell } from "@/components/auth";
import { authService, validateEmail } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { notify } = useToast();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);

    setSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      // Deliberately vague: confirming which addresses exist leaks accounts
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="We've sent you a reset code">
        <div className="rounded-card border border-line bg-surface p-5 text-center">
          <MailCheck className="mx-auto h-8 w-8 text-success" aria-hidden />
          <p className="mt-3 text-body text-ink">
            If an account exists for {email}, a reset code is on its way.
          </p>
          <Link href="/reset-password" className="mt-5 block">
            <Button size="block">Enter reset code</Button>
          </Link>
          <button
            onClick={async () => {
              await authService.forgotPassword(email);
              notify("Reset email sent again");
            }}
            className="mt-3 text-meta text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Didn&apos;t get it? Send again
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send a reset code"
      footer={
        <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <FieldLabel>Email ID</FieldLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="akshay@mdapl.com"
            autoComplete="email"
            inputMode="email"
            invalid={Boolean(error)}
          />
        </div>

        {error && (
          <p role="alert" className="text-meta text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="block" loading={submitting}>
          Send reset code
        </Button>
      </form>
    </AuthShell>
  );
}
