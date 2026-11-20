// Feedback and study tools shared by every tutorial: the factors behind a
// decision, the arithmetic of a call, a chart with the hand marked, lesson
// cards, and a chart browser.
import { h, pct } from './dom.js';
import { rangeGrid, legend, segmented, handTag, ICON } from './components.js';
import { bb } from './table.js';

const MARK = {
  for: { cls: 'factor--for', icon: ICON.check, word: 'For' },
  against: { cls: 'factor--against', icon: ICON.cross, word: 'Against' },
  neutral: { cls: 'factor--neutral', icon: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>', word: 'Neutral' },
};

/**
 * The considerations behind a judgement call, each marked for or against.
 * factors: [[criterionId, 'for' | 'against' | 'neutral', text]]
 */
export function factorList(factors, criteria) {
  const nameOf = Object.fromEntries(criteria.map((c) => [c.id, c.name]));
  return h('ul', { class: 'factors' }, factors.map(([id, side, text]) => {
    const m = MARK[side] || MARK.neutral;
    return h('li', { class: `factor ${m.cls}` },
      h('span', { class: 'factor__mark', html: m.icon, role: 'img', 'aria-label': m.word }),
      h('span', null, h('strong', null, nameOf[id] || id), `: ${text}`));
  }));
}

/** The set-mining sum: what the call needs to win, against what is there to win. */
export function setMath({ call, effective }, { rule = 15, breakEven = 9 } = {}) {
  const need = call * rule;
  const even = call * breakEven;
  const ratio = effective / call;
  const row = (label, value, note, cls = '') => h('tr', { class: cls },
    h('th', { scope: 'row' }, label), h('td', null, value), h('td', null, note || ''));
  return h('table', { class: 'sum' },
    h('tbody', null,
      row('To call', bb(call)),
      row(`Need at ${rule} to 1`, bb(need), effective >= need ? 'Covered' : 'Not covered', effective >= need ? 'sum--yes' : 'sum--no'),
      row(`Break-even at ${breakEven} times`, bb(even), effective >= even ? 'Covered' : 'Not covered', effective >= even ? 'sum--yes' : 'sum--no'),
      row('Most you can win', bb(effective), `${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)} times the call`)));
}

/** A small chart with its categories coloured and one hand ringed. */
export function rangeLens(chart, hand) {
  const grid = rangeGrid({ labels: false, variant: 'grid--mini' });
  grid.paint((cell) => `${chart.classOf(cell)} ${cell === hand ? 'is-focus' : ''}`);
  grid.el.setAttribute('role', 'img');
  grid.el.setAttribute('aria-label', `${chart.title || chart.name} with ${hand} marked`);
  return h('div', { class: 'lens' },
    grid.el,
    h('div', { class: 'lens__key' },
      h('p', { class: 'lens__title' }, chart.title || chart.name),
      legend(chart.categories.map((c) => ({ cls: c.cls, label: c.label })))));
}

/**
 * The short version of a tutorial: what to know as label and answer pairs,
 * then a few ways to remember it.
 * blocks: [{ title, rows: [[label, answer]] }]
 */
export function cheatSheet(blocks, tricks = []) {
  return h('div', { class: 'cheat' },
    blocks.map((block) => h('section', { class: 'cheat__block' },
      h('h2', { class: 'h2' }, block.title),
      h('dl', { class: 'cheat__rows' }, block.rows.map(([k, v]) => h('div', null, h('dt', null, k), h('dd', null, v)))))),
    tricks.length
      ? h('section', { class: 'cheat__block' },
        h('h2', { class: 'h2' }, 'Ways to remember it'),
        h('ul', { class: 'hooks' }, tricks.map((t) => h('li', null, t))))
      : null);
}

/** The longer explanation, folded away for when it is wanted. */
export function moreDetail(lessons) {
  return h('details', { class: 'more' }, h('summary', null, 'The reasoning in full'), lessonCards(lessons));
}

/** The core lessons of a tutorial as short cards. */
export function lessonCards(lessons) {
  return h('div', { class: 'lessons' }, lessons.map((lesson) =>
    h('section', { class: 'lesson' },
      h('h2', { class: 'h2' }, lesson.title),
      // A point is a sentence, or a [name, sentence] pair for a named idea.
      h('ul', { class: 'lesson__points' }, lesson.points.map((p) =>
        h('li', null, Array.isArray(p) ? [h('strong', null, p[0]), `. ${p[1]}`] : p))))));
}

/**
 * A browser for a set of categorised charts: pick one, see it drawn, with each
 * category's shorthand and share of hands. `state.id` remembers the choice.
 */
export function chartStudy(charts, state, redraw, { extra } = {}) {
  const chart = charts.find((c) => c.id === state.id) || charts[0];
  const grid = rangeGrid({ variant: 'grid--study' });
  grid.paint((hand) => `${chart.classOf(hand)} ${chart.optional.has(hand) ? 'is-optional' : ''}`);
  grid.el.setAttribute('role', 'img');
  grid.el.setAttribute('aria-label', chart.title || chart.name);

  return h('section', { class: 'block' },
    segmented(charts.map((c) => ({ value: c.id, label: c.name })), chart.id, (id) => { state.id = id; redraw(); }, 'Chart'),
    h('div', { class: 'headline' },
      h('div', null,
        h('p', { class: 'eyebrow' }, chart.title || chart.name),
        h('p', { class: 'headline__figure' },
          chart.figure ? chart.figure[0] : `${chart.pct.toFixed(1)}%`,
          h('span', null, chart.figure ? chart.figure[1] : ' of hands')))),
    chart.blurb ? h('p', { class: 'lede' }, chart.blurb) : null,
    grid.el,
    h('ul', { class: 'catlist' }, chart.categories.map((c) => h('li', null,
      h('span', { class: `legend__swatch ${c.cls}` }),
      h('span', { class: 'catlist__name' }, c.label),
      h('span', { class: 'catlist__pct' }, `${c.pct.toFixed(1)}% of hands`),
      h('span', { class: 'catlist__hands' }, c.shorthand)))),
    chart.optional.size
      ? h('p', { class: 'hint' }, h('span', { class: 'legend__swatch is-blank is-optional' }), ' Dotted: can also be 3-bet for value.')
      : null,
    chart.note ? h('p', { class: 'note' }, chart.note) : null,
    extra ? extra(chart) : null);
}

export { handTag, pct };
