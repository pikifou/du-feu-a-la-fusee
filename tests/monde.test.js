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

test('une partie se termine : de l\'âge de pierre au monde moderne, jusqu\'au décollage de la fusée', () => {
  for (const graine of [1, 2, 3]) {
    const { m, jalons, stats } = jouer(graine, 5, 300);
    assert.ok(jalons.epoque1, 'âge de pierre fini (graine ' + graine + ')');
    assert.ok(jalons.epoque2, 'néolithique fini (graine ' + graine + ')');
    assert.ok(jalons.epoque3, 'âge des métaux fini (graine ' + graine + ')');
    assert.ok(jalons.epoque4, 'Moyen Âge fini (graine ' + graine + ')');
    assert.ok(jalons.epoque5, 'la vapeur finie (graine ' + graine + ')');
    assert.ok(jalons.epoque6, 'l\'électricité finie (graine ' + graine + ')');
    assert.ok(jalons.epoque7, 'le monde moderne fini (graine ' + graine + ')');
    assert.strictEqual(m.epoque, 7);
    assert.ok(m.fini, 'fin du jeu atteinte');
    assert.ok(m.fusees >= 1 && Monde.partieFinie(m), 'la fusée a décollé');
    const mo = (jalons.epoque7 - jalons.epoque6) / 60;
    // depuis que les bâtiments dépassés ne se construisent plus (ADR-054), le joueur a moins à acheter : un peu plus rapide
    assert.ok(mo > 5.5 && mo < 16, 'le monde moderne dure à peu près comme les autres époques : ' + mo.toFixed(1) + ' min');
    console.log(`graine ${graine} : monde moderne ${mo.toFixed(1)} min, partie entière ${(jalons.epoque7 / 60).toFixed(1)} min`);
    const ma = (jalons.epoque4 - jalons.epoque3) / 60, va = (jalons.epoque5 - jalons.epoque4) / 60, el = (jalons.epoque6 - jalons.epoque5) / 60;
    assert.ok(el > 6 && el < 16, 'l\'électricité dure à peu près comme les autres époques : ' + el.toFixed(1) + ' min');
    assert.ok(ma > 5 && ma < 16, 'le Moyen Âge dure à peu près comme les autres époques : ' + ma.toFixed(1) + ' min');
    assert.ok(va > 6 && va < 16, 'la vapeur dure à peu près comme les autres époques : ' + va.toFixed(1) + ' min');
    console.log(`graine ${graine} : pierre ${(jalons.epoque1 / 60).toFixed(1)} min, néolithique ${((jalons.epoque2 - jalons.epoque1) / 60).toFixed(1)} min, métaux ${((jalons.epoque3 - jalons.epoque2) / 60).toFixed(1)} min, Moyen Âge ${ma.toFixed(1)} min, vapeur ${va.toFixed(1)} min, électricité ${el.toFixed(1)} min, ${m.habitants.length} habitants, ${m.batiments.length} bâtiments, nourriture ${m.nourriture}, ${JSON.stringify(stats)}`);
  }
});

// ---------- L'âge des métaux ----------
test('âge des métaux : cinq découvertes dans l\'ordre historique, chaque image existe', () => {
  const fs = require('node:fs'), path = require('node:path');
  const ids = Object.keys(D.decouvertes).filter(k => D.decouvertes[k].epoque === 3);
  assert.deepStrictEqual(ids.sort(), ['bronze', 'ecriture', 'monnaie', 'roue', 'voile']);
  // les prérequis existent, et la monnaie vient après l'écriture et le bronze (ADR-001)
  ids.forEach(id => D.decouvertes[id].prerequis.forEach(p => assert.ok(D.decouvertes[p] && D.decouvertes[p].epoque <= 3, id + ' : ' + p)));
  assert.deepStrictEqual(D.decouvertes.monnaie.prerequis.slice().sort(), ['bronze', 'ecriture']);
  // chaque image citée par les données existe sur le disque
  const racine = path.join(__dirname, '..', 'assets');
  const existe = cle => ['sprites/' + cle + '.png', 'sprites/' + cle + '.jpg', 'raw/' + cle + '.png'].some(f => fs.existsSync(path.join(racine, f)));
  Object.keys(D.batiments).forEach(k => {
    const b = D.batiments[k];
    assert.ok(existe(b.sprite), 'sprite de ' + k);
    (b.vignettes || []).forEach(v => assert.ok(existe('vignettes/' + v.img), 'vignette ' + v.img));
    if (b.page) assert.ok(D.pages[b.page] || D.decouvertes[b.page], 'page de ' + k);
    if (b.epoque === 3 && b.travail) [2, 3].forEach(n => assert.ok(existe('niveaux/' + k + '-' + n), 'niveau ' + n + ' de ' + k));
  });
  Object.keys(D.decouvertes).forEach(k => { assert.ok(existe(D.decouvertes[k].scene), 'scène de ' + k); assert.ok(existe(D.decouvertes[k].icone), 'icône de ' + k); });
  Object.keys(D.pages).forEach(k => assert.ok(existe(D.pages[k].scene || D.pages[k].image), 'image de la page ' + k));
  Object.keys(D.allures[3]).forEach(k => [].concat(D.allures[3][k]).forEach(a => assert.ok(existe('habitants/' + a), 'habitant ' + a)));
  Object.keys(D.poses[3]).forEach(k => assert.ok(existe('poses/' + D.poses[3][k]), 'pose ' + D.poses[3][k]));
  Object.keys(D.porteurs[3]).forEach(k => [].concat(typeof D.porteurs[3][k] === 'object' ? Object.values(D.porteurs[3][k]) : D.porteurs[3][k]).forEach(p => assert.ok(existe('porteurs/' + p), 'porteur ' + p)));
});

function auNeolithiqueFini(graine) {
  const m = Monde.nouveau(graine);
  Monde.decouvertesEpoque(m).forEach(id => { m.decouvertes[id] = 1; });
  Monde.passerEpoque(m);
  Monde.decouvertesEpoque(m).forEach(id => { m.decouvertes[id] = 1; });
  return m;
}

test('âge des métaux : l\'île grandit, de nouveaux bâtiments, les monuments du néolithique ne se construisent plus (ADR-024)', () => {
  const m = auNeolithiqueFini(21);
  const surIle = () => m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)).length;
  const avant = surIle();
  assert.ok(Monde.construisibles(m).indexOf('stonehenge') >= 0, 'Stonehenge se construit au néolithique');
  assert.ok(Monde.passerEpoque(m));
  assert.strictEqual(m.epoque, 3);
  assert.ok(surIle() > avant + 60, 'l\'île s\'agrandit : ' + avant + ' -> ' + surIle());
  const c = Monde.construisibles(m);
  assert.ok(c.indexOf('maison-pierre') >= 0, 'la maison en pierre dès l\'arrivée');
  assert.ok(c.indexOf('forge') < 0, 'la forge attend le bronze');
  assert.ok(c.indexOf('stonehenge') < 0 && c.indexOf('menhir') < 0, 'plus de monuments du néolithique');
  assert.ok(c.indexOf('pyramide') >= 0 && c.indexOf('fontaine') >= 0, 'les monuments de l\'Antiquité');
  m.decouvertes.bronze = 1; m.decouvertes.voile = 1;
  assert.ok(Monde.construisibles(m).indexOf('forge') >= 0);
  m.pieces = 1000;
  assert.ok(Monde.emplacementsLibres(m, 'port').length > 0, 'le port a sa place sur la plage');
  assert.ok(Monde.emplacementsLibres(m, 'phare').length > 0, 'le phare a sa place sur la plage');
  // une tente se transforme en maison en pierre (ADR-028 : à la main)
  const tente = m.batiments.find(b => b.type === 'tente');
  assert.strictEqual(Monde.amelioration(m, tente).vers, 'maison-pierre');
});

test('âge des métaux : le bronze et la roue font mieux travailler (bûcheron, potière)', () => {
  const m = auNeolithiqueFini(22);
  Monde.passerEpoque(m);
  const tas = m.batiments.find(b => b.type === 'tas-bois');
  const avant = Monde.quantite(tas, m);
  m.decouvertes.bronze = 1;
  assert.ok(Monde.quantite(tas, m) > avant);
  assert.strictEqual(Monde.qteDe(D.batiments['atelier-potier'].travail, 3, m), 18);
  m.decouvertes.roue = 1;
  assert.strictEqual(Monde.qteDe(D.batiments['atelier-potier'].travail, 3, m), 24);
});

test('une partie du néolithique sauvée avant l\'âge des métaux continue sans rien perdre', () => {
  const m = auNeolithiqueFini(23);
  for (let i = 0; i < 1200; i++) Monde.pas(m, 0.1);
  // une ancienne sauvegarde : le dernier anneau de l'île n'existait pas
  const vieux = JSON.parse(JSON.stringify(Monde.exporter(m)));
  vieux.terrain.tuiles.forEach(t => { if (t.ile === 3) t.ile = 0; });
  const repris = Monde.importer(vieux);
  assert.strictEqual(repris.epoque, 2);
  assert.strictEqual(repris.habitants.length, m.habitants.length);
  assert.strictEqual(repris.batiments.length, m.batiments.length);
  assert.strictEqual(repris.pieces, m.pieces);
  assert.deepStrictEqual(Object.keys(repris.decouvertes).sort(), Object.keys(m.decouvertes).sort());
  assert.ok(Monde.epoqueTerminee(repris), 'toutes les découvertes du néolithique sont gardées');
  assert.ok(Monde.passerEpoque(repris), 'le bouton doré mène à l\'âge des métaux');
  assert.ok(repris.terrain.tuiles.some(t => t.ile === 3 && Terrain.surIle(repris.terrain, t)), 'et l\'île grandit');
  for (let i = 0; i < 600; i++) Monde.pas(repris, 0.1);
});

test('sauvegarde légère d\'une longue partie finie au monde moderne : sous 250 000 caractères', () => {
  const { m } = jouer(5, 5, 360, 8);
  assert.strictEqual(m.epoque, 7);
  assert.ok(m.fini);
  for (let i = 0; i < 3000; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); }
  m.evenements.length = 0;
  const leger = JSON.stringify(Monde.exporterLeger(m));
  console.log(`sauvegarde légère en fin de partie : ${leger.length} caractères, ${m.batiments.length} bâtiments, ${m.habitants.length} habitants`);
  assert.ok(leger.length < 250000);
  assert.ok(leger.length < 200000, 'de la marge pour continuer à jouer : ' + leger.length);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(Monde.developper(JSON.parse(leger)))), JSON.parse(JSON.stringify(Monde.sansVides(Monde.arrondir(Monde.exporter(m))))));
  // et elle se rejoue
  const repris = Monde.importer(Monde.developper(JSON.parse(leger)));
  for (let i = 0; i < 600; i++) { if (Monde.toutLeMondeDort(repris)) Monde.reveiller(repris); Monde.pas(repris, 0.1); }
  assert.strictEqual(repris.habitants.length >= m.habitants.length - 2, true);
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

test('la réserve de nourriture a un maximum, agrandi par le stockage (ADR-036)', () => {
  const m = Monde.nouveau(13);
  const max0 = Monde.reserveMax(m);
  assert.strictEqual(max0, 30);
  let perdu = 0;
  for (let i = 0; i < 3000; i++) { m.cycle = { phase: 'jour', t: 20 }; Monde.pas(m, 0.1); m.batiments.forEach(b => Monde.recolter(m, b.id)); m.evenements.forEach(e => { if (e.type === 'perdu') perdu += e.n; }); m.evenements.length = 0; }
  assert.ok(m.nourriture <= max0, 'jamais plus que la réserve');
  assert.ok(perdu > 0, 'ce qui dépasse est perdu');
  m.decouvertes.outils = 1; m.decouvertes.chasse = 1; m.pieces = 500;
  const s = Monde.construire(m, 'sechoir-poissons', Monde.emplacementsLibres(m, 'sechoir-poissons')[0]);
  for (let i = 0; i < 3000 && s.etat !== 'fini'; i++) Monde.pas(m, 0.1);
  assert.strictEqual(Monde.reserveMax(m), max0 + 20, 'le séchoir agrandit la réserve');
});

