// A chapter's own page: learn it, look it up, practise it, check it.
import { h, fill } from './dom.js';
import { shell, ICON } from './components.js';
import { stat, logOf } from './store.js';
import { momentum, asPct } from './trend.js';

export const lessonDone = (lesson) => !!stat('guide', 'done', lesson.id);

/** A drill's score over its last answers, once there are enough to show one. */
function recent(log) {
  const entry = log ? logOf(log) : null;
  if (!entry) return '';
  const m = momentum(entry);
  return m.now == null ? `${m.nNow} played` : asPct(m.now);
}

function row({ route, title, text, stat: right, done = false, main = false }) {
  return h('a', { class: main ? 'menu__item menu__item--main' : 'menu__item', href: `#${route}` },
    h('span', { class: 'menu__text' },
      h('span', { class: 'menu__title' }, title),
      h('span', { class: 'menu__sub' }, text)),
    done ? h('span', { class: 'menu__done', title: 'Done' }, h('span', { html: ICON.check }), h('span', { class: 'sr' }, 'Done')) : null,
    right ? h('span', { class: 'menu__stat' }, right) : null,
    h('span', { class: 'menu__go', html: ICON.go }));
}

function group(title, hint, rows) {
  return h('section', { class: 'block' },
    h('h2', { class: 'h2' }, title),
    hint ? h('p', { class: 'hint' }, hint) : null,
    h('nav', { class: 'menu', 'aria-label': title }, rows));
}

export const chapterPage = (chapter) => (root) => {
  const main = shell(root, { title: chapter.title, back: 'home' });
  // The first lesson not yet done is the one to open next.
  const next = chapter.lessons.find((l) => !lessonDone(l));
  fill(main,
    h('p', { class: 'lede' }, chapter.blurb),
    group('Learn', 'See it happen at the table, a step at a time.',
      chapter.lessons.map((l) => row({ route: l.route, title: l.title, text: l.blurb, done: lessonDone(l), main: l === next }))),
    group('Practise', 'The percentage is your score over your last 25 answers.',
      chapter.drills.map((d, i) => row({ ...d, stat: recent(d.log), main: !next && i === 0 }))),
    chapter.sheet || chapter.tools || chapter.progress
      ? group('Look it up', null, [
        chapter.sheet ? row({ route: chapter.sheet.route, title: 'Cheat sheet', text: chapter.sheet.text }) : null,
        ...(chapter.tools || []).map(row),
        chapter.progress ? row({ route: chapter.progress, title: 'Your misses', text: 'Which hands and spots you get wrong most' }) : null,
      ])
      : null);
};
