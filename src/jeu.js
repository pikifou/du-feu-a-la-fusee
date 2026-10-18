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
      var o = JSON.parse(localStorage.getItem(CLE) || 'null');
      if (o && o.v === 2 && o.monde && o.monde.terrain) { ui = Object.assign(ui, o.ui || {}); return M.importer(o.monde); }
    } catch (e) {}
    return null;
  }
  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify({ v: 2, monde: M.exporter(monde), ui: ui })); } catch (e) {}
  }
  var monde = params.has('neuf') ? null : charger();
  var nouvellePartie = !monde;
  if (!monde) monde = M.nouveau((Date.now() % 100000) + 1);

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
    u.clearRect(0, 0, usureCv.width, usureCv.height);
    T.tuiles.forEach(function (t) {
      if (t.sol !== 'herbe' || t.usure < 0.1 || !TR.surIle(T, t)) return;
      var e = TR.etatHerbe(t);
      var col = e <= 1 ? [200, 192, 118] : e === 2 ? [190, 156, 104] : [172, 130, 86];
      var a = e <= 1 ? 0.3 + t.usure * 0.8 : e === 2 ? 0.7 : 0.9;
      var p = TR.centre(t.i, t.j), x = p[0] * G, y = p[1] * G;
      u.save(); u.translate(x, y); u.scale(1, 0.5);
      var r = TR.TW * G * 1.05;
      var gr = u.createRadialGradient(0, 0, 0, 0, 0, r);
      gr.addColorStop(0, 'rgba(' + col + ',' + a + ')'); gr.addColorStop(0.6, 'rgba(' + col + ',' + (a * 0.75) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
      u.fillStyle = gr; u.beginPath(); u.arc(0, 0, r, 0, 7); u.fill(); u.restore();
    });
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
  var audio = null;
  function son(type) {
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
  function dire(texte) {
    if (!ui.voix || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(texte.replace(/<[^>]+>/g, ''));
      u.lang = 'fr-FR'; u.rate = 0.95; u.pitch = 1.1;
      var v = speechSynthesis.getVoices().filter(function (v) { return /^fr/i.test(v.lang); });
      if (v.length) u.voice = v[0];
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
  function tailleBat(b) {
    var d = D.batiments[b.type], im = IMG[d.sprite];
    var w = d.largeur * V.s;
    return { w: w, h: im ? w * im.height / im.width : w, im: im };
  }
  function basBat(b) { return b.y + b.k * TR.TH * 0.55; }
  function dessinerSprite(im, x, y, w, h, alpha) {
    if (!im) return;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.drawImage(im, x - w / 2, y - h * 0.93, w, h);
    ctx.globalAlpha = 1;
  }
  function dessinerBat(b) {
    var p = E(b.x, basBat(b)), t = tailleBat(b);
    if (b.type === 'passerelle') return dessinerPasserelle(b, t);
    if (b.etat === 'fini' && b.type === 'feu' && M.phase(monde) === 'nuit') {
      var ic = IMG[monde.cycle.t < 10 ? 'nuit/feu-braises' : 'nuit/feu-cendres'];
      if (ic) { var wc = t.w * 0.82; dessinerSprite(ic, p[0], p[1], wc, wc * ic.height / ic.width); return; }
    }
    if (b.etat === 'fini') {
      var k = 1, age = monde.t - (b.apparu || -10);
      if (age < 0.7) k = 1 + Math.sin(age / 0.7 * Math.PI) * 0.18 * (1 - age / 0.7) - (age < 0.1 ? 0.3 * (1 - age / 0.1) : 0);
      dessinerSprite(t.im, p[0], p[1], t.w * k, t.h * (2 - k));
      return;
    }
    var prog = b.besoin ? b.livre / b.besoin : 1;
    if (b.ancien) {
      var da = D.batiments[b.ancien], ia = IMG[da.sprite], wa = da.largeur * V.s;
      dessinerSprite(ia, p[0], p[1], wa, wa * ia.height / ia.width, 1 - prog * 0.9);
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
  function dessinerPasserelle(b, t) {
    var g = monde.terrain.gues, a = TR.centre(g[0][0], g[0][1]), z = TR.centre(g[g.length - 1][0], g[g.length - 1][1]);
    var prog = b.etat === 'fini' ? 1 : (b.besoin ? b.livre / b.besoin : 0);
    var n = 7, pa = E(a[0], a[1]), pz = E(z[0], z[1]);
    var dx = pz[0] - pa[0], dy = pz[1] - pa[1], L = Math.hypot(dx, dy) + 130 * V.s;
    var ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy);
    var cx = (pa[0] + pz[0]) / 2, cy = (pa[1] + pz[1]) / 2;
    // planches posées une à une
    for (var k = 0; k < n; k++) {
      if (k / n >= prog) break;
      var s = -L / 2 + (k + 0.5) * L / n;
      var x = cx + ux * s, y = cy + uy * s;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(uy, ux) + Math.PI / 2);
      ctx.fillStyle = k % 2 ? '#9b6a3f' : '#a87648'; ctx.fillRect(-34 * V.s, -L / n / 2 + 1, 68 * V.s, L / n - 2);
      ctx.restore();
    }
    if (prog >= 1) {
      ctx.strokeStyle = '#7a4f2c'; ctx.lineWidth = Math.max(2, 5 * V.s);
      [-1, 1].forEach(function (cote) {
        var ox = -uy * 34 * V.s * cote, oy = ux * 34 * V.s * cote;
        ctx.beginPath(); ctx.moveTo(cx - ux * L / 2 + ox, cy - uy * L / 2 + oy - 18 * V.s); ctx.lineTo(cx + ux * L / 2 + ox, cy + uy * L / 2 + oy - 18 * V.s); ctx.stroke();
      });
    }
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
    } else if (objet === 'viande') {
      ctx.fillStyle = '#b5523b'; ctx.beginPath(); ctx.ellipse(-3, -10, 12, 9, -0.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#f3e7d3'; ctx.beginPath(); ctx.roundRect(6, -6, 12, 5, 2.5); ctx.fill();
    } else if (objet === 'silex') {
      ctx.fillStyle = '#8e8c94'; ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(0, -20); ctx.lineTo(12, -2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b9b7bf'; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(0, -15); ctx.lineTo(4, -6); ctx.fill();
    } else if (objet === 'ble') {
      ctx.strokeStyle = '#d9a63a'; ctx.lineWidth = 3;
      for (var j = -2; j <= 2; j++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(j * 5, -20); ctx.stroke(); }
      ctx.fillStyle = '#e8b94a'; for (var k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(k * 5, -21, 3, 5, 0, 0, 7); ctx.fill(); }
    } else if (objet === 'argile') {
      ctx.fillStyle = '#b8714a'; ctx.beginPath(); ctx.ellipse(0, -9, 13, 9, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
  }



  // les dormeurs d'une même maison se rangent côte à côte devant la porte (ADR-017)
  var LITS = { 'tete-adulte': 60, 'tete-enfant': 48, 'deux-tetes': 70, 'tete-sage': 62 };
  var couchage = {};
  function rangerDormeurs() {
    couchage = {};
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
  function dessinerHab(h) {
    if (h.dort) { dessinerDormeur(h); return; }
    var im = IMG['habitants/' + h.allure];
    if (!im) return;
    var base = (h.enfant ? TAILLE_HAB.enfant : h.allure === 'sage' ? TAILLE_HAB.sage : TAILLE_HAB.adulte) * V.s;
    var H = base;
    var pim = !h.marche && h.pose ? IMG['poses/' + h.pose] : null;
    if (pim) { im = pim; H = base * pim.height / POSE_REF; }
    var w = H * im.width / im.height;
    var p = E(h.x, h.y), ph = h.id * 1.7;
    var bob = 0, rot = 0, sy = 1;
    if (h.marche) { bob = Math.abs(Math.sin(T * 11 + ph)) * 5 * V.s; rot = Math.sin(T * 11 + ph) * 0.05; }
    else if (pim) { rot = Math.sin(T * 6 + ph) * 0.035; bob = Math.abs(Math.sin(T * 6 + ph)) * 1.5 * V.s; }
    else if (h.anim === 'travail') { rot = Math.sin(T * 7 + ph) * 0.11; bob = Math.abs(Math.sin(T * 7 + ph)) * 2 * V.s; }
    else if (h.anim === 'marteau') { rot = Math.sin(T * 15 + ph) * 0.14; bob = Math.abs(Math.sin(T * 15 + ph)) * 4 * V.s; }
    else if (h.anim === 'jeu') { bob = Math.abs(Math.sin(T * 9 + ph)) * 10 * V.s; }
    else { sy = 1 + Math.sin(T * 2 + ph) * 0.018; }
    ombre(p[0], p[1], w * 0.3, 4 * V.s);
    ctx.save();
    ctx.translate(p[0], p[1] - bob);
    ctx.rotate(rot);
    ctx.scale(h.dir < 0 ? -1 : 1, sy);
    ctx.drawImage(im, -w / 2, -H * (pim ? 0.93 : 0.97), w, H);
    ctx.restore();
    if (h.porte) dessinerObjet(h.porte, p[0], p[1] - H - bob + 3 * V.s, V.s * 0.75);
    if (h.pouf > 0) {
      var k2 = 1 - h.pouf / 0.6;
      ctx.fillStyle = 'rgba(255,255,255,' + (1 - k2) + ')';
      for (var i = 0; i < 6; i++) { var a = i / 6 * 6.28; ctx.beginPath(); ctx.arc(p[0] + Math.cos(a) * 22 * k2 * V.s, p[1] - H / 2 + Math.sin(a) * 22 * k2 * V.s, (9 - 6 * k2) * V.s, 0, 7); ctx.fill(); }
    }
    if (!h.marche && (h.anim === 'travail' || h.anim === 'marteau') && Math.random() < 0.04) {
      particule({ type: 'eclat', x: h.x + (Math.random() - 0.5) * 16, y: h.y - 24, vx: (Math.random() - 0.5) * 60, vy: -50 - Math.random() * 30, max: 0.6, r: 3, c: h.anim === 'marteau' ? '170,120,70' : '210,190,140' });
    }
  }

  function dessinerAnimal(a) {
    var im = IMG[a.espece === 'mammouth' ? '01-pierre/mammouth' : '02-neolithique/chevre'];
    if (!im) return;
    var w = (a.espece === 'mammouth' ? 165 : 50) * V.s, H = w * im.height / im.width;
    var p = E(a.x, a.y), bob = a.marche ? Math.abs(Math.sin(T * (a.espece === 'mammouth' ? 4 : 9) + a.id)) * 3 * V.s : 0;
    ombre(p[0], p[1], w * 0.35, 7 * V.s, 0.18);
    ctx.save(); ctx.translate(p[0], p[1] - bob); ctx.scale(a.dir < 0 ? 1 : -1, 1);
    ctx.drawImage(im, -w / 2, -H * 0.93, w, H); ctx.restore();
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

  var bulles = [];
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
      ctx.lineWidth = 3; ctx.strokeStyle = tr.produit === 'idees' ? '#f2c94c' : '#e9873b'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 6, y + r - 2); ctx.lineTo(x, y + r + 9); ctx.lineTo(x + 6, y + r - 2); ctx.fillStyle = tr.produit === 'idees' ? '#fff6c9' : '#fffaf0'; ctx.fill();
      ctx.font = Math.round(r * 0.95) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(tr.produit === 'idees' ? '💡' : '🪙', x, y + 1);
      var n = b.stock * tr.qte;
      ctx.font = '700 ' + Math.round(r * 0.6) + 'px Fredoka, system-ui, sans-serif';
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#5b3c24'; ctx.lineWidth = 4;
      ctx.strokeText('+' + n, x + r * 0.75, y - r * 0.7); ctx.fillText('+' + n, x + r * 0.75, y - r * 0.7);
    });
  }

  var paroles = [];
  function dessinerParoles() {
    paroles = paroles.filter(function (p) { return p.fin > T; });
    paroles.forEach(function (pa) {
      var h = monde.habitants.filter(function (q) { return q.id === pa.hab; })[0];
      if (!h) return;
      var p = E(h.x, h.y);
      ctx.font = '600 16px Fredoka, system-ui, sans-serif';
      var w = ctx.measureText(pa.texte).width + 24, x = p[0], y = p[1] - 115 * V.s - 18;
      ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = 'rgba(91,60,36,.3)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x - w / 2, y - 17, w, 32, 16); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 6, y + 14); ctx.lineTo(x, y + 23); ctx.lineTo(x + 6, y + 14); ctx.fill();
      ctx.fillStyle = '#5b3c24'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pa.texte, x, y - 1);
    });
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
  function fumees(dt) {
    dernierFumee += dt;
    if (dernierFumee < 0.35) return;
    dernierFumee = 0;
    monde.batiments.forEach(function (b) {
      if (b.etat !== 'fini') return;
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
      if (p.type === 'eclat') { p.vy += 260 * dt; }
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
    nctx.fillStyle = 'rgba(14,20,58,' + (0.7 * d) + ')';
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
    if (braises > 0) feux.forEach(function (f) { var p = E(f.x, f.y - 20); trou(p[0], p[1], M.RAYON_FEU * V.s * vacille, braises, 0.62); });
    // un peu de clair de lune sur les dormeurs, pour bien les voir
    monde.habitants.forEach(function (h) {
      var c = couchage[h.id]; if (!h.dort || !c || c.cache) return;
      var p = E(h.x, h.y);
      if (c.b) { var pb = E(c.b.x, basBat(c.b)), ec = Math.min(48, tailleBat(c.b).w / V.s / Math.max(1, c.n)) * V.s; p = [pb[0] + (c.i - (c.n - 1) / 2) * ec, Math.max(p[1], pb[1] + 6 * V.s)]; }
      trou(p[0], p[1] - 10 * V.s, 46 * V.s, 0.45, 0.7);
    });
    // fenêtres éclairées des maisons (éteintes quand tout le monde dort)
    monde.batiments.forEach(function (b) {
      if (b.etat !== 'fini' || !D.batiments[b.type].lits || monde.epoque < 2 || M.phase(monde) === 'nuit') return;
      var t = tailleBat(b), p = E(b.x, basBat(b));
      trou(p[0], p[1] - t.h * 0.35, 80 * V.s, 0.7, 0.8);
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
    ctx.restore();
  }

  function dessiner(dt) {
    ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    rangerDormeurs();
    ctx.imageSmoothingQuality = 'high';
    dessinerFond(dt);
    dessinerEau();
    dessinerEmplacements();
    var T0 = monde.terrain, liste = [];
    T0.tuiles.forEach(function (t) {
      if (!TR.surIle(T0, t)) return;
      if (!t.obj && !t.deco) return;
      var c = TR.centre(t.i, t.j);
      if (!visible(c[0], c[1], 260)) return;
      if (t.deco) dessinerDeco(t);
      if (t.obj) liste.push({ y: c[1] + 16, f: dessinerTuileObjet, o: t });
    });
    monde.batiments.forEach(function (b) {
      var plat = b.type === 'champ-ble' || b.type === 'passerelle';
      // le champ est bas mais ses épis sont hauts : il passe devant ce qui est derrière lui
      liste.push({ y: b.type === 'champ-ble' ? b.y - b.k * TR.TH * 0.5 : plat ? b.y - 200 : basBat(b) - 6, f: dessinerBat, o: b });
    });
    monde.habitants.forEach(function (h) {
      if (!visible(h.x, h.y, 120)) return;
      var c = h.dort && couchage[h.id], y = c && c.b ? Math.max(h.y, basBat(c.b) + 6) : h.y; // devant la porte, pas derrière
      liste.push({ y: y, f: dessinerHab, o: h });
    });
    monde.animaux.forEach(function (a) { liste.push({ y: a.y, f: dessinerAnimal, o: a }); });
    liste.sort(function (a, b) { return a.y - b.y; });
    liste.forEach(function (e) { e.f(e.o); });
    fumees(dt);
    dessinerParts(dt);
    dessinerNuit();
    dessinerBulles();
    dessinerParoles();
  }

  // ---------- interface ----------
  var choix = null;
  var derniers = { hab: -1, pieces: -1, idees: -1 };
  function majCompteurs() {
    var v = { hab: monde.habitants.length + ' / ' + M.lits(monde), pieces: monde.pieces, idees: monde.idees };
    ['hab', 'pieces', 'idees'].forEach(function (k) {
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
  }

  var signatureBarre = '';
  function majBarre() {
    var liste = M.construisibles(monde);
    var sig = liste.join() + '|' + monde.pieces + '|' + choix + '|' + ui.nouveaux.join() + '|' + monde.batiments.length;
    if (sig === signatureBarre) return;
    signatureBarre = sig;
    var barre = $('barre');
    barre.innerHTML = '';
    liste.forEach(function (type) {
      var d = D.batiments[type];
      var el = document.createElement('div');
      el.className = 'carte-bat' + (M.peutConstruire(monde, type) ? '' : ' non') + (choix === type ? ' choisie' : '');
      el.innerHTML = '<img src="' + ASSETS[d.sprite] + '" alt=""><div class="prix">🪙 ' + d.cout + '</div>' +
        (ui.nouveaux.indexOf(type) >= 0 ? '<div class="neuf">Nouveau !</div>' : '');
      el.addEventListener('pointerdown', function (ev) {
        ev.stopPropagation();
        if (!M.peutConstruire(monde, type)) {
          son('non');
          if (M.emplacementsLibres(monde, type).length === 0) aide('Il n\'y a plus de place pour ça !', true);
          else aide('Il faut ' + d.cout + ' pièces. Ramasse les bulles 🪙 !', true);
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
      montrerInfo({ img: d.sprite, titre: d.nom, texte: d.explication || '', statut: resumeType(type) });
      majValides(true);
    } else { pl.style.display = 'none'; valides = []; }
  }
  $('placement-annuler').addEventListener('pointerdown', function (e) { e.stopPropagation(); choisir(null); });

  var minuteurAide = null;
  function aide(texte, forcer) {
    var el = $('bulle-aide');
    el.textContent = texte; el.style.display = 'block';
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
    $('scene-images').innerHTML = (o.images || []).map(function (k) { return '<img src="' + ASSETS[k] + '" alt="">'; }).join('');
    $('scene-texte').textContent = o.texte;
    $('scene-ok').textContent = o.bouton || 'Super !';
    $('scene-voix').onclick = function () { dire(o.texte); };
    $('scene-ok').onclick = function () {
      fermer('scene'); enScene = false;
      if (o.ensuite) o.ensuite();
    };
    ouvrir('scene');
    setTimeout(function () { dire(o.texte); }, 250);
  }

  function ouvrirDecouvertes() {
    var e = D.epoques.filter(function (x) { return x.id === monde.epoque; })[0];
    $('dec-sous').textContent = e.nom + ' · tu as ' + monde.idees + ' 💡';
    var g = $('grille-dec');
    g.innerHTML = '';
    M.decouvertesEpoque(monde).forEach(function (id) {
      var d = D.decouvertes[id], etat = M.etatDecouverte(monde, id);
      var el = document.createElement('div');
      el.className = 'dec ' + etat;
      var besoin = etat === 'bloquee' ? '<div class="besoin">' + d.prerequis.filter(function (p) { return !monde.decouvertes[p]; })
        .map(function (p) { return '<img src="' + ASSETS[D.decouvertes[p].icone] + '" alt="">'; }).join('') + '</div>' : '';
      el.innerHTML = '<img src="' + ASSETS[d.icone] + '" alt=""><div class="nom">' + d.nom + '</div>' +
        (etat === 'faite' ? '' : '<div class="cout">💡 ' + d.idees + '</div>') + besoin;
      el.addEventListener('click', function () {
        if (etat === 'possible') faireDecouverte(id);
        else if (etat === 'attente') aide('Il te faut ' + d.idees + ' idées. Ramasse les bulles 💡 du cercle des anciens !', true);
        else if (etat === 'bloquee') aide('Il faut d\'abord découvrir : ' + d.prerequis.filter(function (p) { return !monde.decouvertes[p]; }).map(function (p) { return D.decouvertes[p].nom.toLowerCase(); }).join(' et ') + '.', true);
      });
      g.appendChild(el);
    });
    ouvrir('decouvertes');
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
    var images = [d.icone].concat(debloques.map(function (k) { return D.batiments[k].sprite; }).filter(function (s) { return s !== d.icone; })).slice(0, 2);
    scene({ titre: d.nom, images: images, texte: d.texte, ensuite: apresDecouverte });
    sauver();
  }
  function apresDecouverte() {
    if (!M.epoqueTerminee(monde)) return;
    var e = D.epoques.filter(function (x) { return x.id === monde.epoque; })[0];
    var suiv = D.epoques.filter(function (x) { return x.id === monde.epoque + 1; })[0];
    if (!suiv) {
      scene({ titre: 'Bravo !', images: ['02-neolithique/maison-longue', 'habitants/sage'],
        texte: 'Tu as fait toutes les découvertes du néolithique ! La suite de l\'histoire, l\'âge des métaux, arrive bientôt.', bouton: 'À bientôt !' });
      return;
    }
    scene({
      titre: 'Bravo !', images: ['habitants/sage', '01-pierre/peintures-rupestres'],
      texte: 'Tu as fait toutes les découvertes de ' + e.nom.toLowerCase() + ' ! Ton village est prêt à changer d\'époque.',
      bouton: 'En avant !',
      ensuite: function () {
        M.passerEpoque(monde);
        ui.nouveaux = ui.nouveaux.filter(function (k) { return D.batiments[k].epoque >= monde.epoque; });
        montrerEpoque();
        sauver();
      }
    });
  }
  function montrerEpoque() {
    var e = D.epoques.filter(function (x) { return x.id === monde.epoque; })[0];
    $('epoque-nom').textContent = e.nom;
    var images = monde.epoque === 1 ? ['01-pierre/hutte-peaux', 'habitants/chasseur'] : ['02-neolithique/champ-ble', 'habitants/paysan'];
    scene({ titre: e.nom, images: images, texte: e.intro, bouton: 'C\'est parti !', ensuite: function () {
      if (monde.epoque === 2) aideUneFois('epoque2', 'Regarde : les habitants transforment eux-mêmes leurs huttes en maisons !');
    } });
  }

  // menu
  $('btn-menu').addEventListener('click', function () { $('menu-voix').textContent = '🔊 Voix : ' + (ui.voix ? 'oui' : 'non'); ouvrir('menu'); });
  $('menu-voix').addEventListener('click', function () { ui.voix = !ui.voix; this.textContent = '🔊 Voix : ' + (ui.voix ? 'oui' : 'non'); sauver(); });
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
  });
  function estPleinEcran() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function verrouiller() {
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) {}
  }
  function pleinEcran() {
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
    if (!pleinEcran()) aide('Sur iPhone : touche Partager, puis « Sur l\'écran d\'accueil » pour jouer en plein écran.', true);
  }
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
  var phrases = {
    sage: ['Hmm… je réfléchis…', 'J\'ai une idée !'],
    bucheron: ['Je vais couper du bois !', 'Ce rondin est lourd !'],
    cueilleur: ['Miam, des baies !', 'Je remplis mon panier.'],
    tailleur: ['Je taille des silex.', 'Toc, toc, toc !'],
    chasseur: ['Je pars chasser !', 'Chut, il ne faut pas faire de bruit.'],
    pecheur: ['Je vais pêcher des poissons !', 'Ça mord !'],
    peintre: ['Je peins un mammouth.', 'Regarde mes peintures !'],
    paysan: ['Le blé pousse bien !', 'Je m\'occupe du champ.'],
    berger: ['Je garde les moutons !', 'Bêêê !'],
    porteur: ['Je rapporte le blé au grenier.'],
    potier: ['Je vais chercher de l\'argile.', 'Je fais un joli pot.'],
    meunier: ['J\'écrase le blé.', 'Bientôt du pain !'],
    construit: ['J\'apporte du bois pour construire !', 'On construit une maison !'],
    enfant: ['Youpi !', 'On joue à chat !', 'Tu ne m\'attraperas pas !'],
    libre: ['Bonjour !', 'Il fait bon ici.', 'Quelle belle vallée !']
  };
  function parler(h) {
    var cat = h.enfant ? 'enfant' : h.reserve ? 'construit' : (h.metier && phrases[h.metier]) ? h.metier : 'libre';
    var l = phrases[cat], texte = l[Math.floor(Math.random() * l.length)];
    paroles = paroles.filter(function (p) { return p.hab !== h.id; });
    paroles.push({ hab: h.id, texte: texte, fin: T + 2.8 });
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
    dire('Cocorico ! Le soleil se lève, tout le monde au travail !');
    sauver();
  });

  // ---------- fiches d'explication (ADR-015) ----------
  var METIERS = {
    sage: 'le sage', bucheron: 'le bûcheron', cueilleur: 'la cueilleuse', tailleur: 'le tailleur de silex',
    chasseur: 'le chasseur', pecheur: 'le pêcheur', peintre: 'la peintre', paysan: 'le paysan',
    berger: 'le berger', porteur: 'le porteur', potier: 'la potière', meunier: 'la meunière'
  };
  var infoMinuteur = null;
  function montrerInfo(o) {
    $('info-img').src = ASSETS[o.img] || '';
    $('info-img').hidden = !ASSETS[o.img];
    $('info-titre').textContent = o.titre;
    $('info-texte').textContent = o.texte;
    $('info-statut').textContent = o.statut || '';
    $('info-statut').hidden = !o.statut;
    var vg = $('info-vignettes'), vs = (o.vignettes || []).filter(function (v) { return ASSETS['vignettes/' + v.img]; });
    vg.innerHTML = '';
    vg.className = vs.length === 1 ? 'une' : '';
    vs.forEach(function (v) {
      var f = document.createElement('figure');
      var im = document.createElement('img'); im.src = ASSETS['vignettes/' + v.img]; im.alt = '';
      var c = document.createElement('figcaption'); c.textContent = v.texte;
      f.appendChild(im); f.appendChild(c);
      f.addEventListener('click', function (e) { e.stopPropagation(); dire(v.texte); });
      vg.appendChild(f);
    });
    vg.hidden = !vs.length;
    $('info').classList.toggle('large', vs.length > 0);
    $('info-voix').onclick = function (e) { e.stopPropagation(); dire(o.texte); };
    $('info').hidden = false;
    dire(o.texte);
    clearTimeout(infoMinuteur);
    infoMinuteur = setTimeout(cacherInfo, o.vignettes && o.vignettes.length ? 22000 : 14000);
  }
  function cacherInfo() { $('info').hidden = true; }
  $('info-fermer').addEventListener('click', function (e) { e.stopPropagation(); cacherInfo(); });
  function resumeType(type) {
    var d = D.batiments[type], l = [];
    if (d.lits) l.push('👥 ' + d.lits + ' personnes y dorment');
    if (d.travail) l.push((d.travail.produit === 'idees' ? '💡' : '🪙') + ' +' + d.travail.qte + ' à chaque fois · ' + METIERS[d.travail.metier]);
    if (d.cout != null) l.push('Coûte 🪙 ' + d.cout);
    return l.join(' · ');
  }
  function infoBatiment(b) {
    var d = D.batiments[b.type], statut;
    if (b.etat === 'chantier') statut = '🔨 Chantier : ' + b.livre + ' bois apporté' + (b.livre > 1 ? 's' : '') + ' sur ' + b.besoin;
    else if (d.travail) {
      var h = monde.habitants.filter(function (q) { return q.id === b.ouvrier; })[0];
      statut = h ? 'Ici travaille ' + METIERS[d.travail.metier] + '. ' + resumeType(b.type).split(' · ')[0] : 'Personne n\'y travaille encore : il faut un nouvel habitant.';
    } else if (d.lits) statut = '👥 ' + d.lits + ' personnes y dorment';
    montrerInfo({ img: d.sprite, titre: d.nom, texte: d.explication || '', statut: statut, vignettes: d.vignettes });
  }
  var INFOS_NATURE = {
    arbre: ['nature/sapin-grand', 'Un arbre', "Le bûcheron coupe les arbres pour avoir du bois. Petit à petit, la forêt recule et laisse de la place pour construire."],
    souche: ['nature/souche', 'Une souche', 'Ici, le bûcheron a coupé un arbre. On peut construire à cet endroit.'],
    rocher: ['nature/rochers', 'Des rochers', 'On ne peut pas construire sur les rochers.'],
    grotte: ['nature/grotte', 'La grotte', "Les premiers humains s'y abritaient. C'est près d'elle qu'on trouve le silex, et qu'on peint sur la roche."],
    mammouth: ['01-pierre/mammouth', 'Le mammouth', "Un éléphant géant couvert de longs poils, qui vivait quand il faisait très froid. Les chasseurs le suivaient pour sa viande, sa fourrure et ses os."],
    chevre: ['02-neolithique/chevre', 'Une chèvre', "Les premiers paysans ont apprivoisé les chèvres : elles donnent du lait et de la laine."],
    gue: ['nature/galets', 'Le gué', "Ici, la rivière est peu profonde : on traverse en marchant sur les pierres."],
    sentier: ['nature/touffe', 'Un sentier', "À force de passer toujours au même endroit, les habitants ont usé l'herbe. Plus tard, on en fera de vraies routes !"]
  };
  function infoNature(cle) { var n = INFOS_NATURE[cle]; montrerInfo({ img: n[0], titre: n[1], texte: n[2] }); }

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
          aideUneFois('chantier', 'Regarde : les habitants vont chercher du bois pour construire !');
          sauver();
        }
      } else son('non');
      return;
    }
    for (var i = 0; i < bulles.length; i++) {
      var bu = bulles[i];
      if (Math.hypot(x - bu.x, y - bu.y) < bu.r) {
        var r = M.recolter(monde, bu.bat);
        if (r) { son('pop'); voler(r.produit === 'idees' ? '💡' : '🪙', bu.x, bu.y, r.produit === 'idees' ? 'c-idees' : 'c-pieces', r.n); }
        return;
      }
    }
    // un habitant ?
    var best2 = null, bd2 = 1e9;
    monde.habitants.forEach(function (h) {
      if (h.dort) return;
      var p = E(h.x, h.y - 30);
      var d = Math.hypot(x - p[0], y - p[1]);
      if (d < bd2) { bd2 = d; best2 = h; }
    });
    if (best2 && bd2 < Math.max(24, 36 * V.s)) { parler(best2); return; }
    // un dormeur ?
    var dormeur = monde.habitants.filter(function (h) {
      var c = couchage[h.id]; if (!h.dort || !c || c.cache) return false;
      var p = E(h.x, h.y);
      if (c.b) { var pb = E(c.b.x, basBat(c.b)), ec = Math.min(48, tailleBat(c.b).w / V.s / Math.max(1, c.n)) * V.s; p = [pb[0] + (c.i - (c.n - 1) / 2) * ec, Math.max(p[1], pb[1] + 6 * V.s)]; }
      return Math.abs(x - p[0]) < 26 * V.s && y < p[1] + 8 * V.s && y > p[1] - 34 * V.s;
    })[0];
    if (dormeur) {
      var cm = couchage[dormeur.id], mais = cm.b && D.batiments[cm.b.type];
      montrerInfo({ img: 'nuit/' + cm.sp, titre: 'Chut… on dort !',
        texte: (mais ? 'On dort bien au chaud dans ' + mais.nom.charAt(0).toLowerCase() + mais.nom.slice(1) + '.' : 'Pas de maison : on dort dehors, à la belle étoile.') +
          (M.toutLeMondeDort(monde) ? ' Appuie sur le coq pour réveiller le village !' : '') });
      return;
    }
    // un animal ?
    var an = monde.animaux.filter(function (a) {
      var p = E(a.x, a.y), lw = (a.espece === 'mammouth' ? 165 : 50) * V.s;
      return Math.abs(x - p[0]) < lw / 2 && y < p[1] + 6 && y > p[1] - lw * 0.8;
    })[0];
    if (an) { infoNature(an.espece); return; }
    // un bâtiment ? (le plus en avant d'abord)
    var bats = monde.batiments.slice().sort(function (a, b2) { return basBat(b2) - basBat(a); });
    for (var n = 0; n < bats.length; n++) {
      var bt = bats[n], t = tailleBat(bt), pb = E(bt.x, basBat(bt));
      if (bt.type === 'passerelle') continue;
      if (Math.abs(x - pb[0]) < t.w * 0.45 && y < pb[1] + 6 && y > pb[1] - t.h * 0.85) { infoBatiment(bt); return; }
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
    if (ici && ici.gue && !T0.passerelle) { infoNature('gue'); return; }
    if (ici && ici.sol === 'herbe' && ici.usure >= 0.4) { infoNature('sentier'); return; }
    cacherInfo();
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
        if (b) { var t = tailleBat(b); pouf(b.x, b.y - t.h / V.s * 0.3, 14); son('fini'); }
        if (b && D.batiments[b.type].lits) aideUneFois('maison', 'Une nouvelle maison ! Une famille va bientôt arriver.');
      } else if (e.type === 'bulle') {
        aideUneFois('bulle', 'Touche les bulles pour ramasser les pièces et les idées !');
      } else if (e.type === 'arrivee') {
        aideUneFois('arrivee', 'Quelqu\'un arrive dans la vallée !');
      }
    });
    var nuit = M.estNuit(monde);
    if (nuit && !etaitNuit && !enScene) {
      var aFeu = monde.batiments.some(function (b) { return b.type === 'feu' && b.etat === 'fini'; });
      if (aFeu) aideUneFois('nuit-feu', 'La nuit tombe. Autour du feu, on a chaud et on y voit clair : le travail continue !');
      else if (monde.decouvertes.feu) aide('Il fait nuit et tout le monde dort… Construis un feu de camp près du village !');
      else if (!ui.aide['nuit1']) aideUneFois('nuit1', 'La nuit tombe ! Brrr, il fait froid et tout noir : tout le monde va dormir. Il faudrait découvrir le feu…');
      else aideUneFois('nuit2', 'Encore la nuit… Avec le feu, on pourrait continuer à travailler. Regarde dans les découvertes !');
    }
    etaitNuit = nuit;
    // tout le monde dort : le coq attend que Joshua fasse lever le soleil (ADR-016)
    var coq = M.toutLeMondeDort(monde) && !enScene;
    if (coq !== !$('btn-reveil').hidden) {
      $('btn-reveil').hidden = !coq;
      if (coq) aideUneFois('reveil', 'Tout le monde dort… Quand tu veux, appuie sur le coq pour faire lever le soleil !');
    }
    if (!ui.aide.idee && monde.idees >= 4 && !Object.keys(monde.decouvertes).length && !enScene) {
      aideUneFois('idee', 'Tu as assez d\'idées ! Touche l\'ampoule pour faire une découverte.');
    }
    if (!ui.aide.construire && monde.pieces >= 6 && monde.t > 25 && !enScene) {
      aideUneFois('construire', 'Tu as des pièces : choisis une construction en bas de l\'écran !');
    }
  }

  // ---------- boucle ----------
  var avant = performance.now(), sauveA = 0;
  function boucle(now) {
    var dt = Math.min(0.1, (now - avant) / 1000);
    avant = now;
    T += dt;
    var simu = dt * VITESSE;
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
  window.__jeu = { monde: function () { return monde; }, M: M, E: E, V: V, toucher: function (x, y) { toucher(x, y); }, choisir: choisir, ouvrirDecouvertes: ouvrirDecouvertes };

  chargerImages(function () {
    redim();
    $('epoque-nom').textContent = D.epoques.filter(function (x) { return x.id === monde.epoque; })[0].nom;
    if (nouvellePartie && !params.has('test')) montrerEpoque();
    requestAnimationFrame(function (t) { avant = t; boucle(t); });
  });
  if (window.speechSynthesis) speechSynthesis.getVoices();
})();
