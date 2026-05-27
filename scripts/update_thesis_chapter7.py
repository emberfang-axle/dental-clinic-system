"""Insert Chapter 7, fix test counts (9), Kanban labels, Appendix J, SMS note."""
from __future__ import annotations

import re
from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.shared import Pt

ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "3k_DENTAL-CLINIC-APPPOINTMENT-AND-BILLING-SYSTEM.docx"

CHAPTER_7_PARAS = [
    ("CHAPTER 7", True),
    ("SYSTEM TESTING AND VALIDATION", True),
    (
        "This chapter presents the testing strategy, automated unit test results, manual user "
        "acceptance testing (UAT), and the UTAUT-based user evaluation conducted for the "
        "Estandarte Dental Clinic Appointment and Billing System.",
        False,
    ),
    ("7.1 Testing Strategy", True),
    (
        "Testing followed a bottom-up, risk-based approach aligned with the system architecture "
        "(React SPA frontend, Firebase Auth, Firestore, optional Cloud Functions). Automated "
        "Vitest unit tests verify critical appointment and billing rules. Manual UAT was "
        "conducted with clinic staff and patients using the checklist in Appendix G and the "
        "survey instrument in Appendix H. User acceptance was measured using the Unified Theory "
        "of Acceptance and Use of Technology (UTAUT) with thirty-one (31) respondents.",
        False,
    ),
    ("7.2 Automated Unit Testing", True),
    (
        "Automated tests were executed using Vitest 3.2.4 in the development environment "
        "(Node.js). The test suite focuses on appointment service rules that protect data "
        "integrity and billing workflow.",
        False,
    ),
    ("Table 7.1 Automated Test Summary", True),
    (
        "Test Files: 1 passed | Tests: 9 passed | Duration: under 2 seconds | Build: PASSED (npm run build).",
        False,
    ),
    ("The following test cases were implemented and passed:", False),
    (
        "TC-01 — Cannot complete appointment without clinical notes (diagnosis/treatment record).",
        False,
    ),
    (
        "TC-02 — Can complete appointment when diagnosis is present.",
        False,
    ),
    (
        "TC-03 — Cannot mark payment paid before appointment is completed.",
        False,
    ),
    (
        "TC-04 — Can mark paid when appointment is completed.",
        False,
    ),
    (
        "TC-05 — First paid appointment receives OR receipt number (OR-YYYY-#### format).",
        False,
    ),
    (
        "TC-06 — Second paid appointment increments OR sequence.",
        False,
    ),
    (
        "TC-07 — isSlotTaken returns true when same date, time, and doctor are booked.",
        False,
    ),
    (
        "TC-08 — isSlotTaken returns false for different date or time.",
        False,
    ),
    (
        "TC-09 — Cancelled appointments do not block the time slot.",
        False,
    ),
    (
        "Additional security, RBAC, and integration tests are documented as recommended manual "
        "and deployment checks in Section 7.3. The thesis does not claim forty-seven (47) "
        "automated tests; the repository currently contains nine (9) focused unit tests in "
        "src/tests/appointments.test.ts.",
        False,
    ),
    ("7.3 Manual User Acceptance Testing (UAT)", True),
    (
        "Manual UAT was performed with patients and staff following the scenarios in Table 7.2 "
        "(registration, booking with service selection, staff queue confirmation, clinical "
        "records with tooth chart, cash payment and invoice, paginated appointment tables with "
        "latest records on top). All critical paths were verified in the development and pilot "
        "environment.",
        False,
    ),
    ("Table 7.2 Manual UAT Scenarios (Summary)", True),
    (
        "T-01 Patient registration — PASS | T-02 Book appointment (pending status) — PASS | "
        "T-03 Staff confirms appointment — PASS | T-04 Clinical record and tooth chart — PASS | "
        "T-05 Complete visit — PASS | T-06 Cash payment and OR receipt — PASS | "
        "T-07 Cancel appointment — PASS | T-08 Reschedule — PASS | T-09 Reports and pagination — PASS.",
        False,
    ),
    ("7.4 UTAUT User Evaluation", True),
    (
        "The UTAUT survey (Appendix H) was administered to thirty-one (31) respondents "
        "(twenty-nine patients, two staff). Construct weighted means: Performance Expectancy "
        "4.19, Effort Expectancy 4.16, Social Influence 4.27, Facilitating Conditions 4.21, "
        "Behavioral Intention 4.39. Overall weighted mean = 4.24 (Very Satisfactory). "
        "Complete item-level tables, respondent profile, and narrative are in Section 10.3 "
        "and Appendix I.",
        False,
    ),
    ("7.5 System Limitations Noted During Testing", True),
    (
        "SMS notifications were not implemented in the pilot build; in-app and email "
        "notifications are used where configured. The system requires deployment to Firebase "
        "Hosting or Vercel with a live Firestore database for multi-user access; localhost "
        "development is for testing only. Online payment gateways (e.g., PayMongo) were "
        "excluded; billing is cash-only at the clinic counter, per clinic preference.",
        False,
    ),
]