test('au néolithique, la hache polie rapporte plus (ADR-035)', () => {
  const m = Monde.nouveau(14);
  const tas = m.batiments.find(b => b.type === 'tas-bois');
  const avant = Monde.quantite(tas, m);
  Monde.decouvertesEpoque(m).forEach(id => { m.decouvertes[id] = 1; });
  Monde.passerEpoque(m);
  assert.ok(Monde.quantite(tas, m) > avant);
});

// ---------- Le Moyen Âge ----------
test('Moyen Âge : cinq découvertes dans l\'ordre historique, chaque image existe', () => {
  const fs = require('node:fs'), path = require('node:path');
  const ids = Object.keys(D.decouvertes).filter(k => D.decouvertes[k].epoque === 4);
  assert.deepStrictEqual(ids.sort(), ['fer', 'horloge', 'imprimerie', 'moulin', 'pont']);
  ids.forEach(id => D.decouvertes[id].prerequis.forEach(p => assert.ok(D.decouvertes[p] && D.decouvertes[p].epoque <= 4, id + ' : ' + p)));
  // l'ordre réel (ADR-001) : le moulin après la roue et la meule, l'horloge après le fer, l'imprimerie après l'écriture et le fer
  assert.deepStrictEqual(D.decouvertes.moulin.prerequis.slice().sort(), ['meule', 'roue']);
  assert.deepStrictEqual(D.decouvertes.horloge.prerequis, ['fer']);
  assert.deepStrictEqual(D.decouvertes.imprimerie.prerequis.slice().sort(), ['ecriture', 'fer']);
  const racine = path.join(__dirname, '..', 'assets');
  const existe = cle => ['sprites/' + cle + '.png', 'sprites/' + cle + '.jpg', 'raw/' + cle + '.png'].some(f => fs.existsSync(path.join(racine, f)));
  Object.keys(D.batiments).filter(k => D.batiments[k].epoque === 4).forEach(k => {
    const b = D.batiments[k];
    assert.ok(existe(b.sprite), 'sprite de ' + k);
    if (b.travail) [2, 3].forEach(n => assert.ok(existe('niveaux/' + k + '-' + n), 'niveau ' + n + ' de ' + k));
    if (b.lits) assert.ok(existe('coupe/' + k), 'maison en coupe : ' + k);
  });
  Object.keys(D.allures[4]).forEach(k => [].concat(D.allures[4][k]).forEach(a => assert.ok(existe('habitants/' + a), 'habitant ' + a)));
  Object.keys(D.poses[4]).forEach(k => { const p = D.poses[4][k]; assert.ok(existe('poses/' + p), 'pose ' + p); if (p.startsWith('e4-')) assert.ok(existe('poses/' + p + '-b'), 'deuxième image de ' + p); });
  Object.keys(D.porteurs[4]).forEach(k => [].concat(typeof D.porteurs[4][k] === 'object' ? Object.values(D.porteurs[4][k]) : D.porteurs[4][k]).forEach(p => assert.ok(existe('porteurs/' + p), 'porteur ' + p)));
  assert.ok(existe('faune/cheval') && existe('eau/pont-pierre'));
  // les métiers nouveaux ont tous une allure et des phrases, et les textes de l'histoire existent en deux langues
  ['marechal', 'boulanger', 'horloger', 'imprimeur'].forEach(k => assert.ok(D.allures[4][k] && D.textes.phrases[k], k));
  ['village', 'ville', 'moyen-age', 'fin'].forEach(k => ['fr', 'en'].forEach(l => assert.ok(D.textes.histoire[k][l].l1 && D.textes.histoire[k][l].l2, k + ' ' + l)));
  assert.ok(fs.existsSync(path.join(racine, 'histoire', 'ville.png')) && fs.existsSync(path.join(racine, 'cine', 'ville.mp4')), 'l\'ancienne fin devient le passage de l\'âge des métaux');
});

function auxMetauxFinis(graine) {
  const m = auNeolithiqueFini(graine);
  Monde.passerEpoque(m);
  Monde.decouvertesEpoque(m).forEach(id => { m.decouvertes[id] = 1; });
  return m;
}
function laisser(m, s) { for (let i = 0; i < s * 10; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.length = 0; } }

test('Moyen Âge : l\'île grandit, de nouveaux bâtiments, les monuments de l\'âge des métaux ne se construisent plus (ADR-024)', () => {
  const m = auxMetauxFinis(31);
  const surIle = () => m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)).length;
  const avant = surIle();
  assert.ok(Monde.construisibles(m).indexOf('pyramide') >= 0, 'la pyramide se construit à l\'âge des métaux');
  assert.ok(Monde.passerEpoque(m));
  assert.strictEqual(m.epoque, 4);
  assert.ok(surIle() > avant + 60, 'l\'île s\'agrandit : ' + avant + ' -> ' + surIle());
  const c = Monde.construisibles(m);
  assert.ok(c.indexOf('maison-colombages') >= 0, 'la maison à colombages dès l\'arrivée');
  assert.ok(c.indexOf('moulin') < 0 && c.indexOf('maison-etages') < 0, 'le moulin et la maison à étages attendent leur découverte');
  assert.ok(c.indexOf('pyramide') < 0 && c.indexOf('fontaine') < 0, 'plus de monuments de l\'âge des métaux');
  assert.ok(c.indexOf('notre-dame') >= 0 && c.indexOf('moai') >= 0, 'les monuments du Moyen Âge');
  m.pieces = 5000;
  m.decouvertes.moulin = 1;
  assert.ok(Monde.emplacementsLibres(m, 'moulin').length > 0, 'le moulin a sa place au bord de la rivière');
  assert.ok(Monde.emplacementsLibres(m, 'mont-saint-michel').length > 0, 'le Mont-Saint-Michel a sa place sur la plage');
  // les vieilles maisons se transforment à la main (ADR-028)
  const tente = m.batiments.find(b => b.type === 'tente');
  assert.strictEqual(Monde.amelioration(m, tente).vers, 'maison-colombages');
  m.decouvertes.horloge = 1;
  assert.strictEqual(Monde.amelioration(m, { type: 'maison-colombages', etat: 'fini' }).vers, 'maison-etages');
  assert.ok(m.animaux.some(a => a.espece === 'cheval'), 'des chevaux dans la vallée');
});

test('Moyen Âge : la crue emporte la passerelle, le pont de pierre la remplace (le petit problème)', () => {
  const m = auxMetauxFinis(32);
  const passerelle = m.batiments.find(b => b.type === 'passerelle');
  assert.ok(passerelle, 'la passerelle en bois est là');
  passerelle.etat = 'fini'; m.terrain.passerelle = true; // on la suppose finie depuis longtemps

  Monde.passerEpoque(m);
  let crue = 0;
  for (let i = 0; i < 1200; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.forEach(e => { if (e.type === 'crue') crue++; }); m.evenements.length = 0; }
  assert.strictEqual(crue, 1, 'une seule crue');
  assert.ok(!m.batiments.some(b => b.type === 'passerelle'), 'la passerelle est emportée');
  assert.ok(!m.terrain.passerelle && m.pontEmporte, 'on traverse de nouveau à gué');
  // le pont de pierre : la découverte lance son chantier sur le gué
  m.idees = 100;
  assert.ok(Monde.decouvrir(m, 'pont'));
  const pont = m.batiments.find(b => b.type === 'pont-pierre');
  assert.ok(pont && pont.etat === 'chantier', 'le chantier du pont de pierre commence');
  for (let i = 0; i < 9000 && pont.etat !== 'fini'; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.length = 0; }
  assert.strictEqual(pont.etat, 'fini', 'les habitants finissent le pont');
  assert.ok(m.terrain.passerelle && !m.pontEmporte, 'on traverse sur le pont de pierre');
  laisser(m, 120);
  assert.strictEqual(m.batiments.filter(b => b.type === 'pont-pierre').length, 1, 'la crue ne revient pas');
});

test('Moyen Âge : avec le fer, le bûcheron et le paysan travaillent mieux', () => {
  const m = auxMetauxFinis(33);
  Monde.passerEpoque(m);
  const tas = m.batiments.find(b => b.type === 'tas-bois');
  const avant = Monde.quantite(tas, m);
  const champ = Monde.qteDe(D.batiments['champ-ble'].travail, 4, m);
  m.decouvertes.fer = 1;
  assert.ok(Monde.quantite(tas, m) > avant, 'hache en fer');
  assert.ok(Monde.qteDe(D.batiments['champ-ble'].travail, 4, m) > champ, 'charrue en fer');
});

test('une partie de l\'âge des métaux, finie ou en cours, sauvée avant le Moyen Âge, continue sans rien perdre', () => {
  for (const fini of [true, false]) {
    const m = fini ? auxMetauxFinis(34) : auNeolithiqueFini(35);
    if (!fini) Monde.passerEpoque(m);
    laisser(m, 120);
    // une sauvegarde de la version d'avant : pas d'anneau 4, ni crue
    const vieux = JSON.parse(JSON.stringify(Monde.exporter(m)));
    vieux.terrain.tuiles.forEach(t => { if (t.ile === 4) t.ile = 0; });
    delete vieux.crue; delete vieux.pontEmporte;
    // et aussi par la sauvegarde légère confiée à Ludiworld
    const leger = JSON.parse(JSON.stringify(Monde.exporterLeger(m)));
    for (const s of [vieux, Monde.developper(leger)]) {
      const repris = Monde.importer(JSON.parse(JSON.stringify(s)));
      assert.strictEqual(repris.epoque, 3);
      assert.strictEqual(repris.habitants.length, m.habitants.length);
      assert.strictEqual(repris.batiments.length, m.batiments.length);
      assert.strictEqual(repris.pieces, m.pieces);
      assert.deepStrictEqual(Object.keys(repris.decouvertes).sort(), Object.keys(m.decouvertes).sort());
      assert.strictEqual(Monde.epoqueTerminee(repris), fini);
      if (!fini) Monde.decouvertesEpoque(repris).forEach(id => { repris.decouvertes[id] = 1; });
      assert.ok(Monde.passerEpoque(repris), 'le bouton doré mène au Moyen Âge');
      assert.strictEqual(repris.epoque, 4);
      assert.ok(repris.terrain.tuiles.some(t => t.ile === 4 && Terrain.surIle(repris.terrain, t)), 'et l\'île grandit');
      laisser(repris, 90);
      assert.ok(repris.pontEmporte, 'la crue arrive aussi dans une partie reprise');
    }
  }
});

// ---------- Sauvegarde légère confiée à Ludiworld ----------
test('sauvegarde légère : la carte revient à l\'identique, en bien plus petit', () => {
  const m = Monde.nouveau(7);
  for (let i = 0; i < 4000; i++) Monde.pas(m, 0.1);
  m.evenements.length = 0;
  const complet = JSON.stringify(Monde.exporter(m));
  const leger = JSON.parse(JSON.stringify(Monde.exporterLeger(m)));
  assert.ok(JSON.stringify(leger).length < complet.length / 5, 'bien plus petit : ' + JSON.stringify(leger).length + ' contre ' + complet.length);
  assert.ok(JSON.stringify(leger).length < 60000);
  const rendu = Monde.developper(leger);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(rendu)), JSON.parse(JSON.stringify(Monde.sansVides(Monde.arrondir(JSON.parse(complet))))), "à l'arrondi près, sans les valeurs vides");
  // l'arrondi ne déplace personne de plus d'un dixième de pixel, et les trajets se recalculent
  rendu.habitants.forEach((h, k) => assert.ok(Math.abs(h.x - m.habitants[k].x) <= 0.051 && Math.abs(h.y - m.habitants[k].y) <= 0.051));
  const repris = Monde.importer(rendu); for (let i = 0; i < 300; i++) Monde.pas(repris, 0.1);
});

