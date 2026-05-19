import { CLINIC } from "../../shared/constants";

export function TermsPage({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="min-h-screen bg-ink-950 text-gold-50 px-6 py-20">
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate("/")} className="text-xs uppercase tracking-[0.2em] text-gold-400 hover:text-gold-200 transition mb-12 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back to Home
        </button>

        {/* Header — centered */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4 justify-center">
            <span className="h-px w-8 bg-gold-500/50" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold">Legal</p>
            <span className="h-px w-8 bg-gold-500/50" />
          </div>
          <h1 className="font-serif text-4xl font-light text-gold-shine mb-3">Terms of Service</h1>
          <p className="text-sm text-gold-100/45">{CLINIC.name} · Last updated May 2026</p>
        </div>

        {/* Intro */}
        <div className="rounded-xl border border-gold-500/15 bg-ink-900/40 p-6 mb-8 text-center">
          <p className="text-gold-100/65 leading-relaxed">
            By accessing or using the {CLINIC.name} Appointment and Billing System, you agree to these Terms of Service.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-gold-100/70 leading-relaxed">
          {[
            {
              title: "Use of the System",
              content: `This system is intended for booking dental appointments and managing billing at ${CLINIC.name}. You agree to use it only for its intended purpose and in compliance with applicable laws.`,
            },
            {
              title: "Account Responsibility",
              content: "You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.",
            },
            {
              title: "Appointments",
              content: "Booking an appointment through this system is subject to clinic availability and confirmation. The clinic reserves the right to reschedule or cancel appointments as needed.",
            },
            {
              title: "Limitation of Liability",
              content: "The developer and clinic are not responsible for data loss, service interruptions, or misuse of the system. The system is provided as-is without warranties of any kind.",
            },
            {
              title: "Changes to Terms",
              content: "We may update these terms at any time. Continued use of the system after changes constitutes acceptance of the updated terms.",
            },
          ].map(({ title, content }) => (
            <section key={title} className="rounded-xl border border-gold-500/10 bg-ink-900/30 p-6">
              <h2 className="font-serif text-xl text-gold-200 mb-3">{title}</h2>
              <p>{content}</p>
            </section>
          ))}

          {/* Contact — centered */}
          <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-6 text-center">
            <h2 className="font-serif text-xl text-gold-200 mb-2">Contact</h2>
            <p className="text-gold-100/60 mb-3">For questions about these terms, reach us at:</p>
            <a href={`mailto:${CLINIC.email}`} className="text-gold-400 hover:text-gold-200 transition font-medium">
              {CLINIC.email}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
