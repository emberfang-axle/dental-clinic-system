/**
 * Multi-step appointment booking flow (4 steps):
 * 1. Select Service  2. Choose Doctor  3. Schedule  4. Confirm
 * Available to authenticated patients.
 */

import { useState } from "react";
import { Logo } from "../../components/Logo";
import { Button, Input, Label } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { calendarService } from "../../services/calendar";
import { KNOWN_DOCTOR_NAMES } from "../../services/bootstrap";
import { useStore } from "../../store/store";
import { BOOKING, ROUTES, getSlotsForDate } from "../../shared/constants";
import { dashboardPathFor, formatTime12h } from "../../shared/helpers";


const SERVICE_CATEGORIES = [
  { label: "Preventive Care", names: ["oral consultation", "oral prophylaxis (cleaning)", "teeth whitening"] },
  { label: "Restorative Treatments", names: ["tooth filling (pasta)", "root canal treatment", "dental crowns", "crowns and bridges", "fixed bridge", "veneers"] },
  { label: "Orthodontics", names: ["orthodontics (braces)", "braces adjustment"] },
  { label: "Prosthodontics", names: ["dentures", "removable dentures", "ivocap dentures"] },
  { label: "Surgical / Emergency", names: ["tooth extraction (bunot)", "odontectomy (3rd molar removal)", "emergency dental services"] },
];

// Services that can be booked WITHOUT a prior consultation
const NO_CONSULT_REQUIRED = new Set(["oral consultation"]);

