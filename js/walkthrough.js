// The walkthrough: one concept shown at the table, a step at a time.
//
// A lesson is { id, title, practice: { route, label }, steps: [...] }.
// A step may carry:
//   spot     the table to show (see table.js). Left out, the last table stays.
//   focus    seats to ring
//   head     a short heading
//   text     one or more short paragraphs. **Double stars** mark a new term.
//   rows     [[label, value]] for things worth lining up
//   callout  { kind: 'term' | 'rule' | 'why' | 'watch' | 'tip', title?, text }
//   play     the right play here, in words
//   whatIf   [{ label, spot?, text, play? }]: the same spot with one thing changed
//   ask      { q, options: [{ id, label }], correct, why }: a question before the answer
//   expect   { by, play }: the engine that must agree with `play` (checked by the tests)
import { h, fill } from './dom.js';
import { shell, dealSuits } from './components.js';
import { readSpot, tableView, spotFacts, readsList, SEAT_NAMES } from './table.js';
import { describeHand } from './ranges.js';
import { verdict } from './drill.js';
import { record } from './store.js';

const CALLOUT = { term: 'New word', rule: 'Rule', why: 'Why', watch: 'Watch out', tip: 'Remember' };

/** Turns **marked** words into emphasis. Everything else stays plain text. */
function rich(text) {
  return String(text).split('**').map((part, i) => (i % 2 ? h('strong', null, part) : part));
}

const sameStart = (a, b) => a && b && (a.players || 6) === (b.players || 6)
  && a.hero.seat === b.hero.seat && a.hero.hand === b.hero.hand;

export function walkthrough(root, lesson, { back }) {
  const main = shell(root, { title: lesson.title, back });
  main.classList.add('page--guide');
  const steps = lesson.steps;
  // A step without a table of its own keeps the one before it.
  const spots = [];
  steps.forEach((s, i) => { spots[i] = s.spot || spots[i - 1] || null; });
  const suits = {};
  const suitsFor = (hand) => (hand ? (suits[hand] || (suits[hand] = dealSuits(hand))) : null);

  let at = 0;
  let variant = null; // which "what if" is switched on
  let picked = null; // the answer given to this step's question
  let shown = null; // the spot on the table, and how many frames of it have played

  function table(step, spot, moving) {
    if (!spot) return null;
    const info = readSpot(spot);
    // Moving forward within the same hand, the action picks up where it stopped.
    const carry = moving && shown && sameStart(shown.spot, spot) ? Math.min(shown.frames - 1, info.frames.length - 1) : null;
    const view = tableView(spot, info, {
      suits: suitsFor(spot.hero.hand),
      animate: moving,
      startAt: carry == null ? 0 : carry,
      hideSeats: !!step.hideSeats && picked == null,
      focus: variant == null ? step.focus || [] : [],
    });
    shown = { spot, frames: info.frames.length };
    return h('section', { class: 'spot' },
      view.el,
      h('div', { class: 'spot__meta' },
        h('p', { class: 'spot__hand' },
          spot.hero.hand ? h('strong', null, describeHand(spot.hero.hand)) : null,
          step.hideSeats && picked == null ? null : [spot.hero.hand ? ' · ' : 'You are in the ', spot.hero.hand ? SEAT_NAMES[spot.hero.seat] : SEAT_NAMES[spot.hero.seat].toLowerCase()]),
        step.hideSeats ? null : spotFacts(info, { depth: !!spot.stacks })),
      readsList(spot));
  }

  function question(step) {
    const ask = step.ask;
    const right = [].concat(ask.correct);
    if (picked == null) {
      return h('div', { class: 'guide__ask' },
        h('p', { class: 'ask' }, ask.q),
        h('div', { class: `actions ${ask.options.some((o) => o.label.length > 14) ? 'actions--stack' : ''}` },
          ask.options.map((o) => h('button', {
            type: 'button', class: 'btn btn--quiet choice', onclick: () => { picked = o.id; draw(false); },
          }, o.label))));
    }
    const ok = right.includes(picked);
    const answer = ask.options.filter((o) => right.includes(o.id)).map((o) => o.label).join(' or ');
    return h('div', { class: 'guide__ask' },
      h('p', { class: 'ask' }, ask.q),
      verdict(ok, ok ? `Yes: ${answer}.` : `Not quite. The answer is: ${answer}.`),
      h('p', { class: 'feedback__rule' }, rich(ask.why)));
  }

  function draw(moving) {
    const step = steps[at];
    const v = variant == null ? null : step.whatIf[variant];
    const last = at === steps.length - 1;
    // The question comes before its answer: hold the rest back until it is answered.
    const open = !step.ask || picked != null;
    const play = v ? v.play : step.play;

    if (last && open) record('guide', 'done', lesson.id, true, { countsToday: false });

    fill(main,
      h('div', { class: 'progress' },
        h('div', { class: 'progress__track' }, h('div', { class: 'progress__fill', style: `width:${((at + 1) / steps.length) * 100}%` })),
        h('span', { class: 'progress__count' }, `Step ${at + 1} of ${steps.length}`)),
      table(step, (v && v.spot) || spots[at], moving),
      h('div', { class: 'guide__body' },
        step.head ? h('h2', { class: 'guide__head' }, step.head) : null,
        [].concat(step.text || []).map((t) => h('p', { class: 'guide__text' }, rich(t))),
        step.ask ? question(step) : null,
        open && step.rows
          ? h('dl', { class: 'cheat__rows' }, step.rows.map(([k, val]) => h('div', null, h('dt', null, k), h('dd', null, val))))
          : null,
        open && step.callout
          ? h('aside', { class: `callout callout--${step.callout.kind}` },
            h('p', { class: 'callout__label' }, CALLOUT[step.callout.kind], step.callout.title ? `: ${step.callout.title}` : ''),
            h('p', null, rich(step.callout.text)))
          : null,
        open && step.whatIf
          ? h('div', { class: 'whatif' },
            h('p', { class: 'whatif__label' }, 'What if…'),
            h('div', { class: 'whatif__chips' }, step.whatIf.map((w, i) => h('button', {
              type: 'button',
              class: i === variant ? 'chip is-on' : 'chip',
              'aria-pressed': String(i === variant),
              onclick: () => { variant = i === variant ? null : i; draw(false); },
            }, w.label))),
            v ? h('p', { class: 'guide__text whatif__text' }, rich(v.text)) : null)
          : null,
        open && play
          ? h('p', { class: `guide__play${v ? ' guide__play--alt' : ''}` }, h('span', null, v ? 'Now the play is' : 'The play'), h('strong', null, play))
          : null),
      h('div', { class: 'actions actions--next guide__nav' },
        at > 0 ? h('button', { type: 'button', class: 'btn btn--quiet guide__back', onclick: () => go(at - 1) }, 'Back') : null,
        last
          ? h('a', { class: 'btn btn--primary', href: `#${lesson.practice.route}` }, lesson.practice.label)
          : h('button', { type: 'button', class: 'btn btn--primary', onclick: () => go(at + 1) }, 'Next')),
      last ? h('a', { class: 'linkbtn guide__done', href: `#${back}` }, 'Back to the chapter') : null,
    );
  }

  function go(to) {
    const forward = to > at;
    at = to;
    variant = null;
    picked = null;
    draw(forward);
    window.scrollTo(0, 0);
  }

  draw(true);
}
