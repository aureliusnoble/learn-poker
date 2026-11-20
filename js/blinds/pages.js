// Stealing the blinds and defending them: the cheat sheet and the drills.
import { h, fill } from '../dom.js';
import { shell } from '../components.js';
import { LESSONS, SPOTS, CHEAT, TRICKS } from '../data/blinds.js';
import { cheatSheet, moreDetail, chartStudy } from '../feedback.js';
import { spotDrill, deckOf } from '../spotdrill.js';
import { topicProgress } from '../topicprogress.js';
import {
  TOPIC, STEAL_CHARTS, DEFEND_CHARTS, nextStealSpot, nextDefendSpot, nextBlindSum, dressed,
} from './model.js';

const STUDY = [...DEFEND_CHARTS.map((c) => ({ ...c, id: `d-${c.id}`, name: `${c.id} defends` })),
  ...STEAL_CHARTS.map((c) => ({ ...c, id: `s-${c.id}`, name: `${c.id} steals` }))];
const study = { id: STUDY[0].id };

export function learnBlinds(root) {
  const main = shell(root, { title: 'Stealing and blind defence', back: 'ch-blinds' });
  const draw = () => fill(main,
    cheatSheet(CHEAT, TRICKS),
    h('h2', { class: 'h2' }, 'The charts'),
    chartStudy(STUDY, study, draw),
    moreDetail(LESSONS));
  draw();
}

export function stealDrill(root) {
  return spotDrill(root, {
    title: 'Steal the blinds',
    log: 'blinds/steal',
    back: 'ch-blinds',
    topic: TOPIC,
    bucket: 'steal',
    total: 20,
    next: nextStealSpot,
  });
}

export function defendDrill(root) {
  return spotDrill(root, {
    title: 'Defend your blind',
    log: 'blinds/defend',
    back: 'ch-blinds',
    topic: TOPIC,
    bucket: 'defend',
    total: 20,
    next: nextDefendSpot,
  });
}

export function blindSums(root) {
  const deck = deckOf(SPOTS, TOPIC, 'spots');
  let turn = 0;
  return spotDrill(root, {
    title: 'Steal sums and spots',
    log: 'blinds/sums',
    back: 'ch-blinds',
    topic: TOPIC,
    bucket: 'spots',
    total: 12,
    // Two sums, then one of the written hands, so the arithmetic is warm when the judgement comes.
    next: (round) => ((turn++ % 3 === 2) ? dressed(deck(round)) : nextBlindSum()),
  });
}

export function progressBlinds(root) {
  topicProgress(root, {
    title: 'Progress',
    back: 'ch-blinds',
    topic: TOPIC,
    name: 'stealing and blind defence',
    buckets: ['steal', 'defend', 'sums', 'spots'],
    charts: {
      list: DEFEND_CHARTS,
      bucket: 'defend',
      describe: (chart, hand) => {
        const cat = chart.category(chart.categoryOf(hand));
        return cat ? `${cat.label} from the ${chart.name.toLowerCase()}.` : `Fold from the ${chart.name.toLowerCase()}.`;
      },
    },
    decks: [{ label: 'Written hands', bucket: 'spots', spots: SPOTS }],
  });
}
