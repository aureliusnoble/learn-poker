// Shared interface pieces: the page frame, the 13x13 chart, playing cards, the seat strip.
import { h, pct } from './dom.js';
import { handAt, POS } from './ranges.js';

export const ICON = {
  back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  go: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  cross: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6.500 6.500l11 11M17.500 6.500l-11 11"/></svg>',
};

const SUIT_NAME = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
const SUIT_SHAPE = {
  s: '<path d="M12 2.5C12 2.5 21.5 9 21.5 14.6C21.5 17.2 19.5 19 17.1 19C15.6 19 14.2 18.3 13.3 17.2C13.5 19.2 14.2 20.6 15.5 21.5L8.5 21.5C9.8 20.6 10.5 19.2 10.7 17.2C9.8 18.3 8.4 19 6.9 19C4.5 19 2.5 17.2 2.5 14.6C2.5 9 12 2.5 12 2.5Z"/>',
  h: '<path d="M12 21.3C12 21.3 2.5 14.5 2.5 8.3C2.5 5.3 4.9 3 7.7 3C9.5 3 11.1 3.9 12 5.4C12.9 3.9 14.5 3 16.3 3C19.1 3 21.5 5.3 21.5 8.3C21.5 14.500 12 21.3 12 21.3Z"/>',
  d: '<path d="M12 2L20 12L12 22L4 12Z"/>',
  c: '<circle cx="12" cy="7.300" r="4.4"/><circle cx="6.800" cy="14" r="4.4"/><circle cx="17.2" cy="14" r="4.4"/><circle cx="12" cy="12.4" r="2.800"/><path d="M10.700 13C10.700 17.5 10 20.2 8.400 21.5L15.600 21.5C14 20.2 13.300 17.500 13.300 13Z"/>',
};
const suitSvg = (suit) =>
  `<svg viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="${SUIT_NAME[suit]}">${SUIT_SHAPE[suit]}</svg>`;

/** Lays out the page frame and returns the <main> to fill. `back` is a route name. */
export function shell(root, { title, back = null }) {
  const main = h('main', { class: 'page' });
  root.replaceChildren(
    h('div', { class: 'frame' },
      h('header', { class: 'bar' },
        back != null ? h('a', { class: 'bar__back', href: `#${back}`, 'aria-label': 'Back', html: ICON.back }) : null,
        h('h1', { class: back != null ? 'bar__title' : 'bar__title bar__title--home' }, title),
      ),
      main,
    ),
  );
  return main;
}

/** A one-of-many switch. The caller redraws on change. */
export function segmented(options, value, onChange, label) {
  return h('div', { class: 'seg', role: 'group', 'aria-label': label },
    options.map((o) => h('button', {
      type: 'button',
      class: o.value === value ? 'seg__btn is-on' : 'seg__btn',
      'aria-pressed': String(o.value === value),
      onclick: () => onChange(o.value),
    }, o.label)),
  );
}

export function meter(value, label) {
  const v = Math.max(0, Math.min(1, value || 0));
  return h('div', { class: 'meter', role: 'img', 'aria-label': `${label}: ${pct(v)}` },
    h('div', { class: 'meter__fill', style: `width:${(v * 100).toFixed(1)}%` }));
}

/** A hand code set in the display face: K9s */
export const handTag = (hand) => h('span', { class: 'hand' }, hand);

/**
 * The 13x13 chart. `paint(fn)` restyles every cell from fn(hand) -> class names.
 * Cells carry data-hand so callers can attach their own pointer handling.
 */
export function rangeGrid({ labels = true, variant = '' } = {}) {
  const el = h('div', { class: `grid ${variant}`.trim() });
  const cells = new Map();
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const hand = handAt(r, c);
      const cell = h('div', { class: 'cell', dataset: { hand } }, labels ? hand : null);
      cells.set(hand, cell);
      el.append(cell);
    }
  }
  const paint = (fn) => {
    for (const [hand, cell] of cells) cell.className = `cell ${fn(hand) || ''}`.trim();
  };
  return { el, cells, paint };
}

/** A small unlabelled chart of one seat's range with one hand ringed. */
export function miniMap(seatId, focusHand) {
  const grid = rangeGrid({ labels: false, variant: 'grid--mini' });
  grid.paint((hand) => `${POS[seatId].hands.has(hand) ? 'is-in' : ''} ${hand === focusHand ? 'is-focus' : ''}`);
  grid.el.setAttribute('role', 'img');
  grid.el.setAttribute('aria-label', `${seatId} range with ${focusHand} marked`);
  return grid.el;
}

export function legend(items) {
  return h('ul', { class: 'legend' },
    items.map((it) => h('li', null, h('span', { class: `legend__swatch ${it.cls}` }), it.label)));
}

// ---- Cards

const SUITS = ['s', 'h', 'd', 'c'];

/** Picks suits that show the hand honestly: one suit if suited, two if not. */
export function dealSuits(hand) {
  const a = SUITS[Math.floor(Math.random() * 4)];
  if (hand[2] === 's') return [a, a];
  const rest = SUITS.filter((s) => s !== a);
  return [a, rest[Math.floor(Math.random() * 3)]];
}

function card(rank, suit) {
  return h('div', { class: `pcard pcard--${suit}` },
    h('span', { class: 'pcard__rank' }, rank === 'T' ? '10' : rank),
    h('span', { class: 'pcard__suit', html: suitSvg(suit) }));
}

export function handCards(hand, suits) {
  return h('div', { class: 'cards', role: 'img', 'aria-label': `${hand[0]} of ${SUIT_NAME[suits[0]]}, ${hand[1]} of ${SUIT_NAME[suits[1]]}` },
    card(hand[0], suits[0]), card(hand[1], suits[1]));
}

/** The cut-off question as cards: the known top card, then a mystery kicker. */
export function rowCards(rowKey, suits) {
  if (rowKey === 'pairs') {
    return h('div', { class: 'cards', role: 'img', 'aria-label': 'A pocket pair' },
      card('?', suits[0]), card('?', suits[1]));
  }
  return h('div', { class: 'cards', role: 'img', 'aria-label': `${rowKey[0]} with an unknown kicker` },
    card(rowKey[0], suits[0]), card('?', suits[1]));
}

// ---- Seats

const TABLE = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

/** The six seats in the order they act. Seats before yours have folded. */
export function seatStrip(heroId) {
  const at = TABLE.indexOf(heroId);
  return h('ol', { class: 'seats', 'aria-label': `Your seat: ${heroId}` },
    TABLE.map((id, i) => h('li', {
      class: `seat${i === at ? ' seat--hero' : i < at ? ' seat--folded' : ''}`,
    }, id, id === 'BTN' ? h('span', { class: 'seat__dealer', 'aria-hidden': 'true' }, 'D') : null)),
  );
}
