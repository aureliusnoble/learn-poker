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
