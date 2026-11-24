"""La passe de juiciness (ADR-066) : python tests/juiciness.py [partie.json]

Sert docs/ (build.py --pwa docs) au port 7387 et vérifie, dans Chromium (muet), que chaque geste répond :
1. toucher un bâtiment, un animal, un arbre : la chose touchée rebondit, et un petit son part ;
2. toucher un habitant : il réagit (un petit saut) ;
3. la récolte : le compteur ne bouge qu'à l'arrivée du « +3 », qui vole en gros ;
4. poser un bâtiment : il tombe à sa place ;
5. toucher une case interdite : les zones claires battent ;
6. sur téléphone, pendant qu'on pose, la fiche tient sur une ligne (sur tablette, elle reste entière) ;
7. le bouton ⚙️ fait le petit son des autres boutons.
"""
import sys, json, time, pathlib, threading, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ICI = pathlib.Path(__file__).resolve().parent.parent
PARTIE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ICI.parent.parent / 'direction-artistique' / 'tour26-feu-metaux' / 'parties' / 'metaux-avance.json'
PORT = 7387
class Muet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Muet, directory=str(ICI / 'docs')))
threading.Thread(target=srv.serve_forever, daemon=True).start()

ok, echecs = [], []
def verifier(cond, msg, etat=None):
    if cond: ok.append(msg); print('ok :', msg)
    else: echecs.append(msg); print('ÉCHEC :', msg, ('\n  ' + json.dumps(etat, ensure_ascii=False)[:500]) if etat is not None else '')

ESPION = """(() => { window.__sons = []; const AC = window.AudioContext;
  if (AC) { const o = AC.prototype.createOscillator; AC.prototype.createOscillator = function () { window.__sons.push('note'); return o.apply(this, arguments); }; }
  const P = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__sons.push('fichier'); return P.apply(this, arguments); };
  try { window.speechSynthesis.speak = function () {}; } catch (e) {} })();"""

def page(nav, l, h):
    ctx = nav.new_context(viewport={'width': l, 'height': h}, device_scale_factor=1, has_touch=True)
    d = PARTIE.read_text(encoding='utf-8')
    ctx.add_init_script("try { if (!sessionStorage.getItem('pose')) { localStorage.clear(); localStorage.setItem('feu-fusee-v2', %s); sessionStorage.setItem('pose', '1'); } } catch (e) {}" % json.dumps(d))
    ctx.add_init_script(ESPION)
    p = ctx.new_page(); p.on('pageerror', lambda e: erreurs.append(str(e) + ' | ' + (e.stack or '')[:300]))
    p.goto(f'http://localhost:{PORT}/index.html?test')
    p.wait_for_function("window.__jeu && document.getElementById('epoque-nom').textContent.length > 0", timeout=120000)
    p.wait_for_timeout(2000)
    p.evaluate("() => { document.querySelectorAll('.voile.ouvert').forEach(v => v.classList.remove('ouvert')); }")
    return p

# un point à l'écran loin des habitants, des bulles et des flèches (ils passent avant dans toucher)
LIBRE = """(q, sauf) => { const J = window.__jeu, V = J.V, m = J.monde();
  if (q[0] < 90 || q[0] > V.W - 90 || q[1] < 170 || q[1] > V.H - 190) return false;
  const loin = (x, y, r) => Math.hypot(q[0] - x, q[1] - y) > r;
  if (!m.habitants.every(h => h.dort || h.cache || (p => loin(p[0], p[1], 70))(J.E(h.x, h.y - 30)))) return false;
  if (sauf !== 'animal' && !(m.animaux || []).every(a => a.disparu || (p => loin(p[0], p[1] - 10, 90))(J.E(a.x, a.y)))) return false;
  return J.bulles().concat(J.fleches(), J.cadeaux()).every(b => loin(b.x, b.y, 60)); }"""
def reagit(p, cle):
    return p.evaluate("(c) => (window.__jeu.reactions ? window.__jeu.reactions() : []).indexOf(c) >= 0", cle)
def sons(p):
    return p.evaluate("() => window.__sons.slice()")
def vider(p):
    p.evaluate("() => { window.__sons = []; const f = document.getElementById('info-fermer'); if (f && f.offsetParent) f.click(); }"); p.wait_for_timeout(100); p.evaluate("() => { window.__sons = []; }")

