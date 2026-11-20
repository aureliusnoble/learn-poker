// Stealing the blinds and defending them: what the book says to do, and spots that test it.
import {
  MODERATE_ADDS, MODERATE_PCT, PREFER_CALL, STEAL_REWARD, BREAK_EVEN, POT_ODDS, DEFENCE,
} from '../data/blinds.js';
import { POSITIONS as OPEN_RANGES } from '../data/preflop-ranges.js';
import { expand, POS } from '../ranges.js';
import { makeChart, handsIn } from '../charts.js';
import { readSpot, tablesWith, bb } from '../table.js';
import { threeBetSize, stealSize } from '../sizing.js';
import { stat } from '../store.js';
import { weightedPick } from '../dom.js';
import { boxWeight, edgeWeight } from '../drill.js';

export const TOPIC = 'blinds';

const set = (tokens) => new Set(tokens.flatMap(expand));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const WANT = set(PREFER_CALL);
const WIDER = Object.fromEntries(Object.entries(MODERATE_ADDS).map(([seat, tokens]) => [seat, set(tokens)]));

// ---- Stealing

const rawById = Object.fromEntries(OPEN_RANGES.map((p) => [p.id, p]));
const openTokens = (seat) => {
  const src = rawById[seat].sameAs ? rawById[rawById[seat].sameAs] : rawById[seat];
  return [...src.pairs, ...src.suited, ...src.offsuit];
};

/** Each stealing seat's range in three layers: wants a call, hopes for a fold, only against tight blinds. */
export const STEAL_CHARTS = ['CO', 'BTN', 'SB'].map((seat) => makeChart({
  id: seat,
  name: seat,
  title: `Stealing from the ${POS[seat].name.toLowerCase()}`,
  figure: [`${MODERATE_PCT[seat]}%`, ' of hands at its widest'],
  blurb: 'Open the first two layers by default. Add the third only when the blinds fold enough.',
  categories: [
    { id: 'value', label: 'Open: wants a call', tokens: PREFER_CALL },
    { id: 'merged', label: 'Open: hopes they fold', tokens: openTokens(seat) },
    { id: 'bluff', label: 'Only against tight blinds', tokens: MODERATE_ADDS[seat] },
  ],
}));
const STEAL_CHART = Object.fromEntries(STEAL_CHARTS.map((c) => [c.id, c]));

// What each kind of blind does to a steal. `folds` is how often one of them folds.
const MOODS = {
  unknown: { weight: 3 },
  tight: { weight: 3, read: 'nit', note: 'Folds to 80% of steals', folds: 0.8 },
  sticky: { weight: 2.5 },
  aggro: { weight: 1.5 },
};

function moodOf(spot, info) {
  const reads = spot.reads || {};
  const blinds = info.order.filter((s) => (s === 'SB' || s === 'BB') && s !== spot.hero.seat);
  if (blinds.some((s) => reads[s] === 'station')) return 'sticky';
  if (blinds.some((s) => reads[s] === 'aggro3b')) return 'aggro';
  if (blinds.every((s) => reads[s] === 'nit')) return 'tight';
  return 'unknown';
}

const SIZE_WHY = {
  tight: 'Against blinds that fold this often, risk the least you can: 2bb to 2.5bb. A 2.5bb steal has to work 62.5% of the time, a 3bb steal 66.7%.',
  aggro: 'Against blinds that 3-bet a lot, open to 2bb or 2.5bb so each steal risks less.',
  sticky: '3bb is the default open. This hand wants the call, so there is no reason to make it cheaper.',
  unknown: '3bb is the default open. Go smaller once you know the blinds fold a lot or 3-bet a lot.',
};

/**
 * The play when it is folded to you in a stealing seat.
 * Where the book leaves a choice, both plays are accepted.
 */
