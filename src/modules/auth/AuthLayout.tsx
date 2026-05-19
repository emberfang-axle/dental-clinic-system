import { Logo, LogoMark } from "../../components/Logo";
import { Ornament } from "../../components/ui";
import { ROUTES } from "../../shared/constants";

export function AuthLayout({ children, navigate }: { children: React.ReactNode; navigate: (p: string) => void }) {
  return (
    <div className="min-h-screen bg-ink-950 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-150 h-150 bg-gold-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-125 h-125 bg-gold-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 sm:px-6 py-4">
        <button onClick={() => navigate(ROUTES.home)} className="no-min hover:opacity-80 transition flex items-center gap-2 text-gold-200/80 hover:text-gold-100">
          <Logo size={36} showText={false} />
        </button>
        <button onClick={() => navigate(ROUTES.home)} className="no-min text-xs text-gold-300/70 hover:text-gold-200 transition flex items-center gap-2 px-3 py-2 rounded-full border border-gold-500/20 bg-ink-900/60 backdrop-blur">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Back to home</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 min-h-screen relative">
        <div className="hidden lg:flex relative overflow-hidden items-end">
          <img src="/images/doctor-login.jpg" alt="Estandarte Dental Clinic doctor" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-ink-950 via-ink-950/40 to-ink-950/30" />
          <div className="absolute inset-0 bg-linear-to-r from-transparent to-ink-950/70" />
          <div className="relative z-10 p-10 xl:p-16 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-gold-200/90 font-semibold">Trusted Dental Care</span>
            </div>
            <h2 className="font-serif text-2xl xl:text-3xl text-gold-shine leading-tight">
              Premium dental care, <span className="font-script italic text-gold-200">made simple.</span>
            </h2>
            <p className="mt-5 text-gold-100/70 leading-relaxed">
              Welcome to Estandarte Dental Clinic — where modern systems meet professional care.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div><div className="text-[11px] uppercase tracking-[0.2em] text-gold-300/70 font-semibold">Online</div><div className="mt-1 text-sm text-gold-100/80">Booking</div></div>
              <div><div className="text-[11px] uppercase tracking-[0.2em] text-gold-300/70 font-semibold">Secure</div><div className="mt-1 text-sm text-gold-100/80">GCash + Cash</div></div>
              <div><div className="text-[11px] uppercase tracking-[0.2em] text-gold-300/70 font-semibold">Real-time</div><div className="mt-1 text-sm text-gold-100/80">Schedule</div></div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center p-6 sm:p-10 pt-24 lg:pt-10">
          <div className="absolute inset-0 lg:hidden">
            <img src="/images/clinic-interior.jpg" alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-linear-to-br from-ink-950/95 via-ink-950/85 to-ink-950/95" />
          </div>
          <div className="relative w-full flex justify-center">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle: React.ReactNode }) {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full glass-strong flex items-center justify-center shadow-luxe">
          <LogoMark size={44} />
        </div>
      </div>
      <Ornament className="w-24 h-3 mx-auto mb-5" />
      <h2 className="font-serif text-4xl text-gold-shine font-light">{title}</h2>
      <p className="text-sm text-gold-100/55 mt-3 font-light">{subtitle}</p>
    </div>
  );
}
