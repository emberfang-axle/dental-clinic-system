import type { NotificationEntry, NotificationKind } from "../shared/types";
import { getSnapshot, setState } from "../store/store";

function nowISO() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export const notificationsService = {
  push(input: Omit<NotificationEntry, "id" | "at" | "read">) {
    const snap = getSnapshot();
    const n: NotificationEntry = {
      ...input,
      id: makeId("n"),
      at: nowISO(),
      read: false,
    };
    setState({ notifications: [n, ...snap.notifications] });
    return n;
  },

  system(userId: string, title: string, message: string, kind: NotificationKind = "system") {
    return this.push({ userId, title, message, kind });
  },

  markRead(id: string) {
    const snap = getSnapshot();
    setState({
      notifications: snap.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    });
  },

  markAllRead(userId: string) {
    const snap = getSnapshot();
    setState({
      notifications: snap.notifications.map((n) =>
        n.userId === userId ? { ...n, read: true } : n
      ),
    });
  },

  clearUser(userId: string) {
    const snap = getSnapshot();
    setState({ notifications: snap.notifications.filter((n) => n.userId !== userId) });
  },
};

