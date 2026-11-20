// Progress over time: is the score on each exercise getting better?
import { h, fill } from './dom.js';
import { shell } from './components.js';
import { logOf } from './store.js';
import { SITUATIONS } from './play.js';
import {
  series, momentum, trendWord, sparkSvg, chartSvg, dayLabel, asPct, WINDOW, FEW,
} from './trend.js';

// Every exercise that keeps a history, grouped the way the home page is.
const GROUPS = [
  {
    title: 'Simulator',
    items: [
      { id: 'sim/all', name: 'All situations', route: 'play' },
      ...SITUATIONS.map((s) => ({ id: `sim/${s.value}`, name: s.name, route: 'play' })),
    ],
  },
  {
    title: 'Table skills',
    items: [
      { id: 'table/seats', name: 'Find your seat', route: 'seats' },
      { id: 'table/sizes', name: 'Size the raise', route: 'sizes' },
      { id: 'table/facts', name: 'Quick facts', route: 'facts' },
    ],
  },
  {
    title: 'Opening ranges',
    items: [
      { id: 'open/drill', name: 'Raise or fold', route: 'open-drill' },
      { id: 'open/edges', name: 'Find the cut-off', route: 'open-edges' },
      { id: 'open/paint', name: 'Paint the range', route: 'open-paint' },
      { id: 'open/layers', name: "What's new?", route: 'open-layers' },
    ],
  },
  {
    title: '3-betting',
    items: [
      { id: 'threebet/charts', name: 'Which 3-bet?', route: 'tb-charts' },
      { id: 'threebet/spots', name: 'Play the spot', route: 'tb-spots' },
    ],
  },
  {
    title: 'Cold-calling and set mining',
    items: [
      { id: 'coldcall/drill', name: 'Call, 3-bet or fold', route: 'call-drill' },
      { id: 'coldcall/spots', name: 'Read the table', route: 'call-spots' },
      { id: 'coldcall/sets', name: 'Set mining', route: 'call-sets' },
    ],
  },
  {
    title: 'Limpers',
    items: [
      { id: 'limp/drill', name: 'Limpers in front', route: 'limp-drill' },
      { id: 'limp/spots', name: 'Read the limper', route: 'limp-spots' },
    ],
  },
  {
    title: 'Squeezing and over-calling',
    items: [
      { id: 'squeeze/drill', name: 'A raise and a caller', route: 'sq-drill' },
      { id: 'squeeze/spots', name: 'Squeeze or over-call?', route: 'sq-spots' },
    ],
  },
  {
    title: 'Stealing and blind defence',
    items: [
      { id: 'blinds/steal', name: 'Steal the blinds', route: 'bl-steal' },
      { id: 'blinds/defend', name: 'Defend your blind', route: 'bl-defend' },
      { id: 'blinds/sums', name: 'Steal sums and spots', route: 'bl-sums' },
    ],
  },
];

