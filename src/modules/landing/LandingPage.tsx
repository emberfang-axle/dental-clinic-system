/**
 * Public landing page — STRICTLY isolated from any dashboard logic.
 * Visible to anyone, no authentication required.
 */

import { useEffect, useState } from "react";
import { Logo, LogoMark } from "../../components/Logo";
import { Button, Card, Section, Ornament } from "../../components/ui";
import { useStore } from "../../store/store";
import { CLINIC, ROUTES } from "../../shared/constants";

const navLinks = [
  { l: "Home", h: "#home" },
  { l: "About", h: "#about" },
  { l: "Services", h: "#services" },
  { l: "Why Us", h: "#why" },
  { l: "Contact", h: "#contact" },
];

export function LandingPage({ navigate }: { navigate: (p: string) => void }) {
  const { services } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const servicesPreviewCount = 6;
  const displayedServices = showAllServices ? services : services.slice(0, servicesPreviewCount);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileMenu(false);
    };
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 text-gold-50 relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gold-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-gold-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Nav */}
      <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? "bg-ink-950/85 backdrop-blur-xl border-b border-gold-soft py-2" : "bg-transparent py-4"}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <button onClick={() => navigate(ROUTES.home)} className="cursor-pointer hover:opacity-90 transition">
            <Logo size={42} />
          </button>
          <nav className="hidden lg:flex items-center gap-9 text-[12px] uppercase tracking-[0.18em] text-gold-100/70 font-semibold">
            {navLinks.map((i) => (
              <a key={i.l} href={i.h} className="hover:text-gold-300 transition relative group whitespace-nowrap">
                {i.l}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold-400 transition-all group-hover:w-full" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.login)}>Login</Button>
            <Button size="sm" onClick={() => navigate(ROUTES.book)} className="hidden sm:inline-flex">Book Now</Button>
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden inline-flex items-center justify-center rounded-full border border-gold-500/25 bg-ink-900/70 text-gold-200 p-2.5 shadow-luxe"
              aria-label="Menu"
              aria-expanded={mobileMenu}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileMenu ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="lg:hidden border-t border-gold-soft bg-ink-950/95 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3 text-sm">
              {navLinks.map((item) => (
                <a key={item.l} href={item.h} onClick={() => setMobileMenu(false)} className="text-gold-100/80 hover:text-gold-300 py-1.5 uppercase tracking-[0.18em] text-[11px] font-semibold">
                  {item.l}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hero-dental.jpg" alt="" className="w-full h-full object-cover object-center opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/60" />
          <div className="absolute inset-0 pattern-grid opacity-40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-12 gap-12 items-center w-full">
          <div className="lg:col-span-7 fade-up">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-400" />
              </span>
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold-200/90 font-medium">{CLINIC.address}</span>
            </div>

            <h1 className="font-serif font-light text-[2.75rem] sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] tracking-tight">
              <span className="block text-gold-50/95">A smile that</span>
              <span className="block text-gold-shine font-script italic font-normal mt-1">speaks luxury.</span>
            </h1>

            <p className="mt-8 max-w-xl text-base md:text-lg text-gold-100/60 font-light leading-relaxed">
              Estandarte Dental Clinic delivers refined, world-class dental care in the heart of Compostela.
              Trusted for over four years, modernized for the way you live today.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate(ROUTES.book)}>
                Book Appointment
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Button>
              <Button size="lg" variant="outline" onClick={() => { window.location.href = `tel:${CLINIC.phone.replace(/\s/g, "")}`; }}>
                Call Us
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:flex justify-center fade-up" style={{ animationDelay: "0.3s" }}>
            <div className="relative">
              <div className="absolute inset-0 -m-8 spin-slow opacity-30">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <circle cx="100" cy="100" r="95" fill="none" stroke="url(#ringGold)" strokeWidth="0.5" strokeDasharray="2 6" />
                  <defs>
                    <linearGradient id="ringGold">
                      <stop stopColor="#dab23c" />
                      <stop offset="1" stopColor="#7d5a16" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="absolute inset-0 bg-gold-gradient rounded-full blur-3xl opacity-15 scale-110" />
              <div className="relative w-80 h-80 rounded-full glass-strong flex items-center justify-center float shadow-luxe">
                <div className="absolute inset-4 rounded-full border border-gold-500/20" />
                <div className="absolute inset-8 rounded-full border border-gold-500/10" />
                <LogoMark size={160} />
              </div>
              <div className="absolute -top-4 -right-4 glass-strong px-4 py-2.5 rounded-full text-xs text-gold-100 font-medium float-slow shadow-luxe" style={{ animationDelay: "1s" }}>
                ✨ Premium Care
              </div>
              <div className="absolute -bottom-4 -left-4 glass-strong px-4 py-2.5 rounded-full text-xs text-gold-100 font-medium float-slow shadow-luxe" style={{ animationDelay: "2s" }}>
                🏆 Trusted Since {CLINIC.yearFounded}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="border-y border-gold-soft bg-ink-900/40 backdrop-blur overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-around gap-8 text-[10px] uppercase tracking-[0.35em] text-gold-300/70 font-semibold">
          <span className="hidden sm:inline">★ Established {CLINIC.yearFounded}</span>
          <span className="hidden md:inline">·</span>
          <span>Premium Dental Excellence</span>
          <span className="hidden md:inline">·</span>
          <span className="hidden sm:inline">Trusted Patients</span>
          <span className="hidden md:inline">·</span>
          <span className="hidden lg:inline">Real-Time Online Booking ★</span>
        </div>
      </div>

      {/* ABOUT */}
      <Section id="about" eyebrow="About the Clinic" title={<>Refined dentistry,<br/><span className="font-script italic">redefined for you.</span></>}>
        <div className="grid lg:grid-cols-2 gap-12 items-center mt-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gold-gradient rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition" />
            <div className="relative rounded-2xl overflow-hidden border border-gold-500/30 shadow-luxe">
              <img src="/images/clinic-interior.jpg" alt="Clinic interior" className="w-full h-[480px] object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold-300 mb-2">Our Sanctuary</div>
                <div className="font-serif text-2xl text-gold-50">A space designed for comfort.</div>
              </div>
            </div>
          </div>
          <div className="space-y-6 text-left">
            <Ornament className="w-24 h-3" />
            <p className="text-gold-100/75 text-lg leading-relaxed font-light">
              At {CLINIC.name}, we believe every smile deserves
              <span className="text-gold-shine font-medium"> exceptional craftsmanship</span>.
              For over four years, we've combined timeless dental artistry with modern digital systems —
              creating an experience that feels as personal as it is precise.
            </p>
            <p className="text-gold-100/55 leading-relaxed">
              From your first online booking to your final smile reveal, our team ensures every moment
              reflects the standard our name was built on.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <FeatureBadge icon="🏛️" title={`Established ${CLINIC.yearFounded}`} subtitle="Compostela, DDO" />
              <FeatureBadge icon="👩‍⚕️" title="Licensed Doctors" subtitle="Board-certified" />
              <FeatureBadge icon="💎" title="Modern Equipment" subtitle="Digital workflows" />
              <FeatureBadge icon="❤️" title="Patient-First" subtitle="Compassionate care" />
            </div>
          </div>
        </div>
      </Section>

      {/* WHY US */}
      <section id="why" className="py-24 md:py-32 px-6 relative">
        <div className="absolute inset-0 pattern-gold opacity-30" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-5 justify-center">
              <span className="h-px w-8 bg-gold-500/50" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold">Why Choose Us</p>
              <span className="h-px w-8 bg-gold-500/50" />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-gold-shine leading-[1.1]">
              The Estandarte <span className="font-script italic">difference.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {[
              { t: "4+ Years of Trust", d: "A reputation built on consistent, world-class results in Compostela." },
              { t: "Professional Dental Care", d: "Licensed doctors and certified hygienists devoted to your wellbeing." },
              { t: "Easy Online Booking", d: "Schedule appointments anytime, see availability instantly." },
              { t: "Secure Payments", d: "Pay with GCash or cash, with verified transaction tracking." },
              { t: "Real-Time Scheduling", d: "Powered by Google Calendar — no double-bookings, ever." },
              { t: "Patient-First Approach", d: "Every detail tailored around your comfort and confidence." },
            ].map((f, index) => (
              <div key={f.t} className="group relative rounded-xl glass p-7 hover:border-gold-400/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-luxe">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl group-hover:bg-gold-500/15 transition" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-lg bg-gold-gradient/10 border border-gold-500/30 flex items-center justify-center mb-5 text-gold-300 font-mono text-sm group-hover:scale-110 group-hover:border-gold-400 transition">
                    0{index + 1}
                  </div>
                  <h3 className="font-serif text-xl text-gold-100 mb-2">{f.t}</h3>
                  <p className="text-sm text-gold-100/55 leading-relaxed">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <Section
        id="services"
        eyebrow="Our Services"
        title={<>Treatments crafted with <span className="font-script italic">precision.</span></>}
        subtitle="From routine cleanings to bespoke cosmetic transformations — every procedure is delivered with the highest standard of care."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {displayedServices.map((s, i) => (
            <div key={s.id} className="group relative rounded-xl overflow-hidden glass hover:border-gold-400/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-luxe">
              <div className="absolute top-0 right-0 w-24 h-24">
                <div className="absolute top-3 right-3 text-[10px] text-gold-400/60 font-mono">{String(i + 1).padStart(2, "0")}</div>
              </div>
              <div className="p-7">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <h3 className="font-serif text-2xl text-gold-shine leading-tight max-w-[12rem]">{s.name}</h3>
                  <div className="text-right shrink-0">
                    <div className="text-[9px] uppercase tracking-[0.25em] text-gold-300/60 mb-0.5">Duration</div>
                    <div className="text-sm text-gold-200">{s.duration} min</div>
                  </div>
                </div>
                <p className="text-sm text-gold-100/55 leading-relaxed mb-5 min-h-[40px]">{s.description}</p>
                <div className="flex items-end justify-between pt-4 border-t border-gold-500/15">
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.25em] text-gold-300/60 mb-0.5">Starting at</div>
                    <div className="font-serif text-2xl text-gold-shine">₱{s.price.toLocaleString()}</div>
                  </div>
                </div>
                <button onClick={() => navigate(ROUTES.book)} className="mt-5 w-full text-center text-xs uppercase tracking-[0.2em] text-gold-300 hover:text-gold-100 py-3 border border-gold-500/20 hover:border-gold-400 rounded-md transition-all font-medium opacity-70 group-hover:opacity-100">
                  Book This Service →
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {services.length > servicesPreviewCount && (
            <Button variant="outline" onClick={() => setShowAllServices((prev) => !prev)}>
              {showAllServices ? "Show Less Services" : "View All Services"}
            </Button>
          )}
          <Button onClick={() => navigate(ROUTES.book)}>Book Appointment</Button>
        </div>
      </Section>

      {/* DOCTOR FEATURE */}
      <section className="py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold-900/10 to-transparent" />
        <div className="max-w-6xl mx-auto relative grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-0 bg-gold-gradient rounded-2xl blur-3xl opacity-20" />
            <div className="relative rounded-2xl overflow-hidden border border-gold-500/30 shadow-luxe aspect-[4/5]">
              <img src="/images/doctor-portrait.png" alt="Lead dentist" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold-300 mb-1">Owner & Lead Dentist</div>
                <div className="font-serif text-2xl text-gold-50">Dr. Mary Cris Estandarte</div>
                <div className="text-xs text-gold-100/60 mt-1">D.M.D, Licensed Practitioner</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 space-y-6">
            <Ornament className="w-24 h-3" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold">Meet The Doctor</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-gold-shine leading-[1.1]">
              Care led by a <span className="font-script italic">trusted hand.</span>
            </h2>
            <p className="text-gold-100/70 text-lg leading-relaxed font-light">
              With over a decade of clinical experience and a deep belief that dentistry is both art and
              science, Dr. Estandarte oversees every aspect of your treatment — from the first consultation
              to your final result.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <Section id="contact" eyebrow="Get In Touch" title={<>Visit our <span className="font-script italic">sanctuary.</span></>} subtitle="We'd love to welcome you. Reach out anytime through the channels below.">
        <div className="grid md:grid-cols-3 gap-5 stagger mb-10">
          <ContactCard label="Address" primary="Compostela" secondary="Davao de Oro, Philippines" />
          <ContactCard label="Phone" primary={CLINIC.phone} secondary={CLINIC.hours} />
          <ContactCard label="Email" primary={CLINIC.email} secondary="Replies within 24 hours" />
        </div>
        <div className="text-center">
          <a href={CLINIC.facebookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass hover:border-gold-400/50 transition group">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold-300/70">Facebook</span>
            <span className="text-sm text-gold-100 group-hover:text-gold-300 transition">Follow our official Facebook page</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-400 group-hover:translate-x-1 transition">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </Section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto relative">
          <div className="absolute inset-0 bg-gold-gradient rounded-3xl blur-3xl opacity-20" />
          <div className="relative rounded-3xl glass-strong border border-gold-500/30 p-12 md:p-20 text-center shadow-luxe overflow-hidden">
            <div className="absolute inset-0 pattern-gold opacity-40" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-gold-400 to-transparent" />
            <div className="relative">
              <Ornament className="w-32 h-3 mx-auto mb-8" />
              <h2 className="font-serif text-4xl md:text-6xl font-light text-gold-shine leading-tight">
                Ready for your <span className="font-script italic">next visit?</span>
              </h2>
              <p className="mt-6 text-gold-100/70 max-w-xl mx-auto text-lg font-light">
                Schedule your appointment in minutes. Pay securely online or at the clinic.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Button size="lg" onClick={() => navigate(ROUTES.book)}>Book Appointment</Button>
                <Button size="lg" variant="outline" onClick={() => navigate(ROUTES.register)}>Create Account</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gold-soft py-14 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <Logo size={42} />
              <p className="mt-5 text-sm text-gold-100/50 leading-relaxed max-w-md font-light">
                Premium dental care in {CLINIC.address}. Crafted with precision, delivered with heart — since {CLINIC.yearFounded}.
              </p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold-300 font-semibold mb-4">Navigate</div>
              <ul className="space-y-2.5 text-sm text-gold-100/60">
                <li><a href="#home" className="hover:text-gold-300 transition">Home</a></li>
                <li><a href="#about" className="hover:text-gold-300 transition">About</a></li>
                <li><a href="#services" className="hover:text-gold-300 transition">Services</a></li>
                <li><a href="#contact" className="hover:text-gold-300 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold-300 font-semibold mb-4">Contact</div>
              <ul className="space-y-2.5 text-sm text-gold-100/60">
                <li>{CLINIC.address}</li>
                <li>{CLINIC.phone}</li>
                <li>{CLINIC.hours}</li>
                <li>{CLINIC.email}</li>
                <li><a href={CLINIC.facebookUrl} target="_blank" rel="noreferrer" className="hover:text-gold-300 transition">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gold-soft flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gold-100/40">
            <div>© {new Date().getFullYear()} {CLINIC.name} · All rights reserved.</div>
            <div className="text-[10px] uppercase tracking-[0.3em]">Crafted with ✦ for refined smiles</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureBadge({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-gold-500/15 bg-ink-900/40">
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-sm text-gold-100 font-medium">{title}</div>
        <div className="text-[11px] text-gold-100/50">{subtitle}</div>
      </div>
    </div>
  );
}

function ContactCard({ label, primary, secondary }: { label: string; primary: string; secondary: string }) {
  return (
    <Card hover className="text-center !p-8">
      <div className="text-[10px] uppercase tracking-[0.3em] text-gold-300/70 mb-2 font-semibold">{label}</div>
      <div className="font-serif text-xl text-gold-shine mb-1">{primary}</div>
      <div className="text-xs text-gold-100/55">{secondary}</div>
    </Card>
  );
}
