// The pre-flop simulator and the other game drills that cut across the
// tutorials: finding your seat, sizing a raise, and quick-fire facts.
import { h, pct, fill, weightedPick } from './dom.js';
import { shell, meter } from './components.js';
import { explain, inRange } from './ranges.js';
import { POSITIONS as OPEN_RANGES, FACTS as OPEN_FACTS } from './data/preflop-ranges.js';
import { FACTS as THREEBET_FACTS, SPOTS as TB_SPOTS } from './data/threebet.js';
import { FACTS as CALL_FACTS, CALL_SPOTS, SET_SPOTS, CRITERIA, SET_CRITERIA, SET_MINING } from './data/coldcall.js';
import { FACTS as LIMP_FACTS, SPOTS as LIMP_SPOTS } from './data/limpers.js';
import { makeChart } from './charts.js';
import { pickHand } from './preflop/model.js';
import { nextCallSpot } from './coldcall/model.js';
import { nextLimpSpot } from './limp/model.js';
import { SEATS_BY_COUNT, TABLE_SEATS, tablesWith, hasPosition, bb } from './table.js';
import { threeBetSize, fourBetSize, isoSize } from './sizing.js';
import { spotDrill, deckOf } from './spotdrill.js';
import { record, stat, bucketOf, resetProgress, dayStreak } from './store.js';
import { boxWeight, LEAKS } from './drill.js';
import { go } from './nav.js';

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const shuffle = (list) => list.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

// Each seat's opening range as a chart, so feedback can show it with the hand marked.
const byId = Object.fromEntries(OPEN_RANGES.map((p) => [p.id, p]));
const OPEN_CHARTS = Object.fromEntries(OPEN_RANGES.map((p) => {
  const src = p.sameAs ? byId[p.sameAs] : p;
  return [p.id, makeChart({
    id: p.id,
    name: p.id,
    title: `${p.name} opening range`,
    categories: [{ id: 'value', label: 'Open', tokens: [...src.pairs, ...src.suited, ...src.offsuit] }],
  })];
}));

// ---- The situations the simulator deals

/** Everyone before you folds: open or fold. */
function openSpot(round) {
  const n = pick([6, 6, 5, 4]);
  const { seat, hand } = pickHand(SEATS_BY_COUNT[n].filter((s) => s !== 'BB'), round.recent);
  const info = explain(seat, hand);
  return {
    topic: 'open',
    bucket: 'hands',
    key: `${seat}:${hand}`,
    title: 'Folded to you',
    players: n,
    hero: { seat, hand },
    options: ['fold', 'raise'],
    correct: [info.inRange ? 'raise' : 'fold'],
    leaks: info.inRange ? { fold: 'tight' } : { raise: 'loose' },
    why: info.rule,
    lens: { chart: OPEN_CHARTS[seat], hand },
    quick: true,
  };
}

const defaultVsRaise = nextCallSpot(() => 'ALL', () => 0);

/**
 * A raise in front of you. Now and then the raiser is short-stacked while you
 * hold a small pair, and the 15-to-1 rule turns the usual call into a fold.
 */
function facingRaise(round) {
  const spot = defaultVsRaise(round);
  const hand = spot.hero.hand;
  if (hand.length !== 2 || spot.lens.chart.categoryOf(hand) !== 'weaker' || Math.random() > 0.4) return spot;
  const opener = spot.action[0][0];
  const call = spot.action[0][2];
  const effective = pick([15, 18, 22, 25, 28]);
  return {
    ...spot,
    bucket: 'sets',
    key: `short:${hand}`,
    title: 'A short stack raises',
    stacks: { [opener]: effective },
    correct: ['fold'],
    leaks: { call: 'loose', '3bet': 'loose' },
    why: `${hand} calls a raise to hit a set, and the most you can win here is ${bb(effective)}. A ${bb(call)} call needs ${bb(call * SET_MINING.ruleMultiple)} by the 15-to-1 rule.`,
    math: { call, effective },
    lens: null,
    size: null,
  };
}

// Hands the book names as behind a strong 3-betting range.
const BEHIND = ['QJs', 'KQs', 'KQo', 'AJs', 'AJo', 'KJs', 'ATs', 'QTs', 'JTs'];
const VS_STRONG = [['AA', '4bet'], ['KK', '4bet'], ...BEHIND.map((hand) => [hand, 'fold'])];
const VS_WIDE = [['AA', '4bet'], ['KK', '4bet'], ['QQ', '4bet'], ['JJ', '4bet'], ['KQs', 'call'], ['KQo', 'call'], ['AJs', 'call'], ['AJo', 'call']];
const F3_LEAKS = {
  fold: { call: 'loose', '4bet': 'loose' },
  call: { fold: 'tight', '4bet': 'wild' },
  '4bet': { fold: 'tight', call: 'passive' },
};