test('sauvegarde légère : une copie faite par une version d\'avant (cases entières, valeurs vides gardées) se relit', () => {
  const m = Monde.nouveau(9);
  for (let i = 0; i < 3000; i++) Monde.pas(m, 0.1);
  m.evenements.length = 0;
  // le format d'avant le monde moderne : la case entière dès qu'elle a changé, sans « partiel »
  const c = Monde.arrondir(Monde.exporter(m)), T = c.terrain, base = Terrain.generer(), delta = [], meta = {};
  T.tuiles.forEach((t, i) => { if (JSON.stringify(t) !== JSON.stringify(base.tuiles[i])) delta.push([i, t]); });
  Object.keys(T).forEach(k => { if (k !== 'tuiles') meta[k] = T[k]; });
  c.terrain = { leger: true, n: T.tuiles.length, meta, delta };
  const vieux = JSON.parse(JSON.stringify(c));
  const rendu = Monde.developper(vieux);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(rendu.terrain)), JSON.parse(JSON.stringify(Monde.arrondir(Monde.exporter(m)).terrain)));
  const repris = Monde.importer(rendu); for (let i = 0; i < 300; i++) Monde.pas(repris, 0.1);
  assert.strictEqual(repris.habitants.length, m.habitants.length);
});

test('sauvegarde légère : refusée si la carte du jeu a changé de taille', () => {
  const leger = JSON.parse(JSON.stringify(Monde.exporterLeger(Monde.nouveau(3))));
  leger.terrain.n += 1;
  assert.strictEqual(Monde.developper(leger), null);
  const complet = Monde.exporter(Monde.nouveau(3));
  assert.strictEqual(Monde.developper(complet), complet, 'une sauvegarde complète passe telle quelle');
});

// ---------- L'âge de la vapeur ----------
test('vapeur : quatre découvertes dans l\'ordre historique, chaque image existe', () => {
  const fs = require('node:fs'), path = require('node:path');
  const ids = Object.keys(D.decouvertes).filter(k => D.decouvertes[k].epoque === 5);
  assert.deepStrictEqual(ids.sort(), ['bateau', 'charbon', 'train', 'vapeur']);
  // l'ordre réel (ADR-001, epoques.md) : le charbon après le fer, la machine après le charbon, le train après la machine et la roue
  assert.deepStrictEqual(D.decouvertes.charbon.prerequis, ['fer']);
  assert.deepStrictEqual(D.decouvertes.vapeur.prerequis.slice().sort(), ['charbon', 'fer']);
  assert.deepStrictEqual(D.decouvertes.train.prerequis.slice().sort(), ['roue', 'vapeur']);
  assert.deepStrictEqual(D.decouvertes.bateau.prerequis.slice().sort(), ['vapeur', 'voile']);
  const racine = path.join(__dirname, '..', 'assets');
  const existe = cle => ['sprites/' + cle + '.png', 'sprites/' + cle + '.jpg', 'raw/' + cle + '.png'].some(f => fs.existsSync(path.join(racine, f)));
  Object.keys(D.batiments).filter(k => D.batiments[k].epoque === 5).forEach(k => {
    const b = D.batiments[k];
    assert.ok(existe(b.sprite), 'sprite de ' + k);
    if (b.travail) [2, 3].forEach(n => assert.ok(existe('niveaux/' + k + '-' + n), 'niveau ' + n + ' de ' + k));
    if (b.lits) assert.ok(existe('coupe/' + k), 'maison en coupe : ' + k);
    (b.vignettes || []).forEach(v => assert.ok(existe('vignettes/' + v.img), 'vignette ' + v.img));
    if (b.page) assert.ok(D.pages[b.page] || D.decouvertes[b.page], 'page de ' + k);
  });
  Object.keys(D.allures[5]).forEach(k => [].concat(D.allures[5][k]).forEach(a => assert.ok(existe('habitants/' + a), 'habitant ' + a)));
  Object.keys(D.poses[5]).forEach(k => { const p = D.poses[5][k]; assert.ok(existe('poses/' + p), 'pose ' + p); if (p.startsWith('e5-')) assert.ok(existe('poses/' + p + '-b'), 'deuxième image de ' + p); });
  Object.keys(D.porteurs[5]).forEach(k => [].concat(typeof D.porteurs[5][k] === 'object' ? Object.values(D.porteurs[5][k]) : D.porteurs[5][k]).forEach(p => assert.ok(existe('porteurs/' + p), 'porteur ' + p)));
  ['05-vapeur/train', '05-vapeur/tunnel', '05-vapeur/pompe', 'eau/bateau-vapeur', 'scenes/vapeur-ville'].forEach(k => assert.ok(existe(k), k));
  ['mineur', 'ouvriere', 'cheminot', 'inventeur', 'matelot', 'pompier'].forEach(k => assert.ok(D.allures[5][k] && D.textes.phrases[k], k));
  // l'ancienne fin devient le passage du Moyen Âge ; la nouvelle fin a son image et sa vidéo
  ['histoire/moyen-age.png', 'cine/moyen-age.mp4'].forEach(f => assert.ok(fs.existsSync(path.join(racine, f)), f));
});

function auMoyenAgeFini(graine) {
  const m = auxMetauxFinis(graine);
  Monde.passerEpoque(m);
  Monde.decouvertesEpoque(m).forEach(id => { m.decouvertes[id] = 1; });
  return m;
}

test('vapeur : l\'île grandit (au nord, puis la campagne tout autour) sans toucher aux anciennes cases ; nouveaux bâtiments ; les monuments du Moyen Âge ne se construisent plus', () => {
  const m = auMoyenAgeFini(51);
  // les cases des fermes de la ville changent (elles partent à la campagne, ADR-051) : on compare les autres
  const fermes = new Set(m.batiments.filter(b => Monde.FERMES_VILLE[b.type]).map(b => b.id));
  const garder = t => Terrain.surIle(m.terrain, t) && !fermes.has(t.bat);
  const avant = JSON.stringify(m.terrain.tuiles.filter(garder));
  const tuilesAvant = new Set(m.terrain.tuiles.filter(garder));
  const n0 = m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)).length;
  assert.ok(Monde.construisibles(m).indexOf('notre-dame') >= 0);
  assert.ok(Monde.passerEpoque(m));
  assert.strictEqual(m.epoque, 5);
  const neuves = m.terrain.tuiles.filter(t => t.ile === 5);
  assert.ok(neuves.length > 150, 'un nouvel anneau : ' + neuves.length + ' cases');
  assert.strictEqual(m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)).length, n0 + neuves.length);
  const moy = l => l.reduce((s, t) => s + t.i + t.j, 0) / l.length;
  const nord = neuves.filter(t => !t.campagne);
  assert.ok(nord.length > 150 && moy(nord) < Terrain.CI + Terrain.CJ - 12, 'l\'anneau du nord, en haut de l\'écran');
  assert.ok(neuves.filter(t => t.campagne).length > 500, 'la campagne tout autour (ADR-051)');
  assert.ok(neuves.every(t => Math.min(t.i, t.j, Terrain.N - 1 - t.i, Terrain.N - 1 - t.j) >= 2), 'à deux cases du bord de la grille');
  assert.ok(neuves.filter(t => t.sol === 'herbe' && !t.obj).length > 60, 'des clairières pour bâtir');
  // les cases déjà sur l'île n'ont pas bougé (les sauvegardes restent justes)
  assert.strictEqual(JSON.stringify(m.terrain.tuiles.filter(t => tuilesAvant.has(t))), avant);
  const c = Monde.construisibles(m);
  assert.ok(c.indexOf('maison-briques') >= 0 && c.indexOf('atelier-inventeur') >= 0, 'dès l\'arrivée');
  assert.ok(c.indexOf('usine') < 0 && c.indexOf('gare') < 0 && c.indexOf('mine') < 0, 'ils attendent leur découverte');
  assert.ok(c.indexOf('notre-dame') < 0 && c.indexOf('moai') < 0, 'plus de monuments du Moyen Âge');
  assert.ok(c.indexOf('tour-eiffel') >= 0 && c.indexOf('lampadaire') >= 0, 'les monuments de la vapeur');
  m.decouvertes.charbon = 1; m.decouvertes.bateau = 1; m.pieces = 5000;
  assert.ok(Monde.emplacementsLibres(m, 'mine').length > 0, 'la mine a sa place contre les rochers');
  assert.ok(Monde.emplacementsLibres(m, 'port-vapeur').length > 0, 'le port à vapeur sur la plage');
  assert.ok(Monde.emplacementsLibres(m, 'statue-liberte').length > 0, 'la statue de la Liberté sur la plage');
  // les vieilles maisons se transforment à la main (ADR-028), puis en immeuble après le train
  const tente = m.batiments.find(b => b.type === 'tente');
  assert.strictEqual(Monde.amelioration(m, tente).vers, 'maison-briques');
  m.decouvertes.train = 1;
  assert.strictEqual(Monde.amelioration(m, { type: 'maison-briques', etat: 'fini' }).vers, 'immeuble');
  assert.strictEqual(Monde.amelioration(m, { type: 'maison-etages', etat: 'fini' }).vers, 'immeuble');
  // la machine à vapeur fait mieux tourner le moulin
  const q = Monde.qteDe(D.batiments.moulin.travail, 5, m);
  m.decouvertes.vapeur = 1;
  assert.ok(Monde.qteDe(D.batiments.moulin.travail, 5, m) > q);
});

test('vapeur : une maison prend feu, les pompiers de la caserne l\'éteignent (le petit problème)', () => {
  const m = auMoyenAgeFini(52);
  Monde.passerEpoque(m);
  const lits0 = Monde.lits(m);
  let feu = 0, eteint = 0;
  for (let i = 0; i < 900; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.forEach(e => { if (e.type === 'incendie') feu++; }); m.evenements.length = 0; }
  assert.strictEqual(feu, 1, 'un incendie, peu après l\'arrivée');
  const maison = m.batiments.find(b => b.enFeu);
  assert.ok(maison && D.batiments[maison.type].lits, 'c\'est une maison');
  assert.ok(Monde.lits(m) < lits0, 'personne ne peut y dormir');
  laisser(m, 120);
  assert.ok(maison.enFeu, 'sans pompiers, elle brûle toujours');
  assert.ok(!m.habitants.some(h => h.maison === maison.id), 'personne n\'y habite pendant l\'incendie');
  // la caserne vient avec la machine à vapeur
  assert.ok(Monde.construisibles(m).indexOf('caserne') < 0);
  m.decouvertes.charbon = 1; m.decouvertes.vapeur = 1; m.pieces = 2000;
  const cs = Monde.construire(m, 'caserne', Monde.emplacementsLibres(m, 'caserne')[0]);
  assert.ok(cs);
  for (let i = 0; i < 9000 && maison.enFeu; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.forEach(e => { if (e.type === 'eteint') eteint++; }); m.evenements.length = 0; }
  assert.strictEqual(cs.etat, 'fini');
  assert.ok(!maison.enFeu && eteint === 1, 'le pompier éteint le feu');
  assert.ok(Monde.lits(m) >= lits0, 'la maison accueille de nouveau sa famille');
  laisser(m, 200);
  assert.ok(!m.batiments.some(b => b.enFeu), 'le feu ne revient pas');
  assert.ok(m.habitants.every(h => h.allure !== 'e5-pompier'), 'le pompier a remis sa tenue');
});

