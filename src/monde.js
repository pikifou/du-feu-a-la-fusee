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
      pieces: 30, idees: 0, nourriture: 20, faim: 0, epoque: 1, decouvertes: {},
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

  // les ponts du gué (la passerelle, puis le pont de pierre) ne prennent pas de place sur les tuiles
  function surGue(type) { return type === 'passerelle' || type === 'pont-pierre'; }
  function poser(m, type, i, j, fini) {
    var def = D.batiments[type], k = def.taille || 1, T = m.terrain;
    var c = TR.centreEmpreinte(i, j, k);
    var bat = {
      id: m.prochainId++, type: type, i: i, j: j, k: k, x: c[0], y: c[1],
      etat: fini ? 'fini' : 'chantier', livre: 0, besoin: def.bois || 0, enRoute: 0,
      stock: 0, ouvriers: [], apparu: fini ? -10 : null, cree: m.t
    };
    if (!surGue(type)) {
      (TR.empreinte(T, i, j, k) || []).forEach(function (t) {
        t.bat = bat.id; t.deco = null; t.usure = 0;
        if (t.obj === 'souche' || (def.zone === 'campagne' && t.obj === 'arbre')) { t.obj = null; t.bois = 0; t.reserve = false; }
      });
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
    var allure = tenue(D.allures[m.epoque], h.metier, h.id);
    if (allure && allure !== h.allure && h.allure !== 'sage') { h.allure = allure; h.pouf = 0.6; }
  }

  // la tenue d'un métier : une seule, ou plusieurs au choix (pour que tout le monde ne se ressemble pas), selon l'habitant
  function tenue(al, metier, id) { var v = al[metier]; return Array.isArray(v) ? v[(id || 0) % v.length] : v; }

  // ---------- requêtes ----------
  function bat(m, id) { for (var i = 0; i < m.batiments.length; i++) if (m.batiments[i].id === id) return m.batiments[i]; return null; }
  function lits(m) {
    return m.batiments.reduce(function (s, b) {
      var d = D.batiments[b.type];
      if (b.enFeu) return s; // une maison qui brûle n'accueille personne (le petit problème de la vapeur)
      return s + (b.etat === 'fini' ? (d.lits || 0) : (b.renove || 0));
    }, 0);
  }
  // un travailleur par niveau (ADR-031)
  // les grandes exploitations de la campagne ont plus de postes (ADR-051)
  function places(b) { var d = D.batiments[b.type]; return d.travail ? (d.postes ? d.postes[b.niveau || 1] : (b.niveau || 1)) : 0; }
  function stockMax(b) { return BULLES_MAX * Math.max(b.niveau || 1, places(b)); }
  function aFeu(m) { return m.batiments.some(function (b) { return b.type === 'feu' && b.etat === 'fini'; }); }

  function construisibles(m) {
    return Object.keys(D.batiments).filter(function (k) {
      var d = D.batiments[k];
      if (d.cout == null || d.automatique) return false;
      if (d.epoque > m.epoque || (d.jusqua || 9) < m.epoque) return false;
      if (d.debloque && !m.decouvertes[d.debloque]) return false;
      if (d.travail && depasse(m, d)) return false;
      if (m.demenage && FERMES_VILLE[k] && d.zone !== 'campagne') return false; // ADR-051 : plus de fermes dans la ville
      if (d.disparait && m.epoque >= d.disparait.epoque) return false; // ADR-054 : il est dépassé
      return true;
    });
  }
  // un bâtiment qui produit est dépassé quand sa forme d'une époque plus récente peut se bâtir
  function depasse(m, d) {
    return [].concat(d.evolue || []).some(function (ev) {
      var c = D.batiments[ev.vers];
      return c.epoque > d.epoque && c.cout != null && cibleDispo(m, ev);
    });
  }

  // une ancre (coin de l'empreinte) est valide si toutes ses tuiles conviennent au bâtiment
  function ancreValide(m, type, i, j) {
    var d = D.batiments[type], k = d.taille || 1, T = m.terrain;
    var tuiles = TR.empreinte(T, i, j, k);
    if (!tuiles) return false;
    for (var n = 0; n < tuiles.length; n++) {
      var t = tuiles[n];
      if (!TR.surIle(T, t) || t.bat || t.gue || t.rail || t.poteau || t.lampe || t.tir || t.eolienne || t.panneau) return false;
      if (t.obj && t.obj !== 'souche' && !(d.zone === 'campagne' && t.obj === 'arbre')) return false;
      if (d.zone === 'campagne' && t.ile < 5) return false; // ADR-051 : la campagne, c'est la terre gagnée à partir de la vapeur
      if (d.zone === 'plage') { if (t.sol !== 'sable') return false; }
      else if (d.zone === 'grotte' || d.zone === 'colline') { if (t.sol !== 'herbe' && t.sol !== 'roche') return false; }
      else if (t.sol !== 'herbe') return false;
      // l'autre rive est le territoire du mammouth : on n'y construit qu'au néolithique (sauf près de la grotte)
      if (t.sauvage && m.epoque < 2 && d.zone !== 'grotte') return false;
    }
    // un peu d'espace autour de chaque bâtiment, pour qu'on puisse passer (ADR-014)
    for (var a = -1; a <= k; a++) for (var b2 = -1; b2 <= k; b2++) {
      if (a >= 0 && a < k && b2 >= 0 && b2 < k) continue;
      var v = TR.tuile(T, i + a, j + b2);
      if (v && v.bat) { var vb = bat(m, v.bat); if (vb && !surGue(vb.type)) return false; }
    }
    // la campagne est hors de la ville : pas de bâtiment de la ville à moins de trois cases
    if (d.zone === 'campagne' && !loinDeLaVille(m, i, j, k, 3)) return false;
    var t0 = tuiles[0];
    if (d.zone === 'rive' || d.zone === 'plage') return tuiles.some(function (t) { return TR.pres(T, t, 'eau'); });
    if (d.zone === 'grotte') {
      var g = T.grotte;
      return g && Math.hypot(t0.i - g[0], t0.j - g[1]) <= 4.5;
    }
    // la mine : contre les rochers des collines
    if (d.zone === 'colline') return tuiles.some(function (t) { return t.sol === 'roche' || TR.pres(T, t, 'roche'); });
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
    if (k >= 3) {
      // on essaie d'abord de centrer le bâtiment sur la case touchée
      essais = [];
      for (var da = -(k - 1); da <= 0; da++) for (var db = -(k - 1); db <= 0; db++) essais.push([da, db]);
      var mi = -(k - 1) / 2;
      essais.sort(function (x, y) { return Math.hypot(x[0] - mi, x[1] - mi) - Math.hypot(y[0] - mi, y[1] - mi); });
    }
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
    m.decouvertes[id] = Math.max(m.t, 0.01); // le moment de la découverte (jamais zéro : zéro voudrait dire « pas découvert »)
    m.evenements.push({ type: 'decouverte', id: id });
    if (id === 'pont') poserPontPierre(m);
    if (id === 'ampoule') allumerVille(m);
    if (id === 'solaire') poserEoliennes(m);
    if (id === 'fusee') poserPasDeTir(m);
    if (epoqueTerminee(m)) m.evenements.push({ type: 'fin-epoque', epoque: m.epoque });
    return true;
  }
  function epoqueTerminee(m) {
    return decouvertesEpoque(m).every(function (k) { return m.decouvertes[k]; });
  }
  function derniereEpoque(m) { return !D.epoques.some(function (e) { return e.id === m.epoque + 1; }); }
  // la vraie fin du jeu : toutes les découvertes de la dernière époque, et la fusée a décollé
  function partieFinie(m) { return derniereEpoque(m) && epoqueTerminee(m) && (m.fusees || 0) > 0; }

  function passerEpoque(m) {
    if (!epoqueTerminee(m)) return false;
    var suivante = D.epoques.filter(function (e) { return e.id === m.epoque + 1; })[0];
    if (!suivante) { if (partieFinie(m) && !m.fini) { m.fini = true; m.evenements.push({ type: 'fin-jeu' }); } return false; }
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
    if (m.epoque === 4) {
      // le petit problème du Moyen Âge (epoques.md) : bientôt, une crue emporte la passerelle en bois
      if (m.batiments.some(function (b) { return b.type === 'passerelle'; })) m.crue = m.t + DELAI_CRUE;
      // des chevaux dans la vallée
      for (var c = 0; c < 2; c++) {
        var pc = pointLibre(m, TR.centre(TR.CI + 2, TR.CJ + 5), 3);
        m.animaux.push({ id: m.prochainId++, espece: 'cheval', x: pc[0], y: pc[1], etapes: [], dir: 1, marche: false });
      }
    }
    if (m.epoque === 5) {
      // le petit problème de la vapeur (epoques.md) : bientôt, une étincelle de cheminée met le feu à une maison
      m.feuPrevu = m.t + DELAI_INCENDIE;
      // ADR-051 : la ville a grandi, la campagne s'ouvre autour d'elle ; les champs et les bêtes y partent
      demenager(m);
    }
    if (m.epoque === 6) {
      // le petit problème de l'électricité (epoques.md) : au premier soir, la ville trop grande reste dans le noir
      if (!m.decouvertes.ampoule) m.nuitNoire = 'prevue';
      // la grille est pleine : l'île ne grandit plus. La ville gagne un peu de place sur la lisière de la forêt (des souches, où l'on peut bâtir)
      defricher(m, 120);
    }
    if (m.epoque === 7) {
      // le petit problème du monde moderne (epoques.md) : bientôt, l'air de la ville devient tout gris
      if (!m.decouvertes.solaire) m.airPrevu = m.t + DELAI_AIR;
      // encore un peu de place : la lisière recule d'un cran (de l'herbe, presque sans souches), et les vieilles souches s'en vont
      defricher(m, 100, true);
      eclaircirSouches(m);
      // un grand terrain au bord de l'île est gardé pour le pas de tir de la fusée
      reserverTir(m);
    }
    agrandirMerveilles(m);
    prolongerRails(m);
    // ADR-054 : ce qui ne se construit plus à partir de cette époque (seulement ce que le joueur pouvait déjà bâtir)
    var partis = Object.keys(D.batiments).filter(function (k) {
      var d = D.batiments[k];
      return d.disparait && d.disparait.epoque === m.epoque && d.epoque < m.epoque && d.cout != null && (!d.debloque || m.decouvertes[d.debloque]);
    });
    if (partis.length) m.evenements.push({ type: 'disparus', liste: partis });
    m.habitants.forEach(function (h) { h.changeTenue = hasard(m) * 8; });
    m.evenements.push({ type: 'epoque', epoque: m.epoque });
    return true;
  }

  // ---------- le grand déménagement des fermes (ADR-050, ADR-051) ----------
  // Au passage à la vapeur, tous les champs et tous les enclos de la ville partent à la campagne : un seul très grand champ,
  // une seule grande ferme d'élevage, sur la terre gagnée autour de la ville. Les cases libérées redeviennent de la ville.
  var FERMES_VILLE = { 'buisson-baies': 'champ', 'champ-ble': 'champ', 'champ-laboure': 'champ', ferme: 'champ', 'enclos-moutons': 'elevage', etable: 'elevage', 'ferme-laitiere': 'elevage' };
  function formeCampagne(m, genre) { return genre === 'champ' ? (m.epoque >= 6 ? 'ferme' : 'grand-champ') : (m.epoque >= 6 ? 'ferme-laitiere' : 'grand-elevage'); }
  function estVille(b) { var d = D.batiments[b.type]; return d && d.zone !== 'campagne' && !surGue(b.type); }
  function loinDeLaVille(m, i, j, k, r) {
    var T = m.terrain;
    for (var a = -r; a < k + r; a++) for (var c = -r; c < k + r; c++) {
      var v = TR.tuile(T, i + a, j + c);
      if (v && v.bat) { var vb = bat(m, v.bat); if (vb && estVille(vb)) return false; }
    }
    return true;
  }
  // la meilleure place à la campagne : la plus proche de la ville, de ce côté-ci de la rivière si possible
  // (on préfère un pré dégagé à une clairière dans la forêt : chaque arbre autour compte comme un peu plus de distance)
  function ancreCampagne(m, type, pres) {
    var T = m.terrain, k = D.batiments[type].taille || 1;
    var l = emplacementsLibres(m, type, pres);
    var ici = l.filter(function (a) { var t = TR.tuile(T, a[0], a[1]); return !t.sauvage; });
    if (!ici.length) ici = l;
    var best = null, bs = 1e9;
    ici.slice(0, 400).forEach(function (a) {
      var arbres = 0;
      for (var di = -2; di < k + 2; di++) for (var dj = -2; dj < k + 2; dj++) { var v = TR.tuile(T, a[0] + di, a[1] + dj); if (v && v.obj === 'arbre') arbres++; }
      var sc = Math.hypot(a[0] + k / 2 - pres[0], a[1] + k / 2 - pres[1]) + arbres * 0.35;
      if (sc < bs) { bs = sc; best = a; }
    });
    return best;
  }
  // autour d'une grande exploitation, une bordure de pré : les arbres tout contre s'en vont
  function degagerAutour(m, b) {
    for (var di = -1; di <= b.k; di++) for (var dj = -1; dj <= b.k; dj++) {
      var v = TR.tuile(m.terrain, b.i + di, b.j + dj);
      if (v && !v.bat && v.ile >= 5 && (v.obj === 'arbre' || v.obj === 'souche') && !v.reserve) { v.obj = null; v.bois = 0; }
    }
  }
  function retirer(m, b) {
    m.habitants.forEach(function (h) {
      if (h.reserve === b.id || h.travail === b.id || h.dans === b.id) lacher(m, h);
      if (h.travail === b.id) { h.travail = null; h.metier = null; }
    });
    m.terrain.tuiles.forEach(function (t) { if (t.bat === b.id) { t.bat = null; t.usure = 0; } });
    m.batiments = m.batiments.filter(function (x) { return x !== b; });
  }
  function demenager(m) {
    if (m.demenage || m.epoque < 5) return null;
    m.demenage = true;
    var genres = { champ: [], elevage: [] }, anciens = [], nouveaux = [];
    m.batiments.forEach(function (b) { var g = FERMES_VILLE[b.type]; if (g) genres[g].push(b); });
    var centre = [TR.CI, TR.CJ];
    ['champ', 'elevage'].forEach(function (g) {
      var l = genres[g];
      if (!l.length) return;
      var type = formeCampagne(m, g), d = D.batiments[type];
      var a = ancreCampagne(m, type, nouveaux.length ? [nouveaux[0].i, nouveaux[0].j] : centre);
      if (!a) return; // pas de place à la campagne : ces fermes restent en ville
      var postes = 0, reserve = 0, rendu = 0;
      l.forEach(function (b) {
        postes += b.etat === 'fini' ? places(b) : 0;
        reserve += b.etat === 'fini' ? (RESERVE[b.type] || 0) : 0;
        if (b.etat === 'chantier' && !b.niveauVise && !b.ancien) rendu += D.batiments[b.type].cout || 0; // un chantier pas fini est remboursé
        anciens.push({ x: b.x, y: b.y, type: b.type, genre: g });
        retirer(m, b);
      });
      m.pieces += rendu;
      var nb = poser(m, type, a[0], a[1], true);
      degagerAutour(m, nb);
      nb.niveau = 1;
      while (nb.niveau < NIVEAU_MAX && d.postes[nb.niveau] < postes) nb.niveau++;
      if (reserve > (RESERVE[type] || 0)) nb.reserve = reserve;
      nouveaux.push(nb);
    });
    if (!anciens.length) return null;
    // les bêtes de l'enclos partent à pied vers la grande ferme d'élevage
    var el = nouveaux.filter(function (b) { return b.type === 'grand-elevage' || b.type === 'ferme-laitiere'; })[0];
    if (el) anciens.filter(function (o) { return o.genre === 'elevage'; }).forEach(function (o, n) {
      for (var q = 0; q < 3; q++) {
        var dep = [o.x + (q - 1) * 26, o.y + 10 + q * 6];
        var arr = [el.x + (hasard(m) - 0.5) * 120, el.y + (hasard(m) - 0.2) * 40];
        var ch = TR.chemin(m.terrain, dep, arr);
        m.animaux.push({ id: m.prochainId++, espece: 'mouton', x: dep[0], y: dep[1], etapes: ch, dir: 1, marche: true, part: true, depart: n * 1.5 + q * 0.4 });
      }
    });
    m.evenements.push({ type: 'demenagement', anciens: anciens, nouveaux: nouveaux.map(function (b) { return b.id; }) });
    return { anciens: anciens, nouveaux: nouveaux };
  }
  // ADR-051 : les monuments posés avant prennent leur nouvelle taille quand ils en ont la place autour d'eux
  function agrandirMerveilles(m) {
    var n = 0;
    m.batiments.forEach(function (b) {
      var d = D.batiments[b.type];
      if (!d || b.k >= (d.taille || 1)) return;
      if (d.merveille && d.tailleAvant) {
        var a = ancreModerne(m, b, b.type);
        if (!a) return;
        deplacerEmpreinte(m, b, a, d.taille);
        n++;
      } else if (d.plan) {
        // ADR-053 : une grande exploitation posée plus petite (avant) prend ses 6 x 6 cases, sur place ou ailleurs à la campagne
        var a2 = ancreModerne(m, b, b.type) || ancreCampagne(m, b.type, [b.i, b.j]);
        if (!a2) return;
        deplacerEmpreinte(m, b, a2, d.taille);
        degagerAutour(m, b);
        n++;
      }
    });
    return n;
  }

  // ---------- l'incendie et les pompiers (le petit problème de la vapeur) ----------
  var DELAI_INCENDIE = 60;
  function caserne(m) { return m.batiments.filter(function (b) { return b.type === 'caserne' && b.etat === 'fini'; })[0] || null; }
  function incendie(m) {
    if (m.feuPrevu != null && m.t >= m.feuPrevu) {
      m.feuPrevu = null;
      if (!caserne(m)) {
        // une maison habitée, près du centre du village : tout le monde est sorti à temps
        var maisons = m.batiments.filter(function (b) { return b.etat === 'fini' && D.batiments[b.type].lits; });
        var c = TR.centre(TR.CI, TR.CJ);
        maisons.sort(function (a, b) { return dist([a.x, a.y], c) - dist([b.x, b.y], c); });
        var b = maisons[0];
        if (b) {
          b.enFeu = true;
          m.incendie = { bat: b.id, pompier: null };
          m.habitants.forEach(function (h) { if (h.dortChez === b.id || h.maison === b.id) { h.maison = null; if (h.dort) lacher(m, h); } });
          m.evenements.push({ type: 'incendie', bat: b.id, x: b.x, y: b.y });
        }
      }
    }
    var f = m.incendie;
    if (!f) return;
    var bf = bat(m, f.bat);
    if (!bf) { m.incendie = null; return; }
    var cs = caserne(m);
    if (!cs) return;
    // un pompier part de la caserne avec la pompe à vapeur
    var p = f.pompier && m.habitants.filter(function (h) { return h.id === f.pompier; })[0];
    if (p && p.etapes.some(function (e) { return e.fait === 'eteindre'; })) return;
    var libres = m.habitants.filter(function (h) { return !h.enfant && h.allure !== 'sage' && !h.dort; });
    if (!libres.length) return;
    libres.sort(function (a, b) { return dist([a.x, a.y], [cs.x, cs.y]) - dist([b.x, b.y], [cs.x, cs.y]); });
    p = libres[0];
    lacher(m, p);
    p.allure = 'e5-pompier'; p.pouf = 0.6; p.changeTenue = null;
    f.pompier = p.id;
    var lieu = devant(m, bf);
    p.etapes = [
      { fait: 'aller', p: devant(m, cs) },
      { fait: 'attendre', d: 0.8, anim: 'repos' },
      { fait: 'aller', p: [lieu[0] + 48, lieu[1] + 18] },
      { fait: 'attendre', d: 8, anim: 'travail', pose: 'e5-pompier', arrose: bf.id },
      { fait: 'eteindre', bat: bf.id }
    ];
    m.evenements.push({ type: 'pompiers', hab: p.id, bat: bf.id });
  }

  // ---------- le chemin de fer : de la gare jusqu'au tunnel, au bord nord de l'île ----------
  function poserRails(m, gare) {
    var T = m.terrain;
    var marche = function (t) {
      return t && TR.surIle(T, t) && t.sol !== 'eau' && !t.gue && !t.bat && t.obj !== 'grotte';
    };
    var cle = function (t, d) { return (t.i * TR.N + t.j) * 4 + d; };
    var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    // départ : une case libre contre la gare (de préférence devant)
    var departs = [];
    for (var a = -1; a <= gare.k; a++) for (var b2 = -1; b2 <= gare.k; b2++) {
      if (a >= 0 && a < gare.k && b2 >= 0 && b2 < gare.k) continue;
      if ((a === -1 || a === gare.k) && (b2 === -1 || b2 === gare.k)) continue; // pas les coins
      var t0 = TR.tuile(T, gare.i + a, gare.j + b2);
      if (marche(t0)) departs.push(t0);
    }
    if (!departs.length) return null;
    // Dijkstra : on préfère les lignes droites, et éviter d'abattre arbres et rochers
    var g = {}, venu = {}, ouverts = [];
    departs.forEach(function (t) { for (var d = 0; d < 4; d++) { g[cle(t, d)] = 0; ouverts.push([t, d]); } });
    var vus = {}, garde = 0;
    while (ouverts.length && garde++ < 40000) {
      var k = 0;
      for (var q = 1; q < ouverts.length; q++) if (g[cle(ouverts[q][0], ouverts[q][1])] < g[cle(ouverts[k][0], ouverts[k][1])]) k = q;
      var o = ouverts.splice(k, 1)[0], c = o[0], dc = o[1], kc = cle(c, dc);
      if (vus[kc]) continue;
      vus[kc] = true;
      for (var d = 0; d < 4; d++) {
        var n = TR.tuile(T, c.i + DIRS[d][0], c.j + DIRS[d][1]);
        if (!marche(n)) continue;
        var cout = 1 + (d !== dc ? 2.5 : 0) + (n.obj === 'arbre' || n.obj === 'rocher' ? 1.5 : 0);
        var kn = cle(n, d), ng = g[kc] + cout;
        if (g[kn] == null || ng < g[kn]) { g[kn] = ng; venu[kn] = kc; ouverts.push([n, d]); }
      }
    }
    // le tunnel : une case au bord de l'île, la plus au nord possible sans aller trop loin
    var best = null, bs = 1e9;
    Object.keys(g).forEach(function (kk) {
      var id = Math.floor(kk / 4), t = T.tuiles[id];
      var bord = DIRS.some(function (dd) { var v = TR.tuile(T, t.i + dd[0], t.j + dd[1]); return !v || !TR.surIle(T, v); });
      if (!bord || t.sol === 'sable') return;
      // une vraie petite ligne : au moins quelques cases entre la gare et le tunnel
      var sc = (t.i + t.j) * 0.5 + g[kk] + (g[kk] < 3 ? 40 : 0);
      if (sc < bs) { bs = sc; best = +kk; }
    });
    if (best == null) return null;
    var chemin = [], x = best;
    while (x != null) { var tt = T.tuiles[Math.floor(x / 4)]; if (!chemin.length || chemin[0] !== tt) chemin.unshift(tt); x = venu[x]; }
    chemin.forEach(function (t) { t.rail = true; if (t.obj && t.obj !== 'grotte') t.obj = null; t.deco = null; });
    var fin = chemin[chemin.length - 1];
    m.rails = { tuiles: chemin.map(function (t) { return [t.i, t.j]; }), gare: gare.id };
    degagerRails(m);
    m.evenements.push({ type: 'rails', x: fin ? TR.centre(fin.i, fin.j)[0] : gare.x, y: fin ? TR.centre(fin.i, fin.j)[1] : gare.y });
    return m.rails;
  }

  // la lisière de la forêt la plus proche du village recule d'un cran : des souches où l'on peut bâtir
  function defricher(m, n, clair) {
    var T = m.terrain, c = TR.centre(TR.CI, TR.CJ);
    var l = T.tuiles.filter(function (t) {
      if (t.obj !== 'arbre' || t.reserve || !TR.surIle(T, t) || t.sauvage) return false;
      for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) { var v = TR.tuile(T, t.i + di, t.j + dj); if (v && TR.surIle(T, v) && v.sol === 'herbe' && v.obj !== 'arbre') return true; }
      return false;
    });
    l.sort(function (a, b) { return dist(TR.centre(a.i, a.j), c) - dist(TR.centre(b.i, b.j), c); });
    // clair : une souche de temps en temps seulement, de l'herbe ailleurs (sinon un grand champ de souches)
    l.slice(0, n).forEach(function (t) { t.obj = clair && !garderSouche(t) ? null : 'souche'; t.bois = 0; });
    return Math.min(n, l.length);
  }
  function garderSouche(t) { return (t.i * 7 + t.j * 13) % 5 === 0; }
  // les souches loin de la forêt s'en vont (on en garde une sur cinq) : plus de grand champ de souches au nord
  function eclaircirSouches(m) {
    var T = m.terrain;
    if (m.souchesEclaircies) return;
    m.souchesEclaircies = true;
    T.tuiles.forEach(function (t) {
      if (t.obj !== 'souche' || garderSouche(t)) return;
      for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) { var v = TR.tuile(T, t.i + di, t.j + dj); if (v && v.obj === 'arbre') return; }
      t.obj = null;
    });
  }

  // chaque matin, les souches des arbres coupés la veille s'en vont (on en garde une sur cinq) : la place se libère (ADR-041)
  function nettoyerSouches(m) {
    m.terrain.tuiles.forEach(function (t) { if (t.obj === 'souche' && !t.bat && !garderSouche(t)) t.obj = null; });
  }

  // ---------- le monde moderne : l'air sale, les éoliennes, le pas de tir et la fusée ----------
  var DELAI_AIR = 60, DUREE_VOL = 9, NOUVELLE_FUSEE = 150;
  // un terrain de 2 x 2 cases au bord de l'île, ni trop près ni trop loin du village : on n'y bâtit pas, la fusée l'attend
  function terrainTir(m) {
    var T = m.terrain, c = [TR.CI, TR.CJ];
    var ok = function (t) { return t && TR.surIle(T, t) && t.sol === 'herbe' && !t.bat && !t.gue && !t.rail && !t.poteau && !t.lampe && !t.eolienne && !t.panneau && (!t.obj || t.obj === 'souche' || t.obj === 'arbre'); };
    var l = [];
    for (var i = 1; i < T.N - 2; i++) for (var j = 1; j < T.N - 2; j++) {
      var bon = true, bord = false;
      for (var a = -1; a <= 2 && bon; a++) for (var b = -1; b <= 2 && bon; b++) {
        var t = TR.tuile(T, i + a, j + b), dedans = a >= 0 && a < 2 && b >= 0 && b < 2;
        if (dedans) { if (!ok(t)) bon = false; }
        else if (t && (t.bat || t.rail)) bon = false;
      }
      if (!bon) continue;
      for (var a2 = -2; a2 <= 3 && !bord; a2++) for (var b2 = -2; b2 <= 3 && !bord; b2++) { var v = TR.tuile(T, i + a2, j + b2); if (!v || !TR.surIle(T, v) || v.sol === 'eau' || v.sol === 'sable') bord = true; }
      var d = Math.hypot(i + 0.5 - c[0], j + 0.5 - c[1]);
      l.push({ i: i, j: j, d: d, bord: bord });
    }
    // de préférence au bord de la mer, à au moins 8 cases du cœur du village ; sinon le plus près possible de ça
    var cotes = l.filter(function (x) { return x.bord && x.d >= 8; }).sort(function (a, b) { return a.d - b.d; });
    if (cotes.length) return cotes[0];
    l.sort(function (a, b) { return Math.abs(a.d - 10) - Math.abs(b.d - 10); });
    return l[0] || null;
  }
  function reserverTir(m) {
    if (m.tir || m.batiments.some(function (b) { return b.type === 'pas-de-tir'; })) return m.tir || null;
    var x = terrainTir(m);
    if (!x) return null;
    var T = m.terrain;
    for (var a = -1; a <= 2; a++) for (var b = -1; b <= 2; b++) {
      var t = TR.tuile(T, x.i + a, x.j + b); if (!t) continue;
      if (a >= 0 && a < 2 && b >= 0 && b < 2) { t.tir = true; t.obj = null; t.deco = null; }
      else if (t.obj === 'arbre' && !t.reserve) { t.obj = null; t.bois = 0; }
    }
    m.tir = [x.i, x.j];
    return m.tir;
  }
  function poserPasDeTir(m) {
    if (m.batiments.some(function (b) { return b.type === 'pas-de-tir'; })) return null;
    var r = m.tir || reserverTir(m);
    if (!r) return null;
    var T = m.terrain;
    (TR.empreinte(T, r[0], r[1], 2) || []).forEach(function (t) { delete t.tir; if (t.obj) t.obj = null; });
    var b = poser(m, 'pas-de-tir', r[0], r[1], false);
    b.automatique = true;
    m.fusee = 'chantier';
    m.evenements.push({ type: 'chantier', bat: b.id });
    m.evenements.push({ type: 'pas-de-tir', x: b.x, y: b.y });
    return b;
  }
  // le gros bouton : la fusée décolle (un geste de l'enfant)
  function decoller(m) {
    if (m.fusee !== 'prete') return false;
    m.fusee = 'vol'; m.vol = 0;
    var b = m.batiments.filter(function (x) { return x.type === 'pas-de-tir'; })[0];
    m.evenements.push({ type: 'decollage', x: b ? b.x : 0, y: b ? b.y : 0, premiere: !(m.fusees > 0) });
    return true;
  }
  function fusee(m, dt) {
    if (m.fusee === 'vol') {
      m.vol = (m.vol || 0) + dt;
      if (m.vol >= DUREE_VOL) {
        m.fusee = 'partie'; m.vol = 0;
        m.fusees = (m.fusees || 0) + 1;
        m.prochaineFusee = m.t + NOUVELLE_FUSEE;
        m.evenements.push({ type: 'fusee-partie', n: m.fusees });
      }
    } else if (m.fusee === 'partie' && m.prochaineFusee != null && m.t >= m.prochaineFusee) {
      // une nouvelle fusée est dressée sur le pas de tir : on peut la faire décoller encore
      m.fusee = 'prete'; m.prochaineFusee = null;
      m.evenements.push({ type: 'fusee-prete', nouvelle: true });
    }
  }
  // l'air sale : peu après l'arrivée, la ville devient toute grise ; plus personne ne vient y habiter
  function airSale(m) {
    if (m.airPrevu == null || m.t < m.airPrevu) return;
    m.airPrevu = null;
    if (m.decouvertes.solaire) return;
    m.airSale = true;
    m.evenements.push({ type: 'air-sale' });
  }
  // l'énergie solaire : des éoliennes au bord de l'île et de petits panneaux solaires près des maisons ; l'air redevient pur
  function poserEoliennes(m) {
    var T = m.terrain, c = TR.centre(TR.CI, TR.CJ);
    m.airPrevu = null;
    var etait = m.airSale === true;
    m.airSale = 'resolu';
    if (!m.eoliennes) {
      var libre = function (t) { return t && TR.surIle(T, t) && t.sol === 'herbe' && !t.bat && !t.rail && !t.poteau && !t.lampe && !t.gue && !t.tir && !t.eolienne && !t.panneau && (!t.obj || t.obj === 'souche' || t.obj === 'arbre'); };
      var bord = function (t) { for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) { var v = TR.tuile(T, t.i + a, t.j + b); if (!v || !TR.surIle(T, v) || v.sol === 'sable' || v.sol === 'eau') return true; } return false; };
      // les éoliennes : sur les bords de l'île, là où le vent souffle, bien espacées
      var l = T.tuiles.filter(function (t) { return libre(t) && bord(t) && !t.reserve; });
      l.sort(function (a, b) { return dist(TR.centre(a.i, a.j), c) - dist(TR.centre(b.i, b.j), c); });
      var eo = [];
      l.forEach(function (t) {
        if (eo.length >= 6 || dist(TR.centre(t.i, t.j), c) < 700) return;
        if (eo.some(function (q) { return Math.max(Math.abs(q.i - t.i), Math.abs(q.j - t.j)) < 5; })) return;
        eo.push(t);
      });
      eo.forEach(function (t) { t.eolienne = true; t.deco = null; if (t.obj) { t.obj = null; t.bois = 0; } });
      m.eoliennes = eo.map(function (t) { return [t.i, t.j]; });
      // les petits panneaux solaires : près des maisons, comme les lampadaires
      var pres = T.tuiles.filter(function (t) {
        if (!libre(t) || t.obj === 'arbre' || t.usure >= 0.3) return false;
        for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) { var v = TR.tuile(T, t.i + di, t.j + dj); var vb = v && v.bat && bat(m, v.bat); if (vb && D.batiments[vb.type].lits) return true; }
        return false;
      });
      pres.sort(function (a, b) { return dist(TR.centre(a.i, a.j), c) - dist(TR.centre(b.i, b.j), c); });
      var pa = [];
      pres.forEach(function (t) {
        if (pa.length >= 8) return;
        if (pa.some(function (q) { return Math.max(Math.abs(q.i - t.i), Math.abs(q.j - t.j)) < 4; })) return;
        pa.push(t);
      });
      pa.forEach(function (t) { t.panneau = true; t.deco = null; if (t.obj === 'souche') t.obj = null; });
      m.panneaux = pa.map(function (t) { return [t.i, t.j]; });
    }
    m.evenements.push({ type: 'air-pur', etait: etait, n: m.eoliennes.length });
    return m.eoliennes;
  }
  // pour la copie confiée à Ludiworld : des nombres arrondis, et sans les trajets en cours (ils se recalculent tout seuls)
  function r1(v) { return typeof v === 'number' ? Math.round(v * 10) / 10 : v; }
  function arrondir(c) {
    (c.habitants || []).forEach(function (h) {
      h.x = r1(h.x); h.y = r1(h.y);
      (h.etapes || []).forEach(function (e) { delete e.route; if (e.p) e.p = e.p.map(r1); if (e.reste != null) e.reste = r1(e.reste); });
    });
    (c.animaux || []).forEach(function (a) { a.x = r1(a.x); a.y = r1(a.y); if (a.etapes) a.etapes = a.etapes.map(function (q) { return Array.isArray(q) ? q.map(r1) : q; }); if (a.fuit) a.fuit = a.fuit.map(r1); });
    if (c.terrain && c.terrain.tuiles) c.terrain.tuiles.forEach(function (t) { if (t.usure) t.usure = Math.round(t.usure * 1000) / 1000; });
    return c;
  }

  // ---------- l'électricité : les poteaux et les fils, puis les lampadaires (le petit problème de l'électricité) ----------
  // une ligne de poteaux, de la centrale (ou du central téléphonique) jusqu'au cercle des anciens, au cœur du village
  function poserLigne(m, b, genre) {
    var T = m.terrain;
    m.lignes = m.lignes || [];
    if (m.lignes.some(function (l) { return l.de === b.id; })) return null;
    var cercle = m.batiments.filter(function (x) { return x.type === 'cercle-pierres'; })[0];
    var gi = cercle ? cercle.i : TR.CI, gj = cercle ? cercle.j : TR.CJ, gk = cercle ? cercle.k : 1;
    var passe = function (t) { return t && TR.surIle(T, t) && (t.sol !== 'eau' || t.gue) && !t.bat && t.obj !== 'grotte'; };
    var cle = function (t) { return t.i * TR.N + t.j; };
    var autour = function (i0, j0, k) {
      var l = [];
      for (var a = -1; a <= k; a++) for (var c = -1; c <= k; c++) {
        if (a >= 0 && a < k && c >= 0 && c < k) continue;
        var t = TR.tuile(T, i0 + a, j0 + c); if (passe(t)) l.push(t);
      }
      return l;
    };
    var depart = autour(b.i, b.j, b.k), but = {};
    autour(gi, gj, gk).forEach(function (t) { but[cle(t)] = true; });
    if (!depart.length) return null;
    var venu = {}, file = depart.slice(), fin = null;
    depart.forEach(function (t) { venu[cle(t)] = -1; });
    while (file.length) {
      var c = file.shift();
      if (but[cle(c)]) { fin = c; break; }
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var n = TR.tuile(T, c.i + d[0], c.j + d[1]);
        if (!passe(n) || venu[cle(n)] != null) return;
        venu[cle(n)] = cle(c); file.push(n);
      });
    }
    if (!fin) return null;
    var chemin = [], x = cle(fin);
    while (x != null && x !== -1) { chemin.unshift(T.tuiles[x]); x = venu[x]; }
    // un poteau toutes les trois cases environ, sur une case libre (pas sur le gué, ni sur les rails)
    var poteaux = [], dernier = -9;
    chemin.forEach(function (t, k) {
      var bout = k === chemin.length - 1 || k === 0;
      if (k - dernier < 3 && !bout) return;
      if (t.poteau) { poteaux.push([t.i, t.j]); dernier = k; return; } // un poteau déjà là : on y accroche aussi ce fil
      if (t.gue || t.rail || t.lampe || t.sol !== 'herbe' || (t.obj && t.obj !== 'souche' && t.obj !== 'arbre')) return;
      if (t.obj === 'arbre') { t.obj = 'souche'; t.bois = 0; }
      t.poteau = genre; t.deco = null; dernier = k;
      poteaux.push([t.i, t.j]);
    });
    if (!poteaux.length) return null;
    var ligne = { genre: genre, de: b.id, vers: cercle ? cercle.id : null, poteaux: poteaux };
    m.lignes.push(ligne);
    m.evenements.push({ type: 'ligne', genre: genre, bat: b.id, x: b.x, y: b.y });
    return ligne;
  }
  // l'ampoule : des lampadaires électriques le long des chemins les plus usés, et près des maisons
  function allumerVille(m) {
    var T = m.terrain;
    if (m.lampes && m.lampes.length) return m.lampes;
    var libre = function (t) { return TR.surIle(T, t) && t.sol === 'herbe' && !t.bat && !t.rail && !t.poteau && !t.gue && (!t.obj || t.obj === 'souche'); };
    var c = TR.centre(TR.CI, TR.CJ);
    var l = T.tuiles.filter(function (t) { return libre(t) && t.usure >= 0.3; });
    l.sort(function (a, b) { return (b.usure - a.usure) || (dist(TR.centre(a.i, a.j), c) - dist(TR.centre(b.i, b.j), c)); });
    // et le long des maisons, si les chemins ne suffisent pas
    var pres = T.tuiles.filter(function (t) {
      if (!libre(t) || t.usure >= 0.3) return false;
      for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) { var v = TR.tuile(T, t.i + di, t.j + dj); var vb = v && v.bat && bat(m, v.bat); if (vb && D.batiments[vb.type].lits) return true; }
      return false;
    });
    pres.sort(function (a, b) { return dist(TR.centre(a.i, a.j), c) - dist(TR.centre(b.i, b.j), c); });
    var choisis = [];
    l.concat(pres).forEach(function (t) {
      if (choisis.length >= 16) return;
      if (choisis.some(function (q) { return Math.max(Math.abs(q.i - t.i), Math.abs(q.j - t.j)) < 3; })) return;
      choisis.push(t);
    });
    choisis.forEach(function (t) { t.lampe = true; t.deco = null; if (t.obj === 'souche') t.obj = null; });
    m.lampes = choisis.map(function (t) { return [t.i, t.j]; });
    m.nuitNoire = 'resolue';
    m.evenements.push({ type: 'lumiere', n: choisis.length });
    return m.lampes;
  }

  // on voit la ligne : les arbres qui la bordent sont abattus, et plus largement devant le tunnel (des souches restent)
  function degagerRails(m) {
    var T = m.terrain, R = m.rails && m.rails.tuiles;
    if (!R) return;
    R.forEach(function (c, k) {
      var r = k >= R.length - 3 ? 3 : 1;
      for (var di = -r; di <= r; di++) for (var dj = -r; dj <= r; dj++) {
        // devant le tunnel, ce qui le cache est plus bas à l'écran : on dégage surtout de ce côté
        if (r === 3 && di + dj < -1) continue;
        var v = TR.tuile(T, c[0] + di, c[1] + dj);
        if (v && v.obj === 'arbre' && !v.reserve) { v.obj = 'souche'; v.bois = 0; }
      }
    });
  }

  // ADR-051 : quand l'île grandit, le tunnel ne doit pas rester au milieu des prés. Les rails continuent par le plus court
  // chemin libre jusqu'au nouveau bord de l'île (sans bâtiment, eau, poteau ni lampadaire sur la route ; sinon le tunnel reste).
  function prolongerRails(m) {
    var T = m.terrain, R = m.rails && m.rails.tuiles;
    if (!R || R.length < 2) return 0;
    var bord = function (t) { return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (d) { var v = TR.tuile(T, t.i + d[0], t.j + d[1]); return !v || !TR.surIle(T, v); }); };
    var libre = function (t) { return t && TR.surIle(T, t) && !t.rail && !t.bat && t.sol !== 'eau' && !t.gue && !t.poteau && !t.lampe && !t.eolienne && !t.panneau && !t.tir && t.obj !== 'grotte'; };
    var fin = TR.tuile(T, R[R.length - 1][0], R[R.length - 1][1]);
    if (!fin || bord(fin)) return 0;
    var venu = {}, file = [fin], cle = function (t) { return t.i * TR.N + t.j; }, but = null;
    venu[cle(fin)] = null;
    while (file.length && !but) {
      var t = file.shift();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        if (but) return;
        var v = TR.tuile(T, t.i + d[0], t.j + d[1]);
        if (!libre(v) || cle(v) in venu) return;
        venu[cle(v)] = t;
        if (bord(v)) but = v; else file.push(v);
      });
    }
    if (!but) return 0;
    var chemin = [];
    for (var x = but; x && x !== fin; x = venu[cle(x)]) chemin.unshift(x);
    if (chemin.length > 30) return 0;
    chemin.forEach(function (t) { t.rail = true; t.deco = null; if (t.obj) { t.obj = null; t.bois = 0; } R.push([t.i, t.j]); });
    degagerRails(m);
    return chemin.length;
  }

  // ---------- le pont emporté, puis le pont de pierre (le petit problème du Moyen Âge) ----------
  var DELAI_CRUE = 45;
  function crue(m) {
    if (m.crue == null || m.t < m.crue) return;
    m.crue = null;
    if (m.decouvertes.pont) return; // le pont de pierre est déjà là
    var p = m.batiments.filter(function (b) { return b.type === 'passerelle'; })[0];
    if (!p) return;
    m.habitants.forEach(function (h) { if (h.reserve === p.id) lacher(m, h); });
    m.batiments = m.batiments.filter(function (b) { return b !== p; });
    m.terrain.passerelle = false;
    m.pontEmporte = true;
    m.evenements.push({ type: 'crue', x: p.x, y: p.y });
  }
  // les arbres des deux rives cachaient le grand pont de pierre : on dégage ses abords (souches)
  function degagerPont(m) {
    var T = m.terrain;
    (T.gues || []).forEach(function (g) {
      for (var di = -2; di <= 2; di++) for (var dj = -2; dj <= 2; dj++) {
        var t = TR.tuile(T, g[0] + di, g[1] + dj);
        if (t && t.obj === 'arbre' && !t.reserve) { t.obj = 'souche'; t.bois = 0; }
      }
    });
  }
  function poserPontPierre(m) {
    var g = m.terrain.gue;
    if (!g || m.batiments.some(function (b) { return b.type === 'pont-pierre'; })) return;
    // la passerelle (si la crue ne l'a pas encore emportée) laisse la place au pont de pierre
    var vieux = m.batiments.filter(function (b) { return b.type === 'passerelle'; })[0];
    if (vieux) { m.habitants.forEach(function (h) { if (h.reserve === vieux.id) lacher(m, h); }); m.batiments = m.batiments.filter(function (b) { return b !== vieux; }); }
    m.crue = null;
    m.terrain.passerelle = false;
    var pont = poser(m, 'pont-pierre', g[0], g[1], false);
    pont.automatique = true;
    degagerPont(m);
    m.evenements.push({ type: 'chantier', bat: pont.id });
  }

  // ---------- améliorations payantes (ADR-021) ----------
  var NIVEAU_MAX = 3;
  function cibleDispo(m, ev) {
    var cible = D.batiments[ev.vers];
    return (!ev.decouverte || m.decouvertes[ev.decouverte]) && (!cible.debloque || m.decouvertes[cible.debloque]) &&
      cible.epoque <= m.epoque && (cible.jusqua || 9) >= m.epoque && !(m.demenage && FERMES_VILLE[ev.vers] && cible.zone !== 'campagne');
  }
  // moderniser coûte moins cher que bâtir à neuf (ADR-040 : on pousse à le faire)
  function prixModerne(type) { return Math.round((D.batiments[type].cout || 100) * 0.6 / 5) * 5; }
  // le cadeau d'une modernisation finie (ADR-040) : une partie du prix rendue, et deux idées
  function cadeauDe(cout) { return { pieces: Math.max(10, Math.round(cout * 0.5 / 5) * 5), idees: 2 }; }
  // où poser la forme moderne : son empreinte recouvre l'ancienne ; les tuiles en plus doivent être libres
  // (les arbres et les souches y sont dégagés)
  function ancreModerne(m, b, type) {
    var k2 = D.batiments[type].taille || 1, T = m.terrain;
    if (k2 <= b.k) return [b.i, b.j];
    var e = k2 - b.k, essais = [];
    for (var di = -e; di <= 0; di++) for (var dj = -e; dj <= 0; dj++) essais.push([b.i + di, b.j + dj]);
    // d'abord les ancres qui gardent le bâtiment centré sur sa place
    essais.sort(function (a, c) { return Math.abs(a[0] - b.i + e / 2) + Math.abs(a[1] - b.j + e / 2) - Math.abs(c[0] - b.i + e / 2) - Math.abs(c[1] - b.j + e / 2); });
    for (var n = 0; n < essais.length; n++) {
      var tuiles = TR.empreinte(T, essais[n][0], essais[n][1], k2);
      if (tuiles && tuiles.every(function (t) {
        if (t.bat === b.id) return true;
        if (!TR.surIle(T, t) || t.bat || t.gue || t.rail || t.poteau || t.lampe || t.tir || t.eolienne || t.panneau) return false;
        if (t.obj && t.obj !== 'souche' && t.obj !== 'arbre') return false;
        return t.sol === 'herbe' || t.sol === 'roche' || t.sol === 'sable';
      })) return essais[n];
    }
    return null;
  }
  function deplacerEmpreinte(m, b, ancre, k) {
    var T = m.terrain;
    T.tuiles.forEach(function (t) { if (t.bat === b.id) t.bat = null; });
    b.i = ancre[0]; b.j = ancre[1]; b.k = k;
    var c = TR.centreEmpreinte(b.i, b.j, k); b.x = c[0]; b.y = c[1];
    (TR.empreinte(T, b.i, b.j, k) || []).forEach(function (t) {
      t.bat = b.id; t.deco = null; t.usure = 0;
      if (t.obj === 'souche' || t.obj === 'arbre') { t.obj = null; t.bois = 0; t.reserve = false; }
    });
  }
  function ouvrirCadeau(m, id) {
    var b = bat(m, id);
    if (!b || !b.cadeau) return null;
    var c = b.cadeau;
    b.cadeau = null;
    m.pieces += c.pieces || 0;
    m.idees += c.idees || 0;
    m.modernises = (m.modernises || 0) + 1;
    return c;
  }
  // ce qu'on peut faire de mieux avec un bâtiment : l'agrandir (maison), monter de niveau, ou bâtir l'étape suivante d'une merveille
  function amelioration(m, b) {
    if (!b || b.etat !== 'fini') return null;
    var d = D.batiments[b.type], sansPlace = null;
    if (d.merveille) {
      var et = b.etape == null ? 3 : b.etape;
      return et < 3 ? { genre: 'etape', etape: et + 1, cout: d.cout } : null;
    }
    if (d.evolue) {
      var evs = [].concat(d.evolue);
      for (var i = evs.length - 1; i >= 0; i--) {
        var ev = evs[i], cible = D.batiments[ev.vers];
        if (!cibleDispo(m, ev)) continue;
        // ADR-041 : un bâtiment qui produit prend la forme de son temps, au même endroit (il lui faut parfois plus de place)
        if (d.travail) {
          if (inactif(m, b)) break;
          var anc = ancreModerne(m, b, ev.vers);
          sansPlace = { genre: 'moderne', vers: ev.vers, cout: ev.cout || prixModerne(ev.vers), ancre: anc, place: !!anc };
          if (anc) return sansPlace;
          break; // pas la place : on peut encore monter de niveau en attendant
        }
        return { genre: 'maison', vers: ev.vers, cout: ev.cout, moderne: cible.epoque > (D.batiments[b.type].epoque || 1) };
      }
      if (!d.travail) return null;
    }
    var n = b.niveau || 1;
    if (d.travail && n < NIVEAU_MAX && !inactif(m, b)) {
      var base = d.prixNiveau || d.cout || 10;
      return { genre: 'niveau', niveau: n + 1, cout: Math.round(base * (n === 1 ? 1.5 : 3) / 5) * 5, sansPlace: sansPlace ? sansPlace.vers : null };
    }
    return sansPlace;
  }
  function ameliorer(m, id) {
    var b = bat(m, id), a = amelioration(m, b);
    if (!a || m.pieces < a.cout) return null;
    m.pieces -= a.cout;
    if (a.genre === 'moderne') {
      if (!a.place) { m.pieces += a.cout; return null; }
      // ceux qui y travaillaient laissent ce qu'ils faisaient : ils reprendront le travail du nouveau bâtiment
      m.habitants.forEach(function (h) { if (h.reserve === b.id) lacher(m, h); });
      b.ancien = b.type; b.ancienK = b.k; b.ancienXY = [b.x, b.y];
      b.type = a.vers;
      var k2 = D.batiments[a.vers].taille || 1;
      if (a.ancre[0] !== b.i || a.ancre[1] !== b.j || k2 !== b.k) deplacerEmpreinte(m, b, a.ancre, k2);
      b.besoin = D.batiments[a.vers].bois || 2;
      b.stock = 0;
      b.cadeauPrevu = cadeauDe(a.cout);
    } else if (a.genre === 'maison') {
      b.renove = D.batiments[b.type].lits || 0;
      b.ancien = b.type;
      b.type = a.vers;
      b.besoin = D.batiments[a.vers].bois;
      if (a.moderne) b.cadeauPrevu = cadeauDe(a.cout);
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
  // et à l'âge des métaux, certaines découvertes font mieux travailler (la hache de bronze, le tour du potier)
  function qteDe(tr, epoque, m) {
    var q = typeof tr.qte === 'object' ? (tr.qte[epoque] || tr.qte[1]) : tr.qte;
    if (tr.avec && m) Object.keys(tr.avec).forEach(function (k) { if (m.decouvertes[k]) q = Math.max(q, tr.avec[k]); });
    return q;
  }
  function quantite(b, m) { return qteDe(D.batiments[b.type].travail, m ? m.epoque : 1, m); }
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
    if (ph === 'aube') { m.jour = (m.jour || 0) + 1; nettoyerSouches(m); }
    if (ph === 'aube' && m.airSale === true) m.evenements.push({ type: 'air-sale', encore: true });
    m.evenements.push({ type: 'phase', phase: ph });
    if (ph === 'soir') manger(m);
    if (ph === 'soir' && m.epoque >= 6 && !m.decouvertes.ampoule && (m.nuitNoire === 'prevue' || m.nuitNoire === true)) {
      m.evenements.push({ type: 'nuit-noire', encore: m.nuitNoire === true });
      m.nuitNoire = true;
    }
    if (ph === 'nuit') {
      // les feux s'éteignent : tout le monde va se coucher
      m.habitants.forEach(function (h) { lacher(m, h); });
    }
  }
  // la réserve de nourriture : ce qu'on sait conserver (ADR-036)
  var RESERVE = { base: 30, 'sechoir-poissons': 20, grenier: 60, 'atelier-potier': 30, port: 40, moulin: 50, 'port-vapeur': 60, ferme: 70, supermarche: 90, 'grand-champ': 40, 'grand-elevage': 30, 'ferme-laitiere': 30 };
  // b.reserve : une grande exploitation garde au moins ce que gardaient les fermes de la ville qu'elle remplace (ADR-051)
  function reserveDe(b) { return Math.max(RESERVE[b.type] || 0, b.reserve || 0); }
  function reserveMax(m) {
    return m.batiments.reduce(function (s, b) { return s + (b.etat === 'fini' || b.niveau ? reserveDe(b) : 0); }, RESERVE.base);
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
    if (m.nuitNoire === true) return false; // la nuit noire en ville : le feu de camp n'éclaire plus les rues
    if (m.lampes && m.lampes.length) return true; // l'ampoule : toute la ville est éclairée le soir
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
      if ((!D.batiments[b.type].lits || b.enFeu) && b.type !== 'cercle-pierres') return;
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

  function planTravail(m, h, b) {
    var tr = D.batiments[b.type].travail;
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
    // fin du nomadisme : ce qu'on produit va tout seul au village, un peu à chaque tournée (ADR-029, ADR-037)
    var sedentaire = m.epoque >= 2;
    if (lieu) {
      et.push({ fait: 'aller', p: lieu });
      et.push({ fait: 'attendre', d: fois > 1 ? tr.duree * 2 : tr.duree, anim: 'travail', pose: pose });
      if (arbre) et.push({ fait: 'couper', i: arbre.i, j: arbre.j });
      if (proie) et.push({ fait: 'chasser', animal: proie.id });
      et.push({ fait: 'prendre', objet: objet });
    } else if (!foret) {
      var dedans = b.type === 'cercle-pierres'; // le sage s'assoit au milieu du cercle
      var grande = D.batiments[b.type].zone === 'campagne';
      var p = grande ? [b.x + (hasard(m) - 0.5) * b.k * TR.TW * 0.9, b.y + (hasard(m) - 0.5) * b.k * TR.TH * 0.8]
        : b.type === 'champ-ble' || b.type === 'enclos-moutons'
        ? [b.x + (hasard(m) - 0.5) * 120, b.y + (hasard(m) - 0.5) * 40] : dedans ? [b.x, b.y] : devant(m, b);
      et.push({ fait: 'aller', p: p });
      et.push({ fait: 'attendre', d: tr.duree, anim: 'travail', pose: pose, dans: dedans ? b.id : null });
    }
    if (lieu || foret) {
      et.push({ fait: 'aller', p: devant(m, b) });
      et.push({ fait: 'attendre', d: 0.6, anim: 'repos' });
      et.push({ fait: 'deposer' });
      // à l'atelier, on transforme la matière (l'argile devient un pot)
      if (sedentaire && tr.livre) et.push({ fait: 'attendre', d: 2, anim: 'travail', pose: pose });
    }
    if (sedentaire) { et.push({ fait: 'rapporter', bat: b.id, fois: fois }); return et; }
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
    var autour = surGue(b.type) ? TR.centre(m.terrain.gues[0][0], m.terrain.gues[0][1]) : [b.x, b.y];
    et.push({ fait: 'aller', p: surGue(b.type) ? autour : [b.x + (hasard(m) - 0.5) * 120, b.y + b.k * 26 + hasard(m) * 20] });
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
      var cap = b && !b.enFeu ? (b.etat === 'fini' ? (D.batiments[b.type].lits || 0) : (b.renove || 0)) : 0;
      if (!b || cap <= 0) { h.maison = null; return; }
      occupants[b.id] = (occupants[b.id] || 0) + 1;
    });
    m.habitants.forEach(function (h) {
      if (h.maison) return;
      var best = null, bd = 1e9;
      m.batiments.forEach(function (b) {
        var cap = b.enFeu ? 0 : b.etat === 'fini' ? (D.batiments[b.type].lits || 0) : (b.renove || 0);
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
        var nouvelle = h.allure === 'sage' ? 'sage' : h.enfant ? al.enfant : (h.metier && tenue(al, h.metier, h.id)) || choisir(m, al.adulte);
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
        // la nuit noire en ville : on avance à tâtons
        var vit = m.nuitNoire === true && estNuit(m) ? h.vitesse * 0.5 : h.vitesse;
        var pas = vit * reste;
        h.marche = true; h.anim = 'marche'; h.pose = null; h.dans = null;
        if (Math.abs(dx) > 2) h.dir = dx > 0 ? 1 : -1;
        TR.user(m.terrain, h.x, h.y, Math.min(reste, d / vit)); // l'herbe s'use sous les pas (ADR-013)
        if (d <= pas) {
          h.x = cible[0]; h.y = cible[1];
          reste -= d / vit;
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
              if (c.cadeauPrevu) {
                c.cadeau = c.cadeauPrevu; c.cadeauPrevu = null; c.ancien = null; c.ancienK = null; c.ancienXY = null;
                if (D.batiments[c.type].travail) (c.ouvriers || []).forEach(function (oid) { var ho = m.habitants.filter(function (x) { return x.id === oid; })[0]; if (ho) affecter(m, ho, c); });
                m.evenements.push({ type: 'modernise', bat: c.id });
              }
              if (c.etapeVisee) {
                c.etape = c.etapeVisee; c.etapeVisee = null;
                if (c.etape >= 3) m.evenements.push({ type: 'merveille', bat: c.id });
              }
              if (surGue(c.type)) { m.terrain.passerelle = true; if (c.type === 'pont-pierre') m.pontEmporte = false; }
              if (c.type === 'gare' && !m.rails) poserRails(m, c);
              if (c.type === 'centrale' || c.type === 'central-telephone') poserLigne(m, c, c.type === 'centrale' ? 'elec' : 'tel');
              if (c.type === 'pas-de-tir' && (!m.fusee || m.fusee === 'chantier')) { m.fusee = 'prete'; m.evenements.push({ type: 'fusee-prete', x: c.x, y: c.y }); }
              m.evenements.push({ type: 'fini', bat: c.id });
            }
          }
        } else if (e.fait === 'eteindre') {
          var bf = bat(m, e.bat);
          if (bf && bf.enFeu) {
            bf.enFeu = false;
            m.incendie = null;
            m.evenements.push({ type: 'eteint', bat: bf.id, x: bf.x, y: bf.y });
          }
          h.changeTenue = 2; // le pompier rentre se changer
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
    if (a.depart > 0) { a.depart -= dt; a.marche = false; return; } // les moutons du déménagement partent les uns après les autres
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
    var v = (a.espece === 'mammouth' ? 20 : a.espece === 'lapin' ? 55 : a.espece === 'mouton' ? 60 : 40) * dt;
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
    if (m.airSale === true && !aideNourrir) { m.arrivee = 0; return; } // l'air sale : plus personne n'a envie de venir habiter ici
    if (estNuit(m) && (!aFeu(m) || m.cycle.phase === 'nuit')) return;
    m.arrivee += dt;
    var delai = aFeu(m) ? DELAI_ARRIVEE / 2 : DELAI_ARRIVEE;
    if (m.arrivee < delai) return;
    m.arrivee = 0;
    var al = D.allures[m.epoque];
    var manque = m.batiments.filter(function (b) { return b.etat === 'fini' && (b.ouvriers || []).length < places(b) && !inactif(m, b); });
    var enfant = !manque.length && hasard(m) < 0.3;
    var allure = enfant ? al.enfant : (manque.length ? tenue(al, D.batiments[manque[0].type].travail.metier, m.prochainId) : choisir(m, al.adulte));
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
    crue(m);
    incendie(m);
    airSale(m);
    fusee(m, dt);
    m.animaux.forEach(function (a) { bougerAnimal(m, a, dt); });
    m.animaux = m.animaux.filter(function (a) { return !a.parti; });
    arrivees(m, dt);
    m.repousse += dt;
    if (m.repousse > 2) { TR.repousser(m.terrain, m.repousse); m.repousse = 0; }
  }

  function exporter(m) { var c = JSON.parse(JSON.stringify(m)); c.evenements = []; return c; }
  // Pour la sauvegarde confiée à Ludiworld : la carte est la même au départ pour toutes les parties (elle pèse 200 000 caractères),
  // on n'en garde que les cases qui ont changé (arbres abattus, chemins, bâtiments, île agrandie).
  // Les valeurs vides (null, false) des habitants, des bâtiments et des animaux ne sont pas gardées : le jeu les lit de la même façon
  // quand elles manquent (jamais de comparaison stricte avec null ou false). Les nombres restent, même à zéro.
  function sansVides(c) {
    var vider = function (o) { if (o && typeof o === 'object' && !Array.isArray(o)) Object.keys(o).forEach(function (k) { if (o[k] === null || o[k] === false) delete o[k]; }); };
    (c.habitants || []).forEach(function (h) { vider(h); (h.etapes || []).forEach(vider); });
    (c.batiments || []).forEach(vider);
    (c.animaux || []).forEach(vider);
    return c;
  }
  function exporterLeger(m) {
    var c = sansVides(arrondir(exporter(m))), T = c.terrain, base = TR.generer(), delta = [], meta = {};
    // une case changée : seulement ce qui a changé par rapport à la carte de départ (partiel), et les clés qui ont disparu (_sans)
    T.tuiles.forEach(function (t, i) {
      var b = base.tuiles[i], d = null;
      Object.keys(t).forEach(function (k) { if (JSON.stringify(t[k]) !== JSON.stringify(b[k])) { d = d || {}; d[k] = t[k]; } });
      Object.keys(b).forEach(function (k) { if (!(k in t)) { d = d || {}; (d._sans = d._sans || []).push(k); } });
      if (d) delta.push([i, d]);
    });
    Object.keys(T).forEach(function (k) { if (k !== 'tuiles') meta[k] = T[k]; });
    c.terrain = { leger: true, partiel: true, n: T.tuiles.length, meta: meta, delta: delta };
    return c;
  }
  // ADR-051 : une sauvegarde faite sur l'ancienne grille (44 x 44) est remise sur la nouvelle (64 x 64).
  // L'ancienne carte est au milieu de la nouvelle, décalée de P cases ; les positions en pixels bougent d'autant.
  var ANCIEN = TR.ANCIEN_N * TR.ANCIEN_N;
  function decalerPt(p, dx, dy) { if (Array.isArray(p) && typeof p[0] === 'number') { p[0] += dx; p[1] += dy; } }
  function decalerCase(c) { if (Array.isArray(c) && typeof c[0] === 'number') { c[0] += TR.P; c[1] += TR.P; } }
  function elargirMonde(o) {
    var P = TR.P, dx = (TR.N - TR.ANCIEN_N) * TR.TW, dy = 2 * P * TR.TH;
    var xy = function (a) { if (a && typeof a.x === 'number') { a.x += dx; a.y += dy; } };
    (o.batiments || []).forEach(function (b) {
      xy(b); if (typeof b.i === 'number') { b.i += P; b.j += P; }
      decalerPt(b.ancienXY, dx, dy);
    });
    (o.habitants || []).forEach(function (h) {
      xy(h);
      (h.etapes || []).forEach(function (e) {
        decalerPt(e.p, dx, dy);
        if (Array.isArray(e.route)) e.route.forEach(function (q) { decalerPt(q, dx, dy); });
        if (e.fait === 'couper' && typeof e.i === 'number') { e.i += P; e.j += P; }
      });
    });
    (o.animaux || []).forEach(function (a) {
      xy(a); decalerPt(a.fuit, dx, dy);
      (a.etapes || []).forEach(function (q) { if (Array.isArray(q)) decalerPt(q, dx, dy); else if (q && q.p) decalerPt(q.p, dx, dy); });
    });
    if (o.rails && o.rails.tuiles) o.rails.tuiles.forEach(decalerCase);
    ['lampes', 'eoliennes', 'panneaux'].forEach(function (k) { (o[k] || []).forEach(decalerCase); });
    (o.lignes || []).forEach(function (l) { (l.poteaux || []).forEach(decalerCase); });
    decalerCase(o.tir);
    var T = o.terrain;
    if (T) { decalerCase(T.gue); decalerCase(T.grotte); (T.gues || []).forEach(decalerCase); T.N = TR.N; }
    o.elargi = true;
    return o;
  }
  // les cases d'une ancienne carte (dans l'ordre de l'ancienne grille) posées au milieu de la nouvelle
  function poserAnciennes(base, anciennes) {
    anciennes.forEach(function (t, k) {
      var i = Math.floor(k / TR.ANCIEN_N) + TR.P, j = (k % TR.ANCIEN_N) + TR.P, n = base.tuiles[i * TR.N + j];
      if (n.campagne) return; // hors de l'ancienne île : personne n'y a rien changé, c'est la campagne d'aujourd'hui
      Object.keys(n).forEach(function (c) { if (!(c in t)) delete n[c]; });
      Object.keys(t).forEach(function (c) { n[c] = t[c]; });
      n.i = i; n.j = j;
    });
  }
  // Rend un monde complet, ou null si la sauvegarde ne correspond plus à la carte de ce jeu.
  // (les sauvegardes d'avant le monde moderne gardent des cases entières : partiel absent)
  function developper(o) {
    var L = o && o.terrain;
    if (!L || !L.leger) return o || null;
    var base = TR.generer(), ancienne = L.n === ANCIEN && base.tuiles.length !== ANCIEN;
    if (base.tuiles.length !== L.n && !ancienne) return null;
    var T = {};
    Object.keys(L.meta).forEach(function (k) { T[k] = L.meta[k]; });
    if (ancienne) {
      // on refait l'ancienne carte de départ (le milieu de la nouvelle), on y applique les changements, puis on la repose
      var vieilles = [];
      for (var a = 0; a < TR.ANCIEN_N; a++) for (var b = 0; b < TR.ANCIEN_N; b++) {
        var t0 = JSON.parse(JSON.stringify(base.tuiles[(a + TR.P) * TR.N + b + TR.P]));
        t0.i = a; t0.j = b; delete t0.campagne;
        vieilles.push(t0);
      }
      appliquer(vieilles, L);
      poserAnciennes(base, vieilles);
      T.tuiles = base.tuiles;
      o.terrain = T;
      return elargirMonde(o);
    }
    T.tuiles = base.tuiles;
    appliquer(T.tuiles, L);
    o.terrain = T;
    return o;
  }
  function appliquer(tuiles, L) {
    L.delta.forEach(function (d) {
      if (!L.partiel) { tuiles[d[0]] = d[1]; return; }
      var t = tuiles[d[0]];
      Object.keys(d[1]).forEach(function (k) { if (k !== '_sans') t[k] = d[1][k]; });
      (d[1]._sans || []).forEach(function (k) { delete t[k]; });
    });
  }
  // une sauvegarde complète (toutes les cases) de l'ancienne grille
  function elargir(o) {
    if (!o || !o.terrain || !o.terrain.tuiles || o.terrain.tuiles.length !== ANCIEN || TR.N === TR.ANCIEN_N) return o;
    var base = TR.generer();
    poserAnciennes(base, o.terrain.tuiles);
    o.terrain.tuiles = base.tuiles;
    return elargirMonde(o);
  }
  function importer(o) {
    o.evenements = [];
    elargir(o);
    // l'île grandit d'une époque de plus : on reprend de la carte de départ à quelle époque chaque case rejoint l'île
    // (une partie sauvée avant l'âge des métaux n'avait pas le dernier anneau)
    if (o.terrain && o.terrain.tuiles) {
      var base = TR.generer();
      if (base.tuiles.length === o.terrain.tuiles.length) o.terrain.tuiles.forEach(function (t, i) { t.ile = base.tuiles[i].ile; });
    }
    if (o.nourriture == null) { o.nourriture = 30; o.faim = 0; }
    if (o.batiments.some(function (b) { return b.type === 'pont-pierre'; }) && o.terrain && o.terrain.tuiles) degagerPont(o);
    if (o.rails && o.terrain && o.terrain.tuiles) degagerRails(o);
    if (o.epoque >= 6 && o.terrain && o.terrain.tuiles) eclaircirSouches(o); // plus de grand champ de souches (aussi dans une partie reprise) // le tunnel n'est plus caché par la forêt (aussi dans une partie reprise)
    o.batiments.forEach(function (b) {
      if (!b.ouvriers) { b.ouvriers = b.ouvrier ? [b.ouvrier] : []; delete b.ouvrier; }
      if (D.batiments[b.type] && D.batiments[b.type].merveille && b.etape == null) b.etape = 3;
    });
    // ADR-051, aussi dans une partie reprise : les monuments grandissent s'ils ont la place, et une partie déjà à la vapeur
    // (ou plus tard) vit le grand déménagement des fermes à son retour
    if (o.terrain && o.terrain.tuiles) {
      agrandirMerveilles(o);
      prolongerRails(o);
      if (o.epoque >= 5 && !o.demenage) demenager(o);
    }
    return o;
  }

  return {
    nouveau: nouveau, pas: pas, construire: construire, construisibles: construisibles,
    emplacementsLibres: emplacementsLibres, ancrePour: ancrePour, ancreValide: ancreValide,
    peutConstruire: peutConstruire, aDeLaPlace: aDeLaPlace,
    decouvertesEpoque: decouvertesEpoque, etatDecouverte: etatDecouverte, decouvrir: decouvrir,
    epoqueTerminee: epoqueTerminee, passerEpoque: passerEpoque, recolter: recolter, poserRails: poserRails, poserLigne: poserLigne, allumerVille: allumerVille,
    poserEoliennes: poserEoliennes, poserPasDeTir: poserPasDeTir, reserverTir: reserverTir, decoller: decoller, partieFinie: partieFinie, derniereEpoque: derniereEpoque,
    DUREE_VOL: DUREE_VOL, NOUVELLE_FUSEE: NOUVELLE_FUSEE, DELAI_AIR: DELAI_AIR,
    lits: lits, bat: bat, exporter: exporter, arrondir: arrondir, sansVides: sansVides, importer: importer, exporterLeger: exporterLeger, developper: developper, elargir: elargir, demenager: demenager, agrandirMerveilles: agrandirMerveilles, prolongerRails: prolongerRails, FERMES_VILLE: FERMES_VILLE, BULLES_MAX: BULLES_MAX,
    heure: heure, obscurite: obscurite, estNuit: estNuit, eclaire: eclaire, RAYON_FEU: RAYON_FEU,
    phase: phase, reveiller: reveiller, toutLeMondeDort: toutLeMondeDort, DUREES: DUREES,
    amelioration: amelioration, ameliorer: ameliorer, ouvrirCadeau: ouvrirCadeau, depasse: depasse, quantite: quantite, NIVEAU_MAX: NIVEAU_MAX,
    REPAS: REPAS, reserveMax: reserveMax, RESERVE: RESERVE, qteDe: qteDe, besoinRepas: besoinRepas, assezAManger: assezAManger, places: places, merveilleFinie: merveilleFinie, inactif: inactif
  };
})();
if (typeof module !== 'undefined') module.exports = Monde;
