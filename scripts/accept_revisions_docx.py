"""Accept all track changes in thesis docx and disable revision tracking."""
import re
import zipfile
from pathlib import Path

DOCX = Path(__file__).resolve().parents[1] / "3k_DENTAL-CLINIC-APPPOINTMENT-AND-BILLING-SYSTEM.docx"

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def unwrap_ins_del(xml: str) -> str:
    from lxml import etree

    root = etree.fromstring(xml.encode("utf-8"))
    ns = {"w": W_NS}

    for el in root.xpath(".//w:del", namespaces=ns):
        parent = el.getparent()
        if parent is not None:
            parent.remove(el)

    for el in root.xpath(".//w:ins", namespaces=ns):
        parent = el.getparent()
        if parent is None:
            continue
        idx = parent.index(el)
        for child in list(el):
            parent.insert(idx, child)
            idx += 1
        parent.remove(el)

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + etree.tostring(
        root, encoding="unicode"
    )


def process_all_xml(parts: dict) -> int:
    total_ins = 0
    total_del = 0
    for name, blob in list(parts.items()):
        if not (name.startswith("word/") and name.endswith(".xml")):
            continue
        try:
            text = blob.decode("utf-8")
        except UnicodeDecodeError:
            continue
        if "w:ins" not in text and "w:del" not in text:
            continue
        total_ins += text.count("w:ins")
        total_del += text.count("w:del")
        parts[name] = unwrap_ins_del(text).encode("utf-8")
    return total_ins + total_del


def disable_tracking(settings_xml: str) -> str:
    # Turn off trackRevisions if present
    settings_xml = re.sub(
        r"<w:trackRevisions\s*/>",
        "",
        settings_xml,
    )
    settings_xml = re.sub(
        r"<w:trackRevisions w:val=\"true\"\s*/>",
        "",
        settings_xml,
        flags=re.I,
    )
    return settings_xml


def main():
    with zipfile.ZipFile(DOCX, "r") as z:
        parts = {n: z.read(n) for n in z.namelist()}

    doc_xml = parts["word/document.xml"].decode("utf-8")
    before_ins = doc_xml.count("w:ins")
    before_del = doc_xml.count("w:del")
    process_all_xml(parts)

    if "word/settings.xml" in parts:
        parts["word/settings.xml"] = disable_tracking(
            parts["word/settings.xml"].decode("utf-8")
        ).encode("utf-8")

    with zipfile.ZipFile(DOCX, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for name, blob in parts.items():
            z.writestr(name, blob)

    from docx import Document

    Document(DOCX)
    after = parts["word/document.xml"].decode("utf-8")
    print(f"Accepted revisions: removed {before_ins} ins wrappers, {before_del} del blocks")
    print("File validates OK")


if __name__ == "__main__":
    main()