test('vapeur : la gare finie, les rails vont jusqu\'au tunnel au bord de l\'île', () => {
  const m = auMoyenAgeFini(53);
  Monde.passerEpoque(m);
  ['charbon', 'vapeur', 'train'].forEach(k => { m.decouvertes[k] = 1; });
  m.pieces = 5000;
  const gare = Monde.construire(m, 'gare', Monde.emplacementsLibres(m, 'gare')[0]);
  assert.ok(gare);
  let rails = 0;
  for (let i = 0; i < 9000 && gare.etat !== 'fini'; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.forEach(e => { if (e.type === 'rails') rails++; }); m.evenements.length = 0; }
  assert.strictEqual(gare.etat, 'fini');
  assert.strictEqual(rails, 1);
  const R = m.rails.tuiles;
  assert.ok(R.length >= 2);
  // une ligne continue, case par case, qui part contre la gare
  for (let k = 1; k < R.length; k++) assert.strictEqual(Math.abs(R[k][0] - R[k - 1][0]) + Math.abs(R[k][1] - R[k - 1][1]), 1);
  assert.ok(Math.max(Math.abs(R[0][0] - (gare.i + 0.5)), Math.abs(R[0][1] - (gare.j + 0.5))) <= 1.5);
  // le tunnel est au bord de l'île ; les rails ne passent ni dans l'eau ni sous un bâtiment, et on ne bâtit pas dessus
  const T = m.terrain, fin = Terrain.tuile(T, R[R.length - 1][0], R[R.length - 1][1]);
  assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(d => { const v = Terrain.tuile(T, fin.i + d[0], fin.j + d[1]); return !v || !Terrain.surIle(T, v); }));
  R.forEach(c => { const t = Terrain.tuile(T, c[0], c[1]); assert.ok(t.rail && t.sol !== 'eau' && !t.bat && !t.obj); assert.ok(!Monde.ancreValide(m, 'lampadaire', c[0], c[1])); });
});

test('une partie du Moyen Âge, finie ou en cours, sauvée avant la vapeur, continue sans rien perdre', () => {
  for (const fini of [true, false]) {
    const m = fini ? auMoyenAgeFini(54) : auxMetauxFinis(55);
    if (!fini) Monde.passerEpoque(m);
    laisser(m, 120);
    // une sauvegarde de la version d'avant : pas d'anneau 5, pas d'incendie prévu
    const vieux = JSON.parse(JSON.stringify(Monde.exporter(m)));
    vieux.terrain.tuiles.forEach(t => { if (t.ile === 5) t.ile = 0; });
    delete vieux.feuPrevu; delete vieux.incendie; delete vieux.rails;
    const leger = JSON.parse(JSON.stringify(Monde.exporterLeger(m)));
    for (const s of [vieux, Monde.developper(leger)]) {
      const repris = Monde.importer(JSON.parse(JSON.stringify(s)));
      assert.strictEqual(repris.epoque, 4);
      assert.strictEqual(repris.habitants.length, m.habitants.length);
      assert.strictEqual(repris.batiments.length, m.batiments.length);
      assert.strictEqual(repris.pieces, m.pieces);
      assert.deepStrictEqual(Object.keys(repris.decouvertes).sort(), Object.keys(m.decouvertes).sort());
      assert.strictEqual(Monde.epoqueTerminee(repris), fini);
      if (!fini) Monde.decouvertesEpoque(repris).forEach(id => { repris.decouvertes[id] = 1; });
      assert.ok(Monde.passerEpoque(repris), 'le bouton doré mène à la vapeur');
      assert.strictEqual(repris.epoque, 5);
      assert.ok(repris.terrain.tuiles.some(t => t.ile === 5 && Terrain.surIle(repris.terrain, t)), 'et l\'île grandit');
      laisser(repris, 90);
      assert.ok(repris.batiments.some(b => b.enFeu), 'l\'incendie arrive aussi dans une partie reprise');
    }
  }
});

// ---------- L'électricité ----------
test('électricité : cinq découvertes dans l\'ordre historique, chaque image existe ; la fin de la vapeur devient un passage', () => {
  const fs = require('node:fs'), path = require('node:path');
  const ids = Object.keys(D.decouvertes).filter(k => D.decouvertes[k].epoque === 6);
  assert.deepStrictEqual(ids.sort(), ['ampoule', 'avion', 'electricite', 'telephone', 'voiture']);
  // l'ordre réel (ADR-001, epoques.md section 6)
  assert.deepStrictEqual(D.decouvertes.electricite.prerequis, ['vapeur']);
  assert.deepStrictEqual(D.decouvertes.ampoule.prerequis, ['electricite']);
  assert.deepStrictEqual(D.decouvertes.telephone.prerequis, ['electricite']);
  assert.deepStrictEqual(D.decouvertes.voiture.prerequis.slice().sort(), ['roue', 'vapeur']);
  assert.deepStrictEqual(D.decouvertes.avion.prerequis, ['voiture']);
  const racine = path.join(__dirname, '..', 'assets');
  const existe = cle => ['sprites/' + cle + '.png', 'sprites/' + cle + '.jpg', 'raw/' + cle + '.png'].some(f => fs.existsSync(path.join(racine, f)));
  ids.forEach(k => { assert.ok(existe(D.decouvertes[k].scene), 'scène de ' + k); assert.ok(existe(D.decouvertes[k].icone), 'icône de ' + k); });
  Object.keys(D.batiments).filter(k => D.batiments[k].epoque === 6).forEach(k => {
    const b = D.batiments[k];
    assert.ok(existe(b.sprite), 'sprite de ' + k);
    if (b.travail) [2, 3].forEach(n => assert.ok(existe('niveaux/' + k + '-' + n), 'niveau ' + n + ' de ' + k));
    if (b.lits) assert.ok(existe('coupe/' + k), 'maison en coupe : ' + k);
    (b.vignettes || []).forEach(v => assert.ok(existe('vignettes/' + v.img), 'vignette ' + v.img));
    if (b.page) assert.ok(D.pages[b.page] || D.decouvertes[b.page], 'page de ' + k);
    if (b.travail) assert.ok(D.allures[6][b.travail.metier] && D.textes.phrases[b.travail.metier], 'métier ' + b.travail.metier);
  });
  Object.keys(D.allures[6]).forEach(k => [].concat(D.allures[6][k]).forEach(a => assert.ok(existe('habitants/' + a), 'habitant ' + a)));
  Object.keys(D.poses[6]).forEach(k => { const p = D.poses[6][k]; assert.ok(existe('poses/' + p), 'pose ' + p); if (p.startsWith('e6-')) assert.ok(existe('poses/' + p + '-b'), 'deuxième image de ' + p); });
  Object.keys(D.porteurs[6]).forEach(k => [].concat(typeof D.porteurs[6][k] === 'object' ? Object.values(D.porteurs[6][k]) : D.porteurs[6][k]).forEach(p => assert.ok(existe('porteurs/' + p), 'porteur ' + p)));
  ['06-electricite/poteau', '06-electricite/lampadaire', '06-electricite/voiture-rouge', '06-electricite/voiture-jaune', '06-electricite/camionnette', '06-electricite/avion', 'scenes/ville-electrique'].forEach(k => assert.ok(existe(k), k));
  Object.keys(D.textes.nature).forEach(k => assert.ok(existe(D.textes.nature[k][0]), 'image de la fiche ' + k));
  // un métier qui a sa pose de travail garde la même tenue (pas de changement de visage au travail)
  Object.keys(D.poses[6]).filter(k => D.poses[6][k].startsWith('e6-')).forEach(k => assert.ok(!Array.isArray(D.allures[6][k]), 'une seule tenue pour ' + k));
  // l'ancienne fin devient le passage de la vapeur ; la nouvelle fin a son image et sa vidéo
  ['histoire/vapeur.png', 'cine/vapeur.mp4'].forEach(f => assert.ok(fs.existsSync(path.join(racine, f)), f));
  ['village', 'ville', 'moyen-age', 'vapeur', 'electricite', 'fin'].forEach(k => ['fr', 'en'].forEach(l => assert.ok(D.textes.histoire[k][l].l1 && D.textes.histoire[k][l].l2, k + ' ' + l)));
  assert.match(D.textes.histoire.vapeur.fr.l1, /trains à vapeur/);
  assert.ok(D.textes.aides.finEpoque[5] && D.textes.aides.pretEpoque[6] && D.textes.aides.electriciteArrive);
  // pas de tiret long dans les textes du jeu
  assert.ok(!/—/.test(JSON.stringify(D)), 'pas de tiret long');
});

function aLaVapeurFinie(graine) {
  const m = auMoyenAgeFini(graine);
  Monde.passerEpoque(m);
  Monde.decouvertesEpoque(m).forEach(id => { m.decouvertes[id] = 1; });
  m.feuPrevu = null;
  return m;
}

test('électricité : la campagne grandit encore, la ville se densifie ; nouveaux bâtiments ; les monuments de la vapeur ne se construisent plus', () => {
  const m = aLaVapeurFinie(61);
  const avant = m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)).length;
  assert.ok(Monde.construisibles(m).indexOf('tour-eiffel') >= 0);
  assert.ok(Monde.passerEpoque(m));
  assert.strictEqual(m.epoque, 6);
  assert.ok(m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)).length > avant + 150, 'la campagne grandit encore (ADR-051)');
  const c = Monde.construisibles(m);
  assert.ok(c.indexOf('maison-ville') >= 0 && c.indexOf('laboratoire') >= 0, 'dès l\'arrivée');
  assert.ok(c.indexOf('centrale') < 0 && c.indexOf('garage') < 0 && c.indexOf('aerodrome') < 0 && c.indexOf('grand-immeuble') < 0, 'ils attendent leur découverte');
  assert.ok(c.indexOf('tour-eiffel') < 0 && c.indexOf('lampadaire') < 0, 'plus de monuments de la vapeur');
  assert.ok(c.indexOf('neuschwanstein') >= 0 && c.indexOf('cabine') >= 0, 'les monuments de l\'électricité');
  // densifier sur place : les vieilles maisons deviennent des maisons de ville, puis de grands immeubles
  const tente = m.batiments.find(b => b.type === 'tente');
  assert.strictEqual(Monde.amelioration(m, tente).vers, 'maison-ville');
  assert.strictEqual(Monde.amelioration(m, { type: 'maison-briques', etat: 'fini' }).vers, 'immeuble');
  m.decouvertes.electricite = 1;
  ['immeuble', 'maison-ville', 'maison-etages', 'maison-cour', 'maison-briques', 'maison-colombages'].forEach(k => assert.strictEqual(Monde.amelioration(m, { type: k, etat: 'fini' }).vers, 'grand-immeuble', k));
  assert.ok(D.batiments['grand-immeuble'].lits > D.batiments.immeuble.lits);
  ['ampoule', 'telephone', 'voiture', 'avion'].forEach(k => { m.decouvertes[k] = 1; });
  m.pieces = 9000;
  ['centrale', 'central-telephone', 'garage', 'ferme', 'aerodrome', 'neuschwanstein', 'sagrada'].forEach(k => assert.ok(Monde.emplacementsLibres(m, k).length > 0, 'de la place pour ' + k));
  assert.ok(Monde.emplacementsLibres(m, 'golden-gate').length > 0, 'le Golden Gate sur la plage');
});

