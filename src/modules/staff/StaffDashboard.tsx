/**
 * Staff (Assistant / Admin Support) dashboard.
 * Daily queue, appointments, payment verification, records support, profile.
 */

import { useEffect, useState } from "react";
import { Badge, Button, Card, Label, Select, Textarea } from "../../components/ui";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS } from "../../shared/constants";
import type { AppointmentStatus } from "../../shared/types";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { PaymentsPage, ProfilePage } from "../shared/SharedModules";

export function StaffDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user } = useStore();
  const tabs = DASHBOARD_TABS.staff;
  const [tab, setTab] = useState<string>(tabs[0].id);

  if (!user) return null;

  return (
    <DashboardLayout user={user} tabs={tabs} activeTab={tab} onTabChange={setTab} navigate={navigate}>
      {tab === "queue" && <StaffQueue />}
      {tab === "appointments" && <AppointmentsList role="staff" />}
      {tab === "payments" && <PaymentsPage role="staff" />}
      {tab === "records" && <StaffRecordsSupport />}
      {tab === "profile" && <ProfilePage />}
    </DashboardLayout>
  );
}

/* ─────────── DAILY QUEUE ─────────── */

function StaffQueue() {
  const { appointments, user } = useStore();
  const today = new Date().toISOString().slice(0, 10);

  // Show today + upcoming (not cancelled), sorted by date+time
  const queue = appointments
    .filter((a) => a.date >= today && a.status !== "cancelled")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const todayCount = queue.filter((a) => a.date === today).length;

  const columns: { key: AppointmentStatus; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Appointment handling</div>
            <h3 className="font-serif text-2xl text-gold-gradient mt-1">Today's Clinic Queue</h3>
          </div>
          <Badge tone="neutral">{todayCount} today · {queue.length} upcoming</Badge>
        </div>
      </Card>

      <div className="grid xl:grid-cols-3 gap-4">
        {columns.map((column) => {
          const list = queue.filter((a) => a.status === column.key);
          return (
            <Card key={column.key}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h4 className="font-serif text-xl text-gold-100">{column.label}</h4>
                <Badge tone={column.key as "pending" | "confirmed" | "completed"}>{list.length}</Badge>
              </div>
              <div className="space-y-3">
                {list.length === 0 && <p className="text-sm text-gold-100/45">No patients in this stage.</p>}
                {list.map((a) => (
                  <div key={a.id} className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-gold-100">{a.patientName}</div>
                        <div className="text-xs text-gold-100/50">{a.serviceName} · {a.date === today ? "Today" : a.date} · {a.time}</div>
                      </div>
                      {a.emergency ? <Badge tone="emergency">Emergency</Badge> : <Badge tone="neutral">Regular</Badge>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {a.status === "pending" && <Button size="sm" onClick={() => { void appointmentsService.update(a.id, { status: "confirmed" }, user!.name); }}>Confirm</Button>}
                      {a.status === "confirmed" && <Button size="sm" variant="subtle" onClick={() => { void appointmentsService.update(a.id, { status: "completed" }, user!.name); }}>Complete</Button>}
                      {a.status === "completed" && a.paymentStatus !== "paid" && (
                        <div className="w-full space-y-2">
                          <p className="text-xs text-gold-100/60">Select payment method:</p>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => { void appointmentsService.update(a.id, { paymentMethod: "cash", paymentStatus: "paid" }, user!.name); }}>
                              Cash
                            </Button>
                            <Button size="sm" variant="subtle" onClick={() => { void appointmentsService.update(a.id, { paymentMethod: "gcash", paymentStatus: "pending_verification" }, user!.name); }}>
                              GCash
                            </Button>
                          </div>
                        </div>
                      )}
                      {a.status === "completed" && a.paymentStatus === "paid" && (
                        <span className="text-xs text-emerald-400">✓ Paid via {a.paymentMethod}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── RECORDS SUPPORT ─────────── */

function StaffRecordsSupport() {
  const { appointments, user } = useStore();
  const sorted = [...appointments].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const [selectedId, setSelectedId] = useState(sorted[0]?.id ?? "");
  const selected = sorted.find((a) => a.id === selectedId) || sorted[0];
  const [supportNote, setSupportNote] = useState(selected?.supportNote || "");
  const [status, setStatus] = useState<AppointmentStatus>(selected?.status || "pending");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setSupportNote(selected.supportNote || "");
    setStatus(selected.status);
    setSaved(false);
  }, [selected?.id, selected?.updatedAt]);

  if (!selected) return <Card><p className="text-sm text-gold-100/60">No appointment records available for staff support.</p></Card>;

  return (
    <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
      <Card>
        <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Records & support</div>
        <h3 className="mt-2 font-serif text-2xl text-gold-gradient">Assist Patient Records</h3>

        <div className="mt-5">
          <Label>Appointment</Label>
          <Select value={selected.id} onChange={(e) => setSelectedId(e.target.value)}>
            {sorted.map((a) => (
              <option key={a.id} value={a.id}>{a.patientName} · {a.serviceName} · {a.date} {a.time}</option>
            ))}
          </Select>
        </div>

        <div className="mt-5 rounded-xl border border-gold-500/15 bg-ink-900/55 p-4 space-y-2 text-sm text-gold-100/65">
          <div><span className="text-gold-300/60">Patient:</span> {selected.patientName}</div>
          <div><span className="text-gold-300/60">Service:</span> {selected.serviceName}</div>
          <div><span className="text-gold-300/60">Doctor:</span> {selected.doctor}</div>
          <div><span className="text-gold-300/60">Diagnosis:</span> {selected.diagnosis || "Awaiting doctor update"}</div>
          <div><span className="text-gold-300/60">Doctor Notes:</span> {selected.notes || "No doctor note yet"}</div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Administrative support</div>
            <h3 className="font-serif text-2xl text-gold-gradient mt-1">Support Notes & Status Updates</h3>
          </div>
          {saved && <Badge tone="paid">Saved</Badge>}
        </div>

        <div>
          <Label>Appointment Status</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        <div className="mt-4">
          <Label>Staff Support Note</Label>
          <Textarea
            rows={8}
            value={supportNote}
            onChange={(e) => setSupportNote(e.target.value)}
            placeholder="Example: Patient arrived early, chart prepared, GCash ref checked, doctor informed..."
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => { appointmentsService.update(selected.id, { supportNote, status }, user!.name); setSaved(true); }}>Save Support Update</Button>
          <Button variant="subtle" onClick={() => appointmentsService.update(selected.id, { status: "confirmed" }, user!.name)}>Mark Confirmed</Button>
          <Button variant="ghost" onClick={() => appointmentsService.update(selected.id, { status: "completed" }, user!.name)}>Mark Completed</Button>
        </div>
      </Card>
    </div>
  );
}