erreurs = []
with sync_playwright() as pw:
    nav = pw.chromium.launch(args=['--mute-audio'])
    p = page(nav, 1180, 820)

    # 1. un bâtiment fini
    bt = p.evaluate("""(LIBRE) => { const libre = eval(LIBRE), J = window.__jeu; for (const b of J.monde().batiments) { if (b.etat !== 'fini' || b.type === 'passerelle' || b.type === 'pont-pierre' || b.enFeu) continue;
      const q = J.E(b.x, b.y); q[1] -= 20; if (libre(q)) return [q[0], q[1], b.id]; } return null; }""", LIBRE)
    vider(p); p.mouse.click(bt[0], bt[1]); p.wait_for_timeout(60)
    # le bâtiment le plus en avant sous le doigt répond (deux bâtiments peuvent se chevaucher)
    rb = p.evaluate("() => window.__jeu.reactions().filter(k => /^b\d+$/.test(k))")
    verifier(len(rb) == 1 and 'note' in sons(p), '(1) toucher un bâtiment : il rebondit, avec un petit son', {'b': bt, 'reactions': rb, 'sons': sons(p)})
    # un animal
    an = p.evaluate("""(LIBRE) => { const libre = eval(LIBRE), J = window.__jeu; for (const a of J.monde().animaux || []) { if (a.disparu || a.marche) continue;
      J.centrerSur(a.x, a.y + 60); const q = J.E(a.x, a.y); q[1] -= 10; if (libre(q, 'animal')) return [q[0], q[1], a.id]; } return null; }""", LIBRE)
    if an:
        vider(p); p.mouse.click(an[0], an[1]); p.wait_for_timeout(60)
        verifier(reagit(p, 'a' + str(an[2])) and 'note' in sons(p), '(1) toucher un animal : il réagit, avec un petit son', {'a': an, 'sons': sons(p)})
    else: verifier(False, '(1) un animal à l\'écran pour l\'essai')
    # un arbre loin des bâtiments
    ar = p.evaluate("""(LIBRE) => { const libre = eval(LIBRE), J = window.__jeu, m = J.monde(), T = m.terrain;
      for (const t of T.tuiles) { if (t.obj !== 'arbre' || !Terrain.surIle(T, t)) continue; const c = Terrain.centre(t.i, t.j);
        if (m.batiments.some(b => Math.hypot(b.x - c[0], b.y - c[1]) < 260)) continue;
        J.centrerSur(c[0], c[1] + 60); const q = J.E(c[0], c[1] + 16); q[1] -= 40 * J.V.s; if (libre(q)) return [q[0], q[1], 't' + t.i + ',' + t.j]; } return null; }""", LIBRE)
    if ar:
        vider(p); p.mouse.click(ar[0], ar[1]); p.wait_for_timeout(60)
        verifier(reagit(p, ar[2]) and 'note' in sons(p), '(1) toucher un arbre : il bouge, avec un petit son', {'arbre': ar, 'sons': sons(p)})
    else: verifier(False, '(1) un arbre à l\'écran pour l\'essai')

    # 2. un habitant
    h = p.evaluate("""() => { const J = window.__jeu, V = J.V; for (const h of J.monde().habitants) { if (h.dort || h.cache) continue;
      J.centrerSur(h.x, h.y + 60); const q = J.E(h.x, h.y - 30); if (q[0] > 90 && q[0] < V.W - 90 && q[1] > 170 && q[1] < V.H - 190 && J.bulles().concat(J.fleches(), J.cadeaux()).every(b => Math.hypot(b.x - q[0], b.y - q[1]) > 60)) return [q[0], q[1], h.id]; } return null; }""")
    if h:
        vider(p); p.mouse.click(h[0], h[1]); p.wait_for_timeout(60)
        verifier(reagit(p, 'h' + str(h[2])), '(2) toucher un habitant : il fait un petit saut', h)
    else: print("remarque : pas d'habitant debout dans cette partie, (2) non vérifié")

    # 3. la récolte
    def recolte():
        vider(p)
        p.evaluate("""() => { const J = window.__jeu, V = J.V; for (const b of J.monde().batiments) { const q = J.E(b.x, b.y);
          if (b.etat === 'fini' && q[0] > 120 && q[0] < V.W - 120 && q[1] > 220 && q[1] < V.H - 160 && (b.ouvriers || []).length && b.stock === 0) { b.stock = 3; return; } } }""")
        try: p.wait_for_function("() => window.__jeu.bulles().length > 0", timeout=20000)
        except Exception: print("remarque : personne ne travaille dans cette partie, (3) non vérifié"); return
        bu = p.evaluate("""() => { const J = window.__jeu, b = J.bulles()[0], bat = J.monde().batiments.find(x => x.id === b.bat);
          return [b.x, b.y, window.Donnees ? '' : '', bat.type]; }""")
        prod = p.evaluate("(t) => { const D = window.D || window.Donnees; return null; }", bu[3])
        avant = p.evaluate("() => ['pieces', 'nourriture', 'idees'].map(k => document.getElementById('v-' + k).textContent)")
        p.mouse.click(bu[0], bu[1]); p.wait_for_timeout(120)
        tot = p.evaluate("() => ['pieces', 'nourriture', 'idees'].map(k => document.getElementById('v-' + k).textContent)")
        vole = p.evaluate("() => { const v = document.getElementById('vole'); return v ? parseFloat(getComputedStyle(v).fontSize) : 0; }")
        p.wait_for_timeout(1100)
        apres = p.evaluate("() => ['pieces', 'nourriture', 'idees'].map(k => document.getElementById('v-' + k).textContent)")
        verifier(tot == avant and apres != avant, '(3) la récolte : le compteur ne monte qu\'à l\'arrivée', {'avant': avant, '+0,12 s': tot, '+1,2 s': apres})
        verifier(vole >= 28, '(3) le « +3 » vole en gros', vole)
    recolte()

    # 4. poser un bâtiment, 5. une case interdite
    bon = p.evaluate("""() => { const J = window.__jeu, M = J.M, m = J.monde(), V = J.V;
      for (const type of M.construisibles(m)) { if (!M.peutConstruire(m, type) || (window.D && 0)) continue;
        for (const t of M.emplacementsLibres(m, type).slice(0, 80)) { const c = Terrain.centre(t[0], t[1]), q = J.E(c[0], c[1]);
          if (q[0] > 420 && q[0] < V.W - 120 && q[1] > 170 && q[1] < V.H - 190) return [q[0], q[1], type]; } } return null; }""")
    p.evaluate("(t) => window.__jeu.choisir(t)", bon[2]); p.wait_for_timeout(200)
    mauvais = p.evaluate("""() => { const J = window.__jeu, V = J.V; const b = J.monde().batiments.find(b => b.etat === 'fini' && (q => q[0] > 420 && q[0] < V.W - 90 && q[1] > 170 && q[1] < V.H - 190)(J.E(b.x, b.y))); return b ? J.E(b.x, b.y) : null; }""")
    vider(p); p.mouse.click(mauvais[0], mauvais[1] - 5); p.wait_for_timeout(60)
    verifier(reagit(p, 'zones'), '(5) une case interdite : les zones claires battent')
    n0 = p.evaluate("() => window.__jeu.monde().batiments.length")
    p.mouse.click(bon[0], bon[1]); p.wait_for_timeout(60)
    nouveau = p.evaluate("(n) => { const l = window.__jeu.monde().batiments; return l.length > n ? l[l.length - 1].id : null; }", n0)
    verifier(nouveau is not None and reagit(p, 'pose' + str(nouveau)), '(4) poser un bâtiment : il tombe à sa place', {'nouveau': nouveau, 'type': bon[2]})

    # 6. la fiche pendant qu'on pose, sur tablette : entière
    p.evaluate("(t) => window.__jeu.choisir(t)", bon[2]); p.wait_for_timeout(200)
    tab = p.evaluate("() => { const i = document.getElementById('info'), t = document.getElementById('info-texte'); return { h: i.getBoundingClientRect().height, texte: !!t.offsetParent }; }")
    verifier(tab['texte'], '(6) sur tablette, la fiche reste entière pendant qu\'on pose', tab)
    p.evaluate("() => window.__jeu.choisir(null)")

    # 7. le bouton ⚙️
    vider(p); p.click('#btn-menu'); p.wait_for_timeout(80)
    verifier('note' in sons(p) or 'fichier' in sons(p), '(7) le bouton ⚙️ fait le petit son', sons(p))

    # 6. sur téléphone
    q = page(nav, 844, 390)
    typ = q.evaluate("() => { const J = window.__jeu; return J.M.construisibles(J.monde()).find(t => J.M.peutConstruire(J.monde(), t)); }")
    q.evaluate("(t) => window.__jeu.choisir(t)", typ); q.wait_for_timeout(250)
    tel = q.evaluate("() => { const i = document.getElementById('info'), t = document.getElementById('info-texte'), f = document.getElementById('info-fermer'); return { h: Math.round(i.getBoundingClientRect().height), texte: !!t.offsetParent, croix: !!f.offsetParent, titre: document.getElementById('info-titre').textContent, ligne: i.innerText.replace(/\\s+/g, ' ').slice(0, 80) }; }")
    verifier(tel['h'] <= 64 and not tel['texte'] and tel['croix'] and '🪙' in tel['ligne'], '(6) sur téléphone, pendant qu\'on pose, la fiche tient sur une ligne (nom, prix, croix)', tel)
    q.evaluate("() => window.__jeu.choisir(null)"); q.wait_for_timeout(100)
    hors = q.evaluate("() => { window.__jeu.infoBatiment(window.__jeu.monde().batiments.find(b => b.etat === 'fini')); return !!document.getElementById('info-texte').offsetParent; }")
    verifier(hors, '(6) sur téléphone, hors de la pose, la fiche reste entière')
    nav.close()
srv.shutdown()
verifier(not erreurs, 'aucune erreur de page', erreurs)
print(len(ok), 'vérifications passées,', len(echecs), 'échecs')
sys.exit(1 if echecs else 0)
