// The table simulator: turns a short description of a pre-flop spot into the
// full state of a six-handed table, and draws it. Every tutorial that asks
// "what do you do here?" uses this.
//
// A spot:
//   hero:   { seat, hand, stack? }            stacks default to 100bb
//   action: [[seat, 'raise', toBb] | [seat, 'call'] ...]   in the order it happened
//   reads:  { seat: playerType }              see PLAYER_TYPES
//   notes:  { seat: 'Folds to 3-bets often' } a specific read, shown under the table
//   stacks: { seat: bb }
// Seats that are not listed and sit between two actions have folded.
import { h } from './dom.js';
import { handCards } from './components.js';
import { describeHand, OPEN_SIZE_BB } from './ranges.js';

export const TABLE_SEATS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
export const SEAT_NAMES = {
  UTG: 'Under the Gun', MP: 'Middle Position', CO: 'Cutoff', BTN: 'Button', SB: 'Small Blind', BB: 'Big Blind',
};
const BLINDS = { SB: 0.5, BB: 1 };

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

export const bb = (n) => `${Number.isInteger(n) ? n : n.toFixed(1)}bb`;
const RAISE_NAME = ['', '', 'Raise', '3-bet', '4-bet', '5-bet'];

/**
 * Plays a spot out. Returns one frame per action (frame 0 is the blinds posted)
 * plus what the hero now faces.
 */
