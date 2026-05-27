import { DoctorDashboard } from "./DoctorDashboard";

/** Co-doctors (Dr. Kim Precioso, Dr. Mary Ann Ransas) — routed at /dashboard/co-doctor */
export function CoDoctorDashboard({ navigate }: { navigate: (p: string) => void }) {
  return <DoctorDashboard navigate={navigate} />;
}
