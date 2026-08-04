import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-display font-semibold text-ink">Page not found</p>
      <p className="max-w-sm text-body text-ink-muted">
        That link doesn&apos;t point anywhere. Check the address or head back to your dashboard.
      </p>
      <Link href="/">
        <Button>Go to dashboard</Button>
      </Link>
    </div>
  );
}
