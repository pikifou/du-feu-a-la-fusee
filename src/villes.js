// Les villes de l'enfant (ADR-063) : cinq au plus, « Ville A » à « Ville E ».
// Logique pure, sans écran ni stockage : jeu.js range les villes, ce module décide des noms, de la limite,
// de ce qu'on confie à Ludiworld, et compresse les villes qui dorment.
var Villes = (function () {
  var MAX = 5, LETTRES = ['A', 'B', 'C', 'D', 'E'], JETEES_MAX = 20;

  function nomLibre(liste) {
    var pris = {};
    (liste || []).forEach(function (v) { pris[v.id] = true; });
    for (var i = 0; i < LETTRES.length; i++) if (!pris[LETTRES[i]]) return LETTRES[i];
    return null;
  }
  function peutCreer(liste) { return (liste || []).length < MAX && nomLibre(liste) !== null; }
  function nouvelle(liste, maintenant) {
    var id = nomLibre(liste);
    return { id: id, nom: 'Ville ' + id, partie: null, epoque: 1, ms: 0, maj: maintenant };
  }
  function retirer(liste, id) { return (liste || []).filter(function (v) { return v.id !== id; }); }

  // Ce que Ludiworld garde (250 000 caractères au plus) : la ville en cours, la liste, et les autres villes
  // compressées si elles tiennent ; sinon la ville en cours et la liste seulement.
  function paquet(o, max) {
    max = max || 240000;
    var p = { v: 3, active: o.active, liste: o.liste, monde: o.monde, ui: o.ui };
    if (o.jetees && o.jetees.length) p.jetees = o.jetees.slice(-JETEES_MAX);
    if (o.autres) {
      p.autres = o.autres;
      if (JSON.stringify(p).length > max) delete p.autres;
    }
    return p;
  }

  // Relit ce que Ludiworld rend : un paquet de villes, ou une sauvegarde d'avant les villes (une seule partie).
  function lire(d) {
    if (!d || !d.monde) return null;
    if (d.v === 3) return { active: d.active, liste: d.liste || [], monde: d.monde, ui: d.ui || {}, autres: d.autres || {}, jetees: (d.jetees || []).slice(-JETEES_MAX) };
    if (d.v === 2) {
      var a = { id: 'A', nom: 'Ville A', partie: d.monde.partie || null, epoque: d.monde.epoque || 1, ms: Math.round((d.monde.t || 0) * 1000), maj: 0 };
      return { active: 'A', liste: [a], monde: d.monde, ui: d.ui || {}, autres: {}, jetees: [] };
    }
    return null;
  }

  // Une copie venue d'un autre appareil : sa liste fait foi, et les villes de cet appareil qu'elle ne connaît pas
  // (reconnues à leur partie) sont gardées, sous une lettre libre si la leur est prise. Au-delà de cinq, mises de côté.
  // places : les villes de l'appareil gardées (ancienne lettre -> nouvelle) ; memes : la même ville des deux côtés.
  // jetees : les parties des villes jetées d'un côté ou de l'autre ; elles ne reviennent pas, sauf celle que l'autre
  // appareil est en train de jouer (elle est vivante là-bas).
  function fusionner(locale, distante) {
    var jetees = (locale.jetees || []).slice();
    (distante.jetees || []).forEach(function (p) { if (jetees.indexOf(p) < 0) jetees.push(p); });
    var jouee = (distante.liste || []).filter(function (r) { return r.id === distante.active; })[0];
    if (jouee && jouee.partie) jetees = jetees.filter(function (p) { return p !== jouee.partie; });
    var vivante = function (v) { return !v.partie || jetees.indexOf(v.partie) < 0; };
    var liste = (distante.liste || []).filter(vivante).map(function (v) { return Object.assign({}, v); }), places = [], memes = [], restes = [];
    (locale.liste || []).filter(vivante).forEach(function (v) {
      var meme = v.partie && liste.filter(function (r) { return r.partie === v.partie; })[0];
      if (meme) { memes.push({ local: v.id, distant: meme.id }); return; }
      var prise = liste.some(function (r) { return r.id === v.id; });
      var id = prise ? nomLibre(liste) : v.id;
      if (!id || liste.length >= MAX) { restes.push(v); return; }
      liste.push(Object.assign({}, v, { id: id, nom: 'Ville ' + id }));
      places.push({ de: v.id, vers: id });
    });
    return { active: distante.active, liste: liste, places: places, memes: memes, restes: restes, jetees: jetees.slice(-JETEES_MAX) };
  }

  // deflate-raw puis base64 ; null si le navigateur ne sait pas compresser
  function versBase64(octets) {
    var s = '';
    for (var i = 0; i < octets.length; i += 32768) s += String.fromCharCode.apply(null, octets.subarray(i, i + 32768));
    return btoa(s);
  }
  function depuisBase64(b64) {
    var s = atob(b64), o = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) o[i] = s.charCodeAt(i);
    return o;
  }
  function passer(octets, flux) {
    return new Response(new Blob([octets]).stream().pipeThrough(flux)).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function compresser(texte) {
    if (typeof CompressionStream === 'undefined') return Promise.resolve(null);
    try {
      return passer(new TextEncoder().encode(texte), new CompressionStream('deflate-raw')).then(versBase64, function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }
  function decompresser(b64) {
    var o = depuisBase64(b64), flux = null;
    try { flux = new DecompressionStream('deflate-raw'); } catch (e) { flux = null; }
    if (!flux) { // un navigateur qui ne sait pas décompresser (iPad resté en iOS 15) : à la main, plus lent mais pareil
      try { return Promise.resolve(new TextDecoder().decode(inflate(o))); } catch (e) { return Promise.reject(e); }
    }
    return passer(o, flux).then(function (x) { return new TextDecoder().decode(x); });
  }

  // Décompression deflate brute (RFC 1951) en JavaScript, d'après puff (zlib) : codes de Huffman canoniques,
  // blocs non compressés, fixes et dynamiques.
  var LBASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258],
    LPLUS = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0],
    DBASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577],
    DPLUS = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13],
    ORDRE = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
  function table(longueurs, n) {
    var compte = new Uint16Array(16), symb = new Uint16Array(n), offs = new Uint16Array(16), i;
    for (i = 0; i < n; i++) compte[longueurs[i]]++;
    compte[0] = 0;
    for (i = 1; i < 16; i++) offs[i] = offs[i - 1] + compte[i - 1];
    for (i = 0; i < n; i++) if (longueurs[i]) symb[offs[longueurs[i]]++] = i;
    return { compte: compte, symb: symb };
  }
  function inflate(src) {
    var pos = 0, bits = 0, nb = 0, out = new Uint8Array(Math.max(1024, src.length * 4)), o = 0;
    function bit() {
      if (!nb) { if (pos >= src.length) throw new Error('données compressées tronquées'); bits = src[pos++]; nb = 8; }
      var b = bits & 1; bits >>= 1; nb--; return b;
    }
    function lire(n) { var v = 0; for (var i = 0; i < n; i++) v |= bit() << i; return v; }
    function place(n) { if (o + n > out.length) { var b = new Uint8Array(Math.max(out.length * 2, o + n)); b.set(out); out = b; } }
    function decoder(t) {
      var code = 0, premier = 0, index = 0;
      for (var l = 1; l < 16; l++) {
        code |= bit();
        var c = t.compte[l];
        if (code - c < premier) return t.symb[index + (code - premier)];
        index += c; premier = (premier + c) << 1; code <<= 1;
      }
      throw new Error('code de Huffman invalide');
    }
    function blocs(lit, dist) {
      for (;;) {
        var s = decoder(lit);
        if (s < 256) { place(1); out[o++] = s; continue; }
        if (s === 256) return;
        s -= 257;
        if (s >= 29) throw new Error('longueur invalide');
        var lg = LBASE[s] + lire(LPLUS[s]), d = decoder(dist);
        if (d >= 30) throw new Error('distance invalide');
        var ds = DBASE[d] + lire(DPLUS[d]);
        if (ds > o) throw new Error('distance trop loin');
        place(lg);
        for (var k = 0; k < lg; k++, o++) out[o] = out[o - ds];
      }
    }
    var fixeL = null, fixeD = null, fin = 0;
    while (!fin) {
      fin = bit();
      var type = lire(2);
      if (type === 0) {
        bits = 0; nb = 0;
        if (pos + 4 > src.length) throw new Error('données compressées tronquées');
        var n = src[pos] | (src[pos + 1] << 8); pos += 4;
        if (pos + n > src.length) throw new Error('données compressées tronquées');
        place(n); out.set(src.subarray(pos, pos + n), o); o += n; pos += n;
      } else if (type === 1) {
        if (!fixeL) {
          var lf = new Uint8Array(288), i;
          for (i = 0; i < 144; i++) lf[i] = 8;
          for (; i < 256; i++) lf[i] = 9;
          for (; i < 280; i++) lf[i] = 7;
          for (; i < 288; i++) lf[i] = 8;
          var df = new Uint8Array(30); df.fill(5);
          fixeL = table(lf, 288); fixeD = table(df, 30);
        }
        blocs(fixeL, fixeD);
      } else if (type === 2) {
        var hlit = lire(5) + 257, hdist = lire(5) + 1, hclen = lire(4) + 4, lc = new Uint8Array(19), j;
        for (j = 0; j < hclen; j++) lc[ORDRE[j]] = lire(3);
        var tc = table(lc, 19), lg2 = new Uint8Array(hlit + hdist);
        for (j = 0; j < hlit + hdist;) {
          var sy = decoder(tc), rep = 0, val = 0;
          if (sy < 16) { lg2[j++] = sy; continue; }
          if (sy === 16) { if (!j) throw new Error('répétition sans longueur'); val = lg2[j - 1]; rep = 3 + lire(2); }
          else if (sy === 17) rep = 3 + lire(3);
          else rep = 11 + lire(7);
          if (j + rep > hlit + hdist) throw new Error('trop de longueurs');
          while (rep--) lg2[j++] = val;
        }
        blocs(table(lg2.subarray(0, hlit), hlit), table(lg2.subarray(hlit), hdist));
      } else throw new Error('type de bloc invalide');
    }
    return out.subarray(0, o);
  }

  return { MAX: MAX, nomLibre: nomLibre, peutCreer: peutCreer, nouvelle: nouvelle, retirer: retirer, paquet: paquet, lire: lire, fusionner: fusionner, compresser: compresser, decompresser: decompresser };
})();
if (typeof module !== 'undefined') module.exports = Villes;
