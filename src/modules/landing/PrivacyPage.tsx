import { CLINIC } from "../../shared/constants";

export function PrivacyPage({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="min-h-screen bg-ink-950 text-gold-50 px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/")} className="text-xs uppercase tracking-[0.2em] text-gold-400 hover:text-gold-200 transition mb-10 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back to Home
        </button>

        <h1 className="font-serif text-4xl font-light text-gold-shine mb-8">Privacy Policy</h1>

        <div className="space-y-6 text-gold-100/70 leading-relaxed">
          <p>
            {CLINIC.name} ("we", "our", or "us") operates the Dental Clinic Appointment and Billing System.
            This policy explains how we collect, use, and protect your information.
          </p>

          <section>
            <h2 className="font-serif text-xl text-gold-200 mb-2">Information We Collect</h2>
            <p>We collect information you provide when creating an account or booking an appointment, including your name, email address, phone number, and appointment details.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-gold-200 mb-2">Google Sign-In</h2>
            <p>We use Google Sign-In for authentication. When you sign in with Google, we receive your name, email address, and profile picture from your Google account. We do not receive your Google password.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-gold-200 mb-2">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To manage your appointments and billing records</li>
              <li>To send appointment reminders and notifications</li>
              <li>To improve our services</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-gold-200 mb-2">Data Sharing</h2>
            <p>We do not sell or share your personal data with third parties, except as required by law or to provide core clinic services (e.g., Firebase for data storage).</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-gold-200 mb-2">Data Security</h2>
            <p>Your data is stored securely using Firebase Firestore with access controls. Only authorized clinic staff can access patient records.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-gold-200 mb-2">Contact</h2>
            <p>For privacy concerns, contact us at <a href={`mailto:${CLINIC.email}`} className="text-gold-400 hover:text-gold-200 transition">{CLINIC.email}</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
