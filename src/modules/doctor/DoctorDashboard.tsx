/**
 * Doctor (Owner / Admin) dashboard.
 * Has full system control: clinical records, appointments, schedule rules,
 * payments, services + pricing, staff accounts, analytics, audit logs, profile.
 */

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Label, Select, StatCard, Textarea } from "../../components/ui";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { calendarService } from "../../services/calendar";
import { recordsService } from "../../services/records";
import { settingsService } from "../../services/settings";
import { useStore } from "../../store/store";
import { BOOKING, DASHBOARD_TABS } from "../../shared/constants";
import type { ClinicSettings, StaffPermission } from "../../shared/types";
import { AppointmentsList } from "../appointment/AppointmentsList";
import {
  AuditLogsPage,
  ImagePreview,
  PaymentsPage,
  ProfilePage,
  ReportsPage,
  ServicesPage,
} from "../shared/SharedModules";

export function DoctorDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user } = useStore();
  const tabs = DASHBOARD_TABS.doctor;
  const [tab, setTab] = useState<string>(tabs[0].id);

  if (!user) return null;

  return (
    <DashboardLayout user={user} tabs={tabs} activeTab={tab} onTabChange={setTab} navigate={navigate}>
      {tab === "clinical" && <DoctorClinicalRecords />}
      {tab === "appointments" && <AppointmentsList role="doctor" />}
      {tab === "schedule" && <DoctorScheduleRules />}
      {tab === "payments" && <PaymentsPage role="doctor" />}
      {tab === "services" && <ServicesPage role="doctor" />}
      {tab === "staff" && <StaffAccountsPage />}
      {tab === "reports" && <ReportsPage />}
      {tab === "audit" && <AuditLogsPage />}
      {tab === "profile" && <ProfilePage />}
    </DashboardLayout>
  );
}

/* ─────────── CLINICAL RECORDS ─────────── */