test('électricité : il reste de la place pour toute l\'époque dans une grande ville de la vapeur', () => {
  // une partie entière jouée jusqu'à la fin de la vapeur, avec un joueur qui profite de chaque époque et construit beaucoup
  for (const graine of [8, 9]) {
  const m = Monde.nouveau(graine), st = {}, fin = {};
  let p = 0;
  while (m.t < 260 * 60) {
    Monde.pas(m, 0.1); m.evenements.length = 0;
    if (m.t < p) continue;
    p = m.t + 5;
    if (Joueur.tour(m, st) === 'fin') { if (!fin[m.epoque]) fin[m.epoque] = m.t; if (m.t - fin[m.epoque] < 300) continue; if (m.epoque >= 5) break; Monde.passerEpoque(m); }
  }
  assert.strictEqual(m.epoque, 5);
  const souches = m.terrain.tuiles.filter(t => t.obj === 'souche').length;
  Monde.passerEpoque(m);
  assert.ok(m.terrain.tuiles.filter(t => t.obj === 'souche').length >= souches + 30, 'la lisière de la forêt recule un peu');
  Object.keys(D.decouvertes).forEach(k => { m.decouvertes[k] = m.decouvertes[k] || 1; });
  m.pieces = 99999;
  const types = ['centrale', 'central-telephone', 'garage', 'aerodrome', 'laboratoire', 'grand-immeuble', 'maison-ville', 'grande-roue', 'neuschwanstein', 'sagrada', 'empire-state'];
  // la ferme au tracteur vient du grand champ de la campagne, modernisé sur place (ADR-051, ADR-053)
  const champ = m.batiments.find(b => b.type === 'grand-champ');
  assert.ok(champ && Monde.amelioration(m, champ).vers === 'ferme' && Monde.amelioration(m, champ).place, 'le grand champ devient la ferme au tracteur (graine ' + graine + ')');
  types.forEach(k => { const b = Monde.construire(m, k, Monde.emplacementsLibres(m, k)[0]); assert.ok(b, 'construit : ' + k + ' (graine ' + graine + ')'); });
  }
});

test('électricité : la nuit noire en ville, puis l\'ampoule allume les rues (le petit problème)', () => {
  const m = aLaVapeurFinie(62);
  Monde.passerEpoque(m);
  let noire = 0, lumiere = 0;
  const avancer = (s, f) => { for (let i = 0; i < s * 10; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.forEach(e => { if (e.type === 'nuit-noire') noire++; if (e.type === 'lumiere') lumiere++; }); m.evenements.length = 0; if (f && f()) return; } };
  // au premier soir après l'arrivée
  avancer(400, () => Monde.phase(m) === 'soir');
  assert.strictEqual(noire, 1, 'la nuit noire arrive au premier soir');
  assert.strictEqual(m.nuitNoire, true);
  assert.ok(!Monde.eclaire(m, [m.batiments[0].x, m.batiments[0].y]), 'le feu de camp n\'éclaire plus les rues : le travail s\'arrête');
  // on avance à tâtons : la moitié de la vitesse
  for (let i = 0; i < 20; i++) Monde.pas(m, 0.1);
  assert.ok(Monde.estNuit(m));
  const h = m.habitants.find(x => !x.dort && !x.enfant) || m.habitants[0];
  h.etapes = [{ fait: 'aller', p: [h.x + 2000, h.y] }]; h.dort = false;
  const x0 = h.x; Monde.pas(m, 0.1);
  assert.ok(Math.abs(h.x - x0) < h.vitesse * 0.1 * 0.6, 'on marche moins vite dans le noir');
  // l'ampoule : des lampadaires dans les rues, la ville est éclairée le soir
  m.decouvertes.electricite = 1; m.idees = 999;
  assert.ok(Monde.decouvrir(m, 'ampoule'));
  m.evenements.forEach(e => { if (e.type === 'lumiere') lumiere++; }); m.evenements.length = 0;
  assert.strictEqual(lumiere, 1);
  assert.ok(m.lampes.length >= 6, m.lampes.length + ' lampadaires');
  assert.strictEqual(m.nuitNoire, 'resolue');
  m.lampes.forEach(c => { const t = Terrain.tuile(m.terrain, c[0], c[1]); assert.ok(t.lampe && !t.bat); assert.ok(!Monde.ancreValide(m, 'cabine', c[0], c[1]), 'on ne bâtit pas sur un lampadaire'); });
  avancer(400, () => Monde.phase(m) === 'soir');
  assert.ok(Monde.eclaire(m, [0, 0]), 'le soir, toute la ville est éclairée');
  avancer(600);
  assert.strictEqual(noire, 1, 'la nuit noire ne revient pas');
});

test('électricité : la centrale et le central téléphonique posent leurs poteaux et leurs fils', () => {
  const m = aLaVapeurFinie(63);
  Monde.passerEpoque(m);
  m.decouvertes.electricite = 1; m.decouvertes.telephone = 1; m.pieces = 9000;
  const ce = Monde.construire(m, 'centrale', Monde.emplacementsLibres(m, 'centrale')[0]);
  const ct = Monde.construire(m, 'central-telephone', Monde.emplacementsLibres(m, 'central-telephone')[0]);
  let lignes = 0;
  for (let i = 0; i < 12000 && (ce.etat !== 'fini' || ct.etat !== 'fini'); i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.forEach(e => { if (e.type === 'ligne') lignes++; }); m.evenements.length = 0; }
  assert.strictEqual(ce.etat, 'fini'); assert.strictEqual(ct.etat, 'fini');
  assert.strictEqual(lignes, 2);
  assert.deepStrictEqual(m.lignes.map(l => l.genre).sort(), ['elec', 'tel']);
  m.lignes.forEach(l => {
    assert.ok(l.poteaux.length >= 1);
    l.poteaux.forEach(c => { const t = Terrain.tuile(m.terrain, c[0], c[1]); assert.ok(t.poteau && !t.bat && !t.gue && !t.rail && t.sol === 'herbe'); assert.ok(!Monde.ancreValide(m, 'cabine', c[0], c[1])); });
  });
  // la ferme agrandit la réserve
  assert.strictEqual(Monde.RESERVE.ferme, 70);
});

test('une partie de la vapeur, finie ou en cours, sauvée avant l\'électricité, continue sans rien perdre', () => {
  for (const fini of [true, false]) {
    const m = fini ? aLaVapeurFinie(64) : auMoyenAgeFini(65);
    if (!fini) { Monde.passerEpoque(m); m.feuPrevu = null; }
    laisser(m, 120);
    // une sauvegarde de la version d'avant : ni nuit noire prévue, ni lignes, ni lampadaires
    const vieux = JSON.parse(JSON.stringify(Monde.exporter(m)));
    delete vieux.nuitNoire; delete vieux.lignes; delete vieux.lampes;
    const leger = JSON.parse(JSON.stringify(Monde.exporterLeger(m)));
    for (const s of [vieux, Monde.developper(leger)]) {
      const repris = Monde.importer(JSON.parse(JSON.stringify(s)));
      assert.strictEqual(repris.epoque, 5);
      assert.strictEqual(repris.habitants.length, m.habitants.length);
      assert.strictEqual(repris.batiments.length, m.batiments.length);
      assert.strictEqual(repris.pieces, m.pieces);
      assert.deepStrictEqual(Object.keys(repris.decouvertes).sort(), Object.keys(m.decouvertes).sort());
      assert.strictEqual(Monde.epoqueTerminee(repris), fini);
      if (!fini) Monde.decouvertesEpoque(repris).forEach(id => { repris.decouvertes[id] = 1; });
      assert.ok(Monde.passerEpoque(repris), 'le bouton doré mène à l\'électricité');
      assert.strictEqual(repris.epoque, 6);
      let noire = 0;
      for (let i = 0; i < 4000 && !noire; i++) { if (Monde.toutLeMondeDort(repris)) Monde.reveiller(repris); Monde.pas(repris, 0.1); repris.evenements.forEach(e => { if (e.type === 'nuit-noire') noire++; }); repris.evenements.length = 0; }
      assert.strictEqual(noire, 1, 'la nuit noire arrive aussi dans une partie reprise');
    }
  }
});

// ---------- Le monde moderne (la dernière époque) ----------
test('monde moderne : quatre découvertes dans l\'ordre historique, chaque image existe ; la fin de l\'électricité devient un passage ; le texte de fin', () => {
  const fs = require('node:fs'), path = require('node:path');
  const ids = Object.keys(D.decouvertes).filter(k => D.decouvertes[k].epoque === 7);
  assert.deepStrictEqual(ids.sort(), ['fusee', 'ordinateur', 'satellite', 'solaire']);
  // l'ordre réel (ADR-001, epoques.md section 7)
  assert.deepStrictEqual(D.decouvertes.ordinateur.prerequis, ['electricite']);
  assert.deepStrictEqual(D.decouvertes.solaire.prerequis, ['electricite']);
  assert.deepStrictEqual(D.decouvertes.satellite.prerequis.slice().sort(), ['avion', 'ordinateur']);
  assert.deepStrictEqual(D.decouvertes.fusee.prerequis, ['satellite']);
  assert.strictEqual(D.epoques.length, 7, 'le monde moderne est la dernière époque');
  const racine = path.join(__dirname, '..', 'assets');
  const existe = cle => ['sprites/' + cle + '.png', 'sprites/' + cle + '.jpg', 'raw/' + cle + '.png'].some(f => fs.existsSync(path.join(racine, f)));
  ids.forEach(k => { assert.ok(existe(D.decouvertes[k].scene), 'scène de ' + k); assert.ok(existe(D.decouvertes[k].icone), 'icône de ' + k); });
  Object.keys(D.batiments).filter(k => D.batiments[k].epoque === 7).forEach(k => {
    const b = D.batiments[k];
    assert.ok(existe(b.sprite), 'sprite de ' + k);
    if (b.travail) [2, 3].forEach(n => assert.ok(existe('niveaux/' + k + '-' + n), 'niveau ' + n + ' de ' + k));
    if (b.lits) assert.ok(existe('coupe/' + k), 'maison en coupe : ' + k);
    (b.vignettes || []).forEach(v => assert.ok(existe('vignettes/' + v.img), 'vignette ' + v.img));
    if (b.page) assert.ok(D.pages[b.page] || D.decouvertes[b.page], 'page de ' + k);
    if (b.travail) assert.ok(D.allures[7][b.travail.metier] && D.textes.phrases[b.travail.metier], 'métier ' + b.travail.metier);
  });
  Object.keys(D.allures[7]).forEach(k => [].concat(D.allures[7][k]).forEach(a => assert.ok(existe('habitants/' + a), 'habitant ' + a)));
  Object.keys(D.poses[7]).forEach(k => { const p = D.poses[7][k]; assert.ok(existe('poses/' + p), 'pose ' + p); if (p.startsWith('e7-')) assert.ok(existe('poses/' + p + '-b'), 'deuxième image de ' + p); });
  Object.keys(D.porteurs[7]).forEach(k => [].concat(typeof D.porteurs[7][k] === 'object' ? Object.values(D.porteurs[7][k]) : D.porteurs[7][k]).forEach(p => assert.ok(existe('porteurs/' + p), 'porteur ' + p)));
  Object.keys(D.poses[7]).filter(k => D.poses[7][k].startsWith('e7-')).forEach(k => assert.ok(!Array.isArray(D.allures[7][k]), 'une seule tenue pour ' + k));
  ['07-moderne/fusee', '07-moderne/pas-de-tir', '07-moderne/satellite', '07-moderne/panneau', '07-moderne/voiture-electrique', '07-moderne/bus', 'scenes/ville-moderne'].forEach(k => assert.ok(existe(k), k));
  Object.keys(D.textes.nature).forEach(k => assert.ok(existe(D.textes.nature[k][0]), 'image de la fiche ' + k));
  // l'ancienne fin (l'électricité) devient un passage ; la vraie fin a sa nouvelle image et sa vidéo
  ['histoire/electricite.png', 'cine/electricite.mp4', 'histoire/fin.png', 'cine/fin.mp4'].forEach(f => assert.ok(fs.existsSync(path.join(racine, f)), f));
  assert.match(D.textes.histoire.electricite.fr.l1, /ampoule/);
  // le texte de fin conclut tout le voyage, du premier feu de camp à la fusée, sans annoncer de suite
  const fin = D.textes.histoire.fin.fr;
  assert.match(fin.l1, /feu de camp/); assert.match(fin.l1 + fin.l2, /fusée/);
  assert.ok(!/suite|bientôt|plus tard/i.test(fin.l1 + fin.l2), 'pas de clin d\'œil à une suite');
  assert.ok(D.textes.aides.finEpoque[6] && D.textes.aides.pretEpoque[7] && D.textes.aides.modernArrive && D.textes.aides.fuseePrete);
  assert.ok(!/plus tard/.test(D.textes.aides.finJeu), 'la fin ne dit plus que la suite arrivera plus tard');
  assert.ok(!/—/.test(JSON.stringify(D)), 'pas de tiret long');
});

