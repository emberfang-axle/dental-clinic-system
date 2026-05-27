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
    window.scrollTo({ top: 0 });
  }

  const role = user?.role;
  const isDashboard = path.startsWith(ROUTES.dashboard);

  // Resolve redirect target synchronously
  let redirect: string | null = null;
  if (path === ROUTES.dashboard)          redirect = user ? dashboardPathFor(role!) : ROUTES.login;
  else if (isDashboard && !user)          redirect = ROUTES.login;
  else if (isDashboard && !canAccessRoute(path, role)) redirect = dashboardPathFor(role!);

  useEffect(() => { if (redirect) navigate(redirect); }, [redirect]);

  if (!authReady) return null;
  if (redirect) return null;

  const setupSecret = import.meta.env.VITE_SETUP_SECRET as string | undefined;
  const urlKey = new URLSearchParams(window.location.search).get("setup_key");
  const setupAllowed =
    import.meta.env.DEV ||
    user?.role === "admin" ||
    user?.role === "doctor" ||
    (!!setupSecret && urlKey === setupSecret);

  const PAGES: Record<string, JSX.Element> = {
    [ROUTES.home]:             <LandingPage navigate={navigate} />,
    [ROUTES.login]:            <LoginPage navigate={navigate} />,
    [ROUTES.adminLogin]:       <AdminLoginPage navigate={navigate} />,
    [ROUTES.register]:         <RegisterPage navigate={navigate} />,
    [ROUTES.book]:             <BookAppointmentPage navigate={navigate} />,
    "/setup":                  setupAllowed ? <SetupPage navigate={navigate} /> : <NotFoundPage navigate={navigate} />,
    [ROUTES.adminDashboard]:   <AdminDashboard navigate={navigate} />,
    [ROUTES.doctorDashboard]:  <DoctorDashboard navigate={navigate} />,
    [ROUTES.coDoctorDashboard]: <CoDoctorDashboard navigate={navigate} />,
    [ROUTES.staffDashboard]:   <StaffDashboard navigate={navigate} />,
    [ROUTES.patientDashboard]: <PatientDashboard navigate={navigate} />,
  };

  if (isDashboard && !PAGES[path] && user && role) {
    navigate(dashboardPathFor(role));
    return null;
  }

  return (
    <>
      <OfflineBanner />
      {PAGES[path] ?? <NotFoundPage navigate={navigate} />}
    </>
  );
}
