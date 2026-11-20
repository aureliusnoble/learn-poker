import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  expand, POS, POSITIONS, LADDER, ALL_HANDS, NOTE_ROWS, additions, explain, firstSeat, handAt, cellOf,
} from '../js/ranges.js';

test('shorthand expands the way the notes read', () => {
  assert.deepEqual(expand('66+'), ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66']);
  assert.deepEqual(expand('ATs+'), ['AKs', 'AQs', 'AJs', 'ATs']);
  assert.deepEqual(expand('KQo'), ['KQo']);
  assert.deepEqual(expand('75s+'), ['76s', '75s']);
  assert.throws(() => expand('TAs'));
  assert.throws(() => expand('AKx'));
});

test('the chart has 169 distinct hands and cells round-trip', () => {
  assert.equal(new Set(ALL_HANDS).size, 169);
  for (const hand of ALL_HANDS) assert.equal(handAt(...cellOf(hand)), hand);
});

test('combo percentages match the notes', () => {
  assert.equal(POS.UTG.combos, 130);
  assert.equal(POS.UTG.pct.toFixed(1), '9.8');
  assert.equal(POS.MP.pct.toFixed(1), '12.7');
  assert.equal(POS.CO.pct.toFixed(2), '22.17');
  assert.equal(POS.BTN.combos, 470);
});

test('the small blind opens the cutoff range', () => {
  assert.deepEqual([...POS.SB.hands].sort(), [...POS.CO.hands].sort());
});

test('each range contains the tighter one before it', () => {
  for (let i = 1; i < LADDER.length; i++) {
    for (const hand of POS[LADDER[i - 1]].hands) assert.ok(POS[LADDER[i]].hands.has(hand), `${hand} missing at ${LADDER[i]}`);
  }
  assert.deepEqual(additions('UTG', 'MP'), ['55', 'A9s', 'KTs', 'QJs', 'QTs', 'T9s', 'ATo']);
  assert.equal(firstSeat('JTs'), 0);
  assert.equal(firstSeat('54s'), 3);
  assert.equal(firstSeat('72o'), -1);
});

test('cut-off labels read like the notes', () => {
  const labels = (id) => Object.fromEntries(NOTE_ROWS.map((k) => [k, POS[id].rows[k].label]));
  assert.deepEqual(labels('UTG'), {
    pairs: '66+', As: 'ATs+', Ao: 'AJo+', Ks: 'KJs+', Ko: 'KQo', Qs: null, Qo: null, Js: 'JTs', Jo: null,
    Ts: null, To: null, '9s': null, '9o': null, '8s': null, '7s': null, '6s': null, '5s': null,
  });
  assert.deepEqual(labels('BTN'), {
    pairs: '22+', As: 'A2s+', Ao: 'A2o+', Ks: 'K7s+', Ko: 'K9o+', Qs: 'Q8s+', Qo: 'QTo+', Js: 'J8s+', Jo: 'JTo',
    Ts: 'T8s+', To: 'T9o', '9s': '97s+', '9o': '98o', '8s': '86s+', '7s': '75s+', '6s': '65s', '5s': '54s',
  });
  assert.equal(POS.CO.rows['7s'].label, '76s');
  assert.equal(POS.MP.rows.Ko.label, 'KQo');
});

test('explanations name the deciding rule', () => {
  assert.deepEqual(explain('CO', 'K8s'), {
    inRange: false, rule: 'CO opens K9s+. K8s is one rank below the cut-off.', rowLabel: 'K9s+',
  });
  assert.equal(explain('CO', 'K9s').rule, 'CO opens K9s+. K9s is the lowest one.');
  assert.equal(explain('UTG', 'Q9s').rule, 'UTG opens no suited queens.');
  assert.equal(explain('UTG', 'KJo').rule, "UTG's only offsuit king is KQo. KJo is one rank below the cut-off.");
  assert.equal(explain('UTG', '44').rule, 'UTG opens 66+. 44 is 2 ranks below the cut-off.');
  assert.equal(explain('SB', 'A9o').rule, 'SB opens A9o+. A9o is the lowest one. SB uses the CO range.');
});

test('edge distance marks the hands either side of every cut-off', () => {
  for (const pos of POSITIONS) {
    for (const key of NOTE_ROWS) {
      const { lowest } = pos.rows[key];
      if (lowest) assert.equal(pos.dist.get(lowest), 1, `${pos.id} ${lowest}`);
    }
  }
  assert.equal(POS.UTG.dist.get('55'), 1);
  assert.ok(POS.UTG.dist.get('72o') > 3);
});

test('the service worker precaches every app file', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const sw = readFileSync(root + 'sw.js', 'utf8');
  const walk = (dir) => readdirSync(root + dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
  for (const file of [...walk('js'), ...walk('css')]) assert.ok(sw.includes(`'${file}'`), `${file} is not in sw.js`);
});

test('dash ranges expand', () => {
  assert.deepEqual(expand('44-22'), ['44', '33', '22']);
  assert.deepEqual(expand('A4s-A2s'), ['A4s', 'A3s', 'A2s']);
  assert.deepEqual(expand('22-44'), ['44', '33', '22']);
  assert.deepEqual(expand('JTs-76s'), ['JTs', 'T9s', '98s', '87s', '76s']);
  assert.deepEqual(expand('QQ-99'), ['QQ', 'JJ', 'TT', '99']);
  assert.throws(() => expand('A4s-K2s'));
  assert.throws(() => expand('A4s-A2o'));
});