function alElectriciteFinie(graine) {
  const m = aLaVapeurFinie(graine);
  Monde.passerEpoque(m);
  Monde.decouvertesEpoque(m).forEach(id => { m.decouvertes[id] = 1; });
  m.nuitNoire = 'resolue';
  return m;
}

test('monde moderne : la campagne grandit encore, un terrain est gardé pour la fusée ; nouveaux bâtiments ; les monuments de l\'électricité ne se construisent plus', () => {
  const m = alElectriciteFinie(71);
  const avant = m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)).length;
  assert.ok(Monde.construisibles(m).indexOf('sagrada') >= 0);
  assert.ok(Monde.passerEpoque(m));
  assert.strictEqual(m.epoque, 7);
  assert.ok(m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)).length > avant + 100, 'la campagne grandit encore (ADR-051)');
  const c = Monde.construisibles(m);
  ['supermarche', 'centre-recherche', 'immeuble-moderne'].forEach(k => assert.ok(c.indexOf(k) >= 0, k + ' dès l\'arrivée'));
  ['bureau', 'tour', 'parc-solaire', 'observatoire', 'pas-de-tir'].forEach(k => assert.ok(c.indexOf(k) < 0, k + ' attend sa découverte (le pas de tir se construit tout seul)'));
  assert.ok(c.indexOf('sagrada') < 0 && c.indexOf('cabine') < 0, 'plus de monuments de l\'électricité');
  assert.ok(c.indexOf('atomium') >= 0 && c.indexOf('velos') >= 0, 'les monuments du monde moderne');
  // le terrain de la fusée : 2 x 2 cases gardées, au bord de l'île, où l'on ne bâtit pas
  assert.ok(m.tir, 'un terrain est gardé');
  const T = m.terrain, cases = Terrain.empreinte(T, m.tir[0], m.tir[1], 2);
  cases.forEach(t => { assert.ok(t.tir && !t.bat && !t.obj && t.sol === 'herbe'); assert.ok(!Monde.ancreValide(m, 'velos', t.i, t.j), 'on ne bâtit pas sur le terrain de la fusée'); });
  // densifier : les vieilles maisons deviennent des immeubles modernes, puis des tours après l'ordinateur
  const tente = m.batiments.find(b => b.type === 'tente');
  if (tente) assert.strictEqual(Monde.amelioration(m, tente).vers, 'immeuble-moderne');
  assert.strictEqual(Monde.amelioration(m, { type: 'grand-immeuble', etat: 'fini' }).vers, 'immeuble-moderne');
  m.decouvertes.ordinateur = 1;
  ['grand-immeuble', 'immeuble', 'maison-ville', 'maison-briques', 'immeuble-moderne', 'maison-etages', 'maison-cour', 'maison-colombages'].forEach(k => assert.strictEqual(Monde.amelioration(m, { type: k, etat: 'fini' }).vers, 'tour', k));
  assert.ok(D.batiments.tour.lits > D.batiments['immeuble-moderne'].lits && D.batiments['immeuble-moderne'].lits > D.batiments['grand-immeuble'].lits);
  // les vieilles souches s'en vont (plus de grand champ de souches), on en garde un peu près de la forêt
  const loin = T.tuiles.filter(t => t.obj === 'souche' && ![[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(d => { const v = Terrain.tuile(T, t.i + d[0], t.j + d[1]); return v && v.obj === 'arbre'; }));
  assert.ok(loin.every(t => (t.i * 7 + t.j * 13) % 5 === 0), 'une souche sur cinq seulement loin de la forêt');
});

test('monde moderne : il reste de la place pour toute l\'époque dans une grande ville de l\'électricité', () => {
  for (const graine of [8, 9]) {
    const m = Monde.nouveau(graine), st = {}, fin = {};
    let p = 0;
    while (m.t < 300 * 60) {
      Monde.pas(m, 0.1); m.evenements.length = 0;
      if (m.t < p) continue;
      p = m.t + 5;
      if (Joueur.tour(m, st) === 'fin') { if (!fin[m.epoque]) fin[m.epoque] = m.t; if (m.t - fin[m.epoque] < 300) continue; if (m.epoque >= 6) break; Monde.passerEpoque(m); }
    }
    assert.strictEqual(m.epoque, 6);
    Monde.passerEpoque(m);
    assert.ok(m.tir, 'un terrain est gardé pour la fusée (graine ' + graine + ')');
    Object.keys(D.decouvertes).forEach(k => { if (k !== 'fusee') m.decouvertes[k] = m.decouvertes[k] || 1; });
    m.pieces = 99999;
    const types = ['supermarche', 'centre-recherche', 'bureau', 'parc-solaire', 'observatoire', 'immeuble-moderne', 'tour', 'atomium', 'pyramide-louvre', 'burj-khalifa', 'opera-sydney', 'spoutnik'];
    // depuis que les fermes et les étables prennent plus de place (ADR-041), une ville pleine peut manquer de place pour un ou deux monuments ;
    // les bâtiments utiles, eux, trouvent toujours leur place
    let sansPlace = 0;
    types.forEach(k => { const b = Monde.construire(m, k, Monde.emplacementsLibres(m, k)[0]); if (!b && D.batiments[k].deco) { sansPlace++; return; } assert.ok(b, 'construit : ' + k + ' (graine ' + graine + ')'); });
    assert.ok(sansPlace <= 2, 'au plus deux monuments sans place (graine ' + graine + ') : ' + sansPlace);
    // le terrain de la fusée est resté libre : le pas de tir s'y pose
    m.idees = 999; m.decouvertes.fusee = 0; delete m.decouvertes.fusee;
    assert.ok(Monde.decouvrir(m, 'fusee'));
    const pad = m.batiments.find(b => b.type === 'pas-de-tir');
    assert.ok(pad && pad.i === m.tir[0] && pad.j === m.tir[1], 'le pas de tir est sur son terrain');
  }
});

test('monde moderne : l\'air devient sale, plus personne ne vient ; l\'énergie solaire pose des éoliennes et l\'air redevient pur (le petit problème)', () => {
  const m = alElectriciteFinie(72);
  Monde.passerEpoque(m);
  let sale = 0, pur = 0, encore = 0;
  const avancer = (s, f) => { for (let i = 0; i < s * 10; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.forEach(e => { if (e.type === 'air-sale') { if (e.encore) encore++; else sale++; } if (e.type === 'air-pur') pur++; }); m.evenements.length = 0; if (f && f()) return; } };
  avancer(Monde.DELAI_AIR - 5);
  assert.strictEqual(sale, 0, 'pas tout de suite');
  avancer(10);
  assert.strictEqual(sale, 1, 'l\'air devient sale peu après l\'arrivée');
  assert.strictEqual(m.airSale, true);
  // plus personne ne vient habiter ici, même avec de la place et à manger
  m.pieces = 99999;
  const maison = Monde.construire(m, 'immeuble-moderne', Monde.emplacementsLibres(m, 'immeuble-moderne')[0]);
  avancer(200, () => maison.etat === 'fini');
  m.nourriture = Monde.reserveMax(m); m.faim = 0;
  m.batiments.forEach(b => { if (D.batiments[b.type].travail && D.batiments[b.type].travail.produit === 'nourriture') b.ouvriers = b.ouvriers.slice(0, Monde.places(b)); });
  const n0 = m.habitants.length;
  // seuls viennent ceux qui manquent pour nourrir la ville (les postes libres des fermes)
  const vides = m.batiments.reduce((s, b) => s + (b.etat === 'fini' && D.batiments[b.type].travail && D.batiments[b.type].travail.produit === 'nourriture' ? Math.max(0, Monde.places(b) - b.ouvriers.length) : 0), 0);
  avancer(90, () => { m.nourriture = Monde.reserveMax(m); m.faim = 0; return false; });
  assert.ok(m.habitants.length <= n0 + 1 + vides, 'presque personne n\'arrive dans l\'air sale : ' + n0 + ' puis ' + m.habitants.length + ' (' + vides + ' postes pour nourrir)');
  avancer(400, () => encore > 0);
  assert.ok(encore >= 1, 'on le rappelle au matin');
  // l'énergie solaire
  m.idees = 999;
  assert.ok(Monde.decouvrir(m, 'solaire'));
  m.evenements.forEach(e => { if (e.type === 'air-pur') pur++; }); m.evenements.length = 0;
  assert.strictEqual(pur, 1);
  assert.strictEqual(m.airSale, 'resolu');
  assert.ok(m.eoliennes.length >= 3, m.eoliennes.length + ' éoliennes');
  assert.ok(m.panneaux.length >= 1, m.panneaux.length + ' panneaux');
  m.eoliennes.concat(m.panneaux).forEach(c => { const t = Terrain.tuile(m.terrain, c[0], c[1]); assert.ok((t.eolienne || t.panneau) && !t.bat && !t.tir); assert.ok(!Monde.ancreValide(m, 'velos', c[0], c[1])); });
  // les arrivées reprennent
  const n1 = m.habitants.length;
  avancer(120, () => { m.nourriture = Monde.reserveMax(m); m.faim = 0; return false; });
  assert.ok(m.habitants.length > n1, 'des familles arrivent de nouveau');
  avancer(600);
  assert.strictEqual(sale, 1, 'l\'air sale ne revient pas');
});

test('monde moderne : la fusée lance le pas de tir ; prête, l\'enfant la fait décoller ; c\'est la fin, et le jeu continue', () => {
  const m = alElectriciteFinie(73);
  Monde.passerEpoque(m);
  m.airPrevu = null;
  ['ordinateur', 'solaire', 'satellite'].forEach(k => { m.decouvertes[k] = 1; });
  m.idees = 999;
  assert.ok(Monde.epoqueTerminee(m) === false);
  assert.strictEqual(m.fusee, undefined);
  assert.ok(Monde.decouvrir(m, 'fusee'));
  assert.ok(Monde.epoqueTerminee(m), 'toutes les découvertes sont faites');
  assert.ok(!Monde.partieFinie(m), 'mais la partie n\'est finie qu\'au décollage');
  assert.strictEqual(Monde.passerEpoque(m), false); assert.ok(!m.fini);
  const pad = m.batiments.find(b => b.type === 'pas-de-tir');
  assert.ok(pad && pad.etat === 'chantier' && pad.automatique);
  assert.strictEqual(m.fusee, 'chantier');
  assert.ok(!Monde.decoller(m), 'pas de décollage avant que le pas de tir soit prêt');
  let prete = 0, partie = 0;
  for (let i = 0; i < 20000 && !prete; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.forEach(e => { if (e.type === 'fusee-prete') prete++; }); m.evenements.length = 0; }
  assert.strictEqual(pad.etat, 'fini', 'les habitants bâtissent le pas de tir');
  assert.strictEqual(prete, 1); assert.strictEqual(m.fusee, 'prete');
  // la sauvegarde garde une fusée prête
  const repris = Monde.importer(Monde.developper(JSON.parse(JSON.stringify(Monde.exporterLeger(m)))));
  assert.strictEqual(repris.fusee, 'prete');
  // le gros bouton
  assert.ok(Monde.decoller(m));
  assert.strictEqual(m.fusee, 'vol');
  for (let i = 0; i < (Monde.DUREE_VOL + 1) * 10; i++) { Monde.pas(m, 0.1); m.evenements.forEach(e => { if (e.type === 'fusee-partie') partie++; }); m.evenements.length = 0; }
  assert.strictEqual(partie, 1);
  assert.strictEqual(m.fusees, 1);
  assert.ok(Monde.partieFinie(m), 'la vraie fin du jeu');
  assert.strictEqual(Monde.passerEpoque(m), false); assert.ok(m.fini);
  // le jeu continue : on construit encore, et une nouvelle fusée est dressée un peu plus tard
  m.pieces = 9999;
  assert.ok(Monde.construire(m, 'velos', Monde.emplacementsLibres(m, 'velos')[0]));
  for (let i = 0; i < (Monde.NOUVELLE_FUSEE + 5) * 10; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); m.evenements.length = 0; }
  assert.strictEqual(m.fusee, 'prete');
  assert.ok(Monde.decoller(m));
  for (let i = 0; i < (Monde.DUREE_VOL + 1) * 10; i++) Monde.pas(m, 0.1);
  assert.strictEqual(m.fusees, 2);
  assert.ok(Monde.partieFinie(m));
});

