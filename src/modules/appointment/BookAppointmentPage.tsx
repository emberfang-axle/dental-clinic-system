/**
 * Multi-step appointment booking flow (4 steps):
 * 1. Select Service  2. Choose Doctor  3. Schedule  4. Confirm
 * Available to authenticated patients.
 */

import { useState } from "react";
import { Logo } from "../../components/Logo";
import { Badge, Button, Input, Label } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { calendarService } from "../../services/calendar";
import { waitlistService } from "../../services/waitlist";
import { KNOWN_DOCTOR_NAMES } from "../../services/bootstrap";
import { useStore } from "../../store/store";
import { BOOKING, ROUTES } from "../../shared/constants";
import { dashboardPathFor } from "../../shared/helpers";

const SERVICE_CATEGORIES = [
  { label: "Preventive Care",        names: ["oral consultation", "oral prophylaxis (cleaning)", "teeth whitening"] },
  { label: "Restorative Treatments", names: ["tooth filling (pasta)", "root canal treatment", "dental crowns", "crowns and bridges", "fixed bridge", "veneers"] },
  { label: "Orthodontics",           names: ["orthodontics (braces)", "braces adjustment"] },
  { label: "Prosthodontics",         names: ["dentures", "removable dentures", "ivocap dentures"] },
  { label: "Surgical / Emergency",   names: ["tooth extraction (bunot)", "odontectomy (3rd molar removal)", "emergency dental services"] },
];

