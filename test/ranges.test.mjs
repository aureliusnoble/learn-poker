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

// ---- The table simulator and the tutorial data

import { readSpot } from '../js/table.js';
import { makeChart } from '../js/charts.js';
import * as threebet from '../js/data/threebet.js';
import * as coldcall from '../js/data/coldcall.js';

test('the table plays a spot out: folds, pot and price', () => {
  const open = readSpot({ hero: { seat: 'CO', hand: 'ATs' }, action: [['MP', 'raise', 3]] });
  assert.equal(open.pot, 4.5);
  assert.equal(open.toCall, 3);
  assert.equal(open.level, 2);
  assert.equal(open.behind, 3);
  const last = open.frames.at(-1).seats;
  assert.deepEqual([last.UTG.status, last.MP.status, last.CO.status, last.BTN.status], ['folded', 'raised', 'hero', 'toact']);

  // The hero opens, the button 3-bets, and the blinds get out of the way.
  const threeBet = readSpot({ hero: { seat: 'CO', hand: '33', stack: 89 }, stacks: { BTN: 89 }, action: [['CO', 'raise', 3], ['BTN', 'raise', 10]] });
  assert.equal(threeBet.toCall, 7);
  assert.equal(threeBet.pot, 14.5);
  assert.equal(threeBet.level, 3);
  assert.equal(threeBet.effective, 89);
  assert.equal(threeBet.behind, 0);

  // From the big blind, the price is the raise less the blind already posted.
  const blind = readSpot({ hero: { seat: 'BB', hand: '22' }, stacks: { CO: 168 }, action: [['CO', 'raise', 4]] });
  assert.equal(blind.toCall, 3);
  assert.equal(blind.effective, 100);

  const first = readSpot({ hero: { seat: 'UTG', hand: 'AA' } });
  assert.equal(first.level, 1);
  assert.equal(first.pot, 1.5);
  assert.equal(first.behind, 5);
});

test('the calling charts match the percentages printed in the book', () => {
  for (const c of coldcall.CALL_CHARTS) {
    const chart = makeChart({ id: c.id, categories: [{ id: 'gap', tokens: c.gap }, { id: 'weaker', tokens: c.weaker }] });
    assert.equal(chart.pct.toFixed(2), c.callPct.toFixed(2), c.id);
    assert.equal(chart.category('gap').pct.toFixed(2), c.gapPct.toFixed(2), c.id);
    const calls = new Set([...c.gap, ...c.weaker].flatMap(expand));
    for (const hand of c.value3bet.flatMap(expand)) assert.ok(!calls.has(hand), `${hand} is both a call and a 3-bet vs ${c.id}`);
    for (const hand of c.optional3bet.flatMap(expand)) assert.ok(calls.has(hand), `${hand} is optional but not a call vs ${c.id}`);
  }
});

test('every practice spot is answerable and points at a real lesson', () => {
  const check = (spots, lessons) => {
    const ids = new Set();
    for (const s of spots) {
      assert.ok(!ids.has(s.id), `duplicate ${s.id}`);
      ids.add(s.id);
      const options = s.options.map((o) => (typeof o === 'string' ? o : o.id));
      assert.ok(s.correct.length && s.correct.every((id) => options.includes(id)), `${s.id}: answer not among the options`);
      assert.ok(lessons.some((l) => l.id === s.lesson), `${s.id}: unknown lesson ${s.lesson}`);
      assert.ok(s.why && s.title, `${s.id}: needs a title and a reason`);
      if (s.hero) readSpot(s);
    }
  };
  check(threebet.SPOTS, threebet.LESSONS);
  check([...coldcall.CALL_SPOTS, ...coldcall.SET_SPOTS], coldcall.LESSONS);
  for (const chart of threebet.CHARTS) assert.ok(makeChart(chart).hands.size > 0);
});

// ---- Table sizes and bet sizes

import { threeBetSize, fourBetSize } from '../js/sizing.js';

