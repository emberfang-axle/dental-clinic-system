/**
 * Staff (Assistant / Admin Support) dashboard.
 */

import { useEffect, useState } from "react";
import { Badge, Button, Card, Label, Select, Textarea } from "../../components/ui";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { appointmentsService } from "../../services/appointments";
import { useStore, getSnapshot } from "../../store/store";
import { DASHBOARD_TABS } from "../../shared/constants";
import type { AppointmentStatus } from "../../shared/types";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { NotificationsCenter, PaymentsPage, ProfilePage } from "../shared/SharedModules";

export function StaffDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user, staffPermissions } = useStore();
  const [tab, setTab] = useState<string>("queue");

  if (!user) return null;

  const perms = staffPermissions.find((p) => p.staffId === user.id);
  const allTabs = DASHBOARD_TABS.staff;
  const tabs = allTabs.filter((t) => {
    if (t.id === "appointments" && perms && !perms.appointments) return false;
    if (t.id === "payments"     && perms && !perms.payments)     return false;
    if (t.id === "records"      && perms && !perms.records)      return false;
    return true;
  });
  const activeTab = tabs.find((t) => t.id === tab) ? tab : (tabs[0]?.id ?? "queue");

  return (
    <DashboardLayout user={user} tabs={tabs} activeTab={activeTab} onTabChange={setTab} navigate={navigate}>
      {activeTab === "queue"         && <StaffQueue />}
      {activeTab === "appointments"  && <AppointmentsList role="staff" />}
      {activeTab === "payments"      && <PaymentsPage role="staff" />}
      {activeTab === "records"       && <StaffRecordsSupport />}
      {activeTab === "notifications" && <NotificationsCenter />}
      {activeTab === "profile"       && <ProfilePage />}
    </DashboardLayout>
  );
}

/* ─────────── DAILY QUEUE ─────────── */