export function BookAppointmentPage({ navigate }: { navigate: (p: string) => void }) {
  const { user, services: rawServices, appointments, users, doctorSchedules, settings } = useStore();
  const services = rawServices.filter(
    (s, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase()) === i
  );

  // Active doctors from Firestore users only — exclude stale/unknown entries
  const doctorOptions = users
    .filter((u) => (u.role === "doctor" || u.role === "co-doctor") && u.active !== false && KNOWN_DOCTOR_NAMES.has(u.name))
    .map((d) => ({ name: d.name, sub: "Licensed Dentist" }))
    .filter((d, i, arr) => arr.findIndex((x) => x.name === d.name) === i);

  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(() => services[0]?.id ?? "");
  const [doctor, setDoctor] = useState(() => doctorOptions[0]?.name ?? "");
  const [date, setDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState("");
  const [paymentMethod] = useState<"cash" | "gcash">("cash");
  const [emergency, setEmergency] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [booking, setBooking] = useState(false);

  const service = services.find((s) => s.id === serviceId) ?? services[0];
  if (!service) return null;

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

  // Use doctor-specific slots if configured, else clinic defaults
  const doctorSchedule = doctorSchedules.find((s) => s.doctorName === doctor);
  const availableSlots: readonly string[] = doctorSchedule?.timeSlots?.length
    ? doctorSchedule.timeSlots
    : BOOKING.TIME_SLOTS;

  const takenTimes = appointments
    .filter((a) => a.date === date && a.status !== "cancelled")
    .map((a) => a.time);

  const patientConflict = appointments.find(
    (a) => a.patientId === user!.id && a.date === date && a.time === time && a.status !== "cancelled"
  );

  function next() {
    setBookingError("");
    if (step === 2 && !doctor) { setBookingError("Please select a doctor."); return; }
    if (step === 3) {
      if (!time) { setBookingError("Please select a time slot."); return; }
      const today = new Date().toISOString().slice(0, 10);
      if (date < today) { setBookingError("Please select a future date."); return; }
      if (new Date(date + "T00:00:00").getDay() === 0) { setBookingError("The clinic is closed on Sundays. Please pick another day."); return; }
      if (patientConflict) { setBookingError(`You already have an appointment on ${date} at ${time}. Please choose a different time.`); return; }
      const maxPerDay = settings?.maxAppointmentsPerDay ?? 7;
      const bookedOnDate = appointments.filter((a) => a.date === date && a.status !== "cancelled").length;
      if (bookedOnDate >= maxPerDay) {
        setBookingError(`This date is fully booked (${maxPerDay} appointments). Please choose another date.`);
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 4));
  }
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
        patientEmail: user!.email,
        patientPhone: user!.phone,
        serviceId: service!.id,
        serviceName: service!.name,
        price: service!.price,
        doctor, date, time,
        status: "pending",
        paymentMethod,
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
    const depositAmount = service!.requiresDeposit ? Math.ceil(service!.price * 0.3) : null;
    return (
      <Centered navigate={navigate}>
        <div className="max-w-lg w-full glass-strong rounded-2xl p-10 text-center shadow-luxe fade-up">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-700/10 border border-emerald-400/40 flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold mb-3">Confirmed</p>
          <h2 className="font-serif text-4xl text-gold-shine font-light">
            Appointment <span className="font-script italic">Booked!</span>
          </h2>
          <p className="text-gold-100/70 mt-5 leading-relaxed">
            Your appointment for <span className="text-gold-300 font-medium">{service.name}</span> on{" "}
            <span className="text-gold-300 font-medium">{date}</span> at{" "}
            <span className="text-gold-300 font-medium">{time}</span> has been received.
          </p>
          <p className="text-sm text-gold-100/55 mt-3">Please arrive 10 minutes before your scheduled appointment.</p>

          {/* Deposit guidance for deposit-required services */}
          {depositAmount && (
            <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-left space-y-2">
              <p className="text-sm font-semibold text-amber-300">Deposit Required to Confirm</p>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                This service requires a minimum <span className="font-semibold text-amber-300">30% deposit (₱{depositAmount.toLocaleString()})</span> to secure your slot.
              </p>
              {paymentMethod === "gcash" ? (
                <p className="text-xs text-amber-200/70">
                  Send ₱{depositAmount.toLocaleString()} via GCash, then submit your reference number in the <span className="text-gold-300 font-medium">Payments</span> tab of your dashboard.
                </p>
              ) : (
                <p className="text-xs text-amber-200/70">
                  Please pay ₱{depositAmount.toLocaleString()} in cash at the clinic before your appointment date to confirm your slot.
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => navigate(dashboardPathFor(user.role))}>Go to Dashboard</Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.home)}>Back to Home</Button>
          </div>
        </div>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 relative">
      <div className="absolute inset-0 pattern-gold opacity-25" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gold-600/10 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-gold-500/8 rounded-full blur-[100px]" />

      <header className="relative border-b border-gold-soft px-6 py-4 flex items-center justify-between bg-ink-950/70 backdrop-blur-xl">
        <button onClick={() => navigate(ROUTES.home)}><Logo /></button>
        <Button variant="ghost" size="sm" onClick={() => navigate(dashboardPathFor(user.role))}>Cancel</Button>
      </header>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-10">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold mb-3">Step {step} of 4</p>
          <h1 className="font-serif text-4xl md:text-5xl text-gold-shine font-light">
            Book Your <span className="font-script italic">Appointment</span>
          </h1>
        </div>

        {/* Stepper */}
        <div className="mb-10 flex items-center justify-between max-w-2xl mx-auto overflow-hidden">
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
                  {step > i + 1 ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
                </div>
                <div className={`ml-2 text-[10px] uppercase tracking-wider hidden sm:block font-semibold ${active ? "text-gold-200" : "text-gold-100/30"}`}>{label}</div>
                {i < 3 && <div className={`flex-1 h-px mx-3 transition-all ${step > i + 1 ? "bg-gold-400" : "bg-gold-500/15"}`} />}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl glass-strong p-4 sm:p-8 shadow-luxe fade-up">
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <h3 className="font-serif text-2xl text-gold-shine mb-1">Select a Service</h3>
                <p className="text-sm text-gold-100/50">Choose the treatment you need.</p>
              </div>
              {(() => {
                const categorised = SERVICE_CATEGORIES.map((cat) => ({
                  label: cat.label,
                  items: services.filter((s) => cat.names.includes(s.name.toLowerCase())),
                })).filter((c) => c.items.length > 0);
                const categorisedNames = new Set(SERVICE_CATEGORIES.flatMap((c) => c.names));
                const other = services.filter((s) => !categorisedNames.has(s.name.toLowerCase()));
                if (other.length > 0) categorised.push({ label: "Other", items: other });
                return (
                  <div className="space-y-5">
                    {categorised.map((cat) => (
                      <div key={cat.label}>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-400/70 font-semibold mb-2">{cat.label}</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {cat.items.map((s) => (
                            <button key={s.id}
                              onClick={() => { if (serviceId === s.id) { setStep(2); } else { setServiceId(s.id); } }}
                              className={`text-left p-4 rounded-xl border transition ${serviceId === s.id ? "border-gold-400 bg-gold-500/10" : "border-gold-500/20 hover:border-gold-400/50"}`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-gold-100">{s.name}</span>
                                <span className="text-gold-300 font-mono text-sm whitespace-nowrap">
                                  ₱{s.price.toLocaleString()}{s.priceMax ? `–₱${s.priceMax.toLocaleString()}` : ""}
                                </span>
                              </div>
                              <div className="text-xs text-gold-100/50 mt-1">{s.duration} min · {s.description}</div>
                              {s.requiresDeposit && (
                                <div className="mt-2 text-[10px] uppercase tracking-wider font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded px-1.5 py-0.5 inline-block">
                                  Deposit: ₱{Math.ceil(s.price * 0.3).toLocaleString()} required
                                </div>
                              )}
                              {serviceId === s.id && (
                                <div className="mt-2 text-[10px] text-gold-400 font-semibold">Selected — tap again to continue</div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {service?.requiresDeposit && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/8 p-3 text-xs text-amber-200/80 leading-relaxed">
                  <span className="font-semibold text-amber-300">Downpayment Notice: </span>
                  This service requires a minimum deposit of <span className="font-semibold text-amber-300">₱{Math.ceil(service.price * 0.3).toLocaleString()}</span> (30% of ₱{service.price.toLocaleString()}) to confirm your reservation. The remaining balance of <span className="font-semibold text-amber-300">₱{(service.price - Math.ceil(service.price * 0.3)).toLocaleString()}</span> can be settled during or after treatment.
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <h3 className="font-serif text-2xl text-gold-shine mb-1">Choose Your Dentist</h3>
                <p className="text-sm text-gold-100/50">Select your preferred dentist for this appointment.</p>
              </div>
              <div className="space-y-2">
                {doctorOptions.map((d) => {
                  const initials = d.name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  const selected = doctor === d.name;
                  return (
                    <button key={d.name} onClick={() => { if (doctor === d.name) { setStep(3); } else { setDoctor(d.name); } }} onDoubleClick={() => { setDoctor(d.name); setStep(3); }}
                      className={`w-full text-left p-4 rounded-xl border transition flex items-center gap-4 ${selected ? "border-gold-400 bg-gold-500/10" : "border-gold-500/20 hover:border-gold-400/50"}`}>
                      <div className="w-11 h-11 rounded-full bg-gold-gradient flex items-center justify-center text-ink-950 font-serif font-bold text-base shrink-0">{initials}</div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gold-100 text-sm">{d.name}</div>
                        <div className="text-xs text-gold-100/60">{d.sub}</div>
                        {selected && <div className="text-[10px] text-gold-400 font-semibold mt-0.5">✓ Selected — tap again to continue →</div>}
                      </div>
                      {selected && <span className="ml-auto text-gold-400 text-lg shrink-0">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <h3 className="font-serif text-2xl text-gold-shine mb-1">Choose Date & Time</h3>
                <p className="text-sm text-gold-100/50">Real-time availability synced with our calendar.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (new Date(val + "T00:00:00").getDay() === 0) {
                        setBookingError("The clinic is closed on Sundays. Please pick another day.");
                        return;
                      }
                      if (calendarService.isDateBlocked(val)) {
                        setBookingError("This date is fully blocked (clinic holiday or doctor unavailable). Please pick another day.");
                        return;
                      }
                      setBookingError("");
                      setDate(val);
                      setTime("");
                    }}
                  />
                  <p className="text-xs text-gold-100/50 mt-2">Mon–Fri: 9 AM–4 PM · Sat: 8 AM–4 PM · Closed Sundays.</p>
                </div>
                <div>
                  <Label>
                    Time Slot
                    <span className="ml-2 text-gold-100/40 normal-case tracking-normal font-normal">
                      ({availableSlots.length - takenTimes.length} of {availableSlots.length} available)
                    </span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((t) => {
                      const taken = takenTimes.includes(t);
                      const selected = time === t;
                      // Count how many bookings on this slot (for tooltip)
                      const slotCount = appointments.filter(
                        (a) => a.date === date && a.time === t && a.status !== "cancelled"
                      ).length;
                      return (
                        <div key={t} className="relative group/slot">
                          <button
                            disabled={taken}
                            onClick={() => setTime(t)}
                            className={`w-full px-3 py-2 rounded-lg text-sm border transition ${
                              selected
                                ? "bg-gold-gradient text-ink-950 border-gold-400 font-semibold"
                                : taken
                                ? "border-red-500/30 text-red-400/40 line-through cursor-not-allowed bg-red-500/5"
                                : "border-gold-500/30 text-gold-100/80 hover:border-gold-400 hover:bg-gold-500/5"
                            }`}
                          >
                            {t}
                          </button>
                          {/* Tooltip — hidden on touch, shown on hover for desktop */}
                          {taken && (
                            <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-20 opacity-0 group-hover/slot:opacity-100 transition-opacity duration-150 hidden sm:block">
                              <div className="bg-ink-800 border border-red-500/40 text-red-300 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                                Slot Unavailable
                                <div className="text-red-400/60 font-normal">{slotCount} booking{slotCount !== 1 ? "s" : ""} on this time</div>
                              </div>
                            </div>
                          )}
                          {!taken && !selected && (
                            <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-20 opacity-0 group-hover/slot:opacity-100 transition-opacity duration-150 hidden sm:block">
                              <div className="bg-ink-800 border border-gold-500/30 text-gold-300 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                                Slot Available
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <label className="mt-5 flex items-center gap-2 text-sm text-gold-100/70">
                <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} className="accent-gold-500" />
                Mark as <span className="text-red-400 font-medium">emergency</span> (priority handling)
              </label>

              {/* Waitlist — show when all slots are taken */}
              {availableSlots.every((t) => takenTimes.includes(t)) && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/8 p-4 space-y-2">
                  <p className="text-sm font-semibold text-amber-300">All slots are full for this date.</p>
                  <p className="text-xs text-amber-200/70">Join the waitlist and we'll notify you if a slot opens up.</p>
                  <Button size="sm" variant="outline" onClick={async () => {
                    await waitlistService.join({
                      patientId: user!.id,
                      patientName: user!.name,
                      patientEmail: user!.email,
                      patientPhone: user!.phone,
                      serviceId: service!.id,
                      serviceName: service!.name,
                      doctor,
                      preferredDate: date,
                    });
                  }}>
                    Join Waitlist for {date}
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="text-center mb-6">
                <h3 className="font-serif text-2xl text-gold-shine mb-1">Review & Confirm</h3>
                <p className="text-sm text-gold-100/50">Please review your appointment details before confirming.</p>
              </div>
              <div className="space-y-3 text-sm">
                <Row label="Patient" value={user.name} />
                <Row label="Service" value={service!.name} />
                <Row label="Doctor" value={doctor} />
                <Row label="Date & Time" value={`${date} · ${time || "—"}`} />
                {emergency && <Row label="Priority" value={<Badge tone="emergency">EMERGENCY</Badge>} />}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gold-500/15 flex flex-col gap-3">
            {bookingError && (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{bookingError}</p>
            )}
            <div className="flex justify-between gap-3">
              <Button variant="ghost" onClick={back} disabled={step === 1}>← Back</Button>
              {step < 4 ? (
                <Button onClick={next}>Continue →</Button>
              ) : (
                <Button onClick={confirm} disabled={!time || booking}>{booking ? "Booking…" : "Confirm Appointment ✓"}</Button>
              )}
            </div>
          </div>
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
