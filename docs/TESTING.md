# Testing Documentation

## Estandarte Dental Clinic System

This document supports **Objective 4** (system evaluation) and panel requirements for testing evidence and analysis tables.

---

## 1. Test Environment

| Item | Value |
|------|--------|
| Application | React + Vite + TypeScript |
| Backend | Firebase (Auth, Firestore, Storage, Hosting) |
| Browser | Chrome / Edge (latest) |
| Devices | Desktop, tablet, mobile |
| Automated tests | Vitest (`npm test`) |

---

## 2. Test Types Conducted

### 2.1 Unit tests (automated)

Run:

```bash
npm install
npm test
```

| Module | What is verified |
|--------|------------------|
| `appointmentsService` | Cannot complete without clinical notes; cannot mark paid before completed; OR receipt numbering; per-doctor slot conflicts; soft cancel keeps record |

### 2.2 Functional / UAT (manual)

Use the checklist below with **patients** and **clinic staff** during pilot at Estandarte Dental Clinic.

| ID | Scenario | Steps | Expected result | Pass/Fail |
|----|----------|-------|-----------------|-----------|
| T-01 | Patient registers | Register → login | Redirect to patient dashboard | |
| T-02 | Book appointment | Service → doctor → date/time → confirm | Status **pending**, cash payment | |
| T-03 | Staff confirms | Staff queue → Confirm | Status **confirmed**, patient notified | |
| T-04 | Clinical record | Doctor → Clinical → tooth chart + notes → save | Data saved, visible in history | |
| T-05 | Complete visit | Staff → Complete (after notes exist) | Status **completed** | |
| T-06 | Cash payment | Staff → Mark Paid | Status **paid**, OR number, invoice printable | |
| T-07 | Cancel appointment | Patient → My appointments → Cancel | Status **cancelled**, slot freed | |
| T-08 | Reschedule | Patient → Reschedule once | New date/time, status **rescheduled** | |
| T-09 | Reports | Doctor → Reports | Revenue, clients, feedback visible | |
| T-10 | Pagination | Appointments list (10 per page) | Latest on top, Prev/Next, no long scroll | |

### 2.3 Security tests

| ID | Check | Expected |
|----|-------|----------|
| S-01 | Patient cannot mark own payment paid | Firestore rules block |
| S-02 | `/setup` without secret in production | Page not found |
| S-03 | Public cannot read private feedback | Only approved landing reviews |

---

## 3. Survey & User Satisfaction (Objective 4)

### UTAUT results (completed — n=31)

Full tables, respondent profile, interpretation scale, and Chapter 7/10 narrative are in **[UTAUT_RESULTS.md](./UTAUT_RESULTS.md)**.

| UTAUT construct | Weighted mean | SD | Rating |
|-----------------|--------------:|---:|--------|
| Performance Expectancy (PE) | 4.19 | 0.31 | Very Satisfactory |
| Effort Expectancy (EE) | 4.16 | 0.30 | Very Satisfactory |
| Social Influence (SI) | 4.27 | 0.26 | Very Satisfactory |
| Facilitating Conditions (FC) | 4.21 | 0.29 | Very Satisfactory |
| Behavioral Intention (BI) | 4.39 | 0.32 | Very Satisfactory |
| **Overall** | **4.24** | **0.30** | **Very Satisfactory** |

### Instruments

1. **UTAUT questionnaire** — PE, EE, SI, FC, BI (Likert 1–5); see `UTAUT_RESULTS.md`.
2. **Patient questionnaire** — ease of booking, clarity of status, trust in records (Likert 1–5).
3. **Staff questionnaire** — queue efficiency, billing speed, vs manual logbook (Likert 1–5).
4. **Doctor interview** — clinical chart (tooth diagram), daily/weekly sales dashboard.

### Sample analysis table (use your program’s format)

| Respondent | Role | Q1 Booking ease (1–5) | Q2 Status clarity (1–5) | Q3 Overall satisfaction (1–5) | Comments |
|------------|------|------------------------|-------------------------|-------------------------------|----------|
| R1 | Patient | | | | |
| R2 | Staff | | | | |
| R3 | Doctor | | | | |
| **Mean** | | | | | |
| **Interpretation** | | | | | |

### Statistical notes for thesis

- Report **mean** and **standard deviation** per question.
- Compare manual vs system using paired statements in the survey.
- Tie results to recommendations (e.g. if mean &lt; 3.5 on any item → recommend training or UI change).

---

## 4. Test Results Log (template)

| Date | Tester | Build/version | Tests run | Passed | Failed | Notes |
|------|--------|---------------|-----------|--------|--------|-------|
| | | | | | | |

---

## 5. Known limitations (document honestly)

- Cash payments only (no online payment gateway).
- Email/SMS require Firebase Cloud Functions and API keys configured.
- Google Calendar sync is optional; demo mode uses local blocked slots.

---

## 6. Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Developer | | | |
| Clinic representative | | | |
| Adviser | | | |
