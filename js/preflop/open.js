// Raise or fold: one seat, one hand, one decision.
import { h, fill } from '../dom.js';
import { shell, segmented, dealSuits, miniMap, handTag } from '../components.js';
import { readSpot, tableView, spotFacts, tablesWith } from '../table.js';
import { POS, OPEN_SIZE_BB, explain, describeHand } from '../ranges.js';
import { record, recordTime, batch, logAnswer, logOf } from '../store.js';
import { roundNote } from '../trend.js';
import { newRound, score, dueRetry, roundOver, progressRow, verdict, roundSummary, onKeys } from '../drill.js';
import { TOPIC, pickHand, pickFrom, play, verdictLine, SEAT_OPTIONS, seatsFor } from './model.js';

const ROUND = 20;
const LOG = 'open/drill';
let seatFilter = 'ALL';

export function openDrill(root, params = {}) {
  const weak = params.items && params.items.length ? params.items : null;
  const back = weak ? 'open-progress' : 'ch-open';
  const main = shell(root, { title: weak ? 'Weak spots' : 'Raise or fold', back });
  main.classList.add('page--drill');

  let round;
  let q;
  let result;

  function start() {
    round = newRound(weak ? Math.min(ROUND, Math.max(10, weak.length * 2)) : ROUND);
    ask();
  }

  function ask() {
    q = dueRetry(round) || (weak ? pickFrom(weak, round.recent) : pickHand(seatsFor(seatFilter), round.recent));
    q = { seat: q.seat, hand: q.hand, t0: performance.now() };
    // The same table every tutorial uses: everyone before you has folded.
    const sizes = tablesWith(q.seat);
    q.spot = { players: sizes[Math.floor(Math.random() * sizes.length)], hero: { seat: q.seat, hand: q.hand } };
    q.info = readSpot(q.spot);
    q.view = tableView(q.spot, q.info, { suits: dealSuits(q.hand) });
    result = null;
    draw();
  }

  function answer(raise) {
    if (result) return;
    const ms = performance.now() - q.t0;
    const info = explain(q.seat, q.hand);
    const ok = raise === info.inRange;
    result = { ok, raise, info };
    batch(() => {
      record(TOPIC, 'hands', `${q.seat}:${q.hand}`, ok);
      recordTime(TOPIC, q.seat, ms);
      // The weak-spots round is only hands already missed, so it stays out of the history.
      if (!weak) logAnswer(LOG, ok ? 1 : 0, round.t);
    });
    score(round, `${q.seat}:${q.hand}`, ok, ms, { seat: q.seat, hand: q.hand });
    draw();
  }

  function advance() {
    if (roundOver(round)) {
      result = null;
      roundSummary(main, round, {
        back,
        again: start,
        note: weak ? null : roundNote(logOf(LOG), round.i, round.right),
        missRow: (it) => [[handTag(it.hand), h('span', { class: 'tag' }, it.seat)], verdictLine(it.seat, it.hand)],
      });
    } else {
      ask();
    }
  }

  function feedback() {
    if (!result) return h('p', { class: 'feedback__idle' }, `Open for ${OPEN_SIZE_BB}bb, or fold?`);
    const { ok, info } = result;
    const head = verdict(ok, ok
      ? `Correct. ${play(info.inRange)}.`
      : info.inRange ? `Wrong. Raise ${q.hand} to ${OPEN_SIZE_BB}bb here.` : `Wrong. Fold ${q.hand} here.`);
    const rule = h('p', { class: 'feedback__rule' }, info.rule);
    if (ok) return h('div', { class: 'feedback__body' }, head, rule);
    return h('div', { class: 'feedback__body feedback__body--map' },
      miniMap(q.seat, q.hand),
      h('div', { class: 'feedback__text' }, head, rule));
  }

  function actions() {
    // Nothing moves on by itself: the feedback stays until Next is tapped.
    if (result) {
      return h('div', { class: 'actions actions--next' },
        h('button', { type: 'button', class: 'btn btn--primary btn--wide', onclick: advance },
          roundOver(round) ? 'See the round' : 'Next hand'));
    }
    return h('div', { class: 'actions' },
      h('button', { type: 'button', class: 'btn btn--quiet', onclick: () => answer(false) }, 'Fold'),
      h('button', { type: 'button', class: 'btn btn--primary', onclick: () => answer(true) }, `Raise ${OPEN_SIZE_BB}bb`));
  }

  function draw() {
    const pos = POS[q.seat];
    fill(main,
      weak
        ? h('p', { class: 'hint' }, `Only the ${weak.length} ${weak.length === 1 ? 'hand' : 'hands'} you miss most.`)
        : segmented(SEAT_OPTIONS, seatFilter, (v) => {
          seatFilter = v;
          if (result) draw(); else ask();
        }, 'Seats to practise'),
      progressRow(round),
      h('section', { class: 'spot' },
        q.view.el,
        h('div', { class: 'spot__meta' },
          h('p', { class: 'spot__hand' },
            h('strong', null, describeHand(q.hand)), ' · ', pos.name, q.seat === 'UTG' ? ', first to act' : ', folded to you'),
          spotFacts(q.info))),
      h('div', { class: 'feedback', 'aria-live': 'polite' }, feedback()),
      actions(),
    );
  }

  const offKeys = onKeys({
    f: () => answer(false),
    r: () => answer(true),
    enter: () => (result ? advance() : false),
    ' ': () => (result ? advance() : false),
  });

  start();
  return offKeys;
}
