"""Les villes et la copie Ludiworld, avec un faux lanceur : python tests/villes_ludiworld.py [partie.json]

Revue finale de l'accueil et des villes (ADR-063). Sert docs/ au port 7393 et vérifie :
1. une copie venue d'un autre appareil (même ancienne, v2) ne fait pas disparaître les villes de celui-ci ;
2. au lancement, le jeu n'envoie pas tout de suite sa copie à Ludiworld (elle écraserait une copie plus récente) ;
3. une copie qui arrive pendant un changement de ville ne mélange pas deux villes ;
4. si la liste des villes ne peut pas s'écrire, « Nouvelle ville » ne remplace pas la ville en cours.
"""
import sys, json, pathlib, threading, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ICI = pathlib.Path(__file__).resolve().parent.parent
PARTIE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ICI.parent.parent / 'direction-artistique' / 'tour30-feu-moderne' / 'parties' / 'moderne-avance.json'
PORT = 7393
BASE = f'http://localhost:{PORT}'
def lanceur(src):
    return ("""<!doctype html><meta charset="utf-8"><title>lanceur</title>
<body style="margin:0"><iframe id="jeu" src="%s" style="border:0;width:1180px;height:820px"></iframe>
<script>window.recus = []; addEventListener('message', e => { if (e.data && e.data.type) window.recus.push(e.data); });</script></body>""" % src).encode()
PAGES = {'/lanceur-test.html': lanceur('/index.html?test'), '/lanceur-accueil.html': lanceur('/index.html')}
class Servir(SimpleHTTPRequestHandler):
    def do_GET(self):
        corps = PAGES.get(self.path.split('?')[0])
        if corps:
            self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(corps))); self.end_headers(); self.wfile.write(corps); return
        return super().do_GET()
    def log_message(self, *a): pass
srv = ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Servir, directory=str(ICI / 'docs')))
threading.Thread(target=srv.serve_forever, daemon=True).start()

ok = []
def verifier(cond, msg, etat=None):
    if not cond:
        raise AssertionError(msg + ('\n  ' + json.dumps(etat, ensure_ascii=False)[:700] if etat is not None else ''))
    ok.append(msg); print('ok :', msg)

ETAT = "() => { const J = window.__jeu, l = J.villes.liste(); return { active: l.active, ids: l.liste.map(v => v.id), epoque: J.monde().epoque, batiments: J.monde().batiments.length }; }"
def pret(f):
    f.wait_for_function("window.__jeu && window.__jeu.villes && document.getElementById('epoque-nom').textContent.length > 0", timeout=120000)
def cadre(pg):
    pg.wait_for_function("() => { const f = document.getElementById('jeu'); try { return !!(f && f.contentWindow && f.contentWindow.__jeu && f.contentWindow.__jeu.villes); } catch (e) { return false; } }", timeout=120000)
    f = pg.frames[1]; pret(f); return f
def contexte(nav, casser=False):
    ctx = nav.new_context(viewport={'width': 1200, 'height': 840})
    d = PARTIE.read_text(encoding='utf-8')
    ctx.add_init_script("try { if (!sessionStorage.getItem('pose')) { localStorage.clear(); localStorage.setItem('feu-fusee-v2', %s); sessionStorage.setItem('pose', '1'); } } catch (e) {}" % json.dumps(d))
    ctx.add_init_script("try { window.speechSynthesis.speak = function () {}; } catch (e) {}")
    if casser:
        ctx.add_init_script("""(() => { const s = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) {
          if (window.__casser && k === 'feu-fusee-villes') throw new DOMException('plein', 'QuotaExceededError'); return s.call(this, k, v); }; })();""")
    return ctx
def attendre_rechargement(pg, avant):
    pg.wait_for_function("(n) => { const f = document.getElementById('jeu'); try { return f.contentWindow.__marque !== n; } catch (e) { return false; } }", arg=avant, timeout=60000)
    return cadre(pg)
def marquer(f):
    f.evaluate("() => { window.__marque = 'm' + Math.random(); }"); return f.evaluate("() => window.__marque")
def welcome(save):
    return {'type': 'ludi:welcome', 'player': {'name': 'Test'}, 'save': {'data': save, 'at': 4102444800000}, 'son': {'musique': True, 'bruitages': True, 'voix': True}}

