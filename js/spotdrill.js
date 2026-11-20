// The spot drill: one runner for every "what do you do here?" exercise.
// It seats the spot at the table, plays the action out, takes the answer (and
// the bet size, where a raise needs one), and explains the result.
//
// A spot is a table description (see table.js) plus:
//   key        what to record progress under (defaults to id)
//   topic, bucket   where to record it, when it differs from the drill's own
//   options    answer ids ('fold', 'call', '3bet' ...) or { id, label } objects
//   correct    the acceptable answer ids
//   question   optional wording; with no hero the spot is a plain question card
//   why        the reason, in a sentence or two
//   size       { when, key, question, options, correct, why }: asked after the
//              right raise is chosen                                 (optional)
//   leaks      { answerId: leakId } naming the kind of mistake       (optional)
//   factors    [[criterionId, 'for' | 'against' | 'neutral', text]]  (optional)
//   math       { call, effective } for the set-mining sum            (optional)
//   lens       { chart, hand } to show the chart with the hand marked (optional)
//   hideSeats  true to leave seat names off the table until answered
//   quick      true to move on by itself after a correct answer
import { h, fill, weightedPick } from './dom.js';
import { shell, segmented, dealSuits, handTag } from './components.js';
import { describeHand } from './ranges.js';
import { record, recordTime, stat } from './store.js';
import { newRound, score, dueRetry, roundOver, progressRow, verdict, roundSummary, boxWeight, LEAKS } from './drill.js';
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
    return weightedPick(fresh.length ? fresh : spots, (s) => boxWeight(stat(s.topic || topic, s.bucket || bucket, s.key || s.id)));
  };
}

/**
 * cfg: { title, back, topic, bucket, total, next(round), criteria?,
 *        filter?: { options, get(), set(v), label }, depth? }
 */
