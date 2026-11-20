// Pre-flop opening ranges: the "conservative range" from each chart, as written in the notes.
//
// Shorthand:
//   '66+'   that pair and every higher pair
//   'ATs+'  suited, kicker T or better (ATs, AJs, AQs, AKs)
//   'AJo+'  the same, offsuit
//   no '+'  that exact hand only
//
// This file is the single source of truth. Edit a range here and every chart,
// drill and explanation in the app follows.

/** Every open is a raise to this many big blinds. */
export const OPEN_SIZE_BB = 3;

export const POSITIONS = [
  {
    id: 'UTG',
    name: 'Under the Gun',
    pairs: ['66+'],
    // JTs is shaded on the chart but missing from the handwritten list.
    // It stays in because the 9.8% in the notes only adds up with it.
    suited: ['ATs+', 'KJs+', 'JTs'],
    offsuit: ['AJo+', 'KQo'],
  },
  {
    id: 'MP',
    name: 'Middle Position',
    pairs: ['55+'],
    suited: ['A9s+', 'KTs+', 'QTs+', 'JTs', 'T9s'],
    offsuit: ['ATo+', 'KQo'],
  },
  {
    id: 'CO',
    name: 'Cutoff',
    pairs: ['22+'],
    suited: ['A2s+', 'K9s+', 'QTs+', 'J9s+', 'T8s+', '97s+', '86s+', '76s'],
    offsuit: ['A9o+', 'KTo+', 'QJo'],
  },
  {
    id: 'BTN',
    name: 'Button',
    pairs: ['22+'],
    suited: ['A2s+', 'K7s+', 'Q8s+', 'J8s+', 'T8s+', '97s+', '86s+', '75s+', '65s', '54s'],
    offsuit: ['A2o+', 'K9o+', 'QTo+', 'JTo', 'T9o', '98o'],
  },
  // The small blind opens the same range as the cutoff.
  { id: 'SB', name: 'Small Blind', sameAs: 'CO' },
];

// Shown on the study page. These describe the ranges above, so keep them in
// step if a range changes.
export const MEMORY_HOOKS = [
  'Learn one cut-off per row, not a list of hands. Everything stronger than the cut-off plays.',
  'Each seat keeps every hand the seat before it opens, so you only learn what gets added.',
  'Pairs: 66 and up from UTG, 55 and up from MP, every pair from the cutoff on.',
  'Offsuit aces drop one rank per seat: AJ, AT, A9, then any ace on the button.',
  'Suited kings do the same: KJ, KT, K9, then K7 on the button.',
  'Offsuit has to be stronger than suited. UTG opens ATs but not ATo.',
  'Suited connectors reach down to JTs at UTG, T9s at MP, 76s at the cutoff and 54s on the button.',
  'UTG oddity: JTs is in, but QJs and QTs are not.',
  'The small blind copies the cutoff.',
];

// Quick-fire facts. `a` is the answer, `wrong` the other choices.
export const FACTS = [
  { id: 'size', q: 'How big is every open-raise?', a: '3bb', wrong: ['2bb', '4bb', '5bb'], why: 'Every open is a raise to 3 big blinds.' },
  { id: 'sb', q: 'Which seat opens the same range as the cutoff?', a: 'Small blind', wrong: ['Button', 'Middle position', 'Big blind'], why: 'The small blind copies the cutoff.' },
  { id: 'pair-utg', q: 'The lowest pair you open under the gun?', a: '66', wrong: ['22', '55', '88'], why: '66 and up from UTG.' },
  { id: 'pair-mp', q: 'The lowest pair you open from middle position?', a: '55', wrong: ['22', '66', '77'], why: '55 and up from MP.' },
  { id: 'pair-co', q: 'From which seat do you start opening every pair?', a: 'Cutoff', wrong: ['Under the gun', 'Middle position', 'Only the button'], why: '22+ from the cutoff on.' },
  { id: 'ace-btn', q: 'Where do you open any ace, suited or not?', a: 'Button', wrong: ['Cutoff', 'Middle position', 'Everywhere'], why: 'A2o+ opens only on the button.' },
  { id: 'five', q: 'At a five-handed table, which seat is missing?', a: 'Under the gun', wrong: ['Cutoff', 'Button', 'Middle position'], why: 'Seats are named from the button backwards, so the earliest one goes first.' },
  { id: 'four', q: 'At a four-handed table, who acts first before the flop?', a: 'Cutoff', wrong: ['Button', 'Small blind', 'Big blind'], why: 'Four-handed leaves the cutoff, button and the two blinds.' },
  { id: 'offsuit', q: 'UTG opens ATs. Does it open ATo?', a: 'No', wrong: ['Yes', 'Only when suited is folded', 'Half the time'], why: 'Offsuit has to be stronger than suited: UTG needs AJo.' },
];
