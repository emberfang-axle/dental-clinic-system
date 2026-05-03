/**
 * Dashboard modules used by more than one role:
 *   • PaymentsPage   — Doctor + Staff
 *   • ServicesPage   — Doctor (edit) + Staff (read-only)
 *   • ProfilePage    — All roles
 *   • ReportsPage    — Doctor only
 *   • AuditLogsPage  — Doctor only
 *   • NotificationsCenter — Patient (and reusable elsewhere)
 *   • ImagePreview   — small utility
 */

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Input, Label, Select, StatCard, Textarea } from "../../components/ui";
import { authService } from "../../services/auth";
import { catalogService } from "../../services/catalog";
import { notificationsService } from "../../services/notifications";
import { paymentsService } from "../../services/payments";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import { formatDateTime, initials, roleLabel } from "../../shared/helpers";
import { downloadInvoice } from "../../utils/invoice";
import type { Role, Appointment, Service, FeedbackEntry, AuditLog, NotificationEntry } from "../../shared/types";

// Helper type for appointment status filtering
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

/* ─────────── PAYMENTS PAGE — Doctor + Staff ─────────── */

export function PaymentsPage({ role }: { role: Role }) {
  const { appointments, user } = useStore() as {
    appointments: Appointment[];
    user: { id: string; name: string; role: Role } | null;
  };
  
  if (!user) return null;

  const pending = appointments.filter((a) => a.paymentStatus === "pending_verification");
  const verified = appointments.filter((a) => a.paymentStatus === "verified");
  const paid = appointments.filter((a) => a.paymentStatus === "paid");
  const cashToCollect = appointments.filter(
    (a) => a.paymentMethod === "cash" && a.status === "completed" && a.paymentStatus !== "paid",
  );

  const handleVerify = useCallback((appointmentId: string) => {
    paymentsService.verify(appointmentId, user.name);
  }, [user.name]);

  const handleMarkUnpaid = useCallback((appointmentId: string) => {
    appointmentsService.update(appointmentId, { paymentStatus: "unpaid" }, user.name);
  }, [user.name]);

  const handleMarkPaid = useCallback((appointmentId: string) => {
    appointmentsService.update(appointmentId, { paymentStatus: "paid" }, user.name);
  }, [user.name]);

  return (
    <div className="space-y-6">
      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-serif text-xl text-gold-gradient">Pending GCash Verification</h3>
            <Badge tone="pending">{pending.length}</Badge>
          </div>
          {pending.length === 0 ? (
            <p className="text-gold-100/50 text-sm">No pending payments.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((a) => (
                <div key={a.id} className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-gold-100">{a.patientName}</div>
                      <div className="text-sm text-gold-100/60">{a.serviceName} · {a.date} {a.time}</div>
                      <div className="text-xs text-gold-300/80 mt-1">Reference: <span className="font-mono">{a.gcashRef || "—"}</span></div>
                      <div className="text-xs text-gold-100/45 mt-1">
                        Screenshot: {a.paymentScreenshotUrl ? (
                          <a href={a.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="underline text-gold-300">View proof</a>
                        ) : "Not provided"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-gold-gradient text-xl">₱{a.price.toLocaleString()}</div>
                      <div className="mt-2 flex gap-2 justify-end flex-wrap">
                        <Button size="sm" onClick={() => handleVerify(a.id)}>Verify</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleMarkUnpaid(a.id)}>Mark Unpaid</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-serif text-xl text-gold-gradient">Verified / Ready to Post</h3>
            <Badge tone="confirmed">{verified.length + cashToCollect.length}</Badge>
          </div>
          <div className="space-y-3">
            {[...verified, ...cashToCollect].map((a) => (
              <div key={a.id} className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-gold-100">{a.patientName}</div>
                  <div className="text-sm text-gold-100/55">{a.serviceName} · {a.paymentMethod.toUpperCase()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-gold-300">₱{a.price.toLocaleString()}</div>
                  <Button size="sm" onClick={() => handleMarkPaid(a.id)}>Mark Paid</Button>
                </div>
              </div>
            ))}
            {verified.length + cashToCollect.length === 0 && (
              <p className="text-sm text-gold-100/50">Nothing is waiting to be posted as paid.</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-serif text-xl text-gold-gradient">Paid Transactions</h3>
          <span className="text-xs uppercase tracking-[0.24em] text-gold-300/45">{roleLabel(role)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="text-left text-xs uppercase tracking-wider text-gold-200/70">
              <tr>
                <th className="py-2">Patient</th>
                <th>Service</th>
                <th>Method</th>
                <th>Receipt</th>
                <th>Reference</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paid.map((a) => (
                <tr key={a.id} className="border-t border-gold-500/10">
                  <td className="py-3 text-gold-100">{a.patientName}</td>
                  <td className="text-gold-100/70">{a.serviceName}</td>
                  <td className="capitalize text-gold-100/70">{a.paymentMethod}</td>
                  <td className="text-xs text-gold-300">{a.receiptNumber || "—"}</td>
                  <td className="font-mono text-xs text-gold-100/55">{a.gcashRef || "—"}</td>
                  <td className="text-right font-mono text-gold-300">₱{a.price.toLocaleString()}</td>
                  <td className="text-right">
                    <button
                      onClick={() => downloadInvoice(a)}
                      disabled={a.status !== "completed" || a.paymentStatus !== "paid"}
                      className="text-xs text-gold-400 hover:text-gold-100 underline transition whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────── SERVICES PAGE — Doctor (edit) + Staff (read-only) ─────────── */

export function ServicesPage({ role }: { role: Role }) {
  const { services, user } = useStore() as {
    services: Service[];
    user: { id: string; name: string; role: Role } | null;
  };
  
  const canEdit = role === "doctor";

  const handlePriceChange = useCallback((serviceId: string, newPrice: number) => {
    if (canEdit && user) {
      catalogService.setPrice(serviceId, newPrice);
    }
  }, [canEdit, user]);

  return (
    <div className="space-y-4">
      {!canEdit && (
        <p className="text-sm text-gold-100/60">
          Only the clinic doctor can edit pricing. Staff have read-only access.
        </p>
      )}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((s) => (
          <Card key={s.id}>
            <h4 className="font-serif text-gold-gradient text-xl">{s.name}</h4>
            <p className="text-sm text-gold-100/60 mt-2 leading-relaxed">{s.description}</p>
            <div className="text-xs text-gold-100/50 mt-2">⏱ {s.duration} min</div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gold-100/50">₱</span>
              <Input
                type="number"
                defaultValue={s.price}
                disabled={!canEdit}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (n > 0 && n !== s.price) {
                    handlePriceChange(s.id, n);
                  }
                }}
                className="font-mono"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─────────── PROFILE PAGE ─────────── */

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
}

export function ProfilePage() {
  const { user } = useStore() as {
    user: { id: string; name: string; email: string; phone: string; role: Role } | null;
  };
  
  const [form, setForm] = useState<ProfileForm>({ name: "", email: "", phone: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, phone: user.phone });
    }
  }, [user]);

  if (!user) return null;

  const handleSave = useCallback(() => {
    authService.updateProfile(user.id, form, user.name);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [user.id, user.name, form]);

  return (
    <Card className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center text-ink-950 font-bold text-2xl shadow-gold">
          {initials(user.name)}
        </div>
        <div>
          <div className="text-2xl font-serif text-gold-gradient">{user.name}</div>
          <div className="text-sm text-gold-300/70">{roleLabel(user.role)}</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Full Name</Label>
          <Input 
            value={form.name} 
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} 
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input 
            value={form.email} 
            type="email" 
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} 
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Phone</Label>
          <Input 
            value={form.phone} 
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} 
          />
        </div>
      </div>

      <Button className="mt-5" onClick={handleSave}>
        Save Changes
      </Button>
      {saved && <p className="mt-3 text-emerald-400 text-sm">✓ Profile updated.</p>}
    </Card>
  );
}

/* ─────────── REPORTS PAGE — Doctor only ─────────── */

export function ReportsPage() {
  const { appointments, services, feedbacks, users } = useStore() as {
    appointments: Appointment[];
    services: Service[];
    feedbacks: FeedbackEntry[];
    users: any[];
  };

  const paid = appointments.filter((a) => a.paymentStatus === "paid");
  const completed = appointments.filter((a) => a.status === "completed");
  const pending = appointments.filter((a) => a.status === "pending");
  const cancelled = appointments.filter((a) => a.status === "cancelled");
  const revenue = paid.reduce((sum, a) => sum + a.price, 0);
  const pendingRevenue = appointments
    .filter((a) => a.status !== "cancelled" && a.paymentStatus !== "paid")
    .reduce((sum, a) => sum + a.price, 0);

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.stars, 0) / feedbacks.length).toFixed(1)
    : "—";

  const completionRate = appointments.length
    ? Math.round((completed.length / appointments.length) * 100)
    : 0;

  // Revenue by service
  const byService = services
    .map((s) => ({
      name: s.name,
      count: appointments.filter((a) => a.serviceId === s.id).length,
      revenue: paid.filter((a) => a.serviceId === s.id).reduce((sum, a) => sum + a.price, 0),
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxCount = Math.max(1, ...byService.map((b) => b.count));

  // Monthly revenue (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleString("default", { month: "short" });
    const rev = paid
      .filter((a) => a.date.startsWith(key))
      .reduce((sum, a) => sum + a.price, 0);
    return { label, rev };
  });
  const maxRev = Math.max(1, ...months.map((m) => m.rev));

  // Payment method split
  const gcashCount = paid.filter((a) => a.paymentMethod === "gcash").length;
  const cashCount = paid.filter((a) => a.paymentMethod === "cash").length;

  // Top patients
  const patientMap: Record<string, { name: string; count: number; spent: number }> = {};
  appointments.forEach((a) => {
    if (!patientMap[a.patientId]) patientMap[a.patientId] = { name: a.patientName, count: 0, spent: 0 };
    patientMap[a.patientId].count++;
    if (a.paymentStatus === "paid") patientMap[a.patientId].spent += a.price;
  });
  const topPatients = Object.values(patientMap).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Total Revenue" value={`₱${revenue.toLocaleString()}`} sub={`₱${pendingRevenue.toLocaleString()} pending`} />
        <StatCard icon="📋" label="Total Appointments" value={appointments.length.toString()} sub={`${pending.length} pending confirmation`} />
        <StatCard icon="✅" label="Completion Rate" value={`${completionRate}%`} sub={`${completed.length} completed · ${cancelled.length} cancelled`} />
        <StatCard icon="⭐" label="Avg Rating" value={avgRating} sub={`${feedbacks.length} review${feedbacks.length !== 1 ? "s" : ""}`} />
      </div>

      {/* Monthly revenue chart */}
      <Card>
        <h3 className="font-serif text-xl text-gold-gradient mb-5">Monthly Revenue (Last 6 Months)</h3>
        <div className="flex items-end gap-3 h-32">
          {months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-gold-300/60 font-mono">
                {m.rev > 0 ? `₱${(m.rev / 1000).toFixed(0)}k` : ""}
              </span>
              <div className="w-full rounded-t-md bg-gold-gradient/80 transition-all" style={{ height: `${(m.rev / maxRev) * 96}px`, minHeight: m.rev > 0 ? "4px" : "0" }} />
              <span className="text-[10px] text-gold-100/50">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Bookings by service */}
        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-4">Bookings by Service</h3>
          {byService.length === 0 && <p className="text-sm text-gold-100/50">No bookings yet.</p>}
          <div className="space-y-3">
            {byService.map((b) => (
              <div key={b.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gold-100/80 truncate max-w-[60%]">{b.name}</span>
                  <span className="text-gold-300 font-mono text-xs">{b.count} · ₱{b.revenue.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gold-gradient" style={{ width: `${(b.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment breakdown */}
        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-4">Payment Breakdown</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-4 rounded-xl border border-gold-500/20 text-center">
              <div className="text-xs uppercase tracking-wider text-gold-300/60 mb-1">GCash</div>
              <div className="text-2xl font-serif text-gold-gradient">{gcashCount}</div>
              <div className="text-xs text-gold-100/50 mt-1">transactions</div>
            </div>
            <div className="p-4 rounded-xl border border-gold-500/20 text-center">
              <div className="text-xs uppercase tracking-wider text-gold-300/60 mb-1">Cash</div>
              <div className="text-2xl font-serif text-gold-gradient">{cashCount}</div>
              <div className="text-xs text-gold-100/50 mt-1">transactions</div>
            </div>
          </div>
          <h4 className="text-sm font-medium text-gold-100/70 mb-3">Top Patients</h4>
          <div className="space-y-2">
            {topPatients.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <span className="text-gold-100/70"><span className="text-gold-400 font-mono mr-2">#{i + 1}</span>{p.name}</span>
                <span className="text-gold-300 font-mono text-xs">{p.count} visits · ₱{p.spent.toLocaleString()}</span>
              </div>
            ))}
            {topPatients.length === 0 && <p className="text-sm text-gold-100/50">No patient data yet.</p>}
          </div>
        </Card>
      </div>

      {/* Recent feedback */}
      <Card>
        <h3 className="font-serif text-xl text-gold-gradient mb-4">Recent Patient Feedback</h3>
        {feedbacks.length === 0 && <p className="text-sm text-gold-100/50">No feedback submitted yet.</p>}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...feedbacks].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6).map((f) => (
            <div key={f.id} className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-medium text-gold-100 text-sm truncate">{f.userName}</span>
                <span className="text-gold-400 text-sm shrink-0">{"★".repeat(f.stars)}<span className="text-gold-100/20">{"★".repeat(5 - f.stars)}</span></span>
              </div>
              <p className="text-xs text-gold-100/60 leading-relaxed line-clamp-3">{f.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ─────────── AUDIT LOGS — Doctor only ─────────── */

export function AuditLogsPage() {
  const { logs } = useStore() as { logs: AuditLog[] };
  const [search, setSearch] = useState("");

  const filtered = logs.filter((l) =>
    !search || `${l.actor}${l.action}${l.target}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="!p-4 text-center">
          <div className="text-2xl font-serif text-gold-gradient">{logs.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-gold-100/50 mt-1">Total Events</div>
        </Card>
        <Card className="!p-4 text-center">
          <div className="text-2xl font-serif text-gold-gradient">
            {new Set(logs.map((l) => l.actor)).size}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-gold-100/50 mt-1">Unique Actors</div>
        </Card>
        <Card className="!p-4 text-center">
          <div className="text-2xl font-serif text-gold-gradient">
            {logs.filter((l) => l.at.startsWith(new Date().toISOString().slice(0, 10))).length}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-gold-100/50 mt-1">Today</div>
        </Card>
      </div>

      <Card className="!p-4">
        <Input
          placeholder="Search by actor, action, or target…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card><p className="text-sm text-gold-100/50 text-center py-4">No audit logs found.</p></Card>
        )}
        {filtered.map((l) => (
          <div key={l.id} className="glass rounded-xl px-4 py-3 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gold-100">{l.actor}</span>
                <span className="text-xs text-gold-300/60">→</span>
                <span className="text-sm text-gold-100/80">{l.action}</span>
              </div>
              <div className="text-xs text-gold-100/45 mt-0.5 truncate">{l.target}</div>
            </div>
            <div className="text-[10px] text-gold-100/40 shrink-0 mt-0.5">{formatDateTime(l.at)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
/* ─────────── NOTIFICATIONS CENTER — Patient (reusable) ─────────── */

export function NotificationsCenter() {
  const { notifications, announcements, user } = useStore() as {
    notifications: NotificationEntry[];
    announcements: any[];
    user: { id: string; name: string; role: Role } | null;
  };

  if (!user) return null;

  const mine = notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.at.localeCompare(a.at));

  const handleMarkRead = useCallback((notificationId: string) => {
    notificationsService.markRead(notificationId);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    notificationsService.markAllRead(user.id);
  }, [user.id]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Notifications</div>
            <h3 className="font-serif text-2xl text-gold-gradient mt-1">Reminders, Payment Updates & Schedule Alerts</h3>
          </div>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark All as Read
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {mine.map((n) => (
          <Card key={n.id} className={n.read ? "opacity-80" : "border-gold-500/30"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-gold-100">{n.title}</h4>
                  <Badge 
                    tone={
                      n.kind === "payment" 
                        ? "confirmed" 
                        : n.kind === "appointment" 
                        ? "pending" 
                        : "neutral"
                    }
                  >
                    {n.kind}
                  </Badge>
                  {!n.read && <Badge tone="paid">Unread</Badge>}
                </div>
                <p className="mt-2 text-sm text-gold-100/65 leading-relaxed">{n.message}</p>
                <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-gold-300/45">
                  {formatDateTime(n.at)}
                </div>
              </div>
              {!n.read && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleMarkRead(n.id)}
                >
                  Mark Read
                </Button>
              )}
            </div>
          </Card>
        ))}
        {mine.length === 0 && (
          <Card>
            <p className="text-sm text-gold-100/60">You have no notifications yet.</p>
          </Card>
        )}
      </div>

      {announcements.length > 0 && (
        <div>
          <h3 className="font-serif text-xl text-gold-gradient mb-3">Clinic Announcements</h3>
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <div key={a.id} className={`glass rounded-xl p-5 border ${a.pinned ? "border-gold-400/40" : "border-gold-500/15"}`}>
                {a.pinned && <span className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold">📌 Pinned · </span>}
                <span className="font-semibold text-gold-100">{a.title}</span>
                <p className="text-sm text-gold-100/65 mt-2 leading-relaxed">{a.body}</p>
                <p className="text-[10px] text-gold-100/40 mt-2">{a.author} · {new Date(a.at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── IMAGE PREVIEW UTILITY ─────────── */

export function ImagePreview({ title, src }: { title: string; src?: string }) {
  return (
    <div className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-gold-300/55 mb-3">{title}</div>
      {src ? (
        <img 
          src={src} 
          alt={title} 
          className="w-full h-48 object-cover rounded-xl border border-gold-500/10" 
        />
      ) : (
        <div className="h-48 rounded-xl border border-dashed border-gold-500/20 bg-ink-950/50 flex items-center justify-center text-sm text-gold-100/40">
          No image added yet
        </div>
      )}
    </div>
  );
}

/* ─────────── RECORD BLOCK UTILITY ─────────── */

export function RecordBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-gold-300/55">{title}</div>
      <p className="mt-2 text-sm text-gold-100/70 leading-relaxed">{value}</p>
    </div>
  );
}

/* Re-export Textarea/Select so role dashboards can grab everything from one place if desired */
export { Textarea, Select };