function StaffQueue() {
  const { appointments, user, settings } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const [error, setError] = useState<string | null>(null);
  const [deduping, setDeduping] = useState(false);
  const [dedupMsg, setDedupMsg] = useState<string | null>(null);

  const tryUpdate = async (id: string, partial: Partial<Parameters<typeof appointmentsService.update>[1]>) => {
    setError(null);
    try {
      await appointmentsService.update(id, partial as any, user!.name);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  };

  const removeDuplicates = async () => {
    setDeduping(true);
    setDedupMsg(null);
    setError(null);
    try {
      const { appointments: all } = getSnapshot();
      // Group by patientId + serviceId + date + time — keep newest createdAt
      const groups: Record<string, typeof all> = {};
      all.forEach((a) => {
        const key = `${a.patientId}__${a.serviceId}__${a.date}__${a.time}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(a);
      });
      const toDelete: string[] = [];
      Object.values(groups).forEach((group) => {
        if (group.length <= 1) return;
        const sorted = [...group].sort((a, b) =>
          (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
        );
        sorted.slice(1).forEach((a) => toDelete.push(a.id));
      });
      if (toDelete.length === 0) {
        setDedupMsg("No duplicates found.");
      } else {
        await Promise.all(toDelete.map((id) => appointmentsService.delete(id, user!.name)));
        setDedupMsg(`Removed ${toDelete.length} duplicate(s).`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to remove duplicates.");
    } finally {
      setDeduping(false);
    }
  };

  const queue = appointments
    .filter((a) => a.status !== "cancelled" && (a.date >= today || a.status === "confirmed" || a.status === "completed"))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const todayCount = queue.filter((a) => a.date === today).length;

  const columns: { key: AppointmentStatus; label: string }[] = [
    { key: "pending",   label: "Pending"   },
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
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm" variant="ghost" onClick={removeDuplicates} disabled={deduping}>
            {deduping ? "Removing…" : "🧹 Remove Duplicate Appointments"}
          </Button>
          {dedupMsg && <span className="text-xs text-emerald-400">{dedupMsg}</span>}
        </div>
        {error && <p className="mt-2 text-sm text-red-400">⚠ {error}</p>}
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
                        <div className="text-xs text-gold-300/60 font-mono mt-0.5">₱{a.price.toLocaleString()}</div>
                      </div>
                      {a.emergency ? <Badge tone="emergency">Emergency</Badge> : <Badge tone="neutral">Regular</Badge>}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {a.status === "pending" && (
                        <Button size="sm" onClick={() => { void tryUpdate(a.id, { status: "confirmed" }); }}>
                          Confirm
                        </Button>
                      )}

                      {a.status === "confirmed" && (
                        <Button size="sm" variant="subtle" onClick={() => { void tryUpdate(a.id, { status: "completed" }); }}>
                          Complete
                        </Button>
                      )}

      {/* Staff creates the bill after appointment is completed */}
                      {a.status === "completed" && a.paymentStatus === "unpaid" && (
                        <div className="w-full space-y-2">
                          <p className="text-xs text-gold-100/60">Create bill — select payment method:</p>
                          {settings.gcashNumber && (
                            <p className="text-xs text-gold-300/70">Clinic GCash: <span className="font-mono font-semibold">{settings.gcashNumber}</span></p>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" onClick={() => void tryUpdate(a.id, { paymentMethod: "cash", paymentStatus: "paid" })}>
                              💵 Cash — Mark Paid
                            </Button>
                            <Button size="sm" variant="subtle" onClick={() => void tryUpdate(a.id, { paymentMethod: "gcash", paymentStatus: "pending_verification" })}>
                              📱 GCash — Await Patient
                            </Button>
                          </div>
                          <DepositForm appointmentId={a.id} price={a.price} actor={user!.name} onDone={() => {}} />
                        </div>
                      )}

                      {a.status === "completed" && a.paymentStatus === "partial_paid" && (
                        <div className="w-full space-y-2">
                          <p className="text-xs text-yellow-400">💰 Deposit paid: ₱{(a.depositAmount ?? 0).toLocaleString()} — Balance: ₱{(a.price - (a.depositAmount ?? 0)).toLocaleString()}</p>
                          <Button size="sm" onClick={() => void tryUpdate(a.id, { paymentStatus: "paid" })}>Mark Balance Paid</Button>
                        </div>
                      )}

                      {a.status === "completed" && a.paymentStatus === "pending_verification" && (
                        <span className="text-xs text-yellow-400">⏳ Awaiting patient GCash reference</span>
                      )}

                      {a.status === "completed" && a.paymentStatus === "verified" && (
                        <span className="text-xs text-blue-300">✓ GCash verified — ready to post</span>
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

/* ─────────── DEPOSIT FORM ─────────── */

function DepositForm({ appointmentId, price, actor, onDone }: { appointmentId: string; price: number; actor: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-gold-300/70 underline hover:text-gold-300 transition">
      + Accept partial deposit
    </button>
  );

  return (
    <div className="mt-2 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 space-y-2">
      <p className="text-xs text-gold-100/60">Deposit amount (total: ₱{price.toLocaleString()})</p>
      <div className="flex gap-2 items-center">
        <input
          type="number" min={1} max={price - 1} placeholder="e.g. 500"
          value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-32 rounded-lg border border-gold-500/25 bg-ink-900/60 px-3 py-1.5 text-sm text-gold-100 focus:outline-none focus:border-gold-400"
        />
        <Button size="sm" disabled={saving || !amount} onClick={async () => {
          const dep = Number(amount);
          if (!dep || dep >= price) return;
          setSaving(true);
          await appointmentsService.update(appointmentId, {
            depositAmount: dep,
            depositPaidAt: new Date().toISOString(),
            paymentStatus: "partial_paid",
          }, actor);
          setSaving(false);
          setOpen(false);
          onDone();
        }}>
          {saving ? "Saving…" : "Record Deposit"}
        </Button>
        <button onClick={() => setOpen(false)} className="text-xs text-gold-100/40 hover:text-gold-100/70">Cancel</button>
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

  if (!selected) return <Card><p className="text-sm text-gold-100/60">No appointment records available.</p></Card>;

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
