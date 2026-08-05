"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button, FieldLabel, Input, useToast } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_HOME, APP_TAGLINE, COMPANY } from "@/lib/constants";
import { BrandMark } from "@/components/shared/brand-mark";

export default function LoginPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const { notify } = useToast();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError("Enter your full name to continue.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");

    setSubmitting(true);
    try {
      const user = await login(fullName, email);
      router.replace(ROLE_HOME[user.role]);
    } catch {
      setError("We couldn't sign you in. Check your details and try again.");
      notify("Sign in failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-app">
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-mobile">
          <div className="flex flex-col items-center text-center">
            <BrandMark className="h-[72px] w-[72px]" />
            <h1 className="mt-4 font-display text-[26px] font-bold tracking-[0.02em] text-ink">
              LAKSHYA 72
            </h1>
            <p className="mt-1.5 text-body-lg text-ink-muted">{APP_TAGLINE}</p>
          </div>

          <hr className="my-8 border-line" />

          <div className="mb-6">
            <p className="text-body-lg font-medium text-ink">Welcome</p>
            <p className="text-body-lg text-ink-muted">Login to your account to continue</p>
          </div>

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div>
              <FieldLabel>Full name</FieldLabel>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Akshay"
                autoComplete="name"
                autoCapitalize="words"
              />
            </div>

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

            <Button type="submit" size="block" loading={submitting} className="mt-2 text-white">
              Login
              {!submitting && <LogIn className="h-4 w-4" aria-hidden />}
            </Button>
          </form>
        </div>
      </div>

      <footer className="px-6 pb-8 pt-4 text-center">
        <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
          <Link href="/privacy" className="hover:text-ink">
            Privacy policy
          </Link>
          <span className="mx-2 text-ink-faint">•</span>
          <Link href="/support" className="hover:text-ink">
            Support
          </Link>
        </p>
        <p className="mt-2 text-meta text-ink-faint">© 2026 {COMPANY}</p>
      </footer>
    </div>
  );
}
