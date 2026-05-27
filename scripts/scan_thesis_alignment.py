"""Extract thesis claims and compare keywords with codebase expectations."""
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "docs" / "3k_DENTAL-CLINIC-APPPOINTMENT-AND-BILLING-SYSTEM (2).docx"

from docx import Document

doc = Document(DOCX)
full_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())

# Also table text
for t in doc.tables:
    for row in t.rows:
        for cell in row.cells:
            full_text += "\n" + cell.text

lower = full_text.lower()

checks = {
    "Estandarte Dental Clinic": "estandarte" in lower,
    "Appointment scheduling": "appointment" in lower and "schedul" in lower,
    "Billing / invoice": "billing" in lower or "invoice" in lower,
    "Patient records / clinical": "clinical" in lower or "patient record" in lower,
    "Firebase / React": "firebase" in lower and "react" in lower,
    "Cash payment (not GCash only thesis)": "cash" in lower,
    "GCash mentioned in thesis": "gcash" in lower,
    "Kanban mentioned": "kanban" in lower,
    "47 tests mentioned": bool(re.search(r"\b47\b.*test|test.*\b47\b", lower)),
    "9 tests mentioned": bool(re.search(r"\bnine\b.*test|\b9\b.*test", lower)),
    "UTAUT / evaluation": "utaut" in lower or "unified theory" in lower,
    "WM 4.24": "4.24" in full_text,
    "WM 4.52": "4.52" in full_text,
    "n=31 or 31 respondents": bool(re.search(r"\b31\b.*respondent|n\s*=\s*31", lower)),
    "n=21 respondents": bool(re.search(r"\b21\b.*respondent|n\s*=\s*21", lower)),
    "50 respondents": "50 respondent" in lower,
    "Tooth chart / diagram": "tooth" in lower and ("chart" in lower or "diagram" in lower),
    "SMS notification": "sms" in lower or "semaphore" in lower,
    "Google Calendar": "calendar" in lower or "google calendar" in lower,
    "Multi-service booking": "multiple service" in lower or "select all" in lower,
    "Pending appointment status": "pending" in lower,
    "Chapter 7 testing": "chapter 7" in lower or "system testing" in lower,
}

chapters = [p.text.strip() for p in doc.paragraphs if p.text.strip().startswith("CHAPTER")]

print("=== FILE ===")
print(DOCX.name)
print("Paragraphs:", len(doc.paragraphs), "Tables:", len(doc.tables))
print("\n=== CHAPTERS ===")
for c in chapters:
    print(c)

print("\n=== THESIS KEYWORD SCAN ===")
for k, v in checks.items():
    print(f"{'YES' if v else 'NO ':} {k}")

# Snippets for mismatches
print("\n=== SNIPPETS (potential mismatches) ===")
for pat, label in [
    (r".{0,40}kanban.{0,40}", "Kanban"),
    (r".{0,40}gcash.{0,40}", "GCash"),
    (r".{0,40}47.{0,20}test.{0,40}", "47 tests"),
    (r".{0,40}4\.52.{0,40}", "WM 4.52"),
    (r".{0,40}50 respondent.{0,40}", "50 respondents"),
    (r".{0,40}sms.{0,40}", "SMS"),
]:
    m = re.search(pat, lower, re.I)
    if m:
        print(f"\n{label}:", m.group(0).replace("\n", " "))