test('short-handed tables drop the earliest seats', () => {
  const five = readSpot({ players: 5, hero: { seat: 'BTN', hand: 'AA' }, action: [['MP', 'raise', 3]] });
  assert.deepEqual(five.order, ['MP', 'CO', 'BTN', 'SB', 'BB']);
  assert.equal(five.inPosition, true);
  assert.throws(() => readSpot({ players: 4, hero: { seat: 'UTG', hand: 'AA' } }));

  // A freshly dealt hand: nobody has folded yet, wherever the hero sits.
  const dealt = readSpot({ players: 6, hero: { seat: 'BTN' }, dealt: true });
  assert.equal(Object.values(dealt.frames.at(-1).seats).filter((s) => s.status === 'folded').length, 0);

  assert.equal(readSpot({ players: 4, hero: { seat: 'SB', hand: 'KK' }, action: [['BTN', 'raise', 2.5]] }).inPosition, false);
});

test('raise sizes follow position', () => {
  const label = (size) => size.options.find((o) => o.id === size.correct).label;
  assert.equal(label(threeBetSize({ hero: { seat: 'BTN', hand: 'AA' }, action: [['CO', 'raise', 3]] })), '10.5bb');
  assert.equal(label(threeBetSize({ hero: { seat: 'BB', hand: 'AA' }, action: [['CO', 'raise', 3]] })), '9bb');
  assert.equal(label(threeBetSize({ hero: { seat: 'SB', hand: 'AA' }, action: [['BTN', 'raise', 2.5]] })), '7.5bb');
  assert.equal(label(fourBetSize({ hero: { seat: 'BTN', hand: 'AA' }, action: [['BTN', 'raise', 3], ['BB', 'raise', 10]] })), '20bb to 22bb');
  assert.equal(label(fourBetSize({ hero: { seat: 'CO', hand: 'AA' }, action: [['CO', 'raise', 3], ['BTN', 'raise', 10]] })), '22bb to 25bb');
});

// ---- Limpers

import * as limpers from '../js/data/limpers.js';
import { adviseLimped, nextLimpSpot, LIMP_CHART } from '../js/limp/model.js';
import { isoSize } from '../js/sizing.js';

test('limps are read off the table', () => {
  const two = readSpot({ hero: { seat: 'BTN', hand: '44' }, action: [['UTG', 'limp'], ['MP', 'limp']] });
  assert.deepEqual(two.limpers, ['UTG', 'MP']);
  assert.equal(two.pot, 3.5);
  assert.equal(two.toCall, 1);
  assert.equal(two.inPosition, true);
  assert.equal(readSpot({ hero: { seat: 'SB', hand: '44' }, action: [['BTN', 'limp']] }).inPosition, false);
  assert.equal(readSpot({ hero: { seat: 'BB', hand: '44' }, action: [['CO', 'limp']] }).toCall, 0);
});

test('isolation raises are 3bb, plus 1bb a limper, plus 1bb out of position', () => {
  const size = (hero, ...seats) => {
    const s = isoSize({ hero: { seat: hero, hand: 'AA' }, action: seats.map((x) => [x, 'limp']) });
    return s.options.find((o) => o.id === s.correct).label;
  };
  assert.deepEqual([size('BTN', 'UTG'), size('BTN', 'UTG', 'MP'), size('BTN', 'UTG', 'MP', 'CO')], ['4bb', '5bb', '6bb']);
  assert.deepEqual([size('SB', 'CO'), size('SB', 'MP', 'CO'), size('BB', 'MP', 'CO', 'BTN')], ['5bb', '6bb', '7bb']);
});

test('the limper charts hold the hands the book shades', () => {
  const count = (tokens) => new Set(tokens.flatMap(expand)).size;
  assert.equal(count(limpers.ISO.default), 18);
  assert.equal(count(limpers.ISO.optional), 29);
  assert.equal(count(limpers.OVER_LIMP), 27);
  const [tight, loose] = limpers.LIMPER_PROFILES;
  assert.deepEqual([count(tight.raise), count(tight.limp)], [12, 13]);
  assert.deepEqual([count(loose.raise), count(loose.limp)], [15, 81]);
  assert.equal(LIMP_CHART.categoryOf('65s'), 'weaker');
  assert.equal(LIMP_CHART.categoryOf('JTs'), 'merged');
});

