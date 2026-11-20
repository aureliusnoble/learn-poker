// The table simulator: turns a short description of a pre-flop spot into the
// full state of a poker table, and draws it. Every tutorial that asks "what do
// you do here?" uses this.
//
// A spot:
//   players: 4 | 5 | 6                        seats at the table (default 6)
//   hero:    { seat, hand, stack? }           stacks default to 100bb
//   action:  [[seat, 'raise', toBb] | [seat, 'call'] ...]   in the order it happened
//   reads:   { seat: playerType }             see PLAYER_TYPES
//   notes:   { seat: 'Folds to 3-bets often' } a specific read, shown under the table
//   stacks:  { seat: bb }
//   dealt:   true when the cards are out and nobody has acted yet
// Seats that are not listed and sit between two actions have folded.
import { h } from './dom.js';
import { handCards } from './components.js';
import { describeHand, OPEN_SIZE_BB } from './ranges.js';

export const TABLE_SEATS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
// With fewer players the earliest seats disappear. A seat is named by how far
// it sits from the button, so its range stays the same at any table size.
export const SEATS_BY_COUNT = {
  6: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'],
  5: ['MP', 'CO', 'BTN', 'SB', 'BB'],
  4: ['CO', 'BTN', 'SB', 'BB'],
};
export const seatsAt = (spot) => SEATS_BY_COUNT[spot.players || 6];
export const tablesWith = (seat) => [6, 5, 4].filter((n) => SEATS_BY_COUNT[n].includes(seat));

export const SEAT_NAMES = {
  UTG: 'Under the Gun', MP: 'Middle Position', CO: 'Cutoff', BTN: 'Button', SB: 'Small Blind', BB: 'Big Blind',
};
const BLINDS = { SB: 0.5, BB: 1 };

// After the flop the blinds act first and the button last. Acting later is "having position".
const POSTFLOP = ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'];
export const hasPosition = (seat, on) => POSTFLOP.indexOf(seat) > POSTFLOP.indexOf(on);

export const PLAYER_TYPES = {
  unknown: { tag: '', text: 'No reads on this player yet.' },
  tag: { tag: 'TAG', text: 'Tight and aggressive: plays few hands and bets them hard.' },
  lag: { tag: 'LAG', text: 'Loose and aggressive: opens a wide range and keeps betting.' },
  nit: { tag: 'Nit', text: 'Plays only premium hands.' },
  passive: { tag: 'Passive', text: 'Loose and passive: plays many hands, mostly by calling.' },
  rec: { tag: 'Rec', text: 'Recreational: plays for fun and calls too much.' },
  maniac: { tag: 'Maniac', text: 'Bad and aggressive: bets and bluffs far too often.' },
  aggro3b: { tag: '3-bettor', text: 'Aggressive 3-bettor: re-raises often, bluffs included.' },
};

export const bb = (n) => `${Number.isInteger(n) ? n : Number(n.toFixed(2))}bb`;
const RAISE_NAME = ['', '', 'Raise', '3-bet', '4-bet', '5-bet'];

/**
 * Plays a spot out. Returns one frame per action (frame 0 is the blinds posted)
 * plus what the hero now faces.
 */
