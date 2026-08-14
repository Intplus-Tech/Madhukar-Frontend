"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { MobileHeader } from "@/components/layout";
import { Button, Card, EmptyState, Input, Skeleton } from "@/components/ui";
import { dealerService, orderService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useAuth } from "@/providers/auth-provider";
import { cn, formatDate } from "@/lib/utils";

export default function OrderPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);

  /*
    Results persist while the query changes rather than blanking out, so the
    list filters live and the SEARCH DEALER button is a convenience, not a
    requirement.
  */
  const { data: dealers, isFetching } = useQuery({
    queryKey: qk.dealerSearch(query.trim(), user?.id),
    queryFn: () => dealerService.search(query, user!.id),
    enabled: Boolean(user) && searched,
    placeholderData: (previous) => previous,
  });

  const { data: history } = useQuery({
    queryKey: qk.orders({ salesRepId: user?.id }, 1),
    queryFn: () => orderService.list({ salesRepId: user!.id }, 1, 5),
    enabled: Boolean(user),
  });

  return (
    <>
      <MobileHeader title="Order" />

      <div className="space-y-4 px-4 pt-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setSearched(true)}
          placeholder="Search dealers or locations..."
          leading={<Search className="h-4 w-4" />}
          className="border-line bg-surface"
          aria-label="Search dealers"
        />

        <Button size="block" onClick={() => setSearched(true)} className="tracking-[0.06em]">
          SEARCH DEALER
        </Button>

        {!searched && (
          <p className="-mt-1 text-center text-meta text-ink-muted">
            Leave the box empty to see all your dealers.
          </p>
        )}

        {searched && (
          <section aria-live="polite">
            {isFetching ? (
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-card" />
                ))}
              </div>
            ) : !dealers?.length ? (
              <EmptyState
                title={query.trim() ? "No dealers match that search" : "No dealers assigned yet"}
                description={
                  query.trim()
                    ? "Try a different name or area, or clear the search to see all your dealers."
                    : "No dealers are coming back from the server. If you can see dealers on the Plan screen, this is a server-side issue rather than your account."
                }
              />
            ) : (
              <div className="space-y-2.5">
                {dealers.map((dealer) => (
                  <Link key={dealer.id} href={`/sales/order/${dealer.id}`}>
                    <Card className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted">
                      <span className="min-w-0">
                        <span className="block truncate text-body-lg font-semibold text-ink">
                          {dealer.name}
                        </span>
                        <span className="mt-0.5 block truncate text-body text-ink-muted">
                          {dealer.address}
                        </span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        <Card>
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            aria-expanded={historyOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5"
          >
            <span className="text-title-sm font-semibold text-ink">Order History</span>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-ink-muted transition-transform duration-200",
                historyOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          {historyOpen && (
            <div className="space-y-2.5 border-t border-line p-3 animate-slide-up">
              {!history?.data.length ? (
                <p className="px-1 py-3 text-body text-ink-muted">
                  Orders you place will show up here.
                </p>
              ) : (
                history.data.map((order) => (
                  <div key={order.id} className="rounded-field border border-line px-3.5 py-3">
                    {/* The dealer is what a rep recognises — the id means nothing to them */}
                    <p className="text-body-lg font-semibold text-ink">
                      {order.dealerName ?? "Dealer"}
                    </p>
                    <p className="mt-0.5 text-body text-ink-muted">
                      {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="mt-0.5 text-meta text-ink-faint">{order.orderNumber}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