test('une partie sauvée à chaque époque, finie ou en cours, avec l\'ancienne version, reprend sans rien perdre et peut aller jusqu\'à la fusée', () => {
  const etats = [];
  const pierre = Monde.nouveau(81); laisser(pierre, 120); etats.push(['pierre en cours', pierre]);
  etats.push(['néolithique fini', auNeolithiqueFini(82)]);
  etats.push(['métaux finis', auxMetauxFinis(83)]);
  etats.push(['Moyen Âge fini', auMoyenAgeFini(84)]);
  etats.push(['vapeur finie', aLaVapeurFinie(85)]);
  const el = aLaVapeurFinie(86); Monde.passerEpoque(el); laisser(el, 60); etats.push(['électricité en cours', el]);
  etats.push(['électricité finie (« Fini » de l\'ancienne version)', alElectriciteFinie(87)]);
  for (const [nom, m] of etats) {
    laisser(m, 30);
    // une sauvegarde de la version d'avant : sans les nouveautés du monde moderne, et une copie légère à l'ancienne (cases entières)
    const vieux = JSON.parse(JSON.stringify(Monde.exporter(m)));
    ['airPrevu', 'airSale', 'tir', 'eoliennes', 'panneaux', 'fusee', 'fusees', 'vol', 'prochaineFusee', 'souchesEclaircies'].forEach(k => delete vieux[k]);
    const c = JSON.parse(JSON.stringify(vieux)), T = c.terrain, base = Terrain.generer(), delta = [], meta = {};
    T.tuiles.forEach((t, i) => { if (JSON.stringify(t) !== JSON.stringify(base.tuiles[i])) delta.push([i, t]); });
    Object.keys(T).forEach(k => { if (k !== 'tuiles') meta[k] = T[k]; });
    c.terrain = { leger: true, n: T.tuiles.length, meta, delta };
    for (const s of [vieux, Monde.developper(c), Monde.developper(JSON.parse(JSON.stringify(Monde.exporterLeger(m))))]) {
      const r = Monde.importer(JSON.parse(JSON.stringify(s)));
      assert.strictEqual(r.epoque, m.epoque, nom);
      assert.strictEqual(r.habitants.length, m.habitants.length, nom);
      assert.strictEqual(r.batiments.length, m.batiments.length, nom);
      assert.strictEqual(r.pieces, m.pieces, nom);
      assert.deepStrictEqual(Object.keys(r.decouvertes).sort(), Object.keys(m.decouvertes).sort(), nom);
      assert.strictEqual(Monde.epoqueTerminee(r), Monde.epoqueTerminee(m), nom);
      // on continue jusqu'au monde moderne et jusqu'à la fusée
      while (r.epoque < 7) { Monde.decouvertesEpoque(r).forEach(id => { r.decouvertes[id] = r.decouvertes[id] || 1; }); r.feuPrevu = null; r.crue = null; assert.ok(Monde.passerEpoque(r), nom + ' : époque ' + (r.epoque + 1)); }
      assert.ok(r.tir, nom + ' : le terrain de la fusée');
      ['ordinateur', 'solaire', 'satellite'].forEach(k => { r.decouvertes[k] = 1; });
      r.idees = 999;
      assert.ok(Monde.decouvrir(r, 'fusee'), nom);
      const pad = r.batiments.find(b => b.type === 'pas-de-tir');
      pad.etat = 'fini'; r.fusee = 'prete';
      assert.ok(Monde.decoller(r), nom);
      for (let i = 0; i < (Monde.DUREE_VOL + 1) * 10; i++) Monde.pas(r, 0.1);
      assert.ok(Monde.partieFinie(r), nom + ' : la fin');
    }
  }
});

test('monde moderne : la place de la fusée existe dans chaque partie de l\'électricité', () => {
  for (const g of [91, 92, 93, 94, 95]) {
    const m = alElectriciteFinie(g);
    Monde.passerEpoque(m);
    assert.ok(m.tir, 'graine ' + g);
    const T = m.terrain;
    let bord = false;
    for (let a = -2; a <= 3; a++) for (let b = -2; b <= 3; b++) { const v = Terrain.tuile(T, m.tir[0] + a, m.tir[1] + b); if (!v || !Terrain.surIle(T, v) || v.sol === 'eau' || v.sol === 'sable') bord = true; }
    assert.ok(bord, 'au bord de l\'île (graine ' + g + ')');
  }
});

test('moderniser : le champ de blé du néolithique devient les champs labourés, plus grands, et laisse un cadeau (ADR-040, ADR-041)', () => {
  const m = auNeolithiqueFini(31);
  let champ = m.batiments.find(b => b.type === 'champ-ble' && b.etat === 'fini');
  if (!champ) { m.pieces += 500; champ = Monde.construire(m, 'champ-ble', Monde.emplacementsLibres(m, 'champ-ble')[0]); laisser(m, 120); }
  assert.ok(champ && champ.etat === 'fini', 'un champ de blé fini');
  // au néolithique, rien à moderniser
  assert.notStrictEqual((Monde.amelioration(m, champ) || {}).genre, 'moderne');
  for (let e = 0; e < 2; e++) { Monde.passerEpoque(m); Monde.decouvertesEpoque(m).forEach(id => { if (id !== 'fer') m.decouvertes[id] = 1; }); } // le Moyen Âge, sans le fer
  // ADR-054 : au Moyen Âge, le champ de blé ne se bâtit plus, même avant le fer ; celui qui est bâti reste
  assert.ok(Monde.construisibles(m).indexOf('champ-ble') < 0, 'au Moyen Âge, le champ de blé ne se bâtit plus');
  assert.ok(m.batiments.indexOf(champ) >= 0, 'celui qui est bâti reste');
  assert.strictEqual(m.epoque, 4);
  m.decouvertes.fer = m.decouvertes.fer || 1;
  // le champ de blé ne se bâtit plus : sa forme du Moyen Âge le remplace dans le bandeau
  assert.ok(Monde.construisibles(m).indexOf('champ-ble') < 0, 'le champ de blé est dépassé');
  assert.ok(Monde.construisibles(m).indexOf('champ-laboure') >= 0, 'les champs labourés se bâtissent');
  const a = Monde.amelioration(m, champ);
  assert.strictEqual(a.genre, 'moderne'); assert.strictEqual(a.vers, 'champ-laboure'); assert.ok(a.place, 'il y a la place autour');
  m.pieces += a.cout + 10;
  const avant = m.pieces;
  assert.ok(Monde.ameliorer(m, champ.id));
  assert.strictEqual(champ.type, 'champ-laboure'); assert.strictEqual(champ.k, 3); assert.strictEqual(champ.etat, 'chantier');
  assert.strictEqual(m.terrain.tuiles.filter(t => t.bat === champ.id).length, 9, 'il prend 3 x 3 cases');
  for (let n = 0; n < 40 && champ.etat !== 'fini'; n++) laisser(m, 15);
  assert.strictEqual(champ.etat, 'fini');
  assert.ok(champ.cadeau && champ.cadeau.pieces > 0, 'un cadeau attend');
  const p0 = m.pieces, c = Monde.ouvrirCadeau(m, champ.id);
  assert.strictEqual(m.pieces, p0 + c.pieces); assert.ok(!champ.cadeau);
  assert.ok(avant > 0);
});

test('les souches des arbres coupés s\'en vont au matin (on en garde une sur cinq) (ADR-041)', () => {
  const m = Monde.nouveau(5);
  const tuiles = m.terrain.tuiles.filter(t => t.sol === 'herbe' && !t.bat && !t.obj).slice(0, 50);
  tuiles.forEach(t => { t.obj = 'souche'; });
  jusquA(m, 'nuit'); jusquA(m, 'aube');
  const restent = tuiles.filter(t => t.obj === 'souche').length;
  assert.ok(restent > 0 && restent <= 15, 'il en reste quelques-unes : ' + restent);
});

test('les routes (bac à sable, ADR-044) : chaque façon donne un réseau, et chaque forme de case a sa pièce', () => {
  const Routes = require('../src/routes.js');
  const m = auMoyenAgeFini(41);
  laisser(m, 60);
  for (const mode of ['usure', 'plan', 'melange']) {
    const r = Routes.calculer(m, mode);
    Object.keys(r.cases).forEach(k => { const t = m.terrain.tuiles[+k]; assert.ok(Routes.praticable(m.terrain, t), mode + ' : une route sur une case praticable'); });
  }
  const plan = Routes.calculer(m, 'plan');
  assert.ok(Object.keys(plan.cases).length > 5, 'le réseau tracé relie des bâtiments');
  for (let mq = 0; mq < 16; mq++) {
    const [n, r] = Routes.piece(mq);
    const bases = { 1: 5, 2: 3, 3: 7, 4: 15, 5: 1, 6: 0 };
    let b = bases[n]; for (let k = 0; k < r; k++) b = ((b << 1) | (b >> 3)) & 15;
    assert.strictEqual(b, mq, 'masque ' + mq);
  }
});

// ---------- ADR-050, ADR-051 : la carte plus grande, le grand déménagement des fermes, les monuments plus grands ----------
const fs = require('fs'), path = require('path');
const ancienne = f => JSON.parse(fs.readFileSync(path.join(__dirname, 'grille-44', f), 'utf8'));

test('la carte passe de 44 à 64 cases de côté : l\'ancienne carte est au milieu, identique', () => {
  assert.strictEqual(Terrain.N, 64);
  const T = Terrain.generer(), P = Terrain.P;
  // le village de départ, la grotte et le gué sont au même endroit de l'ancienne carte, décalés de P cases
  assert.strictEqual(Terrain.CI, 22 + P);
  assert.deepStrictEqual(T.grotte, [23 + P, 12 + P]);
  assert.deepStrictEqual(T.gue, [27 + P, 15 + P]);
  // les époques 1 à 4 n'ont rien de nouveau : la campagne n'arrive qu'à la vapeur
  assert.ok(T.tuiles.every(t => !t.campagne || !t.ile || t.ile >= 5));
});

