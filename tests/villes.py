"""Les villes (ADR-063) dans le vrai jeu : python tests/villes.py [partie.json]

Sert docs/ (la version installée, construite par build.py --pwa docs) au port 7397, ouvre le jeu dans Chromium
(Playwright, muet, voix du navigateur remplacée) et vérifie :
- une partie d'avant les villes devient la Ville A, intacte, avec un temps déjà compté ;
- « Nouvelle ville » en commence une autre sans perdre la première ; on revient à la Ville A ;
- cinq villes au plus ; jeter une ville efface sa sauvegarde ;
- la copie pour Ludiworld tient dans la limite (250 000 caractères) et garde les autres villes ;
- sans compression dans le navigateur, on change quand même de ville, et Ludiworld ne garde que la ville en cours.
Par défaut, la partie est moderne-avance.json (factory/direction-artistique/tour30-feu-moderne/parties/).
"""
import sys, json, pathlib, threading, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ICI = pathlib.Path(__file__).resolve().parent.parent
PARTIE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ICI.parent.parent / 'direction-artistique' / 'tour30-feu-moderne' / 'parties' / 'moderne-avance.json'
PORT = 7397
URL = f'http://127.0.0.1:{PORT}/index.html?test'

class Muet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Muet, directory=str(ICI / 'docs')))
threading.Thread(target=srv.serve_forever, daemon=True).start()

ok = []
def verifier(cond, msg, etat=None):
    if not cond:
        raise AssertionError(msg + ('\n  ' + json.dumps(etat, ensure_ascii=False)[:600] if etat is not None else ''))
    ok.append(msg); print('ok :', msg)

def attendre(p):
    p.wait_for_function("window.__jeu && window.__jeu.villes && document.getElementById('epoque-nom').textContent.length > 0", timeout=120000)

def changer(p, appel):
    with p.expect_navigation(timeout=60000):
        p.evaluate("() => { " + appel + "; }")
    attendre(p)

ETAT = "() => { const J = window.__jeu, l = J.villes.liste(); return { active: l.active, liste: l.liste, epoque: J.monde().epoque, batiments: J.monde().batiments.length }; }"

def contexte(nav, sans_compression=False):
    ctx = nav.new_context(viewport={'width': 1180, 'height': 820})
    d = PARTIE.read_text(encoding='utf-8')
    ctx.add_init_script("try { if (!sessionStorage.getItem('pose')) { localStorage.clear(); localStorage.setItem('feu-fusee-v2', %s); sessionStorage.setItem('pose', '1'); } } catch (e) {}" % json.dumps(d))
    ctx.add_init_script("try { window.speechSynthesis.speak = function () {}; } catch (e) {}")
    if sans_compression:
        ctx.add_init_script("delete window.CompressionStream; delete window.DecompressionStream;")
    return ctx

erreurs = []
with sync_playwright() as pw:
    nav = pw.chromium.launch(args=['--mute-audio'])
    p = contexte(nav).new_page(); p.on('pageerror', lambda e: erreurs.append(str(e)))
    p.goto(URL); attendre(p)
    e = p.evaluate(ETAT)
    nb, ep0 = e['batiments'], e['epoque']
    verifier(e['active'] == 'A' and len(e['liste']) == 1, 'la partie d\'avant devient la Ville A', e)
    verifier(e['liste'][0]['epoque'] == ep0 and e['liste'][0]['ms'] > 0, 'la Ville A garde son âge et un temps déjà compté', e)

    changer(p, 'window.__jeu.villes.nouvelle()')
    e = p.evaluate(ETAT)
    verifier(e['active'] == 'B' and len(e['liste']) == 2 and e['epoque'] == 1, '« Nouvelle ville » commence la Ville B à l\'âge de pierre', e)
    verifier([v for v in e['liste'] if v['id'] == 'A'][0]['epoque'] == ep0, 'la Ville A est toujours là, à son âge', e)
    verifier(p.evaluate("() => (localStorage.getItem('feu-fusee-ville-A') || '').charAt(0) !== '{'"), 'la Ville A dort compressée')

    changer(p, "window.__jeu.villes.ouvrir('A')")
    e = p.evaluate(ETAT)
    verifier(e['active'] == 'A' and e['batiments'] == nb and e['epoque'] == ep0, 'on revient à la Ville A, intacte (%d bâtiments)' % nb, e)

    for lettre in 'CDE':
        changer(p, 'window.__jeu.villes.nouvelle()')
    e = p.evaluate(ETAT)
    verifier(len(e['liste']) == 5 and e['active'] == 'E', 'cinq villes, de A à E', e)
    p.evaluate("() => window.__jeu.villes.nouvelle()"); p.wait_for_timeout(1500)
    verifier(len(p.evaluate(ETAT)['liste']) == 5, 'pas de sixième ville')

    p.evaluate("() => window.__jeu.villes.jeter('C')")
    e = p.evaluate(ETAT)
    verifier(len(e['liste']) == 4 and 'C' not in [v['id'] for v in e['liste']], 'la Ville C est jetée', e)
    verifier(p.evaluate("() => localStorage.getItem('feu-fusee-ville-C') === null"), 'sa sauvegarde est effacée')

    pq = p.evaluate("() => { const q = window.__jeu.villes.paquet(); return { n: JSON.stringify(q).length, v: q.v, autres: Object.keys(q.autres || {}).sort() }; }")
    verifier(pq['v'] == 3 and pq['n'] < 250000 and pq['autres'] == ['A', 'B', 'D'], 'la copie pour Ludiworld tient (%d caractères) et garde les autres villes' % pq['n'], pq)

    p2 = contexte(nav, sans_compression=True).new_page(); p2.on('pageerror', lambda e: erreurs.append(str(e)))
    p2.goto(URL); attendre(p2)
    changer(p2, 'window.__jeu.villes.nouvelle()')
    e = p2.evaluate(ETAT)
    verifier(e['active'] == 'B' and len(e['liste']) == 2, 'sans compression, on change quand même de ville', e)
    verifier(p2.evaluate("() => (localStorage.getItem('feu-fusee-ville-A') || '').charAt(0) === '{'"), 'sans compression, la Ville A dort en clair')
    pq = p2.evaluate("() => window.__jeu.villes.paquet()")
    verifier('autres' not in pq and pq['active'] == 'B', 'sans compression, Ludiworld ne garde que la ville en cours et la liste')
    changer(p2, "window.__jeu.villes.ouvrir('A')")
    verifier(p2.evaluate(ETAT)['batiments'] == nb, 'sans compression, la Ville A revient intacte')
    nav.close()
srv.shutdown()
verifier(not erreurs, 'aucune erreur de page', erreurs)
print(len(ok), 'vérifications passées')
