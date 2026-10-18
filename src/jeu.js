// Rendu, interface et boucle de jeu (navigateur).
(function () {
  var D = Donnees, C = Carte, M = Monde;
  var cv = document.getElementById('ecran');
  var ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var VITESSE = +params.get('x') || 1;
  var CLE = 'feu-fusee-v1';

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
      if (o && o.v === 1) { ui = Object.assign(ui, o.ui || {}); return M.importer(o.monde); }
    } catch (e) {}
    return null;
  }
  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify({ v: 1, monde: M.exporter(monde), ui: ui })); } catch (e) {}
  }
  var monde = params.has('neuf') ? null : charger();
  var nouvellePartie = !monde;
  if (!monde) monde = M.nouveau((Date.now() % 100000) + 1);

  // ---------- vue (caméra rapprochée, glisser pour se déplacer, pincer pour zoomer) ----------
  var V = { s: 1, ox: 0, oy: 0, W: 0, H: 0, dpr: 1, cx: 1300, cy: 830, sMin: 0.3, sMax: 1.6, init: false };
  function redim() {
    V.dpr = Math.min(window.devicePixelRatio || 1, 2);
    V.W = innerWidth; V.H = innerHeight;
    cv.width = Math.round(V.W * V.dpr); cv.height = Math.round(V.H * V.dpr);
    V.sMin = Math.min(V.W / C.cadre.l, V.H / C.cadre.h);
    V.sMax = Math.max(V.sMin, 1.5);
    if (!V.init) { V.init = true; V.s = V.W / (V.W < 1000 ? 1200 : 1500); V.cx = 1240; V.cy = 830; }
    V.s = Math.max(V.sMin, Math.min(V.sMax, V.s));
    borner();
  }
  function borner() {
    var dw = V.W / 2 / V.s, dh = V.H / 2 / V.s;
    var x0 = C.cadre.x, x1 = C.cadre.x + C.cadre.l, y0 = C.cadre.y - 60, y1 = C.cadre.y + C.cadre.h + 60;
    V.cx = x1 - x0 <= 2 * dw ? (x0 + x1) / 2 : Math.max(x0 + dw, Math.min(x1 - dw, V.cx));
    V.cy = y1 - y0 <= 2 * dh ? (y0 + y1) / 2 : Math.max(y0 + dh, Math.min(y1 - dh, V.cy));
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
  function dessinerFond() {
    ctx.fillStyle = '#e2d4ba'; ctx.fillRect(0, 0, V.W, V.H);
    var im = IMG.plateau;
    if (!im) return;
    // on prolonge les bords du plateau pour que le fond soit continu
    var iw = im.width, ih = im.height;
    var bx = V.ox, by = V.oy, bw = C.largeur * V.s, bh = C.hauteur * V.s;
    if (by + bh < V.H) ctx.drawImage(im, 0, ih - 2, iw, 2, bx, by + bh - 1, bw, V.H - by - bh + 1);
    if (by > 0) ctx.drawImage(im, 0, 0, iw, 2, bx, 0, bw, by + 1);
    if (bx > 0) ctx.drawImage(im, 0, 0, 2, ih, 0, Math.max(0, by), bx + 1, bh);
    if (bx + bw < V.W) ctx.drawImage(im, iw - 2, 0, 2, ih, bx + bw - 1, Math.max(0, by), V.W - bx - bw + 1, bh);
    ctx.drawImage(im, bx, by, bw, bh);
  }
  function E(x, y) { return [V.ox + x * V.s, V.oy + y * V.s]; }

  // ---------- son ----------
  var audio = null;
  function son(type) {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime;
      var notes = type === 'pop' ? [[880, 0, .08], [1320, .05, .1]]
        : type === 'fini' ? [[523, 0, .15], [659, .1, .15], [784, .2, .25]]
        : type === 'decouverte' ? [[523, 0, .2], [659, .15, .2], [784, .3, .2], [1047, .45, .4]]
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
  function tailleBat(b) {
    var d = D.batiments[b.type], im = IMG[d.sprite];
    var w = d.largeur * V.s;
    return { w: w, h: im ? w * im.height / im.width : w, im: im };
  }
  function dessinerSprite(im, x, y, w, h, alpha) {
    if (!im) return;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.drawImage(im, x - w / 2, y - h * 0.93, w, h);
    ctx.globalAlpha = 1;
  }
  function dessinerBat(b) {
    var p = E(b.x, b.y), t = tailleBat(b), d = D.batiments[b.type];
    if (b.etat === 'fini') {
      var k = 1;
      var age = monde.t - (b.apparu || -10);
      if (age < 0.7) k = 1 + Math.sin(age / 0.7 * Math.PI) * 0.18 * (1 - age / 0.7) - (age < 0.1 ? 0.3 * (1 - age / 0.1) : 0);
      var w = t.w * k, h = t.h * (2 - k);
      dessinerSprite(t.im, p[0], p[1], w, h);
      return;
    }
    var prog = b.besoin ? b.livre / b.besoin : 1;
    if (b.ancien) {
      var da = D.batiments[b.ancien], ia = IMG[da.sprite], wa = da.largeur * V.s;
      dessinerSprite(ia, p[0], p[1], wa, wa * ia.height / ia.width, 1 - prog * 0.9);
    }
    // piquets du chantier
    ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = Math.max(2, 4 * V.s); ctx.lineCap = 'round';
    var rx = t.w * 0.42, ry = t.w * 0.2;
    [[-rx, 0], [rx, 0], [0, -ry], [0, ry]].forEach(function (q) {
      ctx.beginPath(); ctx.moveTo(p[0] + q[0], p[1] + q[1] - 4 * V.s); ctx.lineTo(p[0] + q[0], p[1] + q[1] - 26 * V.s); ctx.stroke();
    });
    ctx.globalAlpha = 0.5; ctx.setLineDash([6 * V.s, 6 * V.s]); ctx.lineWidth = Math.max(1.5, 2.5 * V.s);
    ctx.beginPath(); ctx.moveTo(p[0] - rx, p[1] - 18 * V.s); ctx.lineTo(p[0], p[1] - ry - 18 * V.s); ctx.lineTo(p[0] + rx, p[1] - 18 * V.s); ctx.lineTo(p[0], p[1] + ry - 18 * V.s); ctx.closePath(); ctx.stroke();
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

  var tailles = { sage: 100, enfant: 74, adulte: 94 };
  function dessinerHab(h) {
    var im = IMG['habitants/' + h.allure];
    if (!im) return;
    if (h.dort) {
      // il dort dans sa hutte : on ne voit que les « z »
      var pz = E(h.x, h.y - 70);
      var k = (T * 0.5 + h.id * 0.37) % 1;
      ctx.font = '700 ' + Math.round(14 + 10 * k) + 'px Fredoka, system-ui';
      ctx.fillStyle = 'rgba(235,240,255,' + (1 - k) + ')';
      ctx.textAlign = 'center';
      ctx.fillText('z', pz[0] + k * 18, pz[1] - k * 40 * V.s);
      return;
    }
    var H = (h.enfant ? tailles.enfant : h.allure === 'sage' ? tailles.sage : tailles.adulte) * V.s;
    var w = H * im.width / im.height;
    var p = E(h.x, h.y), ph = h.id * 1.7;
    var bob = 0, rot = 0, sy = 1;
    if (h.marche) { bob = Math.abs(Math.sin(T * 11 + ph)) * 7 * V.s; rot = Math.sin(T * 11 + ph) * 0.05; }
    else if (h.anim === 'travail') { rot = Math.sin(T * 7 + ph) * 0.11; bob = Math.abs(Math.sin(T * 7 + ph)) * 3 * V.s; }
    else if (h.anim === 'marteau') { rot = Math.sin(T * 15 + ph) * 0.14; bob = Math.abs(Math.sin(T * 15 + ph)) * 5 * V.s; }
    else if (h.anim === 'jeu') { bob = Math.abs(Math.sin(T * 9 + ph)) * 14 * V.s; }
    else { sy = 1 + Math.sin(T * 2 + ph) * 0.018; }
    ombre(p[0], p[1], w * 0.3, 6 * V.s);
    ctx.save();
    ctx.translate(p[0], p[1] - bob);
    ctx.rotate(rot);
    ctx.scale(h.dir < 0 ? -1 : 1, sy);
    ctx.drawImage(im, -w / 2, -H * 0.97, w, H);
    ctx.restore();
    if (h.porte) dessinerObjet(h.porte, p[0], p[1] - H - bob + 4 * V.s, V.s * 1.1);
    if (h.pouf > 0) {
      var k = 1 - h.pouf / 0.6;
      ctx.fillStyle = 'rgba(255,255,255,' + (1 - k) + ')';
      for (var i = 0; i < 6; i++) { var a = i / 6 * 6.28; ctx.beginPath(); ctx.arc(p[0] + Math.cos(a) * 30 * k * V.s, p[1] - H / 2 + Math.sin(a) * 30 * k * V.s, (12 - 8 * k) * V.s, 0, 7); ctx.fill(); }
    }
    // éclats de travail
    if (!h.marche && (h.anim === 'travail' || h.anim === 'marteau') && Math.random() < 0.04) {
      particule({ type: 'eclat', x: h.x + (Math.random() - 0.5) * 20, y: h.y - 30, vx: (Math.random() - 0.5) * 80, vy: -60 - Math.random() * 40, max: 0.6, r: 4, c: h.anim === 'marteau' ? '170,120,70' : '210,190,140' });
    }
  }

  function dessinerAnimal(a) {
    var im = IMG[a.espece === 'mammouth' ? '01-pierre/mammouth' : '02-neolithique/chevre'];
    if (!im) return;
    var w = (a.espece === 'mammouth' ? 175 : 62) * V.s, H = w * im.height / im.width;
    var p = E(a.x, a.y), bob = a.marche ? Math.abs(Math.sin(T * (a.espece === 'mammouth' ? 4 : 9) + a.id)) * 4 * V.s : 0;
    ombre(p[0], p[1], w * 0.35, 8 * V.s, 0.18);
    ctx.save(); ctx.translate(p[0], p[1] - bob); ctx.scale(a.dir < 0 ? 1 : -1, 1);
    ctx.drawImage(im, -w / 2, -H * 0.93, w, H); ctx.restore();
  }

  function dessinerGue() {
    var pass = monde.batiments.filter(function (b) { return b.type === 'passerelle' && b.etat === 'fini'; })[0];
    if (pass) return;
    var g = C.gue;
    for (var i = 0; i <= 5; i++) {
      var k = i / 5, x = g.gauche[0] + (g.droite[0] - g.gauche[0]) * k, y = g.gauche[1] + (g.droite[1] - g.gauche[1]) * k;
      var p = E(x + (i % 2 ? 8 : -8), y);
      ctx.fillStyle = '#8f8a86'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 15 * V.s, 8 * V.s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#b4afaa'; ctx.beginPath(); ctx.ellipse(p[0] - 2 * V.s, p[1] - 3 * V.s, 11 * V.s, 5 * V.s, 0, 0, 7); ctx.fill();
    }
  }

  var bulles = [];
  function dessinerBulles() {
    bulles = [];
    monde.batiments.forEach(function (b) {
      if (b.stock <= 0 || b.etat !== 'fini') return;
      var tr = D.batiments[b.type].travail;
      var t = tailleBat(b), p = E(b.x, b.y);
      var r = Math.max(15, Math.min(26, 30 * V.s));
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

  function dessinerEmplacements() {
    if (!choix) return;
    var libres = M.emplacementsLibres(monde, choix);
    var puls = 1 + Math.sin(T * 5) * 0.08;
    libres.forEach(function (q) {
      var p = E(q[0], q[1]);
      var rx = D.batiments[choix].largeur * 0.4 * V.s * puls, ry = rx * 0.52;
      ctx.fillStyle = 'rgba(255,248,220,.45)'; ctx.beginPath(); ctx.ellipse(p[0], p[1], rx, ry, 0, 0, 7); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.stroke();
      ctx.fillStyle = '#e9873b'; ctx.font = '700 ' + Math.round(Math.max(16, 36 * V.s)) + 'px Fredoka, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', p[0], p[1] + 1);
    });
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
      if (!feu && !(d.lits && Math.random() < 0.18)) return;
      var t = tailleBat(b);
      var haut = feu ? 0.55 : 0.85;
      particule({ type: 'fumee', x: b.x + (feu ? 0 : t.w / V.s * 0.1), y: b.y - t.h / V.s * haut, vx: 6 + Math.random() * 8, vy: -28 - Math.random() * 10, max: 2.6, r: feu ? 9 : 11, c: '250,248,245' });
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
    feux.forEach(function (f) { var p = E(f.x, f.y - 20); trou(p[0], p[1], M.RAYON_FEU * V.s * vacille, 1, 0.62); });
    // fenêtres éclairées des maisons
    monde.batiments.forEach(function (b) {
      if (b.etat !== 'fini' || !D.batiments[b.type].lits || monde.epoque < 2) return;
      var t = tailleBat(b), p = E(b.x, b.y);
      trou(p[0], p[1] - t.h * 0.35, 80 * V.s, 0.7, 0.8);
    });
    nctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(nuitCv, 0, 0); ctx.restore();
    // lueur chaude du feu
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    feux.forEach(function (f) {
      var p = E(f.x, f.y - 20), r = M.RAYON_FEU * V.s * 0.55 * vacille;
      var g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      g.addColorStop(0, 'rgba(255,130,50,' + (0.26 * d) + ')'); g.addColorStop(1, 'rgba(255,110,40,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
    });
    ctx.restore();
  }

  function dessiner(dt) {
    ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    dessinerFond();
    dessinerGue();
    var liste = [];
    monde.batiments.forEach(function (b) {
      var plat = b.type === 'champ-ble' || b.type === 'passerelle';
      liste.push({ y: plat ? b.y - 400 : b.y, f: dessinerBat, o: b });
    });
    monde.habitants.forEach(function (h) { liste.push({ y: h.y, f: dessinerHab, o: h }); });
    monde.animaux.forEach(function (a) { liste.push({ y: a.y, f: dessinerAnimal, o: a }); });
    liste.sort(function (a, b) { return a.y - b.y; });
    liste.forEach(function (e) { e.f(e.o); });
    fumees(dt);
    dessinerParts(dt);
    dessinerNuit();
    dessinerEmplacements();
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
      $('placement-texte').textContent = 'Où poser ' + D.batiments[type].nom.toLowerCase() + ' ?';
      pl.style.display = 'flex';
    } else pl.style.display = 'none';
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

  function toucher(x, y) {
    if (choix) {
      var libres = M.emplacementsLibres(monde, choix), best = null, bd = 1e9;
      libres.forEach(function (q) {
        var p = E(q[0], q[1]);
        var d = Math.hypot((x - p[0]) / 1.0, (y - p[1]) * 1.8);
        if (d < bd) { bd = d; best = q; }
      });
      if (best && bd < Math.max(40, D.batiments[choix].largeur * 0.5 * V.s)) {
        var type = choix;
        var b = M.construire(monde, type, best);
        if (b) {
          son('pose');
          var p = E(b.x, b.y);
          ui.nouveaux = ui.nouveaux.filter(function (k) { return k !== type; });
          pouf(b.x, b.y, 8, '210,190,150');
          choisir(null);
          aideUneFois('chantier', 'Regarde : les habitants vont chercher du bois pour construire !');
          sauver();
        }
      }
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
    var best2 = null, bd2 = 1e9;
    monde.habitants.forEach(function (h) {
      var p = E(h.x, h.y - 45);
      var d = Math.hypot(x - p[0], y - p[1]);
      if (d < bd2) { bd2 = d; best2 = h; }
    });
    if (best2 && bd2 < Math.max(28, 50 * V.s)) parler(best2);
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
