// Un joueur automatique raisonnable, partagé par les tests et les mesures d'économie.
const Monde = require('../src/monde.js');
const D = require('../src/data.js');

// un tour de jeu : récolter, découvrir, construire ou améliorer ; renvoie 'epoque' quand il change d'époque
function tour(m, stats) {
  stats = stats || {};
  if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); // le joueur appuie sur le coq
  m.batiments.forEach(b => Monde.recolter(m, b.id));
  Monde.decouvertesEpoque(m).forEach(id => Monde.decouvrir(m, id));
  const fin = Monde.epoqueTerminee(m) ? 'fin' : undefined;
  const possibles = Monde.construisibles(m).filter(t => !D.batiments[t].deco);
  const peut = t => Monde.peutConstruire(m, t);
  const nourrit = t => D.batiments[t].travail && D.batiments[t].travail.produit === 'nourriture';
  const libres = m.habitants.filter(h => !h.enfant && !h.travail).length;
  const postes = m.batiments.reduce((s, b) => s + (b.etat === 'fini' && !Monde.inactif(m, b) ? Monde.places(b) - (b.ouvriers || []).length : 0), 0);
  const pleins = m.habitants.length >= Monde.lits(m);
  const affame = m.faim > 0 || m.nourriture < Monde.besoinRepas(m, m.habitants.length + 2);
  const prix = t => D.batiments[t].cout;
  let choix = null;
  const maison = possibles.filter(t => D.batiments[t].lits && peut(t)).sort((a, b) => D.batiments[b].lits - D.batiments[a].lits)[0];
  // 1. nourrir le village (ADR-032) : un bâtiment de plus, ou une maison si personne ne peut y travailler
  const vides = m.batiments.some(b => b.etat === 'fini' && nourrit(b.type) && (b.ouvriers || []).length < Monde.places(b) && !Monde.inactif(m, b));
  if (affame && vides && pleins) choix = possibles.filter(t => D.batiments[t].lits).sort((a, b) => prix(a) - prix(b))[0];
  else if (affame) choix = possibles.filter(nourrit).sort((a, b) => prix(a) - prix(b))[0];
  // 2. une maison quand des postes attendent quelqu'un
  if (!choix && pleins && !affame && maison && (postes > libres || m.nourriture > Monde.besoinRepas(m, m.habitants.length + 5))) choix = maison;
  // 3. un nouveau bâtiment qu'on n'a pas encore (on économise pour lui)
  if (!choix) choix = possibles.filter(t => !m.batiments.some(b => b.type === t)).sort((a, b) => prix(a) - prix(b))[0];
  // 4. des maisons quand il y a du travail pour les nouveaux venus
  if (!choix && pleins && !affame && postes >= libres) choix = possibles.filter(t => D.batiments[t].lits).sort((a, b) => D.batiments[b].lits - D.batiments[a].lits)[0];
  // de temps en temps, il préfère améliorer ce qu'il a (ADR-021, ADR-031)
  // une fois sur trois, il économise pour une amélioration plutôt que pour un nouveau bâtiment
  if (!affame && (stats.achats || 0) % 3 === 2) {
    const a = m.batiments.map(b => ({ b, a: Monde.amelioration(m, b) })).filter(x => x.a && x.a.genre !== 'etape').sort((x, y) => x.a.cout - y.a.cout)[0];
    if (a) { if (a.a.cout <= m.pieces) { Monde.ameliorer(m, a.b.id); stats.ameliores = (stats.ameliores || 0) + 1; stats.achats = (stats.achats || 0) + 1; } return fin; }
  }
  if (choix && peut(choix)) { Monde.construire(m, choix, Monde.emplacementsLibres(m, choix)[0]); stats.construits = (stats.construits || 0) + 1; stats.achats = (stats.achats || 0) + 1; return fin; }
  if (choix && D.batiments[choix].cout > m.pieces) return fin; // on économise
  ameliorer(m, stats);
  return fin;
}
function ameliorer(m, stats) {
  const ams = m.batiments.map(b => ({ b, a: Monde.amelioration(m, b) })).filter(x => x.a && x.a.genre !== 'etape' && x.a.cout <= m.pieces).sort((x, y) => x.a.cout - y.a.cout);
  if (!ams.length) return false;
  Monde.ameliorer(m, ams[0].b.id); stats.ameliores = (stats.ameliores || 0) + 1;
  return true;
}
module.exports = { tour };
