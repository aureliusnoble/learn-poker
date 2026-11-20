// What every question-and-answer drill shares: how items are weighted, how a
// round is scored, and the pieces of interface that report on it.
import { h, fill } from './dom.js';
import { ICON } from './components.js';

/** Correct answers in a row before an item counts as known. */
export const SOLID = 2;

// A just-missed item comes up most; a known one fades into the background.
const BOX_W = [2.2, 1, 0.45, 0.2];
export const boxWeight = (item) => (item ? BOX_W[Math.min(item.b, 3)] : 1);

// Hands on the edge of a range are asked far more often than obvious ones.
const EDGE_W = [0, 1, 0.45, 0.15];
export const edgeWeight = (dist) => EDGE_W[dist] ?? 0.05;

/** 0..1: how settled an item is. */
export const settled = (item) => (item ? Math.min(item.b, SOLID) / SOLID : 0);

/** The kinds of mistake a table decision can be, with what to do about each. */
export const LEAKS = {
  loose: { name: 'Too loose', tip: 'You put chips in with hands that fold. The ranges are tighter than they feel: when it is not on the chart, let it go.' },
  tight: { name: 'Too tight', tip: 'You folded hands that play. Look again at the bottom of each range, especially from the later seats.' },
  passive: { name: 'Too passive', tip: 'You called or limped with a hand strong enough to raise for value. Strong hands want a bigger pot.' },
  wild: { name: 'Overplayed', tip: 'You raised a hand that is only strong enough to call or limp. Ask whether worse hands would call the raise.' },
  limpraise: { name: 'Limped into a raiser', tip: 'With an aggressive raiser still to act, do not limp. Raise the better hands yourself and fold the rest.' },
  size: { name: 'Wrong size', tip: 'Check whether you are in or out of position first. 3-bets and 4-bets are multiples of their bet; a raise over limpers is 3bb plus 1bb per limper, plus 1bb out of position.' },
  seat: { name: 'Wrong seat', tip: 'Find the dealer button and count: button, then small blind, big blind. Going the other way from the button: cutoff, middle position, under the gun.' },
};

export function newRound(total) {
  return { i: 0, total, right: 0, streak: 0, best: 0, ms: 0, timed: 0, misses: [], recent: [], retry: [], t: Date.now() };
}

/**
 * Scores one answer. A miss is kept for the summary and queued to be asked
 * again a few questions later, while it is still fresh.
 */
export function score(round, key, ok, ms, item) {
  round.i += 1;
  round.recent.push(key);
  if (round.recent.length > 6) round.recent.shift();
  if (ms != null) {
    round.ms += Math.min(ms, 30000);
    round.timed += 1;
  }
  if (ok) {
    round.right += 1;
    round.streak += 1;
    round.best = Math.max(round.best, round.streak);
  } else {
    round.streak = 0;
    if (!round.misses.some((m) => m.key === key)) round.misses.push({ key, item });
    round.retry.push({ key, item, due: round.i + 2 + Math.floor(Math.random() * 3) });
  }
}

/** A missed item that is due to come round again, or null. */
export function dueRetry(round) {
  const last = round.recent[round.recent.length - 1];
  const at = round.retry.findIndex((r) => r.due <= round.i && r.key !== last);
  return at >= 0 ? round.retry.splice(at, 1)[0].item : null;
}

export const roundOver = (round) => round.i >= round.total;

export function progressRow(round) {
  return h('div', { class: 'progress' },
    h('div', { class: 'progress__track' },
      h('div', { class: 'progress__fill', style: `width:${(round.i / round.total) * 100}%` })),
    h('span', { class: 'progress__count' }, `${round.i} / ${round.total}`),
    round.streak >= 3 ? h('span', { class: 'progress__streak' }, `${round.streak} in a row`) : null,
  );
}

/** Right or wrong, said with a mark and words, never colour alone. */
export function verdict(ok, text) {
  return h('p', { class: `verdict verdict--${ok ? 'good' : 'bad'}` },
    h('span', { class: 'verdict__icon', html: ok ? ICON.check : ICON.cross }),
    h('span', null, text));
}

/** The end-of-round screen. `missRow(item)` returns [heading nodes, explanation]. */
export function roundSummary(main, round, { missRow, again, back, extra = null, note = null }) {
  const pace = round.timed ? `${(round.ms / round.timed / 1000).toFixed(1)}s per decision · ` : '';
  fill(main,
    h('section', { class: 'result' },
      h('p', { class: 'eyebrow' }, 'Round complete'),
      h('p', { class: 'result__score' }, String(round.right), h('span', null, ` / ${round.total}`)),
      h('p', { class: 'result__line' }, `${pace}best run ${round.best}`),
      // How this round compares with the answers before it, once there are enough to compare.
      note ? h('p', { class: 'result__note' }, note) : null,
      h('a', { class: 'result__link', href: '#trends' }, 'Progress over time')),
    extra,
    round.misses.length
      ? h('section', { class: 'block' },
        h('h2', { class: 'h2' }, 'Worth another look'),
        h('ul', { class: 'misses' }, round.misses.map((m) => {
          const [head, text] = missRow(m.item);
          return h('li', null, h('div', { class: 'misses__head' }, head), h('p', { class: 'misses__rule' }, text));
        })))
      : h('p', { class: 'hint' }, 'Nothing missed this round.'),
    h('div', { class: 'actions' },
      h('a', { class: 'btn btn--quiet', href: `#${back}` }, 'Done'),
      h('button', { type: 'button', class: 'btn btn--primary', onclick: again }, 'Another round')),
  );
}

/** Answers from the keyboard, for practising at a desk. Returns the remover. */
export function onKeys(map) {
  const handler = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const fn = map[e.key.toLowerCase()];
    // A handler returns false when the key has nothing to do right now.
    if (fn && fn() !== false) e.preventDefault();
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}