/** You opened and were 3-bet, by a player whose 3-betting you have a read on. */
function facingThreeBet(round) {
  const strong = Math.random() < 0.5;
  const seat = pick(['MP', 'CO', 'CO', 'BTN', 'BTN']);
  const players = pick(tablesWith(seat));
  const order = SEATS_BY_COUNT[players];
  const villain = pick(order.slice(order.indexOf(seat) + 1));
  const key = (hand) => `f3:${strong ? 'strong' : 'wide'}:${hand}`;
  const pool = (strong ? VS_STRONG : VS_WIDE).filter(([hand]) => inRange(seat, hand));
  const fresh = pool.filter(([hand]) => !round.recent.includes(key(hand)));
  const [hand, play] = weightedPick(fresh.length ? fresh : pool, ([x]) => boxWeight(stat('threebet', 'spots', key(x))));
  const kq = hand[0] === 'K' ? 'KQ' : 'AJ';
  const why = strong
    ? (play === '4bet'
      ? `${hand} is ahead of QQ+ and AKs. Against strong hands only, a hand that is ahead 4-bets for value.`
      : `${hand} is behind QQ+ and AKs. Against strong hands only, a hand that is behind folds.`)
    : (play === 'call'
      ? `Their 3-bets include bluffs, so ${kq} has an equity edge over the range and becomes a call.`
      : hand === 'AA' || hand === 'KK'
        ? 'KK+ is the core of the value 4-betting range.'
        : `Against a wide 3-betting range with bluffs in it, ${hand} is ahead and becomes a value 4-bet.`);
  const spot = {
    topic: 'threebet',
    bucket: 'spots',
    key: key(hand),
    title: strong ? 'A 3-bet from a tight player' : 'A 3-bet from an aggressive player',
    players,
    hero: { seat, hand },
    reads: { [villain]: strong ? 'nit' : 'aggro3b' },
    notes: strong ? { [villain]: '3-bets only QQ+ and AKs' } : undefined,
    // They size it the way the book does: 3.5 times with position on you, 3 times without.
    action: [[seat, 'raise', 3], [villain, 'raise', hasPosition(villain, seat) ? 10.5 : 9]],
    options: ['fold', 'call', '4bet'],
    correct: [play],
    leaks: F3_LEAKS[play],
    why,
    quick: true,
  };
  if (play === '4bet') spot.size = fourBetSize(spot);
  return spot;
}

/** You 3-bet with a big pair and they 4-bet. What their 4-bets look like decides it. */
function facingFourBet(round) {
  const tight = Math.random() < 0.5;
  const players = pick([6, 5, 4]);
  const seat = pick(['BTN', 'BTN', 'SB', 'BB']);
  const key = (hand) => `f4:${tight ? 'tight' : 'light'}:${hand}`;
  const pool = ['AA', 'KK', 'QQ', 'JJ'];
  const fresh = pool.filter((hand) => !round.recent.includes(key(hand)));
  const hand = weightedPick(fresh.length ? fresh : pool, (x) => boxWeight(stat('threebet', 'spots', key(x))));
  const premium = hand === 'AA' || hand === 'KK';
  const fold = tight && !premium;
  const inPosition = seat === 'BTN';
  return {
    topic: 'threebet',
    bucket: 'spots',
    key: key(hand),
    title: tight ? 'A 4-bet from a tight player' : 'A 4-bet from a bluffer',
    players,
    hero: { seat, hand },
    reads: { CO: tight ? 'nit' : 'lag' },
    notes: { CO: tight ? 'Only 4-bets KK+' : '4-bets light, bluffs included' },
    // Everyone sizes by the book: you 3-bet 3.5 times in position and 3 times out, and they answer in kind.
    action: [['CO', 'raise', 3], [seat, 'raise', inPosition ? 10.5 : 9], ['CO', 'raise', inPosition ? 24 : 19]],
    options: ['fold', 'call', 'jam'],
    correct: fold ? ['fold'] : ['call', 'jam'],
    leaks: fold ? { call: 'loose', jam: 'loose' } : { fold: 'tight' },
    why: fold
      ? `Against a range of KK+, ${hand} is crushed. This is very common at the lowest stakes: fold JJ and QQ unless stacks are deep.`
      : premium
        ? `${hand} is at the top of your range and is happy to get all the money in. Call or go all-in.`
        : `Their 4-bets include bluffs, so ${hand} is too strong to fold. Call or go all-in.`,
    quick: true,
  };
}

