import type { NotificationEntry, NotificationKind } from "../shared/types";
import { addDocTyped, updateDocTyped } from "./firestore";
import { getSnapshot, setState } from "../store/store";

function nowISO() { return new Date().toISOString(); }

async function persist(entry: Omit<NotificationEntry, "id">): Promise<NotificationEntry> {
  const id = await addDocTyped("notifications", entry as any);
  return { ...entry, id } as NotificationEntry;
}

export const notificationsService = {
  async push(input: Omit<NotificationEntry, "id" | "at" | "read">): Promise<NotificationEntry> {
    return persist({ ...input, at: nowISO(), read: false });
  },

  /** Notify a single user. */
  async notify(userId: string, title: string, message: string, kind: NotificationKind = "system") {
    return this.push({ userId, title, message, kind });
  },

  /** Notify all staff and doctors (used when a patient books). */
  async notifyStaff(title: string, message: string, kind: NotificationKind = "appointment") {
    const { users } = getSnapshot();
    const targets = users.filter((u) => u.role === "staff" || u.role === "doctor");
    await Promise.all(targets.map((u) => this.push({ userId: u.id, title, message, kind })));
  },

  async markRead(id: string) {
    await updateDocTyped<NotificationEntry>("notifications", id, { read: true } as any);
    const snap = getSnapshot();
    setState({
      notifications: snap.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
    });
  },

  async markAllRead(userId: string) {
    const snap = getSnapshot();
    const unread = snap.notifications.filter((n) => n.userId === userId && !n.read);
    await Promise.all(unread.map((n) => updateDocTyped<NotificationEntry>("notifications", n.id, { read: true } as any)));
    setState({
      notifications: snap.notifications.map((n) => n.userId === userId ? { ...n, read: true } : n),
    });
  },
};