export function readSpot(spot) {
  const order = seatsAt(spot);
  const n = order.length;
  const hero = spot.hero.seat;
  const heroAt = order.indexOf(hero);
  if (heroAt < 0) throw new Error(`${hero} is not a seat at a ${n}-handed table`);
  const stackOf = (seat) => (seat === hero ? spot.hero.stack : (spot.stacks || {})[seat]) || 100;

  const seats = {};
  for (const seat of order) seats[seat] = { seat, status: 'waiting', label: '', put: BLINDS[seat] || 0 };
  const snapshot = (step) => ({
    step,
    pot: order.reduce((sum, s) => sum + seats[s].put, 0),
    seats: Object.fromEntries(order.map((s) => [s, { ...seats[s] }])),
  });

  const frames = [snapshot(null)];
  let level = 1; // the blinds are the first bet
  let high = 1; // the bet to match
  let last = -1; // seat index of the last actor
  let aggressor = null;

  const fold = (seat) => {
    seats[seat].status = 'folded';
    seats[seat].label = 'Fold';
    frames.push(snapshot({ seat, kind: 'fold' }));
  };
  // Everyone still in between two actors, other than the hero, has folded.
  const foldBetween = (from, to) => {
    for (let i = (from + 1) % n; i !== to; i = (i + 1) % n) {
      const seat = order[i];
      if (seat !== hero && seats[seat].status !== 'folded') fold(seat);
    }
  };

  for (const [seat, kind, to] of spot.action || []) {
    const at = order.indexOf(seat);
    if (at < 0) throw new Error(`${seat} is not a seat at a ${n}-handed table`);
    foldBetween(last, at);
    if (kind === 'raise') {
      level += 1;
      high = to;
      aggressor = seat;
      seats[seat].put = to;
      seats[seat].status = 'raised';
      seats[seat].label = RAISE_NAME[level] || 'Raise';
    } else if (kind === 'call') {
      seats[seat].put = high;
      seats[seat].status = 'called';
      seats[seat].label = 'Call';
    } else {
      seats[seat].status = 'folded';
      seats[seat].label = 'Fold';
    }
    frames.push(snapshot({ seat, kind }));
    last = at;
  }
  // `dealt: true` is a hand where nobody has acted yet, wherever the hero sits.
  if (!spot.dealt) foldBetween(last, heroAt);

  // Whoever has not acted yet and sits after the hero is still to come.
  const stop = aggressor ? order.indexOf(aggressor) : 0;
  let behind = 0;
  for (let i = (heroAt + 1) % n; i !== stop; i = (i + 1) % n) {
    if (seats[order[i]].status === 'waiting') {
      seats[order[i]].status = 'toact';
      behind += 1;
    }
  }
  seats[hero].status = 'hero';
  frames[frames.length - 1] = snapshot(frames[frames.length - 1].step);

  const final = frames[frames.length - 1];
  return {
    order,
    frames,
    pot: final.pot,
    high,
    toCall: high - seats[hero].put,
    level, // 1: nobody has raised, 2: facing an open, 3: facing a 3-bet, 4: facing a 4-bet
    villain: aggressor,
    inPosition: aggressor ? hasPosition(hero, aggressor) : null,
    behind,
    stackOf,
    effective: aggressor ? Math.min(stackOf(hero), stackOf(aggressor)) : stackOf(hero),
  };
}

/** The wording on an answer button, given what the hero faces. */
export function optionLabel(id, info) {
  switch (id) {
    case 'fold': return 'Fold';
    case 'call': return `Call ${bb(info.toCall)}`;
    case 'raise': return `Raise ${bb(OPEN_SIZE_BB)}`;
    case '3bet': return '3-bet';
    case '4bet': return '4-bet';
    case 'jam': return 'All-in';
    case 'pass': return info.level >= 3 ? 'No 4-bet' : 'No 3-bet';
    default: return id;
  }
}

/** The same choice as a phrase, for "Wrong. The play is to ..." */
export function optionPhrase(id, info) {
  switch (id) {
    case 'fold': return 'fold';
    case 'call': return `call ${bb(info.toCall)}`;
    case 'raise': return `raise to ${bb(OPEN_SIZE_BB)}`;
    case '3bet': return '3-bet';
    case '4bet': return '4-bet';
    case 'jam': return 'go all-in';
    case 'pass': return info.level >= 3 ? 'not 4-bet' : 'not 3-bet';
    default: return id;
  }
}

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// The table is an oval. The hero always sits at the bottom, and the other seats
// run clockwise from there, which is the order the action moves in.
const RX = 40;
const RY = 38;
const CX = 50;
const CY = 47;
function around(k, n, reach = 1) {
  const angle = (90 + (k * 360) / n) * (Math.PI / 180);
  return { x: CX + RX * reach * Math.cos(angle), y: CY + RY * reach * Math.sin(angle) };
}
const place = (el, { x, y }) => {
  el.style.left = `${x.toFixed(2)}%`;
  el.style.top = `${y.toFixed(2)}%`;
};

/**
 * Draws the table and plays the action out seat by seat.
 * hideSeats: leave the position names off until reveal() is called.
 * Returns { el, finish(), reveal() }.
 */
