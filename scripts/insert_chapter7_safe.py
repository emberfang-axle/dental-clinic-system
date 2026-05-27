"""Restore from UPDATED backup and insert Chapter 7 (safe, forward order)."""
import re
import shutil
from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.shared import Pt

ROOT = Path(__file__).resolve().parents[1]
BACKUP = ROOT / "3k_DENTAL-CLINIC-APPPOINTMENT-AND-BILLING-SYSTEM-UPDATED.docx"
DOCX = ROOT / "3k_DENTAL-CLINIC-APPPOINTMENT-AND-BILLING-SYSTEM.docx"

PARAS = [
    ("CHAPTER 7", True),
    ("SYSTEM TESTING AND VALIDATION", True),
    (
        "This chapter presents the testing strategy, automated unit test results, manual user "
        "acceptance testing (UAT), and the UTAUT-based user evaluation for the Estandarte Dental "
        "Clinic Appointment and Billing System.",
        False,
    ),
    ("7.1 Testing Strategy", True),
    (
        "Testing used a bottom-up, risk-based approach (React, Firebase). Vitest automated "
        "unit tests verify appointment and billing rules. Manual UAT used scenarios T-01 to T-09. "
        "UTAUT evaluation used thirty-one (31) respondents (Section 10.3, Appendix I).",
        False,
    ),
    ("7.2 Automated Unit Testing", True),
    (
        "Tests ran with Vitest 3.2.4. The project contains nine (9) unit tests in "
        "src/tests/appointments.test.ts (not forty-seven). Result: 1 file, 9 passed, 0 failed; "
        "npm run build PASSED.",
        False,
    ),
    ("Table 7.1 Automated Test Summary", True),
    ("TC-01 to TC-09: completion rules, cash payment, OR receipts, slot conflicts — all PASS.", False),
    ("7.3 Manual User Acceptance Testing", True),
    (
        "Manual tests: registration, book (pending), staff queue table confirm, tooth chart, "
        "cash payment, paginated lists (latest first). All PASS.",
        False,
    ),
    ("7.4 UTAUT Evaluation", True),
    (
        "n = 31; overall WM = 4.24 (Very Satisfactory). PE 4.19, EE 4.16, SI 4.27, FC 4.21, BI 4.39.",
        False,
    ),
    ("7.5 Limitations", True),
    (
        "SMS not implemented; deploy online for shared access; cash-only billing.",
        False,
    ),
]

TABLE = [["Metric", "Result"], ["Tests", "9 passed"], ["Files", "1"], ["Build", "PASSED"]]

REPLACEMENTS = [
    ("Kanban queue", "staff appointment queue (paginated table)"),
    ("Kanban board", "staff appointment queue (paginated table)"),
    ("Kanban Queue", "Staff Appointment Queue (table)"),
    ("Kanban board with status columns", "paginated queue table with status columns"),
    ("through a Kanban board", "through a paginated staff appointment queue table"),
    ("47 passed, 0 failed", "9 passed, 0 failed"),
    ("Tests: 47 passed", "Tests: 9 passed"),
    ("Test Files: 5 passed | Tests: 47 passed", "Test Files: 1 passed | Tests: 9 passed"),
    ("Jest, React Testing Library", "Vitest"),
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


def replace_all(doc):
    for p in doc.paragraphs:
        t = p.text
        o = t
        for a, b in REPLACEMENTS:
            t = t.replace(a, b)
        if t != o:
            p.text = t
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    t = p.text
                    o = t
                    for a, b in REPLACEMENTS:
                        t = t.replace(a, b)
                    if t != o:
                        p.text = t


def main():
    shutil.copy2(BACKUP, DOCX)
    doc = Document(DOCX)

    if any(p.text.strip() == "CHAPTER 7" for p in doc.paragraphs):
        print("Chapter 7 exists; applying text fixes only")
    else:
        ch8 = next(p for p in doc.paragraphs if p.text.strip() == "CHAPTER 8")
        for text, bold in reversed(PARAS):
            add_before(ch8, text, bold)
        for p in doc.paragraphs:
            if p.text.strip() == "Table 7.1 Automated Test Summary":
                tbl = doc.add_table(rows=len(TABLE), cols=2)
                tbl.style = "Table Grid"
                for ri, row in enumerate(TABLE):
                    for ci, val in enumerate(row):
                        tbl.rows[ri].cells[ci].text = val
                p._element.addnext(tbl._tbl)
                break
        print("Inserted Chapter 7")

    replace_all(doc)

    for p in doc.paragraphs:
        if p.text.strip().startswith("(Screenshots of"):
            p.text = (
                "(Screenshots: Admin, Doctor, Staff, Patient dashboards; 4-step booking wizard; "
                "Staff Appointment Queue (paginated table); Clinical Records with tooth chart; "
                "Cash payment and invoice.)"
            )
        if p.text.strip().startswith("(Complete statistical analysis"):
            p.text = (
                "(n = 31: Section 10.3, docs/UTAUT_RESULTS.md, raw rows in docs/UTAUT_RAW_RESPONSES.md.)"
            )

    doc.save(DOCX)
    print("Saved", DOCX, "paragraphs:", len(doc.paragraphs))


if __name__ == "__main__":
    main()