test('the book decides hands behind a limper', () => {
  const play = (spot) => adviseLimped(spot).correct;
  const one = (hand, reads) => ({ hero: { seat: 'BTN', hand }, reads, action: [['UTG', 'limp']] });
  assert.deepEqual(play(one('AJo')), ['iso']);
  assert.deepEqual(play(one('K8o')), ['fold']);
  assert.deepEqual(play(one('65s')), ['iso', 'limp']);
  assert.deepEqual(play(one('65s', { UTG: 'station' })), ['limp']);
  assert.deepEqual(play(one('KTs', { UTG: 'weaktight' })), ['iso']);
  assert.deepEqual(play(one('76s', { SB: 'isoraiser' })), ['iso', 'fold']);
  assert.deepEqual(play({ hero: { seat: 'BTN', hand: '44' }, action: [['UTG', 'limp'], ['MP', 'limp']] }), ['limp']);
  assert.deepEqual(play({ hero: { seat: 'SB', hand: 'AQo' }, action: [['MP', 'limp'], ['CO', 'limp'], ['BTN', 'limp']] }), ['iso']);
  assert.deepEqual(play({ hero: { seat: 'BB', hand: '72o' }, action: [['CO', 'limp']] }), ['check']);

  // The written spots agree with the same rules.
  for (const s of limpers.SPOTS.filter((x) => x.hero && x.options.includes('iso'))) {
    assert.deepEqual([...play(s)].sort(), [...s.correct].sort(), s.id);
  }
  // And generated ones are always answerable.
  for (let i = 0; i < 300; i++) {
    const s = nextLimpSpot({ recent: [] });
    assert.ok(s.correct.every((id) => s.options.includes(id)), JSON.stringify(s.hero));
    assert.ok(readSpot(s).limpers.length >= 1);
  }
});

test('the limper spots are well formed', () => {
  const ids = new Set();
  for (const s of limpers.SPOTS) {
    assert.ok(!ids.has(s.id));
    ids.add(s.id);
    const options = s.options.map((o) => (typeof o === 'string' ? o : o.id));
    assert.ok(s.correct.length && s.correct.every((id) => options.includes(id)), s.id);
    assert.ok(limpers.LESSONS.some((l) => l.id === s.lesson), s.id);
    if (s.hero) readSpot(s);
  }
});

// ---- The pre-flop simulator

import { SITUATIONS, BOOK_HANDS } from '../js/play.js';
import { LEAKS } from '../js/drill.js';
import { inferLeak } from '../js/spotdrill.js';

test('every simulator situation deals hands the book can mark', () => {
  const shape = {
    open: (info) => info.level === 1 && info.limpers.length === 0,
    limped: (info) => info.level === 1 && info.limpers.length >= 1,
    raised: (info) => info.level === 2,
    threebet: (info) => info.level === 3,
    fourbet: (info) => info.level === 4,
    book: () => true,
  };
  for (const situation of SITUATIONS) {
    const seen = new Set();
    for (let i = 0; i < 400; i++) {
      const spot = situation.make({ recent: [] });
      const info = readSpot(spot);
      const at = `${situation.value} ${JSON.stringify(spot.hero)}`;
      assert.ok(shape[situation.value](info), at);
      assert.ok(spot.correct.length && spot.correct.every((id) => spot.options.includes(id)), at);
      assert.ok(spot.why && spot.topic && spot.bucket && (spot.key || spot.id), at);
      for (const [wrong, leak] of Object.entries(spot.leaks || {})) {
        assert.ok(!spot.correct.includes(wrong), `${at}: ${wrong} is both right and a leak`);
        assert.ok(LEAKS[leak], leak);
      }
      if (spot.size) {
        assert.ok(spot.correct.includes(spot.size.when), at);
        assert.ok(spot.size.options.some((o) => o.id === spot.size.correct), at);
      }
      seen.add(spot.key || spot.id);
    }
    assert.ok(seen.size >= 8, `${situation.value} only dealt ${seen.size} different hands`);
  }
  assert.ok(BOOK_HANDS.length >= 40);
});

test('a mistake is named even when the spot does not say', () => {
  assert.equal(inferLeak({ correct: ['call'] }, 'fold'), 'tight');
  assert.equal(inferLeak({ correct: ['fold'] }, 'call'), 'loose');
  assert.equal(inferLeak({ correct: ['3bet'] }, 'pass'), 'passive');
  assert.equal(inferLeak({ correct: ['pass'] }, '3bet'), 'wild');
  assert.equal(inferLeak({ correct: ['limp'] }, 'iso'), 'wild');
  assert.equal(inferLeak({ correct: ['no'] }, 'yes'), null);
});
