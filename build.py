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


_CACHE_F = RACINE / ".cache" / "webp.json"
try:
    _CACHE = json.loads(_CACHE_F.read_text())
except Exception:
    _CACHE = {}


def webp(im: Image.Image, q: int = 82) -> str:
    import hashlib
    cle = hashlib.sha1(im.tobytes() + f"{im.size}{im.mode}{q}".encode()).hexdigest()
    if cle in _CACHE:
        return _CACHE[cle]
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=q, method=6)
    _CACHE[cle] = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    _CACHE_F.parent.mkdir(exist_ok=True)
    _CACHE_F.write_text(json.dumps(_CACHE))
    return _CACHE[cle]


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
        elif f.parent.name == "porteurs":
            cible_h = min(im.height, 280)
            im = im.resize((round(im.width * cible_h / im.height), cible_h), Image.LANCZOS)
        elif f.parent.name == "faune":
            im = im.resize((160, round(im.height * 160 / im.width)), Image.LANCZOS)
        elif f.parent.name == "eau":
            cible_l = min(im.width, 1000 if f.stem.startswith("pont") else 300)
            im = im.resize((cible_l, round(im.height * cible_l / im.width)), Image.LANCZOS)
        elif f.parent.name == "coupe":
            cible_l = min(im.width, round(larg.get(cle.replace("coupe/", "01-pierre/"), larg.get(cle.replace("coupe/", "02-neolithique/"), 220)) * 2.6))
            im = im.resize((cible_l, round(im.height * cible_l / im.width)), Image.LANCZOS)
        elif f.parent.name == "niveaux":
            # images des niveaux 2 et 3 (ADR-031) : un peu plus grandes que le bâtiment de base
            base = f.stem.rsplit("-", 1)[0]
            l = next((v for k, v in larg.items() if k.endswith("/" + base)), 200)
            cible_l = min(im.width, round(l * 2.6 * 1.9))
            im = im.resize((cible_l, round(im.height * cible_l / im.width)), Image.LANCZOS)
        elif f.parent.name in ("poses", "nuit"):
            # facteur unique : les tailles relatives de la planche sont gardées
            k = 0.45 if f.parent.name == "poses" else 0.4
            im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        else:
            cible_l = min(im.width, round(larg.get(cle, 160) * 2.6))
            if cle.endswith("mammouth"):
                cible_l = 420
            if cle.endswith("chevre"):
                cible_l = 170
            if cle.startswith("nature/"):
                cible_l = min(im.width, 420 if cle.endswith("grotte") else 300)
            im = im.resize((cible_l, round(im.height * cible_l / im.width)), Image.LANCZOS)
        res[cle] = webp(im, 85)
    # scènes des grandes pages (ADR-018)
    for f in sorted((RACINE / "assets" / "raw" / "scenes").glob("*.png")):
        im = Image.open(f).convert("RGB")
        im.thumbnail((1100, 1100), Image.LANCZOS)
        res[f"scenes/{f.stem}"] = webp(im, 78)
    # vignettes illustrées des fiches (ADR-017), avec leur propre fond
    for f in sorted((SPRITES / "vignettes").glob("*.jpg")):
        im = Image.open(f).convert("RGB")
        im.thumbnail((300, 300), Image.LANCZOS)
        res[f"vignettes/{f.stem}"] = webp(im, 80)
    return res


def voix_enregistrees() -> dict:
    """Phrases enregistrées en voix (scripts/textes_voix.js puis Arcads) : texte -> mp3 en data URL."""
    dossier = RACINE / "assets" / "voix"
    liste = dossier / "textes.json"
    if not liste.exists():
        return {}
    res = {}
    for x in json.loads(liste.read_text(encoding="utf-8")):
        f = dossier / "mp3" / f"{x['id']}.mp3"
        if f.exists():
            res[x["texte"]] = "data:audio/mpeg;base64," + base64.b64encode(f.read_bytes()).decode()
    return res


def construire(sortie: Path) -> None:
    gabarit = (RACINE / "src" / "index.html").read_text(encoding="utf-8")
    scripts = "".join(
        (RACINE / "src" / n).read_text(encoding="utf-8") + "\n"
        for n in ["data.js", "terrain.js", "monde.js", "jeu.js"]
    )
    a = assets()
    gabarit = gabarit.replace("<!--PWA-->\n", "")
    voix = voix_enregistrees()
    page = gabarit.replace("/*ASSETS*/", "var ASSETS = " + json.dumps(a) + ";\nvar VOIX = " + json.dumps(voix, ensure_ascii=False) + ";").replace("/*SCRIPTS*/", scripts)
    sortie.parent.mkdir(parents=True, exist_ok=True)
    sortie.write_text(page, encoding="utf-8")
    print(f"{sortie} : {len(page) / 1e6:.2f} Mo, {len(a)} images, {len(voix)} phrases en voix")
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