export function readSpot(spot) {
  const hero = spot.hero.seat;
  const heroAt = TABLE_SEATS.indexOf(hero);
  const stackOf = (seat) => (seat === hero ? spot.hero.stack : (spot.stacks || {})[seat]) || 100;

  const seats = {};
  for (const seat of TABLE_SEATS) seats[seat] = { seat, status: 'waiting', label: '', put: BLINDS[seat] || 0 };
  const snapshot = (step) => ({
    step,
    pot: TABLE_SEATS.reduce((sum, s) => sum + seats[s].put, 0),
    seats: Object.fromEntries(TABLE_SEATS.map((s) => [s, { ...seats[s] }])),
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
    for (let i = (from + 1) % 6; i !== to; i = (i + 1) % 6) {
      const seat = TABLE_SEATS[i];
      if (seat !== hero && seats[seat].status !== 'folded') fold(seat);
    }
  };

  for (const [seat, kind, to] of spot.action || []) {
    const at = TABLE_SEATS.indexOf(seat);
    foldBetween(last, at);
    if (kind === 'raise') {
      level += 1;
      high = to;
      aggressor = seat;
      seats[seat].put = to;
      seats[seat].status = 'raised';
      seats[seat].label = `${RAISE_NAME[level] || 'Raise'} ${bb(to)}`;
    } else if (kind === 'call') {
      seats[seat].put = high;
      seats[seat].status = 'called';
      seats[seat].label = `Call ${bb(high)}`;
    } else {
      seats[seat].status = 'folded';
      seats[seat].label = 'Fold';
    }
    frames.push(snapshot({ seat, kind }));
    last = at;
  }
  foldBetween(last, heroAt);

  // Whoever has not acted yet and sits after the hero is still to come.
  const stop = aggressor ? TABLE_SEATS.indexOf(aggressor) : 0;
  let behind = 0;
  for (let i = (heroAt + 1) % 6; i !== stop; i = (i + 1) % 6) {
    if (seats[TABLE_SEATS[i]].status === 'waiting') {
      seats[TABLE_SEATS[i]].status = 'toact';
      behind += 1;
    }
  }
  seats[hero].status = 'hero';
  frames[frames.length - 1] = snapshot(frames[frames.length - 1].step);

  const final = frames[frames.length - 1];
  return {
    frames,
    pot: final.pot,
    toCall: high - seats[hero].put,
    level, // 1: nobody has raised, 2: facing an open, 3: facing a 3-bet, 4: facing a 4-bet
    villain: aggressor,
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

/**
 * Draws the table and plays the action out seat by seat. The hero sits at the
 * bottom and the action runs clockwise, as it does at a real table.
 * Returns { el, finish() }.
 */
export function tableView(spot, info, { suits, animate = true, showStacks = false } = {}) {
  const hero = spot.hero.seat;
  const heroAt = TABLE_SEATS.indexOf(hero);
  const reads = spot.reads || {};
  const stacksMatter = showStacks || !!spot.stacks || !!spot.hero.stack;

  const pot = h('p', { class: 'tpot' });
  const plaques = {};
  const chips = {};

  const seatEl = (seat) => {
    const rel = (TABLE_SEATS.indexOf(seat) - heroAt + 6) % 6;
    const type = PLAYER_TYPES[reads[seat]] || PLAYER_TYPES.unknown;
    const chip = h('span', { class: 'tchip' });
    chips[seat] = chip;
    const plaque = h('div', { class: 'tseat__plaque' },
      h('span', { class: 'tseat__pos' }, seat === hero ? `You · ${seat}` : seat,
        seat === 'BTN' ? h('span', { class: 'seat__dealer', 'aria-hidden': 'true' }, 'D') : null),
      seat !== hero && type.tag ? h('span', { class: 'tseat__type' }, type.tag) : null,
      stacksMatter ? h('span', { class: 'tseat__stack' }, bb(info.stackOf(seat))) : null);
    plaques[seat] = plaque;
    const el = h('div', { class: `tseat tseat--r${rel}` });
    if (seat === hero) {
      el.append(chip, spot.hero.hand ? handCards(spot.hero.hand, suits) : '', plaque);
    } else if (rel === 1 || rel === 5) {
      el.append(chip, plaque);
    } else {
      el.append(plaque, chip);
    }
    return el;
  };

  const el = h('div', { class: 'ptable' },
    h('div', { class: 'ptable__felt', 'aria-hidden': 'true' }),
    TABLE_SEATS.map(seatEl),
    pot);

  const show = (frame) => {
    pot.textContent = `Pot ${bb(frame.pot)}`;
    for (const seat of TABLE_SEATS) {
      const s = frame.seats[seat];
      plaques[seat].parentElement.dataset.status = s.status;
      const text = s.status === 'folded' ? 'Fold'
        : s.label ? s.label
        : s.put ? bb(s.put)
        : '';
      chips[seat].textContent = s.status === 'toact' ? 'To act' : text;
      chips[seat].hidden = !chips[seat].textContent;
    }
  };

  // A sentence for screen readers, since the picture carries the story.
  const story = info.frames
    .filter((f) => f.step && f.step.kind !== 'fold')
    .map((f) => `${f.step.seat === hero ? 'You' : f.step.seat}: ${f.seats[f.step.seat].label}`)
    .join(', ');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label',
    `You are in the ${SEAT_NAMES[hero]}${spot.hero.hand ? ` with ${describeHand(spot.hero.hand)}` : ''}. ${story || 'Everyone before you has folded'}.`);

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
  return { el, finish };
}

/** Pot, price and stack depth in one line under the table. */
export function spotFacts(info, { depth = false } = {}) {
  const items = [['Pot', bb(info.pot)]];
  if (info.level > 1 && info.toCall > 0) items.push(['To call', bb(info.toCall)]);
  if (depth) items.push(['Effective stack', bb(info.effective)]);
  return h('dl', { class: 'facts' }, items.map(([k, v]) => h('div', null, h('dt', null, k), h('dd', null, v))));
}

/** What is known about the players in this spot, in words. */
export function readsList(spot) {
  const rows = [];
  for (const seat of TABLE_SEATS) {
    const type = PLAYER_TYPES[(spot.reads || {})[seat]];
    const note = (spot.notes || {})[seat];
    if (seat === spot.hero.seat || (!note && (!type || !type.tag))) continue;
    rows.push(h('li', null,
      h('span', { class: 'tag' }, seat),
      h('span', null, note ? `${note}.` : type.text, note && type && type.tag ? ` ${type.text}` : '')));
  }
  return rows.length ? h('ul', { class: 'reads' }, rows) : null;
}
