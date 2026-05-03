/**
 * Multi-step appointment booking flow (4 steps).
 * Available to authenticated patients.
 */

import { useState } from "react";
import { Logo } from "../../components/Logo";
import { Badge, Button, Input, Label } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { calendarService } from "../../services/calendar";
import { useStore } from "../../store/store";
import { BOOKING, ROUTES } from "../../shared/constants";
import { dashboardPathFor } from "../../shared/helpers";

const TIME_SLOTS = BOOKING.TIME_SLOTS;

export function BookAppointmentPage({ navigate }: { navigate: (p: string) => void }) {
  const { user, services, appointments } = useStore();
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(services[0].id);
  const [doctor] = useState("Dr. Estandarte");
  const [date, setDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [booking, setBooking] = useState(false);

  const service = services.find((s) => s.id === serviceId)!;

  if (!user) {
    return (
      <Centered navigate={navigate}>
        <div className="max-w-md w-full glass-strong rounded-2xl p-10 text-center shadow-luxe fade-up">
          <div className="w-16 h-16 mx-auto rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-300 text-2xl mb-5">🔒</div>
          <h2 className="font-serif text-3xl text-gold-shine font-light mb-2">Login Required</h2>
          <p className="text-gold-100/60 mb-6 text-sm leading-relaxed">Please sign in or create an account to book an appointment.</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate(ROUTES.login)}>Login</Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.register)}>Register</Button>
          </div>
        </div>
      </Centered>
    );
  }

  const takenTimes = appointments
    .filter((a) => a.date === date && a.status !== "cancelled")
    .map((a) => a.time);

  function next() { setStep((s) => Math.min(s + 1, 4)); }
  function back() { setStep((s) => Math.max(s - 1, 1)); }

  async function confirm() {
    if (booking) return;
    setBookingError("");
    if (!time) return;
    if (appointmentsService.isSlotTaken(date, time)) {
      setBookingError("This time slot was just taken. Please pick another.");
      return;
    }
    if (calendarService.isSlotBlocked(date, time)) {
      setBookingError("Selected slot is blocked by clinic calendar.");
      return;
    }
    setBooking(true);
    try {
      const ap = await appointmentsService.book({
        patientId: user!.id,
        patientName: user!.name,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        doctor, date, time,
        status: "pending",
        paymentMethod: "cash" as const,
        paymentStatus: "unpaid" as const,
        emergency,
      });
      setConfirmed(ap.id);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Failed to confirm booking.");
    } finally {
      setBooking(false);
    }
  }

  if (confirmed) {
    return (
      <Centered navigate={navigate}>
        <div className="max-w-lg w-full glass-strong rounded-2xl p-10 text-center shadow-luxe fade-up">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-700/10 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-4xl mb-6 pulse-gold">✓</div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold mb-3">Confirmed</p>
          <h2 className="font-serif text-4xl text-gold-shine font-light">
            Appointment <span className="font-script italic">Booked!</span>
          </h2>
          <p className="text-gold-100/70 mt-5 leading-relaxed">
            Your appointment for <span className="text-gold-300 font-medium">{service.name}</span> on{" "}
            <span className="text-gold-300 font-medium">{date}</span> at{" "}
            <span className="text-gold-300 font-medium">{time}</span> has been received.
          </p>
          <p className="text-sm text-gold-100/55 mt-3">
            {"Please arrive 10 minutes before your scheduled appointment."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => navigate(dashboardPathFor(user.role))}>Go to Dashboard</Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.home)}>Back to Home</Button>
          </div>
        </div>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 relative overflow-hidden">
      <div className="absolute inset-0 pattern-gold opacity-25" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gold-600/10 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-gold-500/8 rounded-full blur-[100px]" />

      <header className="relative border-b border-gold-soft px-6 py-4 flex items-center justify-between bg-ink-950/70 backdrop-blur-xl">
        <button onClick={() => navigate(ROUTES.home)}><Logo /></button>
        <Button variant="ghost" size="sm" onClick={() => navigate(dashboardPathFor(user.role))}>Cancel</Button>
      </header>

      <div className="relative max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold mb-3">Step {step} of 4</p>
          <h1 className="font-serif text-4xl md:text-5xl text-gold-shine font-light">
            Book Your <span className="font-script italic">Appointment</span>
          </h1>
        </div>

        {/* Stepper */}
        <div className="mb-10 flex items-center justify-between max-w-xl mx-auto">
          {["Service", "Doctor", "Schedule", "Confirm"].map((label, i) => {
            const active = step >= i + 1;
            const current = step === i + 1;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                  current ? "bg-gold-gradient text-ink-950 border-gold-300 shadow-gold scale-110"
                  : active ? "bg-gold-500/20 text-gold-200 border-gold-400"
                  : "border-gold-500/20 text-gold-100/30"
                }`}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <div className={`ml-2 text-[10px] uppercase tracking-wider hidden sm:block font-semibold ${active ? "text-gold-200" : "text-gold-100/30"}`}>{label}</div>
                {i < 3 && <div className={`flex-1 h-px mx-3 transition-all ${step > i + 1 ? "bg-gold-400" : "bg-gold-500/15"}`} />}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl glass-strong p-8 shadow-luxe fade-up">
          {step === 1 && (
            <div>
              <h3 className="font-serif text-2xl text-gold-shine mb-1">Select a Service</h3>
              <p className="text-sm text-gold-100/50 mb-6">Choose the treatment you'd like to book.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {services.map((s) => (
                  <button key={s.id} onClick={() => setServiceId(s.id)} className={`text-left p-4 rounded-xl border transition ${serviceId === s.id ? "border-gold-400 bg-gold-500/10" : "border-gold-500/20 hover:border-gold-400/50"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gold-100">{s.name}</span>
                      <span className="text-gold-300 font-mono text-sm">₱{s.price.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gold-100/50 mt-1">⏱ {s.duration} min · {s.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-serif text-2xl text-gold-shine mb-1">Select a Doctor</h3>
              <p className="text-sm text-gold-100/50 mb-6">Your dental care will be in expert hands.</p>
              <div className="p-5 rounded-xl border border-gold-400 bg-gold-500/10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gold-gradient flex items-center justify-center text-ink-950 font-serif font-bold text-xl">DE</div>
                <div>
                  <div className="font-semibold text-gold-100">Dr. Estandarte</div>
                  <div className="text-sm text-gold-100/60">Lead Dentist · Clinic Owner</div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="font-serif text-2xl text-gold-shine mb-1">Choose Date & Time</h3>
              <p className="text-sm text-gold-100/50 mb-6">Real-time availability synced with our calendar.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => { setDate(e.target.value); setTime(""); }} />
                  <p className="text-xs text-gold-100/50 mt-2">📅 Synced with Google Calendar.</p>
                </div>
                <div>
                  <Label>Time Slot</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map((t) => {
                      const taken = takenTimes.includes(t);
                      const selected = time === t;
                      return (
                        <button key={t} disabled={taken} onClick={() => setTime(t)} className={`px-3 py-2 rounded-lg text-sm border transition ${selected ? "bg-gold-gradient text-ink-950 border-gold-400" : taken ? "border-red-500/30 text-red-400/40 line-through cursor-not-allowed" : "border-gold-500/30 text-gold-100/80 hover:border-gold-400"}`}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <label className="mt-5 flex items-center gap-2 text-sm text-gold-100/70">
                <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} className="accent-gold-500" />
                Mark as <span className="text-red-400 font-medium">emergency</span> (priority handling)
              </label>
            </div>
          )}

            {step === 4 && (
            <div>
              <h3 className="font-serif text-2xl text-gold-shine mb-1">Review & Confirm</h3>
              <p className="text-sm text-gold-100/50 mb-6">Please review your appointment details before confirming.</p>
              <div className="space-y-3 text-sm">
                <Row label="Patient" value={user.name} />
                <Row label="Service" value={service.name} />
                <Row label="Doctor" value={doctor} />
                <Row label="Date & Time" value={`${date} · ${time || "—"}`} />
                {emergency && <Row label="Priority" value={<Badge tone="emergency">EMERGENCY</Badge>} />}
              </div>
              <p className="mt-5 text-xs text-gold-100/50">
                Payment will be handled at the clinic on the day of your appointment.
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gold-500/15 flex justify-between gap-3">
            <Button variant="ghost" onClick={back} disabled={step === 1}>← Back</Button>
            {step < 4 ? (
              <Button onClick={next} disabled={step === 3 && !time}>Continue →</Button>
            ) : (
              <Button onClick={confirm} disabled={!time || booking}>{booking ? "Booking…" : "Confirm Appointment ✓"}</Button>
            )}
          </div>
          {bookingError && (
            <p className="mt-3 text-sm text-red-300">{bookingError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gold-500/10">
      <span className="text-gold-100/60 text-xs uppercase tracking-wider">{label}</span>
      <span className="text-gold-100 font-medium">{value}</span>
    </div>
  );
}

function Centered({ children, navigate }: { children: React.ReactNode; navigate: (p: string) => void }) {
  return (
    <div className="min-h-screen bg-ink-950 relative flex items-center justify-center p-6">
      <div className="absolute inset-0 pattern-gold opacity-30" />
      <button onClick={() => navigate(ROUTES.home)} className="absolute top-6 left-6"><Logo /></button>
      <div className="relative">{children}</div>
    </div>
  );
}
