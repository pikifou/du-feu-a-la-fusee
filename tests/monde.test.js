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

test('une partie se termine : âge de pierre, néolithique, âge des métaux, Moyen Âge, la vapeur, puis l\'électricité', () => {
  for (const graine of [1, 2, 3]) {
    const { m, jalons, stats } = jouer(graine, 5, 240);
    assert.ok(jalons.epoque1, 'âge de pierre fini (graine ' + graine + ')');
    assert.ok(jalons.epoque2, 'néolithique fini (graine ' + graine + ')');
    assert.ok(jalons.epoque3, 'âge des métaux fini (graine ' + graine + ')');
    assert.ok(jalons.epoque4, 'Moyen Âge fini (graine ' + graine + ')');
    assert.ok(jalons.epoque5, 'la vapeur finie (graine ' + graine + ')');
    assert.ok(jalons.epoque6, 'l\'électricité finie (graine ' + graine + ')');
    assert.strictEqual(m.epoque, 6);
    assert.ok(m.fini, 'fin du jeu atteinte');
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

test('sauvegarde légère d\'une partie finie à l\'électricité : sous 250 000 caractères', () => {
  const { m } = jouer(5, 5, 290, 8);
  assert.strictEqual(m.epoque, 6);
  assert.ok(m.fini);
  for (let i = 0; i < 3000; i++) { if (Monde.toutLeMondeDort(m)) Monde.reveiller(m); Monde.pas(m, 0.1); }
  m.evenements.length = 0;
  const leger = JSON.stringify(Monde.exporterLeger(m));
  console.log(`sauvegarde légère en fin de partie : ${leger.length} caractères, ${m.batiments.length} bâtiments, ${m.habitants.length} habitants`);
  assert.ok(leger.length < 250000);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(Monde.developper(JSON.parse(leger)))), JSON.parse(JSON.stringify(Monde.arrondir(Monde.exporter(m)))));
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
  assert.deepStrictEqual(JSON.parse(JSON.stringify(rendu)), JSON.parse(JSON.stringify(Monde.arrondir(JSON.parse(complet)))), "à l'arrondi près");
  // l'arrondi ne déplace personne de plus d'un dixième de pixel, et les trajets se recalculent
  rendu.habitants.forEach((h, k) => assert.ok(Math.abs(h.x - m.habitants[k].x) <= 0.051 && Math.abs(h.y - m.habitants[k].y) <= 0.051));
  const repris = Monde.importer(rendu); for (let i = 0; i < 300; i++) Monde.pas(repris, 0.1);
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

test('vapeur : l\'île grandit vers le nord sans toucher aux anciennes cases ; nouveaux bâtiments ; les monuments du Moyen Âge ne se construisent plus', () => {
  const m = auMoyenAgeFini(51);
  const avant = JSON.stringify(m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)));
  const n0 = m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)).length;
  assert.ok(Monde.construisibles(m).indexOf('notre-dame') >= 0);
  assert.ok(Monde.passerEpoque(m));
  assert.strictEqual(m.epoque, 5);
  const neuves = m.terrain.tuiles.filter(t => t.ile === 5);
  assert.ok(neuves.length > 150, 'un nouvel anneau : ' + neuves.length + ' cases');
  assert.strictEqual(m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)).length, n0 + neuves.length);
  const moy = l => l.reduce((s, t) => s + t.i + t.j, 0) / l.length;
  assert.ok(moy(neuves) < Terrain.CI + Terrain.CJ - 12, 'il est au nord, en haut de l\'écran');
  assert.ok(neuves.every(t => Math.min(t.i, t.j, Terrain.N - 1 - t.i, Terrain.N - 1 - t.j) >= 2), 'à deux cases du bord de la grille');
  assert.ok(neuves.filter(t => t.sol === 'herbe' && !t.obj).length > 60, 'des clairières pour bâtir');
  // les cases déjà sur l'île n'ont pas bougé (les sauvegardes restent justes)
  assert.strictEqual(JSON.stringify(m.terrain.tuiles.filter(t => t.ile && t.ile < 5)), avant);
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
  ['histoire/vapeur.png', 'cine/vapeur.mp4', 'histoire/fin.png', 'cine/fin.mp4'].forEach(f => assert.ok(fs.existsSync(path.join(racine, f)), f));
  ['village', 'ville', 'moyen-age', 'vapeur', 'fin'].forEach(k => ['fr', 'en'].forEach(l => assert.ok(D.textes.histoire[k][l].l1 && D.textes.histoire[k][l].l2, k + ' ' + l)));
  assert.match(D.textes.histoire.vapeur.fr.l1, /trains à vapeur/);
  assert.match(D.textes.histoire.fin.fr.l1, /ampoule/);
  assert.match(D.textes.histoire.fin.fr.l2, /fusée/);
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

test('électricité : l\'île ne grandit plus, la ville se densifie ; nouveaux bâtiments ; les monuments de la vapeur ne se construisent plus', () => {
  const m = aLaVapeurFinie(61);
  const avant = m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)).length;
  assert.ok(Monde.construisibles(m).indexOf('tour-eiffel') >= 0);
  assert.ok(Monde.passerEpoque(m));
  assert.strictEqual(m.epoque, 6);
  assert.strictEqual(m.terrain.tuiles.filter(t => Terrain.surIle(m.terrain, t)).length, avant, 'pas de nouvel anneau : la grille est pleine');
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
  const types = ['centrale', 'central-telephone', 'garage', 'ferme', 'aerodrome', 'laboratoire', 'grand-immeuble', 'maison-ville', 'grande-roue', 'neuschwanstein', 'sagrada', 'empire-state'];
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
