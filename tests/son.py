"""Le son réglé par Ludiworld (kit 0.5) : python tests/son.py

Sert docs/ (build.py --pwa docs) au port 7399, ouvre le jeu dans Chromium (muet, voix du navigateur comptée)
et vérifie, sans rien écouter (l'écoute revient à un humain) :
- au premier lancement, musique, bruitages et voix sont allumés ;
- chaque bouton du menu (musique, bruitages, voix) ne coupe que sa part, et le réglage passe par le kit (ludi.v1.son) ;
- dans un faux lanceur : un message « ludi:son » coupe la musique ; le bouton du jeu prévient le lanceur ;
- une vieille sauvegarde avec la voix et la musique coupées ne rend pas le jeu muet ;
- la page s'appelle « Ma Petite Civilisation ».
"""
import sys, json, pathlib, threading, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ICI = pathlib.Path(__file__).resolve().parent.parent
PORT = 7399
BASE = f'http://localhost:{PORT}'
LANCEUR = b"""<!doctype html><meta charset="utf-8"><title>lanceur</title>
<body style="margin:0"><iframe id="jeu" src="/index.html?test" style="border:0;width:1180px;height:820px"></iframe>
<script>window.recus = []; addEventListener('message', e => { if (e.data && e.data.type) window.recus.push(e.data); });</script></body>"""
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

MUET = "try { window.__dits = []; speechSynthesis.speak = u => window.__dits.push(u.text); } catch (e) {}"
ETAT = "() => ({ son: window.__jeu.son(), kit: window.Ludi.son(), stocke: JSON.parse(localStorage.getItem('ludi.v1.son') || 'null'), titre: document.title })"
def pret(f):
    f.wait_for_function("window.__jeu && window.__jeu.son && document.getElementById('epoque-nom').textContent.length > 0", timeout=120000)

erreurs = []
with sync_playwright() as pw:
    nav = pw.chromium.launch(args=['--mute-audio'])
    ctx = nav.new_context(viewport={'width': 1180, 'height': 820})
    ctx.add_init_script(MUET)
    p = ctx.new_page(); p.on('pageerror', lambda e: erreurs.append(str(e)))
    p.goto(BASE + '/index.html?test'); pret(p)
    e = p.evaluate(ETAT)
    verifier(e['son'] == {'musique': True, 'bruitages': True, 'voix': True}, 'au premier lancement, tout est allumé', e)
    verifier(e['titre'] == 'Ma Petite Civilisation', 'la page s\'appelle « Ma Petite Civilisation »', e)
    for bouton, cle in (('#menu-musique', 'musique'), ('#menu-bruitages', 'bruitages'), ('#menu-voix', 'voix')):
        p.evaluate("() => document.querySelectorAll('.voile.ouvert').forEach(v => v.classList.remove('ouvert'))")
        p.click('#btn-menu'); p.wait_for_timeout(200)
        p.click(bouton); p.wait_for_timeout(200)
        e = p.evaluate(ETAT)
        attendu = {'musique': True, 'bruitages': True, 'voix': True}; attendu[cle] = False
        verifier(e['son'] == attendu and e['stocke'] and e['stocke'].get(cle) is False and p.inner_text(bouton).strip().endswith('non'),
                 'le bouton « %s » ne coupe que sa part, par le kit' % cle, e)
        p.click(bouton); p.wait_for_timeout(200)
        verifier(p.evaluate(ETAT)['son'][cle] is True and p.inner_text(bouton).strip().endswith('oui'), 'le bouton « %s » la rallume' % cle)
    p.evaluate("() => document.querySelectorAll('.voile.ouvert').forEach(v => v.classList.remove('ouvert'))")
    n = p.evaluate("() => window.__dits.length")
    p.evaluate("() => window.__jeu.dire('Un premier essai de voix.')"); p.wait_for_timeout(300)
    verifier(p.evaluate("() => window.__dits.length") == n + 1, 'la voix allumée parle')
    n += 1
    p.evaluate("() => { window.Ludi.reglerSon({ voix: false }); window.__jeu.dire('Un essai de voix.'); }"); p.wait_for_timeout(300)
    verifier(p.evaluate("() => window.__dits.length") == n, 'la voix coupée ne parle plus')
    p.evaluate("() => window.Ludi.reglerSon({ voix: true })")

    # une vieille sauvegarde qui avait coupé la voix et la musique : le jeu n'est pas muet
    p.evaluate("() => { const d = JSON.parse(localStorage.getItem('feu-fusee-v2')); d.ui.voix = false; d.ui.musique = false; localStorage.setItem('feu-fusee-v2', JSON.stringify(d)); }")
    p.reload(); pret(p)
    verifier(p.evaluate(ETAT)['son'] == {'musique': True, 'bruitages': True, 'voix': True}, 'une vieille sauvegarde muette ne rend pas le jeu muet')

    # dans le faux lanceur
    q = nav.new_context(viewport={'width': 1200, 'height': 840})
    q.add_init_script(MUET)
    pg = q.new_page(); pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.goto(BASE + '/lanceur.html'); fr = pg.frames[1]; pret(fr)
    pg.evaluate("document.getElementById('jeu').contentWindow.postMessage({ type: 'ludi:welcome', player: { name: 'Test' }, save: null, son: { musique: true, bruitages: true, voix: true } }, location.origin)")
    pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('jeu').contentWindow.postMessage({ type: 'ludi:son', son: { musique: false, bruitages: true, voix: true } }, location.origin)")
    pg.wait_for_timeout(500)
    e = fr.evaluate(ETAT)
    verifier(e['son']['musique'] is False and fr.evaluate("() => window.__jeu.musique().piste") is None, 'un « ludi:son » du lanceur coupe la musique', e)
    fr.evaluate("() => document.querySelectorAll('.voile.ouvert').forEach(v => v.classList.remove('ouvert'))")
    fr.click('#btn-menu'); fr.wait_for_timeout(200); fr.click('#menu-musique'); fr.wait_for_timeout(300)
    recus = pg.evaluate("window.recus.filter(m => m.type === 'ludi:son')")
    verifier(recus and recus[-1]['son'] == {'musique': True, 'bruitages': True, 'voix': True}, 'le bouton du jeu prévient le lanceur', recus)
    nav.close()
srv.shutdown()
verifier(not erreurs, 'aucune erreur de page', erreurs)
print(len(ok), 'vérifications passées')
