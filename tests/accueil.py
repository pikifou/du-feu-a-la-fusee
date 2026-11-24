"""L'accueil (ADR-063) : python tests/accueil.py <captures> [largeur hauteur] [partie.json]

Sert docs/ (build.py --pwa docs) au port 7398, ouvre le jeu sans ?test dans Chromium (muet) et vérifie :
- l'accueil s'ouvre, avec le titre et la Ville A (son âge, un temps passé) ;
- toucher la Ville A ferme l'accueil ; ⚙️ puis « 🏠 Accueil » le rouvre ;
- « Nouvelle ville » lance l'arrivée de la tribu ;
- à cinq villes : la phrase exacte, cinq 🗑️ ; un toucher demande « Sûr ? », le second jette la ville ;
- dans un faux lanceur Ludiworld, le coin haut gauche (136 x 44) reste libre.
Une capture par étape dans <captures>.
"""
import sys, json, pathlib, threading, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ICI = pathlib.Path(__file__).resolve().parent.parent
SORTIE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'captures-accueil'); SORTIE.mkdir(parents=True, exist_ok=True)
L, H = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (1180, 820)
PARTIE = pathlib.Path(sys.argv[4]) if len(sys.argv) > 4 else ICI.parent.parent / 'direction-artistique' / 'tour30-feu-moderne' / 'parties' / 'moderne-avance.json'
PORT = 7398
BASE = f'http://localhost:{PORT}'
PLEIN = 'Tu as déjà 5 villes. Jette-en une pour en commencer une nouvelle.'

LANCEUR = ("""<!doctype html><meta charset="utf-8"><title>lanceur</title>
<body style="margin:0"><iframe id="jeu" src="/index.html" style="border:0;width:%dpx;height:%dpx"></iframe></body>""" % (L, H)).encode()
class Servir(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/lanceur.html'):
            self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(LANCEUR))); self.end_headers(); self.wfile.write(LANCEUR); return
        return super().do_GET()
    def log_message(self, *a): pass
srv = ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Servir, directory=str(ICI / 'docs')))
threading.Thread(target=srv.serve_forever, daemon=True).start()

ok = []
def verifier(cond, msg, etat=None):
    if not cond:
        raise AssertionError(msg + ('\n  ' + json.dumps(etat, ensure_ascii=False)[:600] if etat is not None else ''))
    ok.append(msg); print('ok :', msg)

def contexte(nav):
    ctx = nav.new_context(viewport={'width': L, 'height': H}, device_scale_factor=1, has_touch=True)
    d = PARTIE.read_text(encoding='utf-8')
    ctx.add_init_script("try { if (!sessionStorage.getItem('pose')) { localStorage.clear(); localStorage.setItem('feu-fusee-v2', %s); sessionStorage.setItem('pose', '1'); } } catch (e) {}" % json.dumps(d))
    ctx.add_init_script("try { window.speechSynthesis.speak = function () {}; } catch (e) {}")
    return ctx

def pret(f):
    f.wait_for_function("window.__jeu && window.__jeu.villes && document.getElementById('epoque-nom').textContent.length > 0", timeout=120000)

def innerW_moitie(f):
    return f.evaluate('() => innerWidth') * 0.4

def accueil_ouvert(f):
    return f.evaluate("() => { const a = document.getElementById('accueil'); return !!a && !a.hidden; }")

