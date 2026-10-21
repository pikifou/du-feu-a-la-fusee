// Simulation du monde : pure, sans DOM, testable sous node.
// Habitants = petits agents avec une file d'étapes (ADR-010), sur une carte en tuiles (ADR-012).
var Monde = (function () {
  var D = typeof Donnees !== 'undefined' ? Donnees : require('./data.js');
  var TR = typeof Terrain !== 'undefined' ? Terrain : require('./terrain.js');

  var BULLES_MAX = 3; // unités de production stockées par bâtiment et par travailleur
  var REPAS = 3; // ce que mange chaque habitant au repas du soir (ADR-032)
  var VITESSE = { adulte: 80, enfant: 110, sage: 50 };
  var DELAI_ARRIVEE = 25;
  // Jour et nuit (ADR-011, ADR-016) : le jour, la soirée (veillée au feu), la nuit (on dort,
  // les feux sont éteints, le joueur fait lever le soleil), l'aube.
  var DUREES = { jour: 150, soir: 25, nuit: 45, aube: 4 };
  var RAYON_FEU = 520;

  // ---------- outils ----------
  function hasard(m) {
    m.graine = (m.graine + 0x6d2b79f5) | 0;
    var t = m.graine;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function choisir(m, liste) { return liste[Math.floor(hasard(m) * liste.length)]; }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function tuilePt(m, p) { var c = TR.tuileDe(p[0], p[1]); return TR.tuile(m.terrain, c[0], c[1]); }
  function centreTuile(t) { return TR.centre(t.i, t.j); }

  // une tuile libre (où l'on peut marcher) autour d'un point, dans un rayon en tuiles
  function pointLibre(m, autour, rayon, filtre) {
    var T = m.terrain, c = TR.tuileDe(autour[0], autour[1]);
    for (var essai = 0; essai < 40; essai++) {
      var di = Math.round((hasard(m) * 2 - 1) * rayon), dj = Math.round((hasard(m) * 2 - 1) * rayon);
      var t = TR.tuile(T, c[0] + di, c[1] + dj);
      if (!t || TR.bloque(T, t) || t.sol === 'eau') continue;
      if (filtre && !filtre(t)) continue;
      var p = centreTuile(t);
      return [p[0] + (hasard(m) - 0.5) * 60, p[1] + (hasard(m) - 0.5) * 26];
    }
    return autour.slice();
  }

  // ---------- création ----------
  function nouveau(graine) {
    var m = {
      t: 0, graine: graine || 12345, prochainId: 1,
      pieces: 20, idees: 0, nourriture: 20, faim: 0, epoque: 1, decouvertes: {},
      batiments: [], habitants: [], animaux: [],
      arrivee: 0, evenements: [], fini: false, repousse: 0,
      cycle: { phase: 'jour', t: 20 },
      terrain: TR.generer()
    };
    var C = [TR.CI, TR.CJ];
    var cercle = poserPres(m, 'cercle-pierres', C, true);
    var tas = poserPres(m, 'tas-bois', [C[0] - 3, C[1] + 1], true);
    var baies = poserPres(m, 'buisson-baies', [C[0] - 1, C[1] + 4], true);
    poserPres(m, 'tente', [C[0] + 1, C[1] + 3], true);
    poserPres(m, 'tente', [C[0] + 3, C[1] - 1], true);
    var sage = ajouterHabitant(m, { allure: 'sage', metier: 'sage', x: cercle.x + 40, y: cercle.y + 50 });
    affecter(m, sage, cercle);
    var b = ajouterHabitant(m, { allure: 'porteur-bois', x: tas.x + 50, y: tas.y + 30 });
    affecter(m, b, tas);
    var c = ajouterHabitant(m, { allure: 'cueilleuse', x: cercle.x - 80, y: cercle.y + 70 });
    affecter(m, c, baies);
    // quelques mammouths sur l'autre rive : une fois chassés, ils ne reviennent pas
    [[5, -8], [8, -5], [3, -11]].forEach(function (o) {
      var zm = pointLibre(m, TR.centre(TR.CI + o[0], TR.CJ + o[1]), 3, function (t) { return t.sauvage && t.sol === 'herbe'; });
      m.animaux.push({ id: m.prochainId++, espece: 'mammouth', x: zm[0], y: zm[1], etapes: [], dir: -1, marche: false });
    });
    m.prochainLapin = 5;
    m.evenements.push({ type: 'epoque', epoque: 1 });
    return m;
  }

  function poser(m, type, i, j, fini) {
    var def = D.batiments[type], k = def.taille || 1, T = m.terrain;
    var c = TR.centreEmpreinte(i, j, k);
    var bat = {
      id: m.prochainId++, type: type, i: i, j: j, k: k, x: c[0], y: c[1],
      etat: fini ? 'fini' : 'chantier', livre: 0, besoin: def.bois || 0, enRoute: 0,
      stock: 0, ouvriers: [], apparu: fini ? -10 : null, cree: m.t
    };
    if (type !== 'passerelle') {
      (TR.empreinte(T, i, j, k) || []).forEach(function (t) { t.bat = bat.id; t.deco = null; if (t.obj === 'souche') t.obj = null; t.usure = 0; });
    }
    m.batiments.push(bat);
    return bat;
  }
  function poserPres(m, type, ij, fini) {
    var l = emplacementsLibres(m, type, ij);
    var a = l[0] || ij;
    return poser(m, type, a[0], a[1], fini);
  }

  function ajouterHabitant(m, o) {
    var enfant = !!o.enfant;
    var h = {
      id: m.prochainId++, allure: o.allure, enfant: enfant, metier: o.metier || null, travail: null,
      x: o.x, y: o.y, etapes: [], porte: null, dir: 1, marche: false, anim: 'repos',
      vitesse: o.allure === 'sage' ? VITESSE.sage : (enfant ? VITESSE.enfant : VITESSE.adulte),
      pouf: 0, reserve: null, ne: m.t
    };
    m.habitants.push(h);
    return h;
  }

  function affecter(m, h, bat) {
    var def = D.batiments[bat.type];
    h.travail = bat.id;
    h.metier = def.travail.metier;
    if (!bat.ouvriers) bat.ouvriers = [];
    if (bat.ouvriers.indexOf(h.id) < 0) bat.ouvriers.push(h.id);
    var allure = D.allures[m.epoque][h.metier];
    if (allure && allure !== h.allure && h.allure !== 'sage') { h.allure = allure; h.pouf = 0.6; }
  }

  // ---------- requêtes ----------
  function bat(m, id) { for (var i = 0; i < m.batiments.length; i++) if (m.batiments[i].id === id) return m.batiments[i]; return null; }
  function lits(m) {
    return m.batiments.reduce(function (s, b) {
      var d = D.batiments[b.type];
      return s + (b.etat === 'fini' ? (d.lits || 0) : (b.renove || 0));
    }, 0);
  }
  // un travailleur par niveau (ADR-031)
  function places(b) { return D.batiments[b.type].travail ? (b.niveau || 1) : 0; }
  function stockMax(b) { return BULLES_MAX * (b.niveau || 1); }
  function aFeu(m) { return m.batiments.some(function (b) { return b.type === 'feu' && b.etat === 'fini'; }); }

  function construisibles(m) {
    return Object.keys(D.batiments).filter(function (k) {
      var d = D.batiments[k];
      if (d.cout == null || d.automatique) return false;
      if (d.epoque > m.epoque || (d.jusqua || 9) < m.epoque) return false;
      if (d.debloque && !m.decouvertes[d.debloque]) return false;
      return true;
    });
  }

  // une ancre (coin de l'empreinte) est valide si toutes ses tuiles conviennent au bâtiment
  function ancreValide(m, type, i, j) {
    var d = D.batiments[type], k = d.taille || 1, T = m.terrain;
    var tuiles = TR.empreinte(T, i, j, k);
    if (!tuiles) return false;
    for (var n = 0; n < tuiles.length; n++) {
      var t = tuiles[n];
      if (!TR.surIle(T, t) || t.bat || t.gue) return false;
      if (t.obj && t.obj !== 'souche') return false;
      if (d.zone === 'plage') { if (t.sol !== 'sable') return false; }
      else if (d.zone === 'grotte') { if (t.sol !== 'herbe' && t.sol !== 'roche') return false; }
      else if (t.sol !== 'herbe') return false;
      // l'autre rive est le territoire du mammouth : on n'y construit qu'au néolithique (sauf près de la grotte)
      if (t.sauvage && m.epoque < 2 && d.zone !== 'grotte') return false;
    }
    // un peu d'espace autour de chaque bâtiment, pour qu'on puisse passer (ADR-014)
    for (var a = -1; a <= k; a++) for (var b2 = -1; b2 <= k; b2++) {
      if (a >= 0 && a < k && b2 >= 0 && b2 < k) continue;
      var v = TR.tuile(T, i + a, j + b2);
      if (v && v.bat) { var vb = bat(m, v.bat); if (vb && vb.type !== 'passerelle') return false; }
    }
    var t0 = tuiles[0];
    if (d.zone === 'rive' || d.zone === 'plage') return tuiles.some(function (t) { return TR.pres(T, t, 'eau'); });
    if (d.zone === 'grotte') {
      var g = T.grotte;
      return g && Math.hypot(t0.i - g[0], t0.j - g[1]) <= 4.5;
    }
    return true;
  }

  // toutes les ancres valides, de la plus proche du centre (ou d'un point) à la plus lointaine
  function emplacementsLibres(m, type, pres) {
    var T = m.terrain, l = [];
    var c = pres || [TR.CI, TR.CJ];
    for (var i = 0; i < T.N; i++) for (var j = 0; j < T.N; j++) if (ancreValide(m, type, i, j)) l.push([i, j]);
    l.sort(function (a, b) { return Math.hypot(a[0] - c[0], a[1] - c[1]) - Math.hypot(b[0] - c[0], b[1] - c[1]); });
    return l;
  }

  // l'ancre à utiliser quand on touche la tuile (i, j) : on essaie de centrer le bâtiment dessus
  function ancrePour(m, type, i, j) {
    var k = D.batiments[type].taille || 1;
    var essais = k === 1 ? [[0, 0]] : [[-1, -1], [0, -1], [-1, 0], [0, 0]];
    if (k === 2) essais = [[0, 0], [-1, 0], [0, -1], [-1, -1]];
    for (var n = 0; n < essais.length; n++) {
      var a = i + essais[n][0], b = j + essais[n][1];
      if (ancreValide(m, type, a, b)) return [a, b];
    }
    return null;
  }

  function peutConstruire(m, type) {
    var d = D.batiments[type];
    if (construisibles(m).indexOf(type) < 0 || m.pieces < d.cout) return false;
    if (d.unique && m.batiments.some(function (b) { return b.type === type; })) return false;
    return aDeLaPlace(m, type);
  }
  function aDeLaPlace(m, type) {
    var T = m.terrain;
    for (var i = 0; i < T.N; i++) for (var j = 0; j < T.N; j++) if (ancreValide(m, type, i, j)) return true;
    return false;
  }

  function construire(m, type, ancre) {
    if (!peutConstruire(m, type)) return null;
    if (!ancre || !ancreValide(m, type, ancre[0], ancre[1])) return null;
    m.pieces -= D.batiments[type].cout;
    var b = poser(m, type, ancre[0], ancre[1], false);
    if (D.batiments[type].merveille) { b.etape = 0; b.etapeVisee = 1; } // ADR-030 : une merveille se bâtit en 3 étapes
    m.evenements.push({ type: 'chantier', bat: b.id });
    return b;
  }

  function decouvertesEpoque(m, e) {
    return Object.keys(D.decouvertes).filter(function (k) { return D.decouvertes[k].epoque === (e || m.epoque); });
  }
  function etatDecouverte(m, id) {
    var d = D.decouvertes[id];
    if (m.decouvertes[id]) return 'faite';
    if (d.epoque > m.epoque) return 'future';
    if (!d.prerequis.every(function (p) { return m.decouvertes[p]; })) return 'bloquee';
    return m.idees >= d.idees ? 'possible' : 'attente';
  }
  function decouvrir(m, id) {
    if (etatDecouverte(m, id) !== 'possible') return false;
    m.idees -= D.decouvertes[id].idees;
    m.decouvertes[id] = m.t;
    m.evenements.push({ type: 'decouverte', id: id });
    if (epoqueTerminee(m)) m.evenements.push({ type: 'fin-epoque', epoque: m.epoque });
    return true;
  }
  function epoqueTerminee(m) {
    return decouvertesEpoque(m).every(function (k) { return m.decouvertes[k]; });
  }

  function passerEpoque(m) {
    if (!epoqueTerminee(m)) return false;
    var suivante = D.epoques.filter(function (e) { return e.id === m.epoque + 1; })[0];
    if (!suivante) { m.fini = true; m.evenements.push({ type: 'fin-jeu' }); return false; }
    m.epoque = suivante.id;
    m.terrain.epoque = m.epoque; // l'île s'agrandit
    m.terrain.agrandi = m.t;
    // pas d'amélioration automatique (ADR-028) ; fin du nomadisme : ce qui attendait d'être ramassé est mis en commun (ADR-029)
    m.batiments.forEach(function (b) { recolter(m, b.id); });
    if (m.epoque === 2 && m.terrain.gue) {
      var g = m.terrain.gue;
      var pass = poser(m, 'passerelle', g[0], g[1], false);
      pass.automatique = true;
      m.animaux.forEach(function (a) { if (a.espece === 'mammouth') { a.part = true; a.etapes = [TR.centre(TR.CI + 12, TR.CJ - 14)]; } });
      for (var i = 0; i < 2; i++) {
        var p = pointLibre(m, TR.centre(TR.CI - 3, TR.CJ + 4), 3);
        m.animaux.push({ id: m.prochainId++, espece: 'chevre', x: p[0], y: p[1], etapes: [], dir: 1, marche: false });
      }
    }
    m.habitants.forEach(function (h) { h.changeTenue = hasard(m) * 8; });
    m.evenements.push({ type: 'epoque', epoque: m.epoque });
    return true;
  }

  // ---------- améliorations payantes (ADR-021) ----------
  var NIVEAU_MAX = 3;
  // ce qu'on peut faire de mieux avec un bâtiment : l'agrandir (maison), monter de niveau, ou bâtir l'étape suivante d'une merveille
  function amelioration(m, b) {
    if (!b || b.etat !== 'fini') return null;
    var d = D.batiments[b.type];
    if (d.merveille) {
      var et = b.etape == null ? 3 : b.etape;
      return et < 3 ? { genre: 'etape', etape: et + 1, cout: d.cout } : null;
    }
    if (d.evolue) {
      var evs = [].concat(d.evolue);
      for (var i = evs.length - 1; i >= 0; i--) {
        var ev = evs[i], cible = D.batiments[ev.vers];
        if ((!ev.decouverte || m.decouvertes[ev.decouverte]) && cible.epoque <= m.epoque && (cible.jusqua || 9) >= m.epoque)
          return { genre: 'maison', vers: ev.vers, cout: ev.cout };
      }
      return null;
    }
    var n = b.niveau || 1;
    if (d.travail && n < NIVEAU_MAX && !inactif(m, b)) {
      var base = d.prixNiveau || d.cout || 10;
      return { genre: 'niveau', niveau: n + 1, cout: Math.round(base * (n === 1 ? 1.5 : 3) / 5) * 5 };
    }
    return null;
  }
  function ameliorer(m, id) {
    var b = bat(m, id), a = amelioration(m, b);
    if (!a || m.pieces < a.cout) return null;
    m.pieces -= a.cout;
    if (a.genre === 'maison') {
      b.renove = D.batiments[b.type].lits || 0;
      b.ancien = b.type;
      b.type = a.vers;
      b.besoin = D.batiments[a.vers].bois;
    } else if (a.genre === 'etape') {
      b.etapeVisee = a.etape;
      b.besoin = D.batiments[b.type].bois;
    } else {
      b.niveauVise = a.niveau;
      b.besoin = 1 + a.niveau;
    }
    b.etat = 'chantier'; b.livre = 0; b.enRoute = 0; b.cree = m.t;
    m.evenements.push({ type: 'chantier', bat: b.id });
    return a;
  }
  // ce que rapporte une tournée ; certains outils s'améliorent au néolithique (la hache polie)
  function qteDe(tr, epoque) { return typeof tr.qte === 'object' ? (tr.qte[epoque] || tr.qte[1]) : tr.qte; }
  function quantite(b, m) { return qteDe(D.batiments[b.type].travail, m ? m.epoque : 1); }
  function merveilleFinie(b) { return !D.batiments[b.type].merveille || (b.etape == null ? 3 : b.etape) >= 3; }

  function recolter(m, id) {
    var b = bat(m, id);
    if (!b || b.stock <= 0) return null;
    var tr = D.batiments[b.type].travail;
    var n = b.stock * quantite(b, m);
    b.stock = 0;
    ajouter(m, tr.produit, n);
    return { produit: tr.produit, n: n };
  }

  // ---------- jour et nuit (ADR-011, ADR-016) ----------
  function phase(m) { return m.cycle.phase; }
  function obscurite(m) {
    var c = m.cycle;
    if (c.phase === 'jour') return c.t > DUREES.jour - 5 ? (c.t - (DUREES.jour - 5)) / 5 * 0.4 : 0;
    if (c.phase === 'soir') return Math.min(1, 0.4 + c.t / 5 * 0.6);
    if (c.phase === 'nuit') return 1;
    return Math.max(0, 1 - c.t / DUREES.aube);
  }
  function estNuit(m) { return m.cycle.phase === 'nuit' || (m.cycle.phase === 'soir' && m.cycle.t >= 1.5); }
  // compatibilité avec l'interface : une heure de 0 à 1
  function heure(m) {
    var c = m.cycle, total = DUREES.jour + DUREES.soir + DUREES.nuit + DUREES.aube;
    var avant = { jour: 0, soir: DUREES.jour, nuit: DUREES.jour + DUREES.soir, aube: DUREES.jour + DUREES.soir + DUREES.nuit }[c.phase];
    return (avant + c.t) / total;
  }
  function changerPhase(m, ph) {
    m.cycle = { phase: ph, t: 0 };
    if (ph === 'aube') m.jour = (m.jour || 0) + 1;
    m.evenements.push({ type: 'phase', phase: ph });
    if (ph === 'soir') manger(m);
    if (ph === 'nuit') {
      // les feux s'éteignent : tout le monde va se coucher
      m.habitants.forEach(function (h) { lacher(m, h); });
    }
  }
  // la réserve de nourriture : ce qu'on sait conserver (ADR-036)
  var RESERVE = { base: 30, 'sechoir-poissons': 20, grenier: 60, 'atelier-potier': 30 };
  function reserveMax(m) {
    return m.batiments.reduce(function (s, b) { return s + (b.etat === 'fini' || b.niveau ? (RESERVE[b.type] || 0) : 0); }, RESERVE.base);
  }
  function ajouter(m, produit, n) {
    if (produit !== 'nourriture') { m[produit] = (m[produit] || 0) + n; return n; }
    var max = reserveMax(m), avant = m.nourriture;
    m.nourriture = Math.min(max, m.nourriture + n);
    if (avant + n > max) m.evenements.push({ type: 'perdu', n: avant + n - max });
    return m.nourriture - avant;
  }
  // le repas du soir : chacun mange ; s'il n'y a pas assez, le village ne grandit plus (ADR-032)
  function besoinRepas(m, n) { return (n == null ? m.habitants.length : n) * REPAS; }
  function manger(m) {
    var n = m.habitants.length, nourris = Math.min(n, Math.floor(m.nourriture / REPAS));
    m.nourriture -= nourris * REPAS;
    m.faim = n - nourris;
    var affames = m.habitants.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, m.faim).map(function (h) { return h.id; });
    m.habitants.forEach(function (h) { h.faim = affames.indexOf(h.id) >= 0; });
    m.evenements.push({ type: m.faim ? 'faim' : 'repas', n: nourris * REPAS, affames: m.faim });
  }
  function lacher(m, h) {
    h.cache = false;
    m.animaux.forEach(function (a) { if (a.chasse === h.id) { a.chasse = null; a.fuit = null; if (a.disparu) a.parti = true; } });
    if (h.reserve) { var c = bat(m, h.reserve); if (c) c.enRoute = Math.max(0, c.enRoute - 1); h.reserve = null; }
    h.etapes.forEach(function (e) { if (e.fait === 'couper') { var t = TR.tuile(m.terrain, e.i, e.j); if (t) t.reserve = false; } });
    h.etapes = []; h.porte = null;
  }
  function avancerCycle(m, dt) {
    var c = m.cycle;
    c.t += dt;
    if (c.phase === 'jour' && c.t >= DUREES.jour) changerPhase(m, 'soir');
    else if (c.phase === 'soir' && c.t >= DUREES.soir) changerPhase(m, 'nuit');
    else if (c.phase === 'nuit' && c.t >= DUREES.nuit) changerPhase(m, 'aube');
    else if (c.phase === 'aube' && c.t >= DUREES.aube) changerPhase(m, 'jour');
  }
  // tout le monde dort : le joueur peut faire lever le soleil
  function toutLeMondeDort(m) {
    return estNuit(m) && m.habitants.length > 0 && m.habitants.every(function (h) { return h.dort; });
  }
  function reveiller(m) {
    if (!estNuit(m)) return false;
    changerPhase(m, 'aube');
    return true;
  }
  function feux(m) { return m.batiments.filter(function (b) { return b.type === 'feu' && b.etat === 'fini'; }); }
  function eclaire(m, p) {
    if (m.cycle.phase === 'nuit') return false; // les feux sont éteints
    return feux(m).some(function (f) { return Math.hypot(p[0] - f.x, (p[1] - f.y) / 0.6) < RAYON_FEU; });
  }
  function feuProche(m, p) {
    var best = null, bd = 1e9;
    feux(m).forEach(function (f) { var d = dist(p, [f.x, f.y]); if (d < bd) { bd = d; best = f; } });
    return best;
  }
  function maisonProche(m, p) {
    var best = null, bd = 1e9;
    m.batiments.forEach(function (b) {
      if (!D.batiments[b.type].lits && b.type !== 'cercle-pierres') return;
      var d = dist(p, [b.x, b.y]); if (d < bd) { bd = d; best = b; }
    });
    return best;
  }

  // ---------- comportement des habitants ----------
  // devant un bâtiment : la tuile libre la plus proche de son bord avant
  function devant(m, b) {
    var p = [b.x, b.y + b.k * TR.TH * 0.9];
    var t = tuilePt(m, p);
    if (t && !TR.bloque(m.terrain, t)) return [p[0] + 8, p[1]];
    return pointLibre(m, p, 2);
  }
  function arbreProche(m, p) {
    var T = m.terrain, best = null, bd = 1e9;
    T.tuiles.forEach(function (t) {
      if (t.obj !== 'arbre' || !TR.surIle(T, t) || t.reserve) return;
      var q = centreTuile(t), d = dist(p, q);
      if (d < bd) { bd = d; best = t; }
    });
    return best;
  }
  function rive(m, p, mer) {
    var T = m.terrain, best = null, bd = 1e9;
    T.tuiles.forEach(function (t) {
      if (!TR.surIle(T, t) || TR.bloque(T, t) || t.sol === 'eau') return;
      if (!TR.pres(T, t, 'eau')) return;
      if (mer && t.sol !== 'sable') return;
      var q = centreTuile(t), d = dist(p, q) + hasard(m) * 120;
      if (d < bd) { bd = d; best = t; }
    });
    return best ? centreTuile(best) : p;
  }

  // là où l'on rapporte ce qu'on a produit, une fois sédentaires (ADR-029) : la place du village,
  // ou le grenier le plus proche pour la nourriture
  function depot(m, produit, p) {
    var l = m.batiments.filter(function (b) {
      return b.etat === 'fini' && (b.type === 'cercle-pierres' || (produit === 'nourriture' && b.type === 'grenier'));
    });
    var best = null, bd = 1e9;
    l.forEach(function (b) { var d = dist(p, [b.x, b.y]); if (d < bd) { bd = d; best = b; } });
    return best;
  }
  // la lisière de la forêt où les chasseurs disparaissent (ADR-033) : loin du village, contre les arbres
  function lisiere(m, p) {
    var T = m.terrain, l = [];
    T.tuiles.forEach(function (t) {
      if (!TR.surIle(T, t) || TR.bloque(T, t) || t.sol !== 'herbe' || t.bat) return;
      var n = 0;
      for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) { var v = TR.tuile(T, t.i + di, t.j + dj); if (v && v.obj === 'arbre') n++; }
      if (n < 4) return;
      var q = centreTuile(t), d = dist(p, q);
      if (d > 700) l.push({ t: t, d: d });
    });
    if (!l.length) return null;
    l.sort(function (a, b) { return a.d - b.d; });
    var t = l[Math.min(l.length - 1, Math.floor(hasard(m) * Math.min(8, l.length)))].t;
    // le point de fuite : on s'enfonce un peu vers les arbres
    var q = centreTuile(t), ax = 0, ay = 0;
    for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) { var v = TR.tuile(T, t.i + di, t.j + dj); if (v && v.obj === 'arbre') { var c = centreTuile(v); ax += c[0] - q[0]; ay += c[1] - q[1]; } }
    var k = Math.hypot(ax, ay) || 1;
    return { p: q, loin: [q[0] + ax / k * 40, q[1] + ay / k * 20] };
  }

  var LOT = 3; // au néolithique, on travaille trois fois avant d'aller livrer au village
  function planTravail(m, h, b, nomade) {
    var tr = D.batiments[b.type].travail;
    // sédentaires : quelques tournées de travail, puis une seule livraison groupée (ADR-029)
    if (!nomade && m.epoque >= 2 && tr.aller !== 'gibier') {
      var dp = depot(m, tr.produit, [b.x, b.y]);
      if (dp && dp.id !== b.id) {
        var lot = [];
        for (var k = 0; k < LOT; k++) lot = lot.concat(planTravail(m, h, b, true).filter(function (e) { return e.fait !== 'produire'; }));
        var obj = tr.livre || tr.porte;
        if (obj) lot.push({ fait: 'prendre', objet: obj });
        lot.push({ fait: 'aller', p: pointLibre(m, devant(m, dp), 1) });
        lot.push({ fait: 'attendre', d: 0.5, anim: 'repos' });
        lot.push({ fait: 'deposer' });
        lot.push({ fait: 'rapporter', bat: b.id, fois: LOT });
        return lot;
      }
    }
    var et = [], lieu = null, arbre = null, objet = tr.porte || null;
    var pose = (D.poses[m.epoque] || {})[tr.metier] || null; // ADR-017 : on voit ce qu'il fait
    var depuis = [b.x, b.y];
    var proie = null, foret = null, fois = 1;
    if (tr.aller === 'gibier') {
      // la chasse : un mammouth de temps en temps, sinon on part au loin dans la forêt (ADR-033),
      // en suivant un lapin s'il y en a un
      proie = gibierProche(m, depuis);
      if (!proie || proie.espece === 'lapin') foret = lisiere(m, depuis);
      if (!proie && !foret) return [{ fait: 'aller', p: pointLibre(m, devant(m, b), 1) }, { fait: 'attendre', d: 4, anim: 'repos' }];
      if (proie) { proie.chasse = h.id; proie.etapes = []; proie.marche = false; }
      if (proie && proie.espece === 'mammouth') {
        lieu = [proie.x + -110 * (hasard(m) < 0.5 ? 1 : -1), proie.y + 30];
        fois = 3;
      } else {
        if (proie) { proie.fuit = foret.loin.slice(); objet = 'lapin'; }
        et.push({ fait: 'aller', p: proie ? [proie.x - 30, proie.y + 8] : foret.p });
        if (proie) et.push({ fait: 'aller', p: foret.p });
        et.push({ fait: 'aller', p: foret.loin });
        et.push({ fait: 'disparaitre', d: tr.duree + 6 + hasard(m) * 6 });
        if (proie) et.push({ fait: 'chasser', animal: proie.id, loin: true });
        et.push({ fait: 'prendre', objet: objet });
        et.push({ fait: 'aller', p: foret.p });
      }
    } else if (tr.aller === 'foret') {
      arbre = arbreProche(m, depuis);
      if (arbre) { var q = centreTuile(arbre); lieu = [q[0] + 30, q[1] + 22]; }
      // sans outils de pierre, pas de hache : on ramasse les branches tombées, l'arbre reste debout
      if (!m.decouvertes.outils) { arbre = null; pose = null; }
      else if (arbre) arbre.reserve = true;
    } else if (tr.aller === 'riviere') {
      lieu = rive(m, depuis, false);
    } else if (tr.aller === 'plage') {
      lieu = rive(m, depuis, true);
    } else if (tr.aller === 'grotte') {
      var g = m.terrain.grotte;
      lieu = g ? TR.centre(g[0] + 1, g[1] + 1) : null;
    } else if (tr.aller === 'champ') {
      var champs = m.batiments.filter(function (c) { return c.type === 'champ-ble' && c.etat === 'fini'; });
      if (champs.length) { var c = choisir(m, champs); lieu = [c.x + (hasard(m) - 0.5) * 120, c.y + (hasard(m) - 0.5) * 40]; }
    }
    var sedentaire = m.epoque >= 2 && !nomade; // fin du nomadisme : on rapporte soi-même au village (ADR-029)
    var dep = sedentaire ? depot(m, tr.produit, depuis) : null;
    var sur = dep && dep.id === b.id; // le sage est déjà sur la place
    if (lieu) {
      et.push({ fait: 'aller', p: lieu });
      et.push({ fait: 'attendre', d: fois > 1 ? tr.duree * 2 : tr.duree, anim: 'travail', pose: pose });
      if (arbre) et.push({ fait: 'couper', i: arbre.i, j: arbre.j });
      if (proie) et.push({ fait: 'chasser', animal: proie.id });
      et.push({ fait: 'prendre', objet: objet });
      if (dep && tr.livre) {
        // on rapporte la matière à l'atelier, on la travaille, puis on livre l'objet fini au village
        et.push({ fait: 'aller', p: devant(m, b) });
        et.push({ fait: 'deposer' });
        et.push({ fait: 'attendre', d: 2, anim: 'travail', pose: pose });
        et.push({ fait: 'prendre', objet: tr.livre });
      }
    } else if (!foret) {
      var dedans = b.type === 'cercle-pierres'; // le sage s'assoit au milieu du cercle
      var p = b.type === 'champ-ble' || b.type === 'enclos-moutons'
        ? [b.x + (hasard(m) - 0.5) * 120, b.y + (hasard(m) - 0.5) * 40] : dedans ? [b.x, b.y] : devant(m, b);
      et.push({ fait: 'aller', p: p });
      et.push({ fait: 'attendre', d: tr.duree, anim: 'travail', pose: pose, dans: dedans ? b.id : null });
      if (dep && !sur && (tr.livre || objet)) et.push({ fait: 'prendre', objet: tr.livre || objet });
    }
    if (dep) {
      if (!sur) {
        et.push({ fait: 'aller', p: pointLibre(m, devant(m, dep), 1) });
        et.push({ fait: 'attendre', d: 0.5, anim: 'repos' });
      }
      et.push({ fait: 'deposer' });
      et.push({ fait: 'rapporter', bat: b.id, fois: fois });
      return et;
    }
    if (lieu || foret) {
      et.push({ fait: 'aller', p: devant(m, b) });
      et.push({ fait: 'attendre', d: 0.6, anim: 'repos' });
      et.push({ fait: 'deposer' });
    }
    for (var k = 0; k < fois; k++) et.push({ fait: 'produire', bat: b.id });
    return et;
  }
  // le gibier : de temps en temps un mammouth (il ne reviendra pas), sinon le lapin le plus proche
  function gibierProche(m, p) {
    var libres = m.animaux.filter(function (a) { return (a.espece === 'lapin' || a.espece === 'mammouth') && !a.part && !a.chasse && !a.parti; });
    var dist = function (a) { return Math.hypot(a.x - p[0], a.y - p[1]); };
    var mams = libres.filter(function (a) { return a.espece === 'mammouth'; });
    var laps = libres.filter(function (a) { return a.espece === 'lapin'; }).sort(function (a, b) { return dist(a) - dist(b); });
    if (mams.length && hasard(m) < 0.2) return mams[0];
    return laps[0] || null;
  }
  // un bâtiment qui ne sert plus (la chasse après l'élevage)
  function inactif(m, b) { var f = D.batiments[b.type].finitAvec; return !!(f && m.decouvertes[f]); }

  function chantierEnAttente(m) {
    var c = m.batiments.filter(function (b) { return b.etat === 'chantier' && b.livre + b.enRoute < b.besoin; });
    if (!c.length) return null;
    c.sort(function (a, b) { return a.cree - b.cree; });
    return c[0];
  }
  function planChantier(m, h, b) {
    var tas = m.batiments.filter(function (t) { return t.type === 'tas-bois' && t.etat === 'fini'; })[0];
    b.enRoute++;
    h.reserve = b.id;
    var et = [];
    if (tas) {
      et.push({ fait: 'aller', p: devant(m, tas) });
      et.push({ fait: 'attendre', d: 1, anim: 'travail' });
    }
    et.push({ fait: 'prendre', objet: 'bois' });
    var autour = b.type === 'passerelle' ? TR.centre(m.terrain.gues[0][0], m.terrain.gues[0][1]) : [b.x, b.y];
    et.push({ fait: 'aller', p: b.type === 'passerelle' ? autour : [b.x + (hasard(m) - 0.5) * 120, b.y + b.k * 26 + hasard(m) * 20] });
    et.push({ fait: 'deposer' });
    et.push({ fait: 'attendre', d: 2.2, anim: 'marteau' });
    et.push({ fait: 'livrer', bat: b.id });
    return et;
  }

  function lieuDeRepos(m) {
    var f = feux(m)[0];
    var cercle = m.batiments.filter(function (b) { return b.type === 'cercle-pierres'; })[0];
    var c = f || cercle;
    return c ? [c.x, c.y + 60] : TR.centre(TR.CI, TR.CJ);
  }
  function adultesLibres(m) {
    return m.habitants.filter(function (h) { return !h.enfant && !h.travail && !h.reserve; });
  }

  // chaque habitant a sa maison (ADR-017)
  function attribuerMaisons(m) {
    var occupants = {};
    m.habitants.forEach(function (h) {
      var b = h.maison ? bat(m, h.maison) : null;
      var cap = b ? (b.etat === 'fini' ? (D.batiments[b.type].lits || 0) : (b.renove || 0)) : 0;
      if (!b || cap <= 0) { h.maison = null; return; }
      occupants[b.id] = (occupants[b.id] || 0) + 1;
    });
    m.habitants.forEach(function (h) {
      if (h.maison) return;
      var best = null, bd = 1e9;
      m.batiments.forEach(function (b) {
        var cap = b.etat === 'fini' ? (D.batiments[b.type].lits || 0) : (b.renove || 0);
        if (cap <= (occupants[b.id] || 0)) return;
        var d = dist([h.x, h.y], [b.x, b.y]); if (d < bd) { bd = d; best = b; }
      });
      if (best) { h.maison = best.id; occupants[best.id] = (occupants[best.id] || 0) + 1; }
    });
  }
  function planNuit(m, h) {
    var f = m.cycle.phase === 'soir' ? feuProche(m, [h.x, h.y]) : null;
    if (f) {
      if (!h.enfant && f.ravive !== m.jour) {
        // le premier adulte arrivé ranime le feu pour la veillée
        f.ravive = m.jour;
        h.etapes = [{ fait: 'aller', p: [f.x - 34, f.y + 14] }, { fait: 'attendre', d: 3, anim: 'travail', pose: 'allume-feu' }];
        return;
      }
      h.etapes = [{ fait: 'aller', p: pointLibre(m, [f.x, f.y], 1.5) }, { fait: 'attendre', d: 3 + hasard(m) * 4, anim: h.enfant ? 'jeu' : 'repos' }];
      return;
    }
    var mai = (h.maison && bat(m, h.maison)) || maisonProche(m, [h.x, h.y]);
    h.etapes = [{ fait: 'aller', p: mai ? devant(m, mai) : [h.x, h.y] }, { fait: 'dormir', maison: mai ? mai.id : null }];
  }

  function decider(m, h) {
    var b = h.travail ? bat(m, h.travail) : null;
    if (b && inactif(m, b)) { b.ouvriers = (b.ouvriers || []).filter(function (id) { return id !== h.id; }); h.travail = null; h.metier = null; b = null; }
    if (m.cycle.phase === 'nuit') { planNuit(m, h); return; }
    if (estNuit(m)) {
      // pendant la veillée, on ne travaille que dans la lumière d'un feu (ADR-011, ADR-016)
      var ch0 = chantierEnAttente(m);
      var tas = m.batiments.filter(function (t) { return t.type === 'tas-bois' && t.etat === 'fini'; })[0];
      if (!h.enfant && !b && ch0 && eclaire(m, [ch0.x, ch0.y]) && (!tas || eclaire(m, [tas.x, tas.y]))) { h.etapes = planChantier(m, h, ch0); return; }
      if (!h.enfant && b && b.etat === 'fini' && b.stock < stockMax(b) && eclaire(m, [b.x, b.y])) {
        var plan = planTravail(m, h, b);
        var dehors = plan.filter(function (e) { return e.fait === 'aller' && !eclaire(m, e.p); }).length;
        if (!dehors) { h.etapes = plan; return; }
        plan.forEach(function (e) { if (e.fait === 'couper') { var t = TR.tuile(m.terrain, e.i, e.j); if (t) t.reserve = false; } });
      }
      planNuit(m, h);
      return;
    }
    if (h.enfant) {
      h.etapes = [{ fait: 'aller', p: pointLibre(m, lieuDeRepos(m), 4) }, { fait: 'attendre', d: 0.5 + hasard(m) * 2, anim: 'jeu' }];
      return;
    }
    var ch = chantierEnAttente(m);
    if (!b && ch) { h.etapes = planChantier(m, h, ch); return; }
    if (b && b.etat === 'fini') {
      if (ch && h.metier !== 'sage' && adultesLibres(m).length === 0 && hasard(m) < 0.5) { h.etapes = planChantier(m, h, ch); return; }
      if (b.stock >= stockMax(b)) {
        h.etapes = [{ fait: 'aller', p: pointLibre(m, devant(m, b), 1) }, { fait: 'attendre', d: 3, anim: 'repos' }];
        return;
      }
      h.etapes = planTravail(m, h, b);
      return;
    }
    var q = hasard(m) < 0.3 ? pointLibre(m, TR.centre(TR.CI, TR.CJ), 6) : pointLibre(m, lieuDeRepos(m), 2.5);
    h.etapes = [{ fait: 'aller', p: q }, { fait: 'attendre', d: 2 + hasard(m) * 4, anim: 'repos' }];
  }

  function avancer(m, h, dt) {
    if (h.pouf > 0) h.pouf = Math.max(0, h.pouf - dt);
    if (h.changeTenue != null) {
      h.changeTenue -= dt;
      if (h.changeTenue <= 0) {
        h.changeTenue = null;
        var al = D.allures[m.epoque];
        var nouvelle = h.allure === 'sage' ? 'sage' : h.enfant ? al.enfant : (h.metier && al[h.metier]) || choisir(m, al.adulte);
        if (nouvelle !== h.allure) { h.allure = nouvelle; h.pouf = 0.6; }
      }
    }
    var reste = dt, garde = 0;
    while (reste > 0 && garde++ < 20) {
      if (!h.etapes.length) { decider(m, h); if (!h.etapes.length) return; }
      var e = h.etapes[0];
      if (e.fait === 'aller') {
        if (!e.route) e.route = TR.chemin(m.terrain, [h.x, h.y], e.p);
        var cible = e.route[0];
        var dx = cible[0] - h.x, dy = cible[1] - h.y, d = Math.hypot(dx, dy);
        var pas = h.vitesse * reste;
        h.marche = true; h.anim = 'marche'; h.pose = null; h.dans = null;
        if (Math.abs(dx) > 2) h.dir = dx > 0 ? 1 : -1;
        TR.user(m.terrain, h.x, h.y, Math.min(reste, d / h.vitesse)); // l'herbe s'use sous les pas (ADR-013)
        if (d <= pas) {
          h.x = cible[0]; h.y = cible[1];
          reste -= d / h.vitesse;
          e.route.shift();
          if (!e.route.length) h.etapes.shift();
        } else {
          h.x += dx / d * pas; h.y += dy / d * pas; reste = 0;
        }
      } else if (e.fait === 'disparaitre') {
        // le chasseur s'enfonce dans la forêt : on ne le voit plus un moment (ADR-033)
        h.marche = false; h.cache = true; h.anim = 'repos';
        if (e.reste == null) e.reste = e.d;
        if (e.reste > reste) { e.reste -= reste; reste = 0; } else { reste -= e.reste; h.cache = false; h.etapes.shift(); }
      } else if (e.fait === 'dormir') {
        h.marche = false;
        if (estNuit(m)) { h.dort = true; h.dortChez = e.maison; h.anim = 'dort'; reste = 0; }
        else { h.dort = false; h.dortChez = null; h.etapes.shift(); }
      } else if (e.fait === 'attendre') {
        h.marche = false;
        h.anim = e.anim || 'repos';
        h.pose = e.pose || null;
        h.dans = e.dans || null;
        if (e.reste == null) e.reste = e.d;
        if (e.reste > reste) { e.reste -= reste; reste = 0; } else { reste -= e.reste; h.etapes.shift(); }
      } else {
        h.marche = false;
        if (e.fait === 'prendre') h.porte = e.objet;
        else if (e.fait === 'deposer') h.porte = null;
        else if (e.fait === 'couper') {
          var t = TR.tuile(m.terrain, e.i, e.j);
          if (t && t.obj === 'arbre') {
            t.reserve = false;
            t.bois = (t.bois || 3) - 1;
            if (t.bois <= 0) { t.obj = 'souche'; m.evenements.push({ type: 'abattu', i: t.i, j: t.j }); }
          }
        } else if (e.fait === 'livrer') {
          var c = bat(m, e.bat);
          h.reserve = null;
          if (c && c.etat === 'chantier') {
            c.enRoute = Math.max(0, c.enRoute - 1);
            c.livre++;
            if (c.livre >= c.besoin) {
              c.etat = 'fini'; c.apparu = m.t; c.renove = 0;
              if (c.niveauVise) { c.niveau = c.niveauVise; c.niveauVise = null; }
              if (c.etapeVisee) {
                c.etape = c.etapeVisee; c.etapeVisee = null;
                if (c.etape >= 3) m.evenements.push({ type: 'merveille', bat: c.id });
              }
              if (c.type === 'passerelle') m.terrain.passerelle = true;
              m.evenements.push({ type: 'fini', bat: c.id });
            }
          }
        } else if (e.fait === 'chasser') {
          var proie = m.animaux.filter(function (a) { return a.id === e.animal; })[0];
          if (proie) { proie.parti = true; m.evenements.push({ type: 'chasse', espece: proie.espece, x: proie.x, y: proie.y, loin: !!e.loin }); }
        } else if (e.fait === 'rapporter') {
          var rb = bat(m, e.bat);
          if (rb && D.batiments[rb.type].travail) {
            var pr = D.batiments[rb.type].travail.produit, nq = quantite(rb, m) * (e.fois || 1);
            ajouter(m, pr, nq);
            m.evenements.push({ type: 'gain', produit: pr, n: nq, x: h.x, y: h.y, bat: rb.id });
          }
        } else if (e.fait === 'produire') {
          var pb = bat(m, e.bat);
          if (pb && pb.stock < stockMax(pb)) { pb.stock++; m.evenements.push({ type: 'bulle', bat: pb.id }); }
        }
        h.etapes.shift();
      }
    }
  }

  function bougerAnimal(m, a, dt) {
    if (a.disparu) return;
    if (a.chasse && a.fuit) {
      // le lapin poursuivi détale vers la forêt et disparaît entre les arbres
      var fx = a.fuit[0] - a.x, fy = a.fuit[1] - a.y, fd = Math.hypot(fx, fy), fv = 95 * dt;
      a.marche = true; if (Math.abs(fx) > 2) a.dir = fx > 0 ? 1 : -1;
      if (fd <= fv) { a.disparu = true; a.marche = false; } else { a.x += fx / fd * fv; a.y += fy / fd * fv; }
      return;
    }
    if (a.chasse) { a.marche = false; return; }
    if (!a.etapes.length) {
      if (a.part) { a.parti = true; return; }
      if (a.attente > 0) { a.attente -= dt; a.marche = false; return; }
      if (estNuit(m)) { a.marche = false; return; }
      var p = a.espece === 'mammouth'
        ? pointLibre(m, [a.x, a.y], 2.5, function (t) { return t.sauvage && t.sol === 'herbe'; })
        : a.espece === 'lapin' ? pointLibre(m, [a.x, a.y], 1.5, function (t) { return t.sol === 'herbe' && !t.bat; })
        : pointLibre(m, lieuDeRepos(m), 4);
      a.etapes = [p];
      a.attente = a.espece === 'lapin' ? 1 + hasard(m) * 3 : 3 + hasard(m) * 6;
    }
    var c = a.etapes[0], dx = c[0] - a.x, dy = c[1] - a.y, d = Math.hypot(dx, dy);
    var v = (a.espece === 'mammouth' ? 20 : a.espece === 'lapin' ? 55 : 40) * dt;
    a.marche = true;
    if (Math.abs(dx) > 2) a.dir = dx > 0 ? 1 : -1;
    if (d <= v) { a.x = c[0]; a.y = c[1]; a.etapes.shift(); } else { a.x += dx / d * v; a.y += dy / d * v; }
  }

  // des lapins sortent de temps en temps de la forêt (le gibier qui revient)
  function lapins(m, dt) {
    if (m.prochainLapin == null) m.prochainLapin = 5;
    m.prochainLapin -= dt;
    if (m.prochainLapin > 0 || estNuit(m)) return;
    m.prochainLapin = 20 + hasard(m) * 20;
    var max = m.epoque === 1 ? 5 : 3;
    if (m.animaux.filter(function (a) { return a.espece === 'lapin'; }).length >= max) return;
    var T = m.terrain, l = T.tuiles.filter(function (t) {
      if (t.sol !== 'herbe' || t.obj || t.bat || !TR.surIle(T, t) || t.sauvage) return false;
      for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) { var n = TR.tuile(T, t.i + di, t.j + dj); if (n && n.obj === 'arbre') return true; }
      return false;
    });
    if (!l.length) return;
    var t = l[Math.floor(hasard(m) * l.length)], c = centreTuile(t);
    m.animaux.push({ id: m.prochainId++, espece: 'lapin', x: c[0], y: c[1], etapes: [], dir: 1, marche: false, attente: 1 });
  }

  // on ne vient vivre au village que s'il y a de quoi manger (ADR-032)
  function assezAManger(m) { return !m.faim && m.nourriture >= besoinRepas(m, m.habitants.length + 1); }
  function arrivees(m, dt) {
    if (m.habitants.length >= lits(m)) { m.arrivee = 0; return; }
    // sans assez à manger, on ne vient que pour aider à nourrir le village (pas de cercle vicieux)
    var aideNourrir = m.batiments.some(function (b) { return b.etat === 'fini' && produitDe(b) === 'nourriture' && (b.ouvriers || []).length < places(b) && !inactif(m, b); });
    if (!assezAManger(m) && !aideNourrir) { m.arrivee = 0; return; }
    if (estNuit(m) && (!aFeu(m) || m.cycle.phase === 'nuit')) return;
    m.arrivee += dt;
    var delai = aFeu(m) ? DELAI_ARRIVEE / 2 : DELAI_ARRIVEE;
    if (m.arrivee < delai) return;
    m.arrivee = 0;
    var al = D.allures[m.epoque];
    var manque = m.batiments.filter(function (b) { return b.etat === 'fini' && (b.ouvriers || []).length < places(b) && !inactif(m, b); });
    var enfant = !manque.length && hasard(m) < 0.3;
    var allure = enfant ? al.enfant : (manque.length ? al[D.batiments[manque[0].type].travail.metier] : choisir(m, al.adulte));
    // on arrive par la plage
    var dep = pointLibre(m, TR.centre(TR.CI + 6, TR.CJ + 6), 2, function (t) { return t.sol === 'sable' || t.sol === 'herbe'; });
    var h = ajouterHabitant(m, { allure: allure || choisir(m, al.adulte), enfant: enfant, x: dep[0], y: dep[1] });
    h.etapes = [{ fait: 'aller', p: pointLibre(m, lieuDeRepos(m), 2) }];
    m.evenements.push({ type: 'arrivee', hab: h.id });
  }

  // les enfants grandissent et deviennent des travailleurs
  var ENFANCE = 240;
  function grandir(m) {
    m.habitants.forEach(function (h) {
      if (!h.enfant || h.dort) return;
      if (h.ne == null) h.ne = m.t;
      if (m.t - h.ne < ENFANCE) return;
      h.enfant = false; h.vitesse = VITESSE.adulte;
      h.allure = choisir(m, D.allures[m.epoque].adulte); h.pouf = 0.6;
      m.evenements.push({ type: 'grandi', hab: h.id });
    });
  }
  function produitDe(b) { var t = D.batiments[b.type].travail; return t ? t.produit : null; }
  function embaucher(m) {
    // la nourriture d'abord (ADR-032)
    m.batiments.slice().sort(function (a, b) { return (produitDe(b) === 'nourriture') - (produitDe(a) === 'nourriture'); }).forEach(function (b) {
      var d = D.batiments[b.type];
      if (b.etat !== 'fini' || !d.travail || inactif(m, b)) return;
      if (!b.ouvriers) b.ouvriers = [];
      while (b.ouvriers.length < places(b)) {
        var libres = adultesLibres(m).filter(function (h) { return h.allure !== 'sage' || d.travail.metier === 'sage'; });
        if (!libres.length) return;
        var best = libres[0], bd = 1e9;
        libres.forEach(function (h) { var dd = Math.hypot(h.x - b.x, h.y - b.y); if (dd < bd) { bd = dd; best = h; } });
        affecter(m, best, b);
      }
    });
  }

  function pas(m, dt) {
    m.t += dt;
    if (!m.cycle) m.cycle = { phase: 'jour', t: 0 };
    if (m.jour == null) m.jour = 0;
    avancerCycle(m, dt);
    m.attribution = (m.attribution || 0) + dt;
    if (m.attribution > 1) { m.attribution = 0; attribuerMaisons(m); }
    if ((m.croissance = (m.croissance || 0) + dt) > 3) { m.croissance = 0; grandir(m); }
    embaucher(m);
    m.habitants.forEach(function (h) { avancer(m, h, dt); });
    lapins(m, dt);
    m.animaux.forEach(function (a) { bougerAnimal(m, a, dt); });
    m.animaux = m.animaux.filter(function (a) { return !a.parti; });
    arrivees(m, dt);
    m.repousse += dt;
    if (m.repousse > 2) { TR.repousser(m.terrain, m.repousse); m.repousse = 0; }
  }

  function exporter(m) { var c = JSON.parse(JSON.stringify(m)); c.evenements = []; return c; }
  function importer(o) {
    o.evenements = [];
    if (o.nourriture == null) { o.nourriture = 30; o.faim = 0; }
    o.batiments.forEach(function (b) {
      if (!b.ouvriers) { b.ouvriers = b.ouvrier ? [b.ouvrier] : []; delete b.ouvrier; }
      if (D.batiments[b.type] && D.batiments[b.type].merveille && b.etape == null) b.etape = 3;
    });
    return o;
  }

  return {
    nouveau: nouveau, pas: pas, construire: construire, construisibles: construisibles,
    emplacementsLibres: emplacementsLibres, ancrePour: ancrePour, ancreValide: ancreValide,
    peutConstruire: peutConstruire, aDeLaPlace: aDeLaPlace,
    decouvertesEpoque: decouvertesEpoque, etatDecouverte: etatDecouverte, decouvrir: decouvrir,
    epoqueTerminee: epoqueTerminee, passerEpoque: passerEpoque, recolter: recolter,
    lits: lits, bat: bat, exporter: exporter, importer: importer, BULLES_MAX: BULLES_MAX,
    heure: heure, obscurite: obscurite, estNuit: estNuit, eclaire: eclaire, RAYON_FEU: RAYON_FEU,
    phase: phase, reveiller: reveiller, toutLeMondeDort: toutLeMondeDort, DUREES: DUREES,
    amelioration: amelioration, ameliorer: ameliorer, quantite: quantite, NIVEAU_MAX: NIVEAU_MAX,
    REPAS: REPAS, reserveMax: reserveMax, RESERVE: RESERVE, qteDe: qteDe, besoinRepas: besoinRepas, assezAManger: assezAManger, places: places, merveilleFinie: merveilleFinie, inactif: inactif
  };
})();
if (typeof module !== 'undefined') module.exports = Monde;
