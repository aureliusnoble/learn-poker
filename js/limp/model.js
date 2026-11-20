// Limpers in front: what the book says to do, and spots that test it.
import { ISO, OVER_LIMP, LIMPER_PROFILES, SHORT_STACK } from '../data/limpers.js';
import { expand } from '../ranges.js';
import { makeChart, handsIn } from '../charts.js';
import { readSpot, SEATS_BY_COUNT } from '../table.js';
import { isoSize } from '../sizing.js';
import { stat } from '../store.js';
import { weightedPick } from '../dom.js';
import { boxWeight, edgeWeight } from '../drill.js';

export const TOPIC = 'limp';

const set = (tokens) => new Set(tokens.flatMap(expand));
const DEFAULT = set(ISO.default);
const STRONG = set(ISO.strong);
const OPTIONAL = set(ISO.optional);
const BETTER = set(ISO.strongerOptional);
const OVER = set(OVER_LIMP);
const SHOVE_CALL = set(SHORT_STACK.raise);

/** Everything playable behind a limper on one chart. Feedback and progress use it. */
export const LIMP_CHART = makeChart({
  id: 'limped',
  name: 'Limpers',
  title: 'With a limper in front',
  categories: [
    { id: 'value', label: 'Raise', tokens: ISO.default },
    { id: 'merged', label: 'Optional: raise or limp', tokens: ISO.optional },
    { id: 'weaker', label: 'Limp behind', tokens: OVER_LIMP },
  ],
});

// The charts as the book draws them, for the study page.
export const STUDY_CHARTS = [
  makeChart({
    id: 'iso',
    name: 'Raise',
    title: 'Raising a limper',
    blurb: 'The default range is strong because most limpers call. Add optional hands against limpers who fold.',
    categories: [
      { id: 'value', label: 'Default raise', tokens: ISO.default },
      { id: 'merged', label: 'Optional raise, or limp', tokens: ISO.optional },
    ],
  }),
  makeChart({
    id: 'overlimp',
    name: 'Limp',
    title: 'Limping behind',
    blurb: 'Weak hands that can make something big. Only behind other limpers, and never into a raiser.',
    categories: [{ id: 'weaker', label: 'Limp behind', tokens: OVER_LIMP }],
  }),
  ...LIMPER_PROFILES.map((p) => makeChart({
    id: p.id,
    name: p.name,
    title: p.title,
    blurb: `${p.blurb} Typical stats (hands played / hands raised): ${p.stats.join(', ')}.`,
    categories: [
      { id: 'raise', label: 'They raise', cls: 'is-c-value', tokens: p.raise },
      { id: 'limp', label: 'They limp', cls: 'is-c-call2', tokens: p.limp },
    ],
  })),
];

/**
 * The play with limpers in front and no raise yet.
 * Where the book leaves a choice, both plays are accepted.
 */
export function adviseLimped(spot, info = readSpot(spot)) {
  const hand = spot.hero.hand;
  const inBlind = spot.hero.seat === 'BB';
  const passive = inBlind ? 'check' : 'limp';
  const passiveWord = inBlind ? 'check' : 'limp behind';
  const reads = spot.reads || {};
  const seats = info.frames[info.frames.length - 1].seats;
  const n = info.limpers.length;
  const crowd = n >= 2;
  const oop = !info.inPosition;
  const raiserBehind = info.order.some((s) => reads[s] === 'isoraiser' && seats[s].status === 'toact');
  const station = info.limpers.some((s) => reads[s] === 'station');
  const tight = n === 1 && reads[info.limpers[0]] === 'weaktight';
  const out = { options: inBlind ? ['check', 'iso'] : ['fold', 'limp', 'iso'] };

  // A short-stacked limper can move all-in over a raise, before or on the flop.
  const short = info.limpers.find((s) => info.stackOf(s) <= SHORT_STACK.max);
  if (short && !SHOVE_CALL.has(hand)) {
    const playable = OPTIONAL.has(hand) || OVER.has(hand);
    if (DEFAULT.has(hand)) {
      // The book would raise these smaller, or not at all: it gives both.
      return {
        ...out,
        correct: ['iso', passive, ...(inBlind ? [] : ['fold'])],
        leaks: {},
        why: `The limper has only ${info.stackOf(short)}bb. ${hand} is not a hand to call an all-in with, so raise it smaller (2.5bb to 3bb) or do not raise it at all.`,
      };
    }
    if (playable) {
      return {
        ...out,
        correct: inBlind ? ['check'] : raiserBehind ? ['fold'] : ['limp', 'fold'],
        leaks: { iso: 'wild', ...(raiserBehind && !inBlind ? { limp: 'limpraise' } : {}) },
        why: `The limper has only ${info.stackOf(short)}bb and can move all-in over a raise. Raise only hands you would call that with: AJ+ and 99+. With ${hand}, ${inBlind ? 'check' : raiserBehind ? 'fold: a raiser is still to act' : 'limp behind if the players left to act are passive, or fold'}.`,
      };
    }
  }

  if (DEFAULT.has(hand)) {
    if ((crowd || oop) && !STRONG.has(hand)) {
      return {
        ...out,
        correct: ['iso', passive],
        leaks: { fold: 'tight' },
        why: `${hand} is in the default raising range, but ${crowd ? 'against several limpers' : 'out of position'} that range tightens towards big cards and strong pairs. Raising is fine, and so is taking the cheap flop.`,
      };
    }
    return {
      ...out,
      correct: ['iso'],
      leaks: { fold: 'tight', limp: 'passive', check: 'passive' },
      why: `${hand} is in the default range for raising limpers: 88+, AJs+, KJs+, QJs, AJo+, KJo+. Raise to play a weak player heads-up with the better hand.`,
    };
  }

  if (OPTIONAL.has(hand) || OVER.has(hand)) {
    if (raiserBehind && !inBlind) {
      return {
        ...out,
        correct: ['iso', 'fold'],
        leaks: { limp: 'limpraise' },
        why: `An aggressive raiser is still to act, so do not limp ${hand} into them. Raise the better limping hands yourself and fold the weaker ones.`,
      };
    }
    if (crowd || oop || (station && !BETTER.has(hand))) {
      if (!OVER.has(hand) && !inBlind) {
        return { ...out, correct: ['iso', passive], leaks: { fold: 'tight' }, why: `${hand} is an optional hand: raise it or limp behind.` };
      }
      const because = crowd ? 'With several limpers in, they will rarely all fold to a raise.'
        : oop ? 'Out of position you raise only the stronger range.'
        : 'A calling station will not fold, so raise hands that win at showdown.';
      return {
        ...out,
        correct: [passive],
        leaks: { iso: 'wild', fold: 'tight' },
        why: `${because} ${hand} is a hand to ${passiveWord} with: it is not strong enough to raise here, but it can make something big cheaply.`,
      };
    }
    if (tight && BETTER.has(hand)) {
      return {
        ...out,
        correct: ['iso'],
        leaks: { limp: 'passive', check: 'passive', fold: 'tight' },
        why: `A weak-tight limper folds too much, so widen the raise with the better optional hands: 77, ATs, KTs, QTs, JTs, T9s. ${hand} is one of them.`,
      };
    }
    return {
      ...out,
      correct: ['iso', passive],
      leaks: { fold: 'tight' },
      why: `${hand} is an optional hand. Raise it against limpers who fold too much; otherwise ${passiveWord}.`,
    };
  }

  return {
    ...out,
    correct: [inBlind ? 'check' : 'fold'],
    leaks: { limp: 'loose', iso: 'loose' },
    why: inBlind
      ? `${hand} is not in the raising range. Check and see the flop for free.`
      : `${hand} is not strong enough to raise a limper and is not one of the hands worth limping behind with.`,
  };
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const sample = (list, k) => list.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).slice(0, k).map((x) => x[1]);

