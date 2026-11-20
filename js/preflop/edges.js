// Find the cut-off: name the weakest hand a seat opens in one row of the notes.
import { h, fill } from '../dom.js';
import { shell, segmented, seatStrip, rowCards, dealSuits } from '../components.js';
import { POS, rowHands, rowLabel, rowNoun, rowRule } from '../ranges.js';
import { record } from '../store.js';
import { newRound, score, dueRetry, roundOver, progressRow, verdict, roundSummary } from '../drill.js';
import { TOPIC, pickRow, SEAT_OPTIONS, seatsFor } from './model.js';

const ROUND = 12;
let seatFilter = 'ALL';

export function edgesDrill(root) {
  const main = shell(root, { title: 'Find the cut-off', back: 'home' });
  main.classList.add('page--drill');

  let round;
  let q;
  let result;

  function start() {
    round = newRound(ROUND);
    ask();
  }

  function ask() {
    const it = dueRetry(round) || pickRow(seatsFor(seatFilter), round.recent);
    // Suited rows show two cards of one suit; pairs and offsuit rows show two suits.
    q = { seat: it.seat, row: it.row, suits: dealSuits(it.row[1] === 's' && it.row !== 'pairs' ? 'AKs' : 'AKo') };
    result = null;
    draw();
  }

  function answer(pick) {
    if (result) return;
    const correct = POS[q.seat].rows[q.row].lowest;
    const ok = pick === correct;
    let slip = '';
    if (!ok) {
      // Hands run strongest first, and "none" is tighter than any of them.
      const all = rowHands(q.row);
      const at = (hand) => (hand == null ? -1 : all.indexOf(hand));
      slip = at(pick) > at(correct) ? 'Too loose.' : 'Too tight.';
    }
    result = { ok, pick, correct, slip };
    record(TOPIC, 'edges', `${q.seat}:${q.row}`, ok);
    score(round, `${q.seat}:${q.row}`, ok, null, { seat: q.seat, row: q.row });
    draw();
  }

  function advance() {
    if (roundOver(round)) {
      result = null;
      roundSummary(main, round, {
        back: 'home',
        again: start,
        missRow: (it) => [
          [h('span', { class: 'hand' }, rowLabel(it.row)), h('span', { class: 'tag' }, it.seat)],
          rowRule(it.seat, it.row),
        ],
      });
    } else {
      ask();
    }
  }

  function option(value, label) {
    let cls = 'opt';
    if (result) {
      if (value === result.correct) cls += ' is-right';
      else if (value === result.pick) cls += ' is-wrong';
      else cls += ' is-dim';
    }
    return h('button', { type: 'button', class: cls, disabled: !!result, onclick: () => answer(value) }, label);
  }

  function draw() {
    const pos = POS[q.seat];
    const question = q.row === 'pairs' ? 'Lowest pair you open?' : `Lowest ${rowNoun(q.row)} you open?`;
    fill(main,
      segmented(SEAT_OPTIONS, seatFilter, (v) => {
        seatFilter = v;
        if (result) draw(); else ask();
      }, 'Seats to practise'),
      progressRow(round),
      h('section', { class: 'felt felt--compact' },
        seatStrip(q.seat),
        h('p', { class: 'felt__seat' }, h('strong', null, pos.name), q.seat === 'UTG' ? ' · first to act' : ' · folded to you'),
        rowCards(q.row, q.suits),
        h('p', { class: 'felt__hand' }, question)),
      h('div', { class: 'opts' },
        rowHands(q.row).map((hand) => option(hand, hand)),
        q.row === 'pairs' ? null : option(null, 'None')),
      h('div', { class: 'feedback feedback--short', 'aria-live': 'polite' },
        result
          ? h('div', { class: 'feedback__body' },
            verdict(result.ok, result.ok ? 'Correct.' : result.slip),
            h('p', { class: 'feedback__rule' }, rowRule(q.seat, q.row)))
          : null),
      result
        ? h('div', { class: 'actions actions--next' },
          h('button', { type: 'button', class: 'btn btn--primary btn--wide', onclick: advance },
            roundOver(round) ? 'See the round' : 'Next row'))
        : null,
    );
  }

  start();
}
