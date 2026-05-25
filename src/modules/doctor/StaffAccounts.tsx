import { useState } from "react";
import { Badge, Button, Card, Input, Label, PasswordInput, Select } from "../../components/ui";
import { authService } from "../../services/auth";
import { settingsService } from "../../services/settings";
import { useStore } from "../../store/store";
import type { StaffPermission, StaffSubRole } from "../../shared/types";

const SUB_ROLE_LABELS: Record<StaffSubRole, string> = {
  billing_specialist:    "Billing Specialist",
  appointment_scheduler: "Appointment Scheduler",
  general:               "General Staff",
};

// Default permissions per sub-role
const SUB_ROLE_DEFAULTS: Record<StaffSubRole, Omit<StaffPermission, "staffId" | "subRole">> = {
  billing_specialist:    { appointments: false, payments: true,  records: false, adminSupport: false },
  appointment_scheduler: { appointments: true,  payments: false, records: false, adminSupport: false },
  general:               { appointments: true,  payments: true,  records: true,  adminSupport: true  },
};

export function StaffAccounts() {
  const { users, staffPermissions, user } = useStore();
  const staffUsers = users.filter((u) => u.role === "staff");
  const coDoctorUsers = users.filter((u) => u.role === "co-doctor");
  const [newStaff, setNewStaff] = useState({ name: "", email: "", phone: "", password: "", role: "staff" as "staff" | "co-doctor", subRole: "general" as StaffSubRole });
  const [created, setCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const permissionFor = (staffId: string): StaffPermission =>
    staffPermissions.find((p) => p.staffId === staffId) || {
      staffId, appointments: true, payments: true, records: true, adminSupport: true,
    };

  return (
    <div className="space-y-6">
      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">System administration</div>
              <h3 className="font-serif text-2xl text-gold-gradient mt-1">Manage Staff Accounts & Permissions</h3>
            </div>
            <Badge tone="neutral">Doctor control</Badge>
          </div>

          <div className="space-y-4">
            {staffUsers.map((staff) => {
              const permissions = permissionFor(staff.id);
              const subRole = (staff.subRole || "general") as StaffSubRole;
              return (
                <div key={staff.id} className="rounded-2xl border border-gold-500/15 bg-ink-900/55 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-medium text-gold-100">{staff.name}</div>
                        <Badge tone="confirmed">{SUB_ROLE_LABELS[subRole]}</Badge>
                      </div>
                      <div className="text-xs text-gold-100/50 mt-0.5">{staff.email} · {staff.phone}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        value={subRole}
                        onChange={async (e) => {
                          const sr = e.target.value as StaffSubRole;
                          await settingsService.updateStaffSubRole(staff.id, sr);
                          const defaults = SUB_ROLE_DEFAULTS[sr];
                          settingsService.updateStaffPermission(staff.id, defaults, user!.name);
                        }}
                        className="text-xs !py-1 !px-2 max-w-[180px]"
                      >
                        {(Object.keys(SUB_ROLE_LABELS) as StaffSubRole[]).map((k) => (
                          <option key={k} value={k}>{SUB_ROLE_LABELS[k]}</option>
                        ))}
                      </Select>
                      <button
                        onClick={async () => {
                          if (!confirm(`Remove ${staff.name} from staff?`)) return;
                          await settingsService.removeStaff(staff.id);
                        }}
                        className="text-xs text-red-400/70 hover:text-red-400 transition px-2 py-1 rounded border border-red-500/20 hover:border-red-500/50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-2">
                    <PermissionToggle label="Appointments" enabled={permissions.appointments} onToggle={() => settingsService.updateStaffPermission(staff.id, { appointments: !permissions.appointments }, user!.name)} />
                    <PermissionToggle label="Payments"     enabled={permissions.payments}     onToggle={() => settingsService.updateStaffPermission(staff.id, { payments:      !permissions.payments     }, user!.name)} />
                    <PermissionToggle label="Records"      enabled={permissions.records}      onToggle={() => settingsService.updateStaffPermission(staff.id, { records:       !permissions.records      }, user!.name)} />
                    <PermissionToggle label="Admin Support" enabled={permissions.adminSupport} onToggle={() => settingsService.updateStaffPermission(staff.id, { adminSupport:  !permissions.adminSupport  }, user!.name)} />
                  </div>
                </div>
              );
            })}
            {staffUsers.length === 0 && <p className="text-sm text-gold-100/50">No staff accounts created yet.</p>}
          </div>

          {/* Co-Doctor Accounts */}
          <div className="mt-6">
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55 mb-3">Co-Doctor Accounts</div>
            <div className="space-y-3">
              {coDoctorUsers.map((cd) => (
                <div key={cd.id} className="rounded-2xl border border-purple-500/20 bg-ink-900/55 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gold-100">{cd.name}</span>
                      <Badge tone="neutral">Co-Doctor</Badge>
                    </div>
                    <div className="text-xs text-gold-100/50 mt-0.5">{cd.email}{cd.phone ? ` · ${cd.phone}` : ""}</div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(`Remove ${cd.name} from co-doctors?`)) return;
                      await settingsService.removeStaff(cd.id);
                    }}
                    className="text-xs text-red-400/70 hover:text-red-400 transition px-2 py-1 rounded border border-red-500/20 hover:border-red-500/50"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {coDoctorUsers.length === 0 && <p className="text-sm text-gold-100/50">No co-doctor accounts created yet.</p>}
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Add team member</div>
          <h3 className="mt-2 font-serif text-2xl text-gold-gradient">Create Staff Account</h3>

          <div className="mt-5 space-y-4">
            <div>
              <Label>Account Type</Label>
              <div className="flex gap-2 mt-2">
                {(["staff", "co-doctor"] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setNewStaff((p) => ({ ...p, role: r }))}
                    className={`flex-1 py-2 rounded-lg text-sm border transition ${newStaff.role === r ? "border-gold-400 bg-gold-500/10 text-gold-200" : "border-gold-500/20 text-gold-100/60 hover:border-gold-400/50"}`}>
                    {r === "co-doctor" ? "Co-Doctor" : "Staff"}
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Full Name</Label><Input value={newStaff.name} onChange={(e) => setNewStaff((p) => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" value={newStaff.email} onChange={(e) => setNewStaff((p) => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={newStaff.phone} onChange={(e) => setNewStaff((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>Password</Label><PasswordInput value={newStaff.password} onChange={(e) => setNewStaff((p) => ({ ...p, password: e.target.value }))} placeholder="Min. 6 characters" minLength={6} /></div>
            {newStaff.role === "staff" && (
              <div>
                <Label>Staff Role</Label>
                <Select value={newStaff.subRole} onChange={(e) => setNewStaff((p) => ({ ...p, subRole: e.target.value as StaffSubRole }))}>
                  {(Object.keys(SUB_ROLE_LABELS) as StaffSubRole[]).map((k) => (
                    <option key={k} value={k}>{SUB_ROLE_LABELS[k]}</option>
                  ))}
                </Select>
                <p className="text-[11px] text-gold-100/40 mt-1">
                  {newStaff.subRole === "billing_specialist" && "Access: Payments only"}
                  {newStaff.subRole === "appointment_scheduler" && "Access: Appointments only"}
                  {newStaff.subRole === "general" && "Access: All modules"}
                </p>
              </div>
            )}
            {newStaff.role === "co-doctor" && (
              <p className="text-xs text-gold-100/45">Co-doctors can view assigned patients, add treatment notes, and access clinical records. They cannot manage billing or settings.</p>
            )}
          </div>

          <Button
            className="mt-5"
            disabled={creating}
            onClick={async () => {
              if (!newStaff.name || !newStaff.email || !newStaff.password) return;
              setCreating(true); setCreateError(""); setCreated(false);
              try {
                const created = await authService.createStaffAccount(newStaff.name, newStaff.email, newStaff.phone, newStaff.role, newStaff.password);
                if (newStaff.role === "staff") {
                  await settingsService.updateStaffSubRole(created.id, newStaff.subRole);
                  const defaults = SUB_ROLE_DEFAULTS[newStaff.subRole];
                  settingsService.updateStaffPermission(created.id, defaults, user!.name);
                }
                setNewStaff({ name: "", email: "", phone: "", password: "", role: "staff", subRole: "general" });
                setCreated(true);
              } catch (err: any) {
                setCreateError(err.message || "Failed to create account.");
              } finally {
                setCreating(false);
              }
            }}
          >
            {creating ? "Creating..." : `Add ${newStaff.role === "co-doctor" ? "Co-Doctor" : "Staff Member"}`}
          </Button>
          {created && <p className="mt-3 text-sm text-emerald-400">Account created. They can log in at /admin-login.</p>}
          {createError && <p className="mt-3 text-sm text-red-400">{createError}</p>}
        </Card>
      </div>
    </div>
  );
}

function PermissionToggle({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`rounded-xl border px-3 py-2.5 text-left transition ${enabled ? "border-gold-500/40 bg-gold-500/12 text-gold-100" : "border-gold-500/12 text-gold-100/55 hover:border-gold-500/25"}`}>
      <div className="text-[9px] uppercase tracking-[0.15em] leading-tight">{label}</div>
      <div className="mt-1 text-[10px] font-medium">{enabled ? "Enabled" : "Disabled"}</div>
    </button>
  );
}
