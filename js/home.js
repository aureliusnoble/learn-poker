// Home: every tutorial, with its activities one tap away.
import { h, pct, fill } from './dom.js';
import { shell, meter, ICON } from './components.js';
import { OPEN_SIZE_BB, LADDER } from './ranges.js';
import { today, dayStreak, storageMode, stat, bucketOf } from './store.js';
import { SOLID } from './drill.js';
import { TOPIC as OPEN, totals, edgesKnown, weakest } from './preflop/model.js';
import { SPOTS as TB_SPOTS } from './data/threebet.js';
import { CALL_SPOTS, SET_SPOTS } from './data/coldcall.js';

const STORAGE_NOTE = {
  account: 'Progress is saved to your account and follows you between devices.',
  browser: 'Progress is saved in this browser on this device.',
  none: 'This browser is blocking storage, so progress lasts only until you close the page.',
};

/** Share of answers right in one bucket, as a menu label. */
function accuracy(topic, bucket, empty = '') {
  let n = 0;
  let c = 0;
  for (const st of Object.values(bucketOf(topic, bucket))) {
    n += st.n;
    c += st.c;
  }
  return n ? `${pct(c / n)} right` : empty;
}

/** How many of a list of practice spots have been got right twice running. */
function known(topic, bucket, spots) {
  return spots.filter((s) => (stat(topic, bucket, s.key || s.id) || {}).b >= SOLID).length;
}

function topic({ eyebrow, title, blurb, progress, label, items }) {
  return h('section', { class: 'topic' },
    h('p', { class: 'eyebrow' }, eyebrow),
    h('h2', { class: 'topic__title' }, title),
    h('p', { class: 'topic__blurb' }, blurb),
    h('div', { class: 'topic__meter' }, meter(progress, label), h('span', null, `${pct(progress)} ${label}`)),
    h('nav', { class: 'menu', 'aria-label': title }, items.map((it) =>
      h('a', { class: it.main ? 'menu__item menu__item--main' : 'menu__item', href: `#${it.route}` },
        h('span', { class: 'menu__text' },
          h('span', { class: 'menu__title' }, it.title),
          h('span', { class: 'menu__sub' }, it.text)),
        it.stat ? h('span', { class: 'menu__stat' }, it.stat) : null,
        h('span', { class: 'menu__go', html: ICON.go })))));
}

export function home(root) {
  const main = shell(root, { title: 'Learn Poker' });
  const day = today();
  const streak = dayStreak();

  const lede = day.n
    ? `${day.n} ${day.n === 1 ? 'answer' : 'answers'} today${streak > 1 ? ` · ${streak} days running` : ''}`
    : streak > 0 ? `${streak} ${streak === 1 ? 'day' : 'days'} running. Keep it going today.`
    : 'Short drills for the things worth knowing cold.';

  // Opening ranges
  const t = totals();
  const edges = edgesKnown();
  const weak = weakest(8).length;
  const perfect = (keys) => keys.filter((key) => (stat(OPEN, 'paint', key) || {}).best === 1).length;
  const layerKeys = LADDER.slice(1).map((to, i) => `${LADDER[i]}>${to}`);

  // 3-betting
  const tbKnown = known('threebet', 'spots', TB_SPOTS);

  // Cold-calling
  const callKnown = known('coldcall', 'spots', CALL_SPOTS);
  const setKnown = known('coldcall', 'sets', SET_SPOTS);
  const callTotal = CALL_SPOTS.length + SET_SPOTS.length;

  fill(main,
    h('p', { class: 'lede' }, lede),

    topic({
      eyebrow: 'Pre-flop · 1',
      title: 'Opening ranges',
      blurb: `Which hands to open from each seat when everyone before you has folded. Every open is a raise to ${OPEN_SIZE_BB}bb.`,
      progress: t.mastery,
      label: 'of edge hands known',
      items: [
        { route: 'open-learn', title: 'Study the ranges', text: 'Charts, cut-offs and what each seat adds' },
        { route: 'open-drill', title: 'Raise or fold', text: 'One seat, one hand, one decision', stat: accuracy(OPEN, 'hands', 'Start here'), main: true },
        { route: 'open-edges', title: 'Find the cut-off', text: 'Name the weakest hand you open in a row', stat: `${edges.known}/${edges.total}` },
        { route: 'open-paint', title: 'Paint the range', text: "Fill in a seat's chart from memory", stat: `${perfect(LADDER)}/${LADDER.length}` },
        { route: 'open-layers', title: "What's new?", text: 'Add the hands that open one seat later', stat: `${perfect(layerKeys)}/${layerKeys.length}` },
        { route: 'open-progress', title: 'Progress', text: 'Misses by hand, and your weakest spots', stat: weak ? `${weak} weak` : '' },
      ],
    }),

    topic({
      eyebrow: 'Pre-flop · 2',
      title: '3-betting',
      blurb: 'Re-raising an open for value, as a merged range or as a bluff, and what to do when the 3-bet or 4-bet comes at you.',
      progress: tbKnown / TB_SPOTS.length,
      label: 'of spots known',
      items: [
        { route: 'tb-learn', title: 'Study 3-betting', text: 'The ladder, the kinds of 3-bet, and 4-bets' },
        { route: 'tb-charts', title: 'Which 3-bet?', text: 'Place a hand on the value, bluff and merged charts', stat: accuracy('threebet', 'hands') },
        { route: 'tb-spots', title: 'Play the spot', text: 'Choose the play against the player in front of you', stat: `${tbKnown}/${TB_SPOTS.length}`, main: true },
        { route: 'tb-progress', title: 'Progress', text: 'Misses by chart, and each spot' },
      ],
    }),

    topic({
      eyebrow: 'Pre-flop · 3',
      title: 'Cold-calling and set mining',
      blurb: 'When to call a raise instead of folding or 3-betting, and when a small pair is worth a call.',
      progress: (callKnown + setKnown) / callTotal,
      label: 'of hands known',
      items: [
        { route: 'call-learn', title: 'Study cold-calling', text: 'The gap concept, five things to weigh, the default ranges' },
        { route: 'call-drill', title: 'Call, 3-bet or fold', text: 'A raise in front of you and the default charts', stat: accuracy('coldcall', 'hands'), main: true },
        { route: 'call-spots', title: 'Read the table', text: 'Hands where the other players change the answer', stat: `${callKnown}/${CALL_SPOTS.length}` },
        { route: 'call-tool', title: 'Set-mining sums', text: 'Slide the call and the stack, see what the rule says' },
        { route: 'call-sets', title: 'Set mining', text: 'The 15-to-1 rule, then whole hands', stat: `${setKnown}/${SET_SPOTS.length}` },
        { route: 'call-progress', title: 'Progress', text: 'Misses by chart, and each hand' },
      ],
    }),

    h('p', { class: 'footnote' }, STORAGE_NOTE[storageMode()]),
  );
}