export function adviseSteal(spot, info = readSpot(spot)) {
  const { seat, hand } = spot.hero;
  const mood = moodOf(spot, info);
  const blinds = info.order.filter((s) => (s === 'SB' || s === 'BB') && s !== seat).length;
  const out = { options: ['fold', 'open'], mood };

  if (WANT.has(hand)) {
    return {
      ...out,
      correct: ['open'],
      leaks: { fold: 'tight' },
      why: `${hand} is one of the hands that wants a call: about the top 10%, the range you would open under the gun. Raise whoever is in the blinds.`,
    };
  }
  if (POS[seat].hands.has(hand)) {
    // The book tightens the bottom of the range here without saying how far.
    if (mood === 'sticky' || mood === 'aggro') {
      return {
        ...out,
        correct: ['open', 'fold'],
        leaks: {},
        why: `${hand} is in your default ${seat} range, but it hopes for folds and these blinds do not give many. Opening is fine; so is tightening up.`,
      };
    }
    return {
      ...out,
      correct: ['open'],
      leaks: { fold: 'tight' },
      why: `${hand} is in your default ${seat} opening range. It is a steal: you are hoping the blinds fold, and you have position if they do not.`,
    };
  }
  if (WIDER[seat].has(hand)) {
    if (mood === 'tight') {
      const sum = blinds === 2 ? 'Each blind folds 80% of the time, so both fold 0.8 × 0.8 = 64%' : 'The big blind folds 80% of the time';
      return {
        ...out,
        correct: ['open'],
        leaks: { fold: 'tight' },
        why: `${sum}: more than the 62.5% a 2.5bb steal needs. Against blinds this tight, open the wider ${seat} range, and ${hand} is in it.`,
      };
    }
    return {
      ...out,
      correct: ['fold'],
      leaks: { open: 'loose' },
      why: mood === 'sticky'
        ? `${hand} is at the bottom of the stealing range and needs both blinds to fold about two times in three. A calling station will not, so tighten up and fold.`
        : mood === 'aggro'
          ? `${hand} is only a steal against blinds that fold. These ones 3-bet a lot, so tighten your opening range.`
          : `${hand} is outside your default ${seat} range. It only becomes a steal once you know the blinds fold a lot.`,
    };
  }
  return {
    ...out,
    correct: ['fold'],
    leaks: { open: 'loose' },
    why: `${hand} is not in the ${seat} range, even at its widest.`,
  };
}

function stealSized(spot, advice) {
  if (!advice.correct.includes('open')) return null;
  const small = advice.mood === 'tight' || advice.mood === 'aggro';
  return stealSize(spot, small, SIZE_WHY[advice.mood]);
}

/** A stealing seat, the players in the blinds, and a hand. */
export function nextStealSpot(round) {
  const seat = pick(['CO', 'BTN', 'BTN', 'SB']);
  const blinds = seat === 'SB' ? ['BB'] : ['SB', 'BB'];
  const mood = weightedPick(Object.keys(MOODS), (m) => MOODS[m].weight);
  const reads = {};
  const notes = {};
  if (mood === 'tight') {
    for (const s of blinds) { reads[s] = 'nit'; notes[s] = MOODS.tight.note; }
  } else if (mood === 'sticky') {
    reads.BB = 'station';
    notes.BB = 'Rarely folds to a steal';
    if (blinds.includes('SB')) reads.SB = 'nit';
  } else if (mood === 'aggro') {
    reads.BB = 'aggro3b';
    notes.BB = '3-bets steals often';
  }

  const chart = STEAL_CHART[seat];
  // Only hands the book is firm about for this kind of blind.
  const tiers = mood === 'unknown' ? { value: 2, merged: 3, bluff: 3, none: 2 }
    : mood === 'tight' ? { value: 1.5, merged: 2, bluff: 4.5, none: 2.5 }
    : { value: 4, bluff: 4, none: 2.5 };
  const tier = weightedPick(Object.keys(tiers), (t) => tiers[t]);
  const pool = handsIn(chart, tier === 'none' ? null : tier);
  const key = (h) => `${seat}:${mood}:${h}`;
  const fresh = pool.filter((h) => !round.recent.includes(key(h)));
  const hand = weightedPick(fresh.length ? fresh : pool,
    (h) => edgeWeight(chart.dist.get(h)) * boxWeight(stat(TOPIC, 'steal', key(h))));

  const spot = { players: pick(tablesWith(seat)), hero: { seat, hand }, reads, notes };
  const advice = adviseSteal(spot);
  return {
    ...spot,
    ...advice,
    topic: TOPIC,
    bucket: 'steal',
    key: key(hand),
    title: mood === 'tight' ? 'Tight blinds' : mood === 'sticky' ? 'A calling station in the blinds' : mood === 'aggro' ? 'A 3-bettor in the blinds' : 'Folded to you',
    question: 'Steal, or fold?',
    size: stealSized(spot, advice),
    lens: { chart, hand },
    quick: true,
  };
}

