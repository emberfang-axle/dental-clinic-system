import { useEffect, useState } from "react";
import { useStore } from "./store/store";
import { canAccessRoute, dashboardPathFor } from "./shared/helpers";
import { ROUTES } from "./shared/constants";
import { LandingPage } from "./modules/landing/LandingPage";
import { LoginPage, RegisterPage } from "./modules/auth/AuthPage";
import { AdminLoginPage } from "./modules/auth/AdminLoginPage";
import { BookAppointmentPage } from "./modules/appointment/BookAppointmentPage";
import { AdminDashboard } from "./modules/admin/AdminDashboard";
import { DoctorDashboard } from "./modules/doctor/DoctorDashboard";
import { CoDoctorDashboard } from "./modules/doctor/CoDoctorDashboard";
import { StaffDashboard } from "./modules/staff/StaffDashboard";
import { PatientDashboard } from "./modules/patient/PatientDashboard";
import { SetupPage } from "./modules/setup/SetupPage";
import { NotFoundPage } from "./modules/shared/NotFoundPage";
import { OfflineBanner } from "./components/OfflineBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";

type Nav = { navigate: (p: string) => void };
type PageMap = Record<string, (props: Nav) => React.ReactElement>;

const PAGES: PageMap = {
  [ROUTES.home]:             (p) => <LandingPage {...p} />,
  [ROUTES.login]:            (p) => <LoginPage {...p} />,
  [ROUTES.adminLogin]:       (p) => <AdminLoginPage {...p} />,
  [ROUTES.register]:         (p) => <RegisterPage {...p} />,
  [ROUTES.book]:             (p) => <BookAppointmentPage {...p} />,
  "/setup":                  (p) => <SetupPage {...p} />,
  [ROUTES.adminDashboard]:    (p) => <AdminDashboard {...p} />,
  [ROUTES.doctorDashboard]:   (p) => <DoctorDashboard {...p} />,
  [ROUTES.coDoctorDashboard]: (p) => <CoDoctorDashboard {...p} />,
  [ROUTES.staffDashboard]:    (p) => <StaffDashboard {...p} />,
  [ROUTES.patientDashboard]:  (p) => <PatientDashboard {...p} />,
};

export default function App() {
  const [path, setPath] = useState(() => window.location.hash.replace(/^#/, "") || ROUTES.home);
  const { user, authReady } = useStore();

  useEffect(() => {
    const onHash = () => setPath(window.location.hash.replace(/^#/, "") || ROUTES.home);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function navigate(p: string) {
    window.location.hash = p;
    setPath(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const role = user?.role;
  const isDashboard = path.startsWith(ROUTES.dashboard);

  let redirect: string | null = null;
  if (authReady) {
    if (path === ROUTES.dashboard)                        redirect = user ? dashboardPathFor(role!) : ROUTES.login;
    else if (isDashboard && !user)                        redirect = ROUTES.login;
    else if (isDashboard && !canAccessRoute(path, role))  redirect = dashboardPathFor(role!);
  }

  useEffect(() => {
    if (redirect) navigate(redirect);
  }, [redirect]);

  if (!authReady || redirect) return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
    </div>
  );

  const Page = PAGES[path];

  return (
    <ErrorBoundary>
      <OfflineBanner />
      {Page ? <Page navigate={navigate} /> : <NotFoundPage navigate={navigate} />}
    </ErrorBoundary>
  );
}
