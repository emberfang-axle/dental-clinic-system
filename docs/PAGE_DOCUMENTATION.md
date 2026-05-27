# Page Documentation (Screenshot Guide)

For panel review (Hyacinth Faye A. Tabasa): **one section per page** with screenshot placeholder and description. Export to PDF for submission.

**How to capture:** Run `npm run dev` or use deployed URL → set browser to 1440×900 → screenshot each route while logged in as the role indicated.

---

## Public pages

### 1. Landing page (`/`)

**Screenshot:** `[Insert: landing-hero.png]`

**Description:** Public marketing page for Estandarte Dental Clinic. Shows services, testimonials (approved reviews only), clinic contact, and buttons for Login and Book Appointment. No patient data exposed.

---

### 2. Login (`#/login`)

**Screenshot:** `[Insert: login.png]`

**Description:** Email/password and Google sign-in. Redirects to role dashboard after Firebase authentication.

---

### 3. Register (`#/register`)

**Screenshot:** `[Insert: register.png]`

**Description:** Patient self-registration; creates Firebase Auth user and patient profile.

---

### 4. Book appointment (`#/book`) — Patient

**Screenshot:** `[Insert: book-appointment.png]`

**Description:** Four-step wizard: service → dentist → date/time (per-doctor slots) → review. Payment shown as **cash at clinic**. Creates appointment with status **pending**.

---

## Patient dashboard (`#/dashboard/patient`)

### 5. Patient home

**Screenshot:** `[Insert: patient-home.png]`

**Description:** Upcoming appointment summary, quick actions, feedback prompt after completed visits.

### 6. My appointments

**Screenshot:** `[Insert: patient-appointments.png]`

**Description:** **Data table** with pagination; latest bookings on top. Columns: date, service, doctor, status, payment. Expand row for reschedule/cancel (once).

### 7. Payment center

**Screenshot:** `[Insert: patient-payments.png]`

**Description:** Table of appointments with payment status (Unpaid/Paid). Download invoice when staff has marked **paid**.

### 8. Treatment records

**Screenshot:** `[Insert: patient-records.png]`

**Description:** Read-only view of clinical notes from completed visits.

### 9. Feedback

**Screenshot:** `[Insert: patient-feedback.png]`

**Description:** Star rating and comments for clinic evaluation (thesis survey support).

---

## Staff dashboard (`#/dashboard/staff`)

### 10. Staff overview

**Screenshot:** `[Insert: staff-overview.png]`

**Description:** Counts for today, pending confirmations, unpaid completed visits.

### 11. Appointment queue

**Screenshot:** `[Insert: staff-queue.png]`

**Description:** **Paginated data table** — latest first. Status column (pending, confirmed, etc.). Actions: Confirm → Check in → Complete → Mark cash paid.

### 12. Payments

**Screenshot:** `[Insert: staff-payments.png]`

**Description:** Tables for unpaid completed (cash) and paid transactions with receipt numbers and print invoice.

### 13. Manual booking

**Screenshot:** `[Insert: staff-manual-booking.png]`

**Description:** Walk-in / Facebook / SMS bookings entered by staff.

---

## Doctor dashboard (`#/dashboard/doctor`)

### 14. Doctor overview

**Screenshot:** `[Insert: doctor-overview.png]`

**Description:** Today’s schedule, **today’s summary** (clients + cash revenue), **7-day cash sales table**, weekly calendar.

### 15. Appointments

**Screenshot:** `[Insert: doctor-appointments.png]`

**Description:** Full clinic appointment table with filters and pagination.

### 16. Clinical records

**Screenshot:** `[Insert: doctor-clinical.png]`

**Description:** Appointment picker table + tabs: Progress notes, **Tooth chart** (select condition + click teeth), Clinical notes, **Visit history** table.

### 17. Reports & analytics

**Screenshot:** `[Insert: doctor-reports.png]`

**Description:** Revenue, appointment stats, completion rate, patient feedback charts — for thesis analysis.

### 18. Audit logs

**Screenshot:** `[Insert: doctor-audit.png]`

**Description:** Who changed what (bookings, payments, clinical notes) for accountability.

---

## Items removed per panel

| Removed | Reason |
|---------|--------|
| GCash / PayMongo | Clinic prefers **cash only**; simpler for doctor |
| Long scrolling lists | Replaced with **data tables + pagination** |

---

## Submission checklist

- [ ] All screenshots inserted above
- [ ] Live URL written on cover page
- [ ] `TESTING.md` filled with survey results table
- [ ] `PROCESS_FLOW.md` included in chapter 3
- [ ] `DEPLOYMENT.md` proof (Firebase Hosting URL screenshot)