const ARROW = {
  up: '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M6 1.5 11 10H1Z" fill="currentColor"/></svg>',
  down: '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M6 10.5 1 2h10Z" fill="currentColor"/></svg>',
  level: '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M1.5 4.5h9M1.5 7.5h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

/** Up, down or level, said with a mark and words, never colour alone. */
function change(m, long = false) {
  const word = trendWord(m.delta);
  if (!word) return null;
  return h('span', { class: `change change--${word.dir}`, title: `${word.text} on the ${WINDOW} answers before` },
    h('span', { html: ARROW[word.dir] }),
    long ? word.text : word.short,
    long ? null : h('span', { class: 'sr' }, ` ${word.dir === 'level' ? '' : word.dir}`));
}

/** 'today', 'yesterday', or the date as written. */
function lastPlayed(key) {
  const label = dayLabel(key);
  return label === 'Today' || label === 'Yesterday' ? label.toLowerCase() : label;
}

/** What the headline number is, in words. */
function basis(m) {
  if (m.now == null) return m.nNow ? `${m.nNow} ${m.nNow === 1 ? 'answer' : 'answers'} so far. A score shows after 10.` : 'No answers yet.';
  const from = `Last ${m.nNow} answers`;
  if (m.delta == null) return `${from}. A comparison shows once there are 10 more before them.`;
  return `${from}: ${asPct(m.now)}. The ${m.nBefore} before: ${asPct(m.before)}.`;
}

/** The full chart for one exercise, with the day under your finger spelled out and a table below. */
function detail(entry, state, redraw, { route = null } = {}) {
  const s = series(entry);
  if (!s.points.length) return h('p', { class: 'hint' }, 'Nothing in the last 60 days.');
  const at = Math.min(state.day == null ? s.points.length - 1 : state.day, s.points.length - 1);
  const p = s.points[at];
  const chart = h('div', { class: 'tchart-wrap', html: chartSvg(s, at) });
  chart.addEventListener('click', (e) => {
    const hit = e.target.closest('.tc-hit');
    if (!hit) return;
    state.day = Number(hit.dataset.i);
    redraw();
  });
  const few = s.points.some((x) => x.n < FEW);
  return h('div', { class: 'trend-detail' },
    chart,
    h('p', { class: 'trend-day' }, h('strong', null, dayLabel(p.key)), `: ${asPct(p.pct)} right, from ${p.n} ${p.n === 1 ? 'answer' : 'answers'}`),
    few ? h('p', { class: 'hint' }, `Hollow dots are days with fewer than ${FEW} answers: too few to read much into.`) : null,
    h('details', { class: 'more' },
      h('summary', null, 'Every day as a table'),
      h('table', { class: 'sum' },
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Day'), h('th', { scope: 'col' }, 'Right'), h('th', { scope: 'col' }, 'Answers'))),
        h('tbody', null, [...s.points].reverse().map((x) => h('tr', null,
          h('th', { scope: 'row' }, dayLabel(x.key)), h('td', null, asPct(x.pct)), h('td', null, String(x.n))))))),
    route ? h('a', { class: 'btn btn--quiet', href: `#${route}` }, 'Practise this') : null);
}

export function trendsPage(root) {
  const main = shell(root, { title: 'Progress over time', back: 'home' });
  const view = { open: null, day: null, allDay: null };

  function row(item) {
    const entry = logOf(item.id);
    const m = momentum(entry);
    const s = series(entry);
    const open = view.open === item.id;
    const last = s.points[s.points.length - 1];
    return h('li', { class: open ? 'trend is-open' : 'trend' },
      h('button', {
        type: 'button',
        class: 'trend__row',
        'aria-expanded': String(open),
        onclick: () => { view.open = open ? null : item.id; view.day = null; draw(); },
      },
        h('span', { class: 'trend__name' }, item.name,
          h('span', { class: 'trend__sub' }, `${s.total} ${s.total === 1 ? 'answer' : 'answers'}${last ? ` · ${lastPlayed(last.key)}` : ''}`)),
        h('span', { class: 'trend__spark', html: sparkSvg(s) }),
        h('span', { class: 'trend__now' }, m.now == null ? '–' : asPct(m.now)),
        h('span', { class: 'trend__change' }, change(m))),
      open
        ? h('div', { class: 'trend__body' },
          h('p', { class: 'hint' }, basis(m)),
          detail(entry, view, draw, { route: item.route }))
        : null);
  }

  function draw() {
    const all = logOf('all');
    const m = momentum(all);
    const started = [];
    const waiting = [];
    for (const group of GROUPS) {
      const items = group.items.filter((it) => logOf(it.id));
      if (items.length) started.push({ title: group.title, items });
      waiting.push(...group.items.filter((it) => !logOf(it.id)).map((it) => it.name));
    }

    fill(main,
      h('section', { class: 'block' },
        h('div', { class: 'headline' },
          h('div', null,
            h('p', { class: 'eyebrow' }, 'All practice'),
            h('p', { class: 'headline__figure' }, m.now == null ? '–' : asPct(m.now), h('span', null, m.now == null ? '' : ' right lately'))),
          change(m, true)),
        h('p', { class: 'hint' }, basis(m)),
        all ? detail(all, { get day() { return view.allDay; }, set day(v) { view.allDay = v; } }, draw)
          : h('p', { class: 'note' }, 'Nothing recorded yet. Play any drill and its line starts here.')),

      started.length
        ? h('p', { class: 'hint' }, `Each exercise below shows its score over its last ${WINDOW} answers, and whether that is up or down on the ${WINDOW} before. Tap one for its chart.`)
        : all ? h('p', { class: 'note' }, 'Each exercise keeps its own line from now on. Play one and it appears below.') : null,

      started.map((group) => h('section', { class: 'block' },
        h('h2', { class: 'h2' }, group.title),
        h('ul', { class: 'trends' }, group.items.map(row)))),

      waiting.length && started.length
        ? h('p', { class: 'hint' }, `Not played yet: ${waiting.join(', ')}.`)
        : null,
    );
  }

  draw();
}
