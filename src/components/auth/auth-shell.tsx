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
    /* min-h-dvh fills the viewport; the body grows to push the footer down */
    <div className="flex min-h-dvh w-full flex-col bg-app">
      <div className="flex w-full flex-1 items-center justify-center px-6 py-8 sm:px-10">
        {/*
          Widens with the screen instead of staying pinned to the phone width —
          430px on mobile, comfortably wider on tablet and desktop.
        */}
        <div className="w-full max-w-mobile sm:max-w-lg lg:max-w-xl">
          <div className="flex flex-col items-center text-center">
            <BrandMark className="h-72 w-72 sm:h-80 sm:w-80 lg:h-[360px] lg:w-[360px]" />
            {/* Negative margin closes the transparent padding inside the PNG */}
            <p className="-mt-8 text-body-lg text-ink-muted sm:-mt-10">{APP_TAGLINE}</p>
          </div>

          <hr className="my-6 border-line sm:my-8" />

          <div className="mb-6">
            <p className="text-body-lg font-medium text-ink">{title}</p>
            <p className="text-body-lg text-ink-muted">{subtitle}</p>
          </div>

          {children}

          {footer && <div className="mt-6 text-center text-body text-ink-muted">{footer}</div>}
        </div>
      </div>

      <footer className="w-full px-6 pb-8 pt-4 text-center">
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