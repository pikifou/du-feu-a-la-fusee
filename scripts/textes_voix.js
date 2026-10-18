// Liste de toutes les phrases dites à voix haute (pour les enregistrer en voix, cf. scripts/voix.py).
// Usage : node scripts/textes_voix.js > assets/voix/textes.json
const D = require('../src/data.js');
const crypto = require('crypto');
// même normalisation que dans jeu.js (cleVoix)
function cle(t) { return String(t || '').replace(/<[^>]+>/g, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').replace(/ ([.,])/g, '$1').trim(); }
const l = [];
const ajoute = t => { const c = cle(t); if (c) l.push(c); };
for (const d of Object.values(D.decouvertes)) { ajoute(d.nom); ajoute(d.texte); (d.faits || []).forEach(ajoute); }
for (const d of Object.values(D.pages)) { ajoute(d.nom); ajoute(d.texte); (d.faits || []).forEach(ajoute); }
for (const b of Object.values(D.batiments)) { ajoute(b.resume); ajoute(b.explication); (b.vignettes || []).forEach(v => ajoute(v.texte)); }
for (const e of D.epoques) ajoute(e.intro);
for (const l2 of Object.values(D.textes.phrases)) l2.forEach(ajoute);
for (const n of Object.values(D.textes.nature)) ajoute(n[2]);
for (const a of Object.values(D.textes.aides)) typeof a === 'string' ? ajoute(a) : Object.values(a).forEach(ajoute);
for (const d of Object.values(D.decouvertes)) {
  const p = d.prerequis; const n = p.length;
  for (let m = 1; m < (1 << n); m++) ajoute(D.textes.prerequis(p.filter((_, i) => m & (1 << i))));
}
const uniques = [...new Set(l)];
const out = uniques.map(t => ({ id: crypto.createHash('sha1').update(t).digest('hex').slice(0, 10), texte: t }));
console.log(JSON.stringify(out, null, 1));
