import type { ClinicSettings, StaffPermission, StaffSubRole } from "../shared/types";
import { getSnapshot, setState } from "../store/store";
import { updateDocTyped, deleteDocTyped } from "./firestore";
import { notificationsService } from "./notifications";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

export const settingsService = {
  async updateClinic(partial: Partial<ClinicSettings>, actor: string) {
    const snap = getSnapshot();
    const next = { ...snap.settings, ...partial } as ClinicSettings;
    setState({ settings: next });
    await updateDocTyped("settings", "clinic", partial as any);
    if (snap.user) {
      notificationsService.notify(snap.user.id, "Clinic settings updated", `Updated by ${actor}.`, "system");
    }
  },

  async updateStaffPermission(staffId: string, partial: Partial<StaffPermission>, actor: string) {
    const snap = getSnapshot();
    const existing = snap.staffPermissions.find((p) => p.staffId === staffId) || {
      staffId, appointments: true, payments: true, records: true, adminSupport: true,
    };
    const next = snap.staffPermissions.some((p) => p.staffId === staffId)
      ? snap.staffPermissions.map((p) => p.staffId === staffId ? ({ ...p, ...partial } as StaffPermission) : p)
      : [...snap.staffPermissions, { ...existing, ...partial } as StaffPermission];
    setState({ staffPermissions: next });

    // Persist inside the clinic settings doc (staffPermissions array)
    await updateDocTyped("settings", "clinic", { staffPermissions: next } as any);
    notificationsService.notify(staffId, "Permissions updated", `Updated by ${actor}.`, "system");
  },

  async updateStaffSubRole(staffId: string, subRole: StaffSubRole) {
    await updateDocTyped("users", staffId, { subRole } as any);
    const { users } = getSnapshot();
    setState({ users: users.map((u) => u.id === staffId ? { ...u, subRole } : u) });
  },

  async removeStaff(staffId: string) {
    // 1. Immediately mark inactive + delete Firestore doc (works without functions)
    await deleteDocTyped("users", staffId);
    const { users } = getSnapshot();
    setState({ users: users.filter((u) => u.id !== staffId) });

    // 2. Also delete the Firebase Auth account via Cloud Function (requires deployment)
    try {
      const fn = httpsCallable(getFunctions(app), "deleteAuthUser");
      await fn({ uid: staffId });
    } catch {
      // Function not deployed yet — Firestore doc is already deleted above.
      // The account can still log in to Firebase Auth but will get "Account not found"
      // since their Firestore profile is gone.
    }
  },
};