TABLE_7_1 = [
    ["Metric", "Result"],
    ["Test framework", "Vitest 3.2.4"],
    ["Test files", "1 (appointments.test.ts)"],
    ["Tests executed", "9"],
    ["Tests passed", "9"],
    ["Tests failed", "0"],
    ["Production build", "PASSED (npm run build)"],
]

KANBAN_REPLACEMENTS = [
    ("Kanban queue", "staff appointment queue (paginated table)"),
    ("Kanban board", "staff appointment queue (paginated table)"),
    ("Kanban Queue", "Staff Appointment Queue (table)"),
    ("Kanban queue board", "staff appointment queue table"),
    ("through a Kanban board", "through a paginated staff appointment queue table"),
    ("Kanban board with status columns", "paginated queue table with status columns (Pending, Confirmed, In Progress, Completed)"),
]

TEST_REPLACEMENTS = [
    ("47 passed, 0 failed", "9 passed, 0 failed"),
    ("Tests: 47 passed", "Tests: 9 passed"),
    ("Test Files: 5 passed | Tests: 47 passed", "Test Files: 1 passed | Tests: 9 passed"),
    ("forty-seven (47)", "nine (9)"),
    ("47 automated tests", "9 automated unit tests"),
    ("5 passed | Tests: 47", "1 passed | Tests: 9"),
    ("Jest, React Testing Library", "Vitest"),
]


def add_para_before(ref, text: str, bold: bool = False):
    new_el = deepcopy(ref._element)
    ref._element.addprevious(new_el)
    from docx.text.paragraph import Paragraph

    p = Paragraph(new_el, ref._parent)
    p.clear()
    r = p.add_run(text)
    r.font.size = Pt(11)
    if bold:
        r.bold = True
    return p


def add_table_before(ref, rows: list[list[str]]):
    doc = ref.part.document
    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    table.style = "Table Grid"
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            table.rows[ri].cells[ci].text = val
    ref._element.addprevious(table._tbl)


def chapter7_exists(doc: Document) -> bool:
    return any(p.text.strip() == "CHAPTER 7" for p in doc.paragraphs)


def insert_chapter7(doc: Document):
    anchor = None
    for p in doc.paragraphs:
        if p.text.strip() == "CHAPTER 8":
            anchor = p
            break
    if not anchor:
        raise SystemExit("CHAPTER 8 not found")

    # Insert in reverse order before CHAPTER 8
    blocks: list[tuple[str, bool, str | None]] = []
    for text, bold in reversed(CHAPTER_7_PARAS):
        blocks.append((text, bold, None))
    # Insert table after "Table 7.1" heading - handle specially
    for text, bold, _ in blocks:
        add_para_before(anchor, text, bold=bold)
    for p in doc.paragraphs:
        if p.text.strip() == "Table 7.1 Automated Test Summary":
            doc = p.part.document
            table = doc.add_table(rows=len(TABLE_7_1), cols=len(TABLE_7_1[0]))
            table.style = "Table Grid"
            for ri, row in enumerate(TABLE_7_1):
                for ci, val in enumerate(row):
                    table.rows[ri].cells[ci].text = val
            p._element.addnext(table._tbl)
            break


def replace_in_paragraphs(doc: Document):
    for p in doc.paragraphs:
        t = p.text
        orig = t
        for old, new in KANBAN_REPLACEMENTS:
            t = t.replace(old, new)
        for old, new in TEST_REPLACEMENTS:
            t = t.replace(old, new)
        if re.search(r"\b47\s+passed\b", t, re.I):
            t = re.sub(r"\b47\s+passed\b", "9 passed", t, flags=re.I)
        if t != orig:
            p.text = t

    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    t = p.text
                    orig = t
                    for old, new in KANBAN_REPLACEMENTS + TEST_REPLACEMENTS:
                        t = t.replace(old, new)
                    if t != orig:
                        p.text = t


def update_appendix_j(doc: Document):
    for p in doc.paragraphs:
        if "Appendix J" in p.text and "Screenshot" in p.text:
            p.text = "Appendix J — Sample Screenshots of the System"
        if "Kanban" in p.text:
            p.text = p.text.replace("Kanban Queue", "Staff Appointment Queue (table)")
            p.text = p.text.replace("Kanban", "Staff appointment queue (table)")
        if p.text.strip().startswith("(Screenshots of"):
            p.text = (
                "(Screenshots of the Admin Dashboard, Doctor Dashboard, Staff Dashboard, "
                "Patient Dashboard, Appointment Booking Wizard (4-step service selection), "
                "Staff Appointment Queue (paginated table with status columns), Clinical Records "
                "Interface with tooth chart, and Cash Payment / Invoice screens.)"
            )


def main():
    doc = Document(DOCX)
    if not chapter7_exists(doc):
        insert_chapter7(doc)
        print("Inserted Chapter 7")
    else:
        print("Chapter 7 already present")
    replace_in_paragraphs(doc)
    update_appendix_j(doc)
    doc.save(DOCX)
    print("Saved:", DOCX)


if __name__ == "__main__":
    main()
