// 3-betting: the charts as drillable objects, and the generator that asks
// which chart a hand belongs on.
import { CHARTS as RAW } from '../data/threebet.js';
import { makeChart, handsIn } from '../charts.js';
import { stat } from '../store.js';
import { weightedPick } from '../dom.js';
import { boxWeight, edgeWeight } from '../drill.js';

export const TOPIC = 'threebet';
export const CHARTS = RAW.map(makeChart);

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// How each chart is put at the table: who opened, what is known about them,
// and the words for "this hand is not on it".
const SETTING = {
  depolarized: { none: 'Not a 3-bet', ask: 'Is this a value 3-bet?' },
  polarized: { none: 'Neither', ask: 'Value 3-bet, bluff 3-bet, or neither?', note: 'Folds to 3-bets often', read: 'tag' },
  bluffs: { none: 'Not a candidate', ask: 'Is this a hand to bluff with?', note: 'Folds to 3-bets often', read: 'tag' },
  merged: { none: 'Not on it', ask: 'Does this hand join your value 3-bets?', note: 'Opens a wide range', read: 'lag' },
};

function reason(chart, hand) {
  const cat = chart.category(chart.categoryOf(hand));
  const all = chart.categories.map((c) => `${c.label.toLowerCase()}s ${c.shorthand}`).join('; ');
  return cat
    ? `${hand} is a ${cat.label.toLowerCase()} on the ${chart.name.toLowerCase()} chart (${cat.shorthand}).`
    : `${hand} is not on the ${chart.name.toLowerCase()} chart: ${all}.`;
}

/** A hand, a chart and the question "where does it go?" */
export function nextChartSpot(getFilter) {
  return (round) => {
    const filter = getFilter();
    const chart = filter === 'ALL' ? pick(CHARTS) : CHARTS.find((c) => c.id === filter);
    const setting = SETTING[chart.id];
    const want = pick([null, ...chart.categories.map((c) => c.id), ...chart.categories.map((c) => c.id)]);
    const all = handsIn(chart, want);
    const fresh = all.filter((hand) => !round.recent.includes(`${chart.id}:${hand}`));
    const hand = weightedPick(fresh.length ? fresh : all,
      (x) => edgeWeight(chart.dist.get(x)) * boxWeight(stat(TOPIC, 'hands', `${chart.id}:${x}`)));
    const opener = pick(['MP', 'CO']);
    return {
      key: `${chart.id}:${hand}`,
      title: chart.title,
      banner: `Chart: ${chart.title}`,
      hero: { seat: 'BTN', hand },
      reads: { [opener]: setting.read || 'unknown' },
      notes: setting.note ? { [opener]: setting.note } : undefined,
      action: [[opener, 'raise', 3]],
      question: setting.ask,
      options: [{ id: 'none', label: setting.none }, ...chart.categories.map((c) => ({ id: c.id, label: c.label }))],
      correct: [chart.categoryOf(hand) || 'none'],
      why: reason(chart, hand),
      lens: { chart, hand },
      quick: true,
    };
  };
}

// The practice spots, grouped the way the lessons run.
export const GROUPS = [
  { value: 'ALL', label: 'All', lessons: null },
  { value: 'bet', label: '3-betting', lessons: ['value', 'merged', 'bluff'] },
  { value: 'face', label: 'Facing one', lessons: ['face3', 'adjust'] },
  { value: 'four', label: '4-bets', lessons: ['4bet', 'face4'] },
];
