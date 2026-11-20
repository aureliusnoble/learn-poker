// Paint the range: fill in a seat's chart from memory, then see the difference.
// In "layers" mode the tighter seat is filled in and only the additions are painted.
import { h, fill } from '../dom.js';
import { shell, segmented, rangeGrid, legend, handTag } from '../components.js';
import { POS, LADDER, ALL_HANDS, sortHands } from '../ranges.js';
import { record, recordPaint, batch, logAnswer } from '../store.js';
import { verdict } from '../drill.js';
import { TOPIC } from './model.js';

const lastStep = { blank: 0, layers: 0 };

export const paintDrill = (mode) => (root) => {
  const layered = mode === 'layers';
  const steps = layered
    ? LADDER.slice(1).map((to, i) => ({ key: `${LADDER[i]}>${to}`, from: LADDER[i], to, label: `${LADDER[i]} to ${to}` }))
    : LADDER.map((to) => ({ key: to, from: null, to, label: to === 'CO' ? 'CO · SB' : to }));
  const main = shell(root, { title: layered ? "What's new?" : 'Paint the range', back: 'home' });

  let step;
  let base;
  let target;
  let selected;
  let checked;

  function load(i) {
    lastStep[mode] = i;
    step = steps[i];
    base = step.from ? POS[step.from].hands : new Set();
    target = new Set([...POS[step.to].hands].filter((hand) => !base.has(hand)));
    selected = new Set();
    checked = null;
    draw();
  }

  function check() {
    const missed = sortHands([...target].filter((hand) => !selected.has(hand)));
    const extra = sortHands([...selected].filter((hand) => !target.has(hand)));
    const hits = target.size - missed.length;
    checked = { missed, extra, hits };
    const wrong = new Set([...missed, ...extra]);
    batch(() => {
      const share = Math.max(0, (hits - extra.length) / target.size);
      recordPaint(TOPIC, step.key, share);
      // A painted chart scores by how much of it was right.
      logAnswer(layered ? 'open/layers' : 'open/paint', share);
      // Feed the hand-by-hand record too: every slip, and every edge hand placed correctly.
      for (const hand of wrong) record(TOPIC, 'hands', `${step.to}:${hand}`, false, { countsToday: false });
      for (const hand of ALL_HANDS) {
        if (POS[step.to].dist.get(hand) === 1 && !base.has(hand) && !wrong.has(hand)) {
          record(TOPIC, 'hands', `${step.to}:${hand}`, true, { countsToday: false });
        }
      }
    });
    draw();
  }

  function draw() {
    const grid = rangeGrid({ variant: checked ? 'grid--study' : 'grid--paint' });
    const missed = new Set(checked ? checked.missed : []);
    const extra = new Set(checked ? checked.extra : []);
    grid.paint((hand) =>
      base.has(hand) ? 'is-base'
        : missed.has(hand) ? 'is-missed'
        : extra.has(hand) ? 'is-extra'
        : selected.has(hand) ? 'is-sel' : '');

    const count = h('p', { class: 'paint__count' });
    const showCount = () => { count.textContent = `${selected.size} of ${target.size} painted`; };
    showCount();
    if (!checked) wirePainting(grid, { locked: base, selected, onChange: showCount });

    const to = POS[step.to];
    const prompt = layered
      ? `${step.from} is filled in. Add the ${target.size} hands that ${step.to} opens on top.`
      : `Paint every hand you open from ${to.id === 'CO' ? 'the cutoff or the small blind' : to.name.toLowerCase()}.`;

    const next = (lastStep[mode] + 1) % steps.length;

    fill(main,
      segmented(steps.map((s, i) => ({ value: i, label: s.label })), lastStep[mode], load, layered ? 'Step' : 'Seat'),
      h('p', { class: 'prompt' }, prompt),
      grid.el,
      checked ? resultBlock() : h('div', { class: 'paint__bar' },
        count,
        h('span', { class: 'hint' }, 'Tap a cell or drag across several')),
      checked
        ? h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn btn--quiet', onclick: () => load(lastStep[mode]) }, 'Try again'),
          h('button', { type: 'button', class: 'btn btn--primary', onclick: () => load(next) }, `Next: ${steps[next].label}`))
        : h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn btn--quiet', onclick: () => { selected.clear(); draw(); } }, 'Clear'),
          h('button', { type: 'button', class: 'btn btn--primary', onclick: check }, 'Check')),
    );
  }

  function resultBlock() {
    const { missed, extra, hits } = checked;
    const perfect = !missed.length && !extra.length;
    const line = perfect
      ? `All ${target.size} found, nothing extra.`
      : `${hits} of ${target.size} found${extra.length ? `, ${extra.length} that should not be there` : ''}.`;
    return h('section', { class: 'block' },
      verdict(perfect, line),
      perfect ? null : legend([
        { cls: 'is-sel', label: 'Right' },
        { cls: 'is-missed', label: 'Missed' },
        { cls: 'is-extra', label: 'Should fold' },
      ]),
      missed.length ? h('p', { class: 'chips' }, h('span', { class: 'chips__label' }, 'Missed'), missed.map(handTag)) : null,
      extra.length ? h('p', { class: 'chips' }, h('span', { class: 'chips__label' }, 'Should fold'), extra.map(handTag)) : null);
  }

  load(lastStep[mode]);
};

/** Tap toggles a cell; dragging carries the first cell's change across the rest. */
function wirePainting(grid, { locked, selected, onChange }) {
  let brush = null;

  const apply = (cell) => {
    if (!cell || !grid.el.contains(cell)) return;
    const hand = cell.dataset.hand;
    if (locked.has(hand) || selected.has(hand) === (brush === 'add')) return;
    if (brush === 'add') selected.add(hand); else selected.delete(hand);
    cell.classList.toggle('is-sel', brush === 'add');
    onChange();
  };
  const cellAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    return el && el.closest ? el.closest('.cell') : null;
  };

  grid.el.addEventListener('pointerdown', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell || locked.has(cell.dataset.hand)) return;
    e.preventDefault();
    brush = selected.has(cell.dataset.hand) ? 'remove' : 'add';
    apply(cell);
    try { grid.el.setPointerCapture(e.pointerId); } catch { /* not supported: taps still work */ }
  });
  grid.el.addEventListener('pointermove', (e) => { if (brush) apply(cellAt(e)); });
  const stop = () => { brush = null; };
  grid.el.addEventListener('pointerup', stop);
  grid.el.addEventListener('pointercancel', stop);
}
