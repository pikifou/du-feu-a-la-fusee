// Les routes de la ville (ADR-044) : elles naissent toutes seules. Calcul pur, sans DOM, testable sous node.
// Trois façons de les faire naître, à comparer dans le bac à sable (?bac) :
//  - 'usure'   : les cases les plus piétinées deviennent des routes (on enlève les bouts isolés) ;
//  - 'plan'    : le jeu relie chaque bâtiment à la place du village par des lignes le long de la grille ;
//  - 'melange' : comme 'plan', mais les routes préfèrent passer là où les habitants marchent déjà.
// Une route est une case ; ses voisines de route donnent sa forme (masque : 1 = i+1, 2 = j+1, 4 = i-1, 8 = j-1).
var Routes = (function () {
  var D = typeof Donnees !== 'undefined' ? Donnees : require('./data.js');
  var TR = typeof Terrain !== 'undefined' ? Terrain : require('./terrain.js');
  var DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // dans l'ordre des bits du masque

  // une route peut passer ici
  function praticable(T, t) {
    if (!t || !TR.surIle(T, t) || t.bat || t.rail || t.tir || t.eolienne || t.panneau) return false;
    if (t.obj && t.obj !== 'souche') return false;
    if (t.gue) return !!T.passerelle; // le gué, s'il y a une passerelle ou le pont de pierre
    return t.sol === 'herbe' || t.sol === 'sable';
  }
  // les bâtiments que les routes desservent : pas les petites décorations, pas les ponts
  function dessert(b) {
    var d = D.batiments[b.type];
    if (!d || b.type === 'passerelle' || b.type === 'pont-pierre') return false;
    if (d.deco && !d.merveille) return false;
    return true;
  }
  // les cases devant un bâtiment, tout autour de son empreinte
  function portes(T, b) {
    var l = [];
    for (var a = -1; a <= b.k; a++) for (var c = -1; c <= b.k; c++) {
      var dedans = a >= 0 && a < b.k && c >= 0 && c < b.k, coin = (a === -1 || a === b.k) && (c === -1 || c === b.k);
      if (dedans || coin) continue;
      var t = TR.tuile(T, b.i + a, b.j + c);
      if (praticable(T, t)) l.push(t);
    }
    return l;
  }
  function idx(T, t) { return t.i * T.N + t.j; }

  // la place du village : autour du cercle des anciens (ou du feu, ou du centre)
  function place(m) {
    var T = m.terrain;
    var c = m.batiments.filter(function (b) { return b.type === 'cercle-pierres'; })[0] || m.batiments.filter(function (b) { return b.type === 'feu'; })[0];
    if (c) { var p = portes(T, c); if (p.length) return p; }
    var t = TR.tuile(T, TR.CI, TR.CJ);
    return praticable(T, t) ? [t] : [];
  }

  // Dijkstra depuis le réseau déjà tracé jusqu'à l'une des cases cibles ; un virage coûte un peu (routes droites)
  function chemin(m, reseau, cibles, cout, virage) {
    var T = m.terrain, N = T.N, INF = 1e9;
    var dist = new Float64Array(N * N * 4).fill(INF), venu = new Int32Array(N * N * 4).fill(-1);
    var tas = [];
    function pousser(e, d) { tas.push([d, e]); var k = tas.length - 1; while (k > 0) { var p = (k - 1) >> 1; if (tas[p][0] <= tas[k][0]) break; var x = tas[p]; tas[p] = tas[k]; tas[k] = x; k = p; } }
    function tirer() { var r = tas[0], f = tas.pop(); if (tas.length) { tas[0] = f; var k = 0; for (;;) { var a = 2 * k + 1, b = a + 1, s = k; if (a < tas.length && tas[a][0] < tas[s][0]) s = a; if (b < tas.length && tas[b][0] < tas[s][0]) s = b; if (s === k) break; var x = tas[s]; tas[s] = tas[k]; tas[k] = x; k = s; } } return r; }
    var but = {};
    cibles.forEach(function (t) { but[idx(T, t)] = true; });
    Object.keys(reseau).forEach(function (k) { for (var d = 0; d < 4; d++) { var e = (+k) * 4 + d; dist[e] = 0; pousser(e, 0); } });
    while (tas.length) {
      var h = tirer(), e = h[1];
      if (h[0] > dist[e]) continue;
      var ti = e >> 2, dir = e & 3, i = Math.floor(ti / N), j = ti % N;
      if (but[ti]) {
        var l = [], x = e;
        while (x >= 0 && dist[x] > 0) { l.push(x >> 2); x = venu[x]; }
        return l;
      }
      for (var nd = 0; nd < 4; nd++) {
        var t = TR.tuile(T, i + DIRS[nd][0], j + DIRS[nd][1]);
        if (!praticable(T, t)) continue;
        var ni = idx(T, t), ne = ni * 4 + nd;
        var c = h[0] + (reseau[ni] ? 0.05 : cout(t)) + (nd !== dir && dist[e] > 0 ? virage : 0);
        if (c < dist[ne]) { dist[ne] = c; venu[ne] = e; pousser(ne, c); }
      }
    }
    return null;
  }

  function parUsure(m, seuil) {
    var T = m.terrain, r = {};
    T.tuiles.forEach(function (t) { if (praticable(T, t) && t.usure >= seuil) r[idx(T, t)] = true; });
    // on enlève les petits bouts isolés (moins de 3 cases reliées)
    var vu = {};
    Object.keys(r).forEach(function (k) {
      if (vu[k]) return;
      var groupe = [], file = [+k]; vu[k] = true;
      while (file.length) {
        var c = file.pop(); groupe.push(c);
        var i = Math.floor(c / T.N), j = c % T.N;
        DIRS.forEach(function (d) { var t = TR.tuile(T, i + d[0], j + d[1]); if (!t) return; var n = idx(T, t); if (r[n] && !vu[n]) { vu[n] = true; file.push(n); } });
      }
      if (groupe.length < 3) groupe.forEach(function (g) { delete r[g]; });
    });
    return r;
  }

  function parPlan(m, cout, virage) {
    var T = m.terrain, r = {};
    place(m).forEach(function (t) { r[idx(T, t)] = true; });
    if (!Object.keys(r).length) return r;
    var c0 = TR.centre(TR.CI, TR.CJ);
    var bats = m.batiments.filter(function (b) { return b.etat === 'fini' && dessert(b); });
    bats.sort(function (a, b) { return Math.hypot(a.x - c0[0], a.y - c0[1]) - Math.hypot(b.x - c0[0], b.y - c0[1]); });
    bats.forEach(function (b) {
      var p = portes(T, b);
      if (!p.length || p.some(function (t) { return r[idx(T, t)]; })) return;
      var l = chemin(m, r, p, cout, virage == null ? 0.35 : virage);
      if (l) l.forEach(function (k) { r[k] = true; });
    });
    return r;
  }

  // mode : 'usure' | 'plan' | 'melange'. Rend { cases: { idx: masque } }.
  function calculer(m, mode, o) {
    o = o || {};
    var T = m.terrain, r, attrait = o.attrait == null ? 1.3 : o.attrait;
    if (mode === 'usure') r = parUsure(m, 0.7);
    else if (mode === 'plan') r = parPlan(m, function () { return 1; }, o.virage);
    else r = parPlan(m, function (t) { return 1.6 - Math.min(attrait, (t.usure || 0) * 1.2); }, o.virage);
    var cases = {};
    Object.keys(r).forEach(function (k) {
      var i = Math.floor(k / T.N), j = k % T.N, mq = 0;
      DIRS.forEach(function (d, n) { var t = TR.tuile(T, i + d[0], j + d[1]); if (t && r[idx(T, t)]) mq |= 1 << n; });
      // une route touche aussi les ponts du gué
      cases[k] = mq;
    });
    return { mode: mode, cases: cases };
  }


  // ---------- la ville qui s'aménage (ADR-048) : places, jardinets, mobilier de rue ----------
  // Calcul pur et stable (un hachage des cases, pas de hasard) : même ville, même aménagement.
  // Rend une liste { i, j, quoi, dx, dy } : quoi = 'place' | 'jardin' | 'lampe' | 'banc' | 'bac' ;
  // dx, dy : le décalage dans la case (vers la route) pour le mobilier.
  function h(i, j, s) { var x = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return x - Math.floor(x); }
  function amenager(m, cases) {
    var T = m.terrain, N = T.N, out = [], pris = {};
    function k(i, j) { return i * N + j; }
    function route(i, j) { return cases[k(i, j)] != null; }
    function libre(i, j) {
      var t = TR.tuile(T, i, j);
      if (!t || t.sol !== 'herbe' || !praticable(T, t) || t.lampe || t.poteau || route(i, j) || pris[k(i, j)]) return false;
      return true;
    }
    var maisons = m.batiments.filter(function (b) { var d = D.batiments[b.type]; return b.etat === 'fini' && d && d.lits; });
    var occ = {};
    m.batiments.forEach(function (b) { for (var a = 0; a < b.k; a++) for (var c = 0; c < b.k; c++) occ[k(b.i + a, b.j + c)] = b; });
    function voisinsRoute(i, j) { var n = 0; DIRS.forEach(function (d) { if (route(i + d[0], j + d[1])) n++; }); return n; }
    function maisonsAutour(i, j, r) { var n = 0; maisons.forEach(function (b) { if (Math.abs(b.i + b.k / 2 - i) <= r && Math.abs(b.j + b.k / 2 - j) <= r) n++; }); return n; }
    // 1. les places : au coin d'un carrefour, là où il y a du monde ; une de plus toutes les six maisons
    // une place fait deux cases sur deux quand il y a la place (sinon une seule), et touche une route
    var cand = [];
    T.tuiles.forEach(function (t) {
      [2, 1].forEach(function (z) {
        for (var a = 0; a < z; a++) for (var c = 0; c < z; c++) if (!libre(t.i + a, t.j + c)) return;
        var vr = 0;
        for (var a2 = -1; a2 <= z; a2++) for (var c2 = -1; c2 <= z; c2++) { var dedans = a2 >= 0 && a2 < z && c2 >= 0 && c2 < z, coin = (a2 < 0 || a2 >= z) && (c2 < 0 || c2 >= z); if (!dedans && !coin && route(t.i + a2, t.j + c2)) vr++; }
        if (!vr) return;
        var n = maisonsAutour(t.i + z / 2, t.j + z / 2, 3); if (n < 2) return;
        cand.push({ i: t.i, j: t.j, z: z, s: (z === 2 ? 6 : 0) + Math.min(vr, 3) * 2 + n + h(t.i, t.j, 1) });
      });
    });
    cand.sort(function (a, b) { return b.s - a.s; });
    var nbPlaces = Math.min(8, 1 + Math.floor(maisons.length / 5)), places = [];
    cand.forEach(function (c) {
      if (places.length >= nbPlaces) return;
      for (var a = 0; a < c.z; a++) for (var b = 0; b < c.z; b++) if (!libre(c.i + a, c.j + b)) return;
      if (places.some(function (p) { return Math.abs(p.i - c.i) + Math.abs(p.j - c.j) < 6; })) return;
      places.push(c);
      for (var a3 = 0; a3 < c.z; a3++) for (var b3 = 0; b3 < c.z; b3++) pris[k(c.i + a3, c.j + b3)] = 1;
      out.push({ i: c.i, j: c.j, z: c.z, quoi: 'place', v: h(c.i, c.j, 2) });
    });
    // 2. les jardinets : une case libre contre chaque maison (pas toutes : trois sur quatre)
    maisons.forEach(function (b) {
      if (h(b.i, b.j, 3) < 0.25) return;
      var l = [];
      for (var a = -1; a <= b.k; a++) for (var c = -1; c <= b.k; c++) {
        var bord = (a === -1 || a === b.k) !== (c === -1 || c === b.k); // sur un côté, pas dans un coin
        if (bord && libre(b.i + a, b.j + c)) l.push([b.i + a, b.j + c]);
      }
      if (!l.length) return;
      var g = l[Math.floor(h(b.i, b.j, 4) * l.length)];
      pris[k(g[0], g[1])] = 1; out.push({ i: g[0], j: g[1], quoi: 'jardin', v: h(g[0], g[1], 5) });
    });
    // 3. le mobilier, au bord des routes : un réverbère toutes les trois cases, des bancs près des maisons
    //    et des places, des bacs à fleurs ou des arbres ailleurs
    var lampes = {};
    function lampeIci(i, j, n) { var cle = i + ',' + j; if (lampes[cle]) return false; lampes[cle] = 1; return true; }
    Object.keys(cases).map(Number).sort(function (a, b) { return a - b; }).forEach(function (rk) {
      var i = Math.floor(rk / N), j = rk % N;
      DIRS.forEach(function (d, n) {
        var a = i + d[0], c = j + d[1];
        if (!libre(a, c)) return;
        var off = 0.34, dx = -d[0] * off, dy = -d[1] * off, r = h(a, c, 6 + n);
        var quoi = null;
        if ((i + j) % 2 === 0 && lampeIci(i, j, n)) quoi = 'lampe';
        else if (r < 0.22 && (maisonsAutour(a, c, 1) || places.some(function (p) { return a >= p.i - 1 && a <= p.i + p.z && c >= p.j - 1 && c <= p.j + p.z; }))) quoi = 'banc';
        else if (r > 0.82) quoi = 'bac';
        if (!quoi) return;
        pris[k(a, c)] = 1;
        out.push({ i: a, j: c, quoi: quoi, dx: dx, dy: dy, sens: n, v: r });
      });
    });
    return out;
  }

  // la pièce de base et sa rotation (en quarts de tour, sens des aiguilles) pour un masque
  // pièces : 1 droite (i-1, i+1), 2 virage (i+1, j+1), 3 T (i-1, i+1, j+1), 4 croisement, 5 bout (i+1), 6 place seule
  var BASES = [[1, 5], [2, 3], [3, 7], [4, 15], [5, 1], [6, 0]];
  function tourner(mq, r) { for (var n = 0; n < r; n++) mq = ((mq << 1) | (mq >> 3)) & 15; return mq; }
  function piece(mq) {
    for (var b = 0; b < BASES.length; b++) for (var r = 0; r < 4; r++) if (tourner(BASES[b][1], r) === mq) return [BASES[b][0], r];
    return [6, 0];
  }

  return { calculer: calculer, amenager: amenager, piece: piece, praticable: praticable, portes: portes, DIRS: DIRS };
})();
if (typeof module !== 'undefined') module.exports = Routes;
