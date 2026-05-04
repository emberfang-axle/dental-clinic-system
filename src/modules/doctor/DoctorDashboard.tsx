/**
 * Doctor dashboard — orchestrator only.
 * All sub-components live in their own files in this folder.
 */

import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS } from "../../shared/constants";
import { AppointmentsList } from "../appointment/AppointmentsList";
import {
  AuditLogsPage,
  NotificationsCenter,
  PaymentsPage,
  ProfilePage,
  ReportsPage,
  ServicesPage,
} from "../shared/SharedModules";
import { ClinicalRecords } from "./ClinicalRecords";
import { ScheduleRules } from "./ScheduleRules";
import { StaffAccounts } from "./StaffAccounts";
import { AnnouncementsPage } from "./AnnouncementsPage";

export function DoctorDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user } = useStore();
  const tabs = DASHBOARD_TABS.doctor;
  const [tab, setTab] = useState<string>(tabs[0].id);

  if (!user) return null;

  return (
    <DashboardLayout user={user} tabs={tabs} activeTab={tab} onTabChange={setTab} navigate={navigate}>
      {tab === "clinical"       && <ClinicalRecords />}
      {tab === "appointments"   && <AppointmentsList role="doctor" />}
      {tab === "announcements"  && <AnnouncementsPage />}
      {tab === "schedule"       && <ScheduleRules />}
      {tab === "payments"       && <PaymentsPage role="doctor" />}
      {tab === "services"       && <ServicesPage role="doctor" />}
      {tab === "staff"          && <StaffAccounts />}
      {tab === "reports"        && <ReportsPage />}
      {tab === "audit"          && <AuditLogsPage />}
      {tab === "notifications"  && <NotificationsCenter />}
      {tab === "profile"        && <ProfilePage />}
    </DashboardLayout>
  );
}