export function spotDrill(root, cfg) {
  const main = shell(root, { title: cfg.title, back: cfg.back });
  main.classList.add('page--drill');

  let round;
  let spot;
  let info;
  let view;
  let phase; // 'ask' | 'size' | 'done'
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
    round.leaks = {};
    ask();
  }

  function ask() {
    spot = dueRetry(round) || cfg.next(round);
    info = spot.hero ? readSpot(spot) : null;
    suits = spot.hero && spot.hero.hand ? dealSuits(spot.hero.hand) : null;
    result = null;
    phase = 'ask';
    view = spot.hero ? tableView(spot, info, { suits, hideSeats: !!spot.hideSeats }) : null;
    t0 = performance.now();
    draw();
  }

  function answer(id) {
    if (phase !== 'ask') return;
    const ok = spot.correct.includes(id);
    // The right raise still needs the right size.
    if (ok && spot.size && spot.size.when === id) {
      result = { id };
      phase = 'size';
      if (view) view.finish();
      return draw();
    }
    finish({ id, ok, leak: ok ? null : (spot.leaks || {})[id] || null });
  }

  function answerSize(sizeId) {
    if (phase !== 'size') return;
    const sizeOk = sizeId === spot.size.correct;
    record('table', 'sizes', spot.size.key, sizeOk, { countsToday: false });
    finish({ id: result.id, ok: sizeOk, sizeId, sizeOk, leak: sizeOk ? null : 'size' });
  }

  function finish(res) {
    const ms = performance.now() - t0;
    result = res;
    phase = 'done';
    if (view) {
      view.finish();
      view.reveal();
    }
    const topic = spot.topic || cfg.topic;
    const bucket = spot.bucket || cfg.bucket;
    record(topic, bucket, keyOf(spot), res.ok);
    if (spot.quick) recordTime(topic, bucket, ms);
    if (res.leak) round.leaks[res.leak] = (round.leaks[res.leak] || 0) + 1;
    score(round, keyOf(spot), res.ok, spot.quick ? ms : null, spot);
    draw();
    if (res.ok && spot.quick) timer = setTimeout(advance, 950);
  }

  function leakReport() {
    const rows = Object.entries(round.leaks).sort((a, b) => b[1] - a[1]);
    if (!rows.length) return null;
    return h('section', { class: 'block' },
      h('h2', { class: 'h2' }, 'What to work on'),
      h('ul', { class: 'leaks' }, rows.map(([id, n]) => h('li', null,
        h('span', { class: 'leaks__name' }, LEAKS[id].name, h('span', { class: 'pill pill--missed' }, `${n} ${n === 1 ? 'time' : 'times'}`)),
        h('span', { class: 'leaks__tip' }, LEAKS[id].tip)))));
  }

  function advance() {
    clearTimeout(timer);
    timer = null;
    if (!roundOver(round)) return ask();
    result = null;
    roundSummary(main, round, {
      back: cfg.back,
      again: start,
      extra: leakReport(),
      missRow: (s) => {
        const at = s.hero ? readSpot(s) : { toCall: 0, level: 2 };
        const play = s.correct.map((id) => {
          const custom = s.options.find((o) => typeof o !== 'string' && o.id === id);
          return custom ? custom.label : optionPhrase(id, at);
        }).join(' or ');
        return [
          [
            s.hero && s.hero.hand ? handTag(s.hero.hand) : null,
            s.hero && !s.hideSeats ? h('span', { class: 'tag' }, s.hero.seat) : null,
            h('span', { class: 'misses__title' }, s.title || ''),
          ],
          `${play}. ${s.why}`.replace(/^./, (c) => c.toUpperCase()),
        ];
      },
    });
  }

  function feedback() {
    const others = spot.correct.filter((id) => id !== result.id);
    const sized = spot.size && spot.correct.includes(spot.size.when);
    let head;
    if (result.sizeId && !result.sizeOk) head = 'Right play, wrong size.';
    else if (result.ok) head = others.length && !result.sizeId ? `Correct. You could also ${phrase(others[0])}.` : 'Correct.';
    else if (isCustom(spot.correct[0])) head = `Wrong. The answer: ${spot.correct.map(phrase).join(' or ')}.`;
    else head = `Wrong. The play is to ${spot.correct.map(phrase).join(' or ')}.`;
    return h('div', { class: 'feedback__body' },
      h('div', { class: 'feedback__head' },
        verdict(result.ok, head),
        result.leak ? h('span', { class: 'pill pill--missed' }, LEAKS[result.leak].name) : null),
      h('p', { class: 'feedback__rule' }, spot.why),
      sized && (result.sizeId || !result.ok) ? h('p', { class: 'feedback__rule' }, spot.size.why) : null,
      spot.factors && cfg.criteria ? factorList(spot.factors, cfg.criteria) : null,
      spot.math ? setMath(spot.math) : null,
      spot.lens ? rangeLens(spot.lens.chart, spot.lens.hand) : null);
  }

  function draw() {
    const sizing = phase === 'size';
    const opts = sizing ? spot.size.options : optionsOf(spot);
    const pick = sizing ? answerSize : answer;
    const wordy = opts.some((o) => o.label.length > 14);
    const filter = cfg.filter;
    const done = phase === 'done';

    const choice = (o) => {
      let cls = 'btn choice';
      const right = result && (result.sizeId ? o.id === spot.size.correct : spot.correct.includes(o.id));
      const chosen = result && (result.sizeId ? o.id === result.sizeId : o.id === result.id);
      if (done && right) cls += ' is-right';
      else if (done && chosen) cls += ' is-wrong';
      const primary = !done && (sizing || !QUIET.has(o.id));
      return h('button', {
        type: 'button',
        class: `${cls} ${primary ? 'btn--primary' : 'btn--quiet'}`,
        disabled: done,
        onclick: () => pick(o.id),
      }, o.label);
    };

    const question = sizing ? spot.size.question
      : spot.question || DEFAULT_QUESTION[info ? info.level : 2];
    const showChoices = !done || (result.ok && spot.quick);
    // After a size answer, show the sizes; otherwise the plays.
    const shown = done && result.sizeId ? spot.size.options : opts;

    fill(main,
      filter ? segmented(filter.options, filter.get(), (v) => { filter.set(v); if (done) draw(); else ask(); }, filter.label) : null,
      progressRow(round),
      spot.banner ? h('p', { class: 'banner' }, spot.banner) : null,
      spot.hero
        ? h('section', { class: 'spot' },
          view.el,
          h('div', { class: 'spot__meta' },
            h('p', { class: 'spot__hand' },
              spot.hero.hand ? h('strong', null, describeHand(spot.hero.hand)) : null,
              spot.hideSeats && !done ? null : [spot.hero.hand ? ' · ' : '', SEAT_NAMES[spot.hero.seat]]),
            spot.hideSeats ? null : spotFacts(info, { depth: !!(cfg.depth || spot.math) })),
          readsList(spot))
        : null,
      h('p', { class: 'ask' }, question),
      done ? h('div', { class: 'feedback feedback--open', 'aria-live': 'polite' }, feedback()) : null,
      h('div', { class: `actions ${wordy ? 'actions--stack' : ''} ${shown.length > 4 ? 'actions--many' : ''}` },
        showChoices
          ? shown.map(choice)
          : h('button', { type: 'button', class: 'btn btn--primary btn--wide', onclick: advance },
            roundOver(round) ? 'See the round' : 'Next hand')),
    );
    if (done) main.querySelector('.feedback').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  start();
  return () => clearTimeout(timer);
}
