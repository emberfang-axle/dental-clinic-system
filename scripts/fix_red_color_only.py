"""Replace red w:color values in docx XML only (safe single-attribute replace)."""
import re
import zipfile
from pathlib import Path

DOCX = Path(__file__).resolve().parents[1] / "3k_DENTAL-CLINIC-APPPOINTMENT-AND-BILLING-SYSTEM.docx"
REDS = ("FF0000", "C00000", "C0504D", "EE0000", "953734", "FF5050", "FF2424")


def main():
    with zipfile.ZipFile(DOCX, "r") as z:
        data = {n: z.read(n) for n in z.namelist()}

    changed = 0
    for name, blob in list(data.items()):
        if not (name.endswith(".xml") and name.startswith("word/")):
            continue
        try:
            text = blob.decode("utf-8")
        except UnicodeDecodeError:
            continue
        orig = text
        for red in REDS:
            text = text.replace(f'w:val="{red}"', 'w:val="000000"')
            text = text.replace(f'w:val="{red.lower()}"', 'w:val="000000"')
        text = re.sub(r'<w:highlight w:val="red"\s*/>', "", text, flags=re.I)
        if text != orig:
            data[name] = text.encode("utf-8")
            changed += 1

    with zipfile.ZipFile(DOCX, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for name, blob in data.items():
            z.writestr(name, blob)

    # validate
    from docx import Document
    Document(DOCX)
    print(f"Updated {changed} XML parts; file opens OK")


if __name__ == "__main__":
    main()
