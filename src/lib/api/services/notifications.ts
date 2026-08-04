import type { Notification } from "@/types/domain";
import { USE_MOCK, delay, http } from "../http";
import { db } from "../mock/db";

export const notificationService = {
  async list(userId: string): Promise<Notification[]> {
    if (!USE_MOCK) return http.get<Notification[]>("/notifications", { userId });
    return delay(
      db.notifications
        .filter((n) => n.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      200,
    );
  },

  async unreadCount(userId: string): Promise<number> {
    if (!USE_MOCK) {
      const res = await http.get<{ count: number }>("/notifications/unread-count", { userId });
      return res.count;
    }
    return delay(db.notifications.filter((n) => n.userId === userId && !n.isRead).length, 120);
  },

  async markRead(id: string): Promise<void> {
    if (!USE_MOCK) return http.patch(`/notifications/${id}/read`);
    const item = db.notifications.find((n) => n.id === id);
    if (item) item.isRead = true;
    await delay(null, 80);
  },

  async markAllRead(userId: string): Promise<void> {
    if (!USE_MOCK) return http.patch("/notifications/read-all", { userId });
    db.notifications.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    await delay(null, 120);
  },
};
