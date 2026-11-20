// Opening ranges: what to ask next, and how well each seat is known.
import { POS, POSITIONS, SEAT_IDS, ALL_HANDS, LADDER, NOTE_ROWS, RANKS, explain, OPEN_SIZE_BB } from '../ranges.js';
import { stat, bucketOf } from '../store.js';
import { weightedPick } from '../dom.js';
import { boxWeight, edgeWeight, settled, SOLID } from '../drill.js';

export const TOPIC = 'open';

export const handStat = (seat, hand) => stat(TOPIC, 'hands', `${seat}:${hand}`);
export const edgeStat = (seat, row) => stat(TOPIC, 'edges', `${seat}:${row}`);

const handWeight = (seat, hand) => edgeWeight(POS[seat].dist.get(hand)) * boxWeight(handStat(seat, hand));

/**
 * A seat and a hand to ask about. Seats you know less well come up more, raise
 * and fold are equally likely, and hands near the edge of the range dominate.
 */
export function pickHand(seats, recent) {
  const seat = weightedPick(seats, (s) => {
    let now = 0;
    let fresh = 0;
    for (const hand of ALL_HANDS) {
      fresh += edgeWeight(POS[s].dist.get(hand));
      now += handWeight(s, hand);
    }
    return now / fresh;
  });
  const wantRaise = Math.random() < 0.5;
  const pool = ALL_HANDS.filter((hand) => POS[seat].hands.has(hand) === wantRaise && !recent.includes(`${seat}:${hand}`));
  return { seat, hand: weightedPick(pool, (hand) => handWeight(seat, hand)) };
}

/** The same, restricted to a given list of { seat, hand }. */
export function pickFrom(items, recent) {
  const fresh = items.filter((it) => !recent.includes(`${it.seat}:${it.hand}`));
  const it = weightedPick(fresh.length ? fresh : items, (x) => boxWeight(handStat(x.seat, x.hand)));
  return { seat: it.seat, hand: it.hand };
}

/**
 * The rows worth asking a seat about: every row down to its last cut-off, plus
 * the first empty row beyond, so "none" is sometimes the right answer.
 */
export function quizRows(seatId) {
  const pos = POS[seatId];
  const lastTop = (kind) => {
    let last = -1;
    for (const key of NOTE_ROWS) if (key[1] === kind && pos.rows[key].label) last = RANKS.indexOf(key[0]);
    return last;
  };
  const limit = { s: lastTop('s') + 1, o: lastTop('o') + 1 };
  return ['pairs', ...['s', 'o'].flatMap((kind) =>
    [...RANKS.slice(0, Math.min(limit[kind], 11) + 1)].map((r) => r + kind))];
}

export function pickRow(seats, recent) {
  const all = seats.flatMap((seat) => quizRows(seat).map((row) => ({ seat, row })));
  const fresh = all.filter((it) => !recent.includes(`${it.seat}:${it.row}`));
  return weightedPick(fresh.length ? fresh : all, (it) => boxWeight(edgeStat(it.seat, it.row)));
}

/** How well a seat is known: the edge hands settled, plus raw accuracy. */
export function seatSummary(seat) {
  const pos = POS[seat];
  let edges = 0;
  let known = 0;
  let n = 0;
  let c = 0;
  for (const hand of ALL_HANDS) {
    const st = handStat(seat, hand);
    if (st) {
      n += st.n;
      c += st.c;
    }
    if (pos.dist.get(hand) === 1) {
      edges += 1;
      known += settled(st);
    }
  }
  return { mastery: known / edges, n, c };
}

export function totals() {
  let n = 0;
  let c = 0;
  for (const bucket of ['hands', 'edges']) {
    for (const st of Object.values(bucketOf(TOPIC, bucket))) {
      n += st.n;
      c += st.c;
    }
  }
  let ms = 0;
  let timed = 0;
  for (const t of Object.values(bucketOf(TOPIC, 'time'))) {
    ms += t.ms;
    timed += t.n;
  }
  const mastery = SEAT_IDS.reduce((sum, seat) => sum + seatSummary(seat).mastery, 0) / SEAT_IDS.length;
  return { n, c, avgMs: timed ? ms / timed : null, mastery };
}

/** Hands missed and not yet got right twice running, worst first. */
export function weakest(limit = 8) {
  const out = [];
  for (const [key, st] of Object.entries(bucketOf(TOPIC, 'hands'))) {
    const [seat, hand] = key.split(':');
    const misses = st.n - st.c;
    if (!misses || st.b >= SOLID || !POS[seat] || !POS[seat].dist.has(hand)) continue;
    out.push({ group: seat, seat, hand, n: st.n, misses, b: st.b, t: st.t || 0 });
  }
  out.sort((a, b) => a.b - b.b || b.misses / b.n - a.misses / a.n || b.misses - a.misses || b.t - a.t);
  return out.slice(0, limit);
}

export function edgesKnown() {
  let total = 0;
  let known = 0;
  for (const seat of SEAT_IDS) {
    for (const row of quizRows(seat)) {
      total += 1;
      const st = edgeStat(seat, row);
      if (st && st.b >= SOLID) known += 1;
    }
  }
  return { known, total };
}

export const play = (inside) => (inside ? `Raise to ${OPEN_SIZE_BB}bb` : 'Fold');

/** The correct play and the rule behind it, as one line. */
export function verdictLine(seat, hand) {
  const info = explain(seat, hand);
  return `${play(info.inRange)}. ${info.rule}`;
}

export const SEAT_OPTIONS = [{ value: 'ALL', label: 'All' }, ...POSITIONS.map((p) => ({ value: p.id, label: p.id }))];
export const seatsFor = (filter) => (filter === 'ALL' ? SEAT_IDS : [filter]);
export { LADDER };
