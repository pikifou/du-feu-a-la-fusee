"""Construit le jeu en une page autonome.

python3 build.py            -> dist/index.html (images intégrées, pour l'artefact)
python3 build.py --pwa docs -> appli installable (manifest, service worker), plus tard

Les sprites et le plateau sont réduits et convertis en webp, puis intégrés en base64.
"""
import base64
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image

RACINE = Path(__file__).parent
SPRITES = RACINE / "assets" / "sprites"
PLATEAU = RACINE / "assets" / "raw" / "plateau-vide.png"


def webp(im: Image.Image, q: int = 82) -> str:
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=q, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def largeurs() -> dict:
    """Largeur à l'écran de chaque sprite de bâtiment, lue dans src/data.js (source unique)."""
    src = (RACINE / "src" / "data.js").read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r"sprite: '([^']+)'.*?largeur: (\d+)", src, re.S):
        out.setdefault(m.group(1), int(m.group(2)))
    return out


def assets() -> dict:
    larg = largeurs()
    res = {}
    for f in sorted(SPRITES.glob("*/*.png")):
        cle = f"{f.parent.name}/{f.stem}"
        im = Image.open(f).convert("RGBA")
        if f.parent.name == "habitants":
            cible_h = min(im.height, 280)
            im = im.resize((round(im.width * cible_h / im.height), cible_h), Image.LANCZOS)
        else:
            cible_l = min(im.width, round(larg.get(cle, 160) * 2.6))
            if cle.endswith("mammouth"):
                cible_l = 420
            if cle.endswith("chevre"):
                cible_l = 170
            im = im.resize((cible_l, round(im.height * cible_l / im.width)), Image.LANCZOS)
        res[cle] = webp(im, 85)
    board = Image.open(PLATEAU).convert("RGB")
    res["plateau"] = webp(board, 78)
    return res


def construire(sortie: Path) -> None:
    gabarit = (RACINE / "src" / "index.html").read_text(encoding="utf-8")
    scripts = "".join(
        (RACINE / "src" / n).read_text(encoding="utf-8") + "\n"
        for n in ["data.js", "carte.js", "monde.js", "jeu.js"]
    )
    a = assets()
    page = gabarit.replace("/*ASSETS*/", "var ASSETS = " + json.dumps(a) + ";").replace("/*SCRIPTS*/", scripts)
    sortie.parent.mkdir(parents=True, exist_ok=True)
    sortie.write_text(page, encoding="utf-8")
    print(f"{sortie} : {len(page) / 1e6:.2f} Mo, {len(a)} images")
    # version artefact : sans doctype ni html/head/body (le squelette est ajouté à la publication)
    tete = re.search(r"<head>(.*)</head>", page, re.S).group(1)
    tete = re.sub(r'<meta charset="utf-8">\s*', "", tete)
    tete = re.sub(r'<meta name="viewport"[^>]*>\s*', "", tete)
    titre = re.search(r"<title>.*?</title>", tete).group(0)
    tete = tete.replace(titre, "")
    corps = re.search(r"<body>(.*)</body>", page, re.S).group(1)
    art = sortie.parent / "artifact.html"
    art.write_text(titre + "\n" + tete.strip() + "\n" + corps.strip() + "\n", encoding="utf-8")
    print(f"{art} : {art.stat().st_size / 1e6:.2f} Mo")


if __name__ == "__main__":
    construire(RACINE / "dist" / "index.html")
