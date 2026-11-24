// Les villes (ADR-063) : cinq au plus, leurs noms, le paquet confié à Ludiworld, la compression.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

global.window = global;
require('../src/data.js');
const M = require('../src/monde.js');
const Villes = require('../src/villes.js');

const v = (id) => ({ id, nom: 'Ville ' + id, partie: null, epoque: 1, ms: 0, maj: 0 });

test('le nom d\'une nouvelle ville prend la première lettre libre, et il n\'y en a plus à cinq', () => {
  assert.strictEqual(Villes.MAX, 5);
  assert.strictEqual(Villes.nomLibre([]), 'A');
  assert.strictEqual(Villes.nomLibre([v('A'), v('C')]), 'B');
  assert.strictEqual(Villes.nomLibre(['A', 'B', 'C', 'D', 'E'].map(v)), null);
});

test('on peut créer une ville jusqu\'à quatre, pas à cinq', () => {
  assert.strictEqual(Villes.peutCreer(['A', 'B', 'C', 'D'].map(v)), true);
  assert.strictEqual(Villes.peutCreer(['A', 'B', 'C', 'D', 'E'].map(v)), false);
});

test('une nouvelle ville commence à l\'âge de pierre, sans temps passé', () => {
  const n = Villes.nouvelle([v('A')], 1234);
  assert.deepStrictEqual(n, { id: 'B', nom: 'Ville B', partie: null, epoque: 1, ms: 0, maj: 1234 });
});

test('retirer une ville garde les autres', () => {
  assert.deepStrictEqual(Villes.retirer(['A', 'B', 'C'].map(v), 'B').map((x) => x.id), ['A', 'C']);
});

test('le paquet pour Ludiworld laisse les autres villes de côté s\'il est trop gros', () => {
  const base = { active: 'A', liste: ['A', 'B', 'C', 'D'].map(v), monde: { x: 1 }, ui: {} };
  const gros = Villes.paquet(Object.assign({}, base, { autres: { B: 'x'.repeat(50000), C: 'x'.repeat(50000), D: 'x'.repeat(50000) } }), 100000);
  assert.strictEqual(gros.v, 3);
  assert.strictEqual(gros.autres, undefined);
  assert.strictEqual(gros.active, 'A');
  const petit = Villes.paquet(Object.assign({}, base, { autres: { B: 'x'.repeat(10000), C: 'x'.repeat(10000), D: 'x'.repeat(10000) } }), 100000);
  assert.strictEqual(Object.keys(petit.autres).length, 3);
});

test('une sauvegarde d\'avant les villes devient la Ville A, avec le temps déjà compté', () => {
  const r = Villes.lire({ v: 2, monde: { epoque: 6, t: 3600 }, ui: { voix: true } });
  assert.strictEqual(r.active, 'A');
  assert.strictEqual(r.liste.length, 1);
  assert.strictEqual(r.liste[0].ms, 3600000);
  assert.strictEqual(r.liste[0].epoque, 6);
  assert.deepStrictEqual(r.monde, { epoque: 6, t: 3600 });
  assert.deepStrictEqual(r.autres, {});
});

test('un paquet de villes se relit tel quel, et rien ne donne rien', () => {
  const p = { v: 3, active: 'B', liste: [v('A'), v('B')], monde: { epoque: 2 }, ui: {}, autres: { A: 'zz' } };
  assert.deepStrictEqual(Villes.lire(p), { active: 'B', liste: p.liste, monde: p.monde, ui: p.ui, autres: p.autres });
  assert.strictEqual(Villes.lire(null), null);
  assert.strictEqual(Villes.lire({ v: 1 }), null);
});

// la partie de référence vit dans la factory de Ludiworld, à côté du worktree ; ailleurs, ce test est sauté
const GRANDE = path.join(__dirname, '..', '..', '..', 'direction-artistique', 'tour30-feu-moderne', 'parties', 'moderne-avance.json');
test('une grande ville compressée revient à l\'identique et pèse moins de 25 000 caractères', { skip: !fs.existsSync(GRANDE) && 'partie de référence absente' }, async () => {
  const f = GRANDE;
  const o = JSON.parse(fs.readFileSync(f, 'utf8'));
  const s = JSON.stringify({ v: 2, monde: M.exporterLeger(M.importer(o.monde)), ui: o.ui || {} });
  const z = await Villes.compresser(s);
  assert.ok(typeof z === 'string' && z.length < 25000, 'compressé : ' + (z && z.length));
  assert.strictEqual(await Villes.decompresser(z), s);
});

// Revue finale, constat 1 : une copie venue d'un autre appareil ne doit pas faire disparaître les villes de celui-ci.
const vp = (id, partie) => ({ id, nom: 'Ville ' + id, partie, epoque: 1, ms: 0, maj: 0 });
test('fusion : une ville que l\'autre appareil ne connaît pas est gardée', () => {
  const f = Villes.fusionner({ active: 'B', liste: [vp('A', 'p1'), vp('B', 'p2')] }, { active: 'A', liste: [vp('A', 'p1')] });
  assert.deepStrictEqual(f.liste.map((v) => v.id + v.partie), ['Ap1', 'Bp2']);
  assert.deepStrictEqual(f.places, [{ de: 'B', vers: 'B' }]);
  assert.deepStrictEqual(f.memes, [{ local: 'A', distant: 'A' }]);
  assert.deepStrictEqual(f.restes, []);
});
test('fusion : deux villes différentes avec la même lettre, celle de l\'appareil prend une lettre libre', () => {
  const f = Villes.fusionner({ active: 'A', liste: [vp('A', 'p1')] }, { active: 'A', liste: [vp('A', 'p9')] });
  assert.deepStrictEqual(f.liste.map((v) => v.id + v.partie + v.nom), ['Ap9Ville A', 'Bp1Ville B']);
  assert.deepStrictEqual(f.places, [{ de: 'A', vers: 'B' }]);
});
test('fusion : au-delà de cinq villes, celles de l\'appareil qui ne tiennent pas sont mises de côté, pas perdues', () => {
  const f = Villes.fusionner({ active: 'A', liste: [vp('A', 'p6')] }, { active: 'A', liste: ['A', 'B', 'C', 'D', 'E'].map((x, i) => vp(x, 'p' + i)) });
  assert.strictEqual(f.liste.length, 5);
  assert.deepStrictEqual(f.restes.map((v) => v.partie), ['p6']);
});
