// Les villes de l'enfant (ADR-063) : cinq au plus, « Ville A » à « Ville E ».
// Logique pure, sans écran ni stockage : jeu.js range les villes, ce module décide des noms, de la limite,
// de ce qu'on confie à Ludiworld, et compresse les villes qui dorment.
var Villes = (function () {
  var MAX = 5, LETTRES = ['A', 'B', 'C', 'D', 'E'];

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
    if (o.autres) {
      p.autres = o.autres;
      if (JSON.stringify(p).length > max) delete p.autres;
    }
    return p;
  }

  // Relit ce que Ludiworld rend : un paquet de villes, ou une sauvegarde d'avant les villes (une seule partie).
  function lire(d) {
    if (!d || !d.monde) return null;
    if (d.v === 3) return { active: d.active, liste: d.liste || [], monde: d.monde, ui: d.ui || {}, autres: d.autres || {} };
    if (d.v === 2) {
      var a = { id: 'A', nom: 'Ville A', partie: d.monde.partie || null, epoque: d.monde.epoque || 1, ms: Math.round((d.monde.t || 0) * 1000), maj: 0 };
      return { active: 'A', liste: [a], monde: d.monde, ui: d.ui || {}, autres: {} };
    }
    return null;
  }

  // Une copie venue d'un autre appareil : sa liste fait foi, et les villes de cet appareil qu'elle ne connaît pas
  // (reconnues à leur partie) sont gardées, sous une lettre libre si la leur est prise. Au-delà de cinq, mises de côté.
  // places : les villes de l'appareil gardées (ancienne lettre -> nouvelle) ; memes : la même ville des deux côtés.
  function fusionner(locale, distante) {
    var liste = (distante.liste || []).map(function (v) { return Object.assign({}, v); }), places = [], memes = [], restes = [];
    (locale.liste || []).forEach(function (v) {
      var meme = v.partie && liste.filter(function (r) { return r.partie === v.partie; })[0];
      if (meme) { memes.push({ local: v.id, distant: meme.id }); return; }
      var prise = liste.some(function (r) { return r.id === v.id; });
      var id = prise ? nomLibre(liste) : v.id;
      if (!id || liste.length >= MAX) { restes.push(v); return; }
      liste.push(Object.assign({}, v, { id: id, nom: 'Ville ' + id }));
      places.push({ de: v.id, vers: id });
    });
    return { active: distante.active, liste: liste, places: places, memes: memes, restes: restes };
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
    return passer(depuisBase64(b64), new DecompressionStream('deflate-raw')).then(function (o) { return new TextDecoder().decode(o); });
  }

  return { MAX: MAX, nomLibre: nomLibre, peutCreer: peutCreer, nouvelle: nouvelle, retirer: retirer, paquet: paquet, lire: lire, fusionner: fusionner, compresser: compresser, decompresser: decompresser };
})();
if (typeof module !== 'undefined') module.exports = Villes;