erreurs = []
with sync_playwright() as pw:
    nav = pw.chromium.launch(args=['--mute-audio'])

    # 1. une copie v2 venue d'ailleurs pendant qu'on joue la Ville B : la Ville B reste
    pg = contexte(nav).new_page(); pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.goto(BASE + '/lanceur-test.html'); f = cadre(pg)
    nb = f.evaluate(ETAT)['batiments']
    pq = f.evaluate("() => window.__jeu.villes.paquet()")
    distante = {'v': 2, 'monde': pq['monde'], 'ui': pq['ui']}
    m = marquer(f); f.evaluate("() => { window.__jeu.villes.nouvelle(); }"); f = attendre_rechargement(pg, m)
    verifier(f.evaluate(ETAT)['active'] == 'B', '(1) on joue la Ville B')
    m = marquer(f)
    pg.evaluate("(m) => document.getElementById('jeu').contentWindow.postMessage(m, location.origin)", welcome(distante))
    f = attendre_rechargement(pg, m)
    e = f.evaluate(ETAT)
    verifier(e['ids'] == ['A', 'B'] and e['active'] == 'A' and e['batiments'] == nb, '(1) après la copie venue d\'ailleurs : Ville A ouverte, intacte, et la Ville B est toujours là', e)
    m = marquer(f); f.evaluate("() => { window.__jeu.villes.ouvrir('B'); }"); f = attendre_rechargement(pg, m)
    verifier(f.evaluate(ETAT)['epoque'] == 1, '(1) la Ville B se rouvre')

    # 3. une copie qui arrive pendant un changement de ville
    m = marquer(f)
    f.evaluate("""(w) => { window.__jeu.villes.ouvrir('A');
      window.dispatchEvent(new MessageEvent('message', { data: w, origin: location.origin, source: window.parent })); }""", welcome(distante))
    f = attendre_rechargement(pg, m); pg.wait_for_timeout(1500); f = cadre(pg)
    e = f.evaluate(ETAT)
    verifier(e['ids'] == ['A', 'B'], '(3) les deux villes sont toujours là', e)
    for ville, cond in (('A', lambda x: x['batiments'] == nb), ('B', lambda x: x['epoque'] == 1)):
        if f.evaluate(ETAT)['active'] != ville:
            m = marquer(f); f.evaluate("(v) => { window.__jeu.villes.ouvrir(v); }", ville); f = attendre_rechargement(pg, m)
        verifier(cond(f.evaluate(ETAT)), '(3) la Ville %s a gardé son monde' % ville, f.evaluate(ETAT))

    # 2. au lancement, pas de copie récente envoyée tout de suite
    pg2 = contexte(nav).new_page(); pg2.on('pageerror', lambda e: erreurs.append(str(e)))
    pg2.goto(BASE + '/lanceur-accueil.html'); cadre(pg2); pg2.wait_for_timeout(3000)
    envois = pg2.evaluate("() => window.recus.filter(m => m.type === 'ludi:event' && m.event && m.event.kind === 'save').map(m => m.event.at)")
    verifier(all(a <= 1 for a in envois), '(2) au lancement, aucune copie datée de maintenant n\'est envoyée', envois)

    # 4. la liste ne peut pas s'écrire : « Nouvelle ville » ne remplace pas la ville en cours
    pg3 = contexte(nav, casser=True).new_page(); pg3.on('pageerror', lambda e: erreurs.append(str(e)))
    pg3.goto(BASE + '/index.html?test'); pret(pg3)
    pg3.evaluate("() => { window.__casser = true; window.__jeu.villes.nouvelle(); }"); pg3.wait_for_timeout(2500)
    pg3.evaluate("() => { window.__casser = false; }")
    pg3.goto(BASE + '/index.html?test'); pret(pg3)
    e = pg3.evaluate(ETAT)
    verifier(e['active'] == 'A' and e['batiments'] == nb, '(4) la Ville A est intacte', e)
    nav.close()
srv.shutdown()
verifier(not erreurs, 'aucune erreur de page', erreurs)
print(len(ok), 'vérifications passées')
