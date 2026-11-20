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
    raised: (info) => info.level === 2 && info.callers.length === 0,
    steal: (info, spot) => info.level === 1 && info.limpers.length === 0 && ['CO', 'BTN', 'SB'].includes(spot.hero.seat),
    squeeze: (info) => info.level === 2 && info.callers.length >= 1,
    blinds: (info, spot) => info.level === 2 && info.callers.length === 0 && ['SB', 'BB'].includes(spot.hero.seat),
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
      assert.ok(shape[situation.value](info, spot), at);
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
  assert.ok(BOOK_HANDS.length >= 60);
});

test('a mistake is named even when the spot does not say', () => {
  assert.equal(inferLeak({ correct: ['call'] }, 'fold'), 'tight');
  assert.equal(inferLeak({ correct: ['fold'] }, 'call'), 'loose');
  assert.equal(inferLeak({ correct: ['3bet'] }, 'pass'), 'passive');
  assert.equal(inferLeak({ correct: ['pass'] }, '3bet'), 'wild');
  assert.equal(inferLeak({ correct: ['limp'] }, 'iso'), 'wild');
  assert.equal(inferLeak({ correct: ['no'] }, 'yes'), null);
});

// ---- Squeezing, over-calling, stealing and blind defence

import * as squeeze from '../js/data/squeeze.js';
import * as blinds from '../js/data/blinds.js';
import { adviseSqueeze, CHARTS as SQUEEZE_CHARTS } from '../js/squeeze/model.js';
import { adviseSteal, adviseDefend, nextBlindSum, STEAL_CHARTS, DEFEND_CHARTS } from '../js/blinds/model.js';
import { stealSize } from '../js/sizing.js';

test('a raise and its callers are read off the table', () => {
  const one = readSpot({ hero: { seat: 'BB', hand: 'AQs' }, action: [['BTN', 'raise', 3], ['SB', 'call']] });
  assert.deepEqual(one.callers, ['SB']);
  assert.equal(one.pot, 7);
  assert.equal(one.toCall, 2);
  assert.equal(one.inPosition, false);
  // A re-raise starts the count again.
  assert.deepEqual(readSpot({ hero: { seat: 'CO', hand: 'AA' }, action: [['CO', 'raise', 3], ['BTN', 'call'], ['BB', 'raise', 13]] }).callers, []);
});

test('a squeeze is the 3-bet size plus 3bb a caller', () => {
  const label = (spot) => {
    const size = threeBetSize(spot);
    return size.options.find((o) => o.id === size.correct).label;
  };
  assert.equal(label({ hero: { seat: 'BTN', hand: 'AA' }, action: [['UTG', 'raise', 3], ['MP', 'call']] }), '13.5bb');
  assert.equal(label({ hero: { seat: 'BB', hand: 'AA' }, action: [['BTN', 'raise', 3], ['SB', 'call']] }), '12bb');
  assert.equal(label({ hero: { seat: 'BTN', hand: 'AA' }, action: [['UTG', 'raise', 3], ['MP', 'call'], ['CO', 'call']] }), '16.5bb');
  // A min-raise is sized as if it had been 3bb.
  assert.equal(label({ players: 4, hero: { seat: 'SB', hand: 'TT' }, sizeBase: 3, action: [['CO', 'raise', 2], ['BTN', 'call']] }), '12bb');
  // With nobody in between it is still a plain 3-bet.
  assert.equal(label({ hero: { seat: 'BTN', hand: 'AA' }, action: [['CO', 'raise', 3]] }), '10.5bb');
});

test('the squeeze and blind charts hold the hands the book shades', () => {
  const count = (tokens) => new Set(tokens.flatMap(expand)).size;
  assert.equal(count(squeeze.OVER_CALL), 21);
  assert.equal(count(squeeze.OVER_CALL_OR_3BET), 6);
  assert.equal(count(blinds.PREFER_CALL), 22);
  assert.equal(count(blinds.DEFENCE.value3bet), 9);
  assert.equal(count(blinds.DEFENCE.SB.call), 17);
  assert.equal(count(blinds.DEFENCE.BB.call), 50);
  // The wider stealing ranges come to the percentages printed over the charts.
  for (const chart of STEAL_CHARTS) assert.equal(chart.pct.toFixed(2), blinds.MODERATE_PCT[chart.id].toFixed(2), chart.id);
  assert.equal(STEAL_CHARTS.find((c) => c.id === 'BTN').hands.size, 83);
  assert.deepEqual(DEFEND_CHARTS.map((c) => c.hands.size), [26, 59]);
  assert.equal(SQUEEZE_CHARTS.length, 4);
});

