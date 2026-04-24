import type { ClinicSettings, StaffPermission, User } from "../shared/types";
import { getSnapshot, setState } from "../store/store";
import { notificationsService } from "./notifications";

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export const settingsService = {
  updateClinic(partial: Partial<ClinicSettings>, actor: string) {
    const snap = getSnapshot();
    setState({ settings: { ...snap.settings, ...partial } as ClinicSettings });
    if (snap.user) {
      notificationsService.system(snap.user.id, "Clinic settings updated", `Updated by ${actor}.`, "system");
    }
  },

  updateStaffPermission(staffId: string, partial: Partial<StaffPermission>, actor: string) {
    const snap = getSnapshot();
    const next = snap.staffPermissions.map((p) =>
      p.staffId === staffId ? ({ ...p, ...partial } as StaffPermission) : p
    );
    setState({ staffPermissions: next });
    notificationsService.system(staffId, "Permissions updated", `Updated by ${actor}.`, "system");
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

    notificationsService.system(staff.id, "Staff account created", `Created by ${actor}.`, "system");
    return staff;
  },
};

