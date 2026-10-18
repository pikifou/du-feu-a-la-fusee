// Terrain en tuiles isométriques (ADR-012) : génération de l'île, chemins, usure de l'herbe (ADR-013).
// Pur, sans DOM : testable sous node.
var Terrain = (function () {
  var N = 44;              // la grille fait N x N tuiles
  var TW = 64, TH = 32;    // demi-largeur et demi-hauteur d'une tuile (losange 128 x 64)
  var OX = N * TW, OY = 120;
  var CI = 22, CJ = 22;    // tuile du centre du village
  var RAYONS = { 1: 12.5, 2: 16.5 }; // rayon de l'île par époque

  // ---------- coordonnées ----------
  function centre(i, j) { return [(i - j) * TW + OX, (i + j + 1) * TH + OY]; }
  function tuileDe(x, y) {
    var a = (x - OX) / TW, b = (y - OY) / TH - 1;
    return [Math.round((a + b) / 2), Math.round((b - a) / 2)];
  }
  function dedansGrille(i, j) { return i >= 0 && j >= 0 && i < N && j < N; }

  // ---------- bruit déterministe ----------
  function h2(i, j, s) {
    var n = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function bruit(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  // ---------- génération ----------
  // u = i - j (horizontal à l'écran), v = i + j (vertical à l'écran)
  function riviereU(v) { return 8.5 + 2.6 * Math.sin(v / 5.5) + 1.2 * Math.sin(v / 2.3 + 1); }

  function generer() {
    var T = { N: N, tuiles: [], gue: null, grotte: null, epoque: 1 };
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
      var u = i - j, v = i + j;
      var d = Math.hypot(i - CI, j - CJ) + (bruit(i / 3, j / 3, 7) - 0.5) * 3;
      var t = {
        i: i, j: j, sol: 'herbe', obj: null, vari: Math.floor(h2(i, j, 3) * 1000),
        usure: 0, bat: null, ile: d < RAYONS[2] ? (d < RAYONS[1] ? 1 : 2) : 0,
        sauvage: false
      };
      var ru = riviereU(v);
      if (Math.abs(u - ru) < 1.15 && v < 60) t.sol = 'eau';
      if (v >= 57) t.sol = 'sable';
      if (v >= 60) t.sol = 'eau';
      if (u > ru + 1.1 && v < 60) t.sauvage = true; // l'autre rive
      T.tuiles.push(t);
    }
    // collines de roche au nord-est, avec la grotte
    var gr = null;
    tous(T).forEach(function (t) {
      var u = t.i - t.j, v = t.i + t.j;
      var dg = Math.hypot(t.i - 24, t.j - 11);
      if (t.sauvage && t.sol === 'herbe' && v < 36 && u > riviereU(v) + 2.5 && (dg < 2.6 || bruit(t.i / 2.5, t.j / 2.5, 11) > 0.38)) t.sol = 'roche';
    });
    // la grotte : tuile de roche la plus proche d'un point choisi
    var cible = [24, 12];
    var best = null, bd = 1e9;
    tous(T).forEach(function (t) {
      if (t.sol !== 'roche' || t.ile !== 1) return;
      var dd = Math.hypot(t.i - cible[0], t.j - cible[1]);
      if (dd < bd) { bd = dd; best = t; }
    });
    if (best) { best.obj = 'grotte'; T.grotte = [best.i, best.j]; }
    // le gué : tuile d'eau de la rivière la plus proche du village, côté nord
    bd = 1e9;
    tous(T).forEach(function (t) {
      var v = t.i + t.j;
      if (t.sol !== 'eau' || v > 50 || t.ile !== 1) return;
      var dd = Math.hypot(t.i - (CI + 4), t.j - (CJ - 4));
      if (dd < bd) { bd = dd; gr = t; }
    });
    if (gr) {
      // le gué traverse toute la largeur de la rivière
      // on prend l'axe où la rivière est la plus étroite
      var ligne = null;
      [[1, 0], [0, 1]].forEach(function (ax) {
        var l = [gr];
        [1, -1].forEach(function (sens) {
          for (var k = 1; k < 6; k++) { var n = tuile(T, gr.i + sens * k * ax[0], gr.j + sens * k * ax[1]); if (!n || n.sol !== 'eau') break; l.push(n); }
        });
        if (!ligne || l.length < ligne.length) ligne = l;
      });
      ligne.forEach(function (t) { t.gue = true; });
      ligne.sort(function (a, b) { return (a.i + a.j) - (b.i + b.j) || a.i - b.i; });
      T.gues = ligne.map(function (t) { return [t.i, t.j]; });
      var m = ligne[Math.floor((ligne.length - 1) / 2)];
      T.gue = [m.i, m.j];
    }
    // forêt, rochers, fleurs, roseaux
    tous(T).forEach(function (t) {
      if (t.obj) return;
      var dc = Math.hypot(t.i - CI, t.j - CJ);
      var f = bruit(t.i / 4, t.j / 4, 21);
      var r = h2(t.i, t.j, 5);
      if (t.sol === 'herbe') {
        var foret = f > 0.52 && dc > 6.5;
        if ((t.i - t.j) < -5 && dc > 6) foret = foret || f > 0.35;   // grande forêt à l'ouest
        if (foret && r < 0.82) { t.obj = 'arbre'; t.bois = 3; return; }
        if (!foret && dc > 5.5 && r < 0.04) { t.obj = 'arbre'; t.bois = 3; return; }
        if (r > 0.965 && dc > 3) { t.obj = 'rocher'; return; }
        if (r > 0.86) t.deco = r > 0.92 ? 'fleurs' : 'touffe';
        if (pres(T, t, 'eau') && r > 0.55) t.deco = 'roseaux';
      } else if (t.sol === 'roche') {
        if (r < 0.25) t.obj = 'rocher';
      } else if (t.sol === 'sable' && r > 0.9) t.deco = 'galets';
    });
    // on dégage les deux bouts du gué et l'entrée de la grotte
    var aDegager = [];
    if (T.gues) T.gues.forEach(function (g) { aDegager.push(g); });
    if (T.grotte) aDegager.push([T.grotte[0] + 1, T.grotte[1] + 1]);
    aDegager.forEach(function (c) {
      for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) {
        var n = tuile(T, c[0] + di, c[1] + dj);
        if (n && n.obj && n.obj !== 'grotte') n.obj = null;
      }
    });
    return T;
  }

  function tous(T) { return T.tuiles; }
  function tuile(T, i, j) { return dedansGrille(i, j) ? T.tuiles[i * N + j] : null; }
  function pres(T, t, sol) {
    for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) {
      var n = tuile(T, t.i + di, t.j + dj);
      if (n && n.sol === sol && n !== t && !n.gue) return true;
    }
    return false;
  }
  function surIle(T, t) { return t && t.ile > 0 && t.ile <= T.epoque; }

  // ---------- passage ----------
  function bloque(T, t) {
    if (!surIle(T, t)) return true;
    if (t.sol === 'eau' && !t.gue) return true;
    if (t.obj === 'arbre' || t.obj === 'rocher' || t.obj === 'grotte') return true;
    if (t.bat) return true;
    return false;
  }
  function cout(T, t) {
    if (t.gue) return T.passerelle ? 1 : 2.5;
    var c = t.sol === 'sable' ? 1.1 : t.sol === 'roche' ? 1.3 : 1;
    return c * (1 - 0.55 * Math.min(1, t.usure)); // on préfère les chemins déjà tracés
  }

  // A* sur la grille ; l'arrivée peut être une tuile bloquée (un arbre, un bâtiment)
  function chemin(T, de, vers) {
    var a = tuileDe(de[0], de[1]), b = tuileDe(vers[0], vers[1]);
    var ta = tuile(T, a[0], a[1]), tb = tuile(T, b[0], b[1]);
    if (!ta || !tb) return [vers];
    if (ta === tb) return [vers];
    var ouverts = [ta], g = {}, f = {}, venu = {};
    var cle = function (t) { return t.i * N + t.j; };
    g[cle(ta)] = 0; f[cle(ta)] = Math.hypot(ta.i - tb.i, ta.j - tb.j);
    var garde = 0;
    while (ouverts.length && garde++ < 4000) {
      var k = 0;
      for (var q = 1; q < ouverts.length; q++) if (f[cle(ouverts[q])] < f[cle(ouverts[k])]) k = q;
      var c = ouverts.splice(k, 1)[0];
      if (c === tb) {
        var pts = [vers], x = venu[cle(c)];
        while (x && x !== ta) { pts.unshift(centre(x.i, x.j)); x = venu[cle(x)]; }
        return lisser(pts);
      }
      for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) {
        if (!di && !dj) continue;
        var n = tuile(T, c.i + di, c.j + dj);
        if (!n) continue;
        if (n !== tb && bloque(T, n)) continue;
        if (di && dj) {
          // on ne se faufile pas entre deux obstacles en diagonale
          var n1 = tuile(T, c.i + di, c.j), n2 = tuile(T, c.i, c.j + dj);
          if ((n1 !== tb && bloque(T, n1)) && (n2 !== tb && bloque(T, n2))) continue;
        }
        var ng = g[cle(c)] + (di && dj ? 1.414 : 1) * (n === tb ? 1 : cout(T, n));
        if (g[cle(n)] == null || ng < g[cle(n)]) {
          g[cle(n)] = ng; f[cle(n)] = ng + Math.hypot(n.i - tb.i, n.j - tb.j) * 0.45; venu[cle(n)] = c;
          if (ouverts.indexOf(n) < 0) ouverts.push(n);
        }
      }
    }
    return [vers]; // pas de chemin : on y va tout droit
  }
  // un peu de souplesse : on décale légèrement les points pour éviter l'effet « rail »
  function lisser(pts) {
    return pts.map(function (p, k) {
      if (k === pts.length - 1) return p;
      var s = Math.sin(p[0] * 0.13 + p[1] * 0.07);
      return [p[0] + s * 10, p[1] + Math.cos(p[0] * 0.05) * 5];
    });
  }

  // ---------- usure de l'herbe (ADR-013) ----------
  function user(T, x, y, dt) {
    var c = tuileDe(x, y), t = tuile(T, c[0], c[1]);
    if (!t || t.sol !== 'herbe' || t.bat) return;
    t.usure = Math.min(1.2, t.usure + dt * 0.04);
    if (t.usure > 0.45 && t.deco && t.deco !== 'roseaux') t.deco = null;
    if (t.obj === 'souche' && t.usure > 0.8) t.obj = null;
  }
  function repousser(T, dt) {
    var k = Math.pow(0.9985, dt);
    T.tuiles.forEach(function (t) { if (t.usure > 0) t.usure *= k; if (t.usure < 0.01) t.usure = 0; });
  }
  // état visible de l'herbe : 0 drue, 1 tassée, 2 sentier, 3 chemin de terre
  function etatHerbe(t) { return t.usure < 0.12 ? 0 : t.usure < 0.35 ? 1 : t.usure < 0.7 ? 2 : 3; }

  // ---------- emplacements ----------
  function empreinte(T, i, j, k) {
    var l = [];
    for (var a = 0; a < k; a++) for (var b = 0; b < k; b++) { var t = tuile(T, i + a, j + b); if (!t) return null; l.push(t); }
    return l;
  }
  function centreEmpreinte(i, j, k) { return centre(i + (k - 1) / 2, j + (k - 1) / 2); }

  return {
    N: N, TW: TW, TH: TH, OX: OX, OY: OY, CI: CI, CJ: CJ, RAYONS: RAYONS,
    generer: generer, tuile: tuile, tuileDe: tuileDe, centre: centre, centreEmpreinte: centreEmpreinte,
    empreinte: empreinte, pres: pres, surIle: surIle, bloque: bloque, chemin: chemin,
    user: user, repousser: repousser, etatHerbe: etatHerbe, riviereU: riviereU, h2: h2
  };
})();
if (typeof module !== 'undefined') module.exports = Terrain;
