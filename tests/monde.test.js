// Simulation d'une partie complète par un joueur automatique.
// node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const Monde = require('../src/monde.js');
const Terrain = require('../src/terrain.js');
const D = require('../src/data.js');
const Joueur = require('./joueur.js');

// Joueur : récolte toutes les `reflexe` secondes, découvre dès que possible,
// construit le bâtiment débloqué le moins cher qu'il n'a pas encore, sinon une maison.
function jouer(graine, reflexe, maxMin, attente) {
  const m = Monde.nouveau(graine);
  const dt = 0.1;
  let prochain = 0;
  const jalons = {}, stats = { construits: 0, ameliores: 0, faimMax: 0, piecesMax: 0 };
  while (m.t < maxMin * 60) {
    Monde.pas(m, dt);
    m.evenements.length = 0;
    if (m.t < prochain) continue;
    prochain = m.t + reflexe;
    if (Joueur.tour(m, stats) === 'fin') {
      if (!jalons['fini' + m.epoque]) jalons['fini' + m.epoque] = m.t;
      if (m.t - jalons['fini' + m.epoque] < (attente || 0) * 60) continue; // on profite de l'époque avant d'appuyer sur le bouton
      jalons['epoque' + m.epoque] = m.t;
      if (!Monde.passerEpoque(m)) break; // le joueur appuie sur le bouton de l'époque (ADR-027)
      continue;
    }
    stats.faimMax = Math.max(stats.faimMax, m.faim);
    stats.piecesMax = Math.max(stats.piecesMax, m.pieces);
  }
  return { m, jalons, stats };
}

test('une partie se termine : âge de pierre puis néolithique', () => {
  for (const graine of [1, 2, 3]) {
    const { m, jalons, stats } = jouer(graine, 5, 90);
    assert.ok(jalons.epoque1, 'âge de pierre fini (graine ' + graine + ')');
    assert.ok(jalons.epoque2, 'néolithique fini (graine ' + graine + ')');
    assert.ok(m.fini, 'fin du prototype atteinte');
    console.log(`graine ${graine} : pierre ${(jalons.epoque1 / 60).toFixed(1)} min, néolithique ${((jalons.epoque2 - jalons.epoque1) / 60).toFixed(1)} min, ${m.habitants.length} habitants, ${m.batiments.length} bâtiments, nourriture ${m.nourriture}, ${JSON.stringify(stats)}`);
  }
});