/** A table with limpers in front of you, weighted towards the decisions the book is firm about. */
export function nextLimpSpot(round) {
  const players = pick([6, 6, 5, 4]);
  const order = SEATS_BY_COUNT[players];
  const early = order.filter((s) => s !== 'SB' && s !== 'BB');
  const kind = weightedPick(['single', 'crowd', 'blind', 'raiser', 'short'], (k) => ({ single: 4.5, crowd: 2.5, blind: 1.5, raiser: 1.5, short: 1.5 })[k]);

  let hero;
  let limpers;
  const reads = {};
  if (kind === 'blind') {
    hero = pick(['SB', 'BB']);
    limpers = sample(early, Math.min(early.length, pick([1, 1, 2])));
  } else {
    // The hero needs someone in front to limp, and for 'raiser' someone behind.
    hero = pick(early.slice(1));
    const before = early.slice(0, early.indexOf(hero));
    const count = kind === 'crowd' ? Math.min(before.length, pick([2, 2, 3])) : 1;
    limpers = sample(before, Math.max(1, count));
    if (kind === 'single') {
      const type = pick(['unknown', 'unknown', 'weaktight', 'station']);
      if (type !== 'unknown') reads[limpers[0]] = type;
    }
    if (kind === 'raiser') reads[pick(order.slice(order.indexOf(hero) + 1))] = 'isoraiser';
  }
  limpers.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const spot = { players, hero: { seat: hero }, reads, action: limpers.map((s) => [s, 'limp']) };
  if (kind === 'short') spot.stacks = { [limpers[0]]: pick([18, 22, 25, 28, 30]) };
  const info = readSpot({ ...spot, hero: { seat: hero, hand: 'AA' } });
  const firm = info.limpers.length >= 2 || !info.inPosition;

  // Raise, speculative, or fold. In a crowd or out of position, stay with hands the book is firm about.
  const tier = weightedPick(['raise', 'spec', 'fold'], (t) => ({ raise: 3, spec: 4, fold: 3 })[t]);
  let pool;
  if (kind === 'short') {
    // Only hands the short-stack rule is firm about.
    pool = tier === 'raise' ? [...SHOVE_CALL]
      : tier === 'fold' ? handsIn(LIMP_CHART, null)
      : [...new Set([...OPTIONAL, ...OVER])].filter((h) => !DEFAULT.has(h));
  } else if (tier === 'raise') pool = [...(firm ? STRONG : DEFAULT)];
  else if (tier === 'fold') pool = handsIn(LIMP_CHART, null);
  else if (firm) pool = [...OVER];
  else if (reads[limpers[0]] === 'weaktight') pool = [...BETTER];
  else pool = [...new Set([...OPTIONAL, ...OVER])];
  const fresh = pool.filter((h) => !round.recent.includes(`limped:${h}`));
  const hand = weightedPick(fresh.length ? fresh : pool,
    (h) => edgeWeight(LIMP_CHART.dist.get(h)) * boxWeight(stat(TOPIC, 'hands', `limped:${h}`)));

  spot.hero.hand = hand;
  const advice = adviseLimped(spot);
  const full = {
    ...spot,
    ...advice,
    topic: TOPIC,
    bucket: 'hands',
    key: `limped:${hand}`,
    title: `${limpers.length === 1 ? 'A limper' : `${limpers.length} limpers`} in front`,
    lens: { chart: LIMP_CHART, hand },
    quick: true,
  };
  if (advice.correct.includes('iso')) full.size = isoSize(spot);
  return full;
}
