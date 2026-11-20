// Study page: one seat at a time, as a chart, as cut-offs, and as what it adds.
import { h, fill } from '../dom.js';
import { shell, segmented, rangeGrid, legend, handTag } from '../components.js';
import { POS, POSITIONS, LADDER, NOTE_ROWS, OPEN_SIZE_BB, firstSeat, additions, rowLabel, sortHands } from '../ranges.js';
import { MEMORY_HOOKS } from '../data/preflop-ranges.js';

let seat = 'UTG';

export function learnOpen(root) {
  const main = shell(root, { title: 'Opening ranges', back: 'ch-open' });

  function draw() {
    const pos = POS[seat];
    const src = pos.sameAs || seat;
    const rung = LADDER.indexOf(src);

    const grid = rangeGrid({ variant: 'grid--study' });
    grid.paint((hand) => {
      const first = firstSeat(hand);
      return first >= 0 && first <= rung ? `is-l${first}` : '';
    });
    grid.el.setAttribute('role', 'img');
    grid.el.setAttribute('aria-label', `${pos.name} opening range`);

    const added = rung > 0 ? additions(LADDER[rung - 1], src) : sortHands(POS[src].hands);

    fill(main,
      segmented(POSITIONS.map((p) => ({ value: p.id, label: p.id })), seat, (v) => { seat = v; draw(); }, 'Seat'),

      h('section', { class: 'headline' },
        h('div', null,
          h('p', { class: 'eyebrow' }, pos.name),
          h('p', { class: 'headline__figure' }, `${pos.pct.toFixed(1)}%`, h('span', null, ' of hands'))),
        h('p', { class: 'sizing' }, 'Open by raising to ', h('strong', null, `${OPEN_SIZE_BB}bb`), '. Everything else folds.')),

      pos.sameAs ? h('p', { class: 'note' }, `The small blind opens exactly the ${POS[pos.sameAs].name.toLowerCase()} range.`) : null,

      grid.el,
      legend(LADDER.slice(0, rung + 1).map((id, i) => ({ cls: `is-l${i}`, label: i === 0 ? `Opens from ${id}` : `Added at ${id}` }))),

      h('section', { class: 'block' },
        h('h2', { class: 'h2' }, rung > 0 ? `What ${src} adds to ${LADDER[rung - 1]}` : 'The core: these open from every seat'),
        h('p', { class: 'chips' }, added.map((hand) => handTag(hand))),
        h('p', { class: 'hint' }, `${added.length} hands`)),

      h('section', { class: 'block' },
        h('h2', { class: 'h2' }, 'Cut-offs'),
        h('p', { class: 'hint' }, 'The weakest hand each seat opens in each row. A plus means that hand and everything stronger.'),
        cutoffTable(src)),

      h('section', { class: 'block' },
        h('h2', { class: 'h2' }, 'Ways to remember it'),
        h('ul', { class: 'hooks' }, MEMORY_HOOKS.map((text) => h('li', null, text)))),
    );
  }

  draw();
}

function cutoffTable(current) {
  return h('div', { class: 'tablewrap' },
    h('table', { class: 'cutoffs' },
      h('thead', null, h('tr', null,
        h('th', { scope: 'col' }, 'Row'),
        LADDER.map((id) => h('th', { scope: 'col', class: id === current ? 'is-current' : '' }, id === 'CO' ? 'CO · SB' : id)))),
      h('tbody', null, NOTE_ROWS.map((key) => h('tr', null,
        h('th', { scope: 'row' }, rowLabel(key)),
        LADDER.map((id) => h('td', { class: id === current ? 'is-current' : '' }, POS[id].rows[key].label || '–')))))));
}
