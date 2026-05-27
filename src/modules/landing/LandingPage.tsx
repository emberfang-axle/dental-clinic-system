import { useEffect, useState } from "react";
import { Logo, LogoMark } from "../../components/Logo";
import { Button, Card, Section, Ornament } from "../../components/ui";
import { useStore } from "../../store/store";
import { CLINIC, ROUTES, clinicPhoneTelHref } from "../../shared/constants";
import { dashboardPathFor } from "../../shared/helpers";
import { categoriseServices } from "../../shared/serviceCatalog";

const NAV_LINKS = [
  { label: "Home",     id: "home" },
  { label: "About",    id: "about" },
  { label: "Why Us",   id: "why" },
  { label: "Services", id: "services" },
  { label: "Contact",  id: "contact" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const HERO_WORDS = ["luxury.", "precision.", "confidence.", "artistry."];

export function LandingPage({ navigate }: { navigate: (p: string) => void }) {
  const { services, user } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [heroWord, setHeroWord] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setHeroWord((w) => (w + 1) % HERO_WORDS.length);
        setWordVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const categorised = categoriseServices(services);

  // Flat list for toggle — first 6 visible by default
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onResize = () => { if (window.innerWidth >= 1024) setMobileMenu(false); };
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 text-gold-50 relative">
      <div className="fixed top-0 right-0 w-150 h-150 bg-gold-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-125 h-125 bg-gold-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Nav */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-ink-950/85 backdrop-blur-xl border-b border-gold-soft py-2" : "bg-transparent py-4"}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <button onClick={() => navigate(ROUTES.home)} className="cursor-pointer hover:opacity-90 transition">
            <Logo size={42} />
          </button>
          <nav className="hidden lg:flex items-center gap-9 text-[12px] uppercase tracking-[0.18em] text-gold-100/70 font-semibold landing-nav">
            {NAV_LINKS.map(({ label, id }) => (
              <a key={id} onClick={() => scrollTo(id)} className="hover:text-gold-300 transition relative group whitespace-nowrap cursor-pointer">
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold-400 transition-all group-hover:w-full" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate(dashboardPathFor(user.role))}>My Dashboard</Button>
                <Button size="sm" onClick={() => navigate(ROUTES.book)} className="hidden sm:inline-flex">Book Now</Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.login)}>Login</Button>
                <Button size="sm" onClick={() => navigate(ROUTES.book)} className="hidden sm:inline-flex">Book Now</Button>
              </>
            )}
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
              {NAV_LINKS.map(({ label, id }) => (
                <a key={id} onClick={() => { setMobileMenu(false); scrollTo(id); }} className="text-gold-100/80 hover:text-gold-300 py-1.5 uppercase tracking-[0.18em] text-[11px] font-semibold cursor-pointer">
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="relative min-h-[100svh] sm:min-h-[80vh] flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <img src="/images/hero-dental.jpg" alt="" className="absolute inset-0 w-full h-full opacity-35" style={{ objectFit: "cover", objectPosition: "center center" }} />
          <div className="absolute inset-0 bg-linear-to-r from-ink-950 via-ink-950/80 to-ink-950/30" />
          <div className="absolute inset-0 bg-linear-to-t from-ink-950 via-transparent to-ink-950/60" />
          <div className="absolute inset-0 pattern-grid opacity-40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-12 gap-10 items-center w-full">
          <div className="lg:col-span-7 fade-up text-center lg:text-left">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.25em] text-gold-200/90 font-medium mb-5 sm:mb-8">{CLINIC.address}</p>
            <h1 className="font-serif font-light text-[2.2rem] sm:text-5xl lg:text-5xl xl:text-6xl leading-[1.05] tracking-tight">
              <span className="block text-gold-50/95">A smile that</span>
              <span className="block font-script italic font-normal mt-1">
                speaks{" "}
                <span
                  className="text-gold-shine inline-block transition-all duration-400"
                  style={{ opacity: wordVisible ? 1 : 0, transform: wordVisible ? "translateY(0)" : "translateY(8px)" }}
                >
                  {HERO_WORDS[heroWord]}
                </span>
              </span>
            </h1>
            <p className="mt-6 sm:mt-8 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base md:text-lg text-gold-100/60 font-light leading-relaxed">
              Estandarte Dental Clinic delivers refined, world-class dental care in the heart of Compostela.
              Trusted for over four years, modernized for the way you live today.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <Button size="lg" onClick={() => navigate(ROUTES.book)} className="w-full sm:w-auto">
                Book Appointment
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </Button>
              <a href={clinicPhoneTelHref()} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full">Call Us</Button>
              </a>
            </div>
            {/* Scroll indicator removed */}
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
                Premium Care
              </div>
              <div className="absolute -bottom-4 -left-4 glass-strong px-4 py-2.5 rounded-full text-xs text-gold-100 font-medium float-slow shadow-luxe" style={{ animationDelay: "2s" }}>
                Trusted Since {CLINIC.yearFounded}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <Section id="about" eyebrow="About the Clinic" title={<>Refined dentistry,<br/><span className="font-script italic">redefined for you.</span></>}>
        <div className="grid lg:grid-cols-2 gap-8 items-center mt-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gold-gradient rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition" />
            <div className="relative rounded-2xl overflow-hidden border border-gold-500/30 shadow-luxe">
              <img src="/images/clinic-interior.jpg" alt="Clinic interior" className="w-full h-56 sm:h-80 lg:h-[420px] object-cover object-center transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 photo-overlay" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold-300 mb-1">Our Sanctuary</div>
                <div className="font-serif text-lg sm:text-2xl text-white">A space designed for comfort.</div>
              </div>
            </div>
          </div>
          <div className="space-y-5 text-left">
            <Ornament className="w-24 h-3" />
            <p className="text-gold-100/75 text-base sm:text-lg leading-relaxed font-light">
              At {CLINIC.name}, we believe every smile deserves
              <span className="text-gold-shine font-medium"> exceptional craftsmanship</span>.
              For over four years, we've combined timeless dental artistry with modern digital systems —
              creating an experience that feels as personal as it is precise.
            </p>
            <p className="text-gold-100/55 text-sm sm:text-base leading-relaxed">
              From your first online booking to your final smile reveal, our team ensures every moment
              reflects the standard our name was built on.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <FeatureBadge title={`Est. ${CLINIC.yearFounded}`} subtitle="Compostela, DDO" />
              <FeatureBadge title="Licensed Doctors" subtitle="Board-certified" />
              <FeatureBadge title="Modern Equipment" subtitle="Digital workflows" />
              <FeatureBadge title="Patient-First" subtitle="Compassionate care" />
            </div>
          </div>
        </div>
      </Section>

      {/* WHY US */}
      <section id="why" className="py-16 sm:py-24 md:py-32 px-5 sm:px-6 relative">
        <div className="absolute inset-0 pattern-gold opacity-30" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-3 mb-5 justify-center">
              <span className="h-px w-8 bg-gold-500/50" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold">Why Choose Us</p>
              <span className="h-px w-8 bg-gold-500/50" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-gold-shine leading-[1.1]">
              The Estandarte <span className="font-script italic">difference.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {[
              {
                // Award ribbon — trust & excellence
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M12 13v8M9 18l3 3 3-3"/><path d="M7 13.5L5 21l7-2 7 2-2-7.5"/></svg>,
                t: "4+ Years of Trust", d: "A reputation built on consistent, world-class results in Compostela."
              },
              {
                // Tooth with cross — dental care
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3C9 3 7 5 7 7.5c0 1.5.5 3 1 4.5.7 2.5 1 5 1.5 7 .3 1.2.8 2 1.5 2s1.2-.8 1.5-2c.5-2 .8-4.5 1.5-7 .5-1.5 1-3 1-4.5C15 5 13 3 12 3z"/><path d="M10 8h4M12 6v4"/></svg>,
                t: "Professional Dental Care", d: "Licensed doctors and certified hygienists devoted to your wellbeing."
              },
              {
                // Calendar with checkmark — easy booking
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 16l2 2 4-4"/></svg>,
                t: "Easy Online Booking", d: "Schedule appointments anytime, see availability instantly."
              },
              {
                // Shield with checkmark — secure payments
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
                t: "Secure Records", d: "Your patient records and treatment history are safely stored and accessible anytime."
              },
              {
                // Clock with calendar dot — real-time scheduling
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 3h6M12 3v2"/></svg>,
                t: "Real-Time Scheduling", d: "Powered by Google Calendar — no double-bookings, ever."
              },
              {
                // Person with heart — patient-first
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/><path d="M12 13c-1.5 0-2.8.7-3.5 1.8a2.5 2.5 0 0 0 4.3 2.5A2.5 2.5 0 0 0 15.5 14.8 4 4 0 0 0 12 13z" strokeWidth="1.2"/></svg>,
                t: "Patient-First Approach", d: "Every detail tailored around your comfort and confidence."
              },
            ].map((f) => (
              <div key={f.t} className="group relative rounded-xl glass p-5 sm:p-7 hover:border-gold-400/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-luxe">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl group-hover:bg-gold-500/15 transition" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mb-4 group-hover:bg-gold-500/20 group-hover:border-gold-400/40 transition">
                    {f.icon}
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl text-gold-100 mb-2">{f.t}</h3>
                  <p className="text-sm text-gold-100/55 leading-relaxed">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-24 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-gold-900/8 to-transparent" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-3 mb-5 justify-center">
              <span className="h-px w-8 bg-gold-500/50" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold">Simple Process</p>
              <span className="h-px w-8 bg-gold-500/50" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-light text-gold-shine leading-[1.1]">
              Your journey to a <span className="font-script italic">perfect smile.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* connector line */}
            <div className="hidden sm:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-linear-to-r from-transparent via-gold-500/40 to-transparent" />
            {[
              {
                step: "01",
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3C9 3 7 5 7 7.5c0 1.5.5 3 1 4.5.7 2.5 1 5 1.5 7 .3 1.2.8 2 1.5 2s1.2-.8 1.5-2c.5-2 .8-4.5 1.5-7 .5-1.5 1-3 1-4.5C15 5 13 3 12 3z"/><path d="M10 8h4M12 6v4"/></svg>,
                title: "Choose a Service",
                desc: "Browse our full menu of dental treatments and pick what suits your needs."
              },
              {
                step: "02",
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>,
                title: "Book Online",
                desc: "Select your preferred date and time. Instant confirmation, no waiting."
              },
              {
                step: "03",
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
                title: "Smile Transformed",
                desc: "Arrive, relax, and leave with the smile you've always deserved."
              },
            ].map((s) => (
              <div key={s.step} className="relative flex flex-col items-center text-center group">
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-full glass-strong flex items-center justify-center text-gold-400 shadow-luxe border border-gold-500/30 group-hover:border-gold-400/60 transition-all duration-500 group-hover:shadow-gold">
                    {s.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold-gradient flex items-center justify-center text-[9px] font-bold text-ink-950">
                    {s.step}
                  </div>
                </div>
                <h3 className="font-serif text-lg text-gold-100 mb-2">{s.title}</h3>
                <p className="text-sm text-gold-100/55 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button onClick={() => navigate(ROUTES.book)}>Start Your Journey →</Button>
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
        {(() => {
          const allServicesList = categorised.flatMap((c) => c.items);
          const flatSlice = showAllServices ? allServicesList : allServicesList.slice(0, 6);
          const visibleCategorised = categorised.map((cat) => ({
            ...cat,
            items: cat.items.filter((s) => flatSlice.includes(s)),
          })).filter((c) => c.items.length > 0);

          return (
            <div className="space-y-8">
              {visibleCategorised.map((cat) => (
                <div key={cat.label}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="h-px flex-1 bg-gold-500/15" />
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gold-400/70 font-semibold">{cat.label}</p>
                    <span className="h-px flex-1 bg-gold-500/15" />
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.items.map((s) => (
                      <div key={s.id} className="group relative rounded-xl overflow-hidden glass hover:border-gold-400/50 transition-all duration-500 hover:shadow-luxe">
                        <div className="p-5 sm:p-6">
                          <h3 className="font-serif text-lg sm:text-xl text-gold-shine leading-tight mb-2">{s.name}</h3>
                          <p className="text-xs sm:text-sm text-gold-100/55 leading-relaxed mb-4">{s.description}</p>
                          <div className="flex items-end justify-between pt-3 border-t border-gold-500/15">
                            <div>
                              <div className="text-[9px] uppercase tracking-[0.25em] text-gold-300/60 mb-0.5">{s.priceMax ? "Starting at" : "Price"}</div>
                              <div className="font-serif text-lg sm:text-xl text-gold-shine">
                                ₱{s.price.toLocaleString()}
                                {s.priceMax && <span className="text-sm sm:text-base"> – ₱{s.priceMax.toLocaleString()}</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[9px] uppercase tracking-[0.25em] text-gold-300/60 mb-0.5">Duration</div>
                              <div className="text-sm text-gold-200">{s.duration} min</div>
                            </div>
                          </div>
                          {s.requiresDeposit && (
                            <span className="mt-3 inline-block text-[9px] uppercase tracking-wider font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded px-2 py-0.5">
                              Deposit Required
                            </span>
                          )}
                          <button onClick={() => navigate(ROUTES.book)} className="mt-3 w-full text-center text-xs uppercase tracking-[0.2em] text-gold-300 hover:text-gold-100 py-2.5 border border-gold-500/20 hover:border-gold-400 rounded-md transition-all font-medium">
                            Book This Service →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          {categorised.flatMap((c) => c.items).length > 6 && (
            <Button variant="outline" onClick={() => setShowAllServices((v) => !v)} className="w-full sm:w-auto">
              {showAllServices ? "Show Less" : `View All Services (${categorised.flatMap((c) => c.items).length})`}
            </Button>
          )}
          <Button onClick={() => navigate(ROUTES.book)} className="w-full sm:w-auto">Book Appointment</Button>
        </div>
      </Section>

      {/* DOCTOR */}
      <section className="py-20 sm:py-24 md:py-32 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-gold-900/10 to-transparent" />
        <div className="max-w-6xl mx-auto relative grid lg:grid-cols-5 gap-8 sm:gap-12 items-center">
          <div className="lg:col-span-2 relative max-w-xs mx-auto w-full lg:max-w-none">
            <div className="absolute inset-0 bg-gold-gradient rounded-2xl blur-3xl opacity-20" />
            <div className="relative rounded-2xl overflow-hidden border border-gold-500/30 shadow-luxe">
              <img src="/images/doctor-portrait.jpg" alt="Lead dentist" className="w-full h-auto object-cover object-top block" />
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 via-black/40 to-transparent px-6 py-5">
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold-300 mb-1">Owner & Lead Dentist</div>
                <div className="font-serif text-xl sm:text-2xl text-white">Dr. Mary Cris Estandarte</div>
                <div className="text-xs text-white/70 mt-1">D.M.D, Licensed Practitioner</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 space-y-5 sm:space-y-6 text-center lg:text-left">
            <Ornament className="w-24 h-3 mx-auto lg:mx-0" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold">Meet The Doctor</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-gold-shine leading-[1.1]">
              Care led by a <span className="font-script italic">trusted hand.</span>
            </h2>
            <p className="text-gold-100/70 text-base sm:text-lg leading-relaxed font-light">
              With over a decade of clinical experience and a deep belief that dentistry is both art and
              science, Dr. Estandarte oversees every aspect of your treatment — from the first consultation
              to your final result.
            </p>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* CONTACT */}
      <Section id="contact" eyebrow="Get In Touch" title={<>Visit our <span className="font-script italic">sanctuary.</span></>} subtitle="We'd love to welcome you. Reach out anytime through the channels below.">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <ContactCard label="Address" primary="Purok 12 J.P Laurel St." secondary="Compostela, Davao de Oro" />
          <ContactCard label="Phone" primary={CLINIC.phone} secondary={CLINIC.hours} href={clinicPhoneTelHref()} />
          <ContactCard label="Email" primary={CLINIC.email} secondary="Replies within 24 hours" />
        </div>
        <div className="text-center">
          <a href={CLINIC.facebookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-5 py-3 rounded-full glass hover:border-gold-400/50 transition group">
            <span className="text-sm text-gold-100 group-hover:text-gold-300 transition">Follow our official Facebook page</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-400 group-hover:translate-x-1 transition shrink-0">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </Section>

      {/* CTA */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto relative">
          <div className="absolute inset-0 bg-gold-gradient rounded-3xl blur-3xl opacity-20" />
          <div className="relative rounded-3xl glass-strong border border-gold-500/30 p-8 sm:p-12 md:p-20 text-center shadow-luxe overflow-hidden">
            <div className="absolute inset-0 pattern-gold opacity-40" />
            <div className="relative">
              <Ornament className="w-24 sm:w-32 h-3 mx-auto mb-6 sm:mb-8" />
              <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl font-light text-gold-shine leading-tight">
                Ready for your <span className="font-script italic">next visit?</span>
              </h2>
              <p className="mt-4 sm:mt-6 text-gold-100/70 max-w-xl mx-auto text-sm sm:text-lg font-light">
                Schedule your appointment in minutes and experience world-class dental care.
              </p>
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-3">
                <Button size="lg" onClick={() => navigate(ROUTES.book)} className="w-full sm:w-auto">Book Appointment</Button>
                <Button size="lg" variant="outline" onClick={() => navigate(ROUTES.register)} className="w-full sm:w-auto">Create Account</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gold-soft py-14 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-10">
            <div className="md:col-span-2">
              <Logo size={42} />
              <p className="mt-5 text-sm text-gold-100/50 leading-relaxed max-w-md font-light">
                Premium dental care in {CLINIC.address}. Crafted with precision, delivered with heart — since {CLINIC.yearFounded}.
              </p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold-300 font-semibold mb-4">Navigate</div>
              <ul className="space-y-2.5 text-sm text-gold-100/60">
                {NAV_LINKS.map(({ label, id }) => (
                  <li key={id}><a onClick={() => scrollTo(id)} className="hover:text-gold-300 transition cursor-pointer">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold-300 font-semibold mb-4">Contact</div>
              <ul className="space-y-2.5 text-sm text-gold-100/60">
                <li>{CLINIC.address}</li>
                <li>
                  <a href={clinicPhoneTelHref()} className="hover:text-gold-300 transition">
                    {CLINIC.phone}
                  </a>
                </li>
                <li>{CLINIC.hours}</li>
                <li>{CLINIC.email}</li>
                <li><a href={CLINIC.facebookUrl} target="_blank" rel="noreferrer" className="hover:text-gold-300 transition">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gold-soft flex flex-col items-center gap-3 text-xs text-gold-100/40 text-center md:flex-row md:justify-between">
            <div>
              © {new Date().getFullYear()} {CLINIC.name} · All rights reserved.
              <span className="hidden sm:inline"> · </span>
              <a href={clinicPhoneTelHref()} className="block sm:inline mt-1 sm:mt-0 hover:text-gold-300 transition">
                {CLINIC.phone}
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a onClick={() => navigate("/privacy")} className="hover:text-gold-300 transition cursor-pointer">Privacy Policy</a>
              <span>·</span>
              <a onClick={() => navigate("/terms")} className="hover:text-gold-300 transition cursor-pointer">Terms of Service</a>
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em]">Crafted with ✦ for refined smiles</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TestimonialsSection() {
  const { feedbacks } = useStore();
  const shown = [...feedbacks]
    .filter((f) => f.showOnLanding === true)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);
  if (shown.length === 0) return null;
  const items = shown.length < 4 ? [...shown, ...shown] : shown;
  const avg = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.stars, 0) / feedbacks.length).toFixed(1) : null;
  return (
    <section id="testimonials" className="py-16 sm:py-24 overflow-hidden">
      <div className="text-center mb-10 px-6">
        <div className="inline-flex items-center gap-3 mb-5 justify-center">
          <span className="h-px w-8 bg-gold-500/50" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold">Patient Reviews</p>
          <span className="h-px w-8 bg-gold-500/50" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-light text-gold-shine leading-[1.1]">
          What our patients <span className="font-script italic">say.</span>
        </h2>
        {avg && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-gold-500/25">
            <span className="text-gold-400 text-base">{"★".repeat(Math.round(Number(avg)))}</span>
            <span className="font-serif text-xl text-gold-shine">{avg}</span>
            <span className="text-xs text-gold-100/45">/ 5 · {feedbacks.length} review{feedbacks.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-ink-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-ink-950 to-transparent z-10 pointer-events-none" />
        <div className="flex gap-5 testimonial-marquee">
          {[...items, ...items].map((f, i) => (
            <div key={`${f.id}-${i}`} className="glass rounded-xl p-6 flex flex-col gap-3 shrink-0 w-72 sm:w-80">
              <div className="text-gold-400 text-lg">{"★".repeat(f.stars)}<span className="text-gold-100/20">{"★".repeat(5 - f.stars)}</span></div>
              <p className="text-sm text-gold-100/70 leading-relaxed flex-1">"{f.text}"</p>
              <div className="text-xs text-gold-300/60 font-medium">{f.userName}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureBadge({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-gold-500/15 bg-ink-900/40">
      <div>
        <div className="text-sm text-gold-100 font-medium">{title}</div>
        <div className="text-[11px] text-gold-100/50">{subtitle}</div>
      </div>
    </div>
  );
}

function ContactCard({ label, primary, secondary, href }: { label: string; primary: string; secondary: string; href?: string }) {
  const primaryEl = href ? (
    <a href={href} className="font-serif text-base sm:text-xl text-gold-shine mb-1 break-words hover:text-gold-300 transition block">
      {primary}
    </a>
  ) : (
    <div className="font-serif text-base sm:text-xl text-gold-shine mb-1 break-words">{primary}</div>
  );
  return (
    <Card hover className="text-center p-5 sm:p-8!">
      <div className="text-[10px] uppercase tracking-[0.3em] text-gold-300/70 mb-2 font-semibold">{label}</div>
      {primaryEl}
      <div className="text-xs text-gold-100/55 break-words">{secondary}</div>
    </Card>
  );
}