export function tableView(spot, info, { suits, animate = true, hideSeats = false } = {}) {
  const hero = spot.hero.seat;
  const order = info.order;
  const n = order.length;
  const heroAt = order.indexOf(hero);
  const reads = spot.reads || {};

  const pot = h('p', { class: 'tpot' });
  const el = h('div', { class: `ptable ptable--${n}${hideSeats ? ' ptable--anon' : ''}` },
    h('div', { class: 'ptable__felt', 'aria-hidden': 'true' }), pot);
  const parts = {};

  order.forEach((seat, i) => {
    const k = (i - heroAt + n) % n;
    const type = PLAYER_TYPES[reads[seat]] || PLAYER_TYPES.unknown;
    const stack = h('span', { class: 'tseat__stack' });
    const isHero = seat === hero;
    const node = h('div', { class: `tseat${isHero ? ' tseat--hero' : ''}` },
      isHero
        ? (spot.hero.hand ? handCards(spot.hero.hand, suits) : null)
        : h('span', { class: 'tseat__backs', 'aria-hidden': 'true' }, h('i'), h('i')),
      h('div', { class: 'tseat__plaque' },
        seat === 'BTN' ? h('span', { class: 'tdealer', title: 'Dealer button' }, 'D') : null,
        h('span', { class: 'tseat__pos' }, isHero ? h('em', null, 'You') : null, h('b', null, seat)),
        stack,
        !isHero && type.tag ? h('span', { class: 'tseat__type' }, type.tag) : null));
    place(node, around(k, n));
    const bet = h('div', { class: 'tbet' }, h('span', { class: 'tbet__act' }), h('span', { class: 'tbet__amt' }));
    place(bet, around(k, n, isHero ? 0.08 : 0.52));
    el.append(node, bet);
    parts[seat] = { node, bet, stack };
  });

  const show = (frame) => {
    pot.textContent = `Pot ${bb(frame.pot)}`;
    for (const seat of order) {
      const s = frame.seats[seat];
      const { node, bet, stack } = parts[seat];
      node.dataset.status = s.status;
      stack.textContent = s.status === 'folded' ? 'Fold' : bb(info.stackOf(seat) - s.put);
      bet.dataset.status = s.status;
      bet.hidden = s.status === 'folded' || !s.put;
      bet.firstChild.textContent = s.label && s.label !== 'Fold' ? s.label : BLINDS[seat] ? (seat === 'SB' ? 'Small blind' : 'Big blind') : '';
      bet.firstChild.hidden = !bet.firstChild.textContent;
      bet.lastChild.textContent = bb(s.put);
    }
  };

  // A sentence for screen readers, since the picture carries the story.
  const story = info.frames
    .filter((f) => f.step && f.step.kind !== 'fold')
    .map((f) => `${f.step.seat === hero ? 'You' : f.step.seat} ${f.seats[f.step.seat].label.toLowerCase()} to ${bb(f.seats[f.step.seat].put)}`)
    .join(', ');
  el.setAttribute('role', 'img');
  const label = () => el.setAttribute('aria-label',
    `${n} players. ${el.classList.contains('ptable--anon') ? 'Find your seat from the dealer button' : `You are in the ${SEAT_NAMES[hero]}`}`
    + `${spot.hero.hand ? ` with ${describeHand(spot.hero.hand)}` : ''}. ${story || (info.level === 1 ? 'Nobody has raised' : '')}.`);
  label();

  let timer = null;
  let at = 0;
  const lastFrame = info.frames.length - 1;
  const finish = () => {
    clearTimeout(timer);
    at = lastFrame;
    show(info.frames[lastFrame]);
  };
  const tick = () => {
    show(info.frames[at]);
    if (at >= lastFrame) return;
    at += 1;
    const kind = info.frames[at].step ? info.frames[at].step.kind : 'fold';
    timer = setTimeout(tick, kind === 'fold' ? 80 : 340);
  };

  if (animate && !still() && lastFrame > 0) tick(); else finish();
  el.addEventListener('click', finish);
  return {
    el,
    finish,
    reveal: () => {
      el.classList.remove('ptable--anon');
      label();
    },
  };
}

/** Pot, price and stack depth in one line under the table. */
export function spotFacts(info, { depth = false } = {}) {
  const items = [['Pot', bb(info.pot)]];
  if (info.level > 1 && info.toCall > 0) items.push(['To call', bb(info.toCall)]);
  if (info.inPosition != null) items.push(['You are', info.inPosition ? 'in position' : 'out of position']);
  if (depth) items.push(['Effective stack', bb(info.effective)]);
  return h('dl', { class: 'facts' }, items.map(([k, v]) => h('div', null, h('dt', null, k), h('dd', null, v))));
}

/** What is known about the players in this spot, in words. */
export function readsList(spot) {
  const rows = [];
  for (const seat of seatsAt(spot)) {
    const type = PLAYER_TYPES[(spot.reads || {})[seat]];
    const note = (spot.notes || {})[seat];
    if (seat === spot.hero.seat || (!note && (!type || !type.tag))) continue;
    rows.push(h('li', null,
      h('span', { class: 'tag' }, seat),
      h('span', null, note ? `${note}.` : type.text, note && type && type.tag ? ` ${type.text}` : '')));
  }
  return rows.length ? h('ul', { class: 'reads' }, rows) : null;
}
