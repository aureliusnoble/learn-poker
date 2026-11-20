// The spot drill: one runner for every "what do you do here?" exercise.
// It seats the spot at the table, plays the action out, takes the answer, and
// explains it with whatever feedback the spot carries.
//
// A spot is a table description (see table.js) plus:
//   key        what to record progress under (defaults to id)
//   options    answer ids ('fold', 'call', '3bet' ...) or { id, label } objects
//   correct    the acceptable answer ids
//   question   optional wording; with no `action` the spot is a plain question card
//   why        the reason, in a sentence or two
//   factors    [[criterionId, 'for' | 'against' | 'neutral', text]]  (optional)
//   math       { call, effective } for the set-mining sum          (optional)
//   lens       { chart, hand } to show the chart with the hand marked (optional)
//   quick      true to move on by itself after a correct answer
import { h, fill, weightedPick } from './dom.js';
import { shell, segmented, dealSuits, handTag } from './components.js';
import { describeHand } from './ranges.js';
import { record, recordTime, stat } from './store.js';
import { newRound, score, dueRetry, roundOver, progressRow, verdict, roundSummary, boxWeight } from './drill.js';
import { readSpot, tableView, spotFacts, readsList, optionLabel, optionPhrase, SEAT_NAMES } from './table.js';
import { factorList, setMath, rangeLens } from './feedback.js';

// Answers that decline to act are drawn quietly; the active ones carry the colour.
const QUIET = new Set(['fold', 'pass', 'none', 'no']);

const DEFAULT_QUESTION = {
  1: 'Raise or fold?',
  2: 'What is your play?',
  3: 'They 3-bet. What now?',
  4: 'They 4-bet. What now?',
};

/** Picks from a fixed list of spots: unsettled ones first, nothing just seen. */
export function deckOf(spots, topic, bucket) {
  return (round) => {
    const fresh = spots.filter((s) => !round.recent.includes(s.key || s.id));
    return weightedPick(fresh.length ? fresh : spots, (s) => boxWeight(stat(topic, bucket, s.key || s.id)));
  };
}

/**
 * cfg: { title, back, topic, bucket, total, next(round), criteria?, intro?,
 *        filter?: { options, get(), set(v), label }, depth? }
 */
export function spotDrill(root, cfg) {
  const main = shell(root, { title: cfg.title, back: cfg.back });
  main.classList.add('page--drill');

  let round;
  let spot;
  let info;
  let view;
  let result;
  let suits;
  let t0;
  let timer = null;

  const keyOf = (s) => s.key || s.id;
  const optionsOf = (s) => s.options.map((o) => (typeof o === 'string' ? { id: o, label: optionLabel(o, info) } : o));
  const isCustom = (id) => spot.options.some((o) => typeof o !== 'string' && o.id === id);
  const phrase = (id) => {
    const custom = spot.options.find((o) => typeof o !== 'string' && o.id === id);
    return custom ? custom.label : optionPhrase(id, info);
  };

  function start() {
    round = newRound(cfg.total);
    ask();
  }

  function ask() {
    spot = dueRetry(round) || cfg.next(round);
    info = spot.hero ? readSpot(spot) : null;
    suits = spot.hero && spot.hero.hand ? dealSuits(spot.hero.hand) : null;
    result = null;
    view = null;
    t0 = performance.now();
    draw(true);
  }

  function answer(id) {
    if (result) return;
    const ms = performance.now() - t0;
    const ok = spot.correct.includes(id);
    result = { ok, id };
    if (view) view.finish();
    record(cfg.topic, cfg.bucket, keyOf(spot), ok);
    if (spot.quick) recordTime(cfg.topic, cfg.bucket, ms);
    score(round, keyOf(spot), ok, spot.quick ? ms : null, spot);
    draw(false);
    if (ok && spot.quick) timer = setTimeout(advance, 950);
  }

  function advance() {
    clearTimeout(timer);
    timer = null;
    if (!roundOver(round)) return ask();
    result = null;
    roundSummary(main, round, {
      back: cfg.back,
      again: start,
      missRow: (s) => [
        [
          s.hero && s.hero.hand ? handTag(s.hero.hand) : null,
          h('span', { class: 'misses__title' }, s.title || (s.hero ? `${s.hero.seat}` : '')),
        ],
        `${s.correct.map((id) => {
          const custom = s.options.find((o) => typeof o !== 'string' && o.id === id);
          return custom ? custom.label : optionPhrase(id, readSpotSafe(s));
        }).join(' or ')}. ${s.why}`.replace(/^./, (c) => c.toUpperCase()),
      ],
    });
  }

  function feedback() {
    const others = spot.correct.filter((id) => id !== result.id);
    let head;
    if (result.ok) head = others.length ? `Correct. You could also ${phrase(others[0])}.` : 'Correct.';
    else if (isCustom(spot.correct[0])) head = `Wrong. The answer is ${spot.correct.map(phrase).join(' or ').toLowerCase()}.`;
    else head = `Wrong. The play is to ${spot.correct.map(phrase).join(' or ')}.`;
    return h('div', { class: 'feedback__body' },
      verdict(result.ok, head),
      h('p', { class: 'feedback__rule' }, spot.why),
      spot.factors && cfg.criteria ? factorList(spot.factors, cfg.criteria) : null,
      spot.math ? setMath(spot.math) : null,
      spot.lens ? rangeLens(spot.lens.chart, spot.lens.hand) : null);
  }

  function draw(fresh) {
    const opts = optionsOf(spot);
    const wordy = opts.some((o) => o.label.length > 14);
    const filter = cfg.filter;

    if (spot.hero && fresh) {
      view = tableView(spot, info, { suits, showStacks: !!cfg.depth });
    }

    const choice = (o) => {
      let cls = 'btn choice';
      if (result) {
        if (spot.correct.includes(o.id)) cls += ' is-right';
        else if (o.id === result.id) cls += ' is-wrong';
      }
      const primary = !result && !QUIET.has(o.id);
      return h('button', {
        type: 'button',
        class: `${cls} ${primary ? 'btn--primary' : 'btn--quiet'}`,
        disabled: !!result,
        onclick: () => answer(o.id),
      }, o.label);
    };

    fill(main,
      filter ? segmented(filter.options, filter.get(), (v) => { filter.set(v); if (result) draw(false); else ask(); }, filter.label) : null,
      progressRow(round),
      spot.banner ? h('p', { class: 'banner' }, spot.banner) : null,
      spot.hero
        ? h('section', { class: 'spot' },
          view.el,
          h('div', { class: 'spot__meta' },
            h('p', { class: 'spot__hand' },
              spot.hero.hand ? h('strong', null, describeHand(spot.hero.hand)) : null,
              spot.hero.hand ? ' · ' : '', SEAT_NAMES[spot.hero.seat]),
            spotFacts(info, { depth: !!(cfg.depth || spot.math) })),
          readsList(spot))
        : null,
      h('p', { class: 'ask' }, spot.question || DEFAULT_QUESTION[info ? info.level : 2]),
      result
        ? h('div', { class: 'feedback feedback--open', 'aria-live': 'polite' }, feedback())
        : null,
      h('div', { class: `actions ${wordy ? 'actions--stack' : ''}` },
        result && !(result.ok && spot.quick)
          ? h('button', { type: 'button', class: 'btn btn--primary btn--wide', onclick: advance },
            roundOver(round) ? 'See the round' : 'Next spot')
          : opts.map(choice)),
    );
    if (result) main.querySelector('.feedback').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  start();
  return () => clearTimeout(timer);
}

function readSpotSafe(s) {
  return s.hero ? readSpot(s) : { toCall: 0, level: 2 };
}
