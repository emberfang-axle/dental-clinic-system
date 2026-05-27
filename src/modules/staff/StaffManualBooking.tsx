/**
 * Manual appointment entry for staff.
 * Used for walk-in, Facebook, and SMS bookings.
 */

import { useState } from "react";
import { Button, Input, Label, Select } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import { BOOKING } from "../../shared/constants";
import { KNOWN_DOCTOR_NAMES } from "../../services/bootstrap";
import { formatTime12h } from "../../shared/helpers";
import type { AppointmentSource } from "../../shared/types";
import { isValidEmail, isValidPhilippineMobile } from "../../shared/validation";


const defaultDoctors: string[] = [];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export function StaffManualBooking({ onClose }: { onClose: () => void }) {
  const { services, users } = useStore();
  const dbDoctors = users
    .filter((u) => (u.role === "doctor" || u.role === "co-doctor") && u.active !== false && KNOWN_DOCTOR_NAMES.has(u.name))
    .map((u) => u.name);
  const doctorOptions = [...new Set([...defaultDoctors, ...dbDoctors])];

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [doctor, setDoctor] = useState(doctorOptions[0] ?? "");
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState("");
  const [source, setSource] = useState<AppointmentSource>("walk-in");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const service = services.find((s) => s.id === serviceId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!patientName.trim()) { setError("Patient name is required."); return; }
    if (patientPhone.trim() && !isValidPhilippineMobile(patientPhone)) { setError("Phone must be a valid PH mobile number (e.g. 09xx xxx xxxx)."); return; }
    if (patientEmail.trim() && !isValidEmail(patientEmail)) { setError("Enter a valid email address (any provider)."); return; }
    if (!time) { setError("Please select a time slot."); return; }
    if (new Date(date + "T00:00:00").getDay() === 0) { setError("Clinic is closed on Sundays."); return; }
    if (!service) return;

    setSaving(true);
    try {
      // Look up registered patient by name, fall back to a unique walk-in ID
      const matched = users.find((u) => u.role === "patient" &&
        u.name.toLowerCase() === patientName.trim().toLowerCase());
      await appointmentsService.book({
        patientId: matched?.id ?? `walkin_${crypto.randomUUID()}`,
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim() || undefined,
        patientPhone: patientPhone.trim() || undefined,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        doctor,
        date,
        time,
        status: "pending",
        paymentMethod: "cash",
        paymentStatus: "unpaid",
        source,
        notes: patientAddress.trim() ? `Address: ${patientAddress.trim()}` : undefined,
      });
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Failed to book appointment.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p className="text-gold-100 font-medium">Appointment booked for <span className="text-gold-300">{patientName}</span></p>
        <p className="text-xs text-gold-100/50">{service?.name} · {date} at {formatTime12h(time)}</p>
        <div className="flex justify-center gap-3 pt-2">
          <Button onClick={() => { setDone(false); setPatientName(""); setPatientPhone(""); setPatientEmail(""); setPatientAddress(""); setTime(""); }}>Book Another</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg border border-gold-500/20 bg-gold-500/5 px-3 py-2 text-xs text-gold-100/60">
        If the patient has a registered account, their appointment will appear in their dashboard automatically. Walk-in patients without an account can register at <span className="text-gold-300">the login page</span>.
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="mb-name">Patient Name</Label>
          <Input id="mb-name" placeholder="Full name" value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="mb-phone">Contact Number</Label>
          <Input id="mb-phone" placeholder="09XX XXX XXXX" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="mb-email">Email Address <span className="text-gold-100/40 normal-case tracking-normal">(optional)</span></Label>
        <Input id="mb-email" type="email" placeholder="patient@example.com" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="mb-address">Address / Barangay</Label>
        <Input id="mb-address" placeholder="e.g. Brgy. Poblacion, Compostela" value={patientAddress} onChange={(e) => setPatientAddress(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="mb-service">Procedure</Label>
        <Select id="mb-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="mb-doctor">Doctor</Label>
          <Select id="mb-doctor" value={doctor} onChange={(e) => setDoctor(e.target.value)}>
            {doctorOptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="mb-source">Booking Source</Label>
          <Select id="mb-source" value={source} onChange={(e) => setSource(e.target.value as AppointmentSource)}>
            <option value="walk-in">Walk-in</option>
            <option value="facebook">Facebook</option>
            <option value="sms">Text Message (SMS)</option>
          </Select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="mb-date">Date</Label>
          <Input
            id="mb-date"
            type="date"
            value={date}
            min={tomorrow()}
            onChange={(e) => { setDate(e.target.value); setTime(""); }}
          />
        </div>
        <div>
          <Label>Time Slot</Label>
          <div className="flex flex-wrap gap-2">
            {BOOKING.TIME_SLOTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                  time === t
                    ? "bg-gold-gradient text-ink-950 border-gold-400 font-semibold"
                    : "border-gold-500/30 text-gold-100/80 hover:border-gold-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Booking…" : "Book Appointment"}</Button>
      </div>
    </form>
  );
}
