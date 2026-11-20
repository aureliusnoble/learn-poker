// Game drills that cut across the tutorials: whole hands at a table of four to
// six, finding your seat, sizing a raise, and quick-fire facts.
import { POS, explain } from './ranges.js';
import { POSITIONS as OPEN_RANGES, FACTS as OPEN_FACTS } from './data/preflop-ranges.js';
import { FACTS as THREEBET_FACTS } from './data/threebet.js';
import { FACTS as CALL_FACTS } from './data/coldcall.js';
import { makeChart } from './charts.js';
import { pickHand } from './preflop/model.js';
import { nextCallSpot } from './coldcall/model.js';
import { SEATS_BY_COUNT, SEAT_NAMES, bb } from './table.js';
import { threeBetSize, fourBetSize } from './sizing.js';
import { spotDrill, deckOf } from './spotdrill.js';

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

let players = 0; // 0 means any table size
const PLAYER_FILTER = {
  label: 'Players at the table',
  options: [{ value: 0, label: 'Any' }, { value: 6, label: '6' }, { value: 5, label: '5' }, { value: 4, label: '4' }],
  get: () => players,
  set: (v) => { players = v; },
};
const tableSize = () => players || pick([6, 6, 5, 4]);

/** Everyone before you folds: open or fold. */
function openSpot(round) {
  const n = tableSize();
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
    leaks: { raise: 'loose', fold: 'tight' },
    why: info.rule,
    lens: { chart: OPEN_CHARTS[seat], hand },
    quick: true,
  };
}

const facingRaise = nextCallSpot(() => 'ALL', () => players);

/** Whole hands: sometimes it is folded to you, sometimes there is a raise in front. */
export function playHands(root) {
  return spotDrill(root, {
    title: 'Play hands',
    back: 'home',
    topic: 'open',
    bucket: 'hands',
    total: 20,
    filter: PLAYER_FILTER,
    // Four-handed, only the cutoff can raise in front of you, so openings come up more.
    next: (round) => (Math.random() < 0.45 ? openSpot(round) : facingRaise(round)),
  });
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

function seatSpot() {
  const n = players || pick([6, 5, 4]);
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
    filter: PLAYER_FILTER,
    next: seatSpot,
  });
}

// ---- Size the raise

function sizeSpot() {
  const premium = pick(['AA', 'KK', 'AKs']);
  if (Math.random() < 0.7) {
    // A 3-bet: in position from the button, out of position from the blinds.
    const inPosition = Math.random() < 0.5;
    const opener = inPosition ? pick(['MP', 'CO']) : pick(['CO', 'BTN']);
    const hero = inPosition ? 'BTN' : pick(['SB', 'BB']);
    const open = pick([2, 2.5, 3, 4]);
    const spot = { players: opener === 'MP' ? pick([6, 5]) : pick([6, 5, 4]), hero: { seat: hero, hand: premium }, action: [[opener, 'raise', open]] };
    const size = threeBetSize(spot);
    return {
      ...spot,
      key: `3bet:${inPosition ? 'ip' : 'oop'}:${open}`,
      title: `3-bet over a ${bb(open)} raise`,
      question: 'You are 3-betting. How big?',
      options: size.options,
      correct: [size.correct],
      leaks: Object.fromEntries(size.options.filter((o) => o.id !== size.correct).map((o) => [o.id, 'size'])),
      why: size.why,
      quick: true,
    };
  }
  // A 4-bet: in position when the blinds 3-bet your button open, out of position when the button 3-bets you.
  const inPosition = Math.random() < 0.5;
  const hero = inPosition ? 'BTN' : pick(['MP', 'CO']);
  const villain = inPosition ? pick(['SB', 'BB']) : 'BTN';
  const threeBet = pick([9, 10, 10.5, 12]);
  const spot = { players: hero === 'MP' ? pick([6, 5]) : pick([6, 5, 4]), hero: { seat: hero, hand: premium }, action: [[hero, 'raise', 3], [villain, 'raise', threeBet]] };
  const size = fourBetSize(spot);
  return {
    ...spot,
    key: `4bet:${inPosition ? 'ip' : 'oop'}`,
    title: `4-bet over a ${bb(threeBet)} 3-bet`,
    question: 'You are 4-betting. How big?',
    options: size.options,
    correct: [size.correct],
    leaks: Object.fromEntries(size.options.filter((o) => o.id !== size.correct).map((o) => [o.id, 'size'])),
    why: size.why,
    quick: true,
  };
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
  { value: 'threebet', label: '3-bets', facts: THREEBET_FACTS },
  { value: 'coldcall', label: 'Calling', facts: CALL_FACTS },
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

export { SEAT_NAMES };