test('the steal and pot-odds tables follow from the arithmetic', () => {
  for (const [size, pct] of blinds.BREAK_EVEN) assert.equal(((size / (size + blinds.STEAL_REWARD)) * 100).toFixed(1), pct.toFixed(1));
  const need = (hero, action) => {
    const info = readSpot({ hero: { seat: hero, hand: 'AA' }, action });
    return (info.toCall / (info.pot + info.toCall)) * 100;
  };
  for (const row of blinds.POT_ODDS) {
    assert.equal(need('SB', [['BTN', 'raise', row.steal]]).toFixed(2), row.sb.toFixed(2));
    assert.equal(need('BB', [['BTN', 'raise', row.steal]]).toFixed(2), row.bbAfterFold.toFixed(2));
    assert.equal(need('BB', [['BTN', 'raise', row.steal], ['SB', 'call']]).toFixed(2), row.bbAfterCall.toFixed(2));
  }
  for (let i = 0; i < 200; i++) {
    const sum = nextBlindSum();
    const ids = sum.options.map((o) => o.id);
    assert.ok(ids.includes(sum.correct[0]) && new Set(ids).size === ids.length, sum.key);
  }
});

test('the book decides a raise and a caller', () => {
  const play = (hero, hand, action, reads) => adviseSqueeze({ hero: { seat: hero, hand }, action, reads }).correct;
  const utg = [['UTG', 'raise', 3], ['MP', 'call']];
  const btn = [['BTN', 'raise', 3], ['SB', 'call']];
  assert.deepEqual(play('BTN', 'KK', utg), ['3bet']);
  assert.deepEqual(play('BTN', 'JJ', utg), ['call']);
  assert.deepEqual(play('BB', 'JJ', btn), ['3bet']);
  assert.deepEqual(play('BTN', 'QQ', utg), ['3bet', 'call']);
  assert.deepEqual(play('BB', 'AJo', btn), ['3bet', 'fold']);
  assert.deepEqual(play('BTN', '98s', utg), ['call']);
  assert.deepEqual(play('BTN', '98s', utg, { BB: 'aggro3b' }), ['fold']);
  assert.deepEqual(play('BTN', 'KQo', utg), ['fold']);
  assert.deepEqual(play('BTN', '86s', utg), ['fold']);
  for (const s of squeeze.SPOTS.filter((x) => x.hero && !x.judgement && x.options.includes('3bet'))) {
    assert.deepEqual(adviseSqueeze(s).correct, s.correct, s.id);
  }
});

test('the book decides steals and blind defence', () => {
  const steal = (seat, hand, reads) => adviseSteal({ hero: { seat, hand }, reads }).correct;
  const nits = { SB: 'nit', BB: 'nit' };
  assert.deepEqual(steal('BTN', 'AJo'), ['open']);
  assert.deepEqual(steal('BTN', 'T8o'), ['fold']);
  assert.deepEqual(steal('BTN', 'T8o', nits), ['open']);
  assert.deepEqual(steal('BTN', 'T8o', { SB: 'nit', BB: 'station' }), ['fold']);
  assert.deepEqual(steal('BTN', 'AJo', { BB: 'station' }), ['open']);
  assert.deepEqual(steal('CO', '72o', nits), ['fold']);
  assert.equal(stealSize({ hero: { seat: 'BTN', hand: 'AA' } }, true, '').correct, 'small');

  const defend = (seat, hand) => adviseDefend({ hero: { seat, hand }, action: [['BTN', 'raise', 3]] }).correct;
  assert.deepEqual(defend('SB', 'AQo'), ['3bet']);
  assert.deepEqual(defend('SB', '22'), ['fold']);
  assert.deepEqual(defend('BB', '22'), ['call']);
  assert.deepEqual(defend('SB', 'KTo'), ['call']);
  assert.deepEqual(defend('BB', 'A6o'), ['fold']);
  assert.deepEqual(defend('BB', 'A7o'), ['call']);

  // The written hands agree with the same rules.
  for (const s of blinds.SPOTS.filter((x) => x.hero && x.hero.hand && x.options.every((o) => typeof o === 'string'))) {
    const engine = s.options.includes('open') ? adviseSteal(s) : adviseDefend(s);
    assert.deepEqual(engine.correct, s.correct, s.id);
  }
});

test('a short-stacked limper changes what raises', () => {
  const play = (hand, stack) => adviseLimped({ hero: { seat: 'BTN', hand }, stacks: { MP: stack }, action: [['MP', 'limp']] }).correct;
  assert.deepEqual(play('AJo', 25), ['iso']);
  assert.deepEqual(play('99', 25), ['iso']);
  assert.deepEqual(play('76s', 25), ['limp', 'fold']);
  assert.deepEqual(play('76s', 100), ['iso', 'limp']);
  assert.deepEqual(play('72o', 25), ['fold']);
});