erreurs = []
with sync_playwright() as pw:
    nav = pw.chromium.launch(args=['--mute-audio'])
    p = contexte(nav).new_page(); p.on('pageerror', lambda e: erreurs.append(str(e) + ' | ' + (e.stack or '')[:400]))
    p.goto(BASE + '/index.html'); pret(p); p.wait_for_timeout(1500)
    verifier(accueil_ouvert(p), 'l\'accueil s\'ouvre au lancement')
    logo = p.evaluate("() => { const i = document.getElementById('accueil-logo'); return i ? { alt: i.alt, w: i.naturalWidth } : null; }")
    verifier(logo and logo['alt'] == 'Ma Petite Civilisation' and logo['w'] > 300, 'le logo « Ma Petite Civilisation » est affiché (ADR-064)', logo)
    fond_ok = p.evaluate("() => !!(window.ASSETS && ASSETS['histoire/accueil']) && document.getElementById('accueil').style.backgroundImage.includes(ASSETS['histoire/accueil'].slice(0, 80))")
    verifier(fond_ok, "le fond est l'écran de lancement (histoire/accueil), pas la peinture de l'intro")
    bords = p.evaluate("() => { const z = [...document.querySelectorAll('#accueil-villes > *')], d = z[z.length - 1].getBoundingClientRect(), g = z[0].getBoundingClientRect(); return { droite: innerWidth - d.right, gauche: g.left, bas: innerHeight - d.bottom }; }")
    verifier(bords['droite'] < 40 and bords['bas'] < 40 and bords['gauche'] > innerW_moitie(p), 'les villes et « Nouvelle ville » sont calées en bas à droite', bords)
    carte = p.inner_text('#accueil-villes .ville[data-id="A"]')
    age = p.evaluate("() => (window.Donnees.epoques.filter(x => x.id === window.__jeu.monde().epoque)[0] || {}).nom")
    verifier('Ville A' in carte and age and age in carte and ('min' in carte or ' h ' in carte), 'la Ville A montre son âge (%s) et son temps' % age, carte)
    p.screenshot(path=str(SORTIE / '1-accueil.png'))

    p.click('#accueil-villes .ville[data-id="A"]'); p.wait_for_timeout(600)
    verifier(not accueil_ouvert(p), 'toucher la Ville A ferme l\'accueil et la partie continue')
    p.evaluate("() => document.querySelectorAll('.voile.ouvert').forEach(v => v.classList.remove('ouvert'))")
    p.click('#btn-menu'); p.wait_for_timeout(300)
    verifier(p.inner_text('#menu-accueil').strip() == '🏠 Accueil' and p.query_selector('#menu-recommencer') is None, 'le menu a « 🏠 Accueil » à la place de « Recommencer »')
    p.click('#menu-accueil'); p.wait_for_timeout(600)
    verifier(accueil_ouvert(p), '« 🏠 Accueil » rouvre l\'accueil')

    with p.expect_navigation(timeout=60000):
        p.click('#accueil-nouvelle')
    pret(p); p.wait_for_timeout(1500)
    verifier(not accueil_ouvert(p) and p.evaluate("() => !document.getElementById('cine').hidden"), '« Nouvelle ville » lance l\'arrivée de la tribu')
    p.screenshot(path=str(SORTIE / '2-nouvelle-ville.png'))

    for _ in range(3):
        with p.expect_navigation(timeout=60000):
            p.evaluate("() => { window.__jeu.villes.nouvelle(); }")
        pret(p)
    p.wait_for_timeout(800)
    p.evaluate("() => { document.getElementById('cine').hidden = true; document.querySelectorAll('.voile.ouvert').forEach(v => v.classList.remove('ouvert')); }")
    p.click('#btn-menu'); p.wait_for_timeout(300); p.click('#menu-accueil'); p.wait_for_timeout(800)
    verifier(p.query_selector('#accueil-nouvelle').is_disabled() and p.inner_text('#accueil-plein').strip() == PLEIN, 'à cinq villes, « Nouvelle ville » est grisée avec la phrase exacte')
    verifier(len(p.query_selector_all('.ville-jeter')) == 5, 'à cinq villes, chaque ville a sa 🗑️')
    p.screenshot(path=str(SORTIE / '3-cinq-villes.png'))
    p.click('.ville-jeter[data-id="C"]'); p.wait_for_timeout(200)
    verifier('Sûr' in p.inner_text('.ville-jeter[data-id="C"]'), 'un premier toucher sur 🗑️ demande « Sûr ? »')
    p.click('.ville-jeter[data-id="C"]'); p.wait_for_timeout(500)
    ids = p.evaluate("() => [...document.querySelectorAll('#accueil-villes .ville[data-id]')].map(b => b.dataset.id)")
    verifier(ids == ['A', 'B', 'D', 'E'] and not p.query_selector('#accueil-nouvelle').is_disabled() and len(p.query_selector_all('.ville-jeter')) == 0,
             'le second toucher jette la Ville C ; « Nouvelle ville » revient, les 🗑️ s\'en vont', ids)
    p.screenshot(path=str(SORTIE / '4-ville-jetee.png'))

    # dans Ludiworld : le coin du bouton « ← Ludiworld » reste libre
    q = contexte(nav).new_page(); q.on('pageerror', lambda e: erreurs.append(str(e) + ' | ' + (e.stack or '')[:400]))
    q.goto(BASE + '/lanceur.html')
    f = q.frame_locator('#jeu'); fr = q.frames[1]
    pret(fr); q.wait_for_timeout(1500)
    if fr.evaluate("() => document.documentElement.classList.contains('ludi')"):
        gene = fr.evaluate("""() => [...document.querySelectorAll('#accueil-titre, #accueil-villes > *')].filter(e => { const r = e.getBoundingClientRect(); return r.left < 136 && r.top < 44 && r.width > 0; }).map(e => e.id || e.className)""")
        verifier(gene == [], 'dans Ludiworld, le coin haut gauche reste libre', gene)
    else:
        print('remarque : le kit ne se croit pas dans Ludiworld ici, coin non vérifié')
    q.screenshot(path=str(SORTIE / '5-dans-ludiworld.png'))
    nav.close()
srv.shutdown()
verifier(not erreurs, 'aucune erreur de page', erreurs)
print(len(ok), 'vérifications passées')
