// 3-betting and 4-betting: the lessons, the charts and the drills.
import { h, fill } from '../dom.js';
import { shell } from '../components.js';
import { LESSONS, SPOTS, CHEAT, TRICKS } from '../data/threebet.js';
import { VALUE_BY_OPENER as VALUE_RANGES } from '../data/squeeze.js';
import { cheatSheet, moreDetail, chartStudy } from '../feedback.js';
import { spotDrill, deckOf } from '../spotdrill.js';
import { topicProgress } from '../topicprogress.js';
import { threeBetSize, fourBetSize } from '../sizing.js';
import { TOPIC, CHARTS, GROUPS, nextChartSpot } from './model.js';

const study = { id: 'depolarized' };
let chartFilter = 'ALL';
let group = 'ALL';

function ladder() {
  const rungs = [['1', 'Blinds'], ['2', 'Open-raise'], ['3', '3-bet'], ['4', '4-bet'], ['5', 'All-in']];
  return h('ol', { class: 'ladder', 'aria-label': 'The raising ladder' },
    rungs.map(([n, name], i) => h('li', null, h('i', { style: `height:${14 + i * 12}px` }), h('b', null, n), name)));
}

// The value range depends on who raised.
const VALUE_BY_OPENER = {
  title: 'Value 3-bets, by who raised',
  rows: VALUE_RANGES.map((v) => [`${v.id} raises`, `${v.default.join(', ')} · maybe ${v.optional.join(', ')}`]),
};

export function learnThreeBet(root) {
  const main = shell(root, { title: '3-betting', back: 'home' });
  const draw = () => fill(main,
    ladder(),
    cheatSheet([CHEAT[0], VALUE_BY_OPENER, ...CHEAT.slice(1)], TRICKS),
    h('h2', { class: 'h2' }, 'The charts'),
    chartStudy(CHARTS, study, draw),
    moreDetail(LESSONS));
  draw();
}

export function chartDrill(root) {
  return spotDrill(root, {
    title: 'Which 3-bet?',
    back: 'home',
    topic: TOPIC,
    bucket: 'hands',
    total: 20,
    next: nextChartSpot(() => chartFilter),
    filter: {
      label: 'Chart',
      options: [{ value: 'ALL', label: 'All' }, ...CHARTS.map((c) => ({ value: c.id, label: c.name }))],
      get: () => chartFilter,
      set: (v) => { chartFilter = v; },
    },
  });
}

export function spotsDrill(root) {
  const pool = () => {
    const lessons = GROUPS.find((g) => g.value === group).lessons;
    return lessons ? SPOTS.filter((s) => lessons.includes(s.lesson)) : SPOTS;
  };
  return spotDrill(root, {
    title: 'Play the spot',
    back: 'home',
    topic: TOPIC,
    bucket: 'spots',
    total: 12,
    // A spot whose answer is a raise also asks for its size.
    next: (round) => {
      const spot = deckOf(pool(), TOPIC, 'spots')(round);
      if (spot.size || !spot.hero) return spot;
      if (spot.options.includes('3bet') && spot.correct.includes('3bet')) return { ...spot, size: threeBetSize(spot) };
      if (spot.options.includes('4bet') && spot.correct.includes('4bet')) return { ...spot, size: fourBetSize(spot) };
      return spot;
    },
    filter: {
      label: 'Lessons',
      options: GROUPS.map(({ value, label }) => ({ value, label })),
      get: () => group,
      set: (v) => { group = v; },
    },
  });
}

export function progressThreeBet(root) {
  topicProgress(root, {
    title: 'Progress',
    back: 'home',
    topic: TOPIC,
    name: '3-betting',
    buckets: ['hands', 'spots'],
    charts: {
      list: CHARTS,
      bucket: 'hands',
      describe: (chart, hand) => {
        const cat = chart.category(chart.categoryOf(hand));
        return cat ? `${cat.label} on this chart.` : 'Not on this chart.';
      },
    },
    decks: GROUPS.filter((g) => g.lessons).map((g) => ({
      label: g.label === 'Facing one' ? 'Facing a 3-bet' : g.label,
      bucket: 'spots',
      spots: SPOTS.filter((s) => g.lessons.includes(s.lesson)),
    })),
  });
}
