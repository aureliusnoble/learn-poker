// Squeezing and over-calling: the cheat sheet and the drills.
import { aSeat } from '../table.js';
import { h, fill } from '../dom.js';
import { shell } from '../components.js';
import { LESSONS, SPOTS, CHEAT, TRICKS } from '../data/squeeze.js';
import { cheatSheet, moreDetail, chartStudy } from '../feedback.js';
import { spotDrill, deckOf } from '../spotdrill.js';
import { topicProgress } from '../topicprogress.js';
import { TOPIC, CHARTS, STUDY_CHARTS, nextSqueezeSpot, dressed } from './model.js';

const study = { id: 'overcall' };

export function learnSqueeze(root) {
  const main = shell(root, { title: 'Squeezing and over-calling', back: 'home' });
  const draw = () => fill(main,
    cheatSheet(CHEAT, TRICKS),
    h('h2', { class: 'h2' }, 'The charts'),
    chartStudy(STUDY_CHARTS, study, draw),
    moreDetail(LESSONS));
  draw();
}

export function squeezeDrill(root) {
  return spotDrill(root, {
    title: 'A raise and a caller',
    back: 'home',
    topic: TOPIC,
    bucket: 'hands',
    total: 20,
    next: nextSqueezeSpot,
  });
}

export function squeezeSpots(root) {
  const deck = deckOf(SPOTS, TOPIC, 'spots');
  return spotDrill(root, {
    title: 'Squeeze or over-call?',
    back: 'home',
    topic: TOPIC,
    bucket: 'spots',
    total: SPOTS.length,
    depth: true,
    next: (round) => dressed(deck(round)),
  });
}

export function progressSqueeze(root) {
  topicProgress(root, {
    title: 'Progress',
    back: 'home',
    topic: TOPIC,
    name: 'squeezing and over-calling',
    buckets: ['hands', 'spots'],
    charts: {
      list: CHARTS,
      bucket: 'hands',
      describe: (chart, hand) => {
        const cat = chart.category(chart.categoryOf(hand));
        return cat ? `${cat.label} against ${aSeat(chart.id)} raise and a caller.` : `Fold against ${aSeat(chart.id)} raise and a caller.`;
      },
    },
    decks: [{ label: 'Squeeze or over-call?', bucket: 'spots', spots: SPOTS }],
  });
}