// The book's own practice hands, and the hands written from its rules, each
// recorded under the tutorial it comes from.
const plain = (s) => s.hero && s.hero.hand && s.options.every((o) => typeof o === 'string');
export const BOOK_HANDS = [
  ...CALL_SPOTS.map((s) => ({ ...s, topic: 'coldcall', bucket: 'spots', criteria: CRITERIA })),
  ...SET_SPOTS.map((s) => ({ ...s, topic: 'coldcall', bucket: 'sets', criteria: SET_CRITERIA })),
  ...LIMP_SPOTS.filter(plain).map((s) => ({ ...s, topic: 'limp', bucket: 'spots' })),
  ...TB_SPOTS.filter(plain).map((s) => ({ ...s, topic: 'threebet', bucket: 'spots' })),
];
const bookDeck = deckOf(BOOK_HANDS, 'coldcall', 'spots');
const SIZERS = { '3bet': threeBetSize, '4bet': fourBetSize, iso: isoSize };

function bookHand(round) {
  const spot = bookDeck(round);
  // A hand whose one right answer is a raise also asks for its size.
  const sizer = spot.correct.length === 1 ? SIZERS[spot.correct[0]] : null;
  return sizer ? { ...spot, size: sizer(spot) } : spot;
}

export const SITUATIONS = [
  { value: 'open', label: 'Open', name: 'Folded to you', make: openSpot, weight: 3 },
  { value: 'limped', label: 'Limp', name: 'Limpers in front', make: nextLimpSpot, weight: 2.5 },
  { value: 'raised', label: 'Raise', name: 'A raise in front', make: facingRaise, weight: 3 },
  { value: 'threebet', label: '3-bet', name: 'They 3-bet you', make: facingThreeBet, weight: 1.5 },
  { value: 'fourbet', label: '4-bet', name: 'They 4-bet you', make: facingFourBet, weight: 0.8 },
  { value: 'book', label: 'Book', name: 'Hands from the book', make: bookHand, weight: 2.2 },
];
let simFilter = 'ALL';

/**
 * The pre-flop simulator: any situation the tutorials cover, dealt at a table
 * of four to six, and marked against the book. Every answer feeds the report.
 */
export function simulator(root) {
  return spotDrill(root, {
    title: 'Pre-flop simulator',
    back: 'home',
    topic: 'open',
    bucket: 'hands',
    total: 20,
    depth: true,
    filter: {
      label: 'Situation',
      options: [{ value: 'ALL', label: 'All' }, ...SITUATIONS.map(({ value, label }) => ({ value, label }))],
      get: () => simFilter,
      set: (v) => { simFilter = v; },
    },
    next: (round) => {
      const situation = SITUATIONS.find((s) => s.value === simFilter) || weightedPick(SITUATIONS, (s) => s.weight);
      return { ...situation.make(round), situation: situation.value };
    },
    onAnswer: (spot, result) => {
      const quiet = { countsToday: false };
      record('sim', 'situations', spot.situation, result.ok, quiet);
      record('sim', 'seats', spot.hero.seat, result.ok, quiet);
      if (result.leak) record('sim', 'leaks', result.leak, false, quiet);
    },
  });
}