function isSunday(dateStr: string) {
  return new Date(dateStr + "T00:00:00").getDay() === 0;
}

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
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() => services[0] ? [services[0].id] : []);
  const [doctor, setDoctor] = useState(() => doctorOptions[0]?.name ?? "");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    // Skip to Monday only if today is Sunday
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState("");
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [booking, setBooking] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [pendingSurgicalName, setPendingSurgicalName] = useState("");

  // Primary service is the first selected
  const serviceId = selectedServiceIds[0] ?? services[0]?.id ?? "";
  const service = services.find((s) => s.id === serviceId) ?? services[0];
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  if (!service) return null;

  // Check if patient has a completed or confirmed consultation
  const consultationService = services.find((s) => s.name.toLowerCase() === "oral consultation");
  const hasConsultation = consultationService
    ? appointments.some(
        (a) =>
          a.patientId === user?.id &&
          a.serviceId === consultationService.id &&
          (a.status === "completed" || a.status === "confirmed" || a.status === "in-progress")
      )
    : false;

  // A service requires consultation first unless it IS the consultation
  function requiresConsult(s: typeof services[0]) {
    return !NO_CONSULT_REQUIRED.has(s.name.toLowerCase());
  }

  function handleServiceSelect(s: typeof services[0]) {
    if (requiresConsult(s) && !hasConsultation) {
      setPendingSurgicalName(s.name);
      setShowConsultationModal(true);
      return;
    }
    setSelectedServiceIds((prev) => {
      if (prev.includes(s.id)) {
        return prev.length > 1 ? prev.filter((id) => id !== s.id) : prev;
      }
      return [...prev, s.id];
    });
  }

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
    : getSlotsForDate(date);

  const takenTimes = appointments
    .filter((a) => a.date === date && a.status !== "cancelled")
    .map((a) => a.time);

  const patientConflict = appointments.find(
    (a) => a.patientId === user!.id && a.date === date && a.time === time && a.status !== "cancelled"
  );

  function next() {
    setBookingError("");

    if (step === 2 && !doctor) {
      setBookingError("Please select a doctor.");
      return;
    }

    if (step === 3) {
      if (!time) {
        setBookingError("Please select a time slot.");
        return;
      }

      const today = new Date().toISOString().slice(0, 10);

      if (date < today) {
        setBookingError("Please select a future date.");
        return;
      }

      if (isSunday(date)) {
        setBookingError("The clinic is closed on Sundays. Please pick another day.");
        return;
      }

      if (patientConflict) {
        setBookingError(
          `You already have an appointment on ${date} at ${formatTime12h(
            time
          )}. Please choose a different time.`
        );
        return;
      }

      const maxPerDay = settings?.maxAppointmentsPerDay ?? 7;

      const bookedOnDate = appointments.filter(
        (a) => a.date === date && a.status !== "cancelled"
      ).length;

      if (bookedOnDate >= maxPerDay) {
        setBookingError(
          `This date is fully booked (${maxPerDay} appointments). Please choose another date.`
        );
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
        paymentMethod: "cash",
        paymentStatus: "unpaid" as const,
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
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-700/10 border border-emerald-400/40 flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold mb-3">Confirmed</p>
          <h2 className="font-serif text-4xl text-gold-shine font-light">
            Appointment <span className="font-script italic">Booked!</span>
          </h2>
          <p className="text-gold-100/70 mt-5 leading-relaxed">
            Your appointment for{" "}
            <span className="text-gold-300 font-medium">
              {selectedServices.map((s) => s.name).join(", ")}
            </span>{" "}
            on <span className="text-gold-300 font-medium">{date}</span> at{" "}
            <span className="text-gold-300 font-medium">{formatTime12h(time)}</span> has been received.
          </p>
          <p className="text-sm text-gold-100/55 mt-3">Please arrive 10 minutes before your scheduled appointment.</p>

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

      {/* Consultation Required Modal */}
      {showConsultationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConsultationModal(false)} aria-label="Close" />
          <div className="relative glass-strong rounded-2xl p-8 max-w-md w-full shadow-luxe text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-3xl">🦷</div>
            <h3 className="font-serif text-2xl text-gold-shine">Consultation Required</h3>
            <p className="text-sm text-gold-100/70 leading-relaxed">
              To book <span className="text-gold-200 font-medium">{pendingSurgicalName}</span>, you first need an <span className="text-amber-300 font-medium">Oral Consultation</span>.
            </p>
            <p className="text-sm text-gold-100/60 leading-relaxed">
              The doctor will examine your teeth, assess your condition, and recommend the right treatment. This ensures you receive the safest and most appropriate care.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => {
                setShowConsultationModal(false);
                const consult = services.find((s) => s.name.toLowerCase() === "oral consultation");
                if (consult) { setSelectedServiceIds([consult.id]); setStep(2); }
              }}>
                Book Oral Consultation Instead
              </Button>
              <Button variant="ghost" onClick={() => setShowConsultationModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

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
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${current ? "bg-gold-gradient text-ink-950 border-gold-300 shadow-gold scale-110"
                  : active ? "bg-gold-500/20 text-gold-200 border-gold-400"
                    : "border-gold-500/20 text-gold-100/30"
                  }`}>
                  {step > i + 1 ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> : i + 1}
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
                <p className="text-sm text-gold-100/50">Choose one or more treatments. You can select multiple services.</p>
              </div>
              {(() => {
                const categorised = SERVICE_CATEGORIES.map((cat) => ({
                  label: cat.label,
                  items: services.filter((s) => cat.names.includes(s.name.toLowerCase())),
                })).filter((c) => c.items.length > 0);
                const categorisedNames = new Set(SERVICE_CATEGORIES.flatMap((c) => c.names));
                const other = services.filter((s) => !categorisedNames.has(s.name.toLowerCase()));
                if (other.length > 0) categorised.push({ label: "Other", items: other });
                const allIds = services.map((s) => s.id);
                const allSelected = allIds.every((id) => selectedServiceIds.includes(id));
                return (
                  <div className="space-y-5">
                    {/* Select All */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gold-100/50">{selectedServiceIds.length} selected · Total: ₱{totalPrice.toLocaleString()}</span>
                      <button
                        onClick={() => setSelectedServiceIds(allSelected ? [services[0]?.id ?? ""] : allIds)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gold-500/30 text-gold-300 hover:border-gold-400 transition">
                        {allSelected ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                    {categorised.map((cat) => (
                      <div key={cat.label}>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-400/70 font-semibold mb-2">{cat.label}</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {cat.items.map((s) => {
                            const locked = requiresConsult(s) && !hasConsultation;
                            const isSelected = selectedServiceIds.includes(s.id);
                            return (
                            <button key={s.id}
                              onClick={() => handleServiceSelect(s)}
                              className={`text-left p-4 rounded-xl border transition ${isSelected ? "border-gold-400 bg-gold-500/10" : locked ? "border-gold-500/15 opacity-70 hover:border-amber-500/40" : "border-gold-500/20 hover:border-gold-400/50"}`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-gold-100 flex items-center gap-2">
                                  {isSelected && <span className="text-gold-400 text-sm">✓</span>}
                                  {s.name}
                                  {locked && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold uppercase tracking-wider">Consultation Required</span>}
                                </span>
                                <span className="text-gold-300 font-mono text-sm whitespace-nowrap">
                                  ₱{s.price.toLocaleString()}{s.priceMax ? `–₱${s.priceMax.toLocaleString()}` : ""}
                                </span>
                              </div>
                              <div className="text-xs text-gold-100/50 mt-1">{s.duration} min · {s.description}</div>
                              {locked && (
                                <div className="mt-2 text-xs text-amber-200/70 leading-relaxed">
                                  🦷 Book an <span className="text-amber-300 font-medium">Oral Consultation</span> first. The doctor will assess your condition and recommend the right treatment for you.
                                </div>
                              )}
                            </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
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
                    min={(() => {
                      const d = new Date();
                      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                      return d.toISOString().slice(0, 10);
                    })()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (isSunday(val)) {
                        setBookingError("The clinic is closed on Sundays. Please pick another day.");
                        return;
                      }
                      if (calendarService.isDateBlocked(val)) {
                        setBookingError("This date is blocked (clinic holiday or doctor unavailable). Please pick another day.");
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

                      const slotCount = appointments.filter(
                        (a) =>
                          a.date === date &&
                          a.time === t &&
                          a.status !== "cancelled"
                      ).length;

                      return (
                        <div key={t} className="relative group/slot">
                          <button
                            disabled={taken}
                            onClick={() => setTime(t)}
                            className={`w-full px-3 py-2 rounded-lg text-sm border transition ${selected
                              ? "bg-gold-gradient text-ink-950 border-gold-400 font-semibold"
                              : taken
                                ? "border-red-500/30 text-red-400/40 line-through cursor-not-allowed bg-red-500/5"
                                : "border-gold-500/30 text-gold-100/80 hover:border-gold-400 hover:bg-gold-500/5"
                              }`}
                          >
                            {formatTime12h(t)}
                          </button>

                          {taken && (
                            <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-20 opacity-0 group-hover/slot:opacity-100 transition-opacity duration-150 hidden sm:block">
                              <div className="bg-ink-800 border border-red-500/40 text-red-300 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                                Slot Unavailable

                                <div className="text-red-400/60 font-normal">
                                  {slotCount} booking
                                  {slotCount !== 1 ? "s" : ""} at {formatTime12h(t)}
                                </div>
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
                <Row label="Service(s)" value={
                  <div className="text-right space-y-0.5">
                    {selectedServices.map((s) => (
                      <div key={s.id} className="text-gold-100 font-medium">{s.name} <span className="text-gold-300/70 font-mono text-xs">₱{s.price.toLocaleString()}</span></div>
                    ))}
                    {selectedServices.length > 1 && (
                      <div className="text-gold-400 font-semibold text-xs border-t border-gold-500/20 pt-1">Total: ₱{totalPrice.toLocaleString()}</div>
                    )}
                  </div>
                } />
                <Row label="Doctor" value={doctor} />
                <Row
                  label="Date & Time"
                  value={`${date} · ${time ? formatTime12h(time) : "—"}`}
                />
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
