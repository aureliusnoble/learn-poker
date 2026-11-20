// Cold-calling and set mining: the lessons, the calculator and the drills.
import { aSeat } from '../table.js';
import { h, fill } from '../dom.js';
import { shell, handTag } from '../components.js';
import { LESSONS, CRITERIA, SET_CRITERIA, EQUITY_EXAMPLE, SET_MINING, CALL_SPOTS, SET_SPOTS, CALL_CHARTS, CHEAT, TRICKS } from '../data/coldcall.js';
import { cheatSheet, lessonCards, chartStudy, setMath } from '../feedback.js';
import { spotDrill, deckOf } from '../spotdrill.js';
import { topicProgress } from '../topicprogress.js';
import { TOPIC, CHARTS, nextCallSpot, nextSetSum } from './model.js';

const study = { id: 'UTG' };
let filter = 'ALL';

function gapBar() {
  return h('figure', { class: 'gapbar', role: 'img', 'aria-label': "Across the raiser's range from weakest to strongest: fold, then call, then 3-bet" },
    h('div', { class: 'gapbar__ends' }, h('span', null, 'Weakest hands'), h('span', null, 'Strongest hands')),
    h('div', { class: 'gapbar__zones' }, h('span', null, 'Fold'), h('span', null, 'Call'), h('span', null, '3-bet')));
}

function equityExample() {
  return h('section', { class: 'block' },
    h('h2', { class: 'h2' }, 'Two hands against a tight UTG range'),
    h('p', { class: 'hint' }, EQUITY_EXAMPLE.range),
    h('table', { class: 'duel' }, h('tbody', null, EQUITY_EXAMPLE.hands.map((x) => h('tr', null,
      h('th', { scope: 'row' }, handTag(x.hand)),
      h('td', null, `${x.equity}%`),
      h('td', null, `${x.verdict === 'call' ? 'Call' : 'Fold'}. ${x.why}`))))));
}

const BY_OPENER = {
  title: 'Against a raise, by who raised',
  rows: CALL_CHARTS.flatMap((c) => [
    [`${c.id} raises: 3-bet`, c.value3bet.join(', ')],
    [`${c.id} raises: call`, c.callLine],
  ]),
};

export function learnCall(root) {
  const main = shell(root, { title: 'Cold-calling and set mining', back: 'home' });
  const draw = () => fill(main,
    gapBar(),
    cheatSheet([BY_OPENER, ...CHEAT], TRICKS),
    h('h2', { class: 'h2' }, 'The charts'),
    chartStudy(CHARTS, study, draw, {
      extra: (chart) => h('p', { class: 'hint' },
        `The gap concept hands are ${chart.source.gapPct}% of hands and have ${chart.source.gapEquity}% equity against the range a conservative ${chart.id} player opens.`),
    }),
    h('a', { class: 'btn btn--quiet', href: '#call-tool' }, 'Open the set-mining sums'),
    h('details', { class: 'more' }, h('summary', null, 'The reasoning in full'), lessonCards(LESSONS), equityExample()));
  draw();
}

