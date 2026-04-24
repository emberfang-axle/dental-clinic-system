import { useEffect, useState } from "react";

import { useStore } from "./store/store";
import { canAccessRoute, dashboardPathFor } from "./shared/helpers";
import { ROUTES } from "./shared/constants";


import { LandingPage } from "./modules/landing/LandingPage";
import { LoginPage, RegisterPage } from "./modules/auth/AuthPage";
import { BookAppointmentPage } from "./modules/appointment/BookAppointmentPage";
import { DoctorDashboard } from "./modules/doctor/DoctorDashboard";
import { StaffDashboard } from "./modules/staff/StaffDashboard";
import { PatientDashboard } from "./modules/patient/PatientDashboard";

export default function App() {
  const [path, setPath] = useState<string>(
    () => window.location.hash.replace(/^#/, "") || ROUTES.home
  );

  const { user } = useStore();

  useEffect(() => {
    const onHash = () =>
      setPath(window.location.hash.replace(/^#/, "") || ROUTES.home);

    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function navigate(p: string) {
    window.location.hash = p;
    setPath(p);
    window.scrollTo({ top: 0 });
  }

  /* ─────────── Safe user check ─────────── */
  const role = user?.role;

  /* ─────────── Route guards ─────────── */

  if (path === ROUTES.dashboard) {
    if (!user || !role) {
      setTimeout(() => navigate(ROUTES.login), 0);
      return null;
    }

    setTimeout(() => navigate(dashboardPathFor(role)), 0);
    return null;
  }

  const isDashboardRoute = path.startsWith(ROUTES.dashboard);

  if (isDashboardRoute && !user) {
    setTimeout(() => navigate(ROUTES.login), 0);
    return null;
  }

  if (isDashboardRoute && user && !canAccessRoute(path, role)) {
    setTimeout(() => navigate(dashboardPathFor(role!)), 0);
    return null;
  }

  /* ─────────── Public routes ─────────── */

  if (path === ROUTES.login)
    return <LoginPage navigate={navigate} />;

  if (path === ROUTES.register)
    return <RegisterPage navigate={navigate} />;

  if (path === ROUTES.book)
    return <BookAppointmentPage navigate={navigate} />;

  /* ─────────── Dashboards ─────────── */

  if (path === ROUTES.doctorDashboard)
    return <DoctorDashboard navigate={navigate} />;

  if (path === ROUTES.staffDashboard)
    return <StaffDashboard navigate={navigate} />;

  if (path === ROUTES.patientDashboard)
    return <PatientDashboard navigate={navigate} />;

  /* ─────────── Default ─────────── */

  return <LandingPage navigate={navigate} />;
}