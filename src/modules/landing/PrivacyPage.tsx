import { CLINIC } from "../../shared/constants";

export function PrivacyPage({ navigate }: { navigate: (p: string) => void }) {
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
          <h1 className="font-serif text-4xl font-light text-gold-shine mb-3">Privacy Policy</h1>
          <p className="text-sm text-gold-100/45">{CLINIC.name} · Last updated May 2026</p>
        </div>

        {/* Intro */}
        <div className="rounded-xl border border-gold-500/15 bg-ink-900/40 p-6 mb-8 text-center">
          <p className="text-gold-100/65 leading-relaxed">
            {CLINIC.name} ("we", "our", or "us") operates the Dental Clinic Appointment and Billing System.
            This policy explains how we collect, use, and protect your information.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-gold-100/70 leading-relaxed">
          {[
            {
              title: "Information We Collect",
              content: "We collect information you provide when creating an account or booking an appointment, including your name, email address, phone number, and appointment details.",
            },
            {
              title: "How We Use Your Information",
              list: [
                "To manage your appointments and billing records",
                "To send appointment reminders and notifications",
                "To improve our services",
              ],
            },
            {
              title: "Data Sharing",
              content: "We do not sell or share your personal data with third parties, except as required by law or to provide core clinic services (e.g., Firebase for data storage).",
            },
            {
              title: "Data Security",
              content: "Your data is stored securely using Firebase Firestore with access controls. Only authorized clinic staff can access patient records.",
            },
          ].map(({ title, content, list }) => (
            <section key={title} className="rounded-xl border border-gold-500/10 bg-ink-900/30 p-6">
              <h2 className="font-serif text-xl text-gold-200 mb-3">{title}</h2>
              {content && <p>{content}</p>}
              {list && (
                <ul className="space-y-1.5">
                  {list.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-gold-500 mt-1 shrink-0">✦</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* Contact — centered */}
          <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-6 text-center">
            <h2 className="font-serif text-xl text-gold-200 mb-2">Contact</h2>
            <p className="text-gold-100/60 mb-3">For privacy concerns, reach us at:</p>
            <a href={`mailto:${CLINIC.email}`} className="text-gold-400 hover:text-gold-200 transition font-medium">
              {CLINIC.email}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
