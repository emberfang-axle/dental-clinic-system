"""Fix Chapter 7 paragraph order only (forward insert)."""
from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.shared import Pt

ROOT = Path(__file__).resolve().parents[1]
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
        "Testing used a bottom-up, risk-based approach (React, Firebase). Vitest automated unit "
        "tests verify appointment and billing rules. Manual UAT used scenarios T-01 to T-09. "
        "UTAUT: n = 31 respondents (Section 10.3, Appendix I).",
        False,
    ),
    ("7.2 Automated Unit Testing", True),
    (
        "Vitest 3.2.4: nine (9) unit tests in src/tests/appointments.test.ts — 1 file, 9 passed, "
        "0 failed; npm run build PASSED. (Not 47 tests.)",
        False,
    ),
    ("Table 7.1 Automated Test Summary", True),
    ("TC-01–TC-09: clinical notes, payment rules, OR numbers, slots — all PASS.", False),
    ("7.3 Manual User Acceptance Testing", True),
    (
        "Manual UAT: registration, book (pending), staff queue table, confirm, tooth chart, cash "
        "payment, pagination — PASS.",
        False,
    ),
    ("7.4 UTAUT Evaluation", True),
    ("n = 31; overall WM = 4.24 (Very Satisfactory). See Section 10.3.", False),
    ("7.5 Limitations", True),
    ("SMS not implemented; deploy online; cash-only billing.", False),
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


def main():
    doc = Document(DOCX)
    ch8 = next(p for p in doc.paragraphs if p.text.strip() == "CHAPTER 8")

    # Remove only misplaced Ch.7 block (between first Ch.7 marker and Ch.8)
    start = None
    to_remove = []
    for p in doc.paragraphs:
        t = p.text.strip()
        if t == "CHAPTER 7" and start is None:
            start = p
            to_remove.append(p)
            continue
        if p is ch8:
            break
        if start is not None:
            to_remove.append(p)

    for p in to_remove:
        p._element.getparent().remove(p._element)

    for text, bold in PARAS:  # forward order
        add_before(ch8, text, bold)

    doc.save(DOCX)
    print("Fixed order. Paragraphs:", len(Document(DOCX).paragraphs))


if __name__ == "__main__":
    main()