/** Where the simulator says you go wrong: by situation, by seat and by kind of mistake. */
export function simReport(root) {
  const main = shell(root, { title: 'Simulator report', back: 'home' });
  let confirming = false;

  const row = (name, st) => h('li', null,
    h('span', { class: 'seatrows__name' }, name),
    meter(st ? st.c / st.n : 0, `${name} correct`),
    h('span', { class: 'seatrows__num' }, st ? pct(st.c / st.n) : '–'),
    h('span', { class: 'seatrows__acc' }, st ? `${st.n} ${st.n === 1 ? 'hand' : 'hands'}` : 'Not played yet'));

  function draw() {
    const situations = bucketOf('sim', 'situations');
    const all = Object.values(situations);
    const n = all.reduce((sum, st) => sum + st.n, 0);
    const c = all.reduce((sum, st) => sum + st.c, 0);
    const leaks = Object.entries(bucketOf('sim', 'leaks')).filter(([id]) => LEAKS[id]).sort((a, b) => b[1].n - a[1].n);
    const worst = SITUATIONS.filter((s) => situations[s.value] && situations[s.value].n >= 5)
      .sort((a, b) => situations[a.value].c / situations[a.value].n - situations[b.value].c / situations[b.value].n)[0];

    fill(main,
      h('section', { class: 'tiles tiles--three' },
        h('div', { class: 'tile' }, h('p', { class: 'tile__label' }, 'Hands'), h('p', { class: 'tile__value' }, String(n))),
        h('div', { class: 'tile' }, h('p', { class: 'tile__label' }, 'By the book'), h('p', { class: 'tile__value' }, n ? pct(c / n) : '–')),
        h('div', { class: 'tile' }, h('p', { class: 'tile__label' }, 'Day streak'), h('p', { class: 'tile__value' }, String(dayStreak())))),
      n ? null : h('p', { class: 'note' }, 'Nothing recorded yet. Play the simulator and this page shows where you leave the book.'),

      h('section', { class: 'block' },
        h('h2', { class: 'h2' }, 'By situation'),
        h('ul', { class: 'seatrows seatrows--wide' }, SITUATIONS.map((s) => row(s.name, situations[s.value]))),
        worst && situations[worst.value].c < situations[worst.value].n
          ? h('button', { type: 'button', class: 'btn btn--primary btn--wide', onclick: () => { simFilter = worst.value; go('play'); } },
            `Practise: ${worst.name.toLowerCase()}`)
          : null),

      h('section', { class: 'block' },
        h('h2', { class: 'h2' }, 'Your leaks'),
        leaks.length
          ? h('ul', { class: 'leaks' }, leaks.map(([id, st]) => h('li', null,
            h('span', { class: 'leaks__name' }, LEAKS[id].name, h('span', { class: 'pill pill--missed' }, `${st.n} ${st.n === 1 ? 'time' : 'times'}`)),
            h('span', { class: 'leaks__tip' }, LEAKS[id].tip))))
          : h('p', { class: 'hint' }, 'Each mistake in the simulator is named here: too loose, too tight, too passive, overplayed, wrong size.')),

      h('section', { class: 'block' },
        h('h2', { class: 'h2' }, 'By seat'),
        h('ul', { class: 'seatrows' }, TABLE_SEATS.map((seat) => row(seat, stat('sim', 'seats', seat))))),

      h('section', { class: 'block block--reset' },
        confirming
          ? h('div', { class: 'confirm' },
            h('p', null, 'Erase the simulator report? Progress in the tutorials is kept.'),
            h('div', { class: 'actions' },
              h('button', { type: 'button', class: 'btn btn--quiet', onclick: () => { confirming = false; draw(); } }, 'Keep it'),
              h('button', { type: 'button', class: 'btn btn--danger', onclick: () => { resetProgress('sim'); confirming = false; draw(); } }, 'Erase')))
          : h('button', { type: 'button', class: 'linkbtn', onclick: () => { confirming = true; draw(); } }, 'Reset the simulator report')),
    );
  }
  draw();
}

// ---- Find your seat

const SEAT_CLUE = {
  BTN: 'You have the dealer button.',
  SB: 'You are the first seat after the button: the small blind.',
  BB: 'You are two seats after the button: the big blind.',
  CO: 'You are one seat before the button: the cutoff.',
  MP: 'You are two seats before the button: middle position.',
  UTG: 'You are three seats before the button and first to act: under the gun.',
};
let seatPlayers = 0; // 0 means any table size

function seatSpot() {
  const n = seatPlayers || pick([6, 5, 4]);
  const seats = SEATS_BY_COUNT[n];
  const seat = pick(seats);
  return {
    key: `${n}:${seat}`,
    title: `${n} players`,
    players: n,
    hero: { seat },
    dealt: true,
    hideSeats: true,
    question: 'Which seat are you in?',
    options: seats.map((s) => ({ id: s, label: s })),
    correct: [seat],
    leaks: Object.fromEntries(seats.filter((s) => s !== seat).map((s) => [s, 'seat'])),
    why: `${SEAT_CLUE[seat]} At a ${n}-handed table the seats are ${seats.join(', ')}.`,
    quick: true,
  };
}

export function seatDrill(root) {
  return spotDrill(root, {
    title: 'Find your seat',
    back: 'home',
    topic: 'table',
    bucket: 'seats',
    total: 12,
    filter: {
      label: 'Players at the table',
      options: [{ value: 0, label: 'Any' }, { value: 6, label: '6' }, { value: 5, label: '5' }, { value: 4, label: '4' }],
      get: () => seatPlayers,
      set: (v) => { seatPlayers = v; },
    },
    next: seatSpot,
  });
}

