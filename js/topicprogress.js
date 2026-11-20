// A progress page any tutorial can use: totals, a miss heat map over its
// charts, and the state of each practice spot.
import { h, pct, fill } from './dom.js';
import { shell, segmented, rangeGrid, legend, handTag } from './components.js';
import { stat, bucketOf, resetProgress, dayStreak } from './store.js';
import { SOLID } from './drill.js';

/** Miss rate as one of four heat steps, or a quiet tint when nothing was missed. */
export function heatClass(st) {
  if (!st) return '';
  const rate = (st.n - st.c) / st.n;
  if (rate === 0) return 'is-seen';
  return rate <= 0.25 ? 'is-heat1' : rate <= 0.5 ? 'is-heat2' : rate <= 0.75 ? 'is-heat3' : 'is-heat4';
}

export function heatScale() {
  return h('div', { class: 'scale' },
    legend([{ cls: 'is-blank', label: 'Not asked' }, { cls: 'is-seen', label: 'No misses' }]),
    h('div', { class: 'scale__ramp', role: 'img', 'aria-label': 'Darker means missed more often' },
      h('span', null, 'Missed'),
      ['is-heat1', 'is-heat2', 'is-heat3', 'is-heat4'].map((cls) => h('i', { class: `legend__swatch ${cls}` })),
      h('span', null, 'every time')));
}

function pill(st) {
  if (!st) return h('span', { class: 'pill' }, 'New');
  if (st.b >= SOLID) return h('span', { class: 'pill pill--known' }, 'Known');
  if (st.n > st.c) return h('span', { class: 'pill pill--missed' }, `Missed ${st.n - st.c}`);
  return h('span', { class: 'pill' }, 'Seen once');
}

/**
 * cfg: { title, back, topic, name, buckets: [...], charts?: { list, bucket, describe(chart, hand) },
 *        decks?: [{ label, bucket, spots }] }
 */
export function topicProgress(root, cfg) {
  const main = shell(root, { title: cfg.title, back: cfg.back });
  const view = { chart: cfg.charts ? cfg.charts.list[0].id : null, focus: null, confirming: false };

  function totals() {
    let n = 0;
    let c = 0;
    for (const bucket of cfg.buckets) {
      for (const st of Object.values(bucketOf(cfg.topic, bucket))) {
        n += st.n;
        c += st.c;
      }
    }
    return { n, c };
  }

  function heatMap() {
    const { list, bucket, describe } = cfg.charts;
    const chart = list.find((c) => c.id === view.chart);
    const grid = rangeGrid({ variant: 'grid--study grid--tap' });
    grid.paint((hand) =>
      `${heatClass(stat(cfg.topic, bucket, `${chart.id}:${hand}`))} ${chart.hands.has(hand) ? 'is-ranged' : ''} ${hand === view.focus ? 'is-focus' : ''}`);
    grid.el.addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell) return;
      view.focus = cell.dataset.hand === view.focus ? null : cell.dataset.hand;
      draw();
    });
    let detail = h('p', { class: 'hint' }, 'Tap a hand for its record. Bold hands are on the chart.');
    if (view.focus) {
      const st = stat(cfg.topic, bucket, `${chart.id}:${view.focus}`);
      detail = h('p', { class: 'detail' }, handTag(view.focus),
        ` ${st ? `${st.n} ${st.n === 1 ? 'answer' : 'answers'}, ${st.n - st.c} missed.` : 'Not asked yet.'} ${describe(chart, view.focus)}`);
    }
    return h('section', { class: 'block' },
      h('h2', { class: 'h2' }, 'Where the misses are'),
      list.length > 1
        ? segmented(list.map((c) => ({ value: c.id, label: c.name })), chart.id, (id) => { view.chart = id; view.focus = null; draw(); }, 'Chart')
        : null,
      grid.el,
      heatScale(),
      detail);
  }

  function deck({ label, bucket, spots }) {
    return h('section', { class: 'block' },
      h('h2', { class: 'h2' }, label),
      h('ul', { class: 'status-list' }, spots.map((s) => {
        const st = stat(cfg.topic, bucket, s.key || s.id);
        const missed = st && st.n > st.c && st.b < SOLID;
        return h('li', null,
          h('span', null, s.hero && s.hero.hand ? [handTag(s.hero.hand), ' '] : null, s.title),
          pill(st),
          missed ? h('span', { class: 'status-list__why' }, s.why) : null);
      })));
  }

  function draw() {
    const t = totals();
    fill(main,
      h('section', { class: 'tiles tiles--three' },
        h('div', { class: 'tile' }, h('p', { class: 'tile__label' }, 'Answers'), h('p', { class: 'tile__value' }, String(t.n))),
        h('div', { class: 'tile' }, h('p', { class: 'tile__label' }, 'Correct'), h('p', { class: 'tile__value' }, t.n ? pct(t.c / t.n) : '–')),
        h('div', { class: 'tile' }, h('p', { class: 'tile__label' }, 'Day streak'), h('p', { class: 'tile__value' }, String(dayStreak())))),
      t.n ? h('a', { class: 'linkbtn', href: '#trends' }, 'See how your scores are changing over time')
        : h('p', { class: 'note' }, 'Nothing recorded yet. Play a drill and this page fills in.'),
      cfg.charts ? heatMap() : null,
      (cfg.decks || []).map(deck),
      h('section', { class: 'block block--reset' },
        view.confirming
          ? h('div', { class: 'confirm' },
            h('p', null, `Erase every answer recorded for ${cfg.name}?`),
            h('div', { class: 'actions' },
              h('button', { type: 'button', class: 'btn btn--quiet', onclick: () => { view.confirming = false; draw(); } }, 'Keep it'),
              h('button', { type: 'button', class: 'btn btn--danger', onclick: () => { resetProgress(cfg.topic); view.confirming = false; view.focus = null; draw(); } }, 'Erase')))
          : h('button', { type: 'button', class: 'linkbtn', onclick: () => { view.confirming = true; draw(); } }, `Reset progress for ${cfg.name}`)),
    );
  }

  draw();
}