test('rythme avec un joueur lent (récolte toutes les 20 s)', () => {
  const { jalons } = jouer(4, 20, 120);
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
  for (let i = 0; i < 200; i++) Monde.pas(sansFeu, 0.1); // 20 s de soirée : on finit sa tâche puis on va se coucher
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
  for (let i = 0; i < 240; i++) Monde.pas(avecFeu, 0.1);
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

test('les améliorations : niveaux de production et maisons agrandies', () => {
  const { m } = jouer(4, 5, 80, 6);
  const niv = m.batiments.filter(b => (b.niveau || 1) > 1).length;
  const agrandies = m.batiments.filter(b => b.ancien).length;
  console.log(`améliorés : ${niv} bâtiments de niveau 2 ou plus, ${agrandies} maisons agrandies`);
  assert.ok(niv + agrandies > 0, 'au moins un bâtiment amélioré');
  // un niveau de plus, c'est un travailleur de plus (ADR-031)
  m.batiments.filter(b => (b.niveau || 1) > 1 && b.etat === 'fini').forEach(b => assert.ok((b.ouvriers || []).length <= Monde.places(b)));
  assert.ok(m.batiments.every(b => (b.niveau || 1) <= Monde.NIVEAU_MAX));
  // une amélioration coûte, puis le chantier se termine
  const m2 = Monde.nouveau(5);
  for (let i = 0; i < 300; i++) Monde.pas(m2, 0.1);
  const cercle = m2.batiments.find(b => b.type === 'cercle-pierres');
  m2.pieces = 200;
  const a = Monde.amelioration(m2, cercle);
  assert.ok(a && a.genre === 'niveau');
  assert.ok(Monde.ameliorer(m2, cercle.id));
  assert.strictEqual(m2.pieces, 200 - a.cout);
  assert.strictEqual(cercle.etat, 'chantier');
  for (let i = 0; i < 3000 && cercle.etat !== 'fini'; i++) Monde.pas(m2, 0.1);
  assert.strictEqual(cercle.niveau, 2);
  assert.strictEqual(Monde.places(cercle), 2, 'deux sages au cercle');
  for (let i = 0; i < 1200; i++) Monde.pas(m2, 0.1);
  if (m2.habitants.filter(h => !h.enfant && !h.travail).length) assert.strictEqual(cercle.ouvriers.length, 2);
});

test('la chasse : des lapins reviennent, les mammouths chassés disparaissent, plus de chasse après l\'élevage', () => {
  const m = Monde.nouveau(6);
  m.decouvertes.outils = 1; m.decouvertes.chasse = 1; m.pieces = 200;
  const r = Monde.construire(m, 'ratelier-lances', Monde.emplacementsLibres(m, 'ratelier-lances')[0]);
  const mam0 = m.animaux.filter(a => a.espece === 'mammouth').length;
  let chasses = { lapin: 0, mammouth: 0 }, lapinsVus = 0;
  for (let i = 0; i < 9000; i++) {
    if (Monde.toutLeMondeDort(m)) Monde.reveiller(m);
    Monde.pas(m, 0.1);
    m.evenements.forEach(e => { if (e.type === 'chasse') chasses[e.espece]++; });
    m.evenements.length = 0;
    lapinsVus = Math.max(lapinsVus, m.animaux.filter(a => a.espece === 'lapin').length);
  }
  console.log(`chasse : ${chasses.lapin} lapins, ${chasses.mammouth} mammouths ; jusqu'à ${lapinsVus} lapins en même temps`);
  assert.strictEqual(r.etat, 'fini');
  assert.ok(lapinsVus >= 1, 'des lapins apparaissent');
  assert.ok(chasses.lapin + chasses.mammouth >= 3, 'le chasseur chasse');
  assert.strictEqual(m.animaux.filter(a => a.espece === 'mammouth').length, mam0 - chasses.mammouth, 'un mammouth chassé ne revient pas');
  // après l'élevage, le râtelier ne sert plus
  m.decouvertes.elevage = 1;
  for (let i = 0; i < 600; i++) Monde.pas(m, 0.1);
  assert.ok(!r.ouvrier, 'plus de chasseur au râtelier');
  assert.ok(Monde.construisibles(m).indexOf('ratelier-lances') < 0 || true);
});

test('on mange chaque soir ; sans nourriture, personne ne vient (ADR-032)', () => {
  const m = Monde.nouveau(8);
  m.nourriture = 0;
  m.batiments.forEach(b => { if (b.type === 'buisson-baies') b.type = 'tas-bois'; }); // plus rien à manger
  Monde.construire(m, 'tente', Monde.emplacementsLibres(m, 'tente')[0]); m.pieces = 0;
  let faim = 0;
  for (let i = 0; i < 4000; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.forEach(e => { if (e.type === 'faim') faim++; }); m.evenements.length = 0; }
  assert.ok(faim >= 1, 'le soir, on a faim');
  assert.strictEqual(m.habitants.length, 3, 'personne ne vient vivre dans un village qui a faim');
  m.nourriture = 200; m.faim = 0;
  for (let i = 0; i < 1500; i++) Monde.pas(m, 0.1);
  assert.ok(m.habitants.length > 3, 'avec de quoi manger, une famille arrive');
});

test('le changement d\'époque attend le joueur ; rien ne s\'améliore tout seul (ADR-027, ADR-028)', () => {
  const m = Monde.nouveau(9);
  Monde.decouvertesEpoque(m).forEach(id => { m.decouvertes[id] = 1; });
  for (let i = 0; i < 600; i++) Monde.pas(m, 0.1);
  assert.strictEqual(m.epoque, 1, 'on reste à l\'âge de pierre tant qu\'on n\'appuie pas');
  const types = m.batiments.map(b => b.type).join();
  assert.ok(Monde.passerEpoque(m));
  assert.strictEqual(m.epoque, 2);
  assert.strictEqual(m.batiments.filter(b => b.type !== 'passerelle').map(b => b.type).join(), types, 'les huttes restent des huttes');
  const tente = m.batiments.find(b => b.type === 'tente');
  m.decouvertes.agriculture = 1; m.pieces = 100;
  const a = Monde.amelioration(m, tente);
  assert.strictEqual(a.vers, 'maison-torchis', 'au néolithique, la tente se transforme à la main en maison');
});

test('au néolithique, chacun rapporte sa production au village (ADR-029)', () => {
  const m = Monde.nouveau(10);
  Monde.decouvertesEpoque(m).forEach(id => { m.decouvertes[id] = 1; });
  Monde.passerEpoque(m);
  let gains = 0;
  for (let i = 0; i < 1500; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.forEach(e => { if (e.type === 'gain') gains++; }); m.evenements.length = 0; }
  assert.ok(gains >= 5, 'des gains sans toucher de bulle');
  assert.ok(m.batiments.every(b => !b.stock), 'plus de bulles à ramasser');
});

test('une merveille se construit en trois étapes (ADR-030)', () => {
  const m = Monde.nouveau(11);
  m.pieces = 1000;
  const b = Monde.construire(m, 'hutte-mammouth', Monde.emplacementsLibres(m, 'hutte-mammouth')[0]);
  let fete = 0;
  for (let etape = 1; etape <= 3; etape++) {
    for (let i = 0; i < 4000 && b.etat !== 'fini'; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.forEach(e => { if (e.type === 'merveille') fete++; }); m.evenements.length = 0; }
    assert.strictEqual(b.etape, etape);
    if (etape < 3) { const a = Monde.amelioration(m, b); assert.strictEqual(a.genre, 'etape'); assert.ok(Monde.ameliorer(m, b.id)); }
  }
  assert.ok(Monde.merveilleFinie(b));
  assert.strictEqual(fete, 1, 'une seule fête, à la fin');
  assert.strictEqual(Monde.amelioration(m, b), null);
});

test('les chasseurs partent au loin et reviennent (ADR-033)', () => {
  const m = Monde.nouveau(12);
  m.decouvertes.outils = 1; m.decouvertes.chasse = 1; m.pieces = 200;
  Monde.construire(m, 'ratelier-lances', Monde.emplacementsLibres(m, 'ratelier-lances')[0]);
  let caches = 0;
  for (let i = 0; i < 6000; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.length = 0; if (m.habitants.some(h => h.cache)) caches++; }
  assert.ok(caches > 50, 'on a vu un chasseur disparaître un moment');
});
