// Home: every topic, with its activities one tap away.
import { h, pct, fill } from './dom.js';
import { shell, meter, ICON } from './components.js';
import { OPEN_SIZE_BB, LADDER } from './ranges.js';
import { today, dayStreak, storageMode, stat, bucketOf } from './store.js';
import { TOPIC as OPEN, totals, edgesKnown, weakest } from './preflop/model.js';

const STORAGE_NOTE = {
  account: 'Progress is saved to your account and follows you between devices.',
  browser: 'Progress is saved in this browser on this device.',
  none: 'This browser is blocking storage, so progress lasts only until you close the page.',
};

function perfect(keys) {
  return keys.filter((key) => (stat(OPEN, 'paint', key) || {}).best === 1).length;
}

export function home(root) {
  const main = shell(root, { title: 'Learn Poker' });
  const day = today();
  const streak = dayStreak();
  const t = totals();
  const edges = edgesKnown();
  const weak = weakest(8).length;

  let hands = 0;
  let right = 0;
  for (const st of Object.values(bucketOf(OPEN, 'hands'))) {
    hands += st.n;
    right += st.c;
  }
  const layerKeys = LADDER.slice(1).map((to, i) => `${LADDER[i]}>${to}`);

  const lede = day.n
    ? `${day.n} ${day.n === 1 ? 'answer' : 'answers'} today${streak > 1 ? ` · ${streak} days running` : ''}`
    : streak > 0 ? `${streak} ${streak === 1 ? 'day' : 'days'} running. Keep it going today.`
    : 'Short drills for the things worth knowing cold.';

  const items = [
    { route: 'open-learn', title: 'Study the ranges', text: 'Charts, cut-offs and what each seat adds' },
    { route: 'open-drill', title: 'Raise or fold', text: 'One seat, one hand, one decision', stat: hands ? `${pct(right / hands)} right` : 'Start here', main: true },
    { route: 'open-edges', title: 'Find the cut-off', text: 'Name the weakest hand you open in a row', stat: `${edges.known}/${edges.total}` },
    { route: 'open-paint', title: 'Paint the range', text: "Fill in a seat's chart from memory", stat: `${perfect(LADDER)}/${LADDER.length}` },
    { route: 'open-layers', title: "What's new?", text: 'Add the hands that open one seat later', stat: `${perfect(layerKeys)}/${layerKeys.length}` },
    { route: 'open-progress', title: 'Progress', text: 'Misses by hand, and your weakest spots', stat: weak ? `${weak} weak` : '' },
  ];

  fill(main,
    h('p', { class: 'lede' }, lede),
    h('section', { class: 'topic' },
      h('p', { class: 'eyebrow' }, 'Pre-flop'),
      h('h2', { class: 'topic__title' }, 'Opening ranges'),
      h('p', { class: 'topic__blurb' },
        `Which hands to open from each seat when everyone before you has folded. Every open is a raise to ${OPEN_SIZE_BB}bb.`),
      h('div', { class: 'topic__meter' },
        meter(t.mastery, 'Edge hands known'),
        h('span', null, `${pct(t.mastery)} of edge hands known`)),
      h('nav', { class: 'menu', 'aria-label': 'Opening ranges' }, items.map((it) =>
        h('a', { class: it.main ? 'menu__item menu__item--main' : 'menu__item', href: `#${it.route}` },
          h('span', { class: 'menu__text' },
            h('span', { class: 'menu__title' }, it.title),
            h('span', { class: 'menu__sub' }, it.text)),
          it.stat ? h('span', { class: 'menu__stat' }, it.stat) : null,
          h('span', { class: 'menu__go', html: ICON.go }))))),
    h('p', { class: 'footnote' }, STORAGE_NOTE[storageMode()]),
  );
}
