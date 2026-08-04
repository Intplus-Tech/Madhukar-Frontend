"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { BackHeader } from "@/components/layout";
import { Button, Card, EmptyState, Skeleton } from "@/components/ui";
import { notificationService } from "@/lib/api";
import { qk } from "@/lib/api/queryKeys";
import { useAuth } from "@/providers/auth-provider";
import { cn, relativeTime } from "@/lib/utils";

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.notifications(user?.id ?? ""),
    queryFn: () => notificationService.list(user!.id),
    enabled: Boolean(user),
  });

  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(user!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.notifications(user!.id) });
      void queryClient.invalidateQueries({ queryKey: qk.unreadCount(user!.id) });
    },
  });

  return (
    <>
      <BackHeader label="Notifications" />

      <div className="space-y-3 px-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-card" />
          ))
        ) : !data?.length ? (
          <EmptyState
            icon={<Bell className="h-8 w-8" />}
            title="You're all caught up"
            description="Updates from accounts about your orders will appear here."
          />
        ) : (
          <>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => markAll.mutate()}>
                Mark all as read
              </Button>
            </div>

            {data.map((n) => (
              <Card
                key={n.id}
                className={cn("p-4", !n.isRead && "border-l-4 border-l-danger")}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-body-lg font-semibold text-ink">{n.title}</p>
                  <span className="shrink-0 text-meta text-ink-faint">
                    {relativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-body text-ink-muted">{n.message}</p>
              </Card>
            ))}
          </>
        )}
      </div>
    </>
  );
}