test('the squeeze and blind spots are well formed', () => {
  const check = (spots, lessons) => {
    const ids = new Set();
    for (const s of spots) {
      assert.ok(!ids.has(s.id), s.id);
      ids.add(s.id);
      const options = s.options.map((o) => (typeof o === 'string' ? o : o.id));
      assert.ok(s.correct.length && s.correct.every((id) => options.includes(id)), s.id);
      assert.ok(lessons.some((l) => l.id === s.lesson), s.id);
      assert.ok(s.why && s.title, s.id);
      if (s.hero) readSpot(s);
    }
  };
  check(squeeze.SPOTS, squeeze.LESSONS);
  check(blinds.SPOTS, blinds.LESSONS);
});

// ---- Scores over time

import { rounds, momentum, trendWord, roundNote, sparkSvg, chartSvg } from '../js/trend.js';

const at = (y, m, d, hh = 12, mm = 0) => Math.round(new Date(y, m - 1, d, hh, mm).getTime() / 1000);

test('each round is its own point, so several in a day stay apart', () => {
  const entry = {
    d: { '2026-11-19': [20, 10], '2026-11-20': [50, 38] },
    s: [[at(2026, 11, 20, 9), 20, 12], [at(2026, 11, 20, 13), 20, 16], [at(2026, 11, 20, 21), 10, 10]],
    r: '',
  };
  const r = rounds(entry);
  // The 19th was recorded before rounds were kept: it shows as one whole-day point.
  assert.deepEqual(r.points.map((p) => [p.key, p.n, p.pct, p.wholeDay]), [
    ['2026-11-19', 20, 0.5, true], ['2026-11-20', 20, 0.6, false], ['2026-11-20', 20, 0.8, false], ['2026-11-20', 10, 1, false],
  ]);
  assert.equal(r.total, 70);
  assert.deepEqual(rounds(null), { total: 0, points: [] });
  assert.equal(rounds({ s: [['x', 3, 1], [at(2026, 11, 20), 0, 0]], d: { junk: 'x' } }).points.length, 0);
});

test('short rounds are joined to the next one that day', () => {
  // Three hands of one situation in each of four simulator rounds, then a new day.
  const entry = { s: [[at(2026, 11, 20, 9), 3, 1], [at(2026, 11, 20, 10), 3, 2], [at(2026, 11, 20, 11), 3, 3], [at(2026, 11, 20, 12), 3, 3], [at(2026, 11, 21, 9), 2, 2]] };
  const r = rounds(entry);
  assert.deepEqual(r.points.map((p) => [p.key, p.n, p.parts]), [['2026-11-20', 9, 3], ['2026-11-20', 3, 1], ['2026-11-21', 2, 1]]);
  assert.equal(Math.round(r.points[0].pct * 100), 67);
  // Only the latest rounds are drawn.
  const many = { s: Array.from({ length: 50 }, (_, i) => [at(2026, 11, 1 + Math.floor(i / 2), 9 + (i % 2)), 20, 10]) };
  assert.equal(rounds(many).points.length, 30);
});

test('improvement is the last 25 answers against the 25 before', () => {
  const run = (wrong, right) => '0'.repeat(wrong) + '9'.repeat(right);
  const m = momentum({ r: run(15, 10) + run(5, 20) });
  assert.equal(m.before, 0.4);
  assert.equal(m.now, 0.8);
  assert.equal(Math.round(m.delta * 100), 40);
  assert.deepEqual(trendWord(m.delta), { dir: 'up', short: '40', text: 'Up 40 points' });
  assert.equal(trendWord(-0.1).text, 'Down 10 points');
  assert.equal(trendWord(0.02).dir, 'level');
  // Too few answers to compare.
  assert.equal(momentum({ r: run(3, 6) }).now, null);
  assert.equal(momentum({ r: run(5, 20) }).delta, null);
  assert.equal(trendWord(null), null);
  // A part-right result counts for part.
  assert.equal(Math.round(momentum({ r: '5'.repeat(10) }).now * 100), 56);
});

test('a round is compared with the answers before it', () => {
  const before = '0'.repeat(10) + '9'.repeat(10);
  assert.equal(roundNote({ r: before + '9'.repeat(15) + '0'.repeat(5) }, 20, 15),
    '75% this round: 25 points better than your 20 answers before it (50%).');
  assert.equal(roundNote({ r: before + '0'.repeat(20) }, 20, 10), '50% this round: about the same as your 20 answers before it (50%).');
  assert.equal(roundNote({ r: '9'.repeat(20) }, 20, 20), null);
});

