// A raise and a caller in front: squeeze, over-call or fold.
import { VALUE_BY_OPENER, OVER_CALL, OVER_CALL_OR_3BET } from '../data/squeeze.js';
import { expand } from '../ranges.js';
import { makeChart, handsIn } from '../charts.js';
import { readSpot, tablesWith, aSeat } from '../table.js';
import { threeBetSize } from '../sizing.js';
import { stat } from '../store.js';
import { weightedPick } from '../dom.js';
import { boxWeight, edgeWeight } from '../drill.js';

export const TOPIC = 'squeeze';

const set = (tokens) => new Set(tokens.flatMap(expand));
const OVER = set([...OVER_CALL, ...OVER_CALL_OR_3BET]);
const STRONG = set(OVER_CALL_OR_3BET);
const VALUE = Object.fromEntries(VALUE_BY_OPENER.map((v) => [v.id, {
  default: set(v.default),
  optional: set(v.optional),
  label: v.default.join(', '),
}]));

/** One chart per seat the raise can come from. Feedback and progress use them. */
export const CHARTS = VALUE_BY_OPENER.map((v) => makeChart({
  id: v.id,
  name: `vs ${v.id}`,
  title: `${aSeat(v.id, true)} raise and a caller`,
  categories: [
    { id: 'value3bet', label: 'Squeeze for value', tokens: v.default },
    { id: 'merged', label: 'Optional squeeze', tokens: v.optional },
    { id: 'gap', label: 'Over-call', tokens: [...OVER_CALL_OR_3BET, ...OVER_CALL] },
  ],
}));
const CHART = Object.fromEntries(CHARTS.map((c) => [c.id, c]));

/** The over-calling chart as the book draws it, for the study page. */
export const STUDY_CHARTS = [
  makeChart({
    id: 'overcall',
    name: 'Over-call',
    title: 'The over-calling range',
    blurb: 'Suited hands and pairs that play well in a crowd. Tighter than limping behind, because it costs three times as much.',
    categories: [
      { id: 'gap', label: 'Over-call', tokens: OVER_CALL },
      { id: 'merged', label: 'Over-call or squeeze', tokens: OVER_CALL_OR_3BET },
    ],
  }),
  ...CHARTS,
];

const PLAYS = ['fold', 'call', '3bet'];

/**
 * The play with a raise and at least one caller in front.
 * Where the book leaves a choice, both plays are accepted.
 */
