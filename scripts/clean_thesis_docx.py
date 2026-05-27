"""
Remove Chapter 7 from thesis docx and reset text colors (safe — no XML surgery).
"""
from pathlib import Path

from docx import Document
from docx.enum.text import WD_COLOR_INDEX
from docx.shared import RGBColor

ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "3k_DENTAL-CLINIC-APPPOINTMENT-AND-BILLING-SYSTEM.docx"


def remove_chapter7(doc: Document) -> int:
    to_remove = []
    in_ch7 = False
    for p in doc.paragraphs:
        t = p.text.strip()
        if t == "CHAPTER 7":
            in_ch7 = True
            to_remove.append(p)
            continue
        if t == "CHAPTER 8":
            break
        if in_ch7:
            to_remove.append(p)
    for p in to_remove:
        p._element.getparent().remove(p._element)
    return len(to_remove)


def normalize_run(run) -> None:
    try:
        run.font.color.rgb = None
    except Exception:
        pass
    try:
        run.font.highlight_color = WD_COLOR_INDEX.AUTO
    except Exception:
        pass
    # Black/default text
    try:
        run.font.color.theme_color = None
    except Exception:
        pass
    run.font.strike = False
    run.font.double_strike = False


def normalize_doc(doc: Document) -> None:
    for p in doc.paragraphs:
        for run in p.runs:
            normalize_run(run)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    for run in p.runs:
                        normalize_run(run)


def main():
    doc = Document(DOCX)
    n = remove_chapter7(doc)
    normalize_doc(doc)
    doc.save(DOCX)
    doc2 = Document(DOCX)
    ch = [p.text.strip() for p in doc2.paragraphs if p.text.strip().startswith("CHAPTER")]
    print(f"Removed {n} paragraphs. Chapters: {ch}")


if __name__ == "__main__":
    main()
