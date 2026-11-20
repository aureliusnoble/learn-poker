// 3-betting and 4-betting: the lessons, the charts and the drills.
import { h, fill } from '../dom.js';
import { shell } from '../components.js';
import { LESSONS, SPOTS, FOUR_BET } from '../data/threebet.js';
import { lessonCards, chartStudy } from '../feedback.js';
import { spotDrill, deckOf } from '../spotdrill.js';
import { topicProgress } from '../topicprogress.js';
import { TOPIC, CHARTS, GROUPS, nextChartSpot } from './model.js';

const lesson = (...ids) => LESSONS.filter((l) => ids.includes(l.id));
const study = { id: 'depolarized' };
let chartFilter = 'ALL';
let group = 'ALL';

function ladder() {
  const rungs = [['1', 'Blinds'], ['2', 'Open-raise'], ['3', '3-bet'], ['4', '4-bet'], ['5', 'All-in']];
  return h('ol', { class: 'ladder', 'aria-label': 'The raising ladder' },
    rungs.map(([n, name], i) => h('li', null, h('i', { style: `height:${14 + i * 12}px` }), h('b', null, n), name)));
}

function fourBetFacts() {
  const range = ([a, b]) => `${a} to ${b}`;
  const row = (k, v) => h('tr', null, h('th', { scope: 'row' }, k), h('td', null, v));
  return h('table', { class: 'sum' }, h('tbody', null,
    row('Value 4-bets', FOUR_BET.value.join(', ')),
    row('Add against loose players', 'AK, QQ, JJ'),
    row('Size in position', `${range(FOUR_BET.sizeInPosition)} times the 3-bet`),
    row('Size out of position', `${range(FOUR_BET.sizeOutOfPosition)} times the 3-bet`),
    row('Open size when 3-bet a lot', `${FOUR_BET.smallerOpen[0]}bb to ${FOUR_BET.smallerOpen[1]}bb from CO and BTN`)));
}

export function learnThreeBet(root) {
  const main = shell(root, { title: '3-betting', back: 'home' });
  const draw = () => fill(main,
    lessonCards(lesson('ladder')),
    ladder(),
    lessonCards(lesson('value', 'merged', 'bluff')),
    h('h2', { class: 'h2' }, 'The charts'),
    chartStudy(CHARTS, study, draw),
    lessonCards(lesson('face3', 'adjust', '4bet')),
    fourBetFacts(),
    lessonCards(lesson('face4')));
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
    next: (round) => deckOf(pool(), TOPIC, 'spots')(round),
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