test('the charts draw one mark per round', () => {
  const today = new Date(2026, 10, 20, 22);
  const r = rounds({ s: [[at(2026, 11, 18, 9), 3, 1], [at(2026, 11, 20, 9), 20, 12], [at(2026, 11, 20, 13), 20, 15]] });
  const chart = chartSvg(r, 2, today);
  assert.equal(chart.match(/class="tc-dot/g).length, 3);
  assert.equal(chart.match(/tc-dot--few/g).length, 1);
  assert.equal(chart.match(/class="tc-hit"/g).length, 3);
  assert.equal(chart.match(/class="tc-tick"/g).length, 1);
  assert.ok(/Today \d\d:\d\d.*: 75% of 20/.test(chart) && !chart.includes('NaN'));
  assert.ok(sparkSvg(r).includes('sp-line') && !sparkSvg(r).includes('NaN'));
  assert.equal(sparkSvg(rounds(null)), '');
  assert.ok(!chartSvg(rounds({ s: [[at(2026, 11, 20, 9), 20, 12]] }), 0, today).includes('NaN'));
});

// ---- Walkthroughs and chapters

import { LESSONS as WALKS } from '../js/data/lessons.js';
import { CHAPTERS } from '../js/chapters.js';
import { CHARTS as CALL_CHARTS_BUILT } from '../js/coldcall/model.js';

test('every walkthrough step can be put on the table', () => {
  const ids = new Set();
  for (const lesson of WALKS) {
    assert.ok(!ids.has(lesson.id), lesson.id);
    ids.add(lesson.id);
    assert.ok(lesson.title && lesson.blurb && lesson.practice.route && lesson.steps.length >= 5, lesson.id);
    assert.ok(lesson.steps[0].spot, `${lesson.id}: the first step needs a table`);
    lesson.steps.forEach((step, i) => {
      const at = `${lesson.id} step ${i + 1}`;
      assert.ok(step.head && (step.text || step.ask), at);
      if (step.spot) readSpot(step.spot);
      for (const w of step.whatIf || []) {
        assert.ok(w.label && w.text, at);
        if (w.spot) readSpot(w.spot);
      }
      if (step.ask) {
        const options = step.ask.options.map((o) => o.id);
        assert.ok([].concat(step.ask.correct).every((id) => options.includes(id)) && step.ask.why, at);
      }
      // A step says one thing: no paragraph runs long.
      for (const t of [].concat(step.text || [])) assert.ok(t.length <= 260, `${at}: ${t.length} characters`);
    });
    assert.ok(lesson.steps.at(-1).ask, `${lesson.id}: ends on a question`);
  }
});

test('the plays a walkthrough names are the plays the drills mark right', () => {
  const callPlay = (spot) => {
    const info = readSpot(spot);
    const chart = CALL_CHARTS_BUILT.find((c) => c.id === info.villain);
    const cat = chart.categoryOf(spot.hero.hand);
    return cat === 'value3bet' ? ['3bet'] : cat ? ['call'] : ['fold'];
  };
  const by = {
    open: (spot) => [POS[spot.hero.seat].hands.has(spot.hero.hand) ? 'raise' : 'fold'],
    call: callPlay,
    limp: (spot) => adviseLimped(spot).correct,
    squeeze: (spot) => adviseSqueeze(spot).correct,
    steal: (spot) => adviseSteal(spot).correct,
    defend: (spot) => adviseDefend(spot).correct,
  };
  let checked = 0;
  for (const lesson of WALKS) {
    let spot = null;
    lesson.steps.forEach((step, i) => {
      spot = step.spot || spot;
      const cases = [[step.expect, spot], ...(step.whatIf || []).map((w) => [w.expect, w.spot || spot])];
      for (const [expect, where] of cases) {
        if (!expect) continue;
        assert.ok(by[expect.by](where).includes(expect.play), `${lesson.id} step ${i + 1}: ${where.hero.hand} should ${expect.play}`);
        checked += 1;
      }
    });
  }
  assert.ok(checked >= 40, `only ${checked} plays checked`);
});

test('every chapter has lessons, drills and somewhere to go', () => {
  const taught = new Set();
  for (const c of CHAPTERS) {
    assert.ok(c.lessons.length >= 1 && c.drills.length >= 1 && c.blurb, c.id);
    for (const l of c.lessons) taught.add(l.id);
    for (const l of c.lessons) assert.ok([...c.drills.map((d) => d.route), 'sizes'].includes(l.practice.route), `${l.id} practises ${l.practice.route}`);
  }
  assert.equal(taught.size, WALKS.length);
});
