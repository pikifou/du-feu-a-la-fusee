// Simulation d'une partie complète par un joueur automatique.
// node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const Monde = require('../src/monde.js');
const Terrain = require('../src/terrain.js');
const D = require('../src/data.js');

// Joueur : récolte toutes les `reflexe` secondes, découvre dès que possible,
// construit le bâtiment débloqué le moins cher qu'il n'a pas encore, sinon une maison.
function jouer(graine, reflexe, maxMin) {
  const m = Monde.nouveau(graine);
  const dt = 0.1;
  let prochain = 0;
  const jalons = {};
  while (m.t < maxMin * 60) {
    Monde.pas(m, dt);
    m.evenements.length = 0;
    if (m.t < prochain) continue;
    prochain = m.t + reflexe;
    if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); // le joueur appuie sur le coq
    m.batiments.forEach(b => Monde.recolter(m, b.id));
    Monde.decouvertesEpoque(m).forEach(id => Monde.decouvrir(m, id));
    if (Monde.epoqueTerminee(m)) {
      jalons['epoque' + m.epoque] = m.t;
      if (!Monde.passerEpoque(m)) break;
      continue;
    }
    const possibles = Monde.construisibles(m).filter(t => Monde.peutConstruire(m, t));
    const neufs = possibles.filter(t => !m.batiments.some(b => b.type === t));
    const pleins = m.habitants.length >= Monde.lits(m);
    let choix = neufs.sort((a, b) => D.batiments[a].cout - D.batiments[b].cout)[0];
    if (!choix && pleins) choix = possibles.filter(t => D.batiments[t].lits).sort((a, b) => D.batiments[b].lits - D.batiments[a].lits)[0];
    if (choix) Monde.construire(m, choix, Monde.emplacementsLibres(m, choix)[0]);
  }
  return { m, jalons };
}

test('une partie se termine : âge de pierre puis néolithique', () => {
  for (const graine of [1, 2, 3]) {
    const { m, jalons } = jouer(graine, 5, 60);
    assert.ok(jalons.epoque1, 'âge de pierre fini (graine ' + graine + ')');
    assert.ok(jalons.epoque2, 'néolithique fini (graine ' + graine + ')');
    assert.ok(m.fini, 'fin du prototype atteinte');
    console.log(`graine ${graine} : pierre ${(jalons.epoque1 / 60).toFixed(1)} min, néolithique ${((jalons.epoque2 - jalons.epoque1) / 60).toFixed(1)} min, ${m.habitants.length} habitants, ${m.batiments.length} bâtiments`);
  }
});

test('rythme avec un joueur lent (récolte toutes les 20 s)', () => {
  const { jalons } = jouer(4, 20, 90);
  assert.ok(jalons.epoque2, 'néolithique fini');
  console.log(`joueur lent : pierre ${(jalons.epoque1 / 60).toFixed(1)} min, néolithique ${((jalons.epoque2 - jalons.epoque1) / 60).toFixed(1)} min`);
});

test('les chantiers se terminent et les habitants ne restent pas bloqués', () => {
  const { m } = jouer(7, 5, 60);
  for (let i = 0; i < 2400; i++) Monde.pas(m, 0.1); // on laisse finir les derniers chantiers
  const enCours = m.batiments.filter(b => b.etat === 'chantier');
  assert.strictEqual(enCours.length, 0, 'aucun chantier abandonné : ' + enCours.map(b => b.type).join(','));
  m.habitants.forEach(h => {
    assert.ok(Number.isFinite(h.x) && Number.isFinite(h.y), 'position valide');
  });
  const sentiers = m.terrain.tuiles.filter(t => t.usure >= 0.4).length;
  const souches = m.terrain.tuiles.filter(t => t.obj === 'souche').length;
  console.log(`sentiers : ${sentiers} tuiles, arbres abattus : ${souches}`);
  assert.ok(sentiers >= 10, 'des sentiers se sont formés');
  assert.ok(souches >= 3, 'la forêt a reculé');
});

test('sauvegarde puis reprise', () => {
  const m = Monde.nouveau(3);
  for (let i = 0; i < 600; i++) Monde.pas(m, 0.1);
  const copie = Monde.importer(JSON.parse(JSON.stringify(Monde.exporter(m))));
  for (let i = 0; i < 600; i++) { Monde.pas(m, 0.1); Monde.pas(copie, 0.1); }
  assert.strictEqual(copie.habitants.length, m.habitants.length);
  assert.strictEqual(Math.round(copie.habitants[0].x), Math.round(m.habitants[0].x));
});

function jusquA(m, phase) { let n = 0; while (Monde.phase(m) !== phase && n++ < 100000) Monde.pas(m, 0.1); }

test('la nuit : sans feu on dort tout de suite ; avec un feu on veille, puis on dort et on se réveille au bouton', () => {
  const sansFeu = Monde.nouveau(5);
  jusquA(sansFeu, 'soir');
  for (let i = 0; i < 150; i++) Monde.pas(sansFeu, 0.1); // 15 s de soirée
  assert.ok(sansFeu.habitants.filter(h => h.dort).length >= 2, 'des habitants dorment');
  const sage = sansFeu.habitants.find(h => h.metier === 'sage');
  const cercle = Monde.bat(sansFeu, sage.travail), stock = cercle.stock;
  for (let i = 0; i < 100; i++) Monde.pas(sansFeu, 0.1);
  assert.strictEqual(cercle.stock, stock, 'le sage ne produit pas dans le noir');
  sansFeu.habitants.forEach(h => assert.ok(h.maison, 'chaque habitant a une maison'));

  const avecFeu = Monde.nouveau(5);
  avecFeu.decouvertes.feu = 1; avecFeu.pieces = 50;
  const c = avecFeu.batiments.find(b => b.type === 'cercle-pierres');
  const f = Monde.construire(avecFeu, 'feu', Monde.emplacementsLibres(avecFeu, 'feu')[0]);
  f.etat = 'fini';
  jusquA(avecFeu, 'soir'); c.stock = 0;
  for (let i = 0; i < 200; i++) Monde.pas(avecFeu, 0.1);
  assert.ok(Monde.eclaire(avecFeu, [c.x, c.y]), 'le feu éclaire le cercle pendant la veillée');
  assert.ok(c.stock > 0, 'le sage travaille à la lumière du feu');
  assert.strictEqual(avecFeu.habitants.filter(h => h.dort).length, 0, 'pendant la veillée, personne ne dort');
  jusquA(avecFeu, 'nuit');
  assert.ok(!Monde.eclaire(avecFeu, [c.x, c.y]), 'les feux sont éteints');
  for (let i = 0; i < 300 && !Monde.toutLeMondeDort(avecFeu); i++) Monde.pas(avecFeu, 0.1);
  assert.ok(Monde.toutLeMondeDort(avecFeu), 'tout le monde finit par dormir');
  assert.ok(Monde.reveiller(avecFeu), 'le bouton réveil fait lever le soleil');
  for (let i = 0; i < 60; i++) Monde.pas(avecFeu, 0.1);
  assert.strictEqual(Monde.phase(avecFeu), 'jour');
  assert.strictEqual(avecFeu.habitants.filter(h => h.dort).length, 0, 'tout le monde est réveillé');
});
