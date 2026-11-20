// Range logic: expands the shorthand in data/preflop-ranges.js and answers
// every question the app asks about it. No DOM, so it also runs under Node.
import { POSITIONS as RAW, OPEN_SIZE_BB } from './data/preflop-ranges.js';

export { OPEN_SIZE_BB };
export const RANKS = 'AKQJT98765432';
export const TOTAL_COMBOS = 1326;

const WORDS = {
  A: 'ace', K: 'king', Q: 'queen', J: 'jack', T: 'ten', 9: 'nine', 8: 'eight',
  7: 'seven', 6: 'six', 5: 'five', 4: 'four', 3: 'three', 2: 'two',
};
export const rankWord = (r) => WORDS[r];
export const rankPlural = (r) => (r === '6' ? 'sixes' : WORDS[r] + 's');
const cap = (s) => s[0].toUpperCase() + s.slice(1);

/**
 * '66+'     -> ['AA', ..., '66']
 * 'ATs+'    -> ['AKs', 'AQs', 'AJs', 'ATs']
 * 'KQo'     -> ['KQo']
 * '44-22'   -> ['44', '33', '22']
 * 'A4s-A2s' -> ['A4s', 'A3s', 'A2s']
 */
export function expand(token) {
  const bad = () => new Error(`Bad range token: ${token}`);
  const parse = (t) => {
    const hi = RANKS.indexOf(t[0]);
    const lo = RANKS.indexOf(t[1]);
    const kind = t[2] || 'p';
    if (hi < 0 || lo < 0 || t.length > 3) throw bad();
    if (kind === 'p' ? hi !== lo : hi >= lo || (kind !== 's' && kind !== 'o')) throw bad();
    return { hi, lo, kind };
  };
  const hand = (hi, lo, kind) => RANKS[hi] + RANKS[lo] + (kind === 'p' ? '' : kind);
  const out = [];

  if (token.includes('-')) {
    const [a, b] = token.split('-').map(parse);
    if (a.kind !== b.kind || (a.kind !== 'p' && a.hi !== b.hi)) throw bad();
    const from = Math.min(a.lo, b.lo);
    const to = Math.max(a.lo, b.lo);
    for (let k = from; k <= to; k++) out.push(a.kind === 'p' ? hand(k, k, 'p') : hand(a.hi, k, a.kind));
    return out;
  }

  const plus = token.endsWith('+');
  const { hi, lo, kind } = parse(plus ? token.slice(0, -1) : token);
  if (kind === 'p') for (let k = plus ? 0 : hi; k <= hi; k++) out.push(hand(k, k, 'p'));
  else for (let k = plus ? hi + 1 : lo; k <= lo; k++) out.push(hand(hi, k, kind));
  return out;
}

/** The hand at a cell of the standard 13x13 chart: pairs on the diagonal, suited above, offsuit below. */
export const handAt = (row, col) =>
  row === col ? RANKS[row] + RANKS[col] : row < col ? RANKS[row] + RANKS[col] + 's' : RANKS[col] + RANKS[row] + 'o';

export function cellOf(hand) {
  const a = RANKS.indexOf(hand[0]);
  const b = RANKS.indexOf(hand[1]);
  return hand.length === 2 ? [a, a] : hand[2] === 's' ? [a, b] : [b, a];
}

export const ALL_HANDS = [];
for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) ALL_HANDS.push(handAt(r, c));

export const combosOf = (hand) => (hand.length === 2 ? 6 : hand[2] === 's' ? 4 : 12);

/** 'K9s' -> 'K9 suited', '66' -> 'Pocket sixes' */
export function describeHand(hand) {
  if (hand.length === 2) return `Pocket ${rankPlural(hand[0])}`;
  return `${hand[0]}${hand[1]} ${hand[2] === 's' ? 'suited' : 'offsuit'}`;
}

// ---- Rows: one line of the notes each. 'pairs', or a top card plus suited/offsuit ('Ks', 'Ko').

export const ROW_KEYS = ['pairs', ...[...RANKS.slice(0, 12)].flatMap((r) => [r + 's', r + 'o'])];
export const rowOf = (hand) => (hand.length === 2 ? 'pairs' : hand[0] + hand[2]);

/** Every hand in a row, strongest first. */
export function rowHands(key) {
  if (key === 'pairs') return [...RANKS].map((r) => r + r);
  const top = RANKS.indexOf(key[0]);
  return [...RANKS.slice(top + 1)].map((k) => key[0] + k + key[1]);
}

export function rowLabel(key) {
  if (key === 'pairs') return 'Pairs';
  return `${cap(rankWord(key[0]))} ${key[1] === 's' ? 'suited' : 'offsuit'}`;
}

/** 'Qs' -> 'suited queen' / 'suited queens' */
export function rowNoun(key, plural = false) {
  if (key === 'pairs') return plural ? 'pairs' : 'pair';
  const kind = key[1] === 's' ? 'suited' : 'offsuit';
  return `${kind} ${plural ? rankPlural(key[0]) : rankWord(key[0])}`;
}

