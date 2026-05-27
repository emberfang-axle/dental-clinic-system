# API & Navigation Routes

## Frontend Routes (Hash-based SPA)

These are client-side routes handled by `App.tsx` via `window.location.hash`.

| Route | Component | Access |
|---|---|---|
| `/` | `LandingPage` | Public |
| `/login` | `LoginPage` | Public |
| `/admin-login` | `AdminLoginPage` | Public |
| `/register` | `RegisterPage` | Public |
| `/book` | `BookAppointmentPage` | Authenticated patients |
| `/setup` | `SetupPage` | First-run setup |
| `/dashboard/admin` | `AdminDashboard` | Admin, Doctor |
| `/dashboard/doctor` | `DoctorDashboard` | Doctor, Co-Doctor |
| `/dashboard/co-doctor` | `CoDoctorDashboard` | Co-Doctor |
| `/dashboard/staff` | `StaffDashboard` | Staff |
| `/dashboard/patient` | `PatientDashboard` | Patient |

---

## Firebase Cloud Functions (HTTPS Callable)

These are **callable functions** (not REST endpoints). They are invoked from the frontend via the Firebase SDK (`httpsCallable`), not via direct HTTP GET/POST.

### `POST` — `sendEmail`
**File:** `functions/src/email.ts`  
**Trigger:** `onCall` (HTTPS Callable)  
**Auth required:** No (but validates payload)  
**Purpose:** Sends transactional emails via Gmail OAuth2.

**Payload types:**
| `type` | Description | Required fields |
|---|---|---|
| `booking` | New appointment booked | `patientEmail`, `patientName`, `serviceName`, `date`, `time`, `doctor` |
| `confirmed` | Appointment confirmed by staff | `patientEmail`, `patientName`, `serviceName`, `date`, `time` |
| `completed` | Appointment completed | `patientEmail`, `patientName`, `serviceName` |
| `cancelled` | Appointment cancelled | `patientEmail`, `patientName`, `serviceName`, `date`, `time` |
| `rescheduled` | Appointment rescheduled | `patientEmail`, `patientName`, `serviceName`, `date`, `time` |
| `payment` | Payment confirmed | `patientEmail`, `patientName`, `serviceName`, `price`, `receiptNumber?` |
| `reminder` | Day-before reminder | `patientEmail`, `patientName`, `serviceName`, `date`, `time`, `doctor?` |
| `followup` | Post-visit follow-up | `patientEmail`, `patientName`, `serviceName` |
| `announcement` | Clinic announcement blast | `toEmail`, `title`, `body` |

---

### `POST` — `deleteAuthUser`
**File:** `functions/src/index.ts`  
**Trigger:** `onCall` (HTTPS Callable)  
**Auth required:** Yes — caller must be `doctor` or `admin`  
**Purpose:** Deletes a Firebase Auth user and their Firestore document.

**Request payload:**
```json
{ "uid": "<firebase-auth-uid>" }
```

**Response:**
```json
{ "success": true }
```

---

### `POST` — `calendarCreate`
**File:** `functions/src/calendar.ts`  
**Trigger:** `onCall` (HTTPS Callable)  
**Auth required:** Yes  
**Purpose:** Creates a Google Calendar event for a booked appointment.

---

### `POST` — `calendarDelete`
**File:** `functions/src/calendar.ts`  
**Trigger:** `onCall` (HTTPS Callable)  
**Auth required:** Yes  
**Purpose:** Deletes a Google Calendar event when an appointment is cancelled.

---

## Firestore Collections (GET/POST via SDK)

All reads and writes go through the Firebase Firestore SDK (not REST). The frontend service layer in `src/services/` wraps these operations.

| Collection | Service file | Operations |
|---|---|---|
| `appointments` | `src/services/appointments.ts` | GET (list, query), POST (create), PATCH (update), DELETE |
| `users` | `src/services/auth.ts` | GET (by UID), POST (create on register), PATCH (update profile) |
| `services` | `src/services/catalog.ts` | GET (list), POST (create), PATCH, DELETE |
| `notifications` | `src/services/notifications.ts` | GET (by userId), POST (create), PATCH (mark read) |
| `announcements` | `src/services/announcements.ts` | GET (list), POST (create), DELETE |
| `payments` | `src/services/payments.ts` | GET (list), POST (create), PATCH |
| `records` | `src/services/records.ts` | GET (by patientId), POST (create), PATCH |
| `waitlist` | `src/services/waitlist.ts` | GET (list), POST (join), DELETE (remove) |
| `feedback` | `src/services/feedback.ts` | GET (list), POST (submit) |
| `doctorSchedules` | `src/services/settings.ts` | GET, POST/PATCH |
| `settings` | `src/services/settings.ts` | GET (singleton), PATCH |
| `auditLogs` | (in-store, synced) | GET (list) |

---

## How to Call a Cloud Function (Frontend)

```ts
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const sendEmail = httpsCallable(functions, "sendEmail");

await sendEmail({
  type: "booking",
  patientEmail: "patient@example.com",
  patientName: "Juan Dela Cruz",
  serviceName: "Oral Consultation",
  date: "2026-05-30",
  time: "09:00",
  doctor: "Dr. Estandarte",
});
```
