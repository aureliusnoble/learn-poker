// Stealing the blinds and defending them (chapter 22 of the source book).
// Charts and tables are transcribed exactly. Lessons are the core points in
// short form, not the book's text. Spots marked source: 'book' are its practice
// hands; 'derived' ones follow directly from a rule it states.
//
// Not received: the pages after "Blind Defense Practice Hands", and the page
// between Blind Stealing Practice Hands #2 and #3.

/** Seats a steal can come from: first in from one of these is an attempt on the blinds. */
export const STEAL_SEATS = ['CO', 'BTN', 'SB'];

/**
 * The "moderate" hands the book shades on top of each conservative opening
 * range. This app opens the conservative ranges by default; these are added
 * only against blinds that fold enough.
 */
export const MODERATE_ADDS = {
  CO: ['K8s', '75s', '65s', 'QTo', 'JTo'],
  BTN: ['K6s', 'K5s', 'Q7s', 'Q6s', 'J7s', 'T7s', '64s', '43s', 'K8o', 'K7o', 'Q9o', 'J9o', 'T8o', '87o'],
  SB: ['K8s', '75s', '65s', 'QTo', 'JTo'],
};
export const MODERATE_PCT = { CO: 24.89, BTN: 43.29, SB: 24.89 };

/** The part of a late-position opening range that wants a call: about the top 10% of hands. */
export const PREFER_CALL = ['77+', 'A9s+', 'KTs+', 'QTs+', 'AJo+', 'KQo'];

/** What a steal wins when it works: the two blinds. */
export const STEAL_REWARD = 1.5;
/** Steal size and how often it must work to break even: risk / (risk + reward). */
export const BREAK_EVEN = [[3, 66.7], [2.5, 62.5], [2, 57.1]];
/** Open size against blinds that fold a lot, or that 3-bet a lot. */
export const SMALL_STEAL = [2, 2.5];

/** The equity each blind needs to call a steal of each size, in percent. */
export const POT_ODDS = [
  { steal: 2, sb: 30.0, bbAfterCall: 16.67, bbAfterFold: 22.22 },
  { steal: 2.5, sb: 33.33, bbAfterCall: 20.0, bbAfterFold: 27.27 },
  { steal: 3, sb: 35.71, bbAfterCall: 22.22, bbAfterFold: 30.77 },
];

/**
 * Defending against a late-position steal. The charts are drawn against a
 * button opening 43.29% of hands; `equity` is the defending range's share.
 */
export const DEFENCE = {
  value3bet: ['JJ+', 'AJs+', 'AQo+'],
  SB: {
    name: 'Small blind',
    equity: 59.4,
    call: ['TT-77', 'ATs', 'KTs+', 'QTs+', 'JTs', 'AJo-ATo', 'KTo+', 'QJo'],
  },
  BB: {
    name: 'Big blind',
    equity: 52.93,
    call: ['TT-22', 'ATs-A2s', 'K9s+', 'Q9s+', 'J9s+', 'T8s+', '97s+', '86s+', '76s', '65s',
      'AJo-A7o', 'K9o+', 'Q9o+', 'J9o+', 'T9o'],
  },
};

