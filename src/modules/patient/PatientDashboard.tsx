import { useState } from "react";
import { Button } from "../../components/ui";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS, ROUTES } from "../../shared/constants";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { NotificationsCenter, ProfilePage } from "../shared/SharedModules";
import { PatientTreatmentRecords } from "./PatientTreatmentRecords";
import { PatientFeedback } from "./PatientFeedback";
import { PatientHome } from "./PatientHome";
import { PatientPaymentCenter } from "./PatientPaymentCenter";

export function PatientDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user, appointments } = useStore();
  const [tab, setTab] = useState("home");

  if (!user) return null;

  const hasAppointments = appointments.some((a) => a.patientId === user.id);

  const tabs = DASHBOARD_TABS.patient.filter((t) => {
    if (!hasAppointments && (t.id === "treatment-records" || t.id === "payments")) return false;
    return true;
  });

  // If current tab was hidden, fall back to home
  const activeTab = tabs.find((t) => t.id === tab) ? tab : "home";

  const headerAction = (
    <Button size="sm" onClick={() => navigate(ROUTES.book)} className="whitespace-nowrap">
      <span className="hidden sm:inline">+ Book Appointment</span>
      <span className="sm:hidden">+ Book</span>
    </Button>
  );

  return (
    <DashboardLayout user={user} tabs={tabs} activeTab={activeTab} onTabChange={setTab} navigate={navigate} headerAction={headerAction}>
      {activeTab === "home"             && <PatientHome navigate={navigate} onTabChange={setTab} />}
      {activeTab === "my-appointments"  && <AppointmentsList role="patient" patientOnly />}
      {activeTab === "treatment-records"&& <PatientTreatmentRecords navigate={navigate} />}
      {activeTab === "payments"         && <PatientPaymentCenter />}
      {activeTab === "notifications"    && <NotificationsCenter />}
      {activeTab === "feedback"         && <PatientFeedback />}
      {activeTab === "profile"          && <ProfilePage />}
    </DashboardLayout>
  );
}
