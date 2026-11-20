// Home: the simulator, then the chapters in order.
import { h, pct, fill } from './dom.js';
import { shell, ICON } from './components.js';
import { today, dayStreak, storageMode, logOf } from './store.js';
import { momentum, trendWord, asPct } from './trend.js';
import { CHAPTERS } from './chapters.js';
import { lessonDone } from './chapter.js';
import { installCard } from './install.js';

const STORAGE_NOTE = {
  account: 'Progress is saved to your account and follows you between devices.',
  browser: 'Progress is saved in this browser on this device.',
  none: 'This browser is blocking storage, so progress lasts only until you close the page.',
};

function link({ route, title, text, stat }) {
  return h('a', { class: 'menu__item', href: `#${route}` },
    h('span', { class: 'menu__text' },
      h('span', { class: 'menu__title' }, title),
      h('span', { class: 'menu__sub' }, text)),
    stat ? h('span', { class: 'menu__stat' }, stat) : null,
    h('span', { class: 'menu__go', html: ICON.go }));
}

/** Where a chapter stands: lessons done, then the score across its drills. */
function standing(chapter) {
  const done = chapter.lessons.filter(lessonDone).length;
  if (done < chapter.lessons.length) return `${done}/${chapter.lessons.length} ${chapter.lessons.length === 1 ? 'lesson' : 'lessons'}`;
  const scores = chapter.drills.map((d) => momentum(logOf(d.log)).now).filter((x) => x != null);
  return scores.length ? pct(scores.reduce((a, b) => a + b, 0) / scores.length) : 'Learned';
}

export function home(root) {
  const main = shell(root, { title: 'Learn Poker' });
  const day = today();
  const streak = dayStreak();
  const lede = day.n
    ? `${day.n} ${day.n === 1 ? 'answer' : 'answers'} today${streak > 1 ? ` · ${streak} days running` : ''}`
    : streak > 0 ? `${streak} ${streak === 1 ? 'day' : 'days'} running. Keep it going today.`
    : 'Pre-flop poker, learned at the table.';

  const sim = momentum(logOf('sim/all'));
  const overall = trendWord(momentum(logOf('all')).delta);
  // The chapter to carry on with: the first one with a lesson still to do.
  const current = CHAPTERS.find((c) => c.lessons.some((l) => !lessonDone(l)));

  fill(main,
    h('p', { class: 'lede' }, lede),

    h('section', { class: 'hero' },
      h('p', { class: 'eyebrow' }, 'Play'),
      h('h2', { class: 'hero__title' }, 'Pre-flop simulator'),
      h('p', { class: 'hero__text' }, 'Hands from every chapter, dealt at a table of four to six. Each answer is marked against the book.'),
      h('a', { class: 'btn btn--primary btn--wide', href: '#play' }, sim.now == null ? 'Play' : `Play · ${asPct(sim.now)} lately`)),

    h('section', { class: 'block' },
      h('h2', { class: 'h2' }, 'Chapters'),
      h('p', { class: 'hint' }, 'Each has a walkthrough, drills and a cheat sheet. They build on each other, so start at the top.'),
      h('nav', { class: 'menu', 'aria-label': 'Chapters' }, CHAPTERS.map((c) =>
        h('a', { class: c === current ? 'menu__item menu__item--main' : 'menu__item', href: `#${c.route}` },
          h('span', { class: 'menu__num' }, String(c.number)),
          h('span', { class: 'menu__text' },
            h('span', { class: 'menu__title' }, c.title),
            h('span', { class: 'menu__sub' }, c.blurb)),
          h('span', { class: 'menu__stat' }, standing(c)),
          h('span', { class: 'menu__go', html: ICON.go }))))),

    h('section', { class: 'block' },
      h('h2', { class: 'h2' }, 'Quick practice'),
      h('nav', { class: 'menu', 'aria-label': 'Quick practice' },
        link({ route: 'sizes', title: 'Size the raise', text: 'Raises over limpers, 3-bets and 4-bets' }),
        link({ route: 'facts', title: 'Quick facts', text: 'The numbers and rules to know by heart' }))),

    h('section', { class: 'block' },
      h('h2', { class: 'h2' }, 'How you are doing'),
      h('nav', { class: 'menu', 'aria-label': 'How you are doing' },
        link({ route: 'trends', title: 'Progress over time', text: 'Your score on each exercise, round by round', stat: overall ? overall.text : '' }),
        link({ route: 'report', title: 'Simulator report', text: 'Where you leave the book: by situation, seat and leak' }))),

    installCard(),
    h('p', { class: 'footnote' }, STORAGE_NOTE[storageMode()]),
  );
}
