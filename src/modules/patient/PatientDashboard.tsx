import { useState } from "react";
import { Button } from "../../components/ui";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS, ROUTES } from "../../shared/constants";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { NotificationsCenter, ProfilePage } from "../shared/SharedModules";
import { PatientPaymentCenter } from "./PatientPaymentCenter";
import { PatientTreatmentRecords } from "./PatientTreatmentRecords";
import { PatientFeedback } from "./PatientFeedback";

export function PatientDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user } = useStore();
  const [tab, setTab] = useState(DASHBOARD_TABS.patient[0].id);

  if (!user) return null;

  const headerAction = (
    <Button size="sm" onClick={() => navigate(ROUTES.book)} className="whitespace-nowrap">
      <span className="hidden sm:inline">+ Book Appointment</span>
      <span className="sm:hidden">+ Book</span>
    </Button>
  );

  return (
    <DashboardLayout user={user} tabs={DASHBOARD_TABS.patient} activeTab={tab} onTabChange={setTab} navigate={navigate} headerAction={headerAction}>
      {tab === "my-appointments"   && <AppointmentsList role="patient" patientOnly />}
      {tab === "payment-center"    && <PatientPaymentCenter />}
      {tab === "treatment-records" && <PatientTreatmentRecords />}
      {tab === "notifications"     && <NotificationsCenter />}
      {tab === "feedback"          && <PatientFeedback />}
      {tab === "profile"           && <ProfilePage />}
    </DashboardLayout>
  );
}
