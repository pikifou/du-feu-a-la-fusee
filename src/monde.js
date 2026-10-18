// Simulation du monde : pure, sans DOM, testable sous node.
// Habitants = petits agents avec une file d'étapes (ADR-010).
var Monde = (function () {
  var D = typeof Donnees !== 'undefined' ? Donnees : require('./data.js');
  var C = typeof Carte !== 'undefined' ? Carte : require('./carte.js');

  var BULLES_MAX = 3; // unités de production stockées par bâtiment
  var VITESSE = { adulte: 85, enfant: 125, sage: 55 };
  var DELAI_ARRIVEE = 25;

  // ---------- outils ----------
  function hasard(m) {
    // mulberry32
    m.graine = (m.graine + 0x6d2b79f5) | 0;
    var t = m.graine;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function choisir(m, liste) { return liste[Math.floor(hasard(m) * liste.length)]; }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function plusProche(p, liste) {
    var best = null, bd = 1e9;
    liste.forEach(function (q) { var d = dist(p, q); if (d < bd) { bd = d; best = q; } });
    return best;
  }
  function dedans(p, poly) {
    var x = p[0], y = p[1], c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function riviereX(y) {
    var r = C.riviere;
    if (y <= r[0][1]) return r[0][0];
    for (var i = 1; i < r.length; i++) {
      if (y <= r[i][1]) {
        var k = (y - r[i - 1][1]) / (r[i][1] - r[i - 1][1]);
        return r[i - 1][0] + k * (r[i][0] - r[i - 1][0]);
      }
    }
    return r[r.length - 1][0];
  }
  function cote(p) { return p[0] > riviereX(p[1]) ? 'droite' : 'gauche'; }
  function chemin(de, vers) {
    var a = cote(de), b = cote(vers);
    if (a === b) return [vers];
    var g = C.gue;
    return a === 'gauche' ? [g.gauche, g.milieu, g.droite, vers] : [g.droite, g.milieu, g.gauche, vers];
  }
  function pointPrairie(m, autour, rayon) {
    for (var i = 0; i < 20; i++) {
      var a = hasard(m) * Math.PI * 2, r = rayon * Math.sqrt(hasard(m));
      var p = [autour[0] + Math.cos(a) * r, autour[1] + Math.sin(a) * r * 0.55];
      if (dedans(p, C.prairie)) return p;
    }
    return autour.slice();
  }

  // ---------- création ----------
  function nouveau(graine) {
    var m = {
      t: 0, graine: graine || 12345, prochainId: 1,
      pieces: 12, idees: 0, epoque: 1, decouvertes: {},
      batiments: [], habitants: [], animaux: [],
      arrivee: 0, evenements: [], fini: false
    };
    var dep = C.depart;
    var cercle = poser(m, 'cercle-pierres', 'pre', dep.cercle, true);
    var tas = poser(m, 'tas-bois', 'pre', dep['tas-bois'], true);
    dep.tentes.forEach(function (p) { poser(m, 'tente', 'pre', p, true); });
    var sage = ajouterHabitant(m, { allure: 'sage', metier: 'sage', x: dep.cercle[0] + 60, y: dep.cercle[1] + 30 });
    affecter(m, sage, cercle);
    var b = ajouterHabitant(m, { allure: 'porteur-bois', x: 1000, y: 900 });
    affecter(m, b, tas);
    ajouterHabitant(m, { allure: 'cueilleuse', x: 1250, y: 960 });
    m.animaux.push({ id: m.prochainId++, espece: 'mammouth', x: 760, y: 690, etapes: [], dir: 1, marche: false });
    m.evenements.push({ type: 'epoque', epoque: 1 });
    return m;
  }

  function poser(m, type, zone, p, fini) {
    var def = D.batiments[type];
    var bat = {
      id: m.prochainId++, type: type, zone: zone, x: p[0], y: p[1],
      etat: fini ? 'fini' : 'chantier', livre: 0, besoin: def.bois || 0, enRoute: 0,
      stock: 0, ouvrier: null, apparu: fini ? -10 : null, cree: m.t
    };
    m.batiments.push(bat);
    return bat;
  }

  function ajouterHabitant(m, o) {
    var enfant = !!o.enfant;
    var h = {
      id: m.prochainId++, allure: o.allure, enfant: enfant, metier: o.metier || null, travail: null,
      x: o.x, y: o.y, etapes: [], porte: null, dir: 1, marche: false, anim: 'repos', minuteur: 0,
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
      var l = b.etat === 'fini' ? (d.lits || 0) : (b.renove ? b.renove : 0);
      return s + l;
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

  // Dans le pré, les emplacements ne sont pas fixes : on cherche des places libres
  // sur une grille fine, en tenant compte de la taille de chaque bâtiment.
  var grillePre = null;
  function grille() {
    if (grillePre) return grillePre;
    grillePre = [];
    var o = C.depart.cercle;
    var reserves = [].concat(C.emplacements.rive, C.emplacements.grotte, C.emplacements.plage);
    [[C.prairie, 70], [C.riveDroite, 45]].forEach(function (t) {
      for (var i = -26; i <= 26; i++) for (var j = -26; j <= 26; j++) {
        var p = [o[0] + (i + j) * 55, o[1] + (i - j) * 30];
        if (!dedans(p, t[0]) || distBord(p, t[0]) <= t[1]) continue;
        if (reserves.some(function (q) { return !assezLoin(p, 120, q, 160); })) continue;
        if (Math.hypot(p[0] - C.gue.gauche[0], p[1] - C.gue.gauche[1]) < 120) continue;
        grillePre.push(p);
      }
    });
    grillePre.sort(function (a, b) { return dist(a, o) - dist(b, o); });
    return grillePre;
  }
  function distBord(p, poly) {
    var best = 1e9;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var ax = poly[j][0], ay = poly[j][1], dx = poly[i][0] - ax, dy = poly[i][1] - ay;
      var t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy));
    }
    return best;
  }
  function assezLoin(p, w, q, wq) {
    return Math.hypot(p[0] - q[0], (p[1] - q[1]) / 0.55) >= (w + wq) / 2 * 0.78;
  }
  function emplacementsLibres(m, type) {
    var d = D.batiments[type];
    if (d.zone !== 'pre') {
      return (C.emplacements[d.zone] || []).filter(function (p) {
        return !m.batiments.some(function (b) { return b.x === p[0] && b.y === p[1]; });
      });
    }
    var w = d.largeur, choisis = [];
    grille().forEach(function (p) {
      var libre = m.batiments.every(function (b) {
        return assezLoin(p, w, [b.x, b.y], D.batiments[b.type].largeur);
      }) && choisis.every(function (q) { return assezLoin(p, w, q, w); });
      if (libre) choisis.push(p);
    });
    return choisis;
  }

  function peutConstruire(m, type) {
    var d = D.batiments[type];
    return construisibles(m).indexOf(type) >= 0 && m.pieces >= d.cout && emplacementsLibres(m, type).length > 0;
  }

  function construire(m, type, p) {
    if (!peutConstruire(m, type)) return null;
    var libres = emplacementsLibres(m, type);
    if (!libres.some(function (q) { return q[0] === p[0] && q[1] === p[1]; })) return null;
    m.pieces -= D.batiments[type].cout;
    var b = poser(m, type, D.batiments[type].zone, p, false);
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
    if (decouvertesEpoque(m).every(function (k) { return m.decouvertes[k]; })) {
      m.evenements.push({ type: 'fin-epoque', epoque: m.epoque });
    }
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
    if (m.epoque === 2) {
      var pass = poser(m, 'passerelle', 'gue', C.gue.milieu, false);
      pass.automatique = true;
      // le mammouth s'en va, les chèvres arrivent
      m.animaux.forEach(function (a) { if (a.espece === 'mammouth') { a.part = true; a.etapes = [[380, 760]]; } });
      for (var i = 0; i < 2; i++) m.animaux.push({ id: m.prochainId++, espece: 'chevre', x: C.arrivee[0] + i * 40, y: C.arrivee[1], etapes: [], dir: 1, marche: false });
    }
    // les habitants changent de tenue, un par un
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

  // ---------- comportement des habitants ----------
  function devant(b) { return [b.x + 10, b.y + 28]; }

  function planTravail(m, h, b) {
    var tr = D.batiments[b.type].travail;
    var et = [];
    var lieu = null;
    if (tr.aller === 'champ') {
      var champs = m.batiments.filter(function (c) { return c.type === 'champ-ble' && c.etat === 'fini'; });
      if (champs.length) { var c = choisir(m, champs); lieu = [c.x + (hasard(m) - 0.5) * 80, c.y - 10 + (hasard(m) - 0.5) * 30]; }
    } else if (tr.aller) {
      var pts = C.points[tr.aller];
      var q = tr.aller === 'grotte' || tr.aller === 'plage' ? choisir(m, pts) : plusProche([b.x, b.y], pts);
      if (tr.aller === 'foret' && hasard(m) < 0.5) q = choisir(m, pts);
      lieu = [q[0] + (hasard(m) - 0.5) * 40, q[1] + (hasard(m) - 0.5) * 20];
    }
    if (lieu) {
      et.push({ fait: 'aller', p: lieu });
      et.push({ fait: 'attendre', d: tr.duree, anim: 'travail' });
      et.push({ fait: 'prendre', objet: tr.porte });
      et.push({ fait: 'aller', p: devant(b) });
      et.push({ fait: 'attendre', d: 0.6, anim: 'repos' });
      et.push({ fait: 'deposer' });
    } else {
      var p = b.type === 'champ-ble' || b.type === 'enclos-moutons'
        ? [b.x + (hasard(m) - 0.5) * 90, b.y - 15 + (hasard(m) - 0.5) * 30] : devant(b);
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
      et.push({ fait: 'aller', p: [tas.x + 30 + hasard(m) * 30, tas.y + 25] });
      et.push({ fait: 'attendre', d: 1, anim: 'travail' });
    }
    et.push({ fait: 'prendre', objet: 'bois' });
    et.push({ fait: 'aller', p: [b.x + (hasard(m) - 0.5) * 110, b.y + 20 + hasard(m) * 25] });
    et.push({ fait: 'deposer' });
    et.push({ fait: 'attendre', d: 2.2, anim: 'marteau' });
    et.push({ fait: 'livrer', bat: b.id });
    return et;
  }

  function lieuDeRepos(m) {
    var feu = m.batiments.filter(function (b) { return b.type === 'feu' && b.etat === 'fini'; })[0];
    var cercle = m.batiments.filter(function (b) { return b.type === 'cercle-pierres'; })[0];
    var c = feu || cercle;
    return c ? [c.x, c.y + 40] : [1180, 900];
  }

  function adultesLibres(m) {
    return m.habitants.filter(function (h) { return !h.enfant && !h.travail && !h.reserve; });
  }

  function decider(m, h) {
    var b = h.travail ? bat(m, h.travail) : null;
    if (h.enfant) {
      var p = pointPrairie(m, lieuDeRepos(m), 380);
      h.etapes = [{ fait: 'aller', p: p }, { fait: 'attendre', d: 0.5 + hasard(m) * 2, anim: 'jeu' }];
      return;
    }
    var ch = chantierEnAttente(m);
    if (!b && ch) { h.etapes = planChantier(m, h, ch); return; }
    if (b && b.etat === 'fini') {
      // un travailleur aide au chantier si personne n'est libre (sauf le sage)
      if (ch && h.metier !== 'sage' && adultesLibres(m).length === 0 && hasard(m) < 0.5) {
        h.etapes = planChantier(m, h, ch); return;
      }
      if (b.stock >= BULLES_MAX) {
        h.etapes = [{ fait: 'aller', p: pointPrairie(m, devant(b), 70) }, { fait: 'attendre', d: 3, anim: 'repos' }];
        return;
      }
      h.etapes = planTravail(m, h, b);
      return;
    }
    // flâner près du feu
    var q = hasard(m) < 0.3 ? pointPrairie(m, [1250, 860], 520) : pointPrairie(m, lieuDeRepos(m), 230);
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
    var reste = dt;
    var garde = 0;
    while (reste > 0 && garde++ < 20) {
      if (!h.etapes.length) { decider(m, h); if (!h.etapes.length) return; }
      var e = h.etapes[0];
      if (e.fait === 'aller') {
        if (!e.route) e.route = chemin([h.x, h.y], e.p);
        var cible = e.route[0];
        var dx = cible[0] - h.x, dy = cible[1] - h.y, d = Math.hypot(dx, dy);
        var pas = h.vitesse * reste;
        h.marche = true;
        h.anim = 'marche';
        if (Math.abs(dx) > 2) h.dir = dx > 0 ? 1 : -1;
        if (d <= pas) {
          h.x = cible[0]; h.y = cible[1];
          reste -= d / h.vitesse;
          e.route.shift();
          if (!e.route.length) h.etapes.shift();
        } else {
          h.x += dx / d * pas; h.y += dy / d * pas; reste = 0;
        }
      } else if (e.fait === 'attendre') {
        h.marche = false;
        h.anim = e.anim || 'repos';
        if (e.reste == null) e.reste = e.d;
        if (e.reste > reste) { e.reste -= reste; reste = 0; } else { reste -= e.reste; h.etapes.shift(); }
      } else {
        h.marche = false;
        if (e.fait === 'prendre') h.porte = e.objet;
        else if (e.fait === 'deposer') h.porte = null;
        else if (e.fait === 'livrer') {
          var c = bat(m, e.bat);
          h.reserve = null;
          if (c && c.etat === 'chantier') {
            c.enRoute = Math.max(0, c.enRoute - 1);
            c.livre++;
            if (c.livre >= c.besoin) {
              c.etat = 'fini'; c.apparu = m.t; c.renove = 0;
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
      var p = a.espece === 'mammouth' ? choisir(m, C.lisiere) : pointPrairie(m, lieuDeRepos(m), 330);
      a.etapes = [[p[0] + (hasard(m) - 0.5) * 60, p[1] + (hasard(m) - 0.5) * 30]];
      a.attente = 3 + hasard(m) * 6;
    }
    var c = a.etapes[0], dx = c[0] - a.x, dy = c[1] - a.y, d = Math.hypot(dx, dy);
    var v = (a.espece === 'mammouth' ? 22 : 45) * dt;
    a.marche = true;
    if (Math.abs(dx) > 2) a.dir = dx > 0 ? 1 : -1;
    if (d <= v) { a.x = c[0]; a.y = c[1]; a.etapes.shift(); } else { a.x += dx / d * v; a.y += dy / d * v; }
  }

  function arrivees(m, dt) {
    var pop = m.habitants.length;
    if (pop >= lits(m)) { m.arrivee = 0; return; }
    m.arrivee += dt;
    var delai = aFeu(m) ? DELAI_ARRIVEE / 2 : DELAI_ARRIVEE;
    if (m.arrivee < delai) return;
    m.arrivee = 0;
    var al = D.allures[m.epoque];
    var manque = m.batiments.filter(function (b) { return b.etat === 'fini' && D.batiments[b.type].travail && !b.ouvrier; });
    var enfant = !manque.length && hasard(m) < 0.3;
    var allure = enfant ? al.enfant : (manque.length ? al[D.batiments[manque[0].type].travail.metier] : choisir(m, al.adulte));
    var h = ajouterHabitant(m, { allure: allure || choisir(m, al.adulte), enfant: enfant, x: C.arrivee[0], y: C.arrivee[1] });
    h.etapes = [{ fait: 'aller', p: pointPrairie(m, lieuDeRepos(m), 150) }];
    m.evenements.push({ type: 'arrivee', hab: h.id });
  }

  function embaucher(m) {
    m.batiments.forEach(function (b) {
      var d = D.batiments[b.type];
      if (b.etat !== 'fini' || !d.travail || b.ouvrier) return;
      var libres = adultesLibres(m).filter(function (h) { return h.allure !== 'sage' || d.travail.metier === 'sage'; });
      if (!libres.length) return;
      var h = plusProcheHab(libres, b);
      affecter(m, h, b);
    });
  }
  function plusProcheHab(liste, b) {
    var best = liste[0], bd = 1e9;
    liste.forEach(function (h) { var d = Math.hypot(h.x - b.x, h.y - b.y); if (d < bd) { bd = d; best = h; } });
    return best;
  }

  function pas(m, dt) {
    m.t += dt;
    embaucher(m);
    m.habitants.forEach(function (h) { avancer(m, h, dt); });
    m.animaux.forEach(function (a) { bougerAnimal(m, a, dt); });
    m.animaux = m.animaux.filter(function (a) { return !a.parti; });
    arrivees(m, dt);
  }

  function exporter(m) { var c = JSON.parse(JSON.stringify(m)); c.evenements = []; return c; }
  function importer(o) { o.evenements = []; return o; }

  return {
    nouveau: nouveau, pas: pas, construire: construire, construisibles: construisibles,
    emplacementsLibres: emplacementsLibres, peutConstruire: peutConstruire,
    decouvertesEpoque: decouvertesEpoque, etatDecouverte: etatDecouverte, decouvrir: decouvrir,
    epoqueTerminee: epoqueTerminee, passerEpoque: passerEpoque, recolter: recolter,
    lits: lits, bat: bat, exporter: exporter, importer: importer, BULLES_MAX: BULLES_MAX
  };
})();
if (typeof module !== 'undefined') module.exports = Monde;