// ---- Ranges

/**
 * Everything the app asks of a set of hands: its size, its cut-off in each row
 * of the notes, and how far each hand on the chart sits from its edge.
 */
export function buildRange(tokens) {
  const hands = new Set(tokens.flatMap(expand));

  let combos = 0;
  for (const hand of hands) combos += combosOf(hand);

  const rows = {};
  for (const key of ROW_KEYS) {
    const all = rowHands(key);
    const inside = all.filter((hand) => hands.has(hand));
    const contiguous = inside.every((hand, i) => hand === all[i]);
    const lowest = inside.length ? inside[inside.length - 1] : null;
    const label = !inside.length ? null
      : !contiguous ? inside.join(' ')
      : inside.length === 1 ? lowest
      : lowest + '+';
    rows[key] = { key, hands: inside, lowest, label, single: inside.length === 1 };
  }

  return { hands, combos, pct: (combos / TOTAL_COMBOS) * 100, rows, dist: edgeDistances(hands) };
}

/**
 * How far each hand sits from the edge of the set on the chart (1 = right on it).
 * Hands near an edge are the ones worth drilling.
 */
export function edgeDistances(hands) {
  const dist = new Map();
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const inside = hands.has(handAt(r, c));
      let best = 13;
      for (let r2 = 0; r2 < 13; r2++) {
        for (let c2 = 0; c2 < 13; c2++) {
          if (hands.has(handAt(r2, c2)) !== inside) best = Math.min(best, Math.max(Math.abs(r - r2), Math.abs(c - c2)));
        }
      }
      dist.set(handAt(r, c), best);
    }
  }
  return dist;
}

// ---- Opening positions

function build(raw, rawById) {
  const src = raw.sameAs ? rawById[raw.sameAs] : raw;
  return {
    id: raw.id,
    name: raw.name,
    sameAs: raw.sameAs || null,
    ...buildRange([...src.pairs, ...src.suited, ...src.offsuit]),
  };
}

const rawById = Object.fromEntries(RAW.map((p) => [p.id, p]));
export const POSITIONS = RAW.map((p) => build(p, rawById));
export const POS = Object.fromEntries(POSITIONS.map((p) => [p.id, p]));
export const SEAT_IDS = POSITIONS.map((p) => p.id);

/** The distinct ranges, tightest first. Each one contains the one before it. */
export const LADDER = POSITIONS.filter((p) => !p.sameAs).map((p) => p.id);

export const inRange = (seatId, hand) => POS[seatId].hands.has(hand);

/** Index in LADDER of the first seat that opens this hand, or -1 if no seat does. */
export function firstSeat(hand) {
  return LADDER.findIndex((id) => POS[id].hands.has(hand));
}

const KIND_ORDER = { p: 0, s: 1, o: 2 };
const sortKey = (hand) =>
  KIND_ORDER[hand[2] || 'p'] * 10000 + RANKS.indexOf(hand[0]) * 100 + RANKS.indexOf(hand[1]);

/** Pairs, then suited, then offsuit; strongest first within each. The order the notes use. */
export const sortHands = (hands) => [...hands].sort((a, b) => sortKey(a) - sortKey(b));

/** Hands the looser seat opens that the tighter one does not. */
export function additions(fromId, toId) {
  return sortHands(ALL_HANDS.filter((hand) => POS[toId].hands.has(hand) && !POS[fromId].hands.has(hand)));
}

/** Rows that have at least one hand in some seat: the lines of the notes. */
export const NOTE_ROWS = ROW_KEYS.filter((key) => POSITIONS.some((p) => p.rows[key].label));

/** The rule for one row at one seat: 'CO opens K9s+.' / 'UTG opens no suited queens.' */
export function rowRule(seatId, key) {
  const pos = POS[seatId];
  const row = pos.rows[key];
  if (!row.label) return `${pos.id} opens no ${rowNoun(key, true)}.`;
  if (key !== 'pairs' && row.single) return `${pos.id}'s only ${rowNoun(key)} is ${row.label}.`;
  return `${pos.id} opens ${row.label}.`;
}

/** The rule that decides a hand, in a sentence or two. */
export function explain(seatId, hand) {
  const pos = POS[seatId];
  const inside = pos.hands.has(hand);
  const key = rowOf(hand);
  const row = pos.rows[key];

  let where = '';
  if (inside) {
    if (!row.single && hand === row.lowest) where = ` ${hand} is the lowest one.`;
  } else if (row.label) {
    const all = rowHands(key);
    const gap = all.indexOf(hand) - all.indexOf(row.lowest);
    if (gap > 0) where = ` ${hand} is ${gap === 1 ? 'one rank' : `${gap} ranks`} below the cut-off.`;
  }

  const same = pos.sameAs ? ` SB uses the ${pos.sameAs} range.` : '';
  return { inRange: inside, rule: rowRule(seatId, key) + where + same, rowLabel: row.label };
}
