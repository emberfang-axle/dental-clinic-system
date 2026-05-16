import { CLINIC } from "../../shared/constants";

export function TermsPage({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="min-h-screen bg-ink-950 text-gold-50 px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/")} className="text-xs uppercase tracking-[0.2em] text-gold-400 hover:text-gold-200 transition mb-10 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back to Home
        </button>

        <h1 className="font-serif text-4xl font-light text-gold-shine mb-8">Terms of Service</h1>

        <div className="space-y-6 text-gold-100/70 leading-relaxed">
          <p>
            By accessing or using the {CLINIC.name} Appointment and Billing System, you agree to these Terms of Service.
          </p>

          <section>
            <h2 className="font-serif text-xl text-gold-200 mb-2">Use of the System</h2>
            <p>This system is intended for booking dental appointments and managing billing at {CLINIC.name}. You agree to use it only for its intended purpose and in compliance with applicable laws.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-gold-200 mb-2">Account Responsibility</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-gold-200 mb-2">Appointments</h2>
            <p>Booking an appointment through this system is subject to clinic availability and confirmation. The clinic reserves the right to reschedule or cancel appointments as needed.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-gold-200 mb-2">Limitation of Liability</h2>
            <p>The developer and clinic are not responsible for data loss, service interruptions, or misuse of the system. The system is provided as-is without warranties of any kind.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-gold-200 mb-2">Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of the system after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-gold-200 mb-2">Contact</h2>
            <p>For questions about these terms, contact us at <a href={`mailto:${CLINIC.email}`} className="text-gold-400 hover:text-gold-200 transition">{CLINIC.email}</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