function DoctorClinicalRecords() {
  const { appointments, user } = useStore();
  const editable = appointments.filter((a) => a.status !== "cancelled");
  const [selectedId, setSelectedId] = useState(editable[0]?.id ?? "");
  const selected = editable.find((a) => a.id === selectedId) || editable[0];
  const patientHistory = useMemo(
    () => appointments.filter((a) => a.patientId === selected?.patientId && a.id !== selected?.id).slice(0, 4),
    [appointments, selected],
  );
  const [form, setForm] = useState({ diagnosis: "", treatmentPlan: "", dentalHistory: "", notes: "", beforeImageUrl: "", afterImageUrl: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!editable.find((a) => a.id === selectedId) && editable[0]) setSelectedId(editable[0].id);
  }, [editable, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      diagnosis: selected.diagnosis || "",
      treatmentPlan: selected.treatmentPlan || "",
      dentalHistory: selected.dentalHistory || "",
      notes: selected.notes || "",
      beforeImageUrl: selected.beforeImageUrl || "",
      afterImageUrl: selected.afterImageUrl || "",
    });
    setSaved(false);
  }, [selected?.id, selected?.updatedAt]);

  if (!selected) {
    return <Card><p className="text-sm text-gold-100/60">No appointment records are available to document yet.</p></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Clinical management</div>
              <h3 className="font-serif text-2xl text-gold-gradient mt-1">Select Patient Visit</h3>
            </div>
            <Badge tone="neutral">Doctor only</Badge>
          </div>
          <Label>Appointment</Label>
          <Select value={selected.id} onChange={(e) => setSelectedId(e.target.value)}>
            {editable.map((a) => (
              <option key={a.id} value={a.id}>{a.patientName} · {a.serviceName} · {a.date} {a.time}</option>
            ))}
          </Select>

          <div className="mt-5 space-y-3 rounded-xl border border-gold-500/15 bg-ink-900/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gold-100">{selected.patientName}</div>
                <div className="text-xs text-gold-100/50">{selected.serviceName}</div>
              </div>
              <Badge tone={selected.status as "pending" | "confirmed" | "completed" | "cancelled"}>{selected.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-gold-100/65">
              <div><span className="text-gold-300/60">Date:</span> {selected.date}</div>
              <div><span className="text-gold-300/60">Time:</span> {selected.time}</div>
              <div><span className="text-gold-300/60">Doctor:</span> {selected.doctor}</div>
              <div><span className="text-gold-300/60">Payment:</span> {selected.paymentMethod}</div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-gold-500/15 bg-gold-500/5 p-4">
            <div className="text-sm font-medium text-gold-100 mb-2">Patient History Snapshot</div>
            <div className="space-y-2">
              {patientHistory.length === 0 && <p className="text-sm text-gold-100/50">No additional history found for this patient yet.</p>}
              {patientHistory.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-gold-500/10 bg-ink-950/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-gold-100">{entry.serviceName}</div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-gold-300/45">{entry.date}</div>
                  </div>
                  <p className="mt-1 text-xs text-gold-100/55">{entry.diagnosis || entry.notes || "No clinical note recorded yet."}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Clinical workspace</div>
              <h3 className="font-serif text-2xl text-gold-gradient mt-1">Diagnosis, Treatment Plan & Images</h3>
            </div>
            {saved && <Badge tone="paid">Saved</Badge>}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Diagnosis</Label><Textarea rows={4} value={form.diagnosis} onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} /></div>
            <div><Label>Treatment Plan / Procedure</Label><Textarea rows={4} value={form.treatmentPlan} onChange={(e) => setForm((p) => ({ ...p, treatmentPlan: e.target.value }))} /></div>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div><Label>Dental History</Label><Textarea rows={4} value={form.dentalHistory} onChange={(e) => setForm((p) => ({ ...p, dentalHistory: e.target.value }))} /></div>
            <div><Label>Doctor Notes</Label><Textarea rows={4} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></div>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div><Label>Before Treatment Image URL</Label><Input value={form.beforeImageUrl} onChange={(e) => setForm((p) => ({ ...p, beforeImageUrl: e.target.value }))} placeholder="https://..." /></div>
            <div><Label>After Treatment Image URL</Label><Input value={form.afterImageUrl} onChange={(e) => setForm((p) => ({ ...p, afterImageUrl: e.target.value }))} placeholder="https://..." /></div>
          </div>

          <div className="mt-5 grid md:grid-cols-2 gap-4">
            <ImagePreview title="Before" src={form.beforeImageUrl} />
            <ImagePreview title="After" src={form.afterImageUrl} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={() => { recordsService.saveTreatment(selected.id, form, user!.name); setSaved(true); }}>
              Save Clinical Record
            </Button>
            <div className="text-xs text-gold-100/50">All doctor actions are logged in the audit trail.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─────────── SCHEDULE & RULES ─────────── */

function DoctorScheduleRules() {
  const { settings, user, appointments } = useStore();
  const [form, setForm] = useState<ClinicSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [blockedDate, setBlockedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [blockedTime, setBlockedTime] = useState<string>(BOOKING.TIME_SLOTS[0]);
  const [blockedReason, setBlockedReason] = useState("Doctor unavailable");
  const [blockedSlots, setBlockedSlots] = useState(() => calendarService.listBlockedSlots());

  useEffect(() => { setForm(settings); }, [settings]);

  const todayQueue = appointments.filter(
    (a) => a.date === new Date().toISOString().slice(0, 10) && a.status !== "cancelled",
  ).length;

  return (
    <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
      <Card>
        <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Appointment authority</div>
        <h3 className="mt-2 font-serif text-2xl text-gold-gradient">Clinic Working Hours & Booking Rules</h3>
        <p className="mt-3 text-sm text-gold-100/60 leading-relaxed">
          Control schedule availability, emergency priority behavior, payment instructions, and the daily booking load.
        </p>

        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div><Label>Start of Clinic Hours</Label><Input type="time" value={form.workingHoursStart} onChange={(e) => setForm((p) => ({ ...p, workingHoursStart: e.target.value }))} /></div>
          <div><Label>End of Clinic Hours</Label><Input type="time" value={form.workingHoursEnd} onChange={(e) => setForm((p) => ({ ...p, workingHoursEnd: e.target.value }))} /></div>
          <div><Label>Booking Interval (minutes)</Label><Input type="number" value={form.bookingInterval} onChange={(e) => setForm((p) => ({ ...p, bookingInterval: Number(e.target.value) || 30 }))} /></div>
          <div><Label>Max Appointments Per Day</Label><Input type="number" value={form.maxAppointmentsPerDay} onChange={(e) => setForm((p) => ({ ...p, maxAppointmentsPerDay: Number(e.target.value) || 1 }))} /></div>
        </div>

        <div className="mt-4"><Label>Clinic GCash Number</Label><Input value={form.gcashNumber} onChange={(e) => setForm((p) => ({ ...p, gcashNumber: e.target.value }))} /></div>
        <div className="mt-4"><Label>Booking & Payment Rules</Label><Textarea rows={5} value={form.bookingRules} onChange={(e) => setForm((p) => ({ ...p, bookingRules: e.target.value }))} /></div>

        <label className="mt-5 flex items-center gap-3 rounded-xl border border-gold-500/15 bg-ink-900/50 p-4 cursor-pointer">
          <input type="checkbox" checked={form.allowEmergencyPriority} onChange={(e) => setForm((p) => ({ ...p, allowEmergencyPriority: e.target.checked }))} className="h-4 w-4 accent-[#d4af37]" />
          <div>
            <div className="text-sm font-medium text-gold-100">Allow emergency / priority overrides</div>
            <div className="text-xs text-gold-100/50">Doctor can insert urgent appointments ahead of regular queue slots.</div>
          </div>
        </label>

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <Button onClick={() => { settingsService.updateClinic(form, user!.name); setSaved(true); }}>Save Rules</Button>
          {saved && <span className="text-sm text-emerald-400">✓ Schedule rules updated successfully.</span>}
        </div>

        <div className="mt-8 border-t border-gold-500/20 pt-6">
          <h4 className="font-serif text-xl text-gold-gradient">Google Calendar Blocked Slots (Demo)</h4>
          <p className="mt-2 text-sm text-gold-100/55">
            Block a date/time so patients cannot book it. This simulates Google Calendar busy events.
          </p>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={blockedDate} onChange={(e) => setBlockedDate(e.target.value)} />
            </div>
            <div>
              <Label>Time</Label>
              <Select value={blockedTime} onChange={(e) => setBlockedTime(e.target.value)}>
                {BOOKING.TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Input value={blockedReason} onChange={(e) => setBlockedReason(e.target.value)} placeholder="Reason" />
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => {
                if (!blockedDate || !blockedTime) return;
                calendarService.blockSlot(blockedDate, blockedTime, blockedReason || "Doctor unavailable");
                setBlockedSlots(calendarService.listBlockedSlots());
              }}
            >
              Block Schedule Slot
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <h3 className="font-serif text-2xl text-gold-gradient">Live Schedule Summary</h3>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <StatCard label="Clinic Hours" value={`${form.workingHoursStart}–${form.workingHoursEnd}`} icon="🕒" />
            <StatCard label="Queue Today" value={todayQueue} icon="📅" />
            <StatCard label="Interval" value={`${form.bookingInterval} min`} icon="⏱" />
            <StatCard label="Daily Capacity" value={form.maxAppointmentsPerDay} icon="🪑" />
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-2xl text-gold-gradient">Authority Rules Applied</h3>
          <ul className="mt-4 space-y-3 text-sm text-gold-100/65">
            <li className="flex gap-3"><span className="text-gold-300">✦</span><span>Doctor can override schedule rules for emergency appointments when enabled.</span></li>
            <li className="flex gap-3"><span className="text-gold-300">✦</span><span>Price changes remain separate from locked prices on existing confirmed bookings.</span></li>
            <li className="flex gap-3"><span className="text-gold-300">✦</span><span>Staff follow working rules but cannot modify configuration or financial policies.</span></li>
          </ul>
        </Card>

        <Card>
          <h3 className="font-serif text-2xl text-gold-gradient">Blocked Schedule Slots</h3>
          <div className="mt-4 space-y-3">
            {blockedSlots.map((slot) => (
              <div key={`${slot.date}-${slot.time}`} className="rounded-xl border border-gold-500/15 bg-ink-900/50 p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-gold-100 font-medium">{slot.date} · {slot.time}</div>
                  <div className="text-xs text-gold-100/55">{slot.reason || "Doctor unavailable"}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    calendarService.unblockSlot(slot.date, slot.time);
                    setBlockedSlots(calendarService.listBlockedSlots());
                  }}
                >
                  Unblock
                </Button>
              </div>
            ))}
            {blockedSlots.length === 0 && (
              <p className="text-sm text-gold-100/55">No blocked slots configured.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─────────── STAFF ACCOUNTS ─────────── */

function StaffAccountsPage() {
  const { users, staffPermissions, user } = useStore();
  const staffUsers = users.filter((u) => u.role === "staff");
  const [newStaff, setNewStaff] = useState({ name: "", email: "", phone: "" });
  const [created, setCreated] = useState(false);

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
              return (
                <div key={staff.id} className="rounded-2xl border border-gold-500/15 bg-ink-900/55 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-medium text-gold-100">{staff.name}</div>
                      <div className="text-sm text-gold-100/50">{staff.email} · {staff.phone}</div>
                    </div>
                    <Badge tone="confirmed">Active staff</Badge>
                  </div>
                  <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    <PermissionToggle label="Appointments" enabled={permissions.appointments} onToggle={() => settingsService.updateStaffPermission(staff.id, { appointments: !permissions.appointments }, user!.name)} />
                    <PermissionToggle label="Payments" enabled={permissions.payments} onToggle={() => settingsService.updateStaffPermission(staff.id, { payments: !permissions.payments }, user!.name)} />
                    <PermissionToggle label="Records" enabled={permissions.records} onToggle={() => settingsService.updateStaffPermission(staff.id, { records: !permissions.records }, user!.name)} />
                    <PermissionToggle label="Admin Support" enabled={permissions.adminSupport} onToggle={() => settingsService.updateStaffPermission(staff.id, { adminSupport: !permissions.adminSupport }, user!.name)} />
                  </div>
                </div>
              );
            })}
            {staffUsers.length === 0 && <p className="text-sm text-gold-100/50">No staff accounts created yet.</p>}
          </div>
        </Card>

        <Card>
          <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Add team member</div>
          <h3 className="mt-2 font-serif text-2xl text-gold-gradient">Create Staff Account</h3>

          <div className="mt-5 space-y-4">
            <div><Label>Full Name</Label><Input value={newStaff.name} onChange={(e) => setNewStaff((p) => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" value={newStaff.email} onChange={(e) => setNewStaff((p) => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={newStaff.phone} onChange={(e) => setNewStaff((p) => ({ ...p, phone: e.target.value }))} /></div>
          </div>

          <Button
            className="mt-5"
            onClick={() => {
              if (!newStaff.name || !newStaff.email) return;
              settingsService.addStaff(newStaff.name, newStaff.email, newStaff.phone, user!.name);
              setNewStaff({ name: "", email: "", phone: "" });
              setCreated(true);
            }}
          >
            Add Staff Member
          </Button>
          {created && <p className="mt-3 text-sm text-emerald-400">✓ Staff account added and permission defaults assigned.</p>}
        </Card>
      </div>
    </div>
  );
}

function PermissionToggle({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`rounded-xl border px-4 py-3 text-left transition ${enabled ? "border-gold-500/40 bg-gold-500/12 text-gold-100" : "border-gold-500/12 text-gold-100/55 hover:border-gold-500/25"}`}>
      <div className="text-[11px] uppercase tracking-[0.2em]">{label}</div>
      <div className="mt-1 text-sm font-medium">{enabled ? "Enabled" : "Disabled"}</div>
    </button>
  );
}
