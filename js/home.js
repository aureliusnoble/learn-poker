// Home: every tutorial, with its activities one tap away.
import { h, pct, fill } from './dom.js';
import { shell, meter, ICON } from './components.js';
import { OPEN_SIZE_BB, LADDER } from './ranges.js';
import { today, dayStreak, storageMode, stat, bucketOf } from './store.js';
import { SOLID } from './drill.js';
import { TOPIC as OPEN, totals, edgesKnown, weakest } from './preflop/model.js';
import { SPOTS as TB_SPOTS } from './data/threebet.js';
import { CALL_SPOTS, SET_SPOTS } from './data/coldcall.js';
import { ALL_FACTS } from './play.js';
import { SPOTS as LIMP_SPOTS } from './data/limpers.js';
import { SPOTS as SQUEEZE_SPOTS } from './data/squeeze.js';
import { SPOTS as BLIND_SPOTS } from './data/blinds.js';
import { installCard } from './install.js';

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
    progress == null ? null : h('div', { class: 'topic__meter' }, meter(progress, label), h('span', null, `${pct(progress)} ${label}`)),
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

  const factsKnown = ALL_FACTS.filter((f) => (stat(f.topic, 'facts', f.key) || {}).b >= SOLID).length;

  // 3-betting
  const tbKnown = known('threebet', 'spots', TB_SPOTS);

  // Cold-calling
  const callKnown = known('coldcall', 'spots', CALL_SPOTS);
  const setKnown = known('coldcall', 'sets', SET_SPOTS);
  const callTotal = CALL_SPOTS.length + SET_SPOTS.length;
  const limpKnown = known('limp', 'spots', LIMP_SPOTS);
  const squeezeKnown = known('squeeze', 'spots', SQUEEZE_SPOTS);
  const blindKnown = known('blinds', 'spots', BLIND_SPOTS);

  fill(main,
    h('p', { class: 'lede' }, lede),

    topic({
      eyebrow: 'At the table',
      title: 'Play',
      blurb: 'Every situation from the tutorials, dealt at a table of four to six and marked against the book.',
      items: [
        { route: 'play', title: 'Pre-flop simulator', text: 'Any situation: decide, size the raise, see the mistake', stat: accuracy('sim', 'situations', 'Start here'), main: true },
        { route: 'report', title: 'Simulator report', text: 'Where you leave the book: by situation, seat and leak' },
        { route: 'seats', title: 'Find your seat', text: 'Read your position from the dealer button', stat: accuracy('table', 'seats') },
        { route: 'sizes', title: 'Size the raise', text: '3-bets and 4-bets, in and out of position', stat: accuracy('table', 'sizes') },
        { route: 'facts', title: 'Quick facts', text: 'The numbers and rules to know by heart', stat: `${factsKnown}/${ALL_FACTS.length}` },
      ],
    }),

    topic({
      eyebrow: 'Pre-flop · 1',
      title: 'Opening ranges',
      blurb: `Which hands to open from each seat when everyone before you has folded. Every open is a raise to ${OPEN_SIZE_BB}bb.`,
      progress: t.mastery,
      label: 'of edge hands known',
      items: [
        { route: 'open-learn', title: 'Cheat sheet', text: 'Charts, cut-offs and what each seat adds' },
        { route: 'open-drill', title: 'Raise or fold', text: 'Folded to you: open or let it go', stat: accuracy(OPEN, 'hands'), main: true },
        { route: 'open-edges', title: 'Find the cut-off', text: 'Name the weakest hand you open in a row', stat: `${edges.known}/${edges.total}` },
        { route: 'open-progress', title: 'Progress', text: 'Misses by hand, and your weakest spots', stat: weak ? `${weak} weak` : '' },
        { route: 'open-paint', title: 'Paint the range', text: "Fill in a seat's chart from memory", stat: `${perfect(LADDER)}/${LADDER.length}` },
        { route: 'open-layers', title: "What's new?", text: 'Add the hands that open one seat later', stat: `${perfect(layerKeys)}/${layerKeys.length}` },
      ],
    }),

    topic({
      eyebrow: 'Pre-flop · 2',
      title: '3-betting',
      blurb: 'Re-raising an open for value, as a merged range or as a bluff, and what to do when the 3-bet or 4-bet comes at you.',
      progress: tbKnown / TB_SPOTS.length,
      label: 'of spots known',
      items: [
        { route: 'tb-learn', title: 'Cheat sheet', text: 'Sizes, value ranges by opener, bluffs and 4-bets' },
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
        { route: 'call-learn', title: 'Cheat sheet', text: 'What to call and 3-bet by raiser, and the set-mining rule' },
        { route: 'call-drill', title: 'Call, 3-bet or fold', text: 'A raise in front of you and the default charts', stat: accuracy('coldcall', 'hands'), main: true },
        { route: 'call-spots', title: 'Read the table', text: 'Hands where the other players change the answer', stat: `${callKnown}/${CALL_SPOTS.length}` },
        { route: 'call-tool', title: 'Set-mining sums', text: 'Slide the call and the stack, see what the rule says' },
        { route: 'call-sets', title: 'Set mining', text: 'The 15-to-1 rule, then whole hands', stat: `${setKnown}/${SET_SPOTS.length}` },
        { route: 'call-progress', title: 'Progress', text: 'Misses by chart, and each hand' },
      ],
    }),

    topic({
      eyebrow: 'Pre-flop · 4',
      title: 'Limpers',
      blurb: 'Someone calls the big blind in front of you. When to raise them, how big, and when to limp behind.',
      progress: limpKnown / LIMP_SPOTS.length,
      label: 'of spots known',
      items: [
        { route: 'limp-learn', title: 'Cheat sheet', text: 'The size formula, what to raise, what to limp' },
        { route: 'limp-drill', title: 'Limpers in front', text: 'Raise, limp behind or fold, then size it', stat: accuracy('limp', 'hands'), main: true },
        { route: 'limp-spots', title: 'Read the limper', text: 'Tight or loose, short stacks, raisers behind', stat: `${limpKnown}/${LIMP_SPOTS.length}` },
        { route: 'limp-progress', title: 'Progress', text: 'Misses by hand, and each spot' },
      ],
    }),

    topic({
      eyebrow: 'Pre-flop · 5',
      title: 'Squeezing and over-calling',
      blurb: 'One player raises and another calls before it gets to you. When to re-raise them both, when to call along, and how big.',
      progress: squeezeKnown / SQUEEZE_SPOTS.length,
      label: 'of spots known',
      items: [
        { route: 'sq-learn', title: 'Cheat sheet', text: 'Sizes, value ranges by raiser, the over-calling range' },
        { route: 'sq-drill', title: 'A raise and a caller', text: 'Squeeze, over-call or fold, then size it', stat: accuracy('squeeze', 'hands'), main: true },
        { route: 'sq-spots', title: 'Squeeze or over-call?', text: "The book's hands, and who is left to act", stat: `${squeezeKnown}/${SQUEEZE_SPOTS.length}` },
        { route: 'sq-progress', title: 'Progress', text: 'Misses by chart, and each spot' },
      ],
    }),

    topic({
      eyebrow: 'Pre-flop · 6',
      title: 'Stealing and blind defence',
      blurb: 'Raising first in from late position to take the blinds, and what to defend with when someone tries it on you.',
      progress: blindKnown / BLIND_SPOTS.length,
      label: 'of spots known',
      items: [
        { route: 'bl-learn', title: 'Cheat sheet', text: 'Steal maths, the price to call, both defending ranges' },
        { route: 'bl-steal', title: 'Steal the blinds', text: 'Who is in the blinds decides the range and the size', stat: accuracy('blinds', 'steal'), main: true },
        { route: 'bl-defend', title: 'Defend your blind', text: 'Fold, call or 3-bet from the small and big blind', stat: accuracy('blinds', 'defend') },
        { route: 'bl-sums', title: 'Steal sums and spots', text: 'Break-even, both blinds folding, the price of a call', stat: `${blindKnown}/${BLIND_SPOTS.length}` },
        { route: 'bl-progress', title: 'Progress', text: 'Misses by hand, and each spot' },
      ],
    }),

    installCard(),
    h('p', { class: 'footnote' }, STORAGE_NOTE[storageMode()]),
  );
}
