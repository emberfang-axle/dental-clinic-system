"""Fix UTAUT section 10.3 in thesis docx — clean paragraphs before 10.4."""
from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.shared import Pt

ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "3k_DENTAL-CLINIC-APPPOINTMENT-AND-BILLING-SYSTEM.docx"

NARRATIVE = (
    "The UTAUT evaluation was conducted with thirty-one (31) respondents, including two (2) staff members "
    "and twenty-nine (29) patients from Estandarte Dental Clinic and online respondents who tested the system. "
    "The overall weighted mean was 4.24, which is interpreted as Very Satisfactory. This indicates that users "
    "generally accept the system and find it useful for their daily tasks. The highest rated construct was "
    "Behavioral Intention (WM = 4.39), showing that users intend to continue using the system and would "
    "recommend it to others. Social Influence (WM = 4.27) indicates support from supervisors and colleagues. "
    "Performance Expectancy (WM = 4.19) and Effort Expectancy (WM = 4.16) confirm that users find the system "
    "useful and easy to use. Facilitating Conditions (WM = 4.21) shows that users have adequate resources and "
    "support to use the system effectively. Overall, the results confirm that the Estandarte Dental Clinic "
    "Appointment and Billing System meets user expectations."
)

TABLE_10_3 = [
    ["UTAUT Construct", "Weighted Mean", "Standard Deviation", "Descriptive Rating"],
    ["Performance Expectancy (PE)", "4.19", "0.31", "Very Satisfactory"],
    ["Effort Expectancy (EE)", "4.16", "0.30", "Very Satisfactory"],
    ["Social Influence (SI)", "4.27", "0.26", "Very Satisfactory"],
    ["Facilitating Conditions (FC)", "4.21", "0.29", "Very Satisfactory"],
    ["Behavioral Intention (BI)", "4.39", "0.32", "Very Satisfactory"],
    ["OVERALL WEIGHTED MEAN", "4.24", "0.30", "Very Satisfactory"],
]

PROFILE = [
    ["Category", "Count"],
    ["Role — Staff", "2"],
    ["Role — Patient", "29"],
    ["Age — 18-25", "27"],
    ["Age — 26-35", "2"],
    ["Age — 36-45", "2"],
    ["Gender — Male", "15"],
    ["Gender — Female", "16"],
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
    return table


def main():
    doc = Document(DOCX)

    rec_10_4 = None
    for p in doc.paragraphs:
        if p.text.strip().startswith("10.4 Recommendations"):
            rec_10_4 = p
            break

    if not rec_10_4:
        raise SystemExit("10.4 Recommendations not found")

    # Remove paragraphs between Table 10.3 heading and 10.4 (except heading itself)
    keep_heading = "Table 10.3 UTAUT Final Results Summary"
    removing = False
    to_remove = []
    for p in doc.paragraphs:
        t = p.text.strip()
        if t == keep_heading:
            removing = True
            continue
        if p is rec_10_4:
            break
        if removing and t:
            to_remove.append(p)

    for p in to_remove:
        el = p._element
        el.getparent().remove(el)

    # Insert content before 10.4 (reverse order because addprevious)
    add_para_before(rec_10_4, NARRATIVE)
    add_table_before(rec_10_4, TABLE_10_3)
    add_para_before(rec_10_4, "Table 10.3 — UTAUT construct ratings (n = 31)", bold=True)
    add_table_before(rec_10_4, PROFILE)
    add_para_before(rec_10_4, "Table 10.3a — Respondent profile", bold=True)

    for p in doc.paragraphs:
        if "50 respondents" in p.text:
            p.text = p.text.replace("50 respondents", "31 respondents")

    doc.save(DOCX)
    print("Fixed section 10.3:", DOCX)


if __name__ == "__main__":
    main()
