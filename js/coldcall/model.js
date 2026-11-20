// Cold-calling and set mining: the charts as drillable objects, and the
// generators that turn them into spots at the table.
import { CALL_CHARTS, CALLER_SEATS, SET_MINING } from '../data/coldcall.js';
import { makeChart, handsIn } from '../charts.js';
import { stat } from '../store.js';
import { weightedPick } from '../dom.js';
import { boxWeight, edgeWeight } from '../drill.js';
import { bb } from '../table.js';

export const TOPIC = 'coldcall';

export const CHARTS = CALL_CHARTS.map((c) => makeChart({
  id: c.id,
  name: `vs ${c.id}`,
  title: c.name,
  figure: [`${c.callPct}%`, ' of hands called'],
  blurb: `The default against an unknown player who opens ${c.openPct}% of hands from ${c.id}.`,
  optional: c.optional3bet,
  source: c,
  categories: [
    { id: 'value3bet', label: '3-bet for value', tokens: c.value3bet },
    { id: 'gap', label: 'Call: gap concept', tokens: c.gap },
    { id: 'weaker', label: 'Call: weaker hand', tokens: c.weaker },
  ],
}));

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const PLAY = { value3bet: ['3bet'], gap: ['call'], weaker: ['call'] };
// Folds are most of the chart, so they are asked a little more than each other answer.
const WANT = [[null, 4], ['gap', 2.5], ['weaker', 2.5], ['value3bet', 1.5]];

function reason(chart, hand) {
  const cat = chart.categoryOf(hand);
  const also = chart.optional.has(hand) ? ' It is strong enough to 3-bet for value as well.' : '';
  if (cat === 'value3bet') return `${hand} is a value 3-bet against a ${chart.id} open.`;
  if (cat === 'gap') return `${hand} is a gap concept call against a ${chart.id} open: an equity edge over their range, without being strong enough to need a 3-bet.${also}`;
  if (cat === 'weaker') return `${hand} is a weaker starting hand that still calls a ${chart.id} open by default. It has no equity edge and relies on implied odds.${also}`;
  return `${hand} is not in the default range against a ${chart.id} open.`;
}

/** A hand against an unknown opener: call, 3-bet or fold by the default chart. */
export function nextCallSpot(getFilter) {
  return (round) => {
    const filter = getFilter();
    const chart = filter === 'ALL' ? pick(CHARTS) : CHARTS.find((c) => c.id === filter);
    const want = weightedPick(WANT, (w) => w[1])[0];
    const all = handsIn(chart, want);
    const fresh = all.filter((hand) => !round.recent.includes(`${chart.id}:${hand}`));
    const hand = weightedPick(fresh.length ? fresh : all,
      (x) => edgeWeight(chart.dist.get(x)) * boxWeight(stat(TOPIC, 'hands', `${chart.id}:${x}`)));
    const cat = chart.categoryOf(hand);
    return {
      key: `${chart.id}:${hand}`,
      title: `Against a ${chart.id} open`,
      hero: { seat: pick(CALLER_SEATS[chart.id]), hand },
      reads: { [chart.id]: 'unknown' },
      action: [[chart.id, 'raise', 3]],
      options: ['fold', 'call', '3bet'],
      correct: chart.optional.has(hand) ? ['call', '3bet'] : PLAY[cat] || ['fold'],
      why: reason(chart, hand),
      lens: { chart, hand },
      quick: true,
    };
  };
}

const SMALL_PAIRS = ['22', '33', '44', '55'];
const CALLS = [2, 2.5, 3, 4, 5];

/** The arithmetic of set mining on its own: what a call needs, and whether it is there. */
export function nextSetSum() {
  const call = pick(CALLS);
  const need = call * SET_MINING.ruleMultiple;
  const even = call * SET_MINING.breakEvenMultiple;
  const kind = pick(['deep', 'deep', 'need', 'even']);
  const opener = pick(['UTG', 'MP']);
  const enough = Math.random() < 0.5;
  // Clear of the line either way, so the sum decides it rather than a rounding.
  const effective = kind !== 'deep' ? 100
    : enough ? Math.round(need * (1.2 + Math.random())) : Math.round(need * (0.35 + Math.random() * 0.5));
  const spot = {
    key: `${kind}:${call}`,
    title: `A ${bb(call)} call`,
    hero: { seat: pick(['CO', 'BTN']), hand: pick(SMALL_PAIRS), stack: Math.max(effective, 100) },
    stacks: { [opener]: effective },
    reads: { [opener]: 'unknown' },
    action: [[opener, 'raise', call]],
    math: { call, effective },
    quick: true,
  };
  const choices = (multiples) => multiples.map((m) => ({ id: String(m), label: bb(call * m) }));
  if (kind === 'deep') {
    return {
      ...spot,
      question: 'Is there enough behind for the 15-to-1 rule?',
      options: [{ id: 'no', label: 'Not enough' }, { id: 'yes', label: 'Enough' }],
      correct: [effective >= need ? 'yes' : 'no'],
      why: `A ${bb(call)} call needs ${bb(need)} to win. The most you can win here is ${bb(effective)}.`,
    };
  }
  if (kind === 'need') {
    return {
      ...spot,
      question: 'By the 15-to-1 rule, how much must you be able to win?',
      options: choices([9, 12, 15, 20]),
      correct: ['15'],
      why: `15 times the ${bb(call)} call is ${bb(need)}.`,
    };
  }
  return {
    ...spot,
    question: 'How much must you win when you hit, just to break even?',
    options: choices([6, 9, 12, 15]),
    correct: ['9'],
    why: `You hit about 1 time in 9, so the win has to cover 9 calls: ${bb(even)}. That is only break-even, which is why the rule asks for 15.`,
  };
}
