"""Fix reversed Chapter 7 paragraph order in thesis docx."""
from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.shared import Pt

ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "3k_DENTAL-CLINIC-APPPOINTMENT-AND-BILLING-SYSTEM.docx"

# Forward order
PARAS = [
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
        "conducted with clinic staff and patients. User acceptance was measured using UTAUT "
        "with thirty-one (31) respondents (see Section 10.3 and Appendix I).",
        False,
    ),
    ("7.2 Automated Unit Testing", True),
    (
        "Automated tests were executed using Vitest 3.2.4 (Node.js). The repository contains "
        "nine (9) unit tests in src/tests/appointments.test.ts covering appointment completion, "
        "cash payment rules, OR receipt numbering, and per-doctor slot conflicts.",
        False,
    ),
    ("Table 7.1 Automated Test Summary", True),
    (
        "Test Files: 1 passed | Tests: 9 passed | Duration: under 2 seconds | Build: PASSED.",
        False,
    ),
    ("The following test cases passed:", False),
    ("TC-01 — Cannot complete without clinical notes.", False),
    ("TC-02 — Can complete when diagnosis is present.", False),
    ("TC-03 — Cannot mark paid before completed.", False),
    ("TC-04 — Can mark paid when completed.", False),
    ("TC-05 — First paid appointment receives OR-YYYY-#### receipt.", False),
    ("TC-06 — Second paid appointment increments OR sequence.", False),
    ("TC-07 — isSlotTaken when same date/time/doctor.", False),
    ("TC-08 — isSlotTaken false for different slot.", False),
    ("TC-09 — Cancelled appointments free the slot.", False),
    (
        "The thesis reports nine (9) automated unit tests, not forty-seven (47). Additional "
        "RBAC and integration checks are covered under manual UAT.",
        False,
    ),
    ("7.3 Manual User Acceptance Testing (UAT)", True),
    (
        "Manual UAT followed scenarios T-01 through T-09: registration, booking (pending status), "
        "staff queue table confirmation, clinical records with tooth chart, cash payment, "
        "pagination with latest records on top.",
        False,
    ),
    ("Table 7.2 Manual UAT Scenarios (Summary)", True),
    (
        "T-01 Registration — PASS | T-02 Book (pending) — PASS | T-03 Staff confirm — PASS | "
        "T-04 Clinical/tooth chart — PASS | T-05 Complete — PASS | T-06 Cash paid — PASS | "
        "T-07 Cancel — PASS | T-08 Reschedule — PASS | T-09 Pagination — PASS.",
        False,
    ),
    ("7.4 UTAUT User Evaluation", True),
    (
        "UTAUT survey (Appendix H): n = 31 (29 patients, 2 staff). Overall WM = 4.24 (Very "
        "Satisfactory). Highest: Behavioral Intention (4.39). See Section 10.3 and Appendix I.",
        False,
    ),
    ("7.5 System Limitations Noted During Testing", True),
    (
        "SMS was not implemented; in-app/email notifications used where configured. System "
        "requires online deployment (Firebase/Vercel) for shared access. Billing is cash-only.",
        False,
    ),
]

TABLE = [
    ["Metric", "Result"],
    ["Framework", "Vitest 3.2.4"],
    ["Test files", "1"],
    ["Tests", "9 passed, 0 failed"],
    ["Build", "PASSED"],
]


def add_before(ref, text, bold=False):
    el = deepcopy(ref._element)
    ref._element.addprevious(el)
    from docx.text.paragraph import Paragraph

    p = Paragraph(el, ref._parent)
    p.clear()
    r = p.add_run(text)
    r.font.size = Pt(11)
    if bold:
        r.bold = True
    return p


def main():
    doc = Document(DOCX)
    ch8 = None
    for p in doc.paragraphs:
        if p.text.strip() == "CHAPTER 8":
            ch8 = p
            break
    if not ch8:
        raise SystemExit("CHAPTER 8 not found")

    # Remove reversed Ch.7 block (between CHAPTER 7 and CHAPTER 8)
    removing = False
    to_remove = []
    for p in doc.paragraphs:
        t = p.text.strip()
        if t == "CHAPTER 7":
            removing = True
            to_remove.append(p)
            continue
        if p is ch8:
            break
        if removing:
            to_remove.append(p)

    for p in to_remove:
        p._element.getparent().remove(p._element)

    # Insert forward (reverse iteration + addprevious)
    for text, bold in reversed(PARAS):
        add_before(ch8, text, bold)

  # Table after Table 7.1 heading
    for p in doc.paragraphs:
        if p.text.strip() == "Table 7.1 Automated Test Summary":
            tbl = doc.add_table(rows=len(TABLE), cols=2)
            tbl.style = "Table Grid"
            for ri, row in enumerate(TABLE):
                for ci, val in enumerate(row):
                    tbl.rows[ri].cells[ci].text = val
            p._element.addnext(tbl._tbl)
            break

    # Appendix I note for raw data
    for p in doc.paragraphs:
        if "Appendix I" in p.text and "UTAUT" in p.text:
            pass
        if p.text.strip().startswith("(Complete statistical analysis for n = 31"):
            p.text = (
                "(Complete statistical analysis for n = 31 respondents in Section 10.3 and "
                "docs/UTAUT_RESULTS.md; raw survey export in docs/UTAUT_RAW_RESPONSES.md.)"
            )

    doc.save(DOCX)
    print("Fixed Chapter 7 order:", DOCX)


if __name__ == "__main__":
    main()
