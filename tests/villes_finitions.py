"""Six petits défauts des villes (chantier accueil-et-villes, tâche « mineurs ») : python tests/villes_finitions.py [partie.json]

Sert docs/ (build.py --pwa docs) au port 7389 et vérifie dans Chromium (muet) :
1. une ville jetée ne revient pas quand arrive une copie plus ancienne qui la contient encore ;
2. sans DecompressionStream (iPad resté en iOS 15), une ville compressée se rouvre quand même ;
3. ?neuf commence une nouvelle ville au lieu d'écraser celle en cours ;
4. sans ville choisie, Ludiworld ne reçoit pas l'époque du monde affiché derrière l'accueil ; avec une ville, il la reçoit ;
5. l'accueil ne lit que la dernière photo de chaque ville, et c'est bien elle qu'il montre ;
6. pendant un changement de ville, toucher la ville en cours ne ferme pas l'accueil.
"""
import sys, json, pathlib, threading, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ICI = pathlib.Path(__file__).resolve().parent.parent
PARTIE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ICI.parent.parent / 'direction-artistique' / 'tour30-feu-moderne' / 'parties' / 'moderne-avance.json'
PORT = 7389
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

ok, echecs = [], []
def verifier(cond, msg, etat=None):
    if not cond:
        echecs.append(msg); print('ÉCHEC :', msg, ('\n  ' + json.dumps(etat, ensure_ascii=False)[:600]) if etat is not None else '')
    else:
        ok.append(msg); print('ok :', msg)

ETAT = "() => { const J = window.__jeu, l = J.villes.liste(); return { active: l.active, ids: l.liste.map(v => v.id), epoque: J.monde().epoque, batiments: J.monde().batiments.length }; }"
def pret(f):
    f.wait_for_function("window.__jeu && window.__jeu.villes && document.getElementById('epoque-nom').textContent.length > 0", timeout=120000)
def cadre(pg):
    pg.wait_for_function("() => { const f = document.getElementById('jeu'); try { return !!(f && f.contentWindow && f.contentWindow.__jeu && f.contentWindow.__jeu.villes); } catch (e) { return false; } }", timeout=120000)
    f = pg.frames[1]; pret(f); return f
def contexte(nav, partie=True, sans_decompression=False):
    ctx = nav.new_context(viewport={'width': 1200, 'height': 840})
    d = json.dumps(PARTIE.read_text(encoding='utf-8')) if partie else 'null'
    ctx.add_init_script("try { if (!sessionStorage.getItem('pose')) { localStorage.clear(); var d = %s; if (d) localStorage.setItem('feu-fusee-v2', d); sessionStorage.setItem('pose', '1'); } } catch (e) {}" % d)
    ctx.add_init_script("try { window.speechSynthesis.speak = function () {}; } catch (e) {}")
    if sans_decompression:
        ctx.add_init_script("delete window.DecompressionStream;")
    return ctx
