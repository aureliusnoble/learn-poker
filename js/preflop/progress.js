// Progress: where the misses are, seat by seat and hand by hand.
import { h, pct, fill } from '../dom.js';
import { shell, segmented, rangeGrid, legend, meter, handTag } from '../components.js';
import { POS, POSITIONS } from '../ranges.js';
import { resetProgress, dayStreak } from '../store.js';
import { go } from '../nav.js';
import { TOPIC, handStat, seatSummary, totals, weakest, edgesKnown, verdictLine } from './model.js';

let seat = 'UTG';

/** Miss rate to one of four heat steps. */
function heat(st) {
  if (!st) return '';
  const rate = (st.n - st.c) / st.n;
  if (rate === 0) return 'is-seen';
  return rate <= 0.25 ? 'is-heat1' : rate <= 0.5 ? 'is-heat2' : rate <= 0.75 ? 'is-heat3' : 'is-heat4';
}

export function progressOpen(root) {
  const main = shell(root, { title: 'Progress', back: 'ch-open' });
  let focus = null;
  let confirming = false;

  function tile(label, value, unit) {
    return h('div', { class: 'tile' },
      h('p', { class: 'tile__label' }, label),
      h('p', { class: 'tile__value' }, value, unit ? h('span', null, unit) : null));
  }

  function heatMap() {
    const pos = POS[seat];
    const grid = rangeGrid({ variant: 'grid--study grid--tap' });
    grid.paint((hand) => `${heat(handStat(seat, hand))} ${pos.hands.has(hand) ? 'is-ranged' : ''} ${hand === focus ? 'is-focus' : ''}`);
    grid.el.addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell) return;
      focus = cell.dataset.hand === focus ? null : cell.dataset.hand;
      draw();
    });

    let detail = h('p', { class: 'hint' }, 'Tap a hand for its record. Bold hands are in the range.');
    if (focus) {
      const st = handStat(seat, focus);
      const record = st
        ? `${st.n} ${st.n === 1 ? 'answer' : 'answers'}, ${st.n - st.c} missed.`
        : 'Not asked yet.';
      detail = h('p', { class: 'detail' }, handTag(focus), h('span', { class: 'tag' }, seat), ` ${record} ${verdictLine(seat, focus)}`);
    }

    return h('section', { class: 'block' },
      h('h2', { class: 'h2' }, 'Where the misses are'),
      segmented(POSITIONS.map((p) => ({ value: p.id, label: p.id })), seat, (v) => { seat = v; focus = null; draw(); }, 'Seat'),
      grid.el,
      h('div', { class: 'scale' },
        legend([{ cls: 'is-blank', label: 'Not asked' }, { cls: 'is-seen', label: 'No misses' }]),
        h('div', { class: 'scale__ramp', role: 'img', 'aria-label': 'Darker means missed more often' },
          h('span', null, 'Missed'),
          ['is-heat1', 'is-heat2', 'is-heat3', 'is-heat4'].map((cls) => h('i', { class: `legend__swatch ${cls}` })),
          h('span', null, 'every time'))),
      detail);
  }

  function draw() {
    const t = totals();
    const weak = weakest(8);
    const edges = edgesKnown();

    fill(main,
      h('section', { class: 'tiles' },
        tile('Answers', String(t.n)),
        tile('Correct', t.n ? pct(t.c / t.n) : '–'),
        tile('Per decision', t.avgMs ? (t.avgMs / 1000).toFixed(1) : '–', t.avgMs ? 's' : ''),
        tile('Day streak', String(dayStreak()))),

      t.n ? null : h('p', { class: 'note' }, 'Nothing recorded yet. Play a round of Raise or fold and this page fills in.'),

      h('section', { class: 'block' },
        h('h2', { class: 'h2' }, 'By seat'),
        h('p', { class: 'hint' }, 'The bar is how many hands on the edge of each range you have got right twice running.'),
        h('ul', { class: 'seatrows' }, POSITIONS.map((p) => {
          const s = seatSummary(p.id);
          return h('li', null,
            h('span', { class: 'seatrows__name' }, p.id),
            meter(s.mastery, `${p.id} edge hands known`),
            h('span', { class: 'seatrows__num' }, pct(s.mastery)),
            h('span', { class: 'seatrows__acc' }, s.n ? `${pct(s.c / s.n)} correct · ${s.n} ${s.n === 1 ? 'answer' : 'answers'}` : 'No answers yet'));
        }))),

      heatMap(),

      h('section', { class: 'block' },
        h('h2', { class: 'h2' }, 'Weakest spots'),
        weak.length
          ? [
            h('ul', { class: 'weak' }, weak.map((w) => h('li', null,
              h('span', { class: 'weak__hand' }, handTag(w.hand), h('span', { class: 'tag' }, w.seat)),
              h('span', { class: 'weak__count' }, `missed ${w.misses} of ${w.n}`),
              h('span', { class: 'weak__rule' }, verdictLine(w.seat, w.hand))))),
            h('button', { type: 'button', class: 'btn btn--primary btn--wide', onclick: () => go('open-weak', { items: weak }) },
              `Drill ${weak.length === 1 ? 'this hand' : `these ${weak.length}`}`),
          ]
          : h('p', { class: 'hint' }, 'Hands you miss show up here until you get them right twice in a row.')),

      h('section', { class: 'block' },
        h('h2', { class: 'h2' }, 'Cut-offs'),
        h('div', { class: 'seatrows seatrows--single' },
          meter(edges.total ? edges.known / edges.total : 0, 'Cut-offs known'),
          h('span', { class: 'seatrows__acc' }, `${edges.known} of ${edges.total} known`))),

      h('section', { class: 'block block--reset' },
        confirming
          ? h('div', { class: 'confirm' },
            h('p', null, 'Erase every answer recorded for opening ranges?'),
            h('div', { class: 'actions' },
              h('button', { type: 'button', class: 'btn btn--quiet', onclick: () => { confirming = false; draw(); } }, 'Keep it'),
              h('button', { type: 'button', class: 'btn btn--danger', onclick: () => { resetProgress(TOPIC); confirming = false; focus = null; draw(); } }, 'Erase')))
          : h('button', { type: 'button', class: 'linkbtn', onclick: () => { confirming = true; draw(); } }, 'Reset progress for opening ranges')),
    );
  }

  draw();
}