// ---- Defending

/** The two defending ranges against a late-position steal. */
export const DEFEND_CHARTS = ['SB', 'BB'].map((seat) => makeChart({
  id: seat,
  name: DEFENCE[seat].name,
  title: `${DEFENCE[seat].name} against a steal`,
  blurb: `Drawn against a button opening 43.29% of hands. This range has ${DEFENCE[seat].equity}% equity against it.`,
  categories: [
    { id: 'value3bet', label: '3-bet for value', tokens: DEFENCE.value3bet },
    { id: 'gap', label: 'Call', tokens: DEFENCE[seat].call },
  ],
}));
const DEFEND_CHART = Object.fromEntries(DEFEND_CHARTS.map((c) => [c.id, c]));
const VALUE_LABEL = DEFENCE.value3bet.join(', ');

/** The play in a blind when a cutoff or button raise is folded round to you. */
export function adviseDefend(spot) {
  const { seat, hand } = spot.hero;
  const cat = DEFEND_CHART[seat].categoryOf(hand);
  const out = { options: ['fold', 'call', '3bet'] };
  if (cat === 'value3bet') {
    return {
      ...out,
      correct: ['3bet'],
      leaks: { fold: 'tight', call: 'passive' },
      why: `${hand} is in the value 3-betting range against a late-position steal: ${VALUE_LABEL}.`,
    };
  }
  if (cat === 'gap') {
    return {
      ...out,
      correct: ['call'],
      leaks: { fold: 'tight', '3bet': 'wild' },
      why: seat === 'SB'
        ? `From the small blind, call a steal only with medium pairs and Broadway hands. ${hand} is one of them.`
        : `In the big blind you close the action and get the best price, so the calling range is wide. ${hand} is in it.`,
    };
  }
  return {
    ...out,
    correct: ['fold'],
    leaks: { call: 'loose', '3bet': 'loose' },
    why: seat === 'SB'
      ? `${hand} is outside the small blind's defending range. The big blind can still squeeze or call behind you, so only medium pairs and Broadway hands call.`
      : `${hand} is outside even the big blind's wide calling range. Out of position, hands win less than their equity.`,
  };
}

/** A late-position steal with you in one of the blinds. */
export function nextDefendSpot(round) {
  const seat = pick(['SB', 'BB', 'BB']);
  const opener = pick(['BTN', 'BTN', 'CO']);
  const chart = DEFEND_CHART[seat];
  const want = weightedPick([[null, 4], ['gap', 4], ['value3bet', 2]], (w) => w[1])[0];
  const pool = handsIn(chart, want);
  const key = (h) => `${seat}:${h}`;
  const fresh = pool.filter((h) => !round.recent.includes(key(h)));
  const hand = weightedPick(fresh.length ? fresh : pool,
    (h) => edgeWeight(chart.dist.get(h)) * boxWeight(stat(TOPIC, 'defend', key(h))));
  const spot = {
    players: pick(tablesWith(opener)),
    hero: { seat, hand },
    action: [[opener, 'raise', pick([2.5, 3, 3])]],
  };
  const advice = adviseDefend(spot);
  const full = {
    ...spot,
    ...advice,
    topic: TOPIC,
    bucket: 'defend',
    key: key(hand),
    title: `A ${opener} steal`,
    lens: { chart, hand },
    quick: true,
  };
  if (advice.correct.includes('3bet')) full.size = threeBetSize(spot);
  return full;
}

/** A written spot, with the size question added where its one answer is a raise. */
export function dressed(spot) {
  if (!spot.hero || spot.correct.length !== 1) return spot;
  if (spot.correct[0] === '3bet') return { ...spot, size: threeBetSize(spot) };
  if (spot.correct[0] === 'open') {
    return { ...spot, size: stealSize(spot, !!spot.stealSmall, SIZE_WHY[spot.stealSmall ? 'tight' : 'unknown']) };
  }
  return spot;
}

// ---- The sums