def changer(p, appel, arg=None, attente=60000):
    try:
        with p.expect_navigation(timeout=attente):
            p.evaluate("(a) => { " + appel + "; }", arg)
        pret(p); return True
    except Exception:
        return False
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

    # 1. jeter la Ville B, puis recevoir une copie d'avant où elle existe encore
    pg = contexte(nav).new_page(); pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.goto(BASE + '/lanceur-test.html'); f = cadre(pg)
    nb = f.evaluate(ETAT)['batiments']
    m = marquer(f); f.evaluate("() => { window.__jeu.villes.nouvelle(); }"); f = attendre_rechargement(pg, m)
    m = marquer(f); f.evaluate("() => { window.__jeu.villes.ouvrir('A'); }"); f = attendre_rechargement(pg, m)
    avant = f.evaluate("() => window.__jeu.villes.paquet()")
    partieB = [v for v in avant['liste'] if v['id'] == 'B'][0].get('partie')
    f.evaluate("() => { window.__jeu.villes.jeter('B'); }")
    apres = f.evaluate("() => window.__jeu.villes.paquet()")
    verifier(partieB and partieB in (apres.get('jetees') or []), '(1) la copie pour Ludiworld se souvient de la Ville B jetée', apres.get('jetees'))
    m = marquer(f)
    pg.evaluate("(m) => document.getElementById('jeu').contentWindow.postMessage(m, location.origin)", welcome(avant))
    f = attendre_rechargement(pg, m)
    e = f.evaluate(ETAT)
    verifier(e['ids'] == ['A'] and e['batiments'] == nb, '(1) après une copie d\'avant qui la contenait, la Ville B ne revient pas', e)

    # 2. sans DecompressionStream
    p2 = contexte(nav, sans_decompression=True).new_page(); p2.on('pageerror', lambda e: erreurs.append(str(e)))
    p2.goto(BASE + '/index.html?test'); pret(p2)
    verifier(p2.evaluate("() => typeof DecompressionStream === 'undefined' && typeof CompressionStream !== 'undefined'"), '(2) ce navigateur compresse mais ne sait pas décompresser')
    changer(p2, "window.__jeu.villes.nouvelle()")
    z = p2.evaluate("() => (localStorage.getItem('feu-fusee-ville-A') || '').charAt(0)")
    rouverte = changer(p2, "window.__jeu.villes.ouvrir('A')", attente=20000)
    e = p2.evaluate(ETAT)
    verifier(z not in ('', '{') and rouverte and e['active'] == 'A' and e['batiments'] == nb, '(2) la Ville A, rangée compressée, se rouvre intacte', e)

    # 3. ?neuf
    p3 = contexte(nav).new_page(); p3.on('pageerror', lambda e: erreurs.append(str(e)))
    p3.goto(BASE + '/index.html?neuf'); pret(p3); p3.wait_for_timeout(1500)
    e = p3.evaluate(ETAT)
    verifier(e['ids'] == ['A', 'B'] and e['active'] == 'B' and e['epoque'] == 1, '(3) ?neuf commence la Ville B', e)
    p3.evaluate("() => { document.getElementById('cine').hidden = true; }")
    changer(p3, "window.__jeu.villes.ouvrir('A')")
    e = p3.evaluate(ETAT)
    verifier(e['active'] == 'A' and e['batiments'] == nb, '(3) la Ville A est intacte', e)

    # 4. l'époque envoyée à Ludiworld
    p4 = contexte(nav, partie=False).new_page(); p4.on('pageerror', lambda e: erreurs.append(str(e)))
    p4.goto(BASE + '/lanceur-accueil.html'); cadre(p4); p4.wait_for_timeout(2000)
    prog = p4.evaluate("() => window.recus.filter(m => m.type === 'ludi:event' && m.event && (m.event.kind === 'progress' || m.event.kind === 'etat')).map(m => m.event)")
    verifier(prog == [], '(4) sans ville, rien n\'est envoyé sur le monde affiché derrière l\'accueil', prog)
    p5 = contexte(nav).new_page(); p5.on('pageerror', lambda e: erreurs.append(str(e)))
    p5.goto(BASE + '/lanceur-accueil.html'); f5 = cadre(p5); p5.wait_for_timeout(2000)
    ep = f5.evaluate("() => window.__jeu.monde().epoque")
    prog = p5.evaluate("() => window.recus.filter(m => m.type === 'ludi:event' && m.event && m.event.kind === 'progress' && m.event.key === 'epoque').map(m => m.event.value)")
    verifier(prog and prog[-1] == ep, '(4) avec la Ville A en cours, Ludiworld reçoit son époque (%s)' % ep, prog)

    # 5. la photo de l'accueil
    p6 = contexte(nav).new_page(); p6.on('pageerror', lambda e: erreurs.append(str(e)))
    p6.add_init_script("""(() => { window.__getAll = 0; const g = IDBIndex.prototype.getAll;
      IDBIndex.prototype.getAll = function () { if (this.objectStore.name === 'photos') window.__getAll++; return g.apply(this, arguments); }; })();""")
    p6.goto(BASE + '/index.html?test'); pret(p6)
    p6.evaluate("""() => new Promise((ok, ko) => {
      const partie = window.__jeu.villes.liste().liste[0].partie;
      const blob = (c) => new Promise(r => { const k = document.createElement('canvas'); k.width = k.height = 8; const x = k.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 8, 8); k.toBlob(r, 'image/png'); });
      Promise.all(['#ff0000', '#00ff00', '#0000ff'].map(blob)).then(bs => {
        const o = indexedDB.open('feu-fusee-frise', 1);
        o.onsuccess = () => { const t = o.result.transaction('photos', 'readwrite'), s = t.objectStore('photos');
          bs.forEach((b, i) => s.add({ partie, epoque: 1, t: i, s: [], habs: [], img: b })); t.oncomplete = () => ok(); t.onerror = ko; };
        o.onerror = ko;
      });
    })""")
    p6.evaluate("() => { window.__getAll = 0; window.__jeu.villes.accueil(); }"); p6.wait_for_timeout(1200)
    photo = p6.evaluate("""() => { const im = document.querySelector('#accueil-villes .ville[data-id="A"] img');
      if (!im || !im.src.startsWith('blob:') || !im.complete) return { src: im && im.src.slice(0, 30) };
      const k = document.createElement('canvas'); k.width = k.height = 4; const x = k.getContext('2d'); x.drawImage(im, 0, 0, 4, 4);
      return { rgb: [...x.getImageData(1, 1, 1, 1).data].slice(0, 3), getAll: window.__getAll }; }""")
    verifier(photo.get('rgb') == [0, 0, 255], '(5) la carte de la Ville A montre sa dernière photo', photo)
    verifier(photo.get('getAll') == 0, '(5) sans lire toutes les photos de la ville', photo)

    # 6. toucher la ville en cours pendant un changement
    p7 = contexte(nav).new_page(); p7.on('pageerror', lambda e: erreurs.append(str(e)))
    p7.goto(BASE + '/index.html?test'); pret(p7)
    changer(p7, "window.__jeu.villes.nouvelle()")
    p7.evaluate("() => { document.getElementById('cine').hidden = true; window.__jeu.villes.accueil(); }")
    ouvert = {}
    with p7.expect_navigation(timeout=60000):
        ouvert['v'] = p7.evaluate("""() => { window.__jeu.villes.ouvrir('A');
          document.querySelector('#accueil-villes .ville[data-id="B"]').click();
          return !document.getElementById('accueil').hidden; }""")
    pret(p7)
    verifier(ouvert['v'] is True, '(6) toucher la ville en cours pendant le changement laisse l\'accueil ouvert')
    verifier(p7.evaluate(ETAT)['active'] == 'A', '(6) et le changement va jusqu\'au bout : Ville A', p7.evaluate(ETAT))
    nav.close()
srv.shutdown()
verifier(not erreurs, 'aucune erreur de page', erreurs)
print(len(ok), 'vérifications passées,', len(echecs), 'échecs')
sys.exit(1 if echecs else 0)
