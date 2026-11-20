// Isolating limpers and limping behind (chapters 19 and 20 of the source book).
// Charts are transcribed exactly from the book's shaded grids. Lessons are the
// core points in short form, not the book's text. Spots marked source: 'book'
// are its practice hands; 'derived' ones follow directly from a rule it states.

/** Hands to raise when someone has limped in front of you. */
export const ISO = {
  default: ['88+', 'AJs+', 'KJs+', 'QJs', 'AJo+', 'KJo+'],
  // Shaded "optional / over-limp" on the same chart.
  optional: ['77-22', 'ATs-A2s', 'KTs', 'K9s', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', '98s', '87s', 'QJo', 'ATo', 'KTo', 'QTo', 'JTo'],
  // The optional hands the book names as the stronger ones.
  strongerOptional: ['77', 'ATs', 'KTs', 'QTs', 'JTs', 'T9s'],
  // The book's "higher equity" hands: raise these bigger, and against a crowd.
  strong: ['JJ+', 'AQs+', 'AQo+'],
};

/** The potential range for limping behind other limpers. */
export const OVER_LIMP = ['77-22', 'A9s-A2s', 'K9s', 'Q9s', 'J9s+', 'T8s+', '97s+', '86s+', '76s', '65s', '54s'];

/**
 * Against a limper with this many big blinds or fewer, raise only hands you
 * would call an all-in with. The rest limp behind or fold.
 */
export const SHORT_STACK = { max: 30, raise: ['99+', 'AJs+', 'AJo+'] };

/** Default isolation raise: 3bb, plus 1bb per limper, plus 1bb out of position. */
export const ISO_SIZE = { base: 3, perLimper: 1, outOfPosition: 1 };

/** Example ranges for the two kinds of limper. Illustration only: nothing is scored against them. */
export const LIMPER_PROFILES = [
  {
    id: 'tight',
    name: 'Tight limper',
    title: 'A weak-tight limper (15/6)',
    stats: ['15/6', '13/5', '11/4'],
    blurb: 'Raises the very best hands and limps the decent ones. Folds to raises and bets unless the flop helps.',
    raise: ['88+', 'AJs+', 'AQo+'],
    limp: ['77-22', 'KQs', 'KJs', 'QJs', 'KQo', 'AJo', 'KJo', 'QJo'],
  },
  {
    id: 'loose',
    name: 'Loose limper',
    title: 'A weak-loose limper (50/8)',
    stats: ['50/8', '42/6', '36/4'],
    blurb: 'Limps a huge range full of junk to see a cheap flop, and hates to fold.',
    raise: ['88+', 'AJs+', 'KQs', 'AJo+', 'KQo'],
    limp: ['77-22', 'ATs-A2s', 'KJs-K2s', 'QJs-Q2s', 'JTs-J4s', 'T9s-T6s', '98s-96s', '87s', '86s', '76s', '65s',
      'ATo-A2o', 'KJo-K6o', 'QJo-Q7o', 'JTo-J7o', 'T9o-T7o', '98o'],
  },
];

/** If each limper folds 65% of the time, how often they all fold. */
export const FOLD_EXAMPLE = { each: 65, all: [[2, 42.25], [3, 27.46], [4, 17.86]] };

/** JJ+ and AQ+ against one, two and three callers with a typical limp-calling range. */
export const EQUITY_EXAMPLE = { range: 'JJ+, AQ+', equity: [[1, 68.62], [2, 52.41], [3, 42.03]] };

export const LESSONS = [
  {
    id: 'terms',
    title: 'Three terms',
    points: [
      'Open-limp: being the first player in by calling the big blind instead of raising. Do not do this.',
      'Limp behind (over-limp): calling the big blind after someone else already has.',
      'Isolation raise: raising after a limp, to play the limper heads-up or win the pot right there.',
    ],
  },
  {
    id: 'why',
    title: 'Why raise limpers',
    points: [
      'Only weak players open-limp at micro stakes, and most of your profit comes from weak players.',
      'A raise gets you heads-up against them more often, keeps the pot from going multi-way, lets you profit from their mistakes after the flop, and often wins the pot at once.',
    ],
  },
  {
    id: 'types',
    title: 'Two kinds of limper',
    points: [
      'Weak-tight: plays few hands, raises the very best and limps the decent ones. After the flop they continue when they hit and fold when they miss.',
      'Weak-loose: limps a huge range full of junk to see cheap flops. Many are calling stations.',
      'Tell them apart by the gap between hands played and hands raised: 15/6 is weak-tight, 50/8 is weak-loose.',
    ],
  },
  {
    id: 'range',
    title: 'What to raise',
    points: [
      'The default is a strong range: 88+, AJs+, KJs+, QJs, AJo+, KJo+. Most limpers are calling stations, so you need hands that win at showdown.',
      'Add the optional hands against weak-tight limpers who fold to the raise or to a bet on the flop.',
      'Before widening, look behind you: loose players left to act mean stick to the default.',
      'And look at the stacks: deep stacks suit the speculative hands, shallow stacks suit hands that make a strong top pair.',
    ],
  },
  {
    id: 'size',
    title: 'How big',
    points: [
      '3bb, plus 1bb for every limper, plus 1bb if you are out of position.',
      'If several limpers keep calling, add 1bb at a time until only one calls or they all fold.',
      'With JJ+ and AQ+, raise as much as will still get called. They keep their edge in a crowd: 69% against one caller, 52% against two, 42% against three.',
      'Against a stack of 30bb or less, raise only hands you would call an all-in with: AJ+ and 99+. Raise those the normal size and call the shove.',
      'If you do raise a weaker hand such as KTs or 66 against a short stack, make it 2.5bb to 3bb.',
    ],
  },
  {
    id: 'position',
    title: 'Position and numbers',
    points: [
      'Out of position, raise a stronger range. In position you can widen, most of all against weak-tight limpers.',
      'The more limpers, the stronger the hand you need. If each folds 65% of the time, two both fold 42% of the time, three 27%, four 18%.',
      'Against several limpers, raise big cards and strong pairs, and think about limping behind with the speculative hands.',
    ],
  },
  {
    id: 'overlimp',
    title: 'Limping behind',
    points: [
      'Never be the first to limp. Limping behind others can be right.',
      'Do not limp when an aggressive player who raises limpers is still to act. Raise your better hands yourself and fold the rest.',
      'Reasons to limp behind: a weak hand that can make something big, several limpers already in so nobody is folding, or shallow stacks with passive players left to act.',
      'The hands: suited aces A9s-A2s, pairs 77-22, and suited connectors and gappers down to 54s.',
      'Against a limper with 30bb or less, the hands you would not call an all-in with limp behind or fold. Fold most of them if a raiser is still to act.',
    ],
  },
];

export const CHEAT = [
  {
    title: 'How big',
    rows: [
      ['The formula', '3bb + 1bb per limper + 1bb out of position'],
      ['In position', '1 limper 4bb · 2 limpers 5bb · 3 limpers 6bb'],
      ['Out of position', '1 limper 5bb · 2 limpers 6bb · 3 limpers 7bb'],
      ['Limpers who never fold', 'Add 1bb at a time until one or none call'],
      ['JJ+ and AQ+', 'As big as still gets called'],
      ['Stack of 30bb or less, weaker hand', '2.5bb to 3bb'],
    ],
  },
  {
    title: 'A limper in front of you',
    rows: [
      ['Raise', '88+, AJs+, KJs+, QJs, AJo+, KJo+'],
      ['Optional: raise or limp', '77-22, ATs-A2s, KTs, K9s, QTs, Q9s, JTs, J9s, T9s, 98s, 87s, QJo, ATo, KTo, QTo, JTo'],
      ['Limp behind', '77-22, A9s-A2s, K9s, Q9s, J9s+, T8s+, 97s+, 86s+, 76s, 65s, 54s'],
      ['Limper has 30bb or less', 'Raise only AJ+ and 99+ · limp or fold the rest'],
      ['Be the first to limp', 'Never'],
    ],
  },
  {
    title: 'Who limped?',
    rows: [
      ['Weak-tight (15/6)', 'Folds a lot: add the optional raises'],
      ['Weak-loose (50/8)', 'Never folds: raise hands that win at showdown, and raise bigger'],
    ],
  },
  {
    title: 'Raise a stronger range when',
    rows: [
      ['Out of position', 'You need showdown value'],
      ['More limpers', 'Two both fold 42% · three 27% · four 18%'],
      ['Loose players behind', 'Stick to the default'],
      ['Stacks are shallow', 'Hands that make a strong top pair'],
    ],
  },
  {
    title: 'Limp behind when',
    rows: [
      ['Your hand', 'Weak, but can make something big'],
      ['Several limpers', 'Nobody is folding anyway'],
      ['Shallow stacks', 'And passive players left to act'],
      ['Not when', 'A raiser is behind you: raise or fold'],
    ],
  },
];

export const TRICKS = [
  'Size: start at 3, add 1 for each limper, add 1 more out of position.',
  'The default raise is 88 and up, plus any two cards jack or better (QJ only when suited).',
  'Tight limper: raise wider. Loose limper: raise stronger and bigger.',
  'More limpers, stronger hand. Two players both fold less than half the time.',
  'Never limp first, and never limp into a raiser.',
  'Limp behind only with hands that can make a monster: suited aces, small pairs, suited connectors.',
];

export const FACTS = [
  { id: 'iso', q: 'What is an isolation raise?', a: 'A raise after a limp, to play the limper heads-up', wrong: ['Any raise from the button', 'A raise that goes all-in', 'A re-raise of a 3-bet'], why: 'You raise the limper to get heads-up against a weak player, or to win the pot at once.' },
  { id: 'size-1ip', q: 'One limper, you are in position. The default raise?', a: '4bb', wrong: ['3bb', '5bb', '6bb'], why: '3bb plus 1bb for the limper.' },
  { id: 'size-1oop', q: 'One limper, you are out of position. The default raise?', a: '5bb', wrong: ['3bb', '4bb', '7bb'], why: '3bb, plus 1bb for the limper, plus 1bb out of position.' },
  { id: 'size-3ip', q: 'Three limpers, you are in position. The default raise?', a: '6bb', wrong: ['4bb', '5bb', '9bb'], why: '3bb plus 1bb for each of the three limpers.' },
  { id: 'size-2oop', q: 'Two limpers, you are out of position. The default raise?', a: '6bb', wrong: ['4bb', '5bb', '8bb'], why: '3bb, plus 2bb for the limpers, plus 1bb out of position.' },
  { id: 'pair', q: 'The lowest pair in the default range for raising a limper?', a: '88', wrong: ['22', '66', 'JJ'], why: '88+ raises by default. 77-22 are optional raises or limps.' },
  { id: 'more', q: 'More limpers in the pot means you raise...', a: 'Stronger hands only', wrong: ['More hands', 'The same hands', 'Smaller'], why: 'They rarely all fold, so you will usually be playing a crowd.' },
  { id: 'both', q: 'Two limpers each fold 65% of the time. How often do both fold?', a: 'About 42%', wrong: ['About 65%', 'About 80%', 'About 20%'], why: '0.65 × 0.65 = 42.25%.' },
  { id: 'behind', q: 'An aggressive raiser is still to act. Your limping hands...', a: 'Raise the better ones, fold the rest', wrong: ['Limp as usual', 'All go all-in', 'Limp, then call the raise'], why: 'Do not limp into a raise. Raise it yourself or let it go.' },
  { id: 'tight', q: 'Which stats are a weak-tight limper?', a: 'Plays 15%, raises 6%', wrong: ['Plays 50%, raises 8%', 'Plays 24%, raises 21%', 'Plays 80%, raises 60%'], why: 'Few hands, and a clear gap between hands played and hands raised.' },
  { id: 'loose', q: 'Which stats are a weak-loose limper?', a: 'Plays 50%, raises 8%', wrong: ['Plays 15%, raises 6%', 'Plays 24%, raises 21%', 'Plays 12%, raises 11%'], why: 'A huge range of hands, almost all of them limped.' },
  { id: 'station', q: 'Against a calling station, raise hands that...', a: 'Win at showdown', wrong: ['Need them to fold', 'Are suited and small', 'You would usually fold'], why: 'They will not fold, so the hand has to be good.' },
  { id: 'short', q: 'A 30bb stack limps and you hold KTs. Raise to...', a: '2.5bb to 3bb', wrong: ['4bb', '6bb', 'All-in'], why: 'Raise less with a hand you would not call an all-in with.' },
  { id: 'short-raise', q: 'The limper has only 25bb. Which hands still raise?', a: 'AJ+ and 99+', wrong: ['The whole default range', 'Any suited connector', 'Nothing at all'], why: 'A short stack can move all-in over your raise, so raise only hands you would call that with.' },
  { id: 'first', q: 'Being the first player to limp is...', a: 'Something to avoid', wrong: ['The default from early seats', 'Right with small pairs', 'Right on the button'], why: 'Raise or fold when nobody has entered the pot. Limping is only for behind other limpers.' },
];

// Actions run in table order. Seats not listed before the hero have folded.
export const SPOTS = [
  {
    id: 'iso-book-1',
    source: 'book',
    lesson: 'range',
    title: 'A calling station limps',
    hero: { seat: 'BTN', hand: 'AJo' },
    reads: { UTG: 'station' },
    action: [['UTG', 'limp']],
    options: ['fold', 'limp', 'iso'],
    correct: ['iso'],
    why: 'Against a calling station, raise hands that win at showdown: the default range of 88+, AJs+, KJs+, QJs, AJo+, KJo+. 4bb is the default size, and if this player calls 5bb or 6bb just as happily, make it bigger.',
  },
  {
    id: 'iso-derived-1b',
    source: 'derived',
    lesson: 'overlimp',
    title: 'The same limper, a speculative hand',
    hero: { seat: 'BTN', hand: '65s' },
    reads: { UTG: 'station' },
    action: [['UTG', 'limp']],
    options: ['fold', 'limp', 'iso'],
    correct: ['limp'],
    why: 'A calling station will not fold to the raise, and 65s does not win at showdown unimproved. It is a hand to limp behind with and try to make something big.',
  },
  {
    id: 'iso-book-2',
    source: 'book',
    lesson: 'range',
    title: 'A weak-tight limper who folds',
    hero: { seat: 'CO', hand: 'KTs' },
    reads: { MP: 'weaktight' },
    notes: { MP: 'Plays 12%, raises 6%, folds to 72% of flop bets' },
    action: [['MP', 'limp']],
    options: ['fold', 'limp', 'iso'],
    correct: ['iso'],
    why: 'This limper folds to most flop bets, so you can raise wider than the default: add the better optional hands, such as 77, ATs, KTs, QTs, JTs and T9s. You know nothing about the three players behind, so do not go much wider than that.',
  },
  {
    id: 'iso-derived-junk',
    source: 'derived',
    lesson: 'range',
    title: 'The same limper, a weak hand',
    hero: { seat: 'CO', hand: 'K8o' },
    reads: { MP: 'weaktight' },
    notes: { MP: 'Plays 12%, raises 6%, folds to 72% of flop bets' },
    action: [['MP', 'limp']],
    options: ['fold', 'limp', 'iso'],
    correct: ['fold'],
    why: 'K8o is not in the default range or the optional one. Even against a limper who folds a lot, the book keeps the raising range conservative.',
  },
  {
    id: 'iso-book-overlimp',
    source: 'book',
    lesson: 'overlimp',
    title: 'Two passive limpers',
    hero: { seat: 'BTN', hand: 'J9s', stack: 98 },
    stacks: { UTG: 80, MP: 48, BB: 170 },
    reads: { UTG: 'passive', MP: 'passive', BB: 'passive' },
    action: [['UTG', 'limp'], ['MP', 'limp']],
    options: ['fold', 'limp', 'iso'],
    correct: ['limp'],
    why: 'Two loose, passive limpers are in and another passive player is in the big blind. In position with a hand that can make something big, limping behind beats raising. In the book this hand flopped two pair and won a 227bb pot.',
  },
  {
    id: 'iso-derived-short',
    source: 'derived',
    lesson: 'overlimp',
    title: 'A short stack limps',
    hero: { seat: 'BTN', hand: '76s' },
    stacks: { MP: 24 },
    action: [['MP', 'limp']],
    options: ['fold', 'limp', 'iso'],
    correct: ['limp', 'fold'],
    why: 'The limper has 24bb and can move all-in over a raise, so raise only hands you would call that with: AJ+ and 99+. With 76s, limp behind if the players left to act are passive, or fold.',
  },
  {
    id: 'iso-derived-raiser',
    source: 'derived',
    lesson: 'overlimp',
    title: 'A raiser behind you',
    hero: { seat: 'CO', hand: '76s' },
    reads: { BTN: 'isoraiser' },
    action: [['UTG', 'limp']],
    options: ['fold', 'limp', 'iso'],
    correct: ['fold', 'iso'],
    why: 'The button raises limpers often. If you limp you will face that raise with a weak hand, so do not limp: raise the better limping hands yourself and fold the weaker ones.',
  },
  {
    id: 'iso-derived-crowd-pair',
    source: 'derived',
    lesson: 'overlimp',
    title: 'Two limpers and a small pair',
    hero: { seat: 'BTN', hand: '44' },
    action: [['UTG', 'limp'], ['MP', 'limp']],
    options: ['fold', 'limp', 'iso'],
    correct: ['limp'],
    why: 'With two limpers in, there is little chance both fold to a raise. A small pair plays well in a crowd: limp behind and try to flop a set.',
  },
  {
    id: 'iso-derived-crowd-t9s',
    source: 'derived',
    lesson: 'overlimp',
    title: 'Three limpers and a suited connector',
    hero: { seat: 'BTN', hand: 'T9s' },
    action: [['UTG', 'limp'], ['MP', 'limp'], ['CO', 'limp']],
    options: ['fold', 'limp', 'iso'],
    correct: ['limp'],
    why: 'Three players almost never all fold. Take the cheap flop in position with a hand that can make a straight or a flush.',
  },
  {
    id: 'iso-derived-crowd-aq',
    source: 'derived',
    lesson: 'position',
    title: 'Three limpers, out of position',
    hero: { seat: 'SB', hand: 'AQo' },
    action: [['MP', 'limp'], ['CO', 'limp'], ['BTN', 'limp']],
    options: ['fold', 'limp', 'iso'],
    correct: ['iso'],
    why: 'Against a crowd, raise the big cards and strong pairs that hold their equity. AQ is one of them, even out of position.',
  },
  {
    id: 'iso-derived-oop-87s',
    source: 'derived',
    lesson: 'position',
    title: 'Out of position with a speculative hand',
    hero: { seat: 'SB', hand: '87s' },
    reads: { BTN: 'station' },
    action: [['BTN', 'limp']],
    options: ['fold', 'limp', 'iso'],
    correct: ['limp'],
    why: 'Out of position you raise a stronger range, and this limper does not fold. 87s is not a raise here, but it is cheap to complete and see a flop.',
  },
  {
    id: 'iso-derived-bb',
    source: 'derived',
    lesson: 'size',
    title: 'In the big blind',
    hero: { seat: 'BB', hand: 'JJ' },
    action: [['CO', 'limp']],
    options: ['check', 'iso'],
    correct: ['iso'],
    why: 'JJ is one of the strong hands you raise from any seat. From the big blind you are out of position, so the raise is 1bb bigger.',
  },
  {
    id: 'iso-size-sticky',
    source: 'derived',
    lesson: 'size',
    title: 'Limpers who hate to fold',
    question: 'Two limpers call your 5bb raise every time. What do you change?',
    options: [
      { id: 'more', label: 'Raise 1bb more, and again, until one or none call' },
      { id: 'same', label: 'Keep raising 5bb' },
      { id: 'less', label: 'Raise smaller' },
      { id: 'limp', label: 'Stop raising and limp' },
    ],
    correct: ['more'],
    why: 'Keep adding 1bb until you get one of them heads-up or they all fold. Winning several blinds before the flop is a fine result.',
  },
  {
    id: 'iso-size-short-weak',
    source: 'derived',
    lesson: 'size',
    title: 'A short stack limps',
    question: 'The limper has 28bb. How big do you raise KTs?',
    hero: { seat: 'BTN', hand: 'KTs' },
    stacks: { MP: 28 },
    action: [['MP', 'limp']],
    options: [
      { id: 'small', label: '2.5bb to 3bb' },
      { id: 'std', label: '4bb' },
      { id: 'big', label: '6bb' },
      { id: 'jam', label: 'All-in' },
    ],
    correct: ['small'],
    why: 'KTs is not a hand you want to call an all-in with. Against a stack of 30bb or less, raise less with the weaker hands.',
  },
  {
    id: 'iso-size-short-strong',
    source: 'derived',
    lesson: 'size',
    title: 'A short stack limps, and you are strong',
    question: 'The limper has 28bb. How big do you raise AQs?',
    hero: { seat: 'BTN', hand: 'AQs' },
    stacks: { MP: 28 },
    action: [['MP', 'limp']],
    options: [
      { id: 'small', label: '2.5bb to 3bb' },
      { id: 'std', label: '4bb or more' },
      { id: 'limp', label: 'Just limp' },
    ],
    correct: ['std'],
    why: 'With a strong hand, raise at least the normal size and be ready to call if the short stack moves all-in.',
  },
  {
    id: 'iso-size-big',
    source: 'derived',
    lesson: 'size',
    title: 'A big hand against a caller',
    question: 'You hold QQ. This limper calls any raise up to 6bb. How big?',
    hero: { seat: 'BTN', hand: 'QQ' },
    reads: { UTG: 'station' },
    action: [['UTG', 'limp']],
    options: [
      { id: 'three', label: '3bb' },
      { id: 'four', label: '4bb' },
      { id: 'six', label: '6bb' },
      { id: 'limp', label: 'Just limp' },
    ],
    correct: ['six'],
    why: 'With JJ+ and AQ+, raise the largest amount that still gets called. You want the call, and a bigger pot.',
  },
  {
    id: 'iso-fold-prob',
    source: 'derived',
    lesson: 'position',
    title: 'Will they all fold?',
    question: 'Three limpers each fold to a raise 65% of the time. How often do all three fold?',
    options: [
      { id: 'a', label: 'About 27%' },
      { id: 'b', label: 'About 65%' },
      { id: 'c', label: 'About 50%' },
      { id: 'd', label: 'About 90%' },
    ],
    correct: ['a'],
    why: '0.65 × 0.65 × 0.65 = 27%. Getting several limpers to fold is unlikely, which is why you need a stronger hand to raise them.',
  },
];