/** Sliders for the set-mining sum: the call, the money behind, and what the rule says. */
export function setTool(root) {
  const main = shell(root, { title: 'Set-mining sums', back: 'home' });
  const state = { call: 3, effective: 100 };
  const out = h('div');
  const callOut = h('output', { for: 'calc-call' });
  const stackOut = h('output', { for: 'calc-stack' });

  function verdict() {
    const { call, effective } = state;
    if (effective >= call * SET_MINING.ruleMultiple) return 'Deep enough. Now check the opponent: a strong hand often enough, and the type to pay you off.';
    if (effective >= call * SET_MINING.breakEvenMultiple) return 'Past break-even but short of 15 to 1. Only call against someone very strong who will not fold, like a nit who has 3-bet.';
    return 'Not enough behind to mine for a set. Fold.';
  }
  function update() {
    callOut.textContent = `${state.call}bb`;
    stackOut.textContent = `${state.effective}bb`;
    fill(out, setMath(state), h('p', { class: 'note' }, verdict()));
  }
  const slider = (id, label, output, key, min, max, step) => h('div', { class: 'calc__row' },
    h('label', { for: id }, label, output),
    h('input', {
      id, type: 'range', min, max, step, value: state[key],
      oninput: (e) => { state[key] = Number(e.target.value); update(); },
    }));

  fill(main,
    h('section', { class: 'block' },
      h('h2', { class: 'h2' }, 'How often a small pair hits'),
      h('div', { class: 'dots', role: 'img', 'aria-label': '2 flops in 17 bring a set or better' },
        Array.from({ length: 17 }, (_, i) => h('i', { class: i === 5 || i === 13 ? 'is-hit' : '' }))),
      h('p', { class: 'hint' }, `A set or better on ${SET_MINING.flopSetPct}% of flops: about 1 in 8.5, or 2 in every 17.`)),
    h('section', { class: 'calc' },
      slider('calc-call', 'The call', callOut, 'call', 2, 12, 0.5),
      slider('calc-stack', 'Effective stack', stackOut, 'effective', 10, 250, 5),
      out),
    h('section', { class: 'block' },
      h('h2', { class: 'h2' }, 'Three checks before you call'),
      h('ul', { class: 'lesson__points' }, SET_CRITERIA.map((c) => h('li', null, h('strong', null, c.name), `. ${c.text}`)))),
    h('p', { class: 'hint' }, 'The effective stack is the smaller of your stack and theirs. It is the most you can win from them.'),
    h('a', { class: 'btn btn--primary', href: '#call-sets' }, 'Practise it'));
  update();
}

export function callDrill(root) {
  return spotDrill(root, {
    title: 'Call, 3-bet or fold',
    log: 'coldcall/drill',
    back: 'home',
    topic: TOPIC,
    bucket: 'hands',
    total: 20,
    next: nextCallSpot(() => filter),
    filter: {
      label: 'Opener',
      options: [{ value: 'ALL', label: 'All' }, ...CHARTS.map((c) => ({ value: c.id, label: `vs ${c.id}` }))],
      get: () => filter,
      set: (v) => { filter = v; },
    },
  });
}

export function callSpots(root) {
  return spotDrill(root, {
    title: 'Read the table',
    log: 'coldcall/spots',
    back: 'home',
    topic: TOPIC,
    bucket: 'spots',
    total: CALL_SPOTS.length,
    next: deckOf(CALL_SPOTS, TOPIC, 'spots'),
    criteria: CRITERIA,
  });
}

export function setDrill(root) {
  const book = deckOf(SET_SPOTS, TOPIC, 'sets');
  let turn = 0;
  return spotDrill(root, {
    title: 'Set mining',
    log: 'coldcall/sets',
    back: 'home',
    topic: TOPIC,
    bucket: 'sets',
    total: 10,
    depth: true,
    criteria: SET_CRITERIA,
    // Two sums, then a full hand from the book, so the arithmetic is warm when the judgement comes.
    next: (round) => ((turn++ % 3 === 2) ? book(round) : nextSetSum()),
  });
}

export function progressCall(root) {
  topicProgress(root, {
    title: 'Progress',
    back: 'home',
    topic: TOPIC,
    name: 'cold-calling and set mining',
    buckets: ['hands', 'spots', 'sets'],
    charts: {
      list: CHARTS,
      bucket: 'hands',
      describe: (chart, hand) => {
        const cat = chart.category(chart.categoryOf(hand));
        return cat ? `${cat.label} against ${aSeat(chart.id)} open.` : `Fold against ${aSeat(chart.id)} open.`;
      },
    },
    decks: [
      { label: 'Read the table', bucket: 'spots', spots: CALL_SPOTS },
      { label: 'Set-mining hands', bucket: 'sets', spots: SET_SPOTS },
    ],
  });
}
