import type { Announcement, Role } from "../shared/types";
import { addDocTyped, deleteDocTyped, updateDocTyped } from "./firestore";
import { getSnapshot, setState } from "../store/store";
import { notificationsService } from "./notifications";
import { emailService } from "./email";

function nowISO() { return new Date().toISOString(); }

export const announcementsService = {
  async post(title: string, body: string, author: string, authorRole: Role, pinned = false) {
    const data = { title, body, author, authorRole, at: nowISO(), pinned };
    const id = await addDocTyped("announcements", data as any);

    const { users } = getSnapshot();

    // In-app notifications + email all users via Resend
    Promise.all(
      users.map((u) => notificationsService.notify(u.id, `📢 ${title}`, body, "system"))
    ).catch(() => {});

    users.filter((u) => u.email).forEach((u) => {
      void emailService.sendAnnouncement(u.email!, title, body);
    });

    return { ...data, id } as Announcement;
  },

  async remove(id: string) {
    await deleteDocTyped("announcements", id);
    const snap = getSnapshot();
    setState({ announcements: snap.announcements.filter((a) => a.id !== id) });
  },

  async togglePin(id: string) {
    const snap = getSnapshot();
    const ann = snap.announcements.find((a) => a.id === id);
    if (!ann) return;
    await updateDocTyped("announcements", id, { pinned: !ann.pinned } as any);
    setState({
      announcements: snap.announcements.map((a) => a.id === id ? { ...a, pinned: !a.pinned } : a),
    });
  },
};
