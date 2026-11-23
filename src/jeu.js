// Rendu, interface et boucle de jeu (navigateur).
(function () {
  var D = Donnees, TR = Terrain, M = Monde;
  var cv = document.getElementById('ecran');
  var ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var VITESSE = +params.get('x') || 1;
  var CLE = 'feu-fusee-v2';

  // ---------- images ----------
  var IMG = {};
  function chargerImages(fin) {
    var cles = Object.keys(ASSETS), reste = cles.length;
    cles.forEach(function (k) {
      var im = new Image();
      im.onload = im.onerror = function () { if (--reste === 0) fin(); };
      im.src = ASSETS[k];
      IMG[k] = im;
    });
  }

  // ---------- sauvegarde ----------
  var ui = { voix: true, aide: {}, nouveaux: [] };
  function charger() {
    try {
      var brut = localStorage.getItem(CLE) || 'null', o = JSON.parse(brut);
      // ADR-051 : une partie de l'ancienne carte (44 x 44) va être remise sur la nouvelle ; on garde d'abord une copie intacte
      if (o && o.monde && o.monde.terrain && ((o.monde.terrain.tuiles || []).length === 1936 || o.monde.terrain.n === 1936)) {
        try { if (!localStorage.getItem(CLE + '-carte-44')) localStorage.setItem(CLE + '-carte-44', brut); } catch (e) {}
      }
      if (o && o.v === 2 && o.monde && o.monde.terrain) { ui = Object.assign(ui, o.ui || {}); return M.importer(o.monde); }
    } catch (e) {}
    return null;
  }
  var figee = false; // une sauvegarde venue d'un autre appareil vient d'être rangée : on ne l'écrase pas avant de recharger
  var dernierLudi = 0;
  function sauver(maintenant) {
    if (figee) return;
    try { localStorage.setItem(CLE, JSON.stringify({ v: 2, monde: M.exporter(monde), ui: ui })); } catch (e) {}
    // Ludiworld en garde une copie légère (dans le compte du parent), au plus toutes les 20 s, et à chaque arrêt possible.
    if (window.Ludi && (maintenant || Date.now() - dernierLudi > 20000)) {
      dernierLudi = Date.now();
      try { window.Ludi.save({ v: 2, monde: M.exporterLeger(monde), ui: ui }); } catch (e) {}
    }
  }
  var monde = params.has('neuf') ? null : charger();
  var nouvellePartie = !monde;
  if (!monde) monde = M.nouveau((Date.now() % 100000) + 1);

  // ---------- Ludiworld (kit ludi.js) ----------
  // Ouvert seul, le kit garde tout dans le navigateur et le jeu ne change pas.
  // Ouvert depuis le launcher Ludiworld, l'époque et les découvertes lui remontent, et il sait où le jeu
  // peut s'arrêter sans rien perdre (fin douce quand le temps du jour est écoulé).
  var LUDI = window.Ludi ? window.Ludi.init({ game: 'du-feu-a-la-fusee' }) : null;
  var DANS_LUDI = !!(LUDI && LUDI.inLauncher());
  // le bouton « ← Ludiworld » occupe le coin haut gauche : les compteurs se décalent (CSS .ludi)
  if (DANS_LUDI) document.documentElement.classList.add('ludi');
  function ludiProgression() {
    if (!LUDI) return;
    LUDI.progress('epoque', monde.epoque);
    LUDI.progress('decouvertes', Object.keys(monde.decouvertes).length);
  }
  // un moment où l'on peut s'arrêter : découverte lue, nouvelle époque, merveille finie, village endormi
  function ludiArret(quoi) {
    if (!LUDI) return;
    sauver(true);
    LUDI.checkpoint(quoi);
  }
  // le launcher demande une pause (temps écoulé) : on sauve et le monde s'arrête jusqu'au prochain toucher
  var ludiPause = false, ludiNuit = null;
  if (LUDI) LUDI.onPause(function () { ludiPause = true; sauver(true); });
  // Une partie plus récente venue d'un autre appareil : on la range comme la nôtre (sauf la voix, propre à l'appareil) et on recharge.
  if (LUDI) LUDI.onRestore(function (d) {
    try {
      if (!d || d.v !== 2 || !d.monde) return;
      var m = M.developper(d.monde);
      if (!m) return;
      figee = true;
      localStorage.setItem(CLE, JSON.stringify({ v: 2, monde: m, ui: Object.assign({}, d.ui || {}, { voix: ui.voix, musique: ui.musique }) }));
      location.reload();
    } catch (e) { figee = false; }
  });
  // Une partie commencée avant ce changement : on la confie aussi à Ludiworld (sans écraser une plus récente venue d'ailleurs).
  if (LUDI && !nouvellePartie) { try { LUDI.save({ v: 2, monde: M.exporterLeger(monde), ui: ui }, { existante: true }); } catch (e) {} }
  addEventListener('pointerdown', function () { ludiPause = false; }, true);

  // ---------- vue (caméra rapprochée, glisser pour se déplacer, pincer pour zoomer) ----------
  var V = { s: 1, ox: 0, oy: 0, W: 0, H: 0, dpr: 1, cx: 0, cy: 0, sMin: 0.3, sMax: 1.6, init: false };
  // la caméra reste au-dessus de l'île (qui grandit à chaque époque)
  var bornesCache = null, bornesEpoque = -1;
  function bornes() {
    var T0 = monde.terrain;
    if (bornesCache && bornesEpoque === T0.epoque) return bornesCache;
    var b = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 };
    T0.tuiles.forEach(function (t) {
      if (!TR.surIle(T0, t)) return;
      var c = TR.centre(t.i, t.j);
      b.x0 = Math.min(b.x0, c[0] - TR.TW); b.x1 = Math.max(b.x1, c[0] + TR.TW);
      b.y0 = Math.min(b.y0, c[1] - 260); b.y1 = Math.max(b.y1, c[1] + 160);
    });
    bornesCache = b; bornesEpoque = T0.epoque;
    return b;
  }
  function tailleSol() { return { w: TR.N * 2 * TR.TW, h: TR.OY + TR.N * 2 * TR.TH + 140 }; }
  function redim() {
    V.dpr = Math.min(window.devicePixelRatio || 1, 2);
    V.W = innerWidth; V.H = innerHeight;
    cv.width = Math.round(V.W * V.dpr); cv.height = Math.round(V.H * V.dpr);
    var b = bornes();
    V.sMin = Math.min(V.W / (b.x1 - b.x0), V.H / (b.y1 - b.y0)) * 1.15;
    V.sMax = 1.6;
    if (!V.init) {
      V.init = true;
      V.s = V.W / (V.W < 1000 ? 1300 : 1700);
      var c = TR.centre(TR.CI + 1, TR.CJ + 1); V.cx = c[0]; V.cy = c[1] - 40;
    }
    V.s = Math.max(V.sMin, Math.min(V.sMax, V.s));
    borner();
  }
  function borner() {
    var b = bornes(), dw = V.W / 2 / V.s, dh = V.H / 2 / V.s;
    V.cx = b.x1 - b.x0 <= 2 * dw ? (b.x0 + b.x1) / 2 : Math.max(b.x0 + dw, Math.min(b.x1 - dw, V.cx));
    V.cy = b.y1 - b.y0 <= 2 * dh ? (b.y0 + b.y1) / 2 : Math.max(b.y0 + dh, Math.min(b.y1 - dh, V.cy));
    V.ox = V.W / 2 - V.cx * V.s;
    V.oy = V.H / 2 - V.cy * V.s;
  }
  function zoomer(facteur, mx, my) {
    var wx = (mx - V.ox) / V.s, wy = (my - V.oy) / V.s;
    V.s = Math.max(V.sMin, Math.min(V.sMax, V.s * facteur));
    V.cx = wx - (mx - V.W / 2) / V.s;
    V.cy = wy - (my - V.H / 2) / V.s;
    borner();
  }
  function E(x, y) { return [V.ox + x * V.s, V.oy + y * V.s]; }
  function W2(sx, sy) { return [(sx - V.ox) / V.s, (sy - V.oy) / V.s]; }

  // ---------- le sol : couleurs douces, île en diorama, sentiers (ADR-012, ADR-013) ----------
  var G = 0.5, sol = null, solEpoque = -1, usureCv = null, usureT = 99;
  function losange(c, i, j, k, e) {
    var p = TR.centre(i, j), tw = TR.TW * (k || 1), th = TR.TH * (k || 1);
    c.moveTo(p[0] * e, (p[1] - th) * e); c.lineTo((p[0] + tw) * e, p[1] * e);
    c.lineTo(p[0] * e, (p[1] + th) * e); c.lineTo((p[0] - tw) * e, p[1] * e); c.closePath();
  }
  function couleurTuile(t) {
    var n = (TR.h2(t.i, t.j, 9) - 0.5) * 14;
    var c = t.sol === 'herbe' ? (t.obj === 'arbre' ? [112, 158, 74] : t.sauvage ? [146, 186, 92] : [142, 192, 92])
      : t.sol === 'sable' ? [234, 214, 158]
      : t.sol === 'roche' ? [170, 158, 146]
      : (t.i + t.j >= 60 ? [92, 162, 206] : [116, 184, 220]);
    if (t.gue) c = [134, 192, 222];
    return 'rgb(' + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v + n))); }).join(',') + ')';
  }
  var motif = null;
  function motifHerbe() {
    if (motif) return motif;
    var m = document.createElement('canvas'); m.width = m.height = 96;
    var g = m.getContext('2d');
    for (var k = 0; k < 260; k++) {
      var x = Math.random() * 96, y = Math.random() * 96;
      g.fillStyle = Math.random() < 0.5 ? 'rgba(40,70,20,0.5)' : 'rgba(255,255,210,0.5)';
      g.fillRect(x, y, 1 + Math.random() * 1.5, 2 + Math.random() * 2);
    }
    motif = m;
    return m;
  }
  function construireSol() {
    var T = monde.terrain, b = tailleSol();
    var Wd = Math.ceil(b.w * G), Hd = Math.ceil(b.h * G);
    sol = document.createElement('canvas'); sol.width = Wd; sol.height = Hd;
    var g = sol.getContext('2d');
    var sur = T.tuiles.filter(function (t) { return TR.surIle(T, t); });
    // 1. couleurs en basse résolution, agrandies : les terrains se fondent les uns dans les autres
    var f = 8, bas = document.createElement('canvas');
    bas.width = Math.ceil(Wd / f); bas.height = Math.ceil(Hd / f);
    var bc = bas.getContext('2d');
    sur.forEach(function (t) { bc.beginPath(); losange(bc, t.i, t.j, 1.35, G / f); bc.fillStyle = couleurTuile(t); bc.fill(); });
    // 2. côtés de l'île (terre en couches), du fond vers l'avant
    var prof = 90;
    sur.slice().sort(function (a, b2) { return (a.i + a.j) - (b2.i + b2.j); }).forEach(function (t) {
      var p = TR.centre(t.i, t.j), droite = TR.tuile(T, t.i + 1, t.j), gauche = TR.tuile(T, t.i, t.j + 1);
      var bas0 = [p[0], p[1] + TR.TH], dr = [p[0] + TR.TW, p[1]], ga = [p[0] - TR.TW, p[1]];
      function face(a, c, teinte) {
        var gr = g.createLinearGradient(0, a[1] * G, 0, (a[1] + prof) * G);
        gr.addColorStop(0, '#6f9e45'); gr.addColorStop(0.1, '#6f9e45'); gr.addColorStop(0.11, teinte[0]);
        gr.addColorStop(0.45, teinte[1]); gr.addColorStop(0.46, teinte[2]); gr.addColorStop(1, teinte[3]);
        g.beginPath(); g.moveTo(a[0] * G, a[1] * G); g.lineTo(c[0] * G, c[1] * G);
        g.lineTo(c[0] * G, (c[1] + prof) * G); g.lineTo(a[0] * G, (a[1] + prof) * G); g.closePath();
        g.fillStyle = gr; g.fill();
      }
      if (!droite || !TR.surIle(T, droite)) face(bas0, dr, ['#c78a57', '#b5764a', '#a8693f', '#8a5434']);
      if (!gauche || !TR.surIle(T, gauche)) face(ga, bas0, ['#b07546', '#9c643c', '#8f5935', '#73432a']);
    });
    // 3. le dessus de l'île, découpé net
    g.save();
    g.beginPath(); sur.forEach(function (t) { losange(g, t.i, t.j, 1.002, G); }); g.clip();
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(bas, 0, 0, Wd, Hd);
    g.globalAlpha = 0.13; g.fillStyle = g.createPattern(motifHerbe(), 'repeat'); g.fillRect(0, 0, Wd, Hd);
    g.globalAlpha = 1;
    // écume au bord de l'eau
    sur.forEach(function (t) {
      if (t.sol !== 'eau' || t.gue) return;
      var bord = [[1, 0], [0, 1], [-1, 0], [0, -1]].some(function (d) { var n = TR.tuile(T, t.i + d[0], t.j + d[1]); return n && TR.surIle(T, n) && n.sol !== 'eau'; });
      if (!bord) return;
      var p = TR.centre(t.i, t.j);
      var gr = g.createRadialGradient(p[0] * G, p[1] * G, 0, p[0] * G, p[1] * G, TR.TW * G);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.8, 'rgba(255,255,255,0.0)'); gr.addColorStop(1, 'rgba(255,255,255,0.25)');
      g.fillStyle = gr; g.beginPath(); losange(g, t.i, t.j, 1, G); g.fill();
    });
    g.restore();
    solEpoque = T.epoque;
    usureCv = document.createElement('canvas'); usureCv.width = Wd; usureCv.height = Hd;
    usureT = 99;
  }
  function majUsure(dt) {
    usureT += dt;
    if (usureT < 1.5) return;
    usureT = 0;
    var T = monde.terrain, u = usureCv.getContext('2d');
    // avec la roue, les chemins les plus usés deviennent des routes de pierre ; avec la voiture, elles sont goudronnées.
    // Quand les vraies routes sont dessinées (ADR-044), les chemins hors des routes restent de la terre.
    var routes = !!monde.decouvertes.roue && !routesActives();
    var goudron = !!monde.decouvertes.voiture && !routesActives();
    u.clearRect(0, 0, usureCv.width, usureCv.height);
    var rcases = routesActives() ? reseauRoutes().cases : null;
    // ADR-053 : avec la ville aménagée, on garde les taches d'herbe usée (de l'herbe plus ou moins verte, de la terre) partout
    // où il n'y a ni rue ni parcelle ; autour de la ville, une bordure d'herbe tassée fait la transition en douceur.
    var sv = villeActive() && solsVille() ? solVille() : null;
    var enVille = function (k) { return sv && (sv.cases[k] || sv.rues[k] != null); };
    var bordVille = function (t) {
      if (!sv) return 0;
      var n = 0;
      for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) { if ((di || dj) && enVille((t.i + di) * T.N + t.j + dj)) n++; }
      return n;
    };
    T.tuiles.forEach(function (t) {
      if (t.sol !== 'herbe' || !TR.surIle(T, t) || t.bat) return;
      var k = t.i * T.N + t.j;
      if (rcases && (routesCfg.sansTaches || rcases[k] != null)) return;
      if (enVille(k)) return;
      var halo = bordVille(t), usure = Math.max(t.usure, halo ? 0.12 + Math.min(halo, 4) * 0.05 : 0);
      if (usure < 0.1) return;
      t = Object.assign({}, t, { usure: usure });
      var e = TR.etatHerbe(t);
      var col = e <= 1 ? [200, 192, 118] : e === 2 ? [190, 156, 104] : goudron ? [118, 118, 122] : routes ? [166, 156, 142] : [172, 130, 86];
      var a = e <= 1 ? 0.3 + t.usure * 0.8 : e === 2 ? 0.7 : 0.9;
      var p = TR.centre(t.i, t.j), x = p[0] * G, y = p[1] * G;
      u.save(); u.translate(x, y); u.scale(1, 0.5);
      var r = TR.TW * G * 1.05;
      var gr = u.createRadialGradient(0, 0, 0, 0, 0, r);
      gr.addColorStop(0, 'rgba(' + col + ',' + a + ')'); gr.addColorStop(0.6, 'rgba(' + col + ',' + (a * 0.75) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
      u.fillStyle = gr; u.beginPath(); u.arc(0, 0, r, 0, 7); u.fill(); u.restore();
    });
    if (rcases) dessinerRoutes(u, rcases);
    dessinerRails(u);
  }

  // ---------- les routes (ADR-044) : le bac à sable (?bac) compare les façons de les faire naître et de les dessiner ----------
  var BAC = /[?&]bac(=|&|$)/.test(location.search);
  function param(n, d) { var r = new RegExp('[?&]' + n + '=([^&]*)').exec(location.search); return r ? decodeURIComponent(r[1]) : d; }
  var routesCfg = { ville: param('ville', 'oui'), sols: param('sols', 'parcelles'), reseau: param('routes', 'melange'), rendu: param('rendu', 'matiere'), style: param('style', 'auto'), largeur: param('largeur', 'large'), cacher: false, grille: false, sansTaches: false, ombres: param('ombres', 'projetees') };
  var STYLES_ROUTE = {
    romain: { mat: 'dalles', bord: '#9b8f7e', w: 0.2, b: 0.035 },
    'moyen-age': { mat: 'paves', bord: '#7a6754', w: 0.2, b: 0.035 },
    vapeur: { mat: 'setts', trot: 'trottoir', bord: '#b9a68e', w: 0.15, b: 0.07 },
    electricite: { mat: 'asphalte', trot: 'trottoir', bord: '#b9a68e', w: 0.15, b: 0.07, ligne: 'rgba(246,240,224,0.9)' },
    moderne: { mat: 'asphalte-neuf', trot: 'sol-place', bord: '#a9a39a', w: 0.15, b: 0.07, ligne: 'rgba(255,255,255,0.95)' }
  };
  var STYLE_EPOQUE = { 3: 'romain', 4: 'moyen-age', 5: 'vapeur', 6: 'electricite', 7: 'moderne' };
  // ADR-044 : dans le vrai jeu, les routes, les sols de ville et le mobilier arrivent avec la roue (l'âge des métaux),
  // réglés comme Julien les a choisis dans le bac à sable (ADR-046, ADR-048, ADR-049). Le bac à sable les montre toujours.
  function amenage() { return BAC || !!monde.decouvertes.roue; }
  function routesActives() { return amenage() && routesCfg.reseau !== 'aucun' && routesCfg.rendu !== 'taches'; }
  var reseauCache = null, reseauCle = '';
  function reseauRoutes() {
    var cle = routesCfg.reseau + '|' + monde.batiments.length + '|' + monde.batiments.filter(function (b) { return b.etat === 'fini'; }).length + '|' + Math.floor(monde.t / 20);
    if (!reseauCache || cle !== reseauCle) { reseauCache = Routes.calculer(monde, routesCfg.reseau, { virage: 2, attrait: 0.6 }); reseauCle = cle; }
    return reseauCache;
  }
  function styleRoute() { return routesCfg.style === 'auto' ? (STYLE_EPOQUE[Math.max(3, Math.min(7, monde.epoque))]) : routesCfg.style; }
  var motifsRoute = {};
  function motifRoute(u, nom) {
    var im = IMG['routes/mat-' + nom]; if (!im) return '#8a8a8a';
    if (!motifsRoute[nom]) { motifsRoute[nom] = u.createPattern(im, 'repeat'); try { motifsRoute[nom].setTransform(new DOMMatrix().scale(1 / 300)); } catch (e) {} }
    return motifsRoute[nom];
  }
  // la forme d'une route sur sa case, en coordonnées de la grille : un carré au centre et un bras par voisine
  function formeRoute(u, i, j, mq, w) {
    u.rect(i - w, j - w, 2 * w, 2 * w);
    if (mq & 1) u.rect(i, j - w, 0.5 + 0.002, 2 * w);
    if (mq & 2) u.rect(i - w, j, 2 * w, 0.5 + 0.002);
    if (mq & 4) u.rect(i - 0.502, j - w, 0.502, 2 * w);
    if (mq & 8) u.rect(i - w, j - 0.502, 2 * w, 0.502);
  }
  var BORD_VILLE = { romain: '#d9ccb2', 'moyen-age': '#a8927a', vapeur: '#d6cab4', electricite: '#e2d6bf', moderne: '#d4d0c8' };
  var FONCE_VILLE = { romain: 0.1, 'moyen-age': 0.12, vapeur: 0.22 };
  // ecran : les rues de la ville, dessinées à pleine résolution sur l'écran, par-dessus la matière de la rue (ADR-049)
  function dessinerRoutes(u, cases, ecran) {
    var T = monde.terrain, st = styleRoute(), S0 = STYLES_ROUTE[st], k0 = routesCfg.largeur === 'large' ? 0.62 / 0.44 : 1, cles = Object.keys(cases);
    var S = Object.assign({}, S0, { w: S0.w * k0, b: S0.b * k0 });
    u.save();
    if (ecran) grilleEcran(u);
    else u.setTransform(TR.TW * G, TR.TH * G, -TR.TW * G, TR.TH * G, TR.OX * G, (TR.OY + TR.TH) * G);
    u.imageSmoothingEnabled = true; u.imageSmoothingQuality = 'high';
    var matiere = routesCfg.rendu === 'matiere', reste = [];
    if (!matiere) {
      cles.forEach(function (k) {
        var i = Math.floor(k / T.N), j = k % T.N, pc = Routes.piece(cases[k]), im = IMG['routes/' + st + '-' + pc[0] + (routesCfg.largeur === 'large' ? '-l' : '')];
        if (!im) { reste.push(k); return; } // la pièce manque : on la dessine en matière
        u.save(); u.translate(i, j); u.rotate(pc[1] * Math.PI / 2); u.drawImage(im, -0.5, -0.5, 1, 1); u.restore();
      });
    }
    var liste = matiere ? cles : reste;
    if (liste.length) {
      // 1. le bord (ou le trottoir), un peu plus large ; 2. la chaussée ; 3. la ligne du milieu
      var forme = function (w, dx) { u.beginPath(); liste.forEach(function (k) { formeRoute(u, Math.floor(k / T.N) + (dx || 0), k % T.N + (dx || 0), cases[k], w); }); };
      if (ecran) { // en ville, le trottoir est déjà là : seulement la bordure, et une rigole sombre au pied
        forme(S.w + 0.045); u.fillStyle = BORD_VILLE[st] || S.bord; u.fill();
        forme(S.w + 0.012); u.fillStyle = 'rgba(30,25,20,0.35)'; u.fill();
      }
      else {
        forme(S.w + S.b, 0.03); u.fillStyle = 'rgba(40,30,20,0.18)'; u.fill(); // une ombre douce vers le bas de l'écran
        forme(S.w + S.b); u.fillStyle = S.trot ? motifRoute(u, S.trot) : S.bord; u.fill();
        if (S.trot) { forme(S.w + 0.028); u.fillStyle = S.bord; u.fill(); } // la bordure du trottoir
      }
      forme(S.w + 0.012, 0.012); u.fillStyle = 'rgba(30,25,20,0.25)'; u.fill(); // la chaussée un peu plus bas que le bord
      forme(S.w); u.fillStyle = motifRoute(u, S.mat); u.fill();
      if (ecran && FONCE_VILLE[st]) { u.fillStyle = 'rgba(28,22,18,' + FONCE_VILLE[st] + ')'; u.fill(); } // la chaussée plus sombre que le trottoir
      if (S.ligne) {
        u.strokeStyle = S.ligne; u.lineWidth = 0.018; u.setLineDash([0.07, 0.07]); u.beginPath();
        liste.forEach(function (k) {
          var i = Math.floor(k / T.N), j = k % T.N, mq = cases[k];
          Routes.DIRS.forEach(function (d, n) { if (mq & (1 << n)) { u.moveTo(i + d[0] * 0.12, j + d[1] * 0.12); u.lineTo(i + d[0] * 0.5, j + d[1] * 0.5); } });
        });
        u.stroke(); u.setLineDash([]);
      }
    }
    if (routesCfg.grille) {
      u.strokeStyle = 'rgba(0,0,0,0.25)'; u.lineWidth = 0.01; u.beginPath();
      cles.forEach(function (k) { var i = Math.floor(k / T.N), j = k % T.N; u.rect(i - 0.5, j - 0.5, 1, 1); });
      u.stroke();
    }
    u.restore();
  }
  // ---------- le sol de la ville (ADR-049) : chaque maison de ville est posée sur sa parcelle ----------
  // Des carrés vus de dessus (assets/sprites/parcelles/<style>-<n>.png, tour 49) posés sur le losange de la case :
  // 1 à 6 sous les maisons, 7 (jardinet) et 8 (cour) dans les trous entre les parcelles et la rue,
  // 9 la matière de la rue, posée de bord à bord sous les routes de la ville (les trottoirs).
  // Les huttes, les champs, les prés et les monuments restent dans l'herbe.
  var DANS_L_HERBE = { 'grand-champ': 1, 'grand-elevage': 1, 'champ-ble': 1, 'champ-laboure': 1, 'enclos-moutons': 1, etable: 1, 'ferme-laitiere': 1, ferme: 1, 'buisson-baies': 1, 'parc-solaire': 1, 'pas-de-tir': 1, passerelle: 1, 'pont-pierre': 1, 'grotte-peinte': 1 };
  function urbain(b) {
    var d = D.batiments[b.type];
    return d && !DANS_L_HERBE[b.type] && !d.deco && (d.epoque || 1) >= 3 && b.etat === 'fini';
  }
  function solsVille() { return amenage() && routesCfg.sols === 'parcelles' && routesActives(); }
  var solCache = null, solCle = '';
  function solVille() {
    if (!solsVille()) return null;
    var T = monde.terrain, N = T.N, rc = reseauRoutes().cases, amen = amenagement(), st = styleRoute();
    var cle = reseauCle + '|' + st + '|' + (amen ? amen.liste.length : 0);
    if (solCache && cle === solCle) return solCache;
    var occupe = {}, cases = {}, rues = {};
    monde.batiments.forEach(function (b) { for (var a = 0; a < b.k; a++) for (var c = 0; c < b.k; c++) occupe[(b.i + a) * N + b.j + c] = b; });
    var lieu = {}; // les places et les jardinets du tour 48 ont déjà leur propre sol
    if (amen) amen.liste.forEach(function (a) { if (a.quoi !== 'place' && a.quoi !== 'jardin') return; var z = a.z || 1; for (var x = 0; x < z; x++) for (var y = 0; y < z; y++) lieu[(a.i + x) * N + a.j + y] = 1; });
    function h(i, j, s) { return TR.h2(i, j, s); }
    // 1. les parcelles sous les maisons de la ville
    monde.batiments.forEach(function (b) {
      if (!urbain(b)) return;
      for (var a = 0; a < b.k; a++) for (var c = 0; c < b.k; c++) {
        var i = b.i + a, j = b.j + c;
        cases[i * N + j] = { n: 1 + Math.floor(h(i, j, 31) * 6), r: Math.floor(h(i, j, 32) * 4) };
      }
    });
    // 2. les trous entre les parcelles, les places et la rue : une cour ou un jardinet
    function libre(i, j) {
      var t = TR.tuile(T, i, j), k = i * N + j;
      if (!t || !TR.surIle(T, t) || t.sol !== 'herbe' || t.gue || t.rail) return false;
      if (t.obj && t.obj !== 'souche') return false;
      return !occupe[k] && rc[k] == null && !lieu[k] && !cases[k];
    }
    function plein(i, j) { var k = i * N + j; return cases[k] || lieu[k] || rc[k] != null ? 1 : 0; }
    function pres(i, j, f) { return [[1, 0], [0, 1], [-1, 0], [0, -1]].some(function (d) { return f(i + d[0], j + d[1]); }); }
    for (var passe = 0; passe < 2; passe++) {
      var ajout = [];
      T.tuiles.forEach(function (t) {
        var i = t.i, j = t.j; if (!libre(i, j)) return;
        var e = plein(i + 1, j), o = plein(i - 1, j), s = plein(i, j + 1), n = plein(i, j - 1);
        var entre = (e && o) || (s && n) || e + o + s + n >= 3;
        // devant une maison, entre elle et la rue : la cour d'entrée
        var devant = pres(i, j, function (a, c) { var x = cases[a * N + c]; return x && x.n <= 6; }) && pres(i, j, function (a, c) { return rc[a * N + c] != null; });
        if (entre || devant) ajout.push(t);
      });
      ajout.forEach(function (t) { cases[t.i * N + t.j] = { n: h(t.i, t.j, 33) < 0.3 ? 7 : 8, r: Math.floor(h(t.i, t.j, 34) * 4) }; });
    }
    // 3. les rues de la ville : celles qui longent une parcelle, une cour ou une place
    Object.keys(rc).forEach(function (k) {
      k = +k; var i = Math.floor(k / N), j = k % N, oui = false;
      for (var a = -1; a <= 1 && !oui; a++) for (var c = -1; c <= 1; c++) { var kk = (i + a) * N + j + c; if (cases[kk] || lieu[kk]) { oui = true; break; } }
      if (oui) rues[k] = rc[k];
    });
    solCache = { cases: cases, rues: rues }; solCle = cle;
    return solCache;
  }
  function dansLaVille(t) { var s = solVille(); return !!(s && s.cases[t.i * monde.terrain.N + t.j]); }
  // la grille du jeu sur l'écran : (i, j) -> le centre du losange de la case
  var secousse = { e: 0, f: 0 }; // la secousse de l'écran au décollage de la fusée, lue au début du dessin du sol
  function grilleEcran(c) {
    var s = V.s * V.dpr;
    c.setTransform(TR.TW * s, TR.TH * s, -TR.TW * s, TR.TH * s, secousse.e + (V.ox + TR.OX * V.s) * V.dpr, secousse.f + (V.oy + (TR.OY + TR.TH) * V.s) * V.dpr);
  }
  // ---------- les ombres au sol (tour 50) : une ombre douce sous chaque bâtiment, posée avant les images ----------
  // Les images ont chacune leur ombre (ou pas) ; celle-ci, la même pour tous, pose les objets sur le sol.
  var SANS_OMBRE = { 'golden-gate': 1, passerelle: 1, 'pont-pierre': 1, feu: 1, 'grand-champ': 1, 'grand-elevage': 1, ferme: 1, 'ferme-laitiere': 1 };
  // ADR-053 : l'ombre projetée d'un bâtiment suit sa forme. Elle est calculée une fois par image, à partir de sa silhouette :
  // dans chaque colonne, le pixel le plus bas touche le sol ; un point situé h pixels plus haut fait son ombre h × OMBRE.kx
  // plus à gauche et h × OMBRE.ky plus haut (la lumière des images vient de la droite : leurs faces de droite sont les plus
  // claires, mesuré sur les maisons). Une tour donne une longue ombre fine,
  // un pont l'ombre de ses piliers, une maison basse une ombre courte. Calculée en petit, puis agrandie : les bords sont doux.
  var OMBRE = { kx: -0.6, ky: 0.14, ech: 0.25, seuil: 150, force: 0.42 };
  function ombreDe(im) {
    if (im.__ombre !== undefined) return im.__ombre;
    im.__ombre = null;
    try {
      var e = OMBRE.ech, w = Math.max(8, Math.round(im.width * e)), h = Math.max(8, Math.round(im.height * e));
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var g = c.getContext('2d'); g.drawImage(im, 0, 0, w, h);
      var a = g.getImageData(0, 0, w, h).data, bas = new Int32Array(w).fill(-1);
      for (var x = 0; x < w; x++) for (var y = h - 1; y >= 0; y--) if (a[(y * w + x) * 4 + 3] > OMBRE.seuil) { bas[x] = y; break; }
      var dec = Math.ceil(h * Math.max(0, -OMBRE.kx)), pad = 4, W = w + Math.ceil(h * Math.abs(OMBRE.kx)) + 2 * pad, H = h + 2 * pad;
      var o = document.createElement('canvas'); o.width = W; o.height = H;
      var og = o.getContext('2d'), od = og.createImageData(W, H), d = od.data;
      for (var x2 = 0; x2 < w; x2++) {
        if (bas[x2] < 0) continue;
        for (var y2 = 0; y2 <= bas[x2]; y2++) {
          if (a[(y2 * w + x2) * 4 + 3] <= OMBRE.seuil) continue;
          var hh = bas[x2] - y2, X = Math.round(x2 + hh * OMBRE.kx) + pad + dec, Y = Math.round(bas[x2] - hh * OMBRE.ky) + pad;
          for (var sx = 0; sx < 2; sx++) for (var sy = 0; sy < 2; sy++) {
            var q = ((Y + sy) * W + X + sx) * 4;
            if (Y + sy < H && X + sx < W && X + sx >= 0) { d[q] = 34; d[q + 1] = 28; d[q + 2] = 20; d[q + 3] = 255; }
          }
        }
      }
      og.putImageData(od, 0, 0);
      // un flou bon marché : on réduit puis on agrandit deux fois
      var f = document.createElement('canvas'); f.width = Math.max(2, Math.round(W / 3)); f.height = Math.max(2, Math.round(H / 3));
      var fg = f.getContext('2d'); fg.imageSmoothingQuality = 'high'; fg.drawImage(o, 0, 0, f.width, f.height);
      og.clearRect(0, 0, W, H); og.imageSmoothingQuality = 'high'; og.drawImage(f, 0, 0, W, H);
      im.__ombre = { cv: o, pad: pad, dec: dec, e: e };
    } catch (err) { im.__ombre = null; im.__err = String(err); }
    return im.__ombre;
  }
  function dessinerOmbresSol() {
    var mode = BAC ? routesCfg.ombres : 'projetees';
    if (mode === 'avant') return;
    monde.batiments.forEach(function (b) {
      if (SANS_OMBRE[b.type] || (BAC && routesCfg.cacher)) return;
      if (!visible(b.x, b.y, 400)) return;
      var t = tailleBat(b); if (!t.im) return;
      if (mode === 'projetees') {
        var sh = ombreDe(t.im); if (!sh) return;
        var p = E(b.x, basBat(b)), k = t.w / (t.im.width * sh.e);
        var gauche = p[0] - t.w / 2, haut = p[1] - t.h * 0.93;
        ctx.globalAlpha = b.etat === 'fini' ? OMBRE.force : OMBRE.force * 0.5;
        ctx.drawImage(sh.cv, gauche - (sh.pad + sh.dec) * k, haut - sh.pad * k, sh.cv.width * k, sh.cv.height * k);
        ctx.globalAlpha = 1;
        return;
      }
      var rx = Math.min(t.w * 0.44, b.k * TR.TW * V.s * 0.98), ry = rx * 0.46;
      var c = E(b.x + b.k * TR.TW * 0.06, b.y + b.k * TR.TH * 0.22);
      var a = b.etat === 'fini' ? 0.34 : 0.2;
      ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(1, ry / rx);
      var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, 'rgba(48,34,18,' + a + ')'); g.addColorStop(0.55, 'rgba(48,34,18,' + (a * 0.6) + ')'); g.addColorStop(1, 'rgba(48,34,18,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  }
  // ---------- ADR-053 : les grandes exploitations, à l'échelle du jeu, composées sur leurs 6 x 6 cases ----------
  // Pas une seule image réduite : des sols de champs et de prés vus de dessus, posés sur les cases (comme les parcelles),
  // des bâtiments de ferme de la taille des autres bâtiments, des machines qui vont et viennent dans les champs,
  // des vaches (ou des moutons) qui broutent dans des prés clôturés. Le niveau ajoute des bêtes, des machines et du foin.
  var PIECES_FERME = {
    vapeur: { cour: 'sol-cour-terre', jeune: 'sol-jeune', grange: 'grange-briques', annexe: 'grange-foin', etable: 'etable-briques', silo: 'silo-briques',
      machine: 'locomobile', charrette: 'charrette', tas: 'meule', lait: 'bidons', vaches: ['vache-rousse', 'vache-rousse', 'vache-couchee'], autres: 'mouton' },
    moderne: { cour: 'sol-cour-beton', jeune: 'sol-mais', grange: 'hangar', annexe: 'silos-grain', etable: 'etable-metal', silo: 'silos-aliment',
      machine: 'moissonneuse', charrette: 'tracteur', tas: 'balles', lait: 'citerne', vaches: ['vache-noire', 'vache-noire', 'vache-broute'], autres: 'vache' }
  };
  // rectangles en cases depuis le coin de l'exploitation : [a (le long de i), b (le long de j), largeur, hauteur, sol]
  var PLANS_FERME = {
    champ: {
      sols: [[0, 0, 3, 2, 'cour'], [3, 0, 3, 3, 'sol-ble'], [0, 2, 3, 2, 'jeune'], [0, 4, 3, 2, 'sol-laboure'], [3, 3, 3, 3, 'sol-chaume']],
      bats: [['grange', 0, 0, 2], ['annexe', 2, 0, 1]],
      machines: [['machine', [3, 0, 3, 3], 1], ['charrette', [0, 4, 3, 2], 2], ['machine', [0, 2, 3, 2], 3]],
      tas: [3, 3, 3, 3]
    },
    elevage: {
      sols: [[0, 0, 3, 3, 'cour'], [3, 0, 3, 6, 'sol-pre'], [0, 3, 3, 3, 'sol-pre']],
      bats: [['etable', 0, 0, 2], ['silo', 2, 0, 1], ['lait', 2, 2, 1]],
      enclos: [[3, 0, 3, 6, 'vaches'], [0, 3, 3, 3, 'autres']]
    }
  };
  // ---------- le Golden Gate (tour 54) : il part de la plage et sort de l'écran ----------
  // Le départ (l'ancrage sur la plage, une travée, la deuxième tour) est posé sur ses cases ; puis la travée (une tour et
  // la travée suivante) est répétée vers le large jusqu'à sortir de l'écran : on n'en voit jamais la fin, il relie l'île
  // à autre chose. Mesures : tour54-feu-golden-gate/outils/mesures.json (en pixels des images, 1 pour 1 dans le monde).
  // (les tailles d'origine des deux images, pour les poser à la bonne échelle quelle que soit la taille du fichier)
  // « e » : l'échelle à laquelle on pose le pont dans le monde (les mesures sont en pixels des images)
  // tour 54 bis : le départ a une rampe qui part du sol (le pied du pont est le bout de plage où la route commence) ;
  // le pont est posé à 60 % de la taille des images (il était trop gros)
  // reprise 3 : plus de bout de plage peint sous la rampe ; le milieu du bout du tablier (« entree ») est posé au bord
  // de la case par où la route arrive, et la route y entre (TR.accesPont, Routes.calculer)
  var GG = { e: 0.6, entree: [1168.8, 73.1], travee: [125.8, 0], pas: [-495, 222], depart: [1272, 672], tra: [495, 672] };
  function goldenGate(b) { return b.type === 'golden-gate' && IMG['deco/golden-gate-depart'] && IMG['deco/golden-gate-travee']; }
  // vers où part le pont : le long de j (en bas à gauche) ou le long de i (en bas à droite, l'image retournée),
  // vers le large, à l'opposé du centre du village (TR.accesPont, reprise 3)
  function sensGG(b) { return TR.accesPont(monde.terrain, b).sens; }
  function piecesGoldenGate(b, liste) {
    var dep = IMG['deco/golden-gate-depart'], tra = IMG['deco/golden-gate-travee'];
    var fini = b.etat === 'fini' && M.merveilleFinie(b), miroir = sensGG(b) === 'i' ? -1 : 1;
    var pied = [b.x, b.y + b.k * TR.TH]; // la pointe avant de ses cases (pour l'ordre de dessin)
    var bout = [b.x + miroir * TR.TW * b.k / 2, b.y - TR.TH * b.k / 2]; // le milieu du bord de ses cases du côté de la route
    var e = GG.e, o = [bout[0] - miroir * GG.entree[0] * e, bout[1] - GG.entree[1] * e]; // le coin de l'image du départ, dans le monde
    var dessine = function (im, x, y, alpha) {
      var t0 = im === dep ? GG.depart : GG.tra, p = E(x, y), w = t0[0] * V.s * e, h = t0[1] * V.s * e;
      if (miroir > 0 ? (p[0] > V.W || p[0] + w < 0) : (p[0] < 0 || p[0] - w > V.W)) return;
      if (p[1] > V.H || p[1] + h < 0) return;
      ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.translate(p[0], p[1]); ctx.scale(miroir, 1);
      ctx.drawImage(im, 0, 0, w, h); ctx.restore();
    };
    if (!fini) {
      // le chantier : le départ sort de terre, de bas en haut
      var part = Math.min(1, ((b.etape || 0) + (b.etat === 'chantier' && b.besoin ? b.livre / b.besoin : 0)) / 3);
      liste.push({ y: pied[1], f: function () {
        dessine(dep, o[0], o[1], 0.2);
        var p = E(o[0], o[1]), h = GG.depart[1] * V.s * e;
        ctx.save(); ctx.beginPath(); ctx.rect(miroir > 0 ? p[0] : p[0] - GG.depart[0] * V.s * e, p[1] + h * (1 - 0.15 - 0.85 * part), GG.depart[0] * V.s * e, h); ctx.clip();
        dessine(dep, o[0], o[1]); ctx.restore();
      } });
      return;
    }
    liste.push({ y: pied[1], f: function () { dessine(dep, o[0], o[1]); } });
    // les travées, vers le large, jusqu'à sortir de l'écran
    for (var k = 1; k < 40; k++) {
      var x = o[0] + miroir * (GG.travee[0] + k * GG.pas[0]) * e, y = o[1] + (GG.travee[1] + k * GG.pas[1]) * e;
      var p = E(x, y);
      if (p[1] > V.H + 50 || (miroir > 0 ? p[0] + GG.tra[0] * V.s * e < -50 : p[0] - GG.tra[0] * V.s * e > V.W + 50)) break;
      (function (x, y) { liste.push({ y: y + GG.tra[1] * 0.9 * e, f: function () { dessine(tra, x, y); } }); })(x, y);
    }
  }
  function composee(b) { var d = D.batiments[b.type]; return d && d.plan && b.k >= d.taille && b.etat === 'fini'; }
  function imFerme(cle) { return IMG['ferme/' + cle]; }
  // un nombre au hasard, mais toujours le même pour une exploitation et un rang donnés
  function hasardFerme(b, n) { var x = Math.sin(b.id * 91.7 + n * 37.3) * 43758.5; return x - Math.floor(x); }
  function dessinerSolsFermes() {
    var liste = monde.batiments.filter(function (b) { return composee(b) && visible(b.x, b.y, 700); });
    if (!liste.length) return;
    ctx.save(); grilleEcran(ctx); ctx.imageSmoothingQuality = 'high';
    liste.forEach(function (b) {
      var d = D.batiments[b.type], F = PIECES_FERME[d.forme], P = PLANS_FERME[d.plan];
      P.sols.forEach(function (r) {
        var im = imFerme(F[r[4]] || r[4]); if (!im) return;
        for (var a = 0; a < r[2]; a++) for (var c = 0; c < r[3]; c++) {
          var i = b.i + r[0] + a, j = b.j + r[1] + c;
          ctx.drawImage(im, i - 0.502, j - 0.502, 1.004, 1.004);
        }
      });
    });
    ctx.restore();
  }
  // l'état des choses qui bougent (machines, bêtes) : seulement à l'écran, pas dans la sauvegarde
  var animFermes = {};
  function animFerme(b) {
    var A0 = animFermes[b.id];
    if (A0 && A0.type === b.type && A0.niveau === (b.niveau || 1)) return A0;
    var d = D.batiments[b.type], P = PLANS_FERME[d.plan], n = b.niveau || 1;
    A0 = animFermes[b.id] = { type: b.type, niveau: n, machines: [], betes: [] };
    (P.machines || []).forEach(function (m, k) {
      if (n < m[2]) return;
      A0.machines.push({ cle: m[0], r: m[1], voie: k % m[1][2], pos: hasardFerme(b, k) * (m[1][3] - 1), sens: 1 });
    });
    (P.enclos || []).forEach(function (e, k) {
      var nb = (e[4] === 'vaches' ? 3 : 2) + n * 2;
      for (var q = 0; q < nb; q++) {
        var x = e[0] + 0.25 + hasardFerme(b, 10 + k * 20 + q) * (e[2] - 0.5), y = e[1] + 0.25 + hasardFerme(b, 30 + k * 20 + q) * (e[3] - 0.5);
        A0.betes.push({ e: e, genre: e[4], q: q, a: x, c: y, va: x, vc: y, attente: hasardFerme(b, 50 + q) * 6, dir: 1 });
      }
    });
    return A0;
  }
  function majFermes(dt) {
    monde.batiments.forEach(function (b) {
      if (!composee(b)) return;
      var A0 = animFerme(b);
      A0.machines.forEach(function (m) {
        // la machine va et vient le long de sa rangée, puis passe à la rangée d'à côté
        m.pos += m.sens * dt * 0.28;
        if (m.pos > m.r[3] - 1) { m.pos = m.r[3] - 1; m.sens = -1; m.voie = (m.voie + 1) % m.r[2]; }
        if (m.pos < 0) { m.pos = 0; m.sens = 1; m.voie = (m.voie + 1) % m.r[2]; }
      });
      A0.betes.forEach(function (v) {
        var couchee = v.genre === 'vaches' && v.q % 3 === 2;
        if (couchee) return;
        if (v.attente > 0) { v.attente -= dt; return; }
        var dx = v.va - v.a, dy = v.vc - v.c, dd = Math.hypot(dx, dy);
        if (dd < 0.05) {
          v.va = v.e[0] + 0.25 + Math.random() * (v.e[2] - 0.5); v.vc = v.e[1] + 0.25 + Math.random() * (v.e[3] - 0.5);
          v.attente = 2 + Math.random() * 6; return;
        }
        var pas = Math.min(dd, dt * 0.18);
        v.a += dx / dd * pas; v.c += dy / dd * pas;
        // à l'écran, i va vers la droite et j vers la gauche
        var ecranX = dx - dy; if (Math.abs(ecranX) > 0.01) v.dir = ecranX > 0 ? 1 : -1;
      });
    });
  }
  function piecesFerme(b, liste) {
    var d = D.batiments[b.type], F = PIECES_FERME[d.forme], P = PLANS_FERME[d.plan], A0 = animFerme(b), n = b.niveau || 1;
    // les bâtiments
    P.bats.forEach(function (q) {
      var cle = F[q[0]], im = imFerme(cle); if (!im) return;
      var k = q[3], c = TR.centreEmpreinte(b.i + q[1], b.j + q[2], k), vehicule = q[0] === 'lait' && d.forme === 'moderne';
      var w = vehicule ? 110 : q[0] === 'lait' ? 52 : k === 1 ? 128 : 250, sol = c[1] + k * TR.TH * 0.55;
      liste.push({ y: sol - 6, f: function () { var p = E(c[0], sol), W = w * V.s, H = W * im.height / im.width; ombreSprite(im, p[0], p[1], W, H); dessinerSprite(im, p[0], p[1], W, H); } });
    });
    // le foin sur le chaume
    if (P.tas) {
      var r = P.tas, nbTas = 1 + n * 2;
      for (var t = 0; t < nbTas; t++) {
        var a = r[0] + 0.3 + hasardFerme(b, 70 + t) * (r[2] - 0.6), c2 = r[1] + 0.3 + hasardFerme(b, 80 + t) * (r[3] - 0.6);
        (function (a, c2) {
          var w0 = TR.centre(b.i + a, b.j + c2), im = imFerme(F.tas); if (!im) return;
          liste.push({ y: w0[1], f: function () { var p = E(w0[0], w0[1] + 8), W = 62 * V.s, H = W * im.height / im.width; dessinerSprite(im, p[0], p[1], W, H); } });
        })(a, c2);
      }
    }
    // les machines
    A0.machines.forEach(function (m) {
      var a = m.r[0] + m.voie, c3 = m.r[1] + m.pos, w0 = TR.centre(b.i + a, b.j + c3);
      var dos = m.sens < 0, im = imFerme(F[m.cle] + (dos ? '-dos' : '')); if (!im) return;
      liste.push({ y: w0[1] + 4, f: function () {
        var p = E(w0[0], w0[1] + 12), W = 96 * V.s, H = W * im.height / im.width;
        ombre(p[0], p[1] - 2 * V.s, W * 0.36, 7 * V.s, 0.18);
        ctx.drawImage(im, p[0] - W / 2, p[1] - H * 0.88, W, H);
        if (F[m.cle] === 'locomobile' && Math.random() < 0.08) particule({ type: 'pouf', x: w0[0] + (dos ? 14 : -30), y: w0[1] - 50, vx: 6, vy: -24, max: 1.4, r: 7, c: '240,240,235' });
      } });
    });
    // les prés : clôtures tout autour (une ouverture du côté de la cour), et les bêtes
    (P.enclos || []).forEach(function (e, k) {
      var segs = [];
      for (var a = 0; a < e[2]; a++) { segs.push(['i', e[0] + a, e[1] - 0.5]); segs.push(['i', e[0] + a, e[1] + e[3] - 0.5]); }
      for (var c = 0; c < e[3]; c++) { segs.push(['j', e[0] - 0.5, e[1] + c]); segs.push(['j', e[0] + e[2] - 0.5, e[1] + c]); }
      segs.forEach(function (sg, z) {
        if (z === 1 + k * 2) return; // une barrière ouverte
        var w0 = TR.centre(b.i + sg[1], b.j + sg[2]), im = imFerme(sg[0] === 'i' ? 'cloture-i' : 'cloture-j'); if (!im) return;
        liste.push({ y: w0[1] + 2, f: function () { var p = E(w0[0], w0[1]), W = 74 * V.s, H = W * im.height / im.width; ctx.drawImage(im, p[0] - W / 2, p[1] - H * 0.7, W, H); } });
      });
    });
    A0.betes.forEach(function (v) {
      var w0 = TR.centre(b.i + v.a, b.j + v.c);
      var cle = v.genre === 'autres' ? F.autres : F.vaches[v.q % F.vaches.length];
      var im = cle === 'mouton' ? IMG['faune/mouton'] : cle === 'vache' ? imFerme(F.vaches[v.q % 2]) : imFerme(cle);
      if (!im) return;
      liste.push({ y: w0[1], f: function () {
        var p = E(w0[0], w0[1]), W = (cle === 'mouton' ? 40 : 52) * V.s, H = W * im.height / im.width;
        ombre(p[0], p[1] - V.s, W * 0.34, 4 * V.s, 0.18);
        ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(v.dir > 0 ? -1 : 1, 1); ctx.drawImage(im, -W / 2, -H * 0.9, W, H); ctx.restore();
      } });
    });
    // les étoiles du niveau, devant l'exploitation
    if (n > 1) { var tip = TR.centre(b.i + b.k - 0.5, b.j + b.k - 0.5); liste.push({ y: tip[1] + 40, f: function () { dessinerEtoiles(b, E(tip[0], tip[1]), tailleBat(b), n, 0); } }); }
  }
  // l'ombre projetée d'une image posée par le code (même calcul que pour les bâtiments)
  function ombreSprite(im, x, y, W, H) {
    if (BAC && routesCfg.ombres === 'avant') return;
    var sh = ombreDe(im); if (!sh) return;
    var k = W / (im.width * sh.e);
    ctx.globalAlpha = OMBRE.force;
    ctx.drawImage(sh.cv, x - W / 2 - (sh.pad + sh.dec) * k, y - H * 0.93 - sh.pad * k, sh.cv.width * k, sh.cv.height * k);
    ctx.globalAlpha = 1;
  }
  function dessinerSolVille() {
    var S = solVille(); if (!S) return;
    var T = monde.terrain, N = T.N, st = styleRoute();
    var rue = IMG['parcelles/' + st + '-9'];
    ctx.save();
    var base = ctx.getTransform();
    secousse = { e: base.e, f: base.f };
    grilleEcran(ctx);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    var vus = function (k) { var i = Math.floor(k / N), j = k % N, c = TR.centre(i, j); return visible(c[0], c[1], 140); };
    // 1. les rues de la ville : la matière de la rue de bord à bord (les trottoirs), puis la chaussée
    var rk = Object.keys(S.rues).filter(vus);
    if (rue) rk.forEach(function (k) { var i = Math.floor(k / N), j = k % N; ctx.drawImage(rue, i - 0.502, j - 0.502, 1.004, 1.004); });
    if (rk.length) { var sous = {}; rk.forEach(function (k) { sous[k] = S.rues[k]; }); dessinerRoutes(ctx, sous, true); }
    // 2. les parcelles, les cours et les jardinets
    Object.keys(S.cases).filter(vus).forEach(function (k) {
      var x = S.cases[k], im = IMG['parcelles/' + st + '-' + x.n]; if (!im) return;
      var i = Math.floor(k / N), j = k % N;
      ctx.save(); ctx.translate(i, j); ctx.rotate(x.r * Math.PI / 2);
      ctx.drawImage(im, -0.502, -0.502, 1.004, 1.004);
      ctx.restore();
    });
    ctx.setTransform(base);
    ctx.restore();
  }
  // ---------- la ville qui s'aménage (ADR-048) : places, jardinets, réverbères, bancs, bacs à fleurs ----------
  var NUM_EPOQUE = { romain: 3, 'moyen-age': 4, vapeur: 5, electricite: 6, moderne: 7 };
  // le centre du losange de chaque case, en part de la hauteur de l'image (outils/coupe.py du tour 48)
  var ANCRES_VILLE = { 'place-romaine': 0.6098, 'place-marche': 0.5429, 'place-fontaine': 0.619, 'place-fleurs': 0.6121, 'aire-jeux': 0.5224, square: 0.5844, 'jardin-romain': 0.6049, potager: 0.5871, 'jardin-barriere': 0.619, 'jardin-haie': 0.5188, 'jardin-moderne': 0.5762, verger: 0.5897 };
  var amenCache = null, amenCle = '';
  function villeActive() { return amenage() && routesCfg.ville === 'oui' && routesActives(); }
  function amenagement() {
    if (!villeActive()) return null;
    var r = reseauRoutes(), cle = reseauCle;
    if (!amenCache || cle !== amenCle) {
      var l = Routes.amenager(monde, r.cases), parCase = {};
      l.forEach(function (a) { parCase[a.i * monde.terrain.N + a.j] = a; });
      amenCache = { liste: l, parCase: parCase }; amenCle = cle;
    }
    return amenCache;
  }
  function imageVille(a) {
    var e = NUM_EPOQUE[styleRoute()] || 3, v = a.v;
    var n = {
      lampe: [null, null, null, 'ville/lampe-romaine', 'ville/lanterne', 'deco/lampadaire', '06-electricite/lampadaire', 'ville/lampe-moderne'][e],
      banc: ['ville/banc-romain', 'ville/banc-bois', 'ville/banc-fonte', 'ville/banc-fonte', 'ville/banc-moderne'][e - 3],
      bac: ['ville/amphore', 'ville/tonneau-fleurs', 'ville/urne-fonte', v < 0.91 ? 'ville/arbre-grille' : 'ville/urne-fonte', v < 0.91 ? 'ville/arbre-grille' : 'ville/bac-beton'][e - 3],
      place: ['ville/place-romaine', 'ville/place-marche', 'ville/place-fontaine', v < 0.6 ? 'ville/place-fleurs' : 'ville/square', v < 0.5 ? 'ville/aire-jeux' : 'ville/square'][e - 3],
      jardin: ['ville/jardin-romain', v < 0.7 ? 'ville/potager' : 'ville/verger', v < 0.7 ? 'ville/jardin-barriere' : 'ville/verger', v < 0.75 ? 'ville/jardin-haie' : 'ville/verger', v < 0.6 ? 'ville/jardin-moderne' : 'ville/jardin-haie'][e - 3]
    }[a.quoi];
    return n;
  }
  var TAILLE_VILLE = { lampe: 100, banc: 64, bac: 50 }; // en pixels du monde : hauteur des réverbères, largeur des bancs, hauteur des bacs
  function piedVille(a) {
    var z = a.z || 1, c = TR.centre(a.i + (z - 1) / 2, a.j + (z - 1) / 2), dx = a.dx || 0, dy = a.dy || 0;
    if (dx || dy) { var kt = solsVille() ? 0.64 / 0.34 : 1; dx *= kt; dy *= kt; } // avec le sol de la ville : sur le trottoir
    return [c[0] + (dx - dy) * TR.TW, c[1] + (dx + dy) * TR.TH];
  }
  function dessinerVille(a) {
    var nom = imageVille(a), im = nom && IMG[nom]; if (!im) return;
    var q = piedVille(a), p = E(q[0], q[1]);
    if (a.quoi === 'place' || a.quoi === 'jardin') {
      var w = 2 * TR.TW * V.s * (a.z || 1) * 1.01, h = w * im.height / im.width;
      ctx.drawImage(im, p[0] - w / 2, p[1] - h * (ANCRES_VILLE[nom.slice(6)] || 0.6), w, h);
      return;
    }
    var w2, h2;
    if (a.quoi === 'banc') { w2 = TAILLE_VILLE.banc * V.s; h2 = w2 * im.height / im.width; }
    else { h2 = (nom === 'ville/arbre-grille' ? 100 : TAILLE_VILLE[a.quoi]) * V.s; w2 = h2 * im.width / im.height; }
    ombre(p[0], p[1], w2 * 0.3, 3 * V.s, 0.16);
    // le banc tourne le dos à la maison : de face vers la route (on retourne l'image pour l'autre axe)
    var retourne = a.quoi === 'banc' ? (a.sens % 2 === 0) : (a.quoi === 'lampe' && nom === 'ville/lanterne' && a.v < 0.5);
    ctx.save(); ctx.translate(p[0], p[1]); if (retourne) ctx.scale(-1, 1);
    ctx.drawImage(im, -w2 / 2, -h2 * 0.93, w2, h2); ctx.restore();
  }
  function panneauBac() {
    if (!BAC || document.getElementById('bac')) return;
    var el = document.createElement('div'); el.id = 'bac';
    var groupes = [
      ['ville', 'Ville', [['oui', 'Aménagée'], ['non', 'Sans']]],
      ['sols', 'Sols', [['parcelles', 'Parcelles'], ['non', 'Herbe']]],
      ['ombres', 'Ombres', [['projetees', 'Projetées'], ['douces', 'Rondes'], ['avant', 'Sans']]],
      ['reseau', 'Réseau', [['usure', 'Sentiers usés'], ['plan', 'Tracé'], ['melange', 'Mélange'], ['aucun', 'Aucune route']]],
      ['rendu', 'Dessin', [['pieces', 'Pièces'], ['matiere', 'Matière'], ['taches', 'Taches d\'avant']]],
      ['style', 'Époque', [['auto', 'Celle du jeu'], ['romain', 'Romains'], ['moyen-age', 'Moyen Âge'], ['vapeur', 'Vapeur'], ['electricite', 'Électricité'], ['moderne', 'Moderne']]],
      ['largeur', 'Largeur', [['etroite', 'Étroite'], ['large', 'Large']]],
      ['vue', 'Voir', [['sansTaches', 'Sans les taches'], ['cacher', 'Sans bâtiments'], ['grille', 'Cases']]]
    ];
    el.innerHTML = groupes.map(function (g) {
      return '<div class="ligne"><b>' + g[1] + '</b>' + g[2].map(function (o) { return '<button data-g="' + g[0] + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>';
    }).join('');
    document.body.appendChild(el);
    function maj() {
      el.querySelectorAll('button').forEach(function (b) {
        var g = b.dataset.g, v = b.dataset.v;
        b.classList.toggle('on', g === 'vue' ? !!routesCfg[v] : routesCfg[g] === v);
      });
    }
    el.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.g === 'vue') routesCfg[b.dataset.v] = !routesCfg[b.dataset.v];
      else routesCfg[b.dataset.g] = b.dataset.v;
      reseauCache = null; amenCache = null; solCache = null; usureT = 99; maj();
    });
    maj();
  }
  // les rails : des traverses en bois et deux rails, d'une case à l'autre (le long des axes de la grille)
  function dessinerRails(u) {
    var R = monde.rails; if (!R || !R.tuiles || R.tuiles.length < 2) return;
    var pts = R.tuiles.map(function (c) { return TR.centre(c[0], c[1]); });
    u.save(); u.lineCap = 'round';
    for (var k = 0; k < pts.length - 1; k++) {
      var a = pts[k], b = pts[k + 1], dx = b[0] - a[0], dy = b[1] - a[1];
      // l'autre axe de la grille : la direction des traverses
      var px = dy > 0 === dx > 0 ? -TR.TW : TR.TW, py = TR.TH, L = Math.hypot(px, py), ex = px / L, ey = py / L;
      for (var f = 0; f < 1; f += 0.25) {
        var x = a[0] + dx * f, y = a[1] + dy * f;
        u.strokeStyle = 'rgba(122,84,52,0.95)'; u.lineWidth = 7 * G;
        u.beginPath(); u.moveTo((x - ex * 20) * G, (y - ey * 20) * G); u.lineTo((x + ex * 20) * G, (y + ey * 20) * G); u.stroke();
      }
      [-11, 11].forEach(function (o) {
        u.strokeStyle = 'rgba(120,124,132,1)'; u.lineWidth = 3.4 * G;
        u.beginPath(); u.moveTo((a[0] + ex * o) * G, (a[1] + ey * o) * G); u.lineTo((b[0] + ex * o) * G, (b[1] + ey * o) * G); u.stroke();
        u.strokeStyle = 'rgba(205,210,216,0.9)'; u.lineWidth = 1.4 * G;
        u.beginPath(); u.moveTo((a[0] + ex * o) * G, (a[1] + ey * o - 1.2) * G); u.lineTo((b[0] + ex * o) * G, (b[1] + ey * o - 1.2) * G); u.stroke();
      });
    }
    u.restore();
  }
  // le train : il sort du tunnel, s'arrête à la gare, repart dans le tunnel (décor animé, comme les pirogues)
  var train = { s: 0, etat: 'tunnel', attente: 6, sens: 1 };
  function cheminTrain() {
    var R = monde.rails; if (!R || !R.tuiles || R.tuiles.length < 2) return null;
    return R.tuiles.map(function (c) { return TR.centre(c[0], c[1]); }).reverse(); // du tunnel vers la gare
  }
  function majTrain(dt) {
    var pts = cheminTrain(); if (!pts) return;
    var n = pts.length - 1;
    if (train.attente > 0) { train.attente -= dt; if (train.attente <= 0 && train.etat === 'quai') { train.sens = -1; train.etat = 'roule'; } if (train.attente <= 0 && train.etat === 'tunnel') { train.sens = 1; train.etat = 'roule'; train.s = 0; } return; }
    var v = 1.6 * dt; // cases par seconde
    train.s += v * train.sens;
    if (train.sens > 0 && train.s >= n) { train.s = n; train.etat = 'quai'; train.attente = 7; }
    if (train.sens < 0 && train.s <= 0) { train.s = 0; train.etat = 'tunnel'; train.attente = 14 + Math.random() * 10; }
    if (train.etat === 'roule' && Math.random() < dt * 5) {
      var q = pointTrain(pts, train.s);
      particule({ type: 'fumee', x: q[0] - q[2] * 20, y: q[1] - 64, vx: 6 + Math.random() * 6, vy: -32, max: 2.4, r: 10, c: '252,250,248' });
    }
  }
  function pointTrain(pts, s) {
    var k = Math.min(pts.length - 2, Math.floor(s)), f = s - k, a = pts[k], b = pts[k + 1];
    // [x, y, sens gauche-droite (1 = vers la droite), monte (true = il s'éloigne vers le haut de l'écran)]
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, (b[0] - a[0]) * train.sens >= 0 ? 1 : -1, (b[1] - a[1]) * train.sens < 0];
  }
  // un véhicule a deux images : de face (il descend vers la gauche) et de dos (il monte vers la droite) ;
  // retournées, elles donnent les deux autres directions de la perspective
  function vueVehicule(nom, versDroite, monte) {
    var dos = monte && IMG[nom + '-dos'];
    return { im: dos || IMG[nom], miroir: dos ? !versDroite : versDroite };
  }
  function dessinerTrain() {
    var pts = cheminTrain(); if (!pts || !IMG['05-vapeur/train'] || (train.etat === 'tunnel' && train.attente > 0)) return;
    var q = pointTrain(pts, train.s), vu = vueVehicule('05-vapeur/train', q[2] > 0, q[3]), im = vu.im;
    var a = Math.min(1, train.s / 0.8); // il sort du tunnel peu à peu
    var w = (im === IMG['05-vapeur/train'] ? 190 : 158) * V.s, H = w * im.height / im.width, p = E(q[0], q[1] + 4);
    ctx.globalAlpha = a;
    ombre(p[0], p[1], w * 0.42, 7 * V.s, 0.18);
    ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(vu.miroir ? -1 : 1, 1);
    ctx.drawImage(im, -w / 2, -H * 0.86, w, H); ctx.restore();
    ctx.globalAlpha = 1;
  }
  function dessinerTunnel() {
    var R = monde.rails, im = IMG['05-vapeur/tunnel']; if (!R || !im || !R.tuiles || R.tuiles.length < 2) return;
    var t = R.tuiles, z = TR.centre(t[t.length - 1][0], t[t.length - 1][1]), y = TR.centre(t[t.length - 2][0], t[t.length - 2][1]);
    var w = 230 * V.s, H = w * im.height / im.width, p = E(z[0] + (z[0] - y[0]) * 0.35, z[1] + (z[1] - y[1]) * 0.35 + 30);
    // l'entrée du tunnel regarde vers le bas à gauche ; on la retourne quand les rails partent vers la droite
    ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(y[0] > z[0] ? -1 : 1, 1);
    ctx.drawImage(im, -w / 2, -H * 0.9, w, H); ctx.restore();
  }
  function dessinerFond(dt) {
    ctx.fillStyle = '#e2d4ba'; ctx.fillRect(0, 0, V.W, V.H);
    if (!sol || solEpoque !== monde.terrain.epoque) {
      construireSol(); redim();
      ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
      ctx.fillStyle = '#e2d4ba'; ctx.fillRect(0, 0, V.W, V.H);
    }
    majUsure(dt);
    var w = sol.width / G * V.s, h = sol.height / G * V.s;
    ctx.drawImage(sol, V.ox, V.oy, w, h);
    ctx.drawImage(usureCv, V.ox, V.oy, w, h);
  }

  // ---------- son ----------
  var audio = null, bruitages = {};
  // quelques bruitages enregistrés (ElevenLabs, assets/sons) ; sinon les petites notes ci-dessous
  function son(type) {
    var src = typeof SONS !== 'undefined' && SONS[type];
    if (src) {
      try {
        var a = bruitages[type] || (bruitages[type] = new Audio(src));
        a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () {});
        return;
      } catch (e) {}
    }
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime;
      var notes = type === 'pop' ? [[880, 0, .08], [1320, .05, .1]]
        : type === 'fini' ? [[523, 0, .15], [659, .1, .15], [784, .2, .25]]
        : type === 'decouverte' ? [[523, 0, .2], [659, .15, .2], [784, .3, .2], [1047, .45, .4]]
        : type === 'coq' ? [[660, 0, .1], [880, .12, .1], [990, .24, .12], [1320, .38, .4]]
        : type === 'pose' ? [[330, 0, .12], [440, .06, .12]] : [[600, 0, .08]];
      notes.forEach(function (n) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine'; o.frequency.value = n[0];
        g.gain.setValueAtTime(0, t + n[1]);
        g.gain.linearRampToValueAtTime(0.18, t + n[1] + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + n[1] + n[2]);
        o.connect(g); g.connect(audio.destination);
        o.start(t + n[1]); o.stop(t + n[1] + n[2] + 0.05);
      });
    } catch (e) {}
  }
  // ---------- musique (ADR-058) : une par âge, ElevenLabs, en boucle ----------
  // Les fichiers sont à côté de la page dans la version installée (window.MUSIQUE, rempli par build.py --pwa) ;
  // le fichier unique n'en a pas et reste sans musique. Deux lecteurs : le suivant entre en fondu pendant que l'autre sort,
  // pour boucler sans couture et pour passer d'un âge à l'autre.
  var MUS = { lecteurs: [], actif: null, piste: null, vol: 0.32, pret: false, pause: false };
  function musiqueVoulue() {
    var l = window.MUSIQUE || {};
    if (ui.musique === false || MUS.pause || ludiPause || document.hidden || !MUS.pret) return null;
    return l[monde.epoque] ? String(monde.epoque) : null;
  }
  function fondu(a, de, vers, duree, fin) {
    var t0 = performance.now();
    if (a._fondu) clearInterval(a._fondu);
    a._fondu = setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / (duree * 1000));
      try { a.volume = Math.max(0, Math.min(1, de + (vers - de) * k)); } catch (e) {}
      if (k >= 1) { clearInterval(a._fondu); a._fondu = null; if (fin) fin(); }
    }, 50);
  }
  function lancerPiste(piste, depuis) {
    var a = new Audio(window.MUSIQUE[piste]);
    a.preload = 'auto'; a.volume = 0; a._piste = piste;
    try { a.currentTime = depuis || 0; } catch (e) {}
    var p = a.play(); if (p && p.catch) p.catch(function () {});
    fondu(a, 0, MUS.vol, 2.5);
    MUS.lecteurs.push(a); MUS.actif = a; MUS.piste = piste;
  }
  function couperLecteur(a, duree) {
    fondu(a, a.volume, 0, duree, function () { try { a.pause(); a.removeAttribute('src'); a.load(); } catch (e) {} MUS.lecteurs = MUS.lecteurs.filter(function (x) { return x !== a; }); });
  }
  function majMusique() {
    var voulue = musiqueVoulue();
    if (voulue !== MUS.piste) {
      if (MUS.actif) couperLecteur(MUS.actif, voulue ? 2.5 : 0.8);
      MUS.actif = null; MUS.piste = null;
      if (voulue) lancerPiste(voulue);
      return;
    }
    // la boucle : 4 s avant la fin, la même piste repart du début en fondu
    var a = MUS.actif;
    if (a && a.duration && a.currentTime > a.duration - 4 && !a._relaye) { a._relaye = true; couperLecteur(a, 3.5); lancerPiste(a._piste, 0); }
  }
  // les navigateurs ne jouent un son qu'après un premier geste
  addEventListener('pointerdown', function () { MUS.pret = true; }, { capture: true, once: true });
  setInterval(majMusique, 400);
  document.addEventListener('visibilitychange', majMusique);

  // la voix : phrases enregistrées (Arcads, voix de narratrice), sinon synthèse du navigateur
  function cleVoix(t) { return String(t || '').replace(/<[^>]+>/g, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').replace(/ ([.,])/g, '$1').trim(); }
  var lecteur = new Audio(), fileVoix = [], jeton = 0;
  lecteur.addEventListener('ended', function () { var j = jeton; setTimeout(function () { if (j === jeton) suivante(); }, 220); });
  function dire(texte) {
    if (!ui.voix) return;
    jeton++;
    fileVoix = (Array.isArray(texte) ? texte : [texte]).map(cleVoix).filter(Boolean);
    try { lecteur.pause(); } catch (e) {}
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
    suivante();
  }
  function suivante() {
    var t = fileVoix.shift();
    if (!t) return;
    var v = typeof VOIX !== 'undefined' && VOIX[t];
    if (v) { lecteur.src = v; var p = lecteur.play(); if (p && p.catch) p.catch(function () {}); return; }
    if (!window.speechSynthesis) return suivante();
    try {
      var j = jeton, u = new SpeechSynthesisUtterance(t);
      u.lang = 'fr-FR'; u.rate = 0.95; u.pitch = 1.1;
      var vs = speechSynthesis.getVoices().filter(function (x) { return /^fr/i.test(x.lang); });
      if (vs.length) u.voice = vs[0];
      u.onend = function () { if (j === jeton) suivante(); };
      speechSynthesis.speak(u);
    } catch (e) {}
  }


  // ---------- particules ----------
  var parts = [];
  function particule(o) { parts.push(Object.assign({ vie: 0, max: 1, vx: 0, vy: 0, r: 8 }, o)); }
  function pouf(x, y, n, couleur) {
    for (var i = 0; i < (n || 10); i++) {
      var a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 80;
      particule({ type: 'pouf', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5 - 30, max: 0.7 + Math.random() * 0.4, r: 10 + Math.random() * 10, c: couleur || '255,250,240' });
    }
  }

  // ---------- dessin ----------
  var T = 0;
  var TAILLE_HAB = { sage: 66, enfant: 48, adulte: 62 }; // ADR-014 : bien plus petits que les huttes
  // l'image d'un bâtiment change avec son niveau (ADR-031)
  var GRANDIT = { 2: 1.16, 3: 1.32 };
  function tailleBat(b) {
    var d = D.batiments[b.type], n = b.niveau || 1, im = IMG[d.sprite], k = 1;
    if (b.type === 'lampadaire' && monde.decouvertes.ampoule && IMG['06-electricite/lampadaire']) im = IMG['06-electricite/lampadaire'];
    if (n > 1 && IMG['niveaux/' + b.type + '-' + n] && (!d.postes || b.k >= (d.taille || 1))) { im = IMG['niveaux/' + b.type + '-' + n]; k = d.grandit ? d.grandit[n] : GRANDIT[n] / (b.k > 1 ? 1.06 : 1); }
    // ADR-042, ADR-051 : les monuments sont plus grands ; ceux posés avant, sur moins de place, gardent leur ancienne taille
    if (d.grand && b.k >= (d.taille || 1)) k *= d.grand;
    else if (d.grandAvant && b.k >= (d.tailleAvant || 1)) k *= d.grandAvant;
    var w = d.largeur * V.s * k;
    return { w: w, h: im ? w * im.height / im.width : w, im: im };
  }
  function basBat(b) {
    return b.y + b.k * TR.TH * 0.55;
  }
  function dessinerSprite(im, x, y, w, h, alpha) {
    if (!im) return;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.drawImage(im, x - w / 2, y - h * 0.93, w, h);
    ctx.globalAlpha = 1;
  }
  function dessinerBat(b) {
    var p = E(b.x, basBat(b)), t = tailleBat(b);
    if (b.type === 'passerelle' || b.type === 'pont-pierre') return dessinerPasserelle(b, t);
    if (b.etat === 'fini' && b.type === 'feu' && M.phase(monde) === 'nuit') {
      var ic = IMG[monde.cycle.t < 10 ? 'nuit/feu-braises' : 'nuit/feu-cendres'];
      if (ic) { var wc = t.w * 0.82; dessinerSprite(ic, p[0], p[1], wc, wc * ic.height / ic.width); return; }
    }
    if (enCoupe(b)) { var cc = cadreCoupe(b); ctx.drawImage(cc.im, cc.x, cc.y, cc.w, cc.h); return; }
    if (b.enFeu) {
      // la maison en feu : l'image un peu assombrie, et une lueur orange qui vacille
      dessinerSprite(t.im, p[0], p[1], t.w, t.h);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var gy = p[1] - t.h * 0.5, gr = ctx.createRadialGradient(p[0], gy, 0, p[0], gy, t.w * 0.6);
      gr.addColorStop(0, 'rgba(255,120,30,' + (0.35 + Math.sin(T * 13) * 0.08) + ')'); gr.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p[0], gy, t.w * 0.6, 0, 7); ctx.fill(); ctx.restore();
      return;
    }
    if (D.batiments[b.type].merveille && !M.merveilleFinie(b)) { dessinerMerveille(b, p, t); return; }
    if (b.etat === 'fini') {
      var k = 1, age = monde.t - (b.apparu || -10);
      if (age < 0.7) k = 1 + Math.sin(age / 0.7 * Math.PI) * 0.18 * (1 - age / 0.7) - (age < 0.1 ? 0.3 * (1 - age / 0.1) : 0);
      dessinerSprite(t.im, p[0], p[1], t.w * k, t.h * (2 - k));
      if ((b.niveau || 1) > 1) dessinerEtoiles(b, p, t, b.niveau, 0);
      if (b.type === 'centrale' && Math.random() < 0.03) particule({ type: 'eclat', x: b.x + (Math.random() - 0.5) * 60, y: basBat(b) - 50, vx: (Math.random() - 0.5) * 50, vy: -60, max: 0.4, r: 2.5, c: '255,236,140' });
      return;
    }
    var prog = b.besoin ? b.livre / b.besoin : 1;
    if (b.niveauVise) {
      dessinerSprite(t.im, p[0], p[1], t.w, t.h);
      var c0 = E(b.x, b.y), rx0 = b.k * TR.TW * V.s * 0.7, ry0 = b.k * TR.TH * V.s * 0.7;
      ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = Math.max(2, 4 * V.s); ctx.lineCap = 'round';
      [[-rx0, 0], [rx0, 0], [0, ry0]].forEach(function (q) {
        ctx.beginPath(); ctx.moveTo(c0[0] + q[0], c0[1] + q[1]); ctx.lineTo(c0[0] + q[0], c0[1] + q[1] - t.h * 0.55); ctx.stroke();
      });
      ctx.beginPath(); ctx.moveTo(c0[0] - rx0, c0[1] - t.h * 0.4); ctx.lineTo(c0[0], c0[1] + ry0 - t.h * 0.4); ctx.lineTo(c0[0] + rx0, c0[1] - t.h * 0.4); ctx.stroke();
      dessinerEtoiles(b, p, t, b.niveau || 1, prog);
      return;
    }
    if (b.ancien) {
      var da = D.batiments[b.ancien], ia = IMG[da.sprite], wa = da.largeur * V.s;
      var pa = b.ancienXY ? E(b.ancienXY[0], b.ancienXY[1] + (b.ancienK || 1) * TR.TH * 0.55) : p;
      dessinerSprite(ia, pa[0], pa[1], wa, wa * ia.height / ia.width, 1 - prog * 0.9);
    }
    // piquets et cordeau du chantier, aux coins de l'empreinte
    var c = E(b.x, b.y), rx = b.k * TR.TW * V.s * 0.9, ry = b.k * TR.TH * V.s * 0.9;
    ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = Math.max(2, 4 * V.s); ctx.lineCap = 'round';
    [[-rx, 0], [rx, 0], [0, -ry], [0, ry]].forEach(function (q) {
      ctx.beginPath(); ctx.moveTo(c[0] + q[0], c[1] + q[1]); ctx.lineTo(c[0] + q[0], c[1] + q[1] - 24 * V.s); ctx.stroke();
    });
    ctx.globalAlpha = 0.55; ctx.setLineDash([6 * V.s, 6 * V.s]); ctx.lineWidth = Math.max(1.5, 2.5 * V.s);
    ctx.beginPath(); ctx.moveTo(c[0] - rx, c[1] - 16 * V.s); ctx.lineTo(c[0], c[1] - ry - 16 * V.s); ctx.lineTo(c[0] + rx, c[1] - 16 * V.s); ctx.lineTo(c[0], c[1] + ry - 16 * V.s); ctx.closePath(); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    dessinerSprite(t.im, p[0], p[1], t.w, t.h, 0.22);
    if (prog > 0) {
      ctx.save();
      var bas = p[1] + t.h * 0.07, hauteur = t.h * prog;
      ctx.beginPath(); ctx.rect(p[0] - t.w, bas - hauteur, t.w * 2, hauteur); ctx.clip();
      dessinerSprite(t.im, p[0], p[1], t.w, t.h);
      ctx.restore();
    }
  }
  // une merveille en construction : elle sort de terre par tiers, entourée d'échafaudages (ADR-030)
  function dessinerMerveille(b, p, t) {
    var fait = b.etape || 0, prog = b.etat === 'chantier' && b.besoin ? b.livre / b.besoin : 0;
    var part = Math.min(1, (fait + prog) / 3);
    dessinerSprite(t.im, p[0], p[1], t.w, t.h, 0.18);
    ctx.save();
    var bas = p[1] + t.h * 0.07, hauteur = t.h * (0.12 + 0.88 * part);
    ctx.beginPath(); ctx.rect(p[0] - t.w, bas - hauteur, t.w * 2, hauteur); ctx.clip();
    dessinerSprite(t.im, p[0], p[1], t.w, t.h);
    ctx.restore();
    // échafaudages en bois
    var c = E(b.x, b.y), rx = b.k * TR.TW * V.s * 0.8, ry = b.k * TR.TH * V.s * 0.8, haut = t.h * 0.75;
    ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = Math.max(2, 4 * V.s); ctx.lineCap = 'round';
    [[-rx, 0], [rx, 0], [0, ry], [-rx * 0.5, ry * 0.5], [rx * 0.5, ry * 0.5]].forEach(function (q) {
      ctx.beginPath(); ctx.moveTo(c[0] + q[0], c[1] + q[1]); ctx.lineTo(c[0] + q[0], c[1] + q[1] - haut); ctx.stroke();
    });
    ctx.lineWidth = Math.max(1.5, 3 * V.s);
    [0.35, 0.7].forEach(function (f) {
      ctx.beginPath(); ctx.moveTo(c[0] - rx, c[1] - haut * f); ctx.lineTo(c[0] - rx * 0.5, c[1] + ry * 0.5 - haut * f); ctx.lineTo(c[0], c[1] + ry - haut * f);
      ctx.lineTo(c[0] + rx * 0.5, c[1] + ry * 0.5 - haut * f); ctx.lineTo(c[0] + rx, c[1] - haut * f); ctx.stroke();
    });
    // trois pastilles : les étapes
    var r = Math.max(7, 10 * V.s), y = p[1] + 10 * V.s;
    for (var i = 0; i < 3; i++) {
      var x = p[0] + (i - 1) * r * 2.6;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7);
      ctx.fillStyle = i < fait ? '#ffd23f' : 'rgba(255,255,255,.7)'; ctx.fill();
      if (i === fait && prog > 0) { ctx.save(); ctx.clip(); ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - r, y + r - 2 * r * prog, 2 * r, 2 * r * prog); ctx.restore(); }
      ctx.lineWidth = 2; ctx.strokeStyle = '#8a5a32'; ctx.stroke();
    }
  }
  // les étoiles du niveau, sous le bâtiment (ADR-021)
  function dessinerEtoiles(b, p, t, n, prog) {
    var total = prog ? n + 1 : n, r = Math.max(6, 9 * V.s), y = p[1] + 8 * V.s;
    for (var i = 0; i < total; i++) {
      var x = p[0] + (i - (total - 1) / 2) * r * 2.3;
      var plein = i < n || (prog && i === n && prog >= 1);
      ctx.save(); ctx.translate(x, y);
      ctx.beginPath();
      for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath();
      ctx.fillStyle = plein ? '#ffd23f' : 'rgba(255,255,255,.55)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#8a5a32'; ctx.stroke();
      if (!plein && prog && i === n) { ctx.save(); ctx.clip(); ctx.fillStyle = '#ffd23f'; ctx.fillRect(-r, r - 2 * r * prog, 2 * r, 2 * r * prog); ctx.restore(); }
      ctx.restore();
    }
  }
  // la passerelle : une vraie image de pont en bois, posée sur l'axe du gué (déformée en biais pour suivre la grille)
  // les deux bouts du tablier dans l'image : le pont de bois, puis le pont de pierre du Moyen Âge
  var PONT_PIERRE = [0.08, 0.71, 0.92, 0.14, 440]; // bouts du tablier (x, y) à gauche puis à droite, longueur voulue
  var PONTS = {
    passerelle: { im: 'eau/pont-bois', ax: 0.0475, ay: 0.80, bx: 0.9907, by: 0.20, long: 400 },
    'pont-pierre': { im: 'eau/pont-pierre', ax: PONT_PIERRE[0], ay: PONT_PIERRE[1], bx: PONT_PIERRE[2], by: PONT_PIERRE[3], long: PONT_PIERRE[4] }
  };
  function dessinerPasserelle(b, t) {
    var PONT = PONTS[b.type], g = monde.terrain.gues, im = IMG[PONT.im];
    var a = TR.centre(g[0][0], g[0][1]), z = TR.centre(g[g.length - 1][0], g[g.length - 1][1]);
    var pa = E(a[0], a[1]), pz = E(z[0], z[1]);
    if (pa[0] > pz[0]) { var tmp = pa; pa = pz; pz = tmp; } // de gauche à droite
    // on prolonge d'une demi-tuile de chaque côté pour poser les bouts sur les berges
    var ux = pz[0] - pa[0], uy = pz[1] - pa[1], L = Math.hypot(ux, uy);
    var ext = Math.max(TR.TW * 0.75 * V.s, (PONT.long * V.s - L) / 2) / L; // assez long pour que le pont ait de l'allure
    pa = [pa[0] - ux * ext, pa[1] - uy * ext]; pz = [pz[0] + ux * ext, pz[1] + uy * ext];
    var prog = b.etat === 'fini' ? 1 : (b.besoin ? b.livre / b.besoin : 0);
    if (!im) return;
    var W = im.width, H = im.height;
    var monte = pz[1] < pa[1]; // le pont monte vers la droite comme l'image ; sinon on la retourne
    var Ax = (PONT.bx - PONT.ax) * W, Ay = (PONT.by - PONT.ay) * H;
    var dx = pz[0] - pa[0], dy = pz[1] - pa[1];
    var sx = dx / Ax, k;
    ctx.save();
    ctx.translate(pa[0], pa[1]);
    if (monte) {
      k = (dy - Ay * sx) / dx; // biais vertical : les poteaux restent droits
      ctx.transform(1, k, 0, 1, 0, 0);
      ctx.scale(sx, sx);
      ctx.translate(-PONT.ax * W, -PONT.ay * H);
    } else {
      // image retournée : son bout droit (bx, by) devient le bout gauche
      k = (dy + Ay * sx) / dx;
      ctx.transform(1, k, 0, 1, 0, 0);
      ctx.scale(-sx, sx);
      ctx.translate(-PONT.bx * W, -PONT.by * H);
    }
    if (prog < 1) {
      ctx.globalAlpha = 0.25; ctx.drawImage(im, 0, 0); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.rect(0, 0, W * prog, H); ctx.clip();
    }
    ctx.drawImage(im, 0, 0);
    ctx.restore();
  }


  // hauteur des pieds dans l'image (dernière ligne bien opaque), pour poser l'ombre juste dessous
  function pied(im) {
    if (im.__pied != null) return im.__pied;
    var r = 0.94; im.__piedX = 0.5;
    try {
      var c = document.createElement('canvas'), w = Math.min(im.width, 160), h = Math.round(im.height * w / im.width);
      c.width = w; c.height = h;
      var x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h);
      var d = x.getImageData(0, 0, w, h).data;
      for (var y = h - 1; y > h * 0.5; y--) {
        var n = 0;
        for (var i = 0; i < w; i++) if (d[(y * w + i) * 4 + 3] > 200) n++;
        if (n > 1) { r = (y + 1) / h; break; }
      }
      // milieu des pieds : sur la bande du bas, pour que deux images d'une animation restent alignées
      var sx = 0, sn = 0, y0 = Math.floor(r * h) - 1, y1 = Math.max(0, y0 - Math.round(h * 0.07));
      for (var yy = y1; yy <= y0; yy++) for (var xx = 0; xx < w; xx++) if (d[(yy * w + xx) * 4 + 3] > 200) { sx += xx; sn++; }
      if (sn) im.__piedX = (sx / sn + 0.5) / w;
    } catch (e) {}
    im.__pied = r;
    return r;
  }
  function ombre(x, y, rx, ry, a) {
    ctx.fillStyle = 'rgba(60,40,20,' + (a || 0.22) + ')';
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  }

  function dessinerObjet(objet, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (objet === 'bois') {
      ctx.fillStyle = '#9b6235'; ctx.strokeStyle = '#6e4220'; ctx.lineWidth = 2;
      for (var i = 0; i < 2; i++) { ctx.beginPath(); ctx.roundRect(-16, -7 - i * 9, 32, 9, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e2b47c'; ctx.beginPath(); ctx.ellipse(16, -2.5 - i * 9, 3, 4.5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#9b6235'; }
    } else if (objet === 'poisson') {
      ctx.fillStyle = '#8fb3c9'; ctx.beginPath(); ctx.ellipse(0, -8, 14, 7, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(12, -8); ctx.lineTo(22, -15); ctx.lineTo(22, -1); ctx.fill();
      ctx.fillStyle = '#2b3a44'; ctx.beginPath(); ctx.arc(-7, -10, 1.8, 0, 7); ctx.fill();
    } else if ((objet === 'viande' || objet === 'lapin')) {
      ctx.fillStyle = '#b5523b'; ctx.beginPath(); ctx.ellipse(-3, -10, 12, 9, -0.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#f3e7d3'; ctx.beginPath(); ctx.roundRect(6, -6, 12, 5, 2.5); ctx.fill();
    } else if (objet === 'silex') {
      ctx.fillStyle = '#8e8c94'; ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(0, -20); ctx.lineTo(12, -2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b9b7bf'; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(0, -15); ctx.lineTo(4, -6); ctx.fill();
    } else if (objet === 'ble') {
      ctx.strokeStyle = '#d9a63a'; ctx.lineWidth = 3;
      for (var j = -2; j <= 2; j++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(j * 5, -20); ctx.stroke(); }
      ctx.fillStyle = '#e8b94a'; for (var k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(k * 5, -21, 3, 5, 0, 0, 7); ctx.fill(); }
    } else if (objet === 'minerai') {
      [[-8, -6, '#6f8f7a'], [5, -8, '#8a8f96'], [-2, -15, '#5f9b80'], [9, -16, '#9a8f86']].forEach(function (q) { ctx.fillStyle = q[2]; ctx.beginPath(); ctx.ellipse(q[0], q[1], 7, 5.5, 0, 0, 7); ctx.fill(); });
    } else if (objet === 'outil') {
      ctx.fillStyle = '#8a5a32'; ctx.fillRect(-2, -24, 4, 22);
      ctx.fillStyle = '#c9963c'; ctx.beginPath(); ctx.moveTo(-2, -24); ctx.lineTo(-13, -26); ctx.lineTo(-13, -14); ctx.lineTo(-2, -17); ctx.closePath(); ctx.fill();
    } else if (objet === 'argile') {
      ctx.fillStyle = '#b8714a'; ctx.beginPath(); ctx.ellipse(0, -9, 13, 9, 0, 0, 7); ctx.fill();
    } else if (objet === 'baies') {
      ctx.fillStyle = '#c99a5b'; ctx.beginPath(); ctx.roundRect(-12, -12, 24, 12, 4); ctx.fill();
      ctx.fillStyle = '#d33a2c'; [[-6, -14], [0, -16], [6, -14], [-3, -18], [3, -18]].forEach(function (q) { ctx.beginPath(); ctx.arc(q[0], q[1], 3.6, 0, 7); ctx.fill(); });
    } else if (objet === 'pot' || objet === 'lait' || objet === 'farine') {
      ctx.fillStyle = objet === 'pot' ? '#c2683f' : '#b8794e'; ctx.beginPath(); ctx.ellipse(0, -10, 10, 11, 0, 0, 7); ctx.fill();
      ctx.fillRect(-6, -24, 12, 6);
      ctx.fillStyle = objet === 'lait' ? '#fffaf0' : objet === 'farine' ? '#f3ead8' : '#e9a274'; ctx.beginPath(); ctx.ellipse(0, -23, 6, 2.5, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
  }



  // la nuit, les maisons qui ont des dormeurs s'ouvrent en coupe et on les voit couchés dedans (ADR-019)
  // COUCHAGES : places des couchages dans l'image en coupe (fractions de largeur et de hauteur)
  var COUCHAGES_PIERRE = [[0.36, 0.62], [0.6, 0.56], [0.44, 0.8], [0.66, 0.7]];
  var COUCHAGES_COUR = [[0.27, 0.53], [0.22, 0.61], [0.37, 0.65], [0.53, 0.6], [0.48, 0.82], [0.66, 0.74]];
  var COUCHAGES_BRIQUES = [[0.68, 0.45], [0.76, 0.52], [0.45, 0.59], [0.6, 0.8]]; // réglés sur coupe/maison-briques
  var COUCHAGES_IMMEUBLE = [[0.37, 0.26], [0.25, 0.45], [0.25, 0.63], [0.25, 0.81], [0.38, 0.46], [0.38, 0.64]]; // réglés sur coupe/immeuble
  var COUCHAGES = {
    'tente': [[0.43, 0.56], [0.66, 0.54]],
    'hutte-branches': [[0.36, 0.6], [0.66, 0.57], [0.52, 0.5]],
    'hutte-peaux': [[0.38, 0.5], [0.66, 0.48], [0.68, 0.66]],
    'maison-torchis': [[0.4, 0.6], [0.56, 0.5], [0.72, 0.58]],
    'maison-longue': [[0.42, 0.6], [0.5, 0.5], [0.6, 0.44], [0.7, 0.55], [0.8, 0.48]],
    'maison-pierre': COUCHAGES_PIERRE,
    'maison-cour': COUCHAGES_COUR,
    'maison-colombages': [[0.37, 0.5], [0.53, 0.46], [0.68, 0.53], [0.29, 0.55]],
    'maison-etages': [[0.4, 0.49], [0.26, 0.53], [0.52, 0.62], [0.43, 0.27], [0.27, 0.31], [0.52, 0.37]],
    'maison-briques': COUCHAGES_BRIQUES,
    immeuble: COUCHAGES_IMMEUBLE,
    'maison-ville': [[0.46, 0.37], [0.66, 0.3], [0.46, 0.56], [0.7, 0.52], [0.48, 0.79], [0.72, 0.74]], // réglés sur coupe/maison-ville
    'grand-immeuble': [[0.33, 0.24], [0.24, 0.44], [0.26, 0.63], [0.24, 0.8], [0.44, 0.5], [0.45, 0.69], [0.46, 0.87]] // réglés sur coupe/grand-immeuble
  };
  function enCoupe(b) {
    if (b && b.enFeu) return false; return b && b.etat === 'fini' && COUCHAGES[b.type] && IMG['coupe/' + b.type] && dormeursChez[b.id] > 0; }
  function cadreCoupe(b) {
    var t = tailleBat(b), im = IMG['coupe/' + b.type], p = E(b.x, basBat(b));
    var w = t.w * 1.02, h = w * im.height / im.width;
    return { im: im, x: p[0] - w / 2, y: p[1] - h * 0.93, w: w, h: h, cx: p[0], cy: p[1] };
  }
  function placeCouchage(b, i) {
    var c = cadreCoupe(b), l = COUCHAGES[b.type], q = l[i % l.length], tour = Math.floor(i / l.length);
    return [c.x + q[0] * c.w + tour * 10 * V.s, c.y + q[1] * c.h + tour * 6 * V.s, c.w];
  }
  // les dormeurs d'une même maison se rangent sur les couchages (ADR-017, ADR-019)
  var LITS = { 'tete-adulte': 60, 'tete-enfant': 48, 'deux-tetes': 70, 'tete-sage': 62 };
  var dormeursChez = {};
  var couchage = {};
  function rangerDormeurs() {
    couchage = {}; dormeursChez = {};
    monde.habitants.forEach(function (h) { if (h.dort && h.dortChez) dormeursChez[h.dortChez] = (dormeursChez[h.dortChez] || 0) + 1; });
    var groupes = {};
    monde.habitants.forEach(function (h) {
      if (!h.dort) return;
      var k = h.dortChez || ('dehors' + h.id);
      (groupes[k] = groupes[k] || []).push(h);
    });
    Object.keys(groupes).forEach(function (k) {
      var g = groupes[k].sort(function (a, b) { return a.id - b.id; });
      var enfants = g.filter(function (h) { return h.enfant; });
      var lits = [];
      g.forEach(function (h) {
        if (h.enfant && h.couche) return;
        if (h.allure === 'sage') { lits.push({ sp: 'tete-sage', h: h }); return; }
        if (h.enfant) { lits.push({ sp: 'tete-enfant', h: h }); return; }
        var e = enfants.filter(function (c) { return !c.couche; })[0];
        if (e) { e.couche = true; lits.push({ sp: 'deux-tetes', h: h, avec: e }); }
        else lits.push({ sp: 'tete-adulte', h: h });
      });
      g.forEach(function (h) { h.couche = false; });
      var b = M.bat(monde, g[0].dortChez);
      lits.forEach(function (l, i) {
        couchage[l.h.id] = { sp: l.sp, i: i, n: lits.length, b: b };
        if (l.avec) couchage[l.avec.id] = { cache: true };
      });
    });
  }
  function dessinerDormeur(h) {
    var c = couchage[h.id];
    if (!c || c.cache) return;
    var im = IMG['nuit/' + c.sp];
    var p = E(h.x, h.y);
    if (enCoupe(c.b)) {
      var pl = placeCouchage(c.b, c.i), lw = LITS[c.sp] / 230 * pl[2], lh = im ? lw * im.height / im.width : 0;
      if (im) ctx.drawImage(im, pl[0] - lw / 2, pl[1] - lh * 0.6, lw, lh * (1 + Math.sin(T * 1.6 + h.id) * 0.015));
      var kz = (T * 0.5 + h.id * 0.37) % 1;
      ctx.font = '700 ' + Math.round(11 + 7 * kz) + 'px Fredoka, system-ui';
      ctx.fillStyle = 'rgba(235,240,255,' + (1 - kz) + ')'; ctx.textAlign = 'center';
      ctx.fillText('z', pl[0] + 8 * V.s + kz * 12, pl[1] - 20 * V.s - kz * 26 * V.s);
      return;
    }
    if (c.b) {
      var pb = E(c.b.x, basBat(c.b)), ecart = Math.min(48, tailleBat(c.b).w / V.s / Math.max(1, c.n)) * V.s;
      p = [pb[0] + (c.i - (c.n - 1) / 2) * ecart, Math.max(p[1], pb[1] + 6 * V.s) + (c.i % 2) * 6 * V.s];
    }
    if (im) {
      var w = LITS[c.sp] * V.s, H = w * im.height / im.width;
      var souffle = 1 + Math.sin(T * 1.6 + h.id) * 0.015;
      ctx.drawImage(im, p[0] - w / 2, p[1] - H * 0.8 * souffle, w, H * souffle);
    }
    var k = (T * 0.5 + h.id * 0.37) % 1;
    ctx.font = '700 ' + Math.round(11 + 7 * k) + 'px Fredoka, system-ui';
    ctx.fillStyle = 'rgba(235,240,255,' + (1 - k) + ')';
    ctx.textAlign = 'center';
    ctx.fillText('z', p[0] + 10 * V.s + k * 14, p[1] - 26 * V.s - k * 30 * V.s);
  }

  var POSE_REF = 220; // hauteur d'un habitant debout sur la planche des poses, une fois réduite
  // vitesse de l'animation en deux images, par pose (images par seconde)
  var CADENCE = { bucheron: 2.4, tailleur: 3, chasseur: 1.3, pecheur: 1.3, cueilleuse: 1.2, peintre: 1.2, 'sage-assis': 0.6,
    'allume-feu': 1.6, 'paysan-faucille': 1.6, 'berger-agneau': 0.9, potiere: 1.1, meuniere: 1.8,
    'e3-forgeron': 2.6, 'e3-scribe': 0.8, 'e3-marchande': 0.9, 'e3-marin': 1.2, 'e3-charron': 2.2, 'e3-bucheron': 2.4, 'e3-faucille': 1.6, 'e3-tour-potier': 1.4,
    'e4-marechal': 2.6, 'e4-meunier': 1.2, 'e4-boulangere': 1.1, 'e4-horloger': 0.8, 'e4-imprimeur': 1.3, 'e4-bucheron': 2.4, 'e4-faucille': 1.6, 'e4-marchande': 0.9,
    'e5-mineur': 2.4, 'e5-ouvriere': 1.4, 'e5-cheminot': 0.9, 'e5-inventrice': 1.2, 'e5-pompier': 3, 'e5-bucheron': 2.4, 'e5-faucille': 1.6, 'e5-matelot': 1.1,
    'e6-electricien': 1.6, 'e6-standardiste': 1.2, 'e6-aviatrice': 1.4, 'e6-mecanicien': 2, 'e6-fermier': 1.6, 'e6-chercheuse': 0.8, 'e6-citadine': 0.9, 'e6-bucheron': 2.4,
    'e7-informaticienne': 0.8, 'e7-caissier': 1.1, 'e7-ingenieur': 1.4, 'e7-technicien': 1.6, 'e7-astronome': 0.8, 'e7-bucheron': 2.4 };
  function spritePorteur(h) {
    var l = D.porteurs[monde.epoque] || {}, x = h.porte && l[h.porte];
    if (x && typeof x === 'object') x = D.femmes.indexOf(h.allure) >= 0 ? x.f : x.h;
    return x ? IMG['porteurs/' + x] : null;
  }
  function dessinerHab(h) {
    if (h.dort) { dessinerDormeur(h); return; }
    var ar = !h.marche && h.etapes[0] && h.etapes[0].arrose;
    if (ar) dessinerPompe(h, M.bat(monde, ar));
    // le chasseur s'éloigne dans la forêt : il s'efface, puis revient (ADR-033)
    var dtl = Math.min(0.1, T - (h.__t || T)), cible = h.cache ? 0 : 1;
    h.__t = T;
    h.__a = h.__a == null ? cible : h.__a + Math.sign(cible - h.__a) * Math.min(Math.abs(cible - h.__a), dtl * 1.2);
    if (h.__a < 0.03) return;
    ctx.globalAlpha = h.__a;
    dessinerHabVisible(h);
    ctx.globalAlpha = 1;
  }
  function dessinerHabVisible(h) {
    var im = IMG['habitants/' + h.allure];
    if (!im) return;
    var base = (h.enfant ? TAILLE_HAB.enfant : h.allure === 'sage' ? TAILLE_HAB.sage : TAILLE_HAB.adulte) * V.s;
    var H = base;
    var pim = !h.marche && h.pose ? IMG['poses/' + h.pose] : null;
    if (pim) {
      // deux images qui alternent : le geste du travail (ADR-017)
      var fb = IMG['poses/' + h.pose + '-b'];
      if (fb && Math.floor(T * (CADENCE[h.pose] || 1.5) + h.id * 0.37) % 2) pim = fb;
      im = pim; H = base * pim.height / POSE_REF;
    }
    var porteur = !pim && h.porte ? spritePorteur(h) : null; // on porte dans les bras
    if (porteur) im = porteur;
    var w = H * im.width / im.height;
    var p = E(h.x, h.y), ph = h.id * 1.7;
    var bob = 0, rot = 0, sy = 1;
    if (h.marche) { bob = Math.abs(Math.sin(T * 11 + ph)) * 5 * V.s; rot = Math.sin(T * 11 + ph) * 0.05; }
    else if (pim) { bob = 0; rot = 0; }
    else if (h.anim === 'travail') { rot = Math.sin(T * 7 + ph) * 0.11; bob = Math.abs(Math.sin(T * 7 + ph)) * 2 * V.s; }
    else if (h.anim === 'marteau') { rot = Math.sin(T * 15 + ph) * 0.14; bob = Math.abs(Math.sin(T * 15 + ph)) * 4 * V.s; }
    else if (h.anim === 'jeu') { bob = Math.abs(Math.sin(T * 9 + ph)) * 10 * V.s; }
    else { sy = 1 + Math.sin(T * 2 + ph) * 0.018; }
    ombre(p[0], p[1] - V.s, w * (pim ? 0.26 : 0.3), 3.5 * V.s);
    ctx.save();
    ctx.translate(p[0], p[1] - bob);
    ctx.rotate(rot);
    ctx.scale(h.dir < 0 ? -1 : 1, sy);
    var py = pied(im);
    ctx.drawImage(im, -w * (pim ? im.__piedX : 0.5), -H * py, w, H);
    ctx.restore();
    if (h.porte && !porteur && !pim) dessinerObjet(h.porte, p[0] + (h.dir < 0 ? -1 : 1) * w * 0.18, p[1] - H * 0.42 - bob, V.s * 0.6);
    if (h.pouf > 0) {
      var k2 = 1 - h.pouf / 0.6;
      ctx.fillStyle = 'rgba(255,255,255,' + (1 - k2) + ')';
      for (var i = 0; i < 6; i++) { var a = i / 6 * 6.28; ctx.beginPath(); ctx.arc(p[0] + Math.cos(a) * 22 * k2 * V.s, p[1] - H / 2 + Math.sin(a) * 22 * k2 * V.s, (9 - 6 * k2) * V.s, 0, 7); ctx.fill(); }
    }
    if (!h.marche && (h.anim === 'travail' || h.anim === 'marteau') && Math.random() < 0.04) {
      particule({ type: 'eclat', x: h.x + (Math.random() - 0.5) * 16, y: h.y - 24, vx: (Math.random() - 0.5) * 60, vy: -50 - Math.random() * 30, max: 0.6, r: 3, c: h.anim === 'marteau' ? '170,120,70' : '210,190,140' });
    }
  }

  // le pompier arrose la maison en feu, à côté de la pompe à vapeur (le petit problème de la vapeur)
  function dessinerPompe(h, b) {
    var im = IMG['05-vapeur/pompe'];
    if (im) { var w = 70 * V.s, H = w * im.height / im.width, p = E(h.x + 38, h.y + 6); ombre(p[0], p[1], w * 0.4, 4 * V.s); ctx.drawImage(im, p[0] - w / 2, p[1] - H * 0.92, w, H); }
    if (b) {
      // le jet d'eau, de la lance jusqu'au toit
      var t = tailleBat(b), hx = b.x, hy = basBat(b) - t.h / V.s * 0.55;
      var dx = hx - h.x, dy = hy - (h.y - 30), d = Math.hypot(dx, dy) || 1;
      for (var q = 0; q < 2; q++) particule({ type: 'eau', x: h.x + (dx > 0 ? 16 : -16), y: h.y - 36, vx: dx / d * 300 + (Math.random() - 0.5) * 30, vy: dy / d * 300 - 60, max: Math.min(1.1, d / 300 + 0.15), r: 5, c: '120,185,245' });
    }
  }
  function dessinerAnimal(a) {
    if (a.disparu) return;
    if (a.espece === 'lapin') {
      // le lapin sautille : deux images, assis et en plein saut
      var saut = a.marche && Math.sin(T * 11 + a.id) > -0.2, il = IMG[saut ? 'faune/lapin-saut' : 'faune/lapin-assis'];
      if (!il) return;
      var lw = (saut ? 34 : 24) * V.s, lh = lw * il.height / il.width, pl = E(a.x, a.y);
      var hop = a.marche ? Math.abs(Math.sin(T * 11 + a.id)) * 9 * V.s : 0;
      ombre(pl[0], pl[1] - V.s, 9 * V.s, 2.5 * V.s, 0.16);
      ctx.save(); ctx.translate(pl[0], pl[1] - hop); ctx.scale(a.dir < 0 ? -1 : 1, 1);
      ctx.drawImage(il, -lw / 2, -lh * pied(il), lw, lh); ctx.restore();
      return;
    }
    var im = IMG[a.espece === 'mammouth' ? '01-pierre/mammouth' : a.espece === 'cheval' ? 'faune/cheval' : a.espece === 'mouton' ? 'faune/mouton' : '02-neolithique/chevre'];
    if (!im && a.espece === 'mouton') im = IMG['02-neolithique/chevre'];
    if (!im) return;
    var w = (a.espece === 'mammouth' ? 165 : a.espece === 'cheval' ? 74 : a.espece === 'mouton' ? 46 : 50) * V.s, H = w * im.height / im.width;
    var p = E(a.x, a.y), bob = a.marche ? Math.abs(Math.sin(T * (a.espece === 'mammouth' ? 4 : 9) + a.id)) * 3 * V.s : 0;
    // le mammouth : ses défenses descendent plus bas que ses pattes, on le pose sur ses pattes
    var mam = a.espece === 'mammouth', pd = mam ? 0.835 : pied(im);
    ombre(p[0] + (mam ? (a.dir < 0 ? 1 : -1) * w * 0.04 : 0), p[1] - (mam ? H * 0.05 : V.s), w * (mam ? 0.3 : 0.33), (mam ? 9 : 4) * V.s, 0.18);
    ctx.save(); ctx.translate(p[0], p[1] - bob); ctx.scale(a.dir < 0 ? 1 : -1, 1);
    ctx.drawImage(im, -w / 2, -H * pd, w, H); ctx.restore();
  }

  // ---------- la nature ----------
  var ARBRES_OUEST = [['nature/sapin-grand', 150], ['nature/sapin-moyen', 125], ['nature/sapins-double', 170], ['nature/sapin-moyen', 130], ['nature/sapin-petit', 95]];
  var ARBRES_AUTRES = [['nature/chene', 175], ['nature/arbre-clair', 150], ['nature/bouleau', 120], ['nature/sapin-moyen', 125], ['nature/sapin-grand', 145]];
  var DECO = { touffe: ['nature/touffe', 46], fleurs: ['nature/fleurs', 56], roseaux: ['nature/roseaux', 54], galets: ['nature/galets', 46] };
  function spriteObjet(t) {
    if (t.obj === 'arbre') { var l = (t.i - t.j) < -3 ? ARBRES_OUEST : ARBRES_AUTRES; return l[t.vari % l.length]; }
    if (t.obj === 'rocher') return t.sol === 'roche' ? ['nature/rochers', 120] : (t.vari % 2 ? ['nature/rocher-mousse', 100] : ['nature/pierres-plates', 90]);
    if (t.obj === 'grotte') return ['nature/grotte', 320];
    if (t.obj === 'souche') return ['nature/souche', 58];
    return null;
  }
  function visible(x, y, marge) {
    var p = E(x, y);
    return p[0] > -marge && p[0] < V.W + marge && p[1] > -marge * 0.5 && p[1] < V.H + marge * 1.5;
  }
  function dessinerTuileObjet(t) {
    var sp = spriteObjet(t); if (!sp) return;
    var im = IMG[sp[0]]; if (!im) return;
    var c = TR.centre(t.i, t.j), w = sp[1] * V.s, h = w * im.height / im.width;
    var p = E(c[0] + ((t.vari % 7) - 3) * 3, c[1] + 16);
    var balance = t.obj === 'arbre' && t.reserve ? Math.sin(T * 14) * 0.03 : Math.sin(T * 1.3 + t.vari) * 0.012;
    if (t.obj === 'arbre') {
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(balance); ctx.drawImage(im, -w / 2, -h * 0.93, w, h); ctx.restore();
    } else dessinerSprite(im, p[0], p[1], w, h);
  }
  function dessinerDeco(t) {
    var sp = DECO[t.deco]; if (!sp) return;
    var im = IMG[sp[0]]; if (!im) return;
    var c = TR.centre(t.i, t.j), w = sp[1] * V.s, h = w * im.height / im.width;
    var p = E(c[0] + ((t.vari % 9) - 4) * 6, c[1] + ((t.vari % 5) - 2) * 4);
    dessinerSprite(im, p[0], p[1], w, h);
  }
  function dessinerEau() {
    var T0 = monde.terrain;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1, 2 * V.s); ctx.lineCap = 'round';
    T0.tuiles.forEach(function (t) {
      if (t.sol !== 'eau' || !TR.surIle(T0, t)) return;
      var c = TR.centre(t.i, t.j);
      if (!visible(c[0], c[1], 80)) return;
      var ph = (T * 0.4 + t.vari * 0.013) % 1;
      var a = Math.sin(ph * Math.PI);
      ctx.globalAlpha = a * 0.7;
      var p = E(c[0] + ((t.vari % 11) - 5) * 6 + ph * 18, c[1] + ((t.vari % 7) - 3) * 4);
      ctx.beginPath(); ctx.moveTo(p[0] - 9 * V.s, p[1]); ctx.lineTo(p[0] + 9 * V.s, p[1]); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // les pierres du gué (avant la passerelle)
    if (!T0.passerelle && T0.gues) T0.gues.forEach(function (g, k) {
      var c = TR.centre(g[0], g[1]);
      [[-20, -8], [8, 4], [30, -12], [-36, 10]].forEach(function (o, n) {
        var p = E(c[0] + o[0], c[1] + o[1] + (k % 2) * 6);
        ctx.fillStyle = '#8f8a86'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 13 * V.s, 7 * V.s, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#b4afaa'; ctx.beginPath(); ctx.ellipse(p[0] - 2 * V.s, p[1] - 3 * V.s, 9 * V.s, 4 * V.s, 0, 0, 7); ctx.fill();
      });
    });
  }

  var EMOJI = { pieces: '🪙', idees: '💡', nourriture: '🍖' };
  var bulles = [], fleches = [];
  // la flèche verte : ce bâtiment peut monter de niveau, et on a de quoi payer (ADR-038)
  function dessinerFleches() {
    fleches = [];
    if (choix) return;
    var dorees = [];
    monde.batiments.forEach(function (b) {
      if (b.etat !== 'fini' || b.cadeau) return;
      var trF = D.batiments[b.type].travail, a = M.amelioration(monde, b);
      // la dorée : ce bâtiment peut prendre la forme d'une époque plus récente (ADR-040)
      if (a && a.cout <= monde.pieces && ((a.genre === 'moderne' && a.place) || (a.genre === 'maison' && a.moderne))) {
        if (visible(b.x, b.y, 100)) dorees.push({ b: b, rang: (trF ? 0 : 100) + D.batiments[b.type].epoque * 10 + a.cout / 1000 });
        return;
      }
      if (!trF || trF.produit !== 'pieces') return; // la verte : ce qui rapporte des pièces
      if (!a || a.genre !== 'niveau' || a.cout > monde.pieces) return;
      var t = tailleBat(b), p = E(b.x, basBat(b));
      var r = Math.max(13, Math.min(20, 24 * V.s));
      var x = p[0] + t.w * 0.38, y = p[1] - t.h * 0.75 - Math.abs(Math.sin(T * 3.2 + b.id)) * 8;
      if (!visible(b.x, b.y, 100)) return;
      fleches.push({ bat: b.id, x: x, y: y, r: r * 1.5 });
      ctx.fillStyle = 'rgba(40,70,20,.22)'; ctx.beginPath(); ctx.arc(x, y + 4, r, 0, 7); ctx.fill();
      ctx.fillStyle = '#5a9a3c'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath();
      ctx.moveTo(x, y - r * 0.62); ctx.lineTo(x + r * 0.55, y); ctx.lineTo(x + r * 0.22, y); ctx.lineTo(x + r * 0.22, y + r * 0.55);
      ctx.lineTo(x - r * 0.22, y + r * 0.55); ctx.lineTo(x - r * 0.22, y); ctx.lineTo(x - r * 0.55, y); ctx.closePath(); ctx.fill();
    });
    // quelques-unes à la fois seulement (d'abord ce qui produit, le plus ancien), sinon une vieille ville en est couverte
    dorees.sort(function (x, y) { return x.rang - y.rang; });
    dorees.slice(0, DOREES_MAX).forEach(function (d) { dessinerFlecheDoree(d.b); });
    if (dorees.length && !enScene) aideUneFois('fleche-doree', A.flecheDoree);
    else if (fleches.length && !enScene) aideUneFois('fleche-verte', A.flecheVerte);
  }
  var DOREES_MAX = 4;
  // la flèche dorée : un rond doré et deux chevrons (une forme à part, pas seulement une autre couleur)
  function dessinerFlecheDoree(b) {
    var t = tailleBat(b), p = E(b.x, basBat(b));
    var r = Math.max(14, Math.min(22, 26 * V.s));
    var x = p[0] + t.w * 0.3, y = p[1] - t.h * 0.8 - Math.abs(Math.sin(T * 3.2 + b.id)) * 9;
    fleches.push({ bat: b.id, x: x, y: y, r: r * 1.5 });
    ctx.fillStyle = 'rgba(80,50,0,.25)'; ctx.beginPath(); ctx.arc(x, y + 4, r, 0, 7); ctx.fill();
    var g = ctx.createLinearGradient(x, y - r, x, y + r); g.addColorStop(0, '#ffd75e'); g.addColorStop(1, '#e09a17');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.lineWidth = Math.max(3, r * 0.2); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [-0.05, 0.38].forEach(function (dy) {
      ctx.beginPath(); ctx.moveTo(x - r * 0.45, y + r * dy); ctx.lineTo(x, y + r * (dy - 0.42)); ctx.lineTo(x + r * 0.45, y + r * dy); ctx.stroke();
    });
    // une petite étincelle qui tourne autour
    var a = T * 2.4 + b.id, sx = x + Math.cos(a) * r * 1.25, sy = y + Math.sin(a) * r * 1.25;
    ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(sx, sy, Math.max(2, r * 0.13), 0, 7); ctx.fill();
  }
  // le cadeau d'une modernisation finie (ADR-040) : une boîte qui saute au-dessus du bâtiment
  var cadeaux = [];
  function dessinerCadeaux() {
    cadeaux = [];
    if (choix) return;
    monde.batiments.forEach(function (b) {
      if (!b.cadeau || !visible(b.x, b.y, 120)) return;
      var t = tailleBat(b), p = E(b.x, basBat(b));
      var r = Math.max(15, Math.min(24, 28 * V.s)), saut = Math.abs(Math.sin(T * 4 + b.id)) * 12;
      var x = p[0], y0 = p[1] - t.h * 0.85, y = y0 - saut;
      cadeaux.push({ bat: b.id, x: x, y: y, r: r * 1.6 });
      ctx.fillStyle = 'rgba(60,30,40,.22)'; ctx.beginPath(); ctx.ellipse(x, y0 + r, r * (1.1 - saut / 40), r * 0.3, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(T * 6 + b.id) * 0.08);
      ctx.fillStyle = '#c8384a'; ctx.fillRect(-r, -r * 0.6, r * 2, r * 1.5);
      ctx.fillStyle = '#e0505f'; ctx.fillRect(-r * 1.12, -r * 0.95, r * 2.24, r * 0.5);
      ctx.fillStyle = '#ffd24a'; ctx.fillRect(-r * 0.2, -r * 0.95, r * 0.4, r * 1.9);
      ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 1.12, r * 0.38, r * 0.22, -0.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * 0.38, -r * 1.12, r * 0.38, r * 0.22, 0.5, 0, 7); ctx.fill();
      ctx.restore();
    });
    if (cadeaux.length && !enScene) aideUneFois('cadeau', A.cadeau);
  }
  function ouvrirCadeau(id) {
    var b = M.bat(monde, id), c = M.ouvrirCadeau(monde, id); if (!b || !c) return;
    var t = tailleBat(b), y = b.y - t.h / V.s * 0.85;
    son('decouverte');
    pouf(b.x, y, 26, '255,210,63'); pouf(b.x, y, 14, '200,56,74');
    particule({ type: 'gain', texte: '🎁 +' + c.pieces + ' 🪙' + (c.idees ? '  +' + c.idees + ' 💡' : ''), x: b.x, y: y - 20, vy: -18, max: 2.6 });
    aide(A.modernise, true);
    signatureBarre = ''; sauver();
  }
  function dessinerBulles() {
    bulles = [];
    monde.batiments.forEach(function (b) {
      if (b.stock <= 0 || b.etat !== 'fini') return;
      var tr = D.batiments[b.type].travail;
      var t = tailleBat(b), p = E(b.x, basBat(b));
      var r = Math.max(15, Math.min(24, 30 * V.s));
      var x = p[0], y = p[1] - t.h * 0.93 - r * 0.6 + Math.sin(T * 3 + b.id) * 4;
      bulles.push({ bat: b.id, x: x, y: y, r: r * 1.4 });
      ctx.fillStyle = 'rgba(60,40,20,.18)'; ctx.beginPath(); ctx.arc(x, y + 5, r, 0, 7); ctx.fill();
      ctx.fillStyle = tr.produit === 'idees' ? '#fff6c9' : '#fffaf0';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = tr.produit === 'idees' ? '#f2c94c' : tr.produit === 'nourriture' ? '#d0573c' : '#e9873b'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 6, y + r - 2); ctx.lineTo(x, y + r + 9); ctx.lineTo(x + 6, y + r - 2); ctx.fillStyle = tr.produit === 'idees' ? '#fff6c9' : '#fffaf0'; ctx.fill();
      ctx.font = Math.round(r * 0.95) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(EMOJI[tr.produit], x, y + 1);
      var n = b.stock * M.quantite(b, monde);
      ctx.font = '700 ' + Math.round(r * 0.6) + 'px Fredoka, system-ui, sans-serif';
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#5b3c24'; ctx.lineWidth = 4;
      ctx.strokeText('+' + n, x + r * 0.75, y - r * 0.7); ctx.fillText('+' + n, x + r * 0.75, y - r * 0.7);
    });
  }

  var paroles = [];
  // les bulles : petites phrases des habitants, police ronde et grasse façon jeu mobile
  var POLICE_BULLE = '"Lilita One", "Fredoka", system-ui, sans-serif';
  function dessinerParoles() {
    paroles = paroles.filter(function (p) { return p.fin > T; });
    paroles.forEach(function (pa) {
      var h = monde.habitants.filter(function (q) { return q.id === pa.hab; })[0];
      if (!h || h.dort) return;
      var p = E(h.x, h.y);
      var age = T - (pa.debut || pa.fin - 2.8), reste = pa.fin - T;
      var k = age < 0.18 ? 0.55 + 0.45 * Math.sin(age / 0.18 * Math.PI / 2) * 1.08 : 1; // apparition qui rebondit
      var a = Math.min(1, reste / 0.3);
      var haut = (h.enfant ? TAILLE_HAB.enfant : TAILLE_HAB.adulte) * V.s;
      var x = p[0], y = p[1] - haut - 26;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(x, y); ctx.scale(k, k);
      ctx.font = '19px ' + POLICE_BULLE;
      var w = ctx.measureText(pa.texte).width + 26;
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#3b2516'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-w / 2, -18, w, 34, 13); ctx.moveTo(-7, 15); ctx.lineTo(-2, 26); ctx.lineTo(8, 15);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-5, 12, 12, 6); // efface le trait entre la bulle et la pointe
      ctx.fillStyle = '#3b2516'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(pa.texte, 0, 0);
      ctx.restore();
    });
  }
  // de temps en temps, quelqu'un dit une petite phrase selon ce qu'il fait
  var BARKS = {
    travail: {
      sage: ['Hmm…', 'Une idée !', 'Je réfléchis…'], bucheron: ['Et hop !', 'Timbeeer !', 'Encore un arbre !'],
      cueilleur: ['Miam !', 'Qu\'elles sont rouges !'], tailleur: ['Toc, toc !', 'Ça coupe !'],
      chasseur: ['Chuuut…', 'Le voilà !'], pecheur: ['Ça mord !', 'Un poisson !'], peintre: ['Un mammouth !', 'Joli !'],
      paysan: ['Le blé est doré !', 'Belle récolte !'], berger: ['Bêêê !', 'Viens, petit !'], porteur: ['Au grenier !'],
      potier: ['Un beau pot !', 'Tout rond !'], meunier: ['Bientôt du pain !', 'Ça fait de la farine !'],
      forgeron: ['Ding, ding !', 'Du bon bronze !'], scribe: ['Douze sacs…', 'Je note tout !'], marchand: ['Trois pièces !', 'Qui veut des figues ?'],
      marin: ['Hissez la voile !', 'Bon vent !'], charron: ['Encore un rayon !', 'Elle roule !'],
      marechal: ['Tac, tac !', 'Un fer tout neuf !'], moulinier: ['Ça tourne !', 'De la farine !'], boulanger: ['Le pain est prêt !', 'Tout chaud !'], horloger: ['Tic, tac !', 'Midi pile !'], imprimeur: ['Encore une page !', 'Un beau livre !'],
      mineur: ['Du charbon !', 'Toc, toc, la pioche !'], ouvriere: ['Quel beau tissu !', 'Les fils tournent !'], cheminot: ['En voiture !', 'Tuuut !'], inventeur: ['Eurêka !', 'Encore un boulon…'], matelot: ['En avant !', 'Ohé !'], pompier: ['Au feu !', 'Plus fort, la pompe !'],
      electricien: ['Ça grésille !', 'Encore un fil !'], standardiste: ['Allô ?', 'Je vous passe !'], aviatrice: ['Contact !', 'En route vers le ciel !'],
      mecanicien: ['Vroum !', 'Un petit boulon…'], fermier: ['Belle récolte !', 'Allez, mon tracteur !'], chercheur: ['Eurêka !', 'Ça brille !'],
      informaticien: ['Clic, clic !', 'Ça calcule !'], caissier: ['Bip !', 'Bonne journée !'], ingenieur: ['Il marche, mon robot !', 'Encore un calcul !'],
      technicien: ['Ça brille au soleil !', 'Tout propre !'], astronome: ['Une étoile filante !', 'Je vois la Lune !']
    },
    tousse: ['Kof, kof !', "L'air est tout gris…", 'On ne voit plus le ciel bleu !'],
    fusee: ['Une fusée !', 'Elle est prête !', 'Vas-y, la fusée !'],
    noir: ['Il fait tout noir !', 'Je ne vois rien…', 'Aïe, où est le chemin ?'],
    faim: ['J\'ai faim !', 'Mon ventre gargouille…', 'Il reste à manger ?'],
    porte: { baies: ['Plein de baies !'], lait: ['Du bon lait !'], pot: ['Un pot tout neuf !'], farine: ['De la farine !'], bois: ['Lourd, ce bois !', 'Du bois !'], viande: ['Ce soir, on mange !'], lapin: ['Un lapin pour ce soir !'], poisson: ['Regardez ma pêche !'],
      silex: ['Des cailloux tout neufs !'], ble: ['Plein de blé !'], argile: ['De la bonne argile !'], minerai: ['Du minerai pour la forge !'], outil: ['Une hache toute neuve !'] },
    chantier: ['On construit !', 'Encore un peu !', 'Ça avance !'],
    veillee: ['Qu\'il fait bon !', 'On se raconte une histoire ?', 'Ça sent bon la viande !'],
    coucher: ['Bonne nuit !', 'Au lit !', 'Je suis fatigué…'],
    enfant: ['On joue ?', 'Youpi !', 'Attrape-moi !'],
    libre: ['Bonjour !', 'Belle journée !', 'J\'aime ma vallée !'],
    reveil: ['Bonjour le soleil !', 'Bien dormi !', 'Debout !']
  };
  function auHasard(l) { return l[Math.floor(Math.random() * l.length)]; }
  function bark(h, texte) {
    if (!texte) return;
    paroles = paroles.filter(function (p) { return p.hab !== h.id; });
    paroles.push({ hab: h.id, texte: texte, debut: T, fin: T + 2.6 });
  }
  function phraseDe(h) {
    var ph = M.phase(monde);
    if (h.enfant) return auHasard(BARKS.enfant);
    if (h.faim && Math.random() < 0.6) return auHasard(BARKS.faim);
    if (h.porte && BARKS.porte[h.porte]) return auHasard(BARKS.porte[h.porte]);
    if (h.reserve) return auHasard(BARKS.chantier);
    if (h.pose && BARKS.travail[h.metier]) return auHasard(BARKS.travail[h.metier]);
    if (monde.nuitNoire === true && M.estNuit(monde)) return auHasard(BARKS.noir);
    if (monde.airSale === true && Math.random() < 0.5) return auHasard(BARKS.tousse);
    if (monde.fusee === 'prete' && Math.random() < 0.3) return auHasard(BARKS.fusee);
    if (ph === 'soir' && h.etapes.some(function (e) { return e.fait === 'dormir'; })) return auHasard(BARKS.coucher);
    if (ph === 'soir') return auHasard(BARKS.veillee);
    return auHasard(BARKS.libre);
  }
  var prochainBark = 4;
  function barks() {
    if (T < prochainBark || enScene) return;
    prochainBark = T + 2.5 + Math.random() * 3.5;
    if (paroles.length >= 2) return;
    var l = monde.habitants.filter(function (h) {
      if (h.dort || h.cache) return false;
      var p = E(h.x, h.y);
      return p[0] > 40 && p[0] < V.W - 40 && p[1] > 90 && p[1] < V.H - 100 && !paroles.some(function (q) { return q.hab === h.id; });
    });
    if (l.length) { var h = auHasard(l); bark(h, phraseDe(h)); }
  }

  var valides = [], validesT = 0;
  function majValides(forcer) {
    if (!choix) { valides = []; return; }
    if (!forcer && T - validesT < 1) return;
    validesT = T;
    valides = M.emplacementsLibres(monde, choix);
  }
  function dessinerEmplacements() {
    if (!choix) return;
    majValides();
    var k = D.batiments[choix].taille || 1;
    var puls = 0.5 + Math.sin(T * 5) * 0.12;
    ctx.save();
    ctx.beginPath();
    valides.forEach(function (a) {
      for (var di = 0; di < k; di++) for (var dj = 0; dj < k; dj++) {
        var c = TR.centre(a[0] + di, a[1] + dj);
        if (!visible(c[0], c[1], 100)) continue;
        var p = E(c[0], c[1]), tw = TR.TW * V.s * 0.96, th = TR.TH * V.s * 0.96;
        ctx.moveTo(p[0], p[1] - th); ctx.lineTo(p[0] + tw, p[1]); ctx.lineTo(p[0], p[1] + th); ctx.lineTo(p[0] - tw, p[1]); ctx.closePath();
      }
    });
    ctx.fillStyle = 'rgba(255,238,150,' + puls + ')'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }

  var dernierFumee = 0;
  // la cheminée de l'usine (position du haut de la cheminée dans l'image, par niveau : décalage depuis le centre, hauteur)
  var CHEMINEES = { usine: { 1: [-0.3, 0.78], 2: [-0.27, 0.76], 3: [-0.31, 0.78] } };
  function fumees(dt) {
    dernierFumee += dt;
    // une maison en feu : des flammes et de la fumée grise
    monde.batiments.forEach(function (b) {
      if (!b.enFeu) return;
      var t = tailleBat(b);
      var nf = Math.floor(dt * 45 + Math.random());
      for (var q = 0; q < nf; q++) particule({ type: 'flamme', x: b.x + (Math.random() - 0.5) * t.w / V.s * 0.55, y: basBat(b) - t.h / V.s * (0.3 + Math.random() * 0.45), vx: (Math.random() - 0.5) * 16, vy: -50 - Math.random() * 40, max: 0.6 + Math.random() * 0.5, r: 13 + Math.random() * 11, c: Math.random() < 0.5 ? '255,120,30' : '255,195,60' });
      if (Math.random() < dt * 6) particule({ type: 'fumee', x: b.x + (Math.random() - 0.5) * 50, y: basBat(b) - t.h / V.s * 0.95, vx: 8 + Math.random() * 8, vy: -34, max: 3.4, r: 15, c: '140,135,132' });
    });
    if (dernierFumee < 0.35) return;
    dernierFumee = 0;
    monde.batiments.forEach(function (b) {
      if (b.etat !== 'fini') return;
      var ch = CHEMINEES[b.type] && CHEMINEES[b.type][b.niveau || 1];
      if (ch) {
        // la fumée douce de la cheminée : blanche, ronde, jamais noire
        var tc = tailleBat(b);
        if (Math.random() < 0.6) particule({ type: 'fumee', x: b.x + ch[0] * tc.w / V.s, y: basBat(b) - tc.h / V.s * ch[1], vx: 10 + Math.random() * 8, vy: -30 - Math.random() * 10, max: 3.2, r: 12, c: '250,248,245' });
        return;
      }
      var d = D.batiments[b.type];
      var feu = b.type === 'feu';
      if (feu && M.phase(monde) === 'nuit') return;
      if (!feu && !(d.lits && Math.random() < 0.18)) return;
      var t = tailleBat(b);
      var haut = feu ? 0.55 : 0.85;
      particule({ type: 'fumee', x: b.x + (feu ? 0 : t.w / V.s * 0.1), y: basBat(b) - t.h / V.s * haut, vx: 6 + Math.random() * 8, vy: -28 - Math.random() * 10, max: 2.6, r: feu ? 9 : 11, c: '250,248,245' });
    });
  }

  function dessinerParts(dt) {
    parts = parts.filter(function (p) { return (p.vie += dt) < p.max; });
    parts.forEach(function (p) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      var k = p.vie / p.max, s = E(p.x, p.y);
      if (p.type === 'gain') {
        var ag = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        ctx.globalAlpha = ag; ctx.font = Math.round(Math.max(18, 30 * V.s)) + 'px ' + POLICE_BULLE;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = '#5b3c24'; ctx.fillStyle = '#fff';
        ctx.strokeText(p.texte, s[0], s[1]); ctx.fillText(p.texte, s[0], s[1]); ctx.globalAlpha = 1;
        return;
      }
      if (p.type === 'eclat' || p.type === 'eau') { p.vy += 260 * dt; }
      if (p.type === 'flamme') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(' + p.c + ',' + (0.75 * (1 - k)) + ')';
        ctx.beginPath(); ctx.arc(s[0], s[1], p.r * (1 - k * 0.6) * V.s, 0, 7); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        return;
      }
      if (p.type === 'pouf') { p.vx *= 0.94; p.vy *= 0.94; }
      var r = p.type === 'fumee' ? p.r * (1 + k * 2) : p.r * (1 - k * 0.5);
      var a = p.type === 'fumee' ? 0.55 * (1 - k) : 1 - k;
      ctx.fillStyle = 'rgba(' + p.c + ',' + a + ')';
      ctx.beginPath(); ctx.arc(s[0], s[1], r * V.s, 0, 7); ctx.fill();
    });
  }

  // ---------- la nuit (ADR-011) ----------
  var nuitCv = document.createElement('canvas'), nctx = nuitCv.getContext('2d');
  function dessinerNuit() {
    var d = M.obscurite(monde);
    if (d <= 0) return;
    // crépuscule et aube : une touche orangée
    var lueur = d * (1 - d) * 4;
    if (lueur > 0.02) { ctx.fillStyle = 'rgba(255,140,70,' + (0.16 * lueur) + ')'; ctx.fillRect(0, 0, V.W, V.H); }
    if (nuitCv.width !== cv.width || nuitCv.height !== cv.height) { nuitCv.width = cv.width; nuitCv.height = cv.height; }
    nctx.setTransform(1, 0, 0, 1, 0, 0);
    nctx.globalCompositeOperation = 'source-over';
    nctx.clearRect(0, 0, nuitCv.width, nuitCv.height);
    nctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    var noire = monde.nuitNoire === true; // la nuit noire en ville : plus sombre, et le feu de camp n'éclaire plus les rues
    nctx.fillStyle = 'rgba(10,14,44,' + ((noire ? 0.86 : 0.7) * d) + ')';
    nctx.fillRect(0, 0, V.W, V.H);
    nctx.globalCompositeOperation = 'destination-out';
    var feux = monde.batiments.filter(function (b) { return b.type === 'feu' && b.etat === 'fini'; });
    function trou(x, y, r, force, aplat) {
      nctx.save(); nctx.translate(x, y); nctx.scale(1, aplat);
      var g = nctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, 'rgba(0,0,0,' + force + ')'); g.addColorStop(0.55, 'rgba(0,0,0,' + (force * 0.8) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
      nctx.fillStyle = g; nctx.beginPath(); nctx.arc(0, 0, r, 0, 7); nctx.fill(); nctx.restore();
    }
    var vacille = 1 + Math.sin(T * 9) * 0.03 + Math.sin(T * 23) * 0.02;
    // en pleine nuit les feux s'éteignent : il ne reste que des braises qui rougeoient un moment
    var braises = M.phase(monde) === 'nuit' ? Math.max(0, 1 - monde.cycle.t / 10) : 1;
    if (braises < 1) vacille *= 0.3 + 0.12 * braises;
    if (braises > 0) feux.forEach(function (f) { var p = E(f.x, f.y - 20); trou(p[0], p[1], M.RAYON_FEU * V.s * vacille * (noire ? 0.35 : 1), braises, 0.62); });
    // les lampadaires électriques éclairent les rues toute la nuit
    (monde.lampes || []).forEach(function (c) { var q = piedLampe(c), p = E(q[0], q[1]); trou(p[0], p[1] - 30 * V.s, 190 * V.s, 0.9, 0.62); });
    // les réverbères, torches et lanternes de la ville aménagée (ADR-048)
    var amen = amenagement();
    if (amen) amen.liste.forEach(function (a) { if (a.quoi !== 'lampe') return; var q = piedVille(a), p = E(q[0], q[1]); trou(p[0], p[1] - 40 * V.s, 150 * V.s, 0.85, 0.6); });
    // un peu de clair de lune sur les dormeurs, pour bien les voir
    monde.batiments.forEach(function (b) {
      if (!enCoupe(b)) return;
      var cc = cadreCoupe(b);
      trou(cc.cx, cc.y + cc.h * 0.58, cc.w * 0.42, 0.75, 0.7);
    });
    monde.habitants.forEach(function (h) {
      var c = couchage[h.id]; if (!h.dort || !c || c.cache || enCoupe(c.b)) return;
      var p = E(h.x, h.y);
      if (c.b) { var pb = E(c.b.x, basBat(c.b)), ec = Math.min(48, tailleBat(c.b).w / V.s / Math.max(1, c.n)) * V.s; p = [pb[0] + (c.i - (c.n - 1) / 2) * ec, Math.max(p[1], pb[1] + 6 * V.s)]; }
      trou(p[0], p[1] - 10 * V.s, 46 * V.s, 0.45, 0.7);
    });
    // les réverbères à gaz éclairent la rue toute la nuit ; une maison en feu aussi
    monde.batiments.forEach(function (b) {
      if (b.etat !== 'fini' || (b.type !== 'lampadaire' && !b.enFeu)) return;
      var t = tailleBat(b), p = E(b.x, basBat(b));
      trou(p[0], p[1] - t.h * 0.4, (b.enFeu ? 160 : noire ? 60 : 150) * V.s, noire ? 0.5 : 0.8, 0.75);
    });
    // fenêtres éclairées des maisons (éteintes quand tout le monde dort)
    monde.batiments.forEach(function (b) {
      if (b.etat !== 'fini' || !D.batiments[b.type].lits || monde.epoque < 2 || M.phase(monde) === 'nuit') return;
      var t = tailleBat(b), p = E(b.x, basBat(b));
      trou(p[0], p[1] - t.h * 0.35, (monde.lampes ? 100 : noire ? 40 : 80) * V.s, noire ? 0.4 : 0.7, 0.8);
    });
    nctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(nuitCv, 0, 0); ctx.restore();
    // lueur chaude du feu
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    feux.forEach(function (f) {
      var p = E(f.x, f.y - 20), r = M.RAYON_FEU * V.s * 0.55 * vacille;
      var g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      g.addColorStop(0, 'rgba(255,130,50,' + (0.26 * d * braises) + ')'); g.addColorStop(1, 'rgba(255,110,40,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
    });
    (monde.lampes || []).forEach(function (c) {
      var q = piedLampe(c), p = E(q[0], q[1] - HAUT_LAMPE * 0.82), r = 70 * V.s;
      var g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      g.addColorStop(0, 'rgba(255,230,150,' + (0.55 * d) + ')'); g.addColorStop(1, 'rgba(255,210,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
    });
    monde.batiments.forEach(function (b) {
      if (!enCoupe(b)) return;
      var cc = cadreCoupe(b), y = cc.y + cc.h * 0.6, r = cc.w * 0.32 * (1 + Math.sin(T * 7 + b.id) * 0.03);
      var g = ctx.createRadialGradient(cc.cx, y, 0, cc.cx, y, r);
      g.addColorStop(0, 'rgba(255,150,60,' + (0.22 * d) + ')'); g.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cc.cx, y, r, 0, 7); ctx.fill();
    });
    ctx.restore();
  }

  // ---------- les pirogues du néolithique : elles vont et viennent sur l'eau ----------
  var pirogues = [], eauxCle = '', eaux = [];
  function majEaux() {
    var T0 = monde.terrain, cle = T0.epoque + ':' + T0.tuiles.length;
    if (cle === eauxCle) return;
    eauxCle = cle;
    eaux = T0.tuiles.filter(function (t) { return t.sol === 'eau' && TR.surIle(T0, t); });
  }
  function cheminEau(de, vers) {
    var T0 = monde.terrain, cle = function (t) { return t.i * 1000 + t.j; }, venu = {}, file = [de];
    venu[cle(de)] = de;
    while (file.length) {
      var c = file.shift();
      if (c === vers) break;
      for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) {
        var n = TR.tuile(T0, c.i + di, c.j + dj);
        if (!n || n.sol !== 'eau' || !TR.surIle(T0, n) || venu[cle(n)]) continue;
        venu[cle(n)] = c; file.push(n);
      }
    }
    if (!venu[cle(vers)]) return [];
    var l = [], x = vers;
    while (x && x !== de) { var q = TR.centre(x.i, x.j); l.unshift([q[0] + (x.vari % 9 - 4) * 3, q[1] + (x.vari % 7 - 3) * 2]); x = venu[cle(x)]; }
    return l;
  }
  function majPirogues(dt) {
    if (monde.epoque < 2) { pirogues = []; return; }
    majEaux();
    if (!eaux.length) return;
    while (pirogues.length < 3) {
      var t0 = eaux[Math.floor(Math.random() * eaux.length)], c0 = TR.centre(t0.i, t0.j);
      pirogues.push({ x: c0[0], y: c0[1], route: [], attente: Math.random() * 3, dir: -1, filet: pirogues.length === 2, id: pirogues.length });
    }
    var nuit = M.phase(monde) === 'nuit';
    pirogues.forEach(function (p) {
      p.marche = false;
      if (!p.route.length) {
        if (p.attente > 0 || nuit) { p.attente -= dt; return; }
        var ici = TR.tuile(monde.terrain, TR.tuileDe(p.x, p.y)[0], TR.tuileDe(p.x, p.y)[1]);
        var proches = eaux.filter(function (t) { var d = Math.hypot(t.i - (ici ? ici.i : 0), t.j - (ici ? ici.j : 0)); return d > 3 && d < 12; });
        var cible = proches.length ? proches[Math.floor(Math.random() * proches.length)] : null;
        if (ici && cible) p.route = cheminEau(ici, cible);
        p.attente = p.filet ? 5 + Math.random() * 6 : 1 + Math.random() * 3;
        if (!p.route.length) { p.attente = 2; return; }
      }
      var q = p.route[0], dx = q[0] - p.x, dy = q[1] - p.y, d = Math.hypot(dx, dy), v = (p.filet ? 16 : 30) * dt;
      if (Math.abs(dx) > 1) p.dir = dx > 0 ? 1 : -1;
      p.marche = true;
      if (d <= v) { p.x = q[0]; p.y = q[1]; p.route.shift(); } else { p.x += dx / d * v; p.y += dy / d * v; }
    });
  }
  function dessinerPirogue(p) {
    var nom = p.filet ? 'pirogue-filet' : (p.marche && Math.floor(T * 2.6 + p.id) % 2 ? 'pirogue-b' : 'pirogue-a');
    var voile = !p.filet && monde.decouvertes.voile && IMG['eau/bateau-voile']; // avec la voile, les bateaux vont plus loin
    if (voile) nom = 'bateau-voile';
    var vapeur = p.id === 0 && monde.decouvertes.bateau && IMG['eau/bateau-vapeur']; // le bateau à vapeur, même sans vent
    if (vapeur) { nom = 'bateau-vapeur'; voile = true; if (p.marche && Math.random() < 0.08) particule({ type: 'fumee', x: p.x + (p.dir > 0 ? -1 : 1) * 4, y: p.y - 70, vx: 6, vy: -26, max: 2.4, r: 9, c: '252,250,248' }); }
    var im = IMG['eau/' + nom]; if (!im) return;
    var w = (vapeur ? 120 : voile ? 105 : 92) * V.s, h = w * im.height / im.width, e = E(p.x, p.y), bob = Math.sin(T * 2 + p.id * 2) * 1.5 * V.s;
    // remous sur l'eau
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = Math.max(1, 2 * V.s);
    if (p.marche) { ctx.beginPath(); ctx.ellipse(e[0] - p.dir * w * 0.45, e[1] + 2 * V.s, w * 0.18, 3 * V.s, 0, 0, 7); ctx.stroke(); }
    ctx.save(); ctx.translate(e[0], e[1] + bob); ctx.scale(p.dir > 0 ? -1 : 1, 1);
    ctx.drawImage(im, -w / 2, -h * 0.8, w, h); ctx.restore();
  }

  // ---------- l'électricité : poteaux et fils, lampadaires, voitures, petit avion ----------
  var HAUT_POTEAU = 128, HAUT_LAMPE = 112;
  function piedPoteau(c) { var p = TR.centre(c[0], c[1]); return [p[0] + 26, p[1] + 4]; }
  function piedLampe(c) { var p = TR.centre(c[0], c[1]); return [p[0] - 24, p[1] + 6]; }
  function dessinerPoteau(c) {
    var im = IMG['06-electricite/poteau']; if (!im) return;
    var q = piedPoteau(c), p = E(q[0], q[1]), H = HAUT_POTEAU * V.s, w = H * im.width / im.height;
    ombre(p[0] + 3 * V.s, p[1], 9 * V.s, 3 * V.s, 0.2);
    ctx.drawImage(im, p[0] - w / 2, p[1] - H * 0.97, w, H);
  }
  function dessinerLampe(c) {
    var im = IMG['06-electricite/lampadaire']; if (!im) return;
    var q = piedLampe(c), p = E(q[0], q[1]), H = HAUT_LAMPE * V.s, w = H * im.width / im.height;
    ombre(p[0], p[1], 9 * V.s, 3 * V.s, 0.2);
    ctx.drawImage(im, p[0] - w / 2, p[1] - H * 0.97, w, H);
  }
  // les fils : de petites courbes qui pendent d'un poteau à l'autre (deux fils pour l'électricité, un pour le téléphone)
  function dessinerFils() {
    var L = monde.lignes; if (!L || !L.length) return;
    ctx.save(); ctx.lineCap = 'round';
    L.forEach(function (l) {
      var pts = l.poteaux.map(function (c) { var q = piedPoteau(c); return [q[0], q[1] - HAUT_POTEAU * 0.9]; });
      var b = M.bat(monde, l.de);
      if (b) { var t = tailleBat(b); pts.unshift([b.x + (l.genre === 'tel' ? 10 : -10), basBat(b) - t.h / V.s * 0.55]); }
      var decal = l.genre === 'tel' ? [8] : [-7, 3];
      ctx.strokeStyle = l.genre === 'tel' ? 'rgba(70,58,48,0.85)' : 'rgba(48,44,46,0.85)';
      ctx.lineWidth = Math.max(1, 1.5 * V.s);
      for (var k = 0; k < pts.length - 1; k++) {
        var a = pts[k], z = pts[k + 1];
        if (!visible(a[0], a[1], 300) && !visible(z[0], z[1], 300)) continue;
        decal.forEach(function (o) {
          var pa = E(a[0] + o, a[1]), pz = E(z[0] + o, z[1]), mx = (pa[0] + pz[0]) / 2, my = (pa[1] + pz[1]) / 2 + Math.min(18, Math.hypot(pz[0] - pa[0], pz[1] - pa[1]) * 0.08) * (V.s + 0.3);
          ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.quadraticCurveTo(mx, my, pz[0], pz[1]); ctx.stroke();
        });
      }
    });
    ctx.restore();
  }

  // les voitures roulent sur les routes goudronnées (décor animé, comme les pirogues)
  var voitures = [], routesCle = -1, routesT = 0, routes = [];
  function estRoute(t) {
    if (t && routesActives()) return reseauRoutes().cases[t.i * monde.terrain.N + t.j] != null; // dans le bac à sable : les vraies routes
    return t && t.sol === 'herbe' && !t.bat && !t.lampe && !t.poteau && TR.surIle(monde.terrain, t) && TR.etatHerbe(t) === 3; }
  function majVoitures(dt) {
    if (!monde.decouvertes.voiture) { voitures = []; return; }
    routesT -= dt;
    if (routesT <= 0) { routesT = 4; routes = monde.terrain.tuiles.filter(estRoute); }
    if (routes.length < 6) return;
    // au monde moderne, la voiture électrique et le bus remplacent peu à peu les vieilles voitures (quand elles sont garées)
    var IM = monde.epoque >= 7 ? ['07-moderne/voiture-electrique', '07-moderne/bus', '06-electricite/camionnette', '07-moderne/voiture-electrique']
      : ['06-electricite/voiture-rouge', '06-electricite/voiture-jaune', '06-electricite/camionnette'];
    while (voitures.length < Math.min(monde.epoque >= 7 ? 4 : 3, Math.floor(routes.length / 8) + 1)) {
      var t0 = routes[Math.floor(Math.random() * routes.length)], c0 = TR.centre(t0.i, t0.j);
      voitures.push({ x: c0[0], y: c0[1], route: [], attente: Math.random() * 3, dir: -1, im: IM[voitures.length % 3], id: voitures.length });
    }
    var nuit = M.phase(monde) === 'nuit';
    voitures.forEach(function (v) {
      v.marche = false;
      if (!v.route.length) {
        if (v.im !== IM[v.id % IM.length]) { v.im = IM[v.id % IM.length]; v.pouf = 0.5; }
        if (v.attente > 0 || nuit) { v.attente -= dt; return; }
        var tc = TR.tuileDe(v.x, v.y), ici = TR.tuile(monde.terrain, tc[0], tc[1]);
        if (!estRoute(ici)) { var tr = routes[Math.floor(Math.random() * routes.length)], cr = TR.centre(tr.i, tr.j); v.x = cr[0]; v.y = cr[1]; v.attente = 1; return; }
        // un trajet sur les routes, d'une case de route à une autre
        var cle = function (t) { return t.i * 1000 + t.j; }, venu = {}, file = [ici], vus = [];
        venu[cle(ici)] = ici;
        while (file.length && vus.length < 400) {
          var c = file.shift(); vus.push(c);
          // seulement le long des cases : à l'écran, la voiture suit toujours une des quatre diagonales de la perspective
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
            var n = TR.tuile(monde.terrain, c.i + d[0], c.j + d[1]);
            if (!estRoute(n) || venu[cle(n)]) return;
            venu[cle(n)] = c; file.push(n);
          });
        }
        var loin = vus.filter(function (t) { var dd = Math.hypot(t.i - ici.i, t.j - ici.j); return dd > 3; });
        var cible = loin.length ? loin[Math.floor(Math.random() * loin.length)] : null;
        v.attente = 2 + Math.random() * 5;
        if (!cible) return;
        var l = [], x = cible;
        while (x && x !== ici) { var q = TR.centre(x.i, x.j); l.unshift([q[0], q[1]]); x = venu[cle(x)]; }
        v.route = l;
      }
      var q = v.route[0], dx = q[0] - v.x, dy = q[1] - v.y, d = Math.hypot(dx, dy), pas = 75 * dt;
      if (Math.abs(dx) > 1) v.dir = dx > 0 ? 1 : -1;
      if (Math.abs(dy) > 0.5) v.monte = dy < 0;
      v.marche = true;
      if (d <= pas) { v.x = q[0]; v.y = q[1]; v.route.shift(); } else { v.x += dx / d * pas; v.y += dy / d * pas; }
    });
  }
  function dessinerVoiture(v) {
    if (!IMG[v.im]) return;
    var vu = vueVehicule(v.im, v.dir > 0, v.monte), im = vu.im;
    var w = (v.im.indexOf('bus') > 0 ? 100 : v.im.indexOf('camionnette') > 0 ? 82 : 86) * V.s, H = w * im.height / im.width, p = E(v.x, v.y + 8);
    var bob = v.marche ? Math.abs(Math.sin(T * 18 + v.id)) * 1.2 * V.s : 0;
    ombre(p[0], p[1], w * 0.4, 6 * V.s, 0.2);
    ctx.save(); ctx.translate(p[0], p[1] - bob); ctx.scale(vu.miroir ? -1 : 1, 1);
    ctx.drawImage(im, -w / 2, -H * 0.9, w, H); ctx.restore();
    if (v.pouf) { pouf(v.x, v.y - 20, 6); v.pouf = 0; } // une petite bouffée quand elle change de modèle
    if (v.marche && v.im.indexOf('electrique') < 0 && Math.random() < 0.05) particule({ type: 'fumee', x: v.x - v.dir * 40, y: v.y - 6, vx: -v.dir * 10, vy: -10, max: 1.2, r: 5, c: '235,232,228' });
  }

  // le petit avion : il décolle de l'aérodrome, fait le tour de la vallée et revient se poser
  var avion = { etat: 'hangar', attente: 4, s: 0 };
  function aerodrome() { return monde.batiments.filter(function (b) { return b.type === 'aerodrome' && b.etat === 'fini'; })[0] || null; }
  function posAvion(b) {
    var C = TR.centre(TR.CI - 2, TR.CJ - 2), A = [b.x - 40, basBat(b) + 10];
    var r = Math.hypot(A[0] - C[0], (A[1] - C[1]) * 2), a0 = Math.atan2((A[1] - C[1]) * 2, A[0] - C[0]);
    r = Math.max(r, 520);
    var a = a0 - avion.s * Math.PI * 2, x = C[0] + Math.cos(a) * r, y = C[1] + Math.sin(a) * r * 0.5;
    // près du sol au départ et à l'arrivée, on rejoint l'aérodrome
    var k = Math.min(1, avion.s / 0.08, (1 - avion.s) / 0.08);
    var px = A[0] + (x - A[0]) * Math.min(1, k * 2), py = A[1] + (y - A[1]) * Math.min(1, k * 2);
    var z = Math.pow(Math.sin(Math.PI * avion.s), 0.6) * 300;
    return { x: px, y: py, z: z, dir: Math.sin(a) > 0 ? 1 : -1 };
  }
  function majAvion(dt) {
    var b = aerodrome(); if (!b) return;
    if (avion.etat === 'hangar') {
      if (M.estNuit(monde)) return;
      avion.attente -= dt;
      if (avion.attente <= 0) { avion.etat = 'vol'; avion.s = 0; }
      return;
    }
    avion.s += dt / 34;
    if (avion.s >= 1) { avion.etat = 'hangar'; avion.attente = 18 + Math.random() * 20; }
  }
  function dessinerAvion() {
    var b = aerodrome(), im = IMG['06-electricite/avion']; if (!b || !im || avion.etat !== 'vol') return;
    var q = posAvion(b), p = E(q.x, q.y), w = 140 * V.s * (1 + q.z / 1500), H = w * im.height / im.width;
    ombre(p[0], p[1], w * 0.32 / (1 + q.z / 200), 5 * V.s / (1 + q.z / 300), 0.16);
    ctx.save(); ctx.translate(p[0], p[1] - q.z * V.s); ctx.scale(q.dir > 0 ? -1 : 1, 1);
    ctx.rotate(-0.05 + Math.sin(T * 2) * 0.03);
    ctx.drawImage(im, -w / 2, -H * 0.7, w, H); ctx.restore();
  }

  // ---------- le monde moderne : éoliennes, panneaux solaires, terrain de la fusée, fusée, satellite, air sale ----------
  var HAUT_EOLIENNE = 230, HAUT_PANNEAU = 50;
  function piedEolienne(c) { var p = TR.centre(c[0], c[1]); return [p[0], p[1] + 8]; }
  function piedPanneau(c) { var p = TR.centre(c[0], c[1]); return [p[0] + 18, p[1] + 6]; }
  // l'éolienne est dessinée par le jeu (mât, nacelle, pales qui tournent), en blanc mat ombré comme la pâte
  function dessinerEolienne(c) {
    var q = piedEolienne(c), p = E(q[0], q[1]), H = HAUT_EOLIENNE * V.s, s = V.s;
    ombre(p[0], p[1], 16 * s, 5 * s, 0.22);
    var hx = p[0], hy = p[1] - H * 0.86;
    // le mât, plus large en bas
    var g = ctx.createLinearGradient(p[0] - 9 * s, 0, p[0] + 9 * s, 0);
    g.addColorStop(0, '#d9d5cf'); g.addColorStop(0.45, '#f6f4f0'); g.addColorStop(1, '#b9b4ad');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(p[0] - 8 * s, p[1]); ctx.lineTo(p[0] - 4 * s, hy); ctx.lineTo(p[0] + 4 * s, hy); ctx.lineTo(p[0] + 8 * s, p[1]); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#cfcac3'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 10 * s, 4 * s, 0, 0, 7); ctx.fill();
    // la nacelle
    var gn = ctx.createLinearGradient(0, hy - 8 * s, 0, hy + 8 * s);
    gn.addColorStop(0, '#f8f6f2'); gn.addColorStop(1, '#c4bfb8');
    ctx.fillStyle = gn; ctx.beginPath(); ctx.ellipse(hx + 8 * s, hy, 15 * s, 7.5 * s, -0.12, 0, 7); ctx.fill();
    // les pales tournent avec le vent
    var L = H * 0.4, a0 = T * 1.6 + c[0] * 1.3 + c[1];
    ctx.save(); ctx.translate(hx - 4 * s, hy);
    for (var k = 0; k < 3; k++) {
      ctx.save(); ctx.rotate(a0 + k * Math.PI * 2 / 3);
      var gp = ctx.createLinearGradient(0, -5 * s, 0, 5 * s); gp.addColorStop(0, '#fbfaf7'); gp.addColorStop(1, '#c8c3bc');
      ctx.fillStyle = gp;
      ctx.beginPath(); ctx.moveTo(0, -4.5 * s); ctx.quadraticCurveTo(L * 0.3, -7.5 * s, L, -1.2 * s); ctx.lineTo(L, 1 * s); ctx.quadraticCurveTo(L * 0.3, 4 * s, 0, 4.5 * s); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    var gh = ctx.createRadialGradient(-2 * s, -2 * s, 0, 0, 0, 7 * s); gh.addColorStop(0, '#ffffff'); gh.addColorStop(1, '#cbc6bf');
    ctx.fillStyle = gh; ctx.beginPath(); ctx.arc(0, 0, 6.5 * s, 0, 7); ctx.fill();
    ctx.restore();
  }
  function dessinerPanneau(c) {
    var im = IMG['07-moderne/panneau']; if (!im) return;
    var q = piedPanneau(c), p = E(q[0], q[1]), H = HAUT_PANNEAU * V.s, w = H * im.width / im.height;
    ombre(p[0], p[1], 12 * V.s, 4 * V.s, 0.2);
    ctx.drawImage(im, p[0] - w / 2, p[1] - H * 0.97, w, H);
  }
  // le terrain gardé pour la fusée : un carré de piquets et de petits drapeaux
  function dessinerTerrainTir() {
    var r = monde.tir; if (!r || monde.batiments.some(function (b) { return b.type === 'pas-de-tir'; })) return;
    var c = [TR.centre(r[0] - 0.5 + 0.5, r[1] - 0.5 + 0.5)];
    var coins = [[r[0] - 0.5, r[1] - 0.5], [r[0] + 1.5, r[1] - 0.5], [r[0] + 1.5, r[1] + 1.5], [r[0] - 0.5, r[1] + 1.5]].map(function (q) { var z = TR.centre(q[0], q[1]); return E(z[0], z[1] - TR.TH / 2); });
    if (!visible(TR.centre(r[0], r[1])[0], TR.centre(r[0], r[1])[1], 300)) return;
    ctx.save();
    ctx.fillStyle = 'rgba(255,248,230,0.22)';
    ctx.beginPath(); coins.forEach(function (q, k) { if (k) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fill();
    ctx.setLineDash([10 * V.s, 8 * V.s]); ctx.lineWidth = 3 * V.s; ctx.strokeStyle = 'rgba(200,52,31,0.75)'; ctx.stroke();
    ctx.setLineDash([]);
    coins.forEach(function (q, k) {
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(q[0] - 1.5 * V.s, q[1] - 26 * V.s, 3 * V.s, 26 * V.s);
      ctx.fillStyle = k % 2 ? '#fff' : '#d8452c';
      ctx.beginPath(); ctx.moveTo(q[0] + 1.5 * V.s, q[1] - 26 * V.s); ctx.lineTo(q[0] + 15 * V.s, q[1] - 21 * V.s); ctx.lineTo(q[0] + 1.5 * V.s, q[1] - 16 * V.s); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
    void c;
  }
  // la fusée sur son pas de tir (prête, puis en vol)
  var FUSEE = { dx: -0.03, haut: 250, pied: 0.77 }; // le pied de la fusée dans l'image du pas de tir (décalage en largeur, hauteur depuis le bas), sa hauteur
  function padTir() { return monde.batiments.filter(function (b) { return b.type === 'pas-de-tir' && b.etat === 'fini'; })[0] || null; }
  function piedFusee(b) { var t = tailleBat(b); return [b.x + FUSEE.dx * t.w / V.s, basBat(b) - t.h / V.s * (1 - FUSEE.pied)]; }
  var ebranle = 0;
  function dessinerFusee() {
    var b = padTir(), im = IMG['07-moderne/fusee'];
    if (!b || !im || (monde.fusee !== 'prete' && monde.fusee !== 'vol' && !lancement)) return;
    var q = piedFusee(b), H = FUSEE.haut * V.s, w = H * im.width / im.height;
    var v = monde.fusee === 'vol' ? (monde.vol || 0) : 0;
    var monte = v > 0.6 ? Math.pow(v - 0.6, 2.2) * 26 : 0; // elle s'arrache doucement, puis file
    var p = E(q[0], q[1] - monte);
    var tremble = (monde.fusee === 'vol' && v < 2.5) || (lancement && lancement.feu) ? (Math.random() - 0.5) * 2.5 * V.s : 0;
    // la flamme sous la fusée
    if (monde.fusee === 'vol' || (lancement && lancement.feu)) {
      var fl = (monde.fusee === 'vol' ? 1 : 0.45) * (1 + Math.sin(T * 40) * 0.12), fh = H * 0.42 * fl, fw = w * 0.32;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var g = ctx.createRadialGradient(p[0], p[1] + fh * 0.2, 0, p[0], p[1] + fh * 0.2, fh);
      g.addColorStop(0, 'rgba(255,250,210,0.95)'); g.addColorStop(0.35, 'rgba(255,190,70,0.85)'); g.addColorStop(1, 'rgba(255,90,30,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(p[0], p[1] + fh * 0.35, fw, fh * 0.75, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
    ctx.drawImage(im, p[0] - w / 2 + tremble, p[1] - H * 0.97, w, H);
  }
  function fumeeFusee(dt) {
    var b = padTir(); if (!b) return;
    var q = piedFusee(b), enVol = monde.fusee === 'vol', v = monde.vol || 0;
    var nb = enVol && v < 4 ? 30 : lancement && lancement.feu ? 8 : 0;
    var n = Math.floor(dt * nb + Math.random());
    for (var k = 0; k < n; k++) {
      var a = Math.random() < 0.5 ? -1 : 1;
      particule({ type: 'fumee', x: q[0] + (Math.random() - 0.5) * 40, y: q[1] + 6, vx: a * (60 + Math.random() * 90), vy: -10 - Math.random() * 25, max: 3 + Math.random() * 2, r: 18 + Math.random() * 14, c: '246,242,236' });
    }
    if (enVol && v > 0.6) {
      // la traînée derrière la fusée qui monte
      var monte = Math.pow(v - 0.6, 2.2) * 26;
      if (Math.random() < dt * 22) particule({ type: 'fumee', x: q[0] + (Math.random() - 0.5) * 10, y: q[1] - monte + 30, vx: (Math.random() - 0.5) * 12, vy: 10, max: 2.4, r: 12, c: '250,246,240' });
    }
  }
  // le satellite passe dans le ciel, le soir et la nuit (après sa découverte)
  var satellite = { s: -1, prochain: 8 };
  function dessinerSatellite(dt) {
    if (!monde.decouvertes.satellite) return;
    var im = IMG['07-moderne/satellite'], d = M.obscurite(monde);
    if (satellite.s < 0) { satellite.prochain -= dt; if (satellite.prochain <= 0 && d > 0.3) satellite.s = 0; return; }
    satellite.s += dt / 22;
    if (satellite.s >= 1) { satellite.s = -1; satellite.prochain = 25 + Math.random() * 20; return; }
    var x = -60 + (V.W + 120) * satellite.s, y = V.H * (0.2 - 0.08 * Math.sin(Math.PI * satellite.s));
    var a = Math.max(0.35, d);
    if (im) { var w = 46, h = w * im.height / im.width; ctx.globalAlpha = a; ctx.drawImage(im, x - w / 2, y - h / 2, w, h); ctx.globalAlpha = 1; }
    if (Math.sin(T * 6) > 0.3) { ctx.fillStyle = 'rgba(255,250,200,' + a + ')'; ctx.beginPath(); ctx.arc(x + 4, y - 4, 3, 0, 7); ctx.fill(); }
  }
  // l'air sale : un voile gris sur la ville, qui s'en va doucement quand le soleil et le vent arrivent
  var voileAir = 0;
  function dessinerAirSale(dt) {
    var cible = monde.airSale === true ? 1 : 0;
    voileAir += Math.max(-dt / 5, Math.min(dt / 3, cible - voileAir));
    if (voileAir <= 0.01) return;
    ctx.fillStyle = 'rgba(128,120,104,' + (0.32 * voileAir) + ')';
    ctx.fillRect(0, 0, V.W, V.H);
  }

  function dessiner(dt) {
    ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    rangerDormeurs();
    if (monde.fusee === 'vol' && (monde.vol || 0) < 3) ctx.translate((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
    ctx.imageSmoothingQuality = 'high';
    dessinerFond(dt);
    dessinerSolVille();
    dessinerSolsFermes();
    dessinerOmbresSol();
    dessinerEau();
    dessinerEmplacements();
    dessinerTerrainTir();
    var T0 = monde.terrain, liste = [], amen = amenagement();
    if (amen) amen.liste.forEach(function (a) {
      var q = piedVille(a); if (!visible(q[0], q[1], 200)) return;
      liste.push({ y: a.quoi === 'place' || a.quoi === 'jardin' ? q[1] - TR.TH * 0.6 * (a.z || 1) : q[1], f: dessinerVille, o: a });
    });
    T0.tuiles.forEach(function (t) {
      if (!TR.surIle(T0, t)) return;
      if (!t.obj && !t.deco) return;
      var c = TR.centre(t.i, t.j);
      if (!visible(c[0], c[1], 260)) return;
      var pave = amenage() && (t.obj === 'souche' || t.deco) && (dansLaVille(t) || (amen && amen.parCase[t.i * T0.N + t.j]));
      if (t.deco && !pave) dessinerDeco(t);
      if (t.obj && !(pave && t.obj === 'souche')) liste.push({ y: c[1] + 16, f: dessinerTuileObjet, o: t });
    });
    monde.batiments.forEach(function (b) {
      if (composee(b)) { if (!(BAC && routesCfg.cacher) && visible(b.x, b.y, 700)) piecesFerme(b, liste); return; }
      if (goldenGate(b)) { if (!(BAC && routesCfg.cacher)) piecesGoldenGate(b, liste); return; }
      var plat = b.type === 'champ-ble' || b.type === 'passerelle' || b.type === 'pont-pierre';
      // le champ est bas mais ses épis sont hauts : il passe devant ce qui est derrière lui
      if (!(BAC && routesCfg.cacher)) liste.push({ y: b.type === 'champ-ble' ? b.y - b.k * TR.TH * 0.5 : plat ? b.y - 200 : basBat(b) - 6, f: dessinerBat, o: b });
    });
    monde.habitants.forEach(function (h) {
      if (!visible(h.x, h.y, 120)) return;
      var c = h.dort && couchage[h.id], y = c && c.b ? Math.max(h.y, basBat(c.b) + 6) : h.y; // devant la porte, pas derrière
      if (h.dans && !h.marche) { var bd = M.bat(monde, h.dans); if (bd) y = Math.max(y, basBat(bd) + 1); } // assis au milieu du cercle
      liste.push({ y: y, f: dessinerHab, o: h });
    });
    monde.animaux.forEach(function (a) { liste.push({ y: a.y, f: dessinerAnimal, o: a }); });
    majPirogues(Math.min(dt || 0, 0.1) * VITESSE);
    pirogues.forEach(function (p) { if (visible(p.x, p.y, 120)) liste.push({ y: p.y, f: dessinerPirogue, o: p }); });
    if (monde.rails && monde.rails.tuiles && monde.rails.tuiles.length >= 2) { // une ligne d'une seule case : ni train ni tunnel
      majTrain(Math.min(dt || 0, 0.1) * VITESSE);
      var pt = cheminTrain();
      if (pt) { var qt = pointTrain(pt, train.s); liste.push({ y: qt[1] + 2, f: dessinerTrain, o: null }); }
      var rt = monde.rails.tuiles, zt = TR.centre(rt[rt.length - 1][0], rt[rt.length - 1][1]);
      liste.push({ y: zt[1] + 40, f: dessinerTunnel, o: null });
    }
    (monde.lignes || []).forEach(function (l) { l.poteaux.forEach(function (c) { var q = piedPoteau(c); if (visible(q[0], q[1], 150)) liste.push({ y: q[1], f: dessinerPoteau, o: c }); }); });
    (monde.lampes || []).forEach(function (c) { var q = piedLampe(c); if (visible(q[0], q[1], 150)) liste.push({ y: q[1], f: dessinerLampe, o: c }); });
    majVoitures(Math.min(dt || 0, 0.1) * VITESSE);
    majFermes(Math.min(dt || 0, 0.1) * VITESSE);
    voitures.forEach(function (v) { if (visible(v.x, v.y, 120)) liste.push({ y: v.y + 8, f: dessinerVoiture, o: v }); });
    (monde.eoliennes || []).forEach(function (c) { var q = piedEolienne(c); if (visible(q[0], q[1], 300)) liste.push({ y: q[1], f: dessinerEolienne, o: c }); });
    (monde.panneaux || []).forEach(function (c) { var q = piedPanneau(c); if (visible(q[0], q[1], 120)) liste.push({ y: q[1], f: dessinerPanneau, o: c }); });
    var bTir = padTir(); if (bTir) liste.push({ y: basBat(bTir) - 5, f: dessinerFusee, o: null });
    liste.sort(function (a, b) { return a.y - b.y; });
    liste.forEach(function (e) { e.f(e.o); });
    dessinerFils();
    majAvion(Math.min(dt || 0, 0.1) * VITESSE);
    dessinerAvion();
    fumees(dt);
    fumeeFusee(Math.min(dt || 0, 0.1));
    dessinerParts(dt);
    dessinerAirSale(Math.min(dt || 0, 0.1));
    dessinerNuit();
    dessinerSatellite(Math.min(dt || 0, 0.1));
    dessinerFleches();
    dessinerCadeaux();
    dessinerBulles();
    barks();
    dessinerParoles();
  }

  // ---------- interface ----------
  var choix = null;
  var derniers = { hab: -1, pieces: -1, idees: -1 };
  function majCompteurs() {
    var v = { hab: monde.habitants.length + ' / ' + M.lits(monde), pieces: Math.floor(monde.pieces), idees: Math.floor(monde.idees), nourriture: Math.floor(monde.nourriture) + ' / ' + M.reserveMax(monde) };
    ['hab', 'pieces', 'nourriture', 'idees'].forEach(function (k) {
      if (derniers[k] !== v[k]) {
        $('v-' + k).textContent = v[k];
        var el = $('c-' + k);
        if (derniers[k] !== -1 && k !== 'hab') { el.classList.remove('tilt'); void el.offsetWidth; el.classList.add('tilt'); }
        derniers[k] = v[k];
      }
    });
    var moment = M.estNuit(monde) ? ' 🌙' : ' ☀️';
    if (derniers.epoque !== monde.epoque || derniers.moment !== moment) {
      derniers.epoque = monde.epoque; derniers.moment = moment;
      $('epoque-nom').textContent = D.epoques.filter(function (x) { return x.id === monde.epoque; })[0].nom + moment;
    }
    var possible = M.decouvertesEpoque(monde).some(function (id) { return M.etatDecouverte(monde, id) === 'possible'; });
    $('btn-decouvertes').classList.toggle('pret', possible);
    // pas assez à manger pour ce soir : le compteur rougit (ADR-032)
    $('c-nourriture').classList.toggle('manque', monde.faim > 0 || monde.nourriture < M.besoinRepas(monde));
    $('c-nourriture').classList.toggle('plein', monde.nourriture >= M.reserveMax(monde));
    // le bouton doré de l'époque suivante (ADR-027)
    var suiv = D.epoques.filter(function (x) { return x.id === monde.epoque + 1; })[0];
    var pret = !!suiv && M.epoqueTerminee(monde) && !enScene;
    if (pret !== !$('btn-epoque').hidden) {
      $('btn-epoque').hidden = !pret;
      if (pret) $('btn-epoque').textContent = (ICONE_EPOQUE[suiv.id] || '✨') + ' Vers ' + suiv.nom.replace(/^L(e |a |')/, 'l$1') + ' !';
    }
    majBoutonFusee();
    $('btn-merveilles').classList.toggle('pret', merveilles().some(function (t) { var a = actionMerveille(t); return a.genre && a.cout <= monde.pieces; }));
  }

  var ICONE_EPOQUE = { 2: '🌾', 3: '⚒️', 4: '⚙️', 5: '🚂', 6: '💡', 7: '🚀' };
  var ILLU_EPOQUE = { 1: 'scenes/cueilleurs', 2: 'scenes/agriculture', 3: 'scenes/metaux', 4: 'scenes/moyen-age', 5: 'scenes/vapeur-ville', 6: 'scenes/ville-electrique', 7: 'scenes/ville-moderne' };
  var signatureBarre = '';
  // le bandeau : deux onglets, construire et embellir (ADR-023)
  function majBarre() {
    var tout = M.construisibles(monde);
    var onglet = ui.onglet || 'construire';
    tout = tout.filter(function (k) { return !D.batiments[k].merveille; }); // les merveilles ont leur fenêtre (ADR-030)
    var decos = tout.filter(function (k) { return D.batiments[k].deco; });
    if (!decos.length) onglet = 'construire';
    var liste = tout.filter(function (k) { return !!D.batiments[k].deco === (onglet === 'embellir'); });
    // d'abord ce qui rapporte des pièces, puis les maisons, puis la nourriture, puis le reste (ADR-037)
    var rangCarte = function (k) { var d = D.batiments[k], tr = d.travail; return tr && tr.produit === 'pieces' ? 0 : d.lits ? 1 : tr && tr.produit === 'nourriture' ? 2 : 3; };
    // à partir de l'âge des métaux, ceux de l'époque en cours passent devant les vieux bâtiments bon marché (même ordre à l'intérieur)
    var vieux = function (k) { return monde.epoque >= 3 && D.batiments[k].epoque < monde.epoque ? 1 : 0; };
    liste.sort(function (a, b) { return (vieux(a) - vieux(b)) || (rangCarte(a) - rangCarte(b)) || ((D.batiments[a].cout || 0) - (D.batiments[b].cout || 0)); });
    var sig = tout.join() + '|' + onglet + '|' + monde.pieces + '|' + choix + '|' + ui.nouveaux.join() + '|' + monde.batiments.length;
    if (sig === signatureBarre) return;
    signatureBarre = sig;
    var barre = $('barre');
    barre.innerHTML = '';
    // les onglets
    var og = document.createElement('div'); og.className = 'onglets';
    [['construire', '🏠', 'Construire'], ['embellir', '✨', 'Embellir']].forEach(function (o) {
      if (o[0] === 'embellir' && !decos.length) return;
      var b = document.createElement('button');
      b.className = 'onglet' + (onglet === o[0] ? ' on' : '');
      b.setAttribute('aria-label', o[2]);
      var neufs = tout.filter(function (k) { return !!D.batiments[k].deco === (o[0] === 'embellir') && ui.nouveaux.indexOf(k) >= 0; }).length;
      b.innerHTML = o[1] + (neufs && onglet !== o[0] ? '<span class="point"></span>' : '');
      b.addEventListener('pointerdown', function (ev) {
        ev.stopPropagation();
        if (ui.onglet === o[0]) return;
        ui.onglet = o[0]; choisir(null); son('clic'); signatureBarre = '';
        if (o[0] === 'embellir') aideUneFois('embellir', A.embellir);
        barre.scrollLeft = 0;
      });
      og.appendChild(b);
    });
    barre.appendChild(og);
    liste.forEach(function (type) {
      var d = D.batiments[type];
      var n = monde.batiments.filter(function (b) { return b.type === type; }).length;
      var fait = d.unique && n > 0;
      var el = document.createElement('div');
      el.className = 'carte-bat' + (fait ? ' fait' : M.peutConstruire(monde, type) ? '' : ' non') + (choix === type ? ' choisie' : '') + (d.merveille ? ' merveille' : '');
      el.innerHTML = '<div class="socle"><img src="' + ASSETS[d.sprite] + '" alt=""></div>' +
        (fait ? '<div class="prix fait">✓</div>' : '<div class="prix"><span class="piece">🪙</span>' + d.cout + '</div>') +
        (n && !fait ? '<div class="nombre">' + n + '</div>' : '') +
        (d.travail && ui.nouveaux.indexOf(type) < 0 ? '<div class="produit ' + d.travail.produit + '">' + EMOJI[d.travail.produit] + '</div>' : '') +
        (ui.nouveaux.indexOf(type) >= 0 ? '<div class="neuf">Nouveau</div>' : '');
      el.addEventListener('pointerdown', function (ev) {
        ev.stopPropagation();
        if (!M.peutConstruire(monde, type)) {
          son('non');
          montrerInfo({ img: d.sprite, titre: d.nom, texte: d.resume || '', statut: fait ? '' : resumeType(type), page: pageDuBat(type), type: type });
          if (fait) aide(A.dejaConstruit, true);
          else if (M.emplacementsLibres(monde, type).length === 0) aide(A.plusDePlace, true);
          else aide(A.piecesManquent, true);
          return;
        }
        choisir(choix === type ? null : type);
      });
      barre.appendChild(el);
    });
  }

  function choisir(type) {
    choix = type;
    signatureBarre = '';
    var pl = $('placement');
    if (type) {
      son('clic');
      $('placement-texte').textContent = 'Touche la zone claire pour poser ' + D.batiments[type].nom.toLowerCase();
      pl.style.display = 'flex';
      var d = D.batiments[type];
      montrerInfo({ img: d.sprite, titre: d.nom, texte: d.resume || '', statut: resumeType(type), page: pageDuBat(type), type: type });
      majValides(true);
    } else { pl.style.display = 'none'; valides = []; }
  }
  $('placement-annuler').addEventListener('pointerdown', function (e) { e.stopPropagation(); choisir(null); });

  var minuteurAide = null;
  var derniereAide = -999; // la dernière aide montrée (temps réel) : un conseil de routine ne la recouvre pas tout de suite
  function aide(texte, forcer) {
    derniereAide = T;
    var el = $('bulle-aide');
    el.textContent = nb(texte); el.style.display = 'block';
    clearTimeout(minuteurAide);
    minuteurAide = setTimeout(function () { el.style.display = 'none'; }, 5000);
    if (!forcer || ui.voix) dire(texte);
  }
  function aideUneFois(cle, texte) {
    if (ui.aide[cle]) return;
    ui.aide[cle] = true;
    aide(texte);
  }

  // fenêtres
  function ouvrir(id) { $(id).classList.add('ouvert'); }
  function fermer(id) { $(id).classList.remove('ouvert'); }
  document.querySelectorAll('[data-ferme]').forEach(function (b) {
    b.addEventListener('click', function () { fermer(b.getAttribute('data-ferme')); });
  });
  var enScene = false;
  function scene(o) {
    enScene = true;
    $('scene-titre').textContent = o.titre;
    $('scene-illu').hidden = !(o.illustration && ASSETS[o.illustration]);
    if (o.illustration) $('scene-illu').src = ASSETS[o.illustration] || '';
    $('scene-images').innerHTML = o.illustration ? '' : (o.images || []).map(function (k) { return '<img src="' + ASSETS[k] + '" alt="">'; }).join('');
    $('scene-texte').textContent = nb(o.texte);
    $('scene-ok').textContent = o.bouton || 'Super !';
    $('scene-non').hidden = !o.non;
    $('scene-non').textContent = o.non || '';
    $('scene-non').onclick = function () { fermer('scene'); enScene = false; if (o.sinon) o.sinon(); };
    $('scene-voix').onclick = function () { dire(o.texte); };
    $('scene-ok').onclick = function () {
      fermer('scene'); enScene = false;
      if (o.ensuite) o.ensuite();
    };
    ouvrir('scene');
    setTimeout(function () { dire(o.texte); }, 250);
  }

  // ---------- l'histoire : une intro au début de la partie, une fin quand le village a tout découvert ----------
  // Une petite vidéo si elle est là (version installée), sinon directement l'image et le texte (fichier unique, hors ligne,
  // mouvement réduit). « Passer » saute la vidéo ; le texte est lu à voix haute comme les autres scènes.
  var LANGUE = /^en/i.test(document.documentElement.lang) ? 'en' : 'fr';
  var H = D.textes.histoire;
  var MOUVEMENT_REDUIT = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var CINE_IMAGES = { intro: 'histoire/debut', village: 'histoire/village', ville: 'histoire/ville', 'moyen-age': 'histoire/moyen-age', vapeur: 'histoire/vapeur', electricite: 'histoire/electricite', fin: 'histoire/fin' };
  var PASSAGE = { 2: 'village', 3: 'ville', 4: 'moyen-age', 5: 'vapeur', 6: 'electricite' }; // la petite scène qui clôt une époque (avant le bouton doré)
  // la dernière petite scène déjà vue, pour la rejouer depuis la marque « Fini »
  function dernierPassage() {
    var e = monde.epoque + (M.epoqueTerminee(monde) ? 1 : 0); // l'époque d'après, si celle-ci est finie
    return e >= 7 ? 'electricite' : e >= 6 ? 'vapeur' : e >= 5 ? 'moyen-age' : e >= 4 ? 'ville' : 'village';
  }
  function cinematique(nom, ensuite) {
    var t = H[nom][LANGUE], box = $('cine'), vid = box.querySelector('video'), img = box.querySelector('img');
    var lu = nom === 'intro' ? D.epoques[0].intro : t.l1 + ' ' + t.l2; // l'intro garde sa phrase enregistrée
    var h2 = box.querySelector('h2');
    h2.textContent = t.titre || ''; h2.hidden = !t.titre;
    box.querySelector('.l1').textContent = t.l1;
    box.querySelector('.l2').textContent = t.l2;
    box.querySelector('.go').textContent = t.go;
    box.querySelector('.passer').textContent = H.passer[LANGUE];
    box.classList.toggle('haut', nom !== 'intro'); // le passage et la fin : le texte dans le ciel étoilé, le village reste visible
    img.src = ASSETS[CINE_IMAGES[nom]] || '';
    box.classList.remove('texte');
    box.hidden = false;
    enScene = true;
    var montre = false;
    function texte() {
      if (montre) return;
      montre = true;
      MUS.pause = false;
      try { vid.pause(); } catch (e) {}
      box.classList.add('texte');
      setTimeout(function () { dire(lu); }, 400);
    }
    vid.onended = texte; vid.onerror = texte;
    var video = (window.CINE || {})[nom];
    if (video && !MOUVEMENT_REDUIT) {
      vid.hidden = false; vid.src = video; MUS.pause = true; majMusique();
      var p = vid.play(); if (p && p.catch) p.catch(texte);
    } else { vid.hidden = true; vid.removeAttribute('src'); texte(); }
    box.querySelector('.voix').onclick = function () { dire(lu); };
    box.querySelector('.passer').onclick = texte;
    box.querySelector('.go').onclick = function () {
      son('clic');
      try { vid.pause(); } catch (e) {}
      vid.removeAttribute('src');
      box.hidden = true; enScene = false;
      if (ensuite) ensuite();
    };
  }
  // le parcours est fini quand toutes les découvertes de la dernière époque sont faites
  function partieFinie() { return M.partieFinie(monde); } // la fusée a décollé
  // Ludiworld n'enlève jamais « Fini » : un enfant qui a fini le jeu quand il s'arrêtait au néolithique garde sa marque,
  // et la nouvelle époque l'attend derrière le bouton doré.
  function majFini() {
    var f = partieFinie();
    if (f) ui.fini = true;
    $('marque-fini').hidden = !(f || ui.fini);
    $('marque-fini-mot').textContent = H.fini[LANGUE];
    if (f && LUDI) LUDI.fini();
  }
  $('marque-fini').addEventListener('click', function () { son('clic'); cinematique(partieFinie() ? 'fin' : dernierPassage()); });

  function ouvrirDecouvertes() {
    var e = D.epoques.filter(function (x) { return x.id === monde.epoque; })[0];
    var derniere = !D.epoques.some(function (x) { return x.id === monde.epoque + 1; });
    $('dec-sous').textContent = derniere && M.partieFinie(monde) ? 'Tu as tout découvert, et ta fusée est partie vers les étoiles !'
      : derniere && M.epoqueTerminee(monde) ? 'Tu as tout découvert ! Il reste à faire décoller la fusée.'
      : e.nom + ' · tu as ' + monde.idees + ' 💡';
    var g = $('grille-dec');
    g.innerHTML = '';
    M.decouvertesEpoque(monde).forEach(function (id) {
      var d = D.decouvertes[id], etat = M.etatDecouverte(monde, id);
      var el = document.createElement('div');
      el.className = 'dec ' + etat;
      var besoin = etat === 'bloquee' ? '<div class="besoin">' + d.prerequis.filter(function (p) { return !monde.decouvertes[p]; })
        .map(function (p) { return '<img src="' + ASSETS[D.decouvertes[p].icone] + '" alt="">'; }).join('') + '</div>' : '';
      el.innerHTML = '<img src="' + ASSETS[d.icone] + '" alt=""><div class="nom">' + d.nom + '</div>' +
        (etat === 'faite' ? '<div class="cout">📖 Relire</div>' : '<div class="cout">💡 ' + d.idees + '</div>') + besoin;
      el.addEventListener('click', function () {
        if (etat === 'faite') ouvrirPage(id);
        else if (etat === 'possible') faireDecouverte(id);
        else if (etat === 'attente') aide(A.ideesManquent, true);
        else if (etat === 'bloquee') aide(D.textes.prerequis(d.prerequis.filter(function (p) { return !monde.decouvertes[p]; })), true);
      });
      g.appendChild(el);
    });
    ouvrir('decouvertes');
    var fen = document.querySelector('#decouvertes .fenetre');
    fen.scrollTop = 0; requestAnimationFrame(function () { fen.scrollTop = 0; });
  }
  $('btn-decouvertes').addEventListener('click', function () { son('clic'); ouvrirDecouvertes(); });

  var finEpoqueEnAttente = false;
  function faireDecouverte(id) {
    if (!M.decouvrir(monde, id)) return;
    fermer('decouvertes');
    son('decouverte');
    var d = D.decouvertes[id];
    var debloques = Object.keys(D.batiments).filter(function (k) { return D.batiments[k].debloque === id; });
    debloques.forEach(function (k) { if (ui.nouveaux.indexOf(k) < 0) ui.nouveaux.push(k); });
    ouvrirPage(id, { nouveau: true, ensuite: function () { if (id === 'outils') aideUneFois('outils-bois', A.outilsBois); if (id === 'bronze' && monde.batiments.some(function (b) { return b.type === 'tas-bois'; })) aideUneFois('hache-bronze', A.hacheBronze); if (id === 'fer') aideUneFois('outils-fer', A.outilsFer); if (id === 'vapeur' && monde.batiments.some(function (b) { return b.type === 'moulin'; })) aideUneFois('moulin-vapeur', A.moulinVapeur); if (id === 'ampoule') { var c0 = TR.centre(TR.CI, TR.CJ); centrerSur(c0[0], c0[1]); aideUneFois('lumiere', A.lumiere); } if (id === 'voiture') aideUneFois('voitures', A.voitures); if (id === 'satellite') { satellite.prochain = 2; aideUneFois('satellite', A.satellite); } if (id === 'fusee') { var bt = monde.batiments.filter(function (b) { return b.type === 'pas-de-tir'; })[0]; if (bt) { centrerSur(bt.x, bt.y); aideUneFois('pas-de-tir', A.pasDeTir); } } if (id === 'pont') { var pp = monde.batiments.filter(function (b) { return b.type === 'pont-pierre'; })[0]; if (pp) centrerSur(pp.x, pp.y); } if (id === 'roue') { aideUneFois('routes', A.routes); if (monde.batiments.some(function (b) { return b.type === 'atelier-potier'; })) setTimeout(function () { aideUneFois('tour-potier', A.tourPotier); }, 5500); } if (id === 'elevage' && monde.batiments.some(function (b) { return b.type === 'ratelier-lances'; })) aideUneFois('plus-de-chasse', A.plusDeChasse); apresDecouverte(); ludiArret('decouverte'); } });
    sauver();
    ludiProgression();
  }
  function apresDecouverte() {
    if (!M.epoqueTerminee(monde)) return;
    var e = D.epoques.filter(function (x) { return x.id === monde.epoque; })[0];
    var suiv = D.epoques.filter(function (x) { return x.id === monde.epoque + 1; })[0];
    if (!suiv) {
      // la dernière époque : la fin vient quand la fusée décolle (le gros bouton), pas à la dernière découverte
      if (partieFinie()) { majFini(); cinematique('fin'); }
      return;
    }
    var bravo = function () { scene({ titre: 'Bravo !', images: ['habitants/sage', '01-pierre/peintures-rupestres'], texte: A.finEpoque[monde.epoque], bouton: 'Super !' }); };
    // la fin du néolithique : la petite tribu est devenue un village (le passage vers l'âge des métaux)
    if (PASSAGE[monde.epoque]) cinematique(PASSAGE[monde.epoque], bravo);
    else bravo();
  }
  $('btn-epoque').addEventListener('click', function (e) {
    e.stopPropagation();
    var suiv = D.epoques.filter(function (x) { return x.id === monde.epoque + 1; })[0];
    if (!suiv || !M.epoqueTerminee(monde)) return;
    son('clic');
    scene({
      titre: suiv.nom, illustration: ILLU_EPOQUE[suiv.id] || null, texte: A.pretEpoque[suiv.id] || '',
      bouton: 'En avant !', non: 'Pas encore',
      ensuite: function () {
        M.passerEpoque(monde);
        ui.nouveaux = ui.nouveaux.filter(function (k) { return D.batiments[k].epoque >= monde.epoque; });
        choisir(null);
        montrerEpoque();
        sauver();
        ludiProgression();
      }
    });
  });
  function montrerEpoque() {
    var e = D.epoques.filter(function (x) { return x.id === monde.epoque; })[0];
    $('epoque-nom').textContent = e.nom;
    if (monde.epoque === 1) { majFini(); cinematique('intro'); return; } // le début de la partie : l'intro de l'histoire
    var images = ['02-neolithique/champ-ble', 'habitants/paysan'];
    scene({ titre: e.nom, images: images, illustration: ILLU_EPOQUE[monde.epoque], texte: e.intro, bouton: 'C\'est parti !', ensuite: function () {
      if (monde.epoque === 2) {
        aideUneFois('epoque2', A.epoque2);
        setTimeout(function () { aideUneFois('hache-polie', A.hachePolie); }, 8000);
        setTimeout(function () { aideUneFois('maisons-a-main', A.maisonsAMain); }, 16000);
      }
      if (monde.epoque === 3) {
        aideUneFois('epoque3', A.epoque3);
        setTimeout(function () { aideUneFois('maisons-pierre', A.maisonsPierre); }, 12000);
      }
      if (monde.epoque === 4) {
        aideUneFois('epoque4', A.epoque4);
        setTimeout(function () { aideUneFois('maisons-colombages', A.maisonsColombages); }, 12000);
      }
      if (monde.epoque === 5) {
        aideUneFois('epoque5', A.epoque5);
        setTimeout(function () { aideUneFois('maisons-briques', A.maisonsBriques); }, 12000);
      }
      if (monde.epoque === 6) {
        aideUneFois('epoque6', A.epoque6);
        setTimeout(function () { aideUneFois('maisons-ville', A.maisonsVille); }, 12000);
      }
      if (monde.epoque === 7) {
        if (monde.tir) { var ct = TR.centre(monde.tir[0] + 0.5, monde.tir[1] + 0.5); centrerSur(ct[0], ct[1]); }
        aideUneFois('epoque7', A.epoque7);
        setTimeout(function () { aideUneFois('maisons-modernes', A.maisonsModernes); }, 14000);
      }
      // une nouvelle époque commence (on n'arrive ici au-delà de la première que par le bouton d'époque)
      if (monde.epoque > 1) ludiArret('epoque');
    } });
  }

  // ADR-054 : au changement d'âge, les bâtiments qui ne se construisent plus, chacun avec la raison de sa disparition.
  // Toucher une carte lit sa raison à voix haute. Ceux déjà bâtis restent dans la ville.
  function montrerDisparus(liste) {
    enScene = true;
    ui.disparus = null;
    $('disparus-titre').textContent = A.disparusTitre;
    $('disparus-sous').textContent = A.disparusIntro;
    var g = $('grille-disparus');
    g.innerHTML = '';
    liste.forEach(function (k) {
      var d = D.batiments[k]; if (!d || !d.disparait) return;
      var c = document.createElement('div'); c.className = 'disparu';
      c.innerHTML = '<div class="cadre"><img alt="" src="' + (ASSETS[d.sprite] || '') + '"></div><div class="nom"></div><div class="pourquoi"></div>';
      c.querySelector('.nom').textContent = d.nom;
      c.querySelector('.pourquoi').textContent = nb(d.disparait.pourquoi);
      c.addEventListener('click', function () { c.classList.add('lu'); son('clic'); dire(d.nom + '. ' + d.disparait.pourquoi); });
      g.appendChild(c);
    });
    $('disparus-voix').onclick = function () { dire(A.disparusIntro); };
    $('disparus-ok').onclick = function () { fermer('disparus'); enScene = false; sauver(); };
    ouvrir('disparus');
    setTimeout(function () { dire(A.disparusIntro); }, 300);
  }

  // ---------- la fusée : un gros bouton, un compte à rebours, et elle décolle ----------
  var lancement = null;
  function majBoutonFusee() {
    var montrer = monde.fusee === 'prete' && !enScene && !lancement;
    if ($('btn-fusee').hidden === montrer) $('btn-fusee').hidden = !montrer;
  }
  $('btn-fusee').addEventListener('click', function (e) {
    e.stopPropagation();
    if (monde.fusee !== 'prete' || lancement) return;
    son('clic'); cacherInfo(); choisir(null);
    var b = padTir(); if (b) centrerSur(b.x, basBat(b) - 120);
    lancement = { n: 0, feu: false };
    $('btn-fusee').hidden = true;
    var mots = A.compteRebours, box = $('compte');
    box.hidden = false;
    function etape() {
      if (lancement.n >= mots.length) { box.hidden = true; box.innerHTML = ''; lancement = null; M.decoller(monde); sauver(); return; }
      var m = mots[lancement.n], dernier = lancement.n === mots.length - 1;
      box.innerHTML = '<span class="' + (dernier ? 'go' : '') + '">' + (dernier ? m.replace(' !', '') : m.replace(/ !$/, '').replace('Trois', '3').replace('Deux', '2').replace('Un', '1')) + '</span>';
      if (lancement.n === 2) lancement.feu = true;
      dire(m); son(dernier ? 'fini' : 'pop');
      lancement.n++;
      setTimeout(etape, 1000);
    }
    etape();
  });

  $('c-nourriture').addEventListener('click', function () { son('clic'); aide(A.nourritureInfo, true); });

  // ---------- les merveilles (ADR-030) ----------
  function merveilles() { return M.construisibles(monde).filter(function (k) { return D.batiments[k].merveille; }); }
  // ce que le joueur peut faire pour une merveille : la commencer, bâtir l'étape suivante, attendre le chantier
  function actionMerveille(type) {
    var d = D.batiments[type], b = monde.batiments.filter(function (x) { return x.type === type; })[0];
    if (!b) return { genre: 'commencer', etape: 1, cout: d.cout };
    if (b.etat === 'chantier') return { encours: true, b: b };
    var a = M.amelioration(monde, b);
    return a ? { genre: 'etape', etape: a.etape, cout: a.cout, b: b } : { finie: true, b: b };
  }
  function ouvrirMerveilles() {
    var g = $('grille-merv'); g.innerHTML = '';
    merveilles().forEach(function (type) {
      var d = D.batiments[type], a = actionMerveille(type), b = a.b, fait = b ? (b.etape || 0) : 0;
      var el = document.createElement('div');
      el.className = 'merv' + (a.encours ? ' encours' : a.finie ? ' finie' : '');
      var etapes = '<div class="etapes">' + [0, 1, 2].map(function (i) { return '<i class="' + (i < fait ? 'ok' : '') + '"></i>'; }).join('') + '</div>';
      var bouton = a.finie ? '<div class="nom">✓ Terminée !</div>'
        : a.encours ? '<button class="bat non" disabled>🔨 En chantier…</button>'
        : '<button class="bat' + (monde.pieces >= a.cout ? '' : ' non') + '">' + (a.genre === 'commencer' ? 'Commencer' : 'Étape ' + a.etape) + ' · 🪙 ' + a.cout + '</button>';
      el.innerHTML = '<img src="' + ASSETS[d.sprite] + '" alt=""><div class="nom"></div>' + etapes + bouton + '<button class="lire">📖</button>';
      el.querySelector('.nom').textContent = d.nom;
      el.querySelector('.lire').addEventListener('click', function () { fermer('merveilles'); ouvrirPage(d.page); });
      var bt = el.querySelector('.bat');
      if (bt && !a.encours) bt.addEventListener('click', function () {
        if (monde.pieces < a.cout) { son('non'); aide(A.piecesManquent, true); return; }
        if (a.genre === 'commencer') {
          if (!M.peutConstruire(monde, type)) { son('non'); aide(A.plusDePlace, true); return; }
          fermer('merveilles'); choisir(type);
        } else if (M.ameliorer(monde, b.id)) {
          son('pose'); fermer('merveilles'); centrerSur(b.x, b.y); signatureBarre = ''; sauver();
        }
      });
      g.appendChild(el);
    });
    ouvrir('merveilles');
    var fen = document.querySelector('#merveilles .fenetre');
    fen.scrollTop = 0; requestAnimationFrame(function () { fen.scrollTop = 0; });
  }
  $('btn-merveilles').addEventListener('click', function () { son('clic'); ouvrirMerveilles(); aideUneFois('merveilles', A.merveilles); });
  function centrerSur(x, y) { V.cx = x; V.cy = y - 60; borner(); }
  // la caméra glisse doucement vers un point (le grand déménagement des fermes)
  function glisserVers(x, y, duree) {
    var x0 = V.cx, y0 = V.cy, t0 = performance.now();
    (function pas() {
      var k = Math.min(1, (performance.now() - t0) / duree); k = k * k * (3 - 2 * k);
      V.cx = x0 + (x - x0) * k; V.cy = y0 + (y - 60 - y0) * k; borner();
      if (k < 1) requestAnimationFrame(pas);
    })();
  }
  // ADR-050, ADR-051 : le grand déménagement des fermes. On voit les champs et les enclos de la ville disparaître
  // dans un nuage, les moutons partir à pied, puis la caméra glisse jusqu'aux grandes exploitations de la campagne.
  var demenagementEnCours = false;
  function jouerDemenagement(d) {
    demenagementEnCours = true;
    var cx = 0, cy = 0;
    d.anciens.forEach(function (o) { cx += o.x; cy += o.y; });
    cx /= d.anciens.length; cy /= d.anciens.length;
    glisserVers(cx, cy, 900);
    son('chantier');
    aide(A.demenagement1);
    d.anciens.forEach(function (o, k) { setTimeout(function () { pouf(o.x, o.y - 30, 18, '236,222,190'); }, 700 + k * 260); });
    var nouv = d.nouveaux.map(function (id) { return M.bat(monde, id); }).filter(Boolean);
    setTimeout(function () {
      if (nouv.length) {
        var nx = 0, ny = 0;
        nouv.forEach(function (b) { nx += b.x; ny += b.y; });
        glisserVers(nx / nouv.length, ny / nouv.length, 2200);
      }
      setTimeout(function () {
        nouv.forEach(function (b, k) { setTimeout(function () { var t = tailleBat(b); pouf(b.x, b.y - t.h / V.s * 0.3, 26, '255,210,63'); }, k * 400); });
        son('fini');
        aide(A.demenagement2);
        demenagementEnCours = false;
        ui.demenagement = null;
        sauver();
      }, 2300);
    }, 1400 + d.anciens.length * 260);
  }

  // menu
  $('btn-menu').addEventListener('click', function () { $('menu-voix').textContent = '🔊 Voix : ' + (ui.voix ? 'oui' : 'non'); ouvrir('menu'); });
  $('menu-voix').addEventListener('click', function () { ui.voix = !ui.voix; this.textContent = '🔊 Voix : ' + (ui.voix ? 'oui' : 'non'); sauver(); });
  function texteMusique() { return '🎵 Musique : ' + (ui.musique === false ? 'non' : 'oui'); }
  $('btn-menu').addEventListener('click', function () { $('menu-musique').textContent = texteMusique(); });
  $('menu-musique').addEventListener('click', function () { ui.musique = ui.musique === false; this.textContent = texteMusique(); sauver(); majMusique(); });
  $('menu-plein').addEventListener('click', function () { basculerPleinEcran(); fermer('menu'); });
  var confirmeA = 0;
  $('menu-recommencer').addEventListener('click', function () {
    var b = this;
    if (Date.now() - confirmeA > 4000) {
      confirmeA = Date.now();
      b.textContent = '↺ Sûr ? Touche encore pour tout effacer';
      setTimeout(function () { b.textContent = '↺ Recommencer la partie'; }, 4000);
      return;
    }
    confirmeA = 0;
    b.textContent = '↺ Recommencer la partie';
    try { localStorage.removeItem(CLE); } catch (e) {}
    monde = M.nouveau((Date.now() % 100000) + 1);
    ui.aide = {}; ui.nouveaux = [];
    choisir(null);
    fermer('menu');
    montrerEpoque();
    sauver();
    ludiNuit = null;
    ludiProgression();
  });
  function estPleinEcran() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function verrouiller() {
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) {}
  }
  function pleinEcran() {
    if (DANS_LUDI) return true; // dans Ludiworld, c'est Ludiworld qui décide du plein écran
    var d = document.documentElement;
    var f = d.requestFullscreen || d.webkitRequestFullscreen;
    if (!f) return false;
    try {
      var r = f.call(d);
      if (r && r.then) r.then(verrouiller).catch(function () {}); else verrouiller();
    } catch (e) { return false; }
    return true;
  }
  function basculerPleinEcran() {
    if (estPleinEcran()) {
      try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {}
      return;
    }
    if (!pleinEcran()) aide(A.iphone, true);
  }
  if (DANS_LUDI) { $('btn-plein').style.display = 'none'; $('tourner-plein').style.display = 'none'; }
  $('btn-plein').addEventListener('click', basculerPleinEcran);
  $('tourner-plein').addEventListener('click', basculerPleinEcran);
  document.addEventListener('fullscreenchange', function () { $('btn-plein').textContent = estPleinEcran() ? '✕' : '⛶'; });

  // installation de l'appli (Android : invite du navigateur ; iPhone : consigne)
  var invite = null;
  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); invite = e; $('menu-installer').hidden = false; });
  $('menu-installer').addEventListener('click', function () {
    if (!invite) return;
    invite.prompt();
    invite = null; this.hidden = true;
  });
  if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone) $('menu-ios').hidden = false;
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude\.ai|claudeusercontent/.test(location.host)) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  // phrases des habitants
  var phrases = D.textes.phrases, A = D.textes.aides;
  function parler(h) {
    var cat = h.faim ? 'faim' : h.enfant ? 'enfant' : h.reserve ? 'construit' : (h.metier && phrases[h.metier]) ? h.metier : 'libre';
    var l = phrases[cat], texte = l[Math.floor(Math.random() * l.length)];
    paroles = paroles.filter(function (p) { return p.hab !== h.id; });
    paroles.push({ hab: h.id, texte: texte, debut: T, fin: T + 2.8 });
    dire(texte);
  }

  // ---------- toucher : taper, glisser, pincer ----------
  var premierToucher = true;
  var doigts = {}, geste = null;
  function nbDoigts() { return Object.keys(doigts).length; }
  function deuxDoigts() { var k = Object.keys(doigts); return [doigts[k[0]], doigts[k[1]]]; }
  cv.addEventListener('pointerdown', function (ev) {
    if (premierToucher) { premierToucher = false; if (!params.has('test')) pleinEcran(); }
    try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
    doigts[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    if (nbDoigts() === 1) geste = { type: 'tap', x0: ev.clientX, y0: ev.clientY, cx: V.cx, cy: V.cy };
    else if (nbDoigts() === 2) {
      var d = deuxDoigts();
      geste = { type: 'pince', d0: Math.hypot(d[0].x - d[1].x, d[0].y - d[1].y) || 1, s0: V.s,
        mx: (d[0].x + d[1].x) / 2, my: (d[0].y + d[1].y) / 2, cx: V.cx, cy: V.cy };
    }
  });
  cv.addEventListener('pointermove', function (ev) {
    if (!doigts[ev.pointerId]) return;
    doigts[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    if (!geste) return;
    if (geste.type === 'tap' && Math.hypot(ev.clientX - geste.x0, ev.clientY - geste.y0) > 10) geste.type = 'glisse';
    if (geste.type === 'glisse') {
      V.cx = geste.cx - (ev.clientX - geste.x0) / V.s;
      V.cy = geste.cy - (ev.clientY - geste.y0) / V.s;
      borner();
    } else if (geste.type === 'pince' && nbDoigts() >= 2) {
      var d = deuxDoigts();
      var dist = Math.hypot(d[0].x - d[1].x, d[0].y - d[1].y);
      var mx = (d[0].x + d[1].x) / 2, my = (d[0].y + d[1].y) / 2;
      // le point du monde sous les doigts au départ reste sous les doigts
      var wx = geste.cx + (geste.mx - V.W / 2) / geste.s0, wy = geste.cy + (geste.my - V.H / 2) / geste.s0;
      V.s = Math.max(V.sMin, Math.min(V.sMax, geste.s0 * dist / geste.d0));
      V.cx = wx - (mx - V.W / 2) / V.s;
      V.cy = wy - (my - V.H / 2) / V.s;
      borner();
    }
  });
  function finDoigt(ev) {
    if (!doigts[ev.pointerId]) return;
    delete doigts[ev.pointerId];
    if (geste && geste.type === 'tap' && nbDoigts() === 0 && ev.type === 'pointerup') toucher(geste.x0, geste.y0);
    if (nbDoigts() === 0) geste = null;
    else if (geste && geste.type === 'pince') geste = null;
  }
  cv.addEventListener('pointerup', finDoigt);
  cv.addEventListener('pointercancel', finDoigt);
  cv.addEventListener('wheel', function (ev) {
    ev.preventDefault();
    zoomer(ev.deltaY < 0 ? 1.12 : 1 / 1.12, ev.clientX, ev.clientY);
  }, { passive: false });

  // ---------- le réveil ----------
  $('reveil-img').src = ASSETS['nuit/coq'] || '';
  $('btn-reveil').addEventListener('click', function (e) {
    e.stopPropagation();
    if (!M.reveiller(monde)) return;
    $('btn-reveil').hidden = true;
    son('coq');
    dire(A.cocorico);
    setTimeout(function () {
      monde.habitants.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 3)
        .forEach(function (h, i) { setTimeout(function () { bark(h, auHasard(BARKS.reveil)); }, i * 500); });
    }, 1600);
    sauver();
  });

  // ---------- fiches d'explication (ADR-015) ----------
  var METIERS = {
    sage: 'le sage', bucheron: 'le bûcheron', cueilleur: 'la cueilleuse', tailleur: 'le tailleur de silex',
    chasseur: 'le chasseur', pecheur: 'le pêcheur', peintre: 'la peintre', paysan: 'le paysan',
    berger: 'le berger', porteur: 'le porteur', potier: 'la potière', meunier: 'la meunière',
    forgeron: 'le forgeron', scribe: 'le scribe', marchand: 'la marchande', marin: 'le marin', charron: 'le charron',
    marechal: 'le maréchal-ferrant', moulinier: 'le meunier', boulanger: 'la boulangère', horloger: "l'horloger", imprimeur: "l'imprimeur",
    mineur: 'le mineur', ouvriere: "l'ouvrière", cheminot: 'le chef de gare', inventeur: "l'inventrice", matelot: 'la matelote', pompier: 'le pompier',
    electricien: "l'électricien", standardiste: 'la standardiste', aviatrice: "l'aviatrice", mecanicien: 'le mécanicien', fermier: 'le fermier', chercheur: 'la chercheuse',
    informaticien: "l'informaticienne", caissier: 'le caissier', ingenieur: "l'ingénieur", technicien: 'le technicien', astronome: "l'astronome"
  };
  var infoMinuteur = null;
  function montrerInfo(o) {
    $('info-img').src = ASSETS[o.img] || '';
    $('info-img').hidden = !ASSETS[o.img];
    $('info-titre').textContent = o.titre;
    $('info-texte').textContent = nb(o.texte);
    $('info-statut').textContent = o.statut || '';
    $('info-statut').hidden = !o.statut;
    // le bouton qui ouvre la grande page (ADR-018)
    $('info-plus').hidden = !o.page;
    var am = o.bat ? M.amelioration(monde, o.bat) : null, ba = $('info-ameliorer');
    ba.hidden = !am;
    if (am) {
      // on montre à quoi il ressemblera (ADR-038)
      var apres = am.genre === 'maison' || am.genre === 'moderne' ? D.batiments[am.vers].sprite : am.genre === 'niveau' ? 'niveaux/' + o.bat.type + '-' + am.niveau : null;
      if (am.genre === 'moderne' && (o.bat.niveau || 1) > 1 && ASSETS['niveaux/' + am.vers + '-' + o.bat.niveau]) apres = 'niveaux/' + am.vers + '-' + o.bat.niveau;
      var trA = D.batiments[o.bat.type].travail;
      var nomVers = am.vers ? D.batiments[am.vers].nom.replace(/^(Une?|Les|La|Le) /, '').replace(/^L'/, '').toLowerCase() : '';
      ba.classList.toggle('doree', am.genre === 'moderne' || (am.genre === 'maison' && !!am.moderne));
      ba.innerHTML = (apres && ASSETS[apres] ? '<img src="' + ASSETS[apres] + '" alt="">' : '') + '<span>' +
        (am.genre === 'moderne' ? (am.place ? '✨ Moderniser : ' + nomVers : '✨ ' + nomVers + ' : il faut plus de place autour')
        : am.genre === 'maison' ? (am.moderne ? '✨ Moderniser : ' : '⬆ Transformer en ') + nomVers
        : am.genre === 'etape' ? '🏛 Étape ' + am.etape
        : '⬆ Niveau ' + am.niveau + ' · 👷 +1' + (trA ? ' · ' + EMOJI[trA.produit] + ' +' + M.quantite(o.bat, monde) : '')) + ' · 🪙 ' + am.cout + '</span>';
      ba.classList.toggle('non', monde.pieces < am.cout || am.place === false);
      ba.onclick = function (e) {
        e.stopPropagation();
        if (am.place === false) { son('non'); return; }
        if (monde.pieces < am.cout) { son('non'); aide(A.piecesManquent, true); return; }
        if (M.ameliorer(monde, o.bat.id)) {
          son('pose'); cacherInfo();
          if (am.genre === 'niveau') aideUneFois('ameliorer', A.amelioration);
          signatureBarre = ''; sauver();
        }
      };
    }
    $('info-plus').onclick = function (e) { e.stopPropagation(); cacherInfo(); ouvrirPage(o.page, { ici: o.type }); };
    $('info-voix').onclick = function (e) { e.stopPropagation(); dire(o.texte); };
    $('info').hidden = false;
    dire(o.texte);
    clearTimeout(infoMinuteur);
    infoMinuteur = setTimeout(cacherInfo, 14000);
  }
  function cacherInfo() { $('info').hidden = true; }
  // espaces insécables avant ! ? : (typographie française, pas de « ! » tout seul en début de ligne)
  function nb(t) { return String(t || '').replace(/ ([!?:;])/g, '\u00a0$1'); }
  function pageDuBat(type) { var d = D.batiments[type]; var id = d.page || d.debloque; return id && (D.decouvertes[id] || D.pages[id]) ? id : null; }

  // ---------- la grande page illustrée (ADR-018) ----------
  function ouvrirPage(id, o) {
    o = o || {};
    var d = D.decouvertes[id] || D.pages[id];
    if (!d) return;
    var ep = D.epoques.filter(function (e) { return e.id === d.epoque; })[0];
    $('page-img').src = ASSETS[d.scene] || ASSETS[d.image] || ASSETS[d.icone] || '';
    $('page-image').classList.toggle('objet', !ASSETS[d.scene]);
    $('page-bandeau').hidden = !o.nouveau;
    $('page-bandeau').textContent = o.bandeau || 'Nouvelle découverte !';
    var bd = Object.keys(D.batiments).map(function (k) { return D.batiments[k]; }).filter(function (b) { return b.page === id; })[0];
    $('page-epoque').textContent = (ep ? ep.nom : '') + (D.decouvertes[id] ? ' · Découverte' : bd && bd.merveille ? ' · Merveille' : d.deco ? ' · Décoration' : '');
    $('page-titre').textContent = d.nom;
    $('page-texte').textContent = nb(d.texte);
    var ul = $('page-faits'); ul.innerHTML = '';
    (d.faits || []).forEach(function (f) {
      var li = document.createElement('li'); li.textContent = nb(f);
      li.addEventListener('click', function () { dire(f); });
      ul.appendChild(li);
    });
    var bats = Object.keys(D.batiments).filter(function (k) { return pageDuBat(k) === id && !D.batiments[k].automatique; });
    bats.sort(function (a, b) { return (b === o.ici) - (a === o.ici); });
    var zone = $('page-bats'); zone.innerHTML = '';
    bats.forEach(function (k) {
      var b = D.batiments[k], el = document.createElement('div');
      el.className = 'page-bat' + (k === o.ici ? ' ici' : '');
      var imgs = document.createElement('div'); imgs.className = 'imgs';
      var vs = (b.vignettes || []).filter(function (v) { return ASSETS['vignettes/' + v.img]; });
      if (vs.length) vs.forEach(function (v) {
        var im = document.createElement('img'); im.src = ASSETS['vignettes/' + v.img]; im.alt = '';
        im.addEventListener('click', function () { dire(v.texte); });
        imgs.appendChild(im);
      });
      else { var im = document.createElement('img'); im.src = ASSETS[b.sprite]; im.className = 'sprite'; im.alt = ''; imgs.appendChild(im); }
      var txt = document.createElement('div');
      txt.innerHTML = '<b></b><span></span>';
      txt.firstChild.textContent = b.nom; txt.lastChild.textContent = nb(b.explication || b.resume || '');
      txt.addEventListener('click', function () { dire(b.explication || b.resume || ''); });
      el.appendChild(imgs); el.appendChild(txt);
      zone.appendChild(el);
    });
    if (d.deco) { zone.innerHTML = ''; bats = []; }
    $('page-bats-titre').hidden = !bats.length;
    $('page-ok').textContent = o.nouveau ? 'Super !' : 'J\'ai compris !';
    function finir() { fermer('page'); enScene = false; if (o.ensuite) o.ensuite(); }
    $('page-ok').onclick = finir;
    $('page-fermer').onclick = finir;
    $('page-voix').onclick = function () { dire([d.nom, d.texte].concat(d.faits || [])); };
    enScene = true;
    ouvrir('page');
    $('page-corps').scrollTop = 0;
    requestAnimationFrame(function () { $('page-corps').scrollTop = 0; });
    setTimeout(function () { dire([d.nom, d.texte]); }, 250);
  }
  $('info-fermer').addEventListener('click', function (e) { e.stopPropagation(); cacherInfo(); });
  function resumeType(type) {
    var d = D.batiments[type], l = [];
    if (d.lits) l.push('👥 ' + d.lits + ' personnes y dorment');
    if (d.travail) l.push(EMOJI[d.travail.produit] + ' +' + M.qteDe(d.travail, monde.epoque, monde) + ' à chaque fois · ' + METIERS[d.travail.metier]);
    if (d.merveille) l.push('🏛 Merveille en 3 étapes');
    if (M.RESERVE[type]) l.push('🍖 La réserve grandit de ' + M.RESERVE[type]);
    if (d.cout != null) l.push((d.merveille ? 'Chaque étape coûte 🪙 ' : 'Coûte 🪙 ') + d.cout);
    return l.join(' · ');
  }
  function infoBatiment(b) {
    var d = D.batiments[b.type], statut;
    if (b.etat === 'chantier') statut = '🔨 Chantier : ' + b.livre + ' bois apporté' + (b.livre > 1 ? 's' : '') + ' sur ' + b.besoin;
    else if (d.travail) {
      var nO = (b.ouvriers || []).length, nP = M.places(b);
      statut = nO ? '👷 ' + nO + ' / ' + nP + ' travailleur' + (nP > 1 ? 's' : '') + ' · ' + METIERS[d.travail.metier]
        : 'Personne n\'y travaille encore : il faut un nouvel habitant.';
      if (nO && nO < nP) statut += ' (il manque quelqu\'un)';
    } else if (d.merveille && !M.merveilleFinie(b)) statut = '🏛 Étape ' + (b.etape || 0) + ' sur 3 : ouvre les merveilles pour continuer.';
    else if (d.lits) statut = '👥 ' + d.lits + ' personnes y dorment';
    if (M.RESERVE[b.type] && b.etat === 'fini') statut = (statut ? statut + ' · ' : '') + '🍖 +' + M.RESERVE[b.type] + ' dans la réserve';
    if (d.finitAvec && monde.decouvertes[d.finitAvec]) statut = 'Depuis l\'élevage, plus besoin de chasser : la viande vient de l\'enclos.';
    var n = monde.habitants.filter(function (q) { return q.dort && q.dortChez === b.id; }).length;
    if (n) statut = '😴 Chut… ' + (n > 1 ? n + ' personnes dorment' : 'quelqu\'un dort') + ' ici.';
    if (d.travail && b.etat === 'fini' && !(d.finitAvec && monde.decouvertes[d.finitAvec])) statut = (statut ? statut + ' · ' : '') + '⭐ Niveau ' + (b.niveau || 1) + ' · ' + EMOJI[d.travail.produit] + ' +' + M.quantite(b, monde) + ' à chaque fois';
    montrerInfo({ img: d.sprite, titre: d.nom, texte: d.resume || d.explication || '', statut: statut, page: pageDuBat(b.type), type: b.type, bat: b });
  }
  function infoNature(cle) { var n = D.textes.nature[cle]; montrerInfo({ img: n[0], titre: n[1], texte: n[2] }); }

  function toucher(x, y) {
    var w = W2(x, y);
    if (choix) {
      var tu = TR.tuileDe(w[0], w[1]);
      var ancre = M.ancrePour(monde, choix, tu[0], tu[1]);
      if (ancre) {
        var type = choix;
        var b = M.construire(monde, type, ancre);
        if (b) {
          son('pose');
          ui.nouveaux = ui.nouveaux.filter(function (k) { return k !== type; });
          pouf(b.x, b.y, 8, '210,190,150');
          choisir(null);
          cacherInfo();
          aideUneFois('chantier', A.chantier);
          sauver();
        }
      } else son('non');
      return;
    }
    for (var cg = 0; cg < cadeaux.length; cg++) {
      if (Math.hypot(x - cadeaux[cg].x, y - cadeaux[cg].y) < cadeaux[cg].r) { ouvrirCadeau(cadeaux[cg].bat); return; }
    }
    for (var f = 0; f < fleches.length; f++) {
      if (Math.hypot(x - fleches[f].x, y - fleches[f].y) < fleches[f].r) { var bf = M.bat(monde, fleches[f].bat); if (bf) { son('clic'); infoBatiment(bf); } return; }
    }
    for (var i = 0; i < bulles.length; i++) {
      var bu = bulles[i];
      if (Math.hypot(x - bu.x, y - bu.y) < bu.r) {
        var r = M.recolter(monde, bu.bat);
        if (r) { son('pop'); voler(EMOJI[r.produit], bu.x, bu.y, 'c-' + r.produit, r.n); }
        return;
      }
    }
    // un habitant ?
    var best2 = null, bd2 = 1e9;
    monde.habitants.forEach(function (h) {
      if (h.dort || h.cache) return;
      var p = E(h.x, h.y - 30);
      var d = Math.hypot(x - p[0], y - p[1]);
      if (d < bd2) { bd2 = d; best2 = h; }
    });
    if (best2 && bd2 < Math.max(24, 36 * V.s)) { parler(best2); return; }
    // un animal ?
    var an = monde.animaux.filter(function (a) {
      if (a.disparu) return false;
      var p = E(a.x, a.y), lw = (a.espece === 'mammouth' ? 165 : a.espece === 'lapin' ? 40 : 50) * V.s;
      return Math.abs(x - p[0]) < lw / 2 && y < p[1] + 6 && y > p[1] - lw * 0.8;
    })[0];
    if (an) { infoNature(an.espece); return; }
    // un bâtiment ? (le plus en avant d'abord)
    var tc0 = TR.tuileDe(w[0], w[1]), ici0 = TR.tuile(monde.terrain, tc0[0], tc0[1]);
    var bats = monde.batiments.slice().sort(function (a, b2) { return basBat(b2) - basBat(a); });
    for (var n = 0; n < bats.length; n++) {
      var bt = bats[n], t = tailleBat(bt), pb = E(bt.x, basBat(bt));
      if (bt.type === 'passerelle') continue;
      if (bt.type === 'pont-pierre') { if (ici0 && ici0.gue) { infoBatiment(bt); return; } continue; }
      if (Math.abs(x - pb[0]) < t.w * 0.45 && y < pb[1] + 6 && y > pb[1] - t.h * 0.85) { if (bt.enFeu) infoNature('incendie'); else infoBatiment(bt); return; }
    }
    // le petit avion, les voitures, les lampadaires et les poteaux
    var ba = aerodrome();
    if (ba && avion.etat === 'vol') { var qa = posAvion(ba), sa = E(qa.x, qa.y - qa.z); if (Math.abs(x - sa[0]) < 70 * V.s && Math.abs(y - sa[1] + 20 * V.s) < 50 * V.s) { infoNature('avion'); return; } }
    for (var vi = 0; vi < voitures.length; vi++) { var sv = E(voitures[vi].x, voitures[vi].y + 8); if (Math.abs(x - sv[0]) < 45 * V.s && y < sv[1] + 6 && y > sv[1] - 60 * V.s) { infoNature('voiture'); return; } }
    var proche = function (l, pied, haut) { return (l || []).some(function (c) { var q = pied(c), sp = E(q[0], q[1]); return Math.abs(x - sp[0]) < 22 * V.s && y < sp[1] + 6 && y > sp[1] - haut * V.s; }); };
    if (proche(monde.lampes, piedLampe, HAUT_LAMPE)) { infoNature('lampe'); return; }
    if (proche(monde.eoliennes, piedEolienne, HAUT_EOLIENNE)) { infoNature('eolienne'); return; }
    if (proche(monde.panneaux, piedPanneau, HAUT_PANNEAU)) { infoNature('panneau'); return; }
    if ((monde.lignes || []).some(function (l) { return proche(l.poteaux, piedPoteau, HAUT_POTEAU); })) { infoNature('poteau'); return; }
    // le chemin de fer : le train, le tunnel, les rails
    if (monde.rails && monde.rails.tuiles && monde.rails.tuiles.length >= 2) { // une ligne d'une seule case : ni train ni tunnel
      var ptT = cheminTrain();
      if (ptT && !(train.etat === 'tunnel' && train.attente > 0)) { var qT = pointTrain(ptT, train.s), sT = E(qT[0], qT[1]); if (Math.abs(x - sT[0]) < 95 * V.s && y < sT[1] + 8 && y > sT[1] - 80 * V.s) { infoNature('train'); return; } }
      var rtT = monde.rails.tuiles, zT = E.apply(null, TR.centre(rtT[rtT.length - 1][0], rtT[rtT.length - 1][1]));
      if (Math.abs(x - zT[0]) < 110 * V.s && y < zT[1] + 40 * V.s && y > zT[1] - 120 * V.s) { infoNature('tunnel'); return; }
      var tcR = TR.tuileDe(w[0], w[1]), icR = TR.tuile(monde.terrain, tcR[0], tcR[1]);
      if (icR && icR.rail) { infoNature('rails'); return; }
    }
    // la nature
    var T0 = monde.terrain, tc = TR.tuileDe(w[0], w[1]);
    for (var dj = 0; dj <= 2; dj++) for (var di = 0; di <= 2; di++) {
      var tt = TR.tuile(T0, tc[0] + di, tc[1] + dj);
      if (!tt || !tt.obj || !TR.surIle(T0, tt)) continue;
      var sp = spriteObjet(tt), im = sp && IMG[sp[0]]; if (!im) continue;
      var c = TR.centre(tt.i, tt.j), pw = sp[1] * V.s, ph = pw * im.height / im.width, po = E(c[0], c[1] + 16);
      if (Math.abs(x - po[0]) < pw * 0.42 && y < po[1] + 6 && y > po[1] - ph * 0.9) { infoNature(tt.obj); return; }
    }
    var ici = TR.tuile(T0, tc[0], tc[1]);
    if (ici && ici.gue && !T0.passerelle) { infoNature(monde.pontEmporte ? 'gueEmporte' : 'gue'); return; }
    if (ici && ici.sol === 'herbe' && ici.usure >= 0.4) { infoNature(TR.etatHerbe(ici) === 3 && monde.decouvertes.voiture ? 'goudron' : monde.decouvertes.roue && TR.etatHerbe(ici) === 3 ? 'route' : 'sentier'); return; }
    cacherInfo();
  }

  // une merveille terminée : confettis, musique et sa grande page (ADR-030)
  function feteMerveille(b) {
    if (!b) return;
    var d = D.batiments[b.type], t = tailleBat(b);
    for (var i = 0; i < 4; i++) setTimeout(function () {
      pouf(b.x + (Math.random() - 0.5) * 200, b.y - t.h / V.s * 0.5, 16, ['255,210,63', '233,135,59', '120,190,240', '240,120,160'][Math.floor(Math.random() * 4)]);
      son('fini');
    }, i * 350);
    monde.habitants.filter(function (h) { return !h.dort && !h.cache; }).slice(0, 4).forEach(function (h, i) { setTimeout(function () { bark(h, auHasard(['Hourra !', 'Magnifique !', 'Bravo !', 'Quelle merveille !'])); }, 300 + i * 400); });
    centrerSur(b.x, b.y);
    aide(A.merveilleFinie);
    setTimeout(function () { ouvrirPage(d.page, { nouveau: true, bandeau: '🏛 Merveille terminée !', ensuite: function () { ludiArret('merveille'); } }); }, 2600);
  }
  function voler(emoji, x, y, cible, n) {
    var el = document.createElement('div');
    el.id = 'vole'; el.textContent = emoji + '+' + n;
    el.style.left = x - 20 + 'px'; el.style.top = y - 20 + 'px';
    document.body.appendChild(el);
    var r = $(cible).getBoundingClientRect();
    requestAnimationFrame(function () {
      el.style.transform = 'translate(' + (r.left + 20 - x) + 'px,' + (r.top + 10 - y) + 'px) scale(.6)';
      el.style.opacity = '0.2';
    });
    setTimeout(function () { el.remove(); }, 750);
  }

  // ---------- événements du monde ----------
  var etaitNuit = false;
  function traiterEvenements() {
    var ev = monde.evenements.splice(0);
    ev.forEach(function (e) {
      if (e.type === 'fini') {
        var b = M.bat(monde, e.bat);
        if (b) { var t = tailleBat(b); pouf(b.x, b.y - t.h / V.s * 0.3, 14); son('chantier'); }
        if (b && D.batiments[b.type].lits) aideUneFois('maison', A.maison);
        if (b && b.type === 'pont-pierre') { centrerSur(b.x, b.y); aideUneFois('pont-fini', A.pontFini); }
        if (b && b.type === 'aerodrome') { avion.etat = 'hangar'; avion.attente = 3; centrerSur(b.x, b.y); aideUneFois('avion', A.avion); }
        if (b && (b.niveau || 1) > 1 && b.__niv !== b.niveau) {
          // un niveau de plus : on le voit et on le fête (ADR-038)
          b.__niv = b.niveau;
          var tn = tailleBat(b);
          pouf(b.x, b.y - tn.h / V.s * 0.4, 22, '255,210,63');
          particule({ type: 'gain', texte: '⭐ Niveau ' + b.niveau + ' !', x: b.x, y: b.y - tn.h / V.s * 0.9, vy: -18, max: 2.2 });
        }
        if (b && D.batiments[b.type].merveille && !M.merveilleFinie(b)) aide(A.merveilleEtape);
      } else if (e.type === 'merveille') {
        feteMerveille(M.bat(monde, e.bat));
      } else if (e.type === 'chasse') {
        if (!e.loin) pouf(e.x, e.y - 10, e.espece === 'mammouth' ? 14 : 7, '235,225,205');
      } else if (e.type === 'gain') {
        // chacun rapporte lui-même sa production au village (ADR-029)
        particule({ type: 'gain', texte: '+' + e.n + ' ' + EMOJI[e.produit], x: e.x, y: e.y - 70, vy: -26, max: 1.6 });
        var cpt = $('c-' + e.produit); if (cpt) { cpt.classList.remove('tilt'); void cpt.offsetWidth; cpt.classList.add('tilt'); }
      } else if (e.type === 'perdu') {
        // la réserve est pleine : ce qui arrive est perdu (ADR-036) ; on dit quoi faire, de temps en temps
        if (!enScene && monde.t - (ui.perduA || -999) > 360 && T - derniereAide > 12) {
          ui.perduA = monde.t;
          var trop = M.besoinRepas(monde, monde.habitants.length + 1) > M.reserveMax(monde);
          aide(trop ? (monde.epoque >= 2 ? A.reserveTropPetite2 : A.reserveTropPetite1) : A.reserveDeborde);
        }
      } else if (e.type === 'crue') {
        // le petit problème du Moyen Âge : la rivière en crue emporte la passerelle
        for (var k = 0; k < 4; k++) pouf(e.x + (Math.random() - 0.5) * 160, e.y - 10, 12, '200,228,245');
        son('non');
        if (enScene) ui.crueAide = true; else { centrerSur(e.x, e.y); aideUneFois('crue', A.crue); }
      } else if (e.type === 'incendie') {
        // le petit problème de la vapeur : une étincelle de cheminée met le feu à une maison
        son('non');
        ui.incendieA = monde.t;
        if (enScene) ui.incendieAide = true; else { centrerSur(e.x, e.y); aideUneFois('incendie', A.incendie); }
      } else if (e.type === 'pompiers') {
        var bp = M.bat(monde, e.bat); if (bp && !enScene) centrerSur(bp.x, bp.y);
        aideUneFois('caserne', A.caserne);
      } else if (e.type === 'eteint') {
        for (var k2 = 0; k2 < 4; k2++) pouf(e.x + (Math.random() - 0.5) * 120, e.y - 60, 12, '200,228,245');
        son('fini');
        aideUneFois('eteint', A.eteint);
        sauver();
      } else if (e.type === 'air-sale') {
        // le petit problème du monde moderne : l'air de la ville devient tout gris
        son('non');
        if (enScene) ui.airSaleAide = true; else aideUneFois(e.encore ? 'air-sale-encore-' + monde.jour : 'air-sale', e.encore ? A.airSaleEncore : A.airSale);
      } else if (e.type === 'air-pur') {
        var eo = (monde.eoliennes || [])[0];
        if (eo && !enScene) { var ce = TR.centre(eo[0], eo[1]); centrerSur(ce[0], ce[1]); }
        (monde.panneaux || []).concat(monde.eoliennes || []).forEach(function (l, k) { var c = TR.centre(l[0], l[1]); setTimeout(function () { pouf(c[0], c[1] - 60, 6, '255,244,190'); }, k * 120); });
        son('fini');
        aideUneFois('air-pur', A.airPur);
        sauver();
      } else if (e.type === 'pas-de-tir') {
        if (!enScene) centrerSur(e.x, e.y);
        aideUneFois('pas-de-tir', A.pasDeTir);
        sauver();
      } else if (e.type === 'fusee-prete') {
        var bp = padTir();
        if (bp) { centrerSur(bp.x, basBat(bp) - 120); pouf(bp.x, basBat(bp) - 80, 12); }
        son('fini');
        aide(e.nouvelle ? A.fuseeNouvelle : A.fuseePrete);
        sauver();
      } else if (e.type === 'decollage') {
        son('decollage');
      } else if (e.type === 'fusee-partie') {
        sauver();
        if (e.n === 1) {
          // la toute première fusée : la vraie fin du jeu (vidéo, puis l'image et le texte), puis la marque « Fini »
          setTimeout(function () {
            cinematique('fin', function () { majFini(); sauver(); ludiProgression(); setTimeout(function () { aide(A.finJeu); }, 600); });
          }, 900);
        } else aide(A.fuseePartie);
      } else if (e.type === 'nuit-noire') {
        // le petit problème de l'électricité : la ville est trop grande, les rues restent noires
        son('non');
        if (enScene) ui.nuitNoireAide = true; else aideUneFois(e.encore ? 'nuit-noire-encore' : 'nuit-noire', e.encore ? A.nuitNoireEncore : A.nuitNoire);
      } else if (e.type === 'lumiere') {
        (monde.lampes || []).forEach(function (l, k) { var c = TR.centre(l[0], l[1]); setTimeout(function () { pouf(c[0] - 22, c[1] - 90, 6, '255,236,150'); }, k * 120); });
        son('fini');
        sauver();
      } else if (e.type === 'ligne') {
        if (!enScene) centrerSur(e.x, e.y);
        aideUneFois(e.genre === 'tel' ? 'lignes-tel' : 'lignes', e.genre === 'tel' ? A.lignesTel : A.lignes);
        sauver();
      } else if (e.type === 'disparus') {
        ui.disparus = e.liste; // montrée après la scène de la nouvelle époque
        sauver();
      } else if (e.type === 'demenagement') {
        ui.demenagement = { anciens: e.anciens, nouveaux: e.nouveaux }; // joué dès qu'aucune scène n'est ouverte
        sauver();
      } else if (e.type === 'rails') {
        train.etat = 'tunnel'; train.attente = 2; train.s = 0;
        if (!enScene) centrerSur(e.x, e.y);
        aideUneFois('rails', A.rails);
      } else if (e.type === 'chantier' && M.bat(monde, e.bat) && M.bat(monde, e.bat).type === 'pont-pierre') {
        aideUneFois('pont-pierre', A.pontPierre);
      } else if (e.type === 'faim') {
        aide(monde.epoque >= 7 ? A.faim7 : monde.epoque >= 6 ? A.faim6 : monde.epoque >= 5 ? A.faim5 : monde.epoque >= 4 ? A.faim4 : monde.epoque >= 3 ? A.faim3 : monde.epoque >= 2 ? A.faim2 : A.faim1);
      } else if (e.type === 'grandi') {
        var hg = monde.habitants.filter(function (q) { return q.id === e.hab; })[0];
        if (hg) bark(hg, 'J\'ai grandi !');
      } else if (e.type === 'bulle') {
        var bb = M.bat(monde, e.bat);
        aideUneFois('bulle', A.bulle);
      } else if (e.type === 'arrivee') {
        aideUneFois('arrivee', A.arrivee);
      }
    });
    var nuit = M.estNuit(monde);
    if (nuit && !etaitNuit && !enScene) {
      var aFeu = monde.batiments.some(function (b) { return b.type === 'feu' && b.etat === 'fini'; });
      if (aFeu) aideUneFois('nuit-feu', A.nuitFeu);
      else if (monde.decouvertes.feu) aide(A.nuitSansFeu);
      else if (!ui.aide['nuit1']) aideUneFois('nuit1', A.nuit1);
      else aideUneFois('nuit2', A.nuit2);
    }
    etaitNuit = nuit;
    // tout le monde dort : le coq attend que Joshua fasse lever le soleil (ADR-016)
    var coq = M.toutLeMondeDort(monde) && !enScene;
    if (coq !== !$('btn-reveil').hidden) {
      $('btn-reveil').hidden = !coq;
      if (coq) aideUneFois('reveil', A.reveil);
      // tout le village dort : la fin naturelle d'une journée (une fois par nuit)
      if (coq && ludiNuit !== (monde.jour || 0)) { ludiNuit = monde.jour || 0; ludiArret('nuit'); }
    }
    if (ui.crueAide && !enScene) { ui.crueAide = false; aideUneFois('crue', A.crue); }
    if (ui.disparus && !enScene && !demenagementEnCours && !ui.demenagement) montrerDisparus(ui.disparus);
    // la scène attend que la bulle d'aide soit libre (au chargement, d'autres messages passent d'abord)
    if (ui.demenagement && !enScene && !demenagementEnCours && T - derniereAide > 5.5) jouerDemenagement(ui.demenagement);
    if (ui.incendieAide && !enScene) { ui.incendieAide = false; aideUneFois('incendie', A.incendie); }
    if (ui.nuitNoireAide && !enScene) { ui.nuitNoireAide = false; aideUneFois('nuit-noire', A.nuitNoire); }
    if (ui.airSaleAide && !enScene) { ui.airSaleAide = false; aideUneFois('air-sale', A.airSale); }
    // la maison brûle depuis un moment, sans pompiers : on le rappelle une fois
    if (monde.incendie && !enScene && ui.incendieA != null && monde.t - ui.incendieA > 150 && !monde.batiments.some(function (b) { return b.type === 'caserne'; })) aideUneFois('incendie-encore', A.incendieEncore);
    if (!ui.aide.idee && monde.idees >= 4 && !Object.keys(monde.decouvertes).length && !enScene) {
      aideUneFois('idee', A.idee);
    }
    // les chasseurs qui s'enfoncent dans la forêt (ADR-033)
    if (!ui.aide.chasseursLoin && !enScene && monde.habitants.some(function (h) { return h.cache && h.metier === 'chasseur'; })) aideUneFois('chasseursLoin', A.chasseursLoin);
    // des maisons vides, mais pas assez à manger pour accueillir quelqu'un (ADR-032)
    if (!ui.aide.maisonsVides && !enScene && monde.t > 60 && M.lits(monde) > monde.habitants.length && !M.assezAManger(monde) && M.phase(monde) === 'jour') aideUneFois('maisonsVides', A.maisonsVides);
    if (!ui.aide.construire && monde.pieces >= 15 && monde.t > 25 && !enScene) {
      aideUneFois('construire', A.construire);
    }
  }

  // ---------- boucle ----------
  var avant = performance.now(), sauveA = 0;
  function boucle(now) {
    var dt = Math.min(0.1, (now - avant) / 1000);
    avant = now;
    T += dt;
    var simu = ludiPause ? 0 : dt * VITESSE;
    while (simu > 0) { var d = Math.min(0.1, simu); M.pas(monde, d); simu -= d; }
    traiterEvenements();
    dessiner(dt);
    majCompteurs();
    majBarre();
    if ((sauveA += dt) > 3) { sauveA = 0; sauver(); }
    requestAnimationFrame(boucle);
  }

  document.addEventListener('visibilitychange', function () { if (document.hidden) sauver(); });
  addEventListener('resize', redim);

  // pour les tests automatiques
  setTimeout(panneauBac, 500);
  window.__jeu = { musique: function () { return { piste: MUS.piste, lecteurs: MUS.lecteurs.length, joue: MUS.actif ? !MUS.actif.paused : false, vol: MUS.actif ? MUS.actif.volume : 0 }; }, montrerDisparus: function (l) { montrerDisparus(l); }, ombreDe: function (k) { try { return ombreDe(IMG[k]); } catch (e) { return String(e); } }, IMG: IMG, routesCfg: routesCfg, monde: function () { return monde; }, fleches: function () { return fleches; }, cadeaux: function () { return cadeaux; }, voitures: function () { return voitures; }, train: function () { var pts = cheminTrain(); return Object.assign({ pos: pts ? pointTrain(pts, train.s) : null }, train); }, M: M, E: E, V: V, toucher: function (x, y) { toucher(x, y); }, choisir: choisir, ouvrirDecouvertes: ouvrirDecouvertes, faireDecouverte: faireDecouverte, cinematique: cinematique, infoBatiment: infoBatiment, ouvrirPage: ouvrirPage, avion: function () { var b = aerodrome(); return b && avion.etat === "vol" ? posAvion(b) : null; }, centrerSur: centrerSur, padTir: padTir };

  chargerImages(function () {
    redim();
    $('epoque-nom').textContent = D.epoques.filter(function (x) { return x.id === monde.epoque; })[0].nom;
    // Une partie finie quand le jeu s'arrêtait au néolithique (avant l'âge des métaux) : elle garde sa marque « Fini »
    // (Ludiworld ne l'enlève jamais), et on lui annonce la suite de l'histoire.
    if (!ui.epoque3) {
      ui.epoque3 = true;
      if (!nouvellePartie && monde.epoque === 2 && M.epoqueTerminee(monde)) {
        ui.fini = true;
        setTimeout(function () { aideUneFois('metaux-arrive', A.metauxArrive); }, 1500);
      }
    }
    // De même, une partie finie quand le jeu s'arrêtait à l'âge des métaux garde « Fini » et apprend l'arrivée du Moyen Âge.
    if (!ui.epoque4) {
      ui.epoque4 = true;
      if (!nouvellePartie && monde.epoque === 3 && M.epoqueTerminee(monde)) {
        ui.fini = true;
        setTimeout(function () { aideUneFois('moyen-age-arrive', A.moyenAgeArrive); }, 1500);
      }
    }
    // Et une partie finie quand le jeu s'arrêtait au Moyen Âge garde « Fini » et apprend l'arrivée de l'âge de la vapeur.
    if (!ui.epoque5) {
      ui.epoque5 = true;
      if (!nouvellePartie && monde.epoque === 4 && M.epoqueTerminee(monde)) {
        ui.fini = true;
        setTimeout(function () { aideUneFois('vapeur-arrive', A.vapeurArrive); }, 1500);
      }
    }
    // Et une partie finie quand le jeu s'arrêtait à la vapeur garde « Fini » et apprend l'arrivée de l'électricité.
    if (!ui.epoque6) {
      ui.epoque6 = true;
      if (!nouvellePartie && monde.epoque === 5 && M.epoqueTerminee(monde)) {
        ui.fini = true;
        setTimeout(function () { aideUneFois('electricite-arrive', A.electriciteArrive); }, 1500);
      }
    }
    // Et une partie finie quand le jeu s'arrêtait à l'électricité garde « Fini » et apprend l'arrivée du monde moderne.
    if (!ui.epoque7) {
      ui.epoque7 = true;
      if (!nouvellePartie && monde.epoque === 6 && M.epoqueTerminee(monde)) {
        ui.fini = true;
        setTimeout(function () { aideUneFois('moderne-arrive', A.modernArrive); }, 1500);
      }
    }
    majFini(); // une partie déjà finie : la marque « Fini », et Ludiworld le sait
    if (nouvellePartie && !params.has('test')) montrerEpoque();
    ludiProgression();
    requestAnimationFrame(function (t) { avant = t; boucle(t); });
  });
  if (window.speechSynthesis) speechSynthesis.getVoices();
})();