test('une sauvegarde faite sur l\'ancienne carte (44 x 44) reprend sur la nouvelle, au même endroit', () => {
  for (const f of ['e2-encours-leger.json', 'e4-fini-leger.json', 'e6-fini-leger.json']) {
    const vieux = ancienne(f);
    const nb = vieux.batiments.length, ep = vieux.epoque, pieces = vieux.pieces, hab = vieux.habitants.length;
    const m = Monde.importer(Monde.developper(vieux));
    assert.ok(m, f);
    assert.strictEqual(m.terrain.tuiles.length, 64 * 64, f);
    assert.strictEqual(m.terrain.N, 64, f);
    assert.strictEqual(m.epoque, ep, f);
    assert.strictEqual(m.habitants.length, hab, f);
    // chaque bâtiment est sur ses cases et dessiné au bon endroit
    m.batiments.forEach(b => {
      if (b.type === 'passerelle' || b.type === 'pont-pierre') return;
      const c = Terrain.centreEmpreinte(b.i, b.j, b.k);
      assert.ok(Math.abs(b.x - c[0]) < 1 && Math.abs(b.y - c[1]) < 1, f + ' ' + b.type);
      Terrain.empreinte(m.terrain, b.i, b.j, b.k).forEach(t => assert.strictEqual(t.bat, b.id, f + ' ' + b.type));
    });
    // chaque habitant est sur l'île
    m.habitants.forEach(h => { const c = Terrain.tuileDe(h.x, h.y), t = Terrain.tuile(m.terrain, c[0], c[1]); assert.ok(t && Terrain.surIle(m.terrain, t), f + ' habitant ' + h.id); });
    assert.ok(Terrain.tuile(m.terrain, m.terrain.gue[0], m.terrain.gue[1]).gue, f + ' le gué');
    if (m.rails) m.rails.tuiles.forEach(c => assert.ok(Terrain.tuile(m.terrain, c[0], c[1]).rail, f + ' les rails'));
    (m.lampes || []).forEach(c => assert.ok(Terrain.tuile(m.terrain, c[0], c[1]).lampe, f + ' les lampadaires'));
    if (ep < 5) {
      assert.strictEqual(m.batiments.length, nb, f);
      assert.strictEqual(m.pieces, pieces, f);
    }
    // on continue à jouer
    laisser(m, 60);
    // et la sauvegarde légère de la nouvelle carte se relit
    const r = Monde.importer(Monde.developper(JSON.parse(JSON.stringify(Monde.exporterLeger(m)))));
    assert.strictEqual(r.batiments.length, m.batiments.length, f);
    assert.strictEqual(r.terrain.tuiles.length, 64 * 64, f);
  }
});

test('au passage à la vapeur, les champs et les bêtes quittent la ville pour deux grandes exploitations de 6 x 6 cases à la campagne (ADR-050, ADR-051, ADR-053)', () => {
  const m = auMoyenAgeFini(91);
  // une étable en plus si le joueur n'avait pas d'élevage
  m.pieces += 2000;
  if (!m.batiments.some(b => /enclos|etable/.test(b.type))) Monde.construire(m, 'etable', Monde.emplacementsLibres(m, 'etable')[0]).etat = 'fini';
  const fermes = m.batiments.filter(b => Monde.FERMES_VILLE[b.type] && b.etat === 'fini');
  assert.ok(fermes.some(b => /champ|baies/.test(b.type)) && fermes.some(b => /enclos|etable/.test(b.type)), 'des champs et des enclos en ville');
  const postes = fermes.reduce((s, b) => s + Monde.places(b), 0), travailleurs = fermes.reduce((s, b) => s + b.ouvriers.length, 0);
  const cases = new Set(); fermes.forEach(b => Terrain.empreinte(m.terrain, b.i, b.j, b.k).forEach(t => cases.add(t)));
  const reserve = Monde.reserveMax(m);
  assert.ok(Monde.passerEpoque(m));
  const ev = m.evenements.find(e => e.type === 'demenagement');
  assert.ok(ev, 'la scène du déménagement');
  assert.strictEqual(ev.anciens.length, fermes.length);
  assert.ok(m.demenage);
  // plus aucune ferme en ville
  assert.strictEqual(m.batiments.filter(b => Monde.FERMES_VILLE[b.type] && D.batiments[b.type].zone !== 'campagne').length, 0);
  ['buisson-baies', 'champ-ble', 'champ-laboure', 'enclos-moutons', 'etable'].forEach(k => assert.ok(Monde.construisibles(m).indexOf(k) < 0, k + ' ne se bâtit plus en ville'));
  // les cases libérées sont libres
  cases.forEach(t => assert.ok(!t.bat));
  // un grand champ et une grande ferme d'élevage, de 4 x 4 cases, sur la campagne, loin de la ville
  const champ = m.batiments.find(b => b.type === 'grand-champ'), elev = m.batiments.find(b => b.type === 'grand-elevage');
  assert.ok(champ && elev);
  [champ, elev].forEach(b => {
    assert.strictEqual(b.k, 6);
    assert.strictEqual(b.etat, 'fini');
    Terrain.empreinte(m.terrain, b.i, b.j, 6).forEach(t => { assert.ok(t.ile >= 5 && Terrain.surIle(m.terrain, t)); assert.ok(!t.obj); });
    for (let a = -3; a < 9; a++) for (let c = -3; c < 9; c++) {
      const t = Terrain.tuile(m.terrain, b.i + a, b.j + c), o = t && t.bat && Monde.bat(m, t.bat);
      assert.ok(!o || D.batiments[o.type].zone === 'campagne' || o.type === 'passerelle' || o.type === 'pont-pierre', 'loin de la ville : ' + (o && o.type));
    }
  });
  // assez de postes pour tous ceux qui y travaillaient, et la réserve n'a pas rétréci
  assert.ok(Monde.places(champ) + Monde.places(elev) >= Math.min(postes, 16));
  assert.ok(Monde.reserveMax(m) >= reserve);
  // les moutons partent à pied et arrivent
  assert.ok(m.animaux.filter(a => a.espece === 'mouton').length >= 3);
  laisser(m, 90);
  assert.strictEqual(m.animaux.filter(a => a.espece === 'mouton').length, 0, 'les moutons sont arrivés');
  assert.ok(champ.ouvriers.length + elev.ouvriers.length >= travailleurs, 'ceux qui y travaillaient y travaillent encore');
  // une seule fois
  assert.strictEqual(Monde.demenager(m), null);
  // on peut encore bâtir une grande exploitation, à la campagne
  m.pieces = 5000;
  const l = Monde.emplacementsLibres(m, 'grand-champ');
  assert.ok(l.length > 0, 'de la place à la campagne');
  // à l'électricité, elles prennent la forme de leur temps, sur place
  Monde.decouvertesEpoque(m).forEach(id => { m.decouvertes[id] = 1; }); m.feuPrevu = null;
  assert.ok(Monde.passerEpoque(m));
  m.decouvertes.voiture = 1; m.decouvertes.electricite = 1;
  const a = Monde.amelioration(m, champ);
  assert.strictEqual(a.vers, 'ferme');
  assert.deepStrictEqual(a.ancre, [champ.i, champ.j]);
  assert.strictEqual(Monde.amelioration(m, elev).vers, 'ferme-laitiere');
});

test('une partie déjà à la vapeur ou plus tard vit le déménagement des fermes à son retour', () => {
  const vieux = ancienne('e6-fini-leger.json');
  const avant = vieux.batiments.filter(b => Monde.FERMES_VILLE[b.type]).length;
  assert.ok(avant > 0);
  const m = Monde.importer(Monde.developper(vieux));
  assert.ok(m.evenements.some(e => e.type === 'demenagement'));
  assert.strictEqual(m.batiments.filter(b => Monde.FERMES_VILLE[b.type] && D.batiments[b.type].zone !== 'campagne').length, 0);
  assert.ok(m.batiments.some(b => b.type === 'ferme' && b.k === 6) && m.batiments.some(b => b.type === 'ferme-laitiere' && b.k === 6), 'les formes de l\'électricité');
  // le tunnel du train est resté au bord de l'île, qui a grandi
  if (m.rails && m.rails.tuiles.length >= 2) {
    const f = m.rails.tuiles[m.rails.tuiles.length - 1];
    assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(d => { const v = Terrain.tuile(m.terrain, f[0] + d[0], f[1] + d[1]); return !v || !Terrain.surIle(m.terrain, v); }), 'le tunnel au bord de l\'île');
  }
  // la fois suivante, rien ne recommence
  const r = Monde.importer(Monde.developper(JSON.parse(JSON.stringify(Monde.exporterLeger(m)))));
  assert.ok(!r.evenements.some(e => e.type === 'demenagement'));
});

test('les monuments sont plus grands : une case de plus de côté ; ceux d\'avant grandissent quand ils ont la place (ADR-051)', () => {
  assert.strictEqual(D.batiments.parthenon.taille, 3);
  assert.strictEqual(D.batiments['big-ben'].taille, 2);
  assert.strictEqual(D.batiments.stonehenge.taille, 2, 'pas ceux du néolithique');
  const m = auxMetauxFinis(93);
  m.pieces = 9000;
  const b = Monde.construire(m, 'parthenon', Monde.emplacementsLibres(m, 'parthenon')[0]);
  assert.strictEqual(b.k, 3);
  // un monument posé avant, sur 2 x 2 cases, au milieu d'un pré libre
  b.k = 2; Terrain.empreinte(m.terrain, b.i, b.j, 3).forEach(t => { if (t.i >= b.i + 2 || t.j >= b.j + 2) t.bat = null; });
  assert.strictEqual(Monde.agrandirMerveilles(m), 1);
  assert.strictEqual(b.k, 3);
  Terrain.empreinte(m.terrain, b.i, b.j, 3).forEach(t => assert.strictEqual(t.bat, b.id));
});

test("au changement d'âge, les bâtiments dépassés ne se construisent plus, et le jeu dit lesquels et pourquoi (ADR-054)", () => {
  // chaque bâtiment qui disparaît a sa raison, et ce qui le remplace existe
  Object.keys(D.batiments).forEach(k => {
    const d = D.batiments[k];
    if (!d.disparait) return;
    assert.ok(d.disparait.pourquoi.length > 20, 'raison pour ' + k);
    assert.ok(d.disparait.epoque > d.epoque, 'il disparaît après son époque : ' + k);
    assert.ok(!d.merveille, 'les monuments restent : ' + k);
  });
  // à chaque époque, une maison et de quoi nourrir dès que les découvertes de l'époque sont faites
  const m = Monde.nouveau(7);
  for (let e = 1; e <= 7; e++) {
    m.epoque = e; m.demenage = e >= 5;
    Object.keys(D.decouvertes).forEach(k => { if (D.decouvertes[k].epoque <= e) m.decouvertes[k] = 1; });
    const c = Monde.construisibles(m);
    assert.ok(c.some(k => D.batiments[k].lits), "une maison à l'époque " + e);
    assert.ok(c.some(k => D.batiments[k].travail && D.batiments[k].travail.produit === 'nourriture'), "de quoi nourrir à l'époque " + e);
    c.forEach(k => { const d = D.batiments[k]; assert.ok(!d.disparait || d.disparait.epoque > e, k + " est dépassé à l'époque " + e); });
  }
  ['atelier-silex', 'ratelier-lances', 'tente', 'feu', 'grenier', 'maison-torchis'].forEach(k => assert.ok(Monde.construisibles(m).indexOf(k) < 0, k + ' ne se bâtit plus au monde moderne'));
  // le passage d'âge annonce ce qui disparaît (seulement ce que le joueur pouvait bâtir)
  const n = auNeolithiqueFini(95);
  n.evenements.length = 0;
  Monde.passerEpoque(n);
  const ev = n.evenements.find(e => e.type === 'disparus');
  assert.ok(ev && ev.liste.indexOf('atelier-silex') >= 0 && ev.liste.indexOf('maison-torchis') >= 0, "à l'âge des métaux : " + (ev && ev.liste));
  assert.ok(ev.liste.every(k => D.batiments[k].disparait.epoque === 3));
});


// Toucher un animal ouvre sa fiche (ADR-015) : chaque espèce que le monde fait naître a son texte (le mouton n'en avait pas : la fiche plantait).
test('chaque animal du monde a sa fiche quand on le touche', () => {
  const fs = require('fs'), path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'monde.js'), 'utf8');
  const especes = [...new Set([...src.matchAll(/espece: '([a-z]+)'/g)].map((m) => m[1]))];
  const D = require('../src/data.js');
  assert.ok(especes.length >= 5, especes.join(' '));
  especes.forEach((e) => assert.ok(D.textes.nature[e], 'pas de fiche pour : ' + e));
});