// ---- Size the raise

function asSizeSpot(spot, size, title, question) {
  return {
    ...spot,
    key: size.key,
    title,
    question,
    options: size.options,
    correct: [size.correct],
    leaks: Object.fromEntries(size.options.filter((o) => o.id !== size.correct).map((o) => [o.id, 'size'])),
    why: size.why,
    quick: true,
  };
}

function sizeSpot() {
  const premium = pick(['AA', 'KK', 'AKs']);
  const kind = pick(['3bet', '3bet', '3bet', '4bet', '4bet', 'iso', 'iso', 'iso']);
  if (kind === 'iso') {
    // Over limpers: in position from the button, out of position from the blinds.
    const players = pick([6, 6, 5]);
    const early = SEATS_BY_COUNT[players].filter((s) => !['BTN', 'SB', 'BB'].includes(s));
    const limpers = early.slice(0, pick([1, 2, 3]));
    const spot = { players, hero: { seat: pick(['BTN', 'SB', 'BB']), hand: premium }, action: limpers.map((s) => [s, 'limp']) };
    return asSizeSpot(spot, isoSize(spot), `A raise over ${limpers.length === 1 ? 'a limper' : `${limpers.length} limpers`}`, 'You are raising the limpers. How big?');
  }
  const inPosition = Math.random() < 0.5;
  if (kind === '3bet') {
    // In position from the button, out of position from the blinds.
    const opener = inPosition ? pick(['MP', 'CO']) : pick(['CO', 'BTN']);
    const open = pick([2, 2.5, 3, 4]);
    const spot = { players: opener === 'MP' ? pick([6, 5]) : pick([6, 5, 4]), hero: { seat: inPosition ? 'BTN' : pick(['SB', 'BB']), hand: premium }, action: [[opener, 'raise', open]] };
    const size = threeBetSize(spot);
    return asSizeSpot(spot, { ...size, key: `${size.key}:${open}` }, `3-bet over a ${bb(open)} raise`, 'You are 3-betting. How big?');
  }
  // In position when the blinds 3-bet your button open, out of position when the button 3-bets you.
  const hero = inPosition ? 'BTN' : pick(['MP', 'CO']);
  const threeBet = pick([9, 10, 10.5, 12]);
  const spot = { players: hero === 'MP' ? pick([6, 5]) : pick([6, 5, 4]), hero: { seat: hero, hand: premium }, action: [[hero, 'raise', 3], [inPosition ? pick(['SB', 'BB']) : 'BTN', 'raise', threeBet]] };
  return asSizeSpot(spot, fourBetSize(spot), `4-bet over a ${bb(threeBet)} 3-bet`, 'You are 4-betting. How big?');
}

export function sizeDrill(root) {
  return spotDrill(root, {
    title: 'Size the raise',
    back: 'home',
    topic: 'table',
    bucket: 'sizes',
    total: 12,
    next: sizeSpot,
  });
}

// ---- Quick facts

const FACT_SETS = [
  { value: 'ALL', label: 'All' },
  { value: 'open', label: 'Opening', facts: OPEN_FACTS },
  { value: 'limp', label: 'Limpers', facts: LIMP_FACTS },
  { value: 'coldcall', label: 'Calling', facts: CALL_FACTS },
  { value: 'threebet', label: '3-bets', facts: THREEBET_FACTS },
];
export const ALL_FACTS = FACT_SETS.filter((s) => s.facts)
  .flatMap((s) => s.facts.map((f) => ({ ...f, topic: s.value, bucket: 'facts', key: f.id, title: f.q })));
let factSet = 'ALL';

export function factsDrill(root) {
  return spotDrill(root, {
    title: 'Quick facts',
    back: 'home',
    topic: 'open',
    bucket: 'facts',
    total: 10,
    filter: {
      label: 'Subject',
      options: FACT_SETS.map(({ value, label }) => ({ value, label })),
      get: () => factSet,
      set: (v) => { factSet = v; },
    },
    next: (round) => {
      const pool = factSet === 'ALL' ? ALL_FACTS : ALL_FACTS.filter((f) => f.topic === factSet);
      const f = deckOf(pool, 'open', 'facts')(round);
      // The answers come out in a new order each time, so the position is no clue.
      const options = shuffle([{ id: 'a', label: f.a }, ...f.wrong.map((label, i) => ({ id: `w${i}`, label }))]);
      return { ...f, question: f.q, options, correct: ['a'], quick: true };
    },
  });
}
