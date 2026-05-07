import type { ClinicSettings, StaffPermission, StaffSubRole, User } from "../shared/types";
import { getSnapshot, setState } from "../store/store";
import { updateDocTyped, deleteDocTyped } from "./firestore";
import { notificationsService } from "./notifications";

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

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

  addStaff(name: string, email: string, phone: string, actor: string) {
    const snap = getSnapshot();
    const staff: User = {
      id: makeId("u"),
      name: name.trim() || "New Staff",
      email,
      phone,
      role: "staff",
      active: true,
    };

    const perms: StaffPermission = {
      staffId: staff.id,
      appointments: true,
      payments: true,
      records: true,
      adminSupport: false,
    };

    setState({
      users: [staff, ...snap.users],
      staffPermissions: [perms, ...snap.staffPermissions],
    });

    notificationsService.notify(staff.id, "Staff account created", `Created by ${actor}.`, "system");
    return staff;
  },

  async updateStaffSubRole(staffId: string, subRole: StaffSubRole) {
    await updateDocTyped("users", staffId, { subRole } as any);
    const { users } = getSnapshot();
    setState({ users: users.map((u) => u.id === staffId ? { ...u, subRole } : u) });
  },

  async removeStaff(staffId: string) {
    await deleteDocTyped("users", staffId);
    const { users } = getSnapshot();
    setState({ users: users.filter((u) => u.id !== staffId) });
  },
};


