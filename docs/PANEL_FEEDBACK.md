# Panel feedback (Billera, Tabasa, Claro) — requirements & status

Source: panel defense transcript + written follow-ups (`reference.txt`).  
**UTAUT final data:** [UTAUT_RESULTS.md](./UTAUT_RESULTS.md) (n = 31, WM = 4.24).

**Last code audit:** May 2026 — all **in-app** panel items below are implemented unless marked *thesis/manual*.

---

## System implementation checklist

| # | Panel requirement | Status | Where |
|---|-------------------|--------|--------|
| 1 | Booking stays **pending** until staff confirms | ✅ | `appointments.ts`, `BookAppointmentPage.tsx` |
| 2 | Patient notification: **Booking Received — Pending Confirmation** | ✅ | `appointments.ts` `book()` |
| 3 | Staff **Confirm** → **Appointment Confirmed ✓** | ✅ | `appointments.ts` `update()` |
| 4 | Success screen: **Pending / Request Submitted** (not “Confirmed”) | ✅ | `BookAppointmentPage.tsx` |
| 5 | Tables: latest first, **10 per page** | ✅ | `DataTable.tsx`, `sortAppointmentsLatestFirst`, `AppointmentsList.tsx` |
| 6 | Staff queue shows **Status** column | ✅ | `StaffQueue.tsx` |
| 7 | Booking: **Service → Doctor → Schedule → Confirm** (4 steps) | ✅ | `BookAppointmentPage.tsx` |
| 8 | **Multiple services** + **Select all** / category select | ✅ | `ServicePickerStep.tsx` |
| 9 | Consultation required before other treatments (modal + banner) | ✅ | `ServicePickerStep.tsx`, `BookAppointmentPage.tsx` |
| 10 | Tooth chart: **condition then click** + history | ✅ | `ToothChart.tsx`, `ClinicalRecords.tsx` |
| 11 | **Cash only** — no GCash/PayMongo | ✅ | `types.ts`, `firestore.rules`, `payments.ts` |
| 12 | Doctor **cash sales** + today summary | ✅ | `DoctorDashboard.tsx`, `DashboardWidgets.tsx` |
| 13 | **Fixed sidebar** when scrolling | ✅ | `DashboardLayout.tsx` |
| 14 | **Confirm before delete** (appointments, staff dedup, notes, notifications) | ✅ | `AppointmentsList`, `StaffQueue`, `ClinicalRecords`, `NotificationsCenter`, `StaffAccounts` |
| 14b | **Confirm before logout** | ✅ | `DashboardLayout.tsx` |
| 15 | Notifications **10 + Load more** | ✅ | `NotificationsCenter.tsx` |
| 16 | Walk-in / Facebook / SMS manual booking | ✅ | `StaffManualBooking.tsx`, staff **+ New Appointment** |
| 17 | Compact queue status counts (not oversized) | ✅ | `StaffQueue.tsx` |
| 18 | **Co-Doctor accounts** (admin/doctor) | ✅ | `StaffAccounts.tsx` |
| 19 | Admin **Generate Report** button | ✅ | `AdminDashboard.tsx` → Reports tab |
| 20 | **Profile photo** (patient, staff, admin) | ✅ | `ProfilePage.tsx`, `User.avatarUrl` |
| 21 | Email: **any provider** (not Gmail-only) | ✅ | `shared/validation.ts`, register/staff forms |
| 22 | Patient feedback **typing** (form + textarea) | ✅ | `PatientFeedback.tsx` |
| 23 | Services CRUD | ✅ | `ServicesPage.tsx` |
| 24 | Landing: no GCash “Secure Payments” | ✅ | `LandingPage.tsx` → “Secure Records” |
| 25 | SMS integration | ⏳ *Planned* | Admin Integrations shows **Planned**; not in Cloud Functions |
| 26 | **Live deploy** (not localhost) | ⏳ *Ops* | [DEPLOYMENT.md](./DEPLOYMENT.md), [LIVE_URLS.md](./LIVE_URLS.md) |

---

## Notifications & appointment status

| Feedback | Response |
|----------|----------|
| “Na confirm dayun…” — confirmed too early | Booking **`pending`**; patient: **Booking Received — Pending Confirmation**; staff **Confirm** → **Appointment Confirmed ✓** |
| Success screen looked “Confirmed” | **Pending Confirmation / Request Submitted** |

---

## Tables, pagination, latest first

| Feedback | Response |
|----------|----------|
| Latest on top, no long scroll | `DataTable` + `sortAppointmentsLatestFirst` (10/page) |
| Status in table | Staff queue + appointment lists |

---

## Booking flow

| Feedback | Response |
|----------|----------|
| Select **service** first | Step 1 Service → 2 Doctor → 3 Schedule → 4 Confirm |
| **Multiple services** + select all | Multi-select, **Select all**, **Select category**, search & filters |
| Bookings not visible on localhost | Use **deployed Firebase URL** |

---

## Clinical / billing / UI

| Feedback | Response |
|----------|----------|
| Tooth chart: condition → click teeth | `ToothChart.tsx` |
| Cash only | `paymentMethod: cash` only |
| Doctor daily sales | Cash Sales Report + Today’s Summary |
| Fixed sidebar | `DashboardLayout` `fixed` + `lg:ml-60` |
| Delete confirmations | Modals across appointments, staff, clinical, notifications |
| Notification lag | Load 10 + **Load more** |

---

## reference.txt extras (same panel)

| Item | Status |
|------|--------|
| Remove GCash from dashboard copy | ✅ |
| Patient feedback typing | ✅ |
| Book 2+ or all services | ✅ |
| Walk-in form | ✅ |
| Co-Doctor accounts | ✅ |
| Generate report button | ✅ |
| Profile pictures | ✅ |
| Non-Gmail emails allowed | ✅ |

---

## Thesis / manual only

1. Chapter 7 test count: repo has **9** unit tests (not 47).  
2. Rename **“Kanban”** → **Appointment queue (table)** in thesis screenshots.  
3. **SMS**: document as future work in limitations (app labels it Planned).  
4. UTAUT n=31, WM=4.24 in thesis §10.3 — see [UTAUT_RESULTS.md](./UTAUT_RESULTS.md).

---

## Demo checklist for panel

1. Open **live URL** (https://dental-clinic-system-8ec1c.web.app).  
2. Patient books → **pending** → pending notification.  
3. Staff queue → table, latest on top → **Confirm** → confirmed notification.  
4. Complete → **Mark Paid** (cash) → doctor sales widget updates.  
5. Clinical records → tooth chart + history.  
6. Show **Select all** / multi-service booking and profile photo upload.

---

## Docs

- [PAGE_DOCUMENTATION.md](./PAGE_DOCUMENTATION.md)  
- [TESTING.md](./TESTING.md)  
- [DEPLOYMENT.md](./DEPLOYMENT.md)  
- [ALIGNMENT_AUDIT.md](./ALIGNMENT_AUDIT.md)
