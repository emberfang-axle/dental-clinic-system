import { useEffect, useState } from "react";
import { Logo, LogoMark } from "../../components/Logo";
import { Button, Card, Section, Ornament } from "../../components/ui";
import { useStore } from "../../store/store";
import { CLINIC, ROUTES } from "../../shared/constants";
import { dashboardPathFor } from "../../shared/helpers";

const SERVICE_CATEGORIES = [
  { label: "Preventive Care",        names: ["oral consultation", "oral prophylaxis (cleaning)", "teeth whitening"] },
  { label: "Restorative Treatments", names: ["tooth filling (pasta)", "root canal treatment", "dental crowns", "crowns and bridges", "fixed bridge", "veneers"] },
  { label: "Orthodontics",           names: ["orthodontics (braces)", "braces adjustment"] },
  { label: "Prosthodontics",         names: ["dentures", "removable dentures", "ivocap dentures"] },
  { label: "Surgical / Emergency",   names: ["tooth extraction (bunot)", "odontectomy (3rd molar removal)", "emergency dental services"] },
];

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

export function LandingPage({ navigate }: { navigate: (p: string) => void }) {
  const { services, user } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);

  // Deduplicate by name (case-insensitive)
  const uniqueServices = services
    .filter((s, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase()) === i);

  // Group into categories
  const categorised = SERVICE_CATEGORIES.map((cat) => ({
    label: cat.label,
    items: uniqueServices.filter((s) => cat.names.includes(s.name.toLowerCase())),
  })).filter((c) => c.items.length > 0);
  const categorisedNames = new Set(SERVICE_CATEGORIES.flatMap((c) => c.names));
  const other = uniqueServices.filter((s) => !categorisedNames.has(s.name.toLowerCase()));
  if (other.length > 0) categorised.push({ label: "Other", items: other });

  // Flat list for "show less" toggle — first 2 categories visible by default
  const visibleCategories = showAllServices ? categorised : categorised.slice(0, 2);

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
          <nav className="hidden lg:flex items-center gap-9 text-[12px] uppercase tracking-[0.18em] text-gold-100/70 font-semibold">
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
      <section id="home" className="relative min-h-[70vh] flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <img src="/images/hero-dental.jpg" alt="" className="absolute inset-0 w-full h-full opacity-35" style={{ objectFit: "cover", objectPosition: "center center" }} />
          <div className="absolute inset-0 bg-linear-to-r from-ink-950 via-ink-950/80 to-ink-950/30" />
          <div className="absolute inset-0 bg-linear-to-t from-ink-950 via-transparent to-ink-950/60" />
          <div className="absolute inset-0 pattern-grid opacity-40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-12 gap-12 items-center w-full">
          <div className="lg:col-span-7 fade-up">
            <p className="text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.25em] text-gold-200/90 font-medium mb-8">{CLINIC.address}</p>
            <h1 className="font-serif font-light text-[2rem] sm:text-4xl lg:text-5xl xl:text-6xl leading-[0.95] tracking-tight">
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </Button>
              <a href={`tel:+63${CLINIC.phone.replace(/\D/g, "").slice(1)}`}>
                <Button size="lg" variant="outline">Call Us</Button>
              </a>
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
                Premium Care
              </div>
              <div className="absolute -bottom-4 -left-4 glass-strong px-4 py-2.5 rounded-full text-xs text-gold-100 font-medium float-slow shadow-luxe" style={{ animationDelay: "2s" }}>
                Trusted Since {CLINIC.yearFounded}
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
              <img src="/images/clinic-interior.jpg" alt="Clinic interior" className="w-full h-120 object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-linear-to-t from-ink-950/80 via-transparent to-transparent" />
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
              <FeatureBadge title={`Established ${CLINIC.yearFounded}`} subtitle="Compostela, DDO" />
              <FeatureBadge title="Licensed Doctors" subtitle="Board-certified" />
              <FeatureBadge title="Modern Equipment" subtitle="Digital workflows" />
              <FeatureBadge title="Patient-First" subtitle="Compassionate care" />
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
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-gold-shine leading-[1.1]">
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
            ].map((f) => (
              <div key={f.t} className="group relative rounded-xl glass p-7 hover:border-gold-400/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-luxe">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl group-hover:bg-gold-500/15 transition" />
                <div className="relative">
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
        <div className="space-y-8">
          {visibleCategories.map((cat) => (
            <div key={cat.label}>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold-400/70 font-semibold mb-4">{cat.label}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cat.items.map((s) => (
                  <div key={s.id} className="group relative rounded-xl overflow-hidden glass hover:border-gold-400/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-luxe">
                    <div className="p-6">
                      <h3 className="font-serif text-xl text-gold-shine leading-tight mb-3">{s.name}</h3>
                      <p className="text-sm text-gold-100/55 leading-relaxed mb-4 min-h-10">{s.description}</p>
                      <div className="flex items-end justify-between pt-4 border-t border-gold-500/15">
                        <div>
                          <div className="text-[9px] uppercase tracking-[0.25em] text-gold-300/60 mb-0.5">{s.priceMax ? "Starting at" : "Price"}</div>
                          <div className="font-serif text-xl text-gold-shine">
                            ₱{s.price.toLocaleString()}
                            {s.priceMax && <span className="text-base"> – ₱{s.priceMax.toLocaleString()}</span>}
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
                      <button onClick={() => navigate(ROUTES.book)} className="mt-4 w-full text-center text-xs uppercase tracking-[0.2em] text-gold-300 hover:text-gold-100 py-2.5 border border-gold-500/20 hover:border-gold-400 rounded-md transition-all font-medium opacity-70 group-hover:opacity-100">
                        Book This Service →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {categorised.length > 2 && (
            <Button variant="outline" onClick={() => setShowAllServices((v) => !v)}>
              {showAllServices ? "Show Less" : "View All Services"}
            </Button>
          )}
          <Button onClick={() => navigate(ROUTES.book)}>Book Appointment</Button>
        </div>
      </Section>

      {/* DOCTOR */}
      <section className="py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-gold-900/10 to-transparent" />
        <div className="max-w-6xl mx-auto relative grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-0 bg-gold-gradient rounded-2xl blur-3xl opacity-20" />
            <div className="relative rounded-2xl overflow-hidden border border-gold-500/30 shadow-luxe aspect-4/5">
              <img src="/images/doctor-portrait.png" alt="Lead dentist" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-ink-950/90 via-transparent to-transparent" />
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
            <h2 className="font-serif text-3xl md:text-4xl font-light text-gold-shine leading-[1.1]">
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

      <TestimonialsSection />

      {/* CONTACT */}
      <Section id="contact" eyebrow="Get In Touch" title={<>Visit our <span className="font-script italic">sanctuary.</span></>} subtitle="We'd love to welcome you. Reach out anytime through the channels below.">
        <div className="grid md:grid-cols-3 gap-5 stagger mb-10">
          <ContactCard label="Address" primary="Purok 12 J.P Laurel St., Poblacion" secondary="Compostela, Davao de Oro (in front of Trubank)" />
          <ContactCard label="Phone" primary={CLINIC.phone} secondary={CLINIC.hours} />
          <ContactCard label="Email" primary={CLINIC.email} secondary="Replies within 24 hours" />
        </div>
        <div className="text-center">
          <a href={CLINIC.facebookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass hover:border-gold-400/50 transition group">
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
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-linear-to-b from-gold-400 to-transparent" />
            <div className="relative">
              <Ornament className="w-32 h-3 mx-auto mb-8" />
              <h2 className="font-serif text-3xl md:text-5xl font-light text-gold-shine leading-tight">
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
                {NAV_LINKS.map(({ label, id }) => (
                  <li key={id}><a onClick={() => scrollTo(id)} className="hover:text-gold-300 transition cursor-pointer">{label}</a></li>
                ))}
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

function TestimonialsSection() {
  const { feedbacks } = useStore();
  const shown = [...feedbacks].filter((f) => f.stars >= 4).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  if (shown.length === 0) return null;
  return (
    <Section id="testimonials" eyebrow="Patient Reviews" title={<>What our patients <span className="font-script italic">say.</span></>}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
        {shown.map((f) => (
          <div key={f.id} className="glass rounded-xl p-6 flex flex-col gap-3">
            <div className="text-gold-400 text-lg">{"★".repeat(f.stars)}<span className="text-gold-100/20">{"★".repeat(5 - f.stars)}</span></div>
            <p className="text-sm text-gold-100/70 leading-relaxed flex-1">"{f.text}"</p>
            <div className="text-xs text-gold-300/60 font-medium">{f.userName}</div>
          </div>
        ))}
      </div>
    </Section>
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

function ContactCard({ label, primary, secondary }: { label: string; primary: string; secondary: string }) {
  return (
    <Card hover className="text-center p-8!">
      <div className="text-[10px] uppercase tracking-[0.3em] text-gold-300/70 mb-2 font-semibold">{label}</div>
      <div className="font-serif text-xl text-gold-shine mb-1">{primary}</div>
      <div className="text-xs text-gold-100/55">{secondary}</div>
    </Card>
  );
}
