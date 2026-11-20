// The chapters, in the order they are best learned. The home page and each
// chapter page are drawn from this list. `log` is the exercise id a drill's
// answers are kept under (see store.js), so its recent score can be shown.
import { lessonsFor } from './data/lessons.js';

const DEFS = [
  {
    id: 'table',
    title: 'The table',
    blurb: 'Seats, blinds and position: the words every other chapter uses.',
    drills: [
      { route: 'seats', log: 'table/seats', title: 'Find your seat', text: 'Read your position from the dealer button' },
    ],
  },
  {
    id: 'open',
    title: 'Opening ranges',
    blurb: 'Everyone folds to you. Which hands do you raise?',
    sheet: { route: 'open-learn', text: 'Every range as a chart, and the weakest hand each seat opens' },
    drills: [
      { route: 'open-drill', log: 'open/drill', title: 'Raise or fold', text: 'Folded to you: open or let it go' },
      { route: 'open-edges', log: 'open/edges', title: 'Find the cut-off', text: 'Name the weakest hand a seat opens' },
      { route: 'open-paint', log: 'open/paint', title: 'Paint the range', text: "Fill in a seat's chart from memory" },
      { route: 'open-layers', log: 'open/layers', title: "What's new?", text: 'Add the hands that open one seat later' },
    ],
    progress: 'open-progress',
  },
  {
    id: 'threebet',
    title: '3-betting',
    blurb: 'Re-raising a raise, and what to do when someone re-raises you.',
    sheet: { route: 'tb-learn', text: 'Sizes, value ranges by raiser, bluffs and 4-bets' },
    drills: [
      { route: 'tb-spots', log: 'threebet/spots', title: 'Play the spot', text: 'Choose the play against the player in front of you' },
      { route: 'tb-charts', log: 'threebet/charts', title: 'Which 3-bet?', text: 'Place a hand on the value, bluff and merged charts' },
    ],
    progress: 'tb-progress',
  },
  {
    id: 'coldcall',
    title: 'Calling a raise',
    blurb: 'When to call instead of folding or re-raising, and when a small pair is worth it.',
    sheet: { route: 'call-learn', text: 'What to call and 3-bet by raiser, and the set-mining rule' },
    tools: [{ route: 'call-tool', title: 'Set-mining sums', text: 'Slide the call and the stack, see what the rule says' }],
    drills: [
      { route: 'call-drill', log: 'coldcall/drill', title: 'Call, 3-bet or fold', text: 'A raise in front of you and the default charts' },
      { route: 'call-spots', log: 'coldcall/spots', title: 'Read the table', text: 'Hands where the other players change the answer' },
      { route: 'call-sets', log: 'coldcall/sets', title: 'Set mining', text: 'The 15-to-1 rule, then whole hands' },
    ],
    progress: 'call-progress',
  },
  {
    id: 'limp',
    title: 'Limpers',
    blurb: 'Someone just calls the big blind. Raise them, limp behind, or fold.',
    sheet: { route: 'limp-learn', text: 'The size formula, what to raise, what to limp' },
    drills: [
      { route: 'limp-drill', log: 'limp/drill', title: 'Limpers in front', text: 'Raise, limp behind or fold, then size it' },
      { route: 'limp-spots', log: 'limp/spots', title: 'Read the limper', text: 'Tight or loose, short stacks, raisers behind' },
    ],
    progress: 'limp-progress',
  },
  {
    id: 'squeeze',
    title: 'A raise and a caller',
    blurb: 'Two players are in before you. Squeeze, over-call or fold.',
    sheet: { route: 'sq-learn', text: 'Sizes, value ranges by raiser, the over-calling range' },
    drills: [
      { route: 'sq-drill', log: 'squeeze/drill', title: 'Squeeze, call or fold', text: 'A raise and a caller, then size it' },
      { route: 'sq-spots', log: 'squeeze/spots', title: "The book's hands", text: 'Practice hands, and who is left to act' },
    ],
    progress: 'sq-progress',
  },
  {
    id: 'blinds',
    title: 'The blinds',
    blurb: 'Stealing them from late position, and defending your own.',
    sheet: { route: 'bl-learn', text: 'Steal maths, the price to call, both defending ranges' },
    drills: [
      { route: 'bl-steal', log: 'blinds/steal', title: 'Steal the blinds', text: 'Who is in the blinds decides the range and the size' },
      { route: 'bl-defend', log: 'blinds/defend', title: 'Defend your blind', text: 'Fold, call or 3-bet from the small and big blind' },
      { route: 'bl-sums', log: 'blinds/sums', title: 'Steal sums', text: 'Break-even, both blinds folding, the price of a call' },
    ],
    progress: 'bl-progress',
  },
];

export const CHAPTERS = DEFS.map((c, i) => ({
  ...c,
  number: i + 1,
  route: `ch-${c.id}`,
  lessons: lessonsFor(c.id).map((l) => ({ ...l, route: `learn-${l.id}` })),
}));

export const chapterOf = (id) => CHAPTERS.find((c) => c.id === id);
