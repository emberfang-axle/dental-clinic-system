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
  const { appointments, services, feedbacks } = useStore() as {
    appointments: Appointment[];
    services: Service[];
    feedbacks: FeedbackEntry[];
  };

  const revenue = appointments
    .filter((a) => a.paymentStatus === "paid")
    .reduce((sum, a) => sum + a.price, 0);

  const byService = services
    .map((s) => ({ 
      name: s.name, 
      count: appointments.filter((a) => a.serviceId === s.id).length 
    }))
    .sort((a, b) => b.count - a.count);

  const max = Math.max(1, ...byService.map((b) => b.count));
  
  const byStatus = (["pending", "confirmed", "completed", "cancelled"] as AppointmentStatus[]).map((st) => ({
    st,
    n: appointments.filter((a) => a.status === st).length,
  }));

  const averageRating = feedbacks.length
    ? (feedbacks.reduce((sum, f) => sum + f.stars, 0) / feedbacks.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Total Revenue" value={`₱${revenue.toLocaleString()}`} />
        <StatCard icon="📅" label="Total Appointments" value={appointments.length.toString()} />
        <StatCard 
          icon="✅" 
          label="Completed" 
          value={appointments.filter((a) => a.status === "completed").length.toString()} 
        />
        <StatCard icon="⭐" label="Average Rating" value={averageRating} />
      </div>

      <Card>
        <h3 className="font-serif text-xl text-gold-gradient mb-4">Bookings by Service</h3>
        <div className="space-y-3">
          {byService.map((b) => (
            <div key={b.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gold-100/80">{b.name}</span>
                <span className="text-gold-300 font-mono">{b.count}</span>
              </div>
              <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gold-gradient" 
                  style={{ width: `${(b.count / max) * 100}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid xl:grid-cols-[0.7fr_1.3fr] gap-6">
        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-4">Appointment Status</h3>
          <div className="grid grid-cols-2 gap-3">
            {byStatus.map((s) => (
              <div key={s.st} className="p-4 rounded-xl border border-gold-500/20 text-center">
                <Badge tone={s.st}>{s.st}</Badge>
                <div className="text-2xl font-serif text-gold-gradient mt-2">{s.n}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-4">Recent Patient Feedback</h3>
          <div className="space-y-3">
            {feedbacks.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-gold-100">{entry.userName}</div>
                  <div className="text-gold-400">{"★".repeat(entry.stars)}</div>
                </div>
                <p className="mt-2 text-sm text-gold-100/65">{entry.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─────────── AUDIT LOGS — Doctor only ─────────── */

export function AuditLogsPage() {
  const { logs } = useStore() as { logs: AuditLog[] };
  
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-ink-800/60 text-xs uppercase tracking-wider text-gold-200/70 text-left">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-gold-500/10">
                <td className="px-4 py-3 text-xs text-gold-100/60">{formatDateTime(l.at)}</td>
                <td className="px-4 py-3 text-gold-200">{l.actor}</td>
                <td className="px-4 py-3 text-gold-100">{l.action}</td>
                <td className="px-4 py-3 text-gold-100/70">{l.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
/* ─────────── NOTIFICATIONS CENTER — Patient (reusable) ─────────── */

export function NotificationsCenter() {
  const { notifications, user } = useStore() as {
    notifications: NotificationEntry[];
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