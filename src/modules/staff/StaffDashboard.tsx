import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS } from "../../shared/constants";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { NotificationsCenter, PaymentsPage, ProfilePage } from "../shared/SharedModules";
import { StaffQueue } from "./StaffQueue";
import { StaffRecordsSupport } from "./StaffRecordsSupport";

export function StaffDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user, staffPermissions } = useStore();
  const [tab, setTab] = useState("queue");

  if (!user) return null;

  const perms = staffPermissions.find((p) => p.staffId === user.id);
  const tabs = DASHBOARD_TABS.staff.filter((t) => {
    if (t.id === "appointments" && perms && !perms.appointments) return false;
    if (t.id === "payments"     && perms && !perms.payments)     return false;
    if (t.id === "records"      && perms && !perms.records)      return false;
    return true;
  });
  const activeTab = tabs.find((t) => t.id === tab) ? tab : (tabs[0]?.id ?? "queue");

  return (
    <DashboardLayout user={user} tabs={tabs} activeTab={activeTab} onTabChange={setTab} navigate={navigate}>
      {activeTab === "queue"         && <StaffQueue />}
      {activeTab === "appointments"  && <AppointmentsList role="staff" />}
      {activeTab === "payments"      && <PaymentsPage role="staff" />}
      {activeTab === "records"       && <StaffRecordsSupport />}
      {activeTab === "notifications" && <NotificationsCenter />}
      {activeTab === "profile"       && <ProfilePage />}
    </DashboardLayout>
  );
}