export function adviseSqueeze(spot, info = readSpot(spot)) {
  const hand = spot.hero.hand;
  const opener = info.villain;
  const value = VALUE[opener];
  const reads = spot.reads || {};
  const seats = info.frames[info.frames.length - 1].seats;
  const threeBettorBehind = info.order.some((s) => reads[s] === 'aggro3b' && seats[s].status === 'toact');
  const out = { options: PLAYS };

  if (value.default.has(hand)) {
    return {
      ...out,
      correct: ['3bet'],
      leaks: { fold: 'tight', call: 'passive' },
      why: `${hand} is in the default value range against ${aSeat(opener)} raise (${value.label}). You always squeeze that range, and each caller adds 3bb to the size.`,
    };
  }
  if (value.optional.has(hand)) {
    // AJo is the one optional hand the book says never to over-call.
    const other = hand === 'AJo' ? 'fold' : 'call';
    return {
      ...out,
      correct: ['3bet', other],
      leaks: other === 'fold' ? { call: 'loose' } : { fold: 'tight' },
      why: `${hand} is an optional value squeeze against ${aSeat(opener)} raise: squeeze when the raiser opens wide and the caller calls light. Otherwise ${other === 'fold' ? 'fold, because offsuit hands do not over-call' : 'over-call'}.`,
    };
  }
  if (OVER.has(hand)) {
    if (threeBettorBehind && STRONG.has(hand)) {
      return {
        ...out,
        correct: ['call', 'fold'],
        leaks: { '3bet': 'wild' },
        why: `${hand} is strong enough to over-call, but an aggressive 3-bettor is still to act. Calling is fine if you will stand a squeeze; so is folding.`,
      };
    }
    if (threeBettorBehind) {
      return {
        ...out,
        correct: ['fold'],
        leaks: { call: 'loose', '3bet': 'loose' },
        why: `${hand} is an over-calling hand, but an aggressive 3-bettor is still to act. You would have to fold to their squeeze most of the time, so fold now.`,
      };
    }
    return {
      ...out,
      correct: ['call'],
      leaks: { fold: 'tight', '3bet': 'wild' },
      why: `${hand} is not a value squeeze against ${aSeat(opener)} raise, and bluff squeezes are best left out at these stakes. It is in the over-calling range: a ${hand.length === 2 ? 'pair' : 'suited hand'} that plays well in a multi-way pot.`,
    };
  }
  return {
    ...out,
    correct: ['fold'],
    leaks: { call: 'loose', '3bet': 'loose' },
    why: hand.length === 3 && hand[2] === 'o'
      ? `${hand} is not a value squeeze against ${aSeat(opener)} raise, and offsuit hands never over-call: they cannot make flushes and play badly multi-way.`
      : `${hand} is not in the over-calling range. It costs about three times as much as limping behind, so the range is tighter.`,
  };
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// The hero is on the button with position, or in the big blind closing the
// action: the two places the book's own over-calls are made from.
const SHAPES = [
  { opener: 'UTG', caller: 'MP', hero: 'BTN' },
  { opener: 'UTG', caller: 'CO', hero: 'BTN' },
  { opener: 'MP', caller: 'CO', hero: 'BTN' },
  { opener: 'UTG', caller: 'BTN', hero: 'BB' },
  { opener: 'MP', caller: 'BTN', hero: 'BB' },
  { opener: 'CO', caller: 'BTN', hero: 'BB' },
  { opener: 'CO', caller: 'SB', hero: 'BB' },
  { opener: 'BTN', caller: 'SB', hero: 'BB' },
  { opener: 'BTN', caller: 'SB', hero: 'BB' },
];
// Small pairs are left out of the generated folds: set mining and this chart pull different ways.
const UNSURE = new Set(['44', '33', '22']);

/** A raise, a caller and a hand, weighted towards the decisions the book is firm about. */
export function nextSqueezeSpot(round) {
  const shape = pick(SHAPES);
  const chart = CHART[shape.opener];
  const value = VALUE[shape.opener];
  const reads = {};
  if (Math.random() < 0.35) reads[shape.caller] = pick(['passive', 'rec']);
  // On the button, sometimes an aggressive 3-bettor is waiting in the blinds.
  const danger = shape.hero === 'BTN' && Math.random() < 0.22;
  if (danger) reads[pick(['SB', 'BB'])] = 'aggro3b';

  const tier = weightedPick(['value', 'over', 'fold', 'optional'], (t) => ({ value: 3, over: 4.5, fold: 3.5, optional: 0.8 })[t]);
  let pool;
  if (tier === 'value') pool = [...value.default];
  else if (tier === 'optional') pool = [...value.optional];
  else if (tier === 'over') pool = [...OVER].filter((h) => !value.default.has(h) && !value.optional.has(h) && !(danger && STRONG.has(h)));
  else pool = handsIn(chart, null).filter((h) => !UNSURE.has(h));
  const key = (h) => `${shape.opener}:${h}${danger ? ':3b' : ''}`;
  const fresh = pool.filter((h) => !round.recent.includes(key(h)));
  const hand = weightedPick(fresh.length ? fresh : pool,
    (h) => edgeWeight(chart.dist.get(h)) * boxWeight(stat(TOPIC, 'hands', key(h))));

  const spot = {
    players: pick(tablesWith(shape.opener)),
    hero: { seat: shape.hero, hand },
    reads,
    action: [[shape.opener, 'raise', 3], [shape.caller, 'call']],
  };
  const advice = adviseSqueeze(spot);
  const full = {
    ...spot,
    ...advice,
    topic: TOPIC,
    bucket: 'hands',
    key: key(hand),
    title: `${aSeat(shape.opener, true)} raise and a caller`,
    lens: { chart, hand },
    quick: true,
  };
  if (advice.correct.includes('3bet')) full.size = threeBetSize(spot);
  return full;
}

/** A written spot, with the size question added where its one answer is a squeeze. */
export function dressed(spot) {
  const squeeze = spot.hero && spot.correct.length === 1 && spot.correct[0] === '3bet' && spot.options.includes('3bet');
  return squeeze ? { ...spot, size: threeBetSize(spot) } : spot;
}
