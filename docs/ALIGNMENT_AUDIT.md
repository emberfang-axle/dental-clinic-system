# System vs. documentation alignment audit

**Date:** May 2026  
**UTAUT sample:** n = 31, overall WM = 4.24 (Very Satisfactory) — see [UTAUT_RESULTS.md](./UTAUT_RESULTS.md)

---

## Summary

| Status | Count |
|--------|------:|
| Fully aligned | 10 |
| Partial (config / thesis wording) | 5 |
| Doc-only / not in code | 2 |

Core thesis features (appointments, cash billing, clinical records, service catalog, paginated queues) **match the implemented system**. Remaining gaps are mostly **thesis chapter wording** (test count, Kanban label, SMS) rather than missing application features.

---

## Alignment table

| Area | Documentation | System | Match |
|------|---------------|--------|-------|
| Objective 1 — Scheduling | Book, cancel, reschedule | `appointmentsService`, `BookAppointmentPage`, staff queue | Yes |
| Objective 2 — Billing + DB | Invoices, OR, unified Firestore | Cash-only mark paid, `OR-YYYY-####`, `PaymentsPage` | Yes |
| Objective 3 — Three modules | Appointment, billing, records | Appointments, payments, `ClinicalRecords` | Yes |
| Objective 4 — Evaluation | UTAUT n=31, WM 4.24 | `docs/UTAUT_RESULTS.md`, in-app feedback & reports | Yes |
| Cash only (panel) | No GCash | `PaymentMethod: cash`, Firestore rules | Yes |
| Paginated tables | Latest first, 10/page | `DataTable`, `sortAppointmentsLatestFirst` | Yes |
| Tooth chart | FDI clinical chart | `ToothChart.tsx` in clinical records | Yes |
| Services catalog | 21 procedures | `src/shared/serviceCatalog.ts` | Yes |
| Clinic contact | Purok 12, phone, email | `src/shared/constants.ts` `CLINIC` | Yes |
| UTAUT results | n=31, WM 4.24 | `docs/UTAUT_RESULTS.md`, thesis §10.3 updated | Yes |
| Automated tests | Thesis Ch. 7: **9** unit tests + manual UAT | **9** tests in `appointments.test.ts` | Yes |
| Staff queue UI | Thesis: **Staff appointment queue (table)** | Status cards + **paginated table** | Yes |
| Chapter 7 present | Ch. 6 → Ch. 7 → Ch. 8 | Inserted in thesis docx | Yes |
| SMS notifications | Mentioned in integrations | Not in Cloud Functions | No — mark optional in thesis |
| Email / calendar | Optional integrations | Needs deployed Firebase functions | Partial |
| In-app UTAUT form | Appendix H instrument | Paper/online survey (not in app) | Partial — state method in thesis |

---

## Automated tests

```bash
npm test
```

Current: **9 passed** (1 file: `src/tests/appointments.test.ts`).

---

## Source of truth

| Topic | File |
|-------|------|
| UTAUT statistics | `docs/UTAUT_RESULTS.md` |
| UAT checklist | `docs/TESTING.md` |
| Services & prices | `src/shared/serviceCatalog.ts` |
| Clinic info | `src/shared/constants.ts` |
| Thesis document | `3k_DENTAL-CLINIC-APPPOINTMENT-AND-BILLING-SYSTEM.docx` |

---

## Recommended thesis edits (manual review)

1. **Re-open thesis docx** in Word and refresh fields/table of contents if your school requires it.
2. **Deploy live URL** for panel demo (not localhost).
3. **Appendix screenshots:** Capture actual UI per [PAGE_DOCUMENTATION.md](./PAGE_DOCUMENTATION.md).