const pc = (x) => `${Number((x * 100).toFixed(1))}%`;
const choices = (right, others) => {
  const wrong = [...new Set(others.filter((x) => Math.abs(x - right) > 0.004))].slice(0, 3);
  return [...wrong, right].sort((a, b) => a - b).map((x) => ({ id: pc(x), label: pc(x) }));
};
const ALL_ODDS = [...new Set(POT_ODDS.flatMap((r) => [r.sb, r.bbAfterCall, r.bbAfterFold]))].map((x) => x / 100);
const nearest = (right, list, k) => [...list].sort((a, b) => Math.abs(a - right) - Math.abs(b - right)).filter((x) => Math.abs(x - right) > 0.004).slice(0, k);

/** The arithmetic of the chapter: break-even steals, two blinds folding, and the price of a call. */
export function nextBlindSum() {
  const kind = pick(['even', 'both', 'profit', 'odds', 'odds']);
  const base = { topic: TOPIC, bucket: 'sums', quick: true };

  if (kind === 'even') {
    const [size, pct] = pick(BREAK_EVEN);
    return {
      ...base,
      key: `even:${size}`,
      title: `A ${bb(size)} steal`,
      question: `A ${bb(size)} steal: how often must it work to break even?`,
      options: choices(pct / 100, [0.5, ...BREAK_EVEN.map((b) => b[1] / 100), 0.75]),
      correct: [pc(pct / 100)],
      why: `Risk ÷ (risk + reward): ${size} ÷ (${size} + ${STEAL_REWARD}) = ${pct}%.`,
    };
  }

  if (kind === 'both' || kind === 'profit') {
    const a = pick([0.6, 0.7, 0.8, 0.9]);
    const b = pick([0.6, 0.7, 0.8, 0.9]);
    const both = a * b;
    const spot = {
      ...base,
      hero: { seat: 'BTN', hand: pick(['T7s', 'K7o', 'Q9o', '64s', 'J7s']) },
      reads: { SB: a >= 0.8 ? 'nit' : 'unknown', BB: b >= 0.8 ? 'nit' : 'unknown' },
      notes: { SB: `Folds to ${pc(a)} of steals`, BB: `Folds to ${pc(b)} of steals` },
    };
    if (kind === 'both') {
      return {
        ...spot,
        key: `both:${a}:${b}`,
        title: 'Will both blinds fold?',
        question: 'How often do both blinds fold?',
        options: choices(both, [Math.max(a, b), (a + b) / 2, Math.min(a, b), both + 0.12, both - 0.12]),
        correct: [pc(both)],
        why: `Multiply the two: ${a} × ${b} = ${pc(both)}.`,
      };
    }
    const [size, pct] = pick(BREAK_EVEN);
    const enough = both > pct / 100;
    return {
      ...spot,
      key: `profit:${size}:${a}:${b}`,
      title: `Is a ${bb(size)} steal enough?`,
      question: `Do they fold often enough for a ${bb(size)} steal to profit on folds alone?`,
      options: [{ id: 'no', label: 'Not often enough' }, { id: 'yes', label: 'Often enough' }],
      correct: [enough ? 'yes' : 'no'],
      why: `Both fold ${a} × ${b} = ${pc(both)} of the time. A ${bb(size)} steal has to work ${pct}% of the time.`,
    };
  }

  // The price each blind is offered. The table works it out from the pot.
  const size = pick([2, 2.5, 3]);
  const shape = pick(['sb', 'bbFold', 'bbCall']);
  const spot = {
    ...base,
    hero: { seat: shape === 'sb' ? 'SB' : 'BB', hand: pick(['T9s', 'A8o', 'K9s', '66']) },
    action: shape === 'bbCall' ? [['BTN', 'raise', size], ['SB', 'call']] : [['BTN', 'raise', size]],
  };
  const info = readSpot(spot);
  const need = info.toCall / (info.pot + info.toCall);
  return {
    ...spot,
    key: `odds:${shape}:${size}`,
    title: 'The price of a call',
    question: 'What equity do you need to call?',
    options: choices(need, nearest(need, ALL_ODDS, 3)),
    correct: [pc(need)],
    why: `Call ${bb(info.toCall)} for a pot that will be ${bb(info.pot + info.toCall)}: ${info.toCall} ÷ ${info.pot + info.toCall} = ${pc(need)}. Pot odds are the equity you need.`,
  };
}
