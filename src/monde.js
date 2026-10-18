// Simulation du monde : pure, sans DOM, testable sous node.
// Habitants = petits agents avec une file d'étapes (ADR-010), sur une carte en tuiles (ADR-012).
var Monde = (function () {
  var D = typeof Donnees !== 'undefined' ? Donnees : require('./data.js');
  var TR = typeof Terrain !== 'undefined' ? Terrain : require('./terrain.js');

  var BULLES_MAX = 3; // unités de production stockées par bâtiment
  var VITESSE = { adulte: 80, enfant: 110, sage: 50 };
  var DELAI_ARRIVEE = 25;
  // Jour et nuit (ADR-011) : 150 s de jour, 60 s de nuit. La partie commence le matin.
  var CYCLE = 210, DEBUT = 20;
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
      pieces: 12, idees: 0, epoque: 1, decouvertes: {},
      batiments: [], habitants: [], animaux: [],
      arrivee: 0, evenements: [], fini: false, repousse: 0,
      terrain: TR.generer()
    };
    var C = [TR.CI, TR.CJ];
    var cercle = poserPres(m, 'cercle-pierres', C, true);
    var tas = poserPres(m, 'tas-bois', [C[0] - 3, C[1] + 1], true);
    poserPres(m, 'tente', [C[0] + 1, C[1] + 3], true);
    poserPres(m, 'tente', [C[0] + 3, C[1] - 1], true);
    var sage = ajouterHabitant(m, { allure: 'sage', metier: 'sage', x: cercle.x + 40, y: cercle.y + 50 });
    affecter(m, sage, cercle);
    var b = ajouterHabitant(m, { allure: 'porteur-bois', x: tas.x + 50, y: tas.y + 30 });
    affecter(m, b, tas);
    ajouterHabitant(m, { allure: 'cueilleuse', x: cercle.x - 80, y: cercle.y + 70 });
    var zm = pointLibre(m, TR.centre(TR.CI + 5, TR.CJ - 8), 3, function (t) { return t.sauvage; });
    m.animaux.push({ id: m.prochainId++, espece: 'mammouth', x: zm[0], y: zm[1], etapes: [], dir: -1, marche: false });
    m.evenements.push({ type: 'epoque', epoque: 1 });
    return m;
  }

  function poser(m, type, i, j, fini) {
    var def = D.batiments[type], k = def.taille || 1, T = m.terrain;
    var c = TR.centreEmpreinte(i, j, k);
    var bat = {
      id: m.prochainId++, type: type, i: i, j: j, k: k, x: c[0], y: c[1],
      etat: fini ? 'fini' : 'chantier', livre: 0, besoin: def.bois || 0, enRoute: 0,
      stock: 0, ouvrier: null, apparu: fini ? -10 : null, cree: m.t
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
      pouf: 0, reserve: null
    };
    m.habitants.push(h);
    return h;
  }

  function affecter(m, h, bat) {
    var def = D.batiments[bat.type];
    h.travail = bat.id;
    h.metier = def.travail.metier;
    bat.ouvrier = h.id;
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
    // la ville améliore d'elle-même ce qui existe (ADR-008)
    m.batiments.forEach(function (b) {
      var d = D.batiments[b.type];
      if (b.etat === 'fini' && d.ameliore) {
        b.renove = d.lits || 0;
        b.ancien = b.type;
        b.type = d.ameliore;
        b.etat = 'chantier';
        b.livre = 0;
        b.besoin = D.batiments[b.type].bois;
        b.enRoute = 0;
        b.cree = m.t;
      }
    });
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

  function recolter(m, id) {
    var b = bat(m, id);
    if (!b || b.stock <= 0) return null;
    var tr = D.batiments[b.type].travail;
    var n = b.stock * tr.qte;
    b.stock = 0;
    if (tr.produit === 'idees') m.idees += n; else m.pieces += n;
    return { produit: tr.produit, n: n };
  }

  // ---------- jour et nuit ----------
  function heure(m) { return ((m.t + DEBUT) % CYCLE) / CYCLE; }
  function obscurite(m) {
    var h = heure(m), J = 150 / CYCLE;
    if (h < J - 0.05) return 0;
    if (h < J) return (h - (J - 0.05)) / 0.05;
    if (h < 0.96) return 1;
    return 1 - (h - 0.96) / 0.04;
  }
  function estNuit(m) { return obscurite(m) > 0.5; }
  function feux(m) { return m.batiments.filter(function (b) { return b.type === 'feu' && b.etat === 'fini'; }); }
  function eclaire(m, p) {
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

  function planTravail(m, h, b) {
    var tr = D.batiments[b.type].travail;
    var et = [], lieu = null, arbre = null;
    var depuis = [b.x, b.y];
    if (tr.aller === 'mammouth') {
      var mam = m.animaux.filter(function (a) { return a.espece === 'mammouth' && !a.part; })[0];
      lieu = mam ? [mam.x - 110 + hasard(m) * 40, mam.y + 30 + hasard(m) * 20] : null;
    } else if (tr.aller === 'foret') {
      arbre = arbreProche(m, depuis);
      if (arbre) { arbre.reserve = true; var q = centreTuile(arbre); lieu = [q[0] + 30, q[1] + 22]; }
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
    if (lieu) {
      et.push({ fait: 'aller', p: lieu });
      et.push({ fait: 'attendre', d: tr.duree, anim: 'travail' });
      if (arbre) et.push({ fait: 'couper', i: arbre.i, j: arbre.j });
      et.push({ fait: 'prendre', objet: tr.porte });
      et.push({ fait: 'aller', p: devant(m, b) });
      et.push({ fait: 'attendre', d: 0.6, anim: 'repos' });
      et.push({ fait: 'deposer' });
    } else {
      var p = b.type === 'champ-ble' || b.type === 'enclos-moutons'
        ? [b.x + (hasard(m) - 0.5) * 120, b.y + (hasard(m) - 0.5) * 40] : devant(m, b);
      et.push({ fait: 'aller', p: p });
      et.push({ fait: 'attendre', d: tr.duree, anim: 'travail' });
    }
    et.push({ fait: 'produire', bat: b.id });
    return et;
  }

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

  function planNuit(m, h) {
    var f = feuProche(m, [h.x, h.y]);
    if (f) {
      h.etapes = [{ fait: 'aller', p: pointLibre(m, [f.x, f.y], 1.5) }, { fait: 'attendre', d: 3 + hasard(m) * 4, anim: h.enfant ? 'jeu' : 'repos' }];
      return;
    }
    var mai = maisonProche(m, [h.x, h.y]);
    h.etapes = [{ fait: 'aller', p: mai ? devant(m, mai) : [h.x, h.y] }, { fait: 'dormir' }];
  }

  function decider(m, h) {
    var b = h.travail ? bat(m, h.travail) : null;
    if (estNuit(m)) {
      // la nuit, on ne travaille que dans la lumière d'un feu (ADR-011)
      var ch0 = chantierEnAttente(m);
      var tas = m.batiments.filter(function (t) { return t.type === 'tas-bois' && t.etat === 'fini'; })[0];
      if (!h.enfant && !b && ch0 && eclaire(m, [ch0.x, ch0.y]) && (!tas || eclaire(m, [tas.x, tas.y]))) { h.etapes = planChantier(m, h, ch0); return; }
      if (!h.enfant && b && b.etat === 'fini' && b.stock < BULLES_MAX && eclaire(m, [b.x, b.y])) {
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
      if (b.stock >= BULLES_MAX) {
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
        h.marche = true; h.anim = 'marche';
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
      } else if (e.fait === 'dormir') {
        h.marche = false;
        if (estNuit(m)) { h.dort = true; h.anim = 'dort'; reste = 0; }
        else { h.dort = false; h.etapes.shift(); }
      } else if (e.fait === 'attendre') {
        h.marche = false;
        h.anim = e.anim || 'repos';
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
              if (c.type === 'passerelle') m.terrain.passerelle = true;
              m.evenements.push({ type: 'fini', bat: c.id });
            }
          }
        } else if (e.fait === 'produire') {
          var pb = bat(m, e.bat);
          if (pb && pb.stock < BULLES_MAX) { pb.stock++; m.evenements.push({ type: 'bulle', bat: pb.id }); }
        }
        h.etapes.shift();
      }
    }
  }

  function bougerAnimal(m, a, dt) {
    if (!a.etapes.length) {
      if (a.part) { a.parti = true; return; }
      if (a.attente > 0) { a.attente -= dt; a.marche = false; return; }
      if (estNuit(m)) { a.marche = false; return; }
      var p = a.espece === 'mammouth'
        ? pointLibre(m, [a.x, a.y], 2.5, function (t) { return t.sauvage && t.sol === 'herbe'; })
        : pointLibre(m, lieuDeRepos(m), 4);
      a.etapes = [p];
      a.attente = 3 + hasard(m) * 6;
    }
    var c = a.etapes[0], dx = c[0] - a.x, dy = c[1] - a.y, d = Math.hypot(dx, dy);
    var v = (a.espece === 'mammouth' ? 20 : 40) * dt;
    a.marche = true;
    if (Math.abs(dx) > 2) a.dir = dx > 0 ? 1 : -1;
    if (d <= v) { a.x = c[0]; a.y = c[1]; a.etapes.shift(); } else { a.x += dx / d * v; a.y += dy / d * v; }
  }

  function arrivees(m, dt) {
    if (m.habitants.length >= lits(m)) { m.arrivee = 0; return; }
    if (estNuit(m) && !aFeu(m)) return;
    m.arrivee += dt;
    var delai = aFeu(m) ? DELAI_ARRIVEE / 2 : DELAI_ARRIVEE;
    if (m.arrivee < delai) return;
    m.arrivee = 0;
    var al = D.allures[m.epoque];
    var manque = m.batiments.filter(function (b) { return b.etat === 'fini' && D.batiments[b.type].travail && !b.ouvrier; });
    var enfant = !manque.length && hasard(m) < 0.3;
    var allure = enfant ? al.enfant : (manque.length ? al[D.batiments[manque[0].type].travail.metier] : choisir(m, al.adulte));
    // on arrive par la plage
    var dep = pointLibre(m, TR.centre(TR.CI + 6, TR.CJ + 6), 2, function (t) { return t.sol === 'sable' || t.sol === 'herbe'; });
    var h = ajouterHabitant(m, { allure: allure || choisir(m, al.adulte), enfant: enfant, x: dep[0], y: dep[1] });
    h.etapes = [{ fait: 'aller', p: pointLibre(m, lieuDeRepos(m), 2) }];
    m.evenements.push({ type: 'arrivee', hab: h.id });
  }

  function embaucher(m) {
    m.batiments.forEach(function (b) {
      var d = D.batiments[b.type];
      if (b.etat !== 'fini' || !d.travail || b.ouvrier) return;
      var libres = adultesLibres(m).filter(function (h) { return h.allure !== 'sage' || d.travail.metier === 'sage'; });
      if (!libres.length) return;
      var best = libres[0], bd = 1e9;
      libres.forEach(function (h) { var dd = Math.hypot(h.x - b.x, h.y - b.y); if (dd < bd) { bd = dd; best = h; } });
      affecter(m, best, b);
    });
  }

  function pas(m, dt) {
    m.t += dt;
    embaucher(m);
    m.habitants.forEach(function (h) { avancer(m, h, dt); });
    m.animaux.forEach(function (a) { bougerAnimal(m, a, dt); });
    m.animaux = m.animaux.filter(function (a) { return !a.parti; });
    arrivees(m, dt);
    m.repousse += dt;
    if (m.repousse > 2) { TR.repousser(m.terrain, m.repousse); m.repousse = 0; }
  }

  function exporter(m) { var c = JSON.parse(JSON.stringify(m)); c.evenements = []; return c; }
  function importer(o) { o.evenements = []; return o; }

  return {
    nouveau: nouveau, pas: pas, construire: construire, construisibles: construisibles,
    emplacementsLibres: emplacementsLibres, ancrePour: ancrePour, ancreValide: ancreValide,
    peutConstruire: peutConstruire, aDeLaPlace: aDeLaPlace,
    decouvertesEpoque: decouvertesEpoque, etatDecouverte: etatDecouverte, decouvrir: decouvrir,
    epoqueTerminee: epoqueTerminee, passerEpoque: passerEpoque, recolter: recolter,
    lits: lits, bat: bat, exporter: exporter, importer: importer, BULLES_MAX: BULLES_MAX,
    heure: heure, obscurite: obscurite, estNuit: estNuit, eclaire: eclaire, RAYON_FEU: RAYON_FEU
  };
})();
if (typeof module !== 'undefined') module.exports = Monde;
