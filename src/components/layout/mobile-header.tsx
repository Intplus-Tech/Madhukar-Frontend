// "use client";

// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { ArrowLeft, Bell } from "lucide-react";
// import { useQuery } from "@tanstack/react-query";
// import { Avatar } from "@/components/ui";
// import { notificationService } from "@/lib/api";
// import { qk } from "@/lib/api/queryKeys";
// import { useAuth } from "@/providers/auth-provider";

// /** Title header with avatar + bell — used on the four tab roots. */
// export function MobileHeader({ title }: { title: string }) {
//   const { user } = useAuth();
//   const { data: unread = 0 } = useQuery({
//     queryKey: qk.unreadCount(user?.id ?? "anon"),
//     queryFn: () => notificationService.unreadCount(user!.id),
//     enabled: Boolean(user),
//   });

//   return (
//     <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-app/95 px-4 backdrop-blur">
//       <div className="flex min-w-0 items-center gap-2.5">
//         <Avatar name={user?.name ?? "Akshay Kumar"} size="sm" />
//         <h1 className="truncate text-title font-bold text-ink">{title}</h1>
//       </div>

//       <Link href="/sales/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative p-1.5">
//         <Bell className="h-5 w-5 text-ink" />
//         {unread > 0 && (
//           <span className="absolute right-1 top-1 h-2 w-2 rounded-pill bg-danger ring-2 ring-app" />
//         )}
//       </Link>
//     </header>
//   );
// }

// /** Back header used on drill-down screens. */
// export function BackHeader({ label, href }: { label: string; href?: string }) {
//   const router = useRouter();

//   return (
//     <header className="sticky top-0 z-30 flex h-14 items-center bg-app/95 px-4 backdrop-blur">
//       <button
//         onClick={() => (href ? router.push(href) : router.back())}
//         className="-ml-2 flex items-center gap-3 rounded-field p-2 text-ink"
//       >
//         <ArrowLeft className="h-5 w-5" aria-hidden />
//         <span className="text-body-lg">{label}</span>
//       </button>
//     </header>
//   );
// }


"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui";
import { AccountSheet } from "@/components/sales/account-sheet";
import { notificationService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useAuth } from "@/providers/auth-provider";

/** Title header with avatar + bell — used on the four tab roots. */
export function MobileHeader({ title }: { title: string }) {
  const { user } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const closeAccount = useCallback(() => setAccountOpen(false), []);
  const { data: unread = 0 } = useQuery({
    queryKey: qk.unreadCount(user?.id ?? "anon"),
    queryFn: () => notificationService.unreadCount(user!.id),
    enabled: Boolean(user),
  });

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-app/95 px-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            aria-label="Account and sign out"
            aria-haspopup="dialog"
            aria-expanded={accountOpen}
            className="rounded-pill transition-opacity hover:opacity-80"
          >
            <Avatar name={user?.name ?? "Akshay Kumar"} size="sm" />
          </button>
          <h1 className="truncate text-title font-bold text-ink">{title}</h1>
        </div>

        <Link
          href="/sales/notifications"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative p-1.5"
        >
          <Bell className="h-5 w-5 text-ink" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-pill bg-danger ring-2 ring-app" />
          )}
        </Link>
      </header>

      {/* Sibling of <header>, not a child — a dialog doesn't belong inside a banner */}
      <AccountSheet open={accountOpen} onClose={closeAccount} />
    </>
  );
}

/** Back header used on drill-down screens. */
export function BackHeader({ label, href }: { label: string; href?: string }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center bg-app/95 px-4 backdrop-blur">
      <button
        type="button"
        onClick={() => (href ? router.push(href) : router.back())}
        className="-ml-2 flex items-center gap-3 rounded-field p-2 text-ink"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
        <span className="text-body-lg">{label}</span>
      </button>
    </header>
  );
}