export const LESSONS = [
  {
    id: 'steal',
    title: 'Stealing the blinds',
    points: [
      'Raising first in from the cutoff, button or small blind is a steal attempt: you can win the 1.5bb in the middle without a fight.',
      'The cutoff and button are the most profitable seats at the table. The blinds are the least.',
      'Only your strongest hands, about the top 10%, want a call. With the rest of a late-position opening range you are hoping the blinds fold.',
      'Position still helps when they call: the blinds make a lot of mistakes playing out of position.',
    ],
  },
  {
    id: 'maths',
    title: 'Steal maths',
    points: [
      'You risk 2bb to 3bb to win 1.5bb.',
      'Break-even = risk ÷ (risk + reward). A 3bb steal must work 66.7% of the time, 2.5bb 62.5%, 2bb 57.1%.',
      'So a steal has to work about two times in three, and a smaller raise lowers the bar. Risk as little as you can.',
      'Two blinds both have to fold: multiply. If each folds 80% of the time, both fold 64%.',
    ],
  },
  {
    id: 'who',
    title: 'Who is in the blinds',
    points: [
      'Blinds that fold a lot: steal with a wide range and a small raise.',
      'Blinds that call or 3-bet a lot: steal more carefully. Drop the hands at the bottom of the range.',
      'Players who give up unless the flop helps are the best targets. Be wary of good players who defend well.',
      'A strong hand still raises against good defenders: it wants the action.',
    ],
  },
  {
    id: 'defend',
    title: 'Defending your blinds',
    points: [
      'You lose money in the blinds over time. The goal is to lose as little as possible.',
      'In theory you could defend very wide: the blinds get a great price, and pot odds are the equity you need to call.',
      'In practice, defend a conservative range. Out of position, hands win less than their equity says.',
      'The small blind is worse still: the big blind can squeeze or call behind you, leaving you out of position against two players.',
    ],
  },
  {
    id: 'ranges',
    title: 'The defending ranges',
    points: [
      'From either blind, 3-bet JJ+, AJs+ and AQo+ for value against a cutoff or button steal. Widen it against someone opening half their hands or more.',
      'Small blind: call only medium pairs and Broadway hands.',
      'Big blind: you close the action and get a better price, so call much wider. Small pairs, small suited aces and suited connectors become calls.',
    ],
  },
];

const pctRow = (r) => `SB ${r.sb.toFixed(1)}% · BB ${r.bbAfterFold.toFixed(1)}% · BB after SB calls ${r.bbAfterCall.toFixed(1)}%`;

export const CHEAT = [
  {
    title: 'Steal maths',
    rows: [
      ['Break-even', 'Risk ÷ (risk + reward)'],
      ...BREAK_EVEN.map(([size, pct]) => [`${size}bb steal`, `Must work ${pct}%`]),
      ['Both blinds fold', 'Multiply: 80% × 80% = 64%'],
    ],
  },
  {
    title: 'Stealing',
    rows: [
      ['Wants a call', PREFER_CALL.join(', ')],
      ['The rest of your range', 'Hopes they fold'],
      ['Blinds fold a lot', 'Open wider, and only 2bb to 2.5bb'],
      ['Calling station in the blinds', 'Drop the bottom of the range'],
      ['Wider range: CO and SB add', MODERATE_ADDS.CO.join(', ')],
      ['Wider range: BTN adds', MODERATE_ADDS.BTN.join(', ')],
    ],
  },
  {
    title: 'Defending against a steal',
    rows: [
      ['3-bet for value', DEFENCE.value3bet.join(', ')],
      ['Small blind calls', DEFENCE.SB.call.join(', ')],
      ['Big blind calls', DEFENCE.BB.call.join(', ')],
    ],
  },
  {
    title: 'The equity you need to call',
    rows: [...POT_ODDS].reverse().map((r) => [`${r.steal}bb steal`, pctRow(r)]),
  },
  {
    title: 'Why stay tight',
    rows: [
      ['Out of position', 'Hands win less than their equity'],
      ['Small blind', 'The big blind can still squeeze or call'],
      ['The goal', 'Lose as little as possible'],
    ],
  },
];

export const TRICKS = [
  'A steal has to work about two times in three.',
  'Each half big blind off the raise lowers the bar by about 5%: 66.7, 62.5, 57.1.',
  'Only your UTG-strength hands want a call. The rest of a late open is a steal.',
  'Small blind: pairs and picture cards. Big blind: add suited aces, suited connectors and small pairs.',
  'Pot odds are the equity you need: the call divided by the pot after you call.',
];

export const FACTS = [
  { id: 'be-3', q: 'A 3bb steal must work how often to break even?', a: '66.7%', wrong: ['50%', '57.1%', '75%'], why: '3 ÷ (3 + 1.5).' },
  { id: 'be-25', q: 'A 2.5bb steal must work how often to break even?', a: '62.5%', wrong: ['50%', '57.1%', '66.7%'], why: '2.5 ÷ (2.5 + 1.5).' },
  { id: 'be-2', q: 'A 2bb steal must work how often to break even?', a: '57.1%', wrong: ['40%', '62.5%', '66.7%'], why: '2 ÷ (2 + 1.5).' },
  { id: 'formula', q: 'The break-even formula for a steal?', a: 'Risk ÷ (risk + reward)', wrong: ['Reward ÷ risk', 'Risk × reward', 'Risk − reward'], why: 'What you risk, over the whole pot if it works.' },
  { id: 'both', q: 'Each blind folds 80% of the time. How often do both fold?', a: '64%', wrong: ['80%', '72%', '40%'], why: '0.8 × 0.8.' },
  { id: 'want', q: 'How much of a late-position opening range wants a call?', a: 'About the top 10% of hands', wrong: ['All of it', 'About half', 'None of it'], why: 'The hands you would open under the gun. The rest prefer a fold.' },
  { id: 'small', q: 'Against blinds that fold a lot, open to...', a: '2bb to 2.5bb', wrong: ['3bb', '4bb', '5bb'], why: 'Risk the least you can: a smaller steal has to work less often.' },
  { id: 'station', q: 'A calling station is in the big blind. Your stealing range gets...', a: 'Tighter', wrong: ['Wider', 'No different', 'Smaller in size only'], why: 'The steal will not work two times in three, so drop the bottom of the range.' },
  { id: 'val', q: 'Value 3-bets from the blinds against a cutoff or button steal?', a: 'JJ+, AJs+, AQo+', wrong: ['KK+, AKs', 'Any pair', 'TT+, any ace'], why: 'The default value range against a late-position raise.' },
  { id: 'sb-call', q: 'What does the small blind call a steal with?', a: 'Medium pairs and Broadway hands', wrong: ['Any two suited cards', 'Every pair and every ace', 'Nothing: 3-bet or fold'], why: 'TT-77 and the Broadway hands not strong enough to 3-bet.' },
  { id: 'bb-why', q: 'Why does the big blind call wider than the small blind?', a: 'It closes the action and gets a better price', wrong: ['It has position after the flop', 'It has more chips', 'The raiser is weaker'], why: 'Nobody can raise behind, and 1bb is already in.' },
  { id: 'odds', q: 'Pot odds tell you...', a: 'The equity you need to call', wrong: ['How often they are bluffing', 'How big to raise', 'Your chance of a set'], why: 'Offered 33% pot odds, you need 33% equity or more.' },
  { id: 'odds-bb', q: 'Button raises to 3bb and the small blind folds. Equity the big blind needs to call?', a: 'About 31%', wrong: ['About 22%', 'About 36%', 'About 50%'], why: 'Call 2bb for a pot of 6.5bb: 2 ÷ 6.5.' },
  { id: 'goal', q: 'The goal when defending your blinds?', a: 'Lose as little as possible', wrong: ['Win every pot', 'Never fold', 'Always 3-bet'], why: 'The blinds lose money over time for everyone.' },
];

// Actions run in table order. Seats not listed before the hero have folded.
export const SPOTS = [
  {
    id: 'st-book-1',
    source: 'book',
    lesson: 'maths',
    title: 'Two nits in the blinds',
    // The book names no hand here: it steals with the whole wider range. J9o is from the bottom of it.
    hero: { seat: 'BTN', hand: 'J9o' },
    reads: { SB: 'nit', BB: 'nit' },
    notes: { SB: 'Folds to 80% of steals', BB: 'Folds to 80% of steals' },
    options: ['fold', 'open'],
    correct: ['open'],
    stealSmall: true,
    why: 'Each blind folds 80% of the time, so both fold 0.8 × 0.8 = 64%. A 2.5bb steal only has to work 62.5% of the time, so it shows a profit. Steal with the whole wider button range.',
  },
  {
    id: 'st-book-2',
    source: 'book',
    lesson: 'who',
    title: 'A calling station in the big blind',
    hero: { seat: 'BTN', hand: 'T8o' },
    reads: { SB: 'nit', BB: 'station' },
    options: ['fold', 'open'],
    correct: ['fold'],
    why: 'With a hand near the bottom of the stealing range you want both blinds to fold about two times in three. The small blind will, but a calling station in the big blind will not. Tighten the stealing range and let this one go.',
  },
  {
    id: 'st-derived-3',
    source: 'derived',
    lesson: 'who',
    title: 'A good hand against a good defender',
    hero: { seat: 'BTN', hand: 'AJs' },
    reads: { SB: 'tag', BB: 'rec' },
    notes: { SB: 'Defends the blind well, by calling or 3-betting' },
    options: ['fold', 'open'],
    correct: ['open'],
    stealSmall: false,
    why: 'The small blind defends well, but this is a good hand that wants action after the flop, not a steal that needs folds. A weak player in the big blind only adds to the profit.',
  },
  {
    id: 'st-concept-want',
    source: 'derived',
    lesson: 'steal',
    title: 'Call me or fold?',
    question: 'You open the button. With which of these hands do you want a call?',
    options: [
      { id: 'ajo', label: 'AJo' },
      { id: '54s', label: '54s' },
      { id: 'k7s', label: 'K7s' },
      { id: 'a4o', label: 'A4o' },
    ],
    correct: ['ajo'],
    why: 'Only about the top 10% of hands wants action: 77+, A9s+, KTs+, QTs+, AJo+ and KQo. With the rest of the range you are happy to take the blinds.',
  },
  {
    id: 'st-concept-size',
    source: 'derived',
    lesson: 'maths',
    title: 'Risking less',
    question: 'How much less often does a 2bb steal need to work than a 3bb steal?',
    options: [
      { id: 'ten', label: 'About 10% less often' },
      { id: 'none', label: 'The same' },
      { id: 'half', label: 'Half as often' },
      { id: 'more', label: 'It needs to work more often' },
    ],
    correct: ['ten'],
    why: 'A 3bb steal breaks even at 66.7% and a 2bb steal at 57.1%. Risk the least you can when stealing.',
  },
  {
    id: 'bd-derived-22-sb',
    source: 'derived',
    lesson: 'ranges',
    title: 'A small pair in the small blind',
    hero: { seat: 'SB', hand: '22' },
    action: [['BTN', 'raise', 3]],
    options: ['fold', 'call', '3bet'],
    correct: ['fold'],
    why: 'The small blind calls only medium pairs and Broadway hands. The big blind is still to act and can squeeze or call, so a small pair folds here by default.',
  },
  {
    id: 'bd-derived-22-bb',
    source: 'derived',
    lesson: 'ranges',
    title: 'The same pair in the big blind',
    hero: { seat: 'BB', hand: '22' },
    action: [['BTN', 'raise', 3]],
    options: ['fold', 'call', '3bet'],
    correct: ['call'],
    why: 'In the big blind you close the action and get a better price. Hands the small blind folds, like small pairs, small suited aces and suited connectors, become calls.',
  },
  {
    id: 'bd-derived-aq',
    source: 'derived',
    lesson: 'ranges',
    title: 'A value hand in the small blind',
    hero: { seat: 'SB', hand: 'AQo' },
    action: [['CO', 'raise', 3]],
    options: ['fold', 'call', '3bet'],
    correct: ['3bet'],
    why: 'From either blind, JJ+, AJs+ and AQo+ are 3-bets for value against a cutoff or button steal.',
  },
  {
    id: 'bd-concept-sb',
    source: 'derived',
    lesson: 'defend',
    title: 'Why the small blind is harder',
    question: 'Why defend a narrower range from the small blind than from the big blind?',
    options: [
      { id: 'behind', label: 'The big blind can still squeeze or call behind you' },
      { id: 'stack', label: 'The small blind has fewer chips' },
      { id: 'cards', label: 'The small blind gets worse cards' },
    ],
    correct: ['behind'],
    why: 'The small blind does not close the action. A call can be squeezed, or called behind, which leaves you out of position against two players.',
  },
  {
    id: 'bd-concept-wide',
    source: 'derived',
    lesson: 'defend',
    title: 'Theory and practice',
    question: 'The price says you could defend the big blind with any two cards. Why not do it?',
    options: [
      { id: 'oop', label: 'Out of position, hands win less than their equity' },
      { id: 'rules', label: 'It is against the rules' },
      { id: 'pot', label: 'The pot is too small to matter' },
    ],
    correct: ['oop'],
    why: 'Playing out of position you cannot realise all of your equity, so the book defends a conservative range that has an equity edge over the stealer.',
  },
];
