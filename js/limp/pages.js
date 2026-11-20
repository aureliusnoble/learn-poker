// Isolating limpers and limping behind: the cheat sheet and the drills.
import { h, fill } from '../dom.js';
import { shell } from '../components.js';
import { LESSONS, SPOTS, CHEAT, TRICKS } from '../data/limpers.js';
import { cheatSheet, moreDetail, chartStudy } from '../feedback.js';
import { spotDrill, deckOf } from '../spotdrill.js';
import { topicProgress } from '../topicprogress.js';
import { isoSize } from '../sizing.js';
import { TOPIC, STUDY_CHARTS, LIMP_CHART, nextLimpSpot } from './model.js';

const study = { id: 'iso' };

export function learnLimp(root) {
  const main = shell(root, { title: 'Limpers', back: 'home' });
  const draw = () => fill(main,
    cheatSheet(CHEAT, TRICKS),
    h('h2', { class: 'h2' }, 'The charts'),
    chartStudy(STUDY_CHARTS, study, draw),
    moreDetail(LESSONS));
  draw();
}

export function limpDrill(root) {
  return spotDrill(root, {
    title: 'Limpers in front',
    log: 'limp/drill',
    back: 'home',
    topic: TOPIC,
    bucket: 'hands',
    total: 20,
    next: nextLimpSpot,
  });
}

export function limpSpots(root) {
  const deck = deckOf(SPOTS, TOPIC, 'spots');
  return spotDrill(root, {
    title: 'Read the limper',
    log: 'limp/spots',
    back: 'home',
    topic: TOPIC,
    bucket: 'spots',
    total: SPOTS.length,
    // A spot whose answer is the standard raise also asks for its size.
    next: (round) => {
      const spot = deck(round);
      const plain = spot.hero && spot.options.includes('iso') && spot.correct.length === 1 && spot.correct[0] === 'iso';
      return plain ? { ...spot, size: isoSize(spot) } : spot;
    },
  });
}

export function progressLimp(root) {
  topicProgress(root, {
    title: 'Progress',
    back: 'home',
    topic: TOPIC,
    name: 'limpers',
    buckets: ['hands', 'spots'],
    charts: {
      list: [LIMP_CHART],
      bucket: 'hands',
      describe: (chart, hand) => {
        const cat = chart.category(chart.categoryOf(hand));
        return cat ? `${cat.label}.` : 'Fold.';
      },
    },
    decks: [{ label: 'Read the limper', bucket: 'spots', spots: SPOTS }],
  });
}
