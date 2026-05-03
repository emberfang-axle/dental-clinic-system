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
import { StaffDashboard } from "./modules/staff/StaffDashboard";
import { PatientDashboard } from "./modules/patient/PatientDashboard";
import { SetupPage } from "./modules/setup/SetupPage";

export default function App() {
  const [path, setPath] = useState(() => window.location.hash.replace(/^#/, "") || ROUTES.home);
  const { user } = useStore();

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

  // Redirect /dashboard to role-specific dashboard
  if (path === ROUTES.dashboard) {
    setTimeout(() => navigate(user ? dashboardPathFor(role!) : ROUTES.login), 0);
    return null;
  }

  // Guard all /dashboard/* routes
  if (isDashboard && !user) {
    setTimeout(() => navigate(ROUTES.login), 0);
    return null;
  }
  if (isDashboard && user && !canAccessRoute(path, role)) {
    setTimeout(() => navigate(dashboardPathFor(role!)), 0);
    return null;
  }

  switch (path) {
    case ROUTES.login:        return <LoginPage navigate={navigate} />;
    case ROUTES.adminLogin:   return <AdminLoginPage navigate={navigate} />;
    case ROUTES.register:     return <RegisterPage navigate={navigate} />;
    case ROUTES.book:         return <BookAppointmentPage navigate={navigate} />;
    case "/setup":            return <SetupPage navigate={navigate} />;
    case ROUTES.adminDashboard:   return <AdminDashboard navigate={navigate} />;
    case ROUTES.doctorDashboard:  return <DoctorDashboard navigate={navigate} />;
    case ROUTES.staffDashboard:   return <StaffDashboard navigate={navigate} />;
    case ROUTES.patientDashboard: return <PatientDashboard navigate={navigate} />;
    default:                  return <LandingPage navigate={navigate} />;
  }
}
