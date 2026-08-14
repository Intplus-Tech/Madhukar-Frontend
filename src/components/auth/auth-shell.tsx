import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/shared";
import { APP_TAGLINE, COMPANY } from "@/lib/constants";

/** Shared chrome for every auth screen — logo, heading, footer. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-app">
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-mobile">
          <div className="flex flex-col items-center text-center">
            <BrandMark className="h-[72px] w-[72px]" />
            {/* <h1 className="mt-4 font-display text-[26px] font-bold tracking-[0.02em] text-ink">
              LAKSHYA 72
            </h1> */}
            <p className="mt-1.5 text-body-lg text-ink-muted">{APP_TAGLINE}</p>
          </div>

          <hr className="my-8 border-line" />

          <div className="mb-6">
            <p className="text-body-lg font-medium text-ink">{title}</p>
            <p className="text-body-lg text-ink-muted">{subtitle}</p>
          </div>

          {children}

          {footer && <div className="mt-6 text-center text-body text-ink-muted">{footer}</div>}
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
