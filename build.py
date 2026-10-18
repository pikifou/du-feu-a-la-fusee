"""Construit le jeu en une page autonome.

python3 build.py            -> dist/index.html (images intégrées, pour l'artefact)
python3 build.py --pwa docs -> appli installable pour GitHub Pages (manifest, service worker, icônes)

Les sprites et le plateau sont réduits et convertis en webp, puis intégrés en base64.
"""
import base64
import hashlib
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
    gabarit = gabarit.replace("<!--PWA-->\n", "")
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


    return a


def icone(taille: int) -> Image.Image:
    fond = Image.new("RGBA", (taille, taille), (233, 220, 196, 255))
    hutte = Image.open(SPRITES / "01-pierre" / "hutte-peaux.png").convert("RGBA")
    feu = Image.open(SPRITES / "01-pierre" / "feu.png").convert("RGBA")
    l = int(taille * 0.78)
    hutte = hutte.resize((l, round(hutte.height * l / hutte.width)), Image.LANCZOS)
    fond.alpha_composite(hutte, ((taille - l) // 2, int(taille * 0.12)))
    lf = int(taille * 0.42)
    feu = feu.resize((lf, round(feu.height * lf / feu.width)), Image.LANCZOS)
    fond.alpha_composite(feu, (int(taille * 0.52), taille - feu.height - int(taille * 0.06)))
    return fond.convert("RGB")


def pwa(dossier: Path) -> None:
    """Appli installable : la page complète + manifest + service worker versionné + icônes."""
    page = (RACINE / "dist" / "index.html").read_text(encoding="utf-8")
    version = hashlib.sha1(page.encode()).hexdigest()[:10]
    tags = ('<link rel="manifest" href="manifest.webmanifest">\n'
            '<link rel="apple-touch-icon" href="icone-192.png">\n'
            '<meta name="apple-mobile-web-app-capable" content="yes">\n'
            '<meta name="mobile-web-app-capable" content="yes">\n'
            '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
            '<meta name="apple-mobile-web-app-title" content="Feu à la Fusée">\n')
    page = page.replace("<title>Du Feu à la Fusée</title>\n", "<title>Du Feu à la Fusée</title>\n" + tags)
    dossier.mkdir(parents=True, exist_ok=True)
    (dossier / "index.html").write_text(page, encoding="utf-8")
    for t in (192, 512):
        icone(t).save(dossier / f"icone-{t}.png")
    manifest = {
        "name": "Du Feu à la Fusée", "short_name": "Feu à la Fusée", "lang": "fr",
        "start_url": "./", "scope": "./", "display": "fullscreen", "orientation": "landscape",
        "background_color": "#e9dcc4", "theme_color": "#e9dcc4",
        "icons": [{"src": f"icone-{t}.png", "sizes": f"{t}x{t}", "type": "image/png", "purpose": "any"} for t in (192, 512)],
    }
    (dossier / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    fichiers = ["./", "index.html", "manifest.webmanifest", "icone-192.png", "icone-512.png"]
    sw = f"""// service worker versionné : une nouvelle version du jeu remplace l'ancienne
const CACHE = 'feu-fusee-{version}';
const FICHIERS = {json.dumps(fichiers)};
self.addEventListener('install', e => {{ e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS))); self.skipWaiting(); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); }});
self.addEventListener('fetch', e => {{
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // réseau d'abord (pour avoir la dernière version), cache si hors ligne
  e.respondWith(fetch(e.request).then(r => {{ const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; }}).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
}});
"""
    (dossier / "sw.js").write_text(sw, encoding="utf-8")
    (dossier / ".nojekyll").write_text("")
    print(f"{dossier} : appli version {version}")


if __name__ == "__main__":
    construire(RACINE / "dist" / "index.html")
    if "--pwa" in sys.argv:
        pwa(RACINE / sys.argv[sys.argv.index("--pwa") + 1])
