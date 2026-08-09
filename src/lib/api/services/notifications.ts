import type { Notification } from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
import { mapNotification, type ApiNotification } from "../mappers";
import { db } from "../mock/db";

export const notificationService = {
  async list(_userId: string): Promise<Notification[]> {
    if (!USE_MOCK) {
      // Scoped to the authenticated user by the bearer token
      const res = await http.get<{ items?: ApiNotification[] }>("/notifications", { limit: 50 });
      return (res.items ?? []).map(mapNotification);
    }
    return delay(
      db.notifications
        .filter((n) => n.userId === _userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      200,
    );
  },

  async unreadCount(userId: string): Promise<number> {
    if (!USE_MOCK) {
      const res = await http.get<{ count?: number; unreadCount?: number }>(
        "/notifications/unread-count",
      );
      return res.count ?? res.unreadCount ?? 0;
    }
    return delay(db.notifications.filter((n) => n.userId === userId && !n.isRead).length, 120);
  },

  async markRead(id: string): Promise<void> {
    if (!USE_MOCK) {
      await http.post(`/notifications/${id}/read`);
      return;
    }
    const item = db.notifications.find((n) => n.id === id);
    if (item) item.isRead = true;
    await delay(null, 80);
  },

  async markAllRead(userId: string): Promise<void> {
    if (!USE_MOCK) {
      await http.post("/notifications/read-all");
      return;
    }
    db.notifications.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    await delay(null, 120);
  },
};
