// Cold-calling raises and set mining (chapter 18 of the source book).
// Charts are transcribed exactly. Lessons are the core points in short form,
// not the book's text. Spots marked source: 'book' are its practice hands;
// 'derived' ones follow directly from a rule the book states.

/**
 * Default ranges for calling an open-raise, by the opener's seat. They assume
 * the conservative opening ranges and an opponent we know nothing about.
 * The book gives no chart for button or small-blind opens (blind play is a
 * separate chapter).
 *
 * `optional` hands can be 3-bet for value or played as their chart shows.
 */
export const CALL_CHARTS = [
  {
    id: 'UTG',
    name: 'Against a UTG open',
    openPct: 9.8,
    callPct: 7.69,
    gapPct: 4.52,
    gapEquity: 52.8,
    callLine: 'QQ-44, AQs-AJs, KQs, JTs, T9s, 98s, AQo+',
    gap: ['QQ-99', 'AQs-AJs', 'KQs', 'AQo+'],
    weaker: ['88-44', 'JTs', 'T9s', '98s'],
    value3bet: ['KK+', 'AKs'],
    optional3bet: ['QQ', 'AKo'],
  },
  {
    id: 'MP',
    name: 'Against an MP open',
    openPct: 12.67,
    callPct: 9.65,
    gapPct: 5.13,
    gapEquity: 52.1,
    callLine: 'JJ-22, AQs-ATs, KJs+, QJs, JTs-76s, AQo+',
    gap: ['JJ-88', 'AQs-AJs', 'KJs+', 'QJs', 'AQo+'],
    weaker: ['77-22', 'ATs', 'JTs-76s'],
    value3bet: ['QQ+', 'AKs'],
    optional3bet: ['JJ', 'AKo', 'AQs'],
  },
  {
    id: 'CO',
    name: 'Against a CO open',
    openPct: 22.17,
    callPct: 11.01,
    gapPct: 6.18,
    gapEquity: 51.37,
    callLine: 'TT-22, ATs, KTs+, QTs+, J9s+, T9s-54s, AJo, KJo+',
    gap: ['TT-66', 'ATs', 'KJs+', 'QJs', 'AJo', 'KJo+'],
    weaker: ['55-22', 'KTs', 'QTs', 'JTs-54s', 'J9s'],
    value3bet: ['JJ+', 'AQs+', 'AQo+', 'AJs'],
    optional3bet: ['AJo', 'ATs', 'KQs'],
  },
];

/** Seats that can cold-call each opener. Blinds are left for the blind-defence chapter. */
export const CALLER_SEATS = { UTG: ['MP', 'CO', 'BTN'], MP: ['CO', 'BTN'], CO: ['BTN'] };

/** The equity example behind the gap concept: two hands against a 12% UTG range. */
export const EQUITY_EXAMPLE = {
  range: '55+, ATs+, KTs+, QTs+, JTs, T9s, 98s, 87s, AJo+, KQo',
  hands: [
    { hand: 'AQs', equity: 53.29, verdict: 'call', why: 'A slight equity edge, but not strong enough to 3-bet a range this tight.' },
    { hand: 'KTs', equity: 41.51, verdict: 'fold', why: 'An underdog, and when it pairs the king it loses to KJ, KQ and AK.' },
  ],
};

export const SET_MINING = {
  flopSetPct: 11.76, // set or better: 7.5 to 1 against, about 1 time in 8.5
  breakEvenMultiple: 9, // rounded up to 8 to 1: win 9 times the call just to break even
  ruleMultiple: 15, // the 15-to-1 rule: the minimum to call profitably
  smallPairs: '22-55',
};

export const CRITERIA = [
  { id: 'equity', name: 'Equity edge', text: 'Ahead of the range the raiser opens, but not strong enough to 3-bet. These are the gap concept hands.' },
  { id: 'implied', name: 'Implied odds', text: 'Behind now, but able to win a big pot when it hits: the raiser is strong and will pay off, stacks are deep (150bb+), weak players are likely to come along, or the hand makes very strong hands (suited connectors and one-gappers, small pairs, suited aces).' },
  { id: 'playability', name: 'Playability edge', text: 'The raiser opens wide and you have position and skill on them after the flop, so you can call wider.' },
  { id: 'sizing', name: 'Raise size', text: 'Read the size of the open. A big raise from a passive player means a very strong range.' },
  { id: 'behind', name: 'Players left to act', text: 'More players behind means a tighter call. An aggressive 3-bettor behind: drop the weaker calls. Weak players behind who will call: add hands that play well in a crowd.' },
];

export const SET_CRITERIA = [
  { id: 'stacks', name: 'Effective stacks', text: 'Can you win 15 times the call? The smaller of your stack and theirs is all you can win.' },
  { id: 'strength', name: "Opponent's hand strength", text: 'A strong range pays off sets. A weak one has nothing to pay you with.' },
  { id: 'style', name: "Opponent's style", text: 'Will this player put the money in when you hit?' },
];

export const LESSONS = [
  {
    id: 'terms',
    title: 'Two terms',
    points: [
      'Cold-calling: being the first player to call an open-raise.',
      'Set mining: calling with a small pocket pair, hoping to flop three of a kind.',
    ],
  },
  {
    id: 'gap',
    title: 'The gap concept',
    points: [
      'You need a stronger hand to call a raise than to make one yourself.',
      'Split your hands in three against a raiser: 3-bet the strongest, call the good ones that are not quite strong enough to 3-bet, fold the rest.',
      'Fold hands the raiser dominates. KTs looks fine but loses to KJ, KQ and AK.',
      'It is a starting point, not a law. Some weaker hands are still worth a call when the situation is right.',
    ],
  },
  {
    id: 'criteria',
    title: 'Five things to weigh before calling',
    points: CRITERIA.map((c) => [c.name, c.text]),
  },
  {
    id: 'ranges',
    title: 'The default calling ranges',
    points: [
      'One chart for each seat the raise comes from: UTG, MP and CO. The later the raiser, the wider you call.',
      'Each chart has two kinds of call. Gap concept hands have an equity edge. Weaker starting hands do not, and rely on implied odds.',
      'Against a player you know nothing about, stick to the chart.',
    ],
  },
  {
    id: 'setmine',
    title: 'Set mining',
    points: [
      'You flop a set or better about 1 time in 8.5 (11.76%).',
      'So the call only pays through what you win afterwards. Rounded up, you must win 9 times the call just to break even.',
      'The 15-to-1 rule: only call if you can expect to win 15 times the call when you hit. A 3bb call needs 45bb.',
      'Check three things: the effective stack is deep enough, the opponent has a strong hand often enough, and they are the type to pay you off.',
    ],
  },
];

// Player types as the book names them. See js/table.js for their labels.
// Actions run in table order. Seats not listed before the hero have folded.

export const CALL_SPOTS = [
  {
    id: 'cc-book-1',
    source: 'book',
    lesson: 'ranges',
    title: 'An unknown opponent',
    hero: { seat: 'CO', hand: 'KJo' },
    reads: { UTG: 'unknown' },
    action: [['UTG', 'raise', 3]],
    options: ['fold', 'call', '3bet'],
    correct: ['fold'],
    why: 'KJo is not in the default range for calling a UTG open. With no reads, stick to the default ranges and adjust once you know the player.',
    factors: [['equity', 'against', 'No equity edge against a UTG range'], ['behind', 'neutral', 'No reads on anyone yet']],
  },
  {
    id: 'cc-book-2',
    source: 'book',
    lesson: 'criteria',
    title: 'Aggressive 3-bettor left to act',
    hero: { seat: 'CO', hand: 'ATs' },
    reads: { MP: 'unknown', BTN: 'aggro3b' },
    action: [['MP', 'raise', 3]],
    options: ['fold', 'call', '3bet'],
    correct: ['fold', '3bet'],
    why: 'ATs sits at the bottom of the calling range, and the button is likely to 3-bet. Fold, or turn it into a 3-bet bluff if MP folds to 3-bets often. With a 3-bettor behind, only call hands that can stand a 3-bet, such as AQs and JJ.',
    factors: [['behind', 'against', 'The button 3-bets aggressively'], ['equity', 'neutral', 'ATs is a weaker starting hand on the MP chart']],
  },
  {
    id: 'cc-derived-2b',
    source: 'derived',
    lesson: 'ranges',
    title: 'The same hand, quiet players behind',
    hero: { seat: 'CO', hand: 'ATs' },
    reads: { MP: 'unknown' },
    action: [['MP', 'raise', 3]],
    options: ['fold', 'call', '3bet'],
    correct: ['call'],
    why: 'Without an aggressive 3-bettor behind, ATs is a normal call against an MP open. It is on the chart as a weaker starting hand.',
    factors: [['behind', 'for', 'Nobody behind is known to 3-bet light'], ['implied', 'for', 'A suited ace can make a very strong hand']],
  },
  {
    id: 'cc-book-3',
    source: 'book',
    lesson: 'criteria',
    title: 'Recreational players in the blinds',
    hero: { seat: 'BTN', hand: '97s' },
    reads: { CO: 'lag', SB: 'rec', BB: 'rec' },
    action: [['CO', 'raise', 3]],
    options: ['fold', 'call', '3bet'],
    correct: ['call'],
    why: '97s is not on the chart for a CO open, but everything else points to a call: the raiser opens wide and bets hard after the flop, both blinds are likely to come along, the hand plays well in a crowd, and you act last.',
    factors: [['playability', 'for', 'A LAG opens a wide range'], ['implied', 'for', 'Two weak players in the blinds'], ['behind', 'for', 'You have position on everyone']],
  },
  {
    id: 'cc-book-4',
    source: 'book',
    lesson: 'gap',
    title: "A TAG's UTG open",
    hero: { seat: 'MP', hand: 'AQs' },
    reads: { UTG: 'tag' },
    action: [['UTG', 'raise', 3]],
    options: ['fold', 'call', '3bet'],
    correct: ['call'],
    why: 'The standard gap concept hand. AQs has an equity edge against a UTG range but is not strong enough to 3-bet it for value.',
    factors: [['equity', 'for', 'About 53% against a tight UTG range']],
  },
  {
    id: 'cc-book-5',
    source: 'book',
    lesson: 'criteria',
    title: 'A big raise from a passive player',
    hero: { seat: 'BTN', hand: 'JTs' },
    reads: { MP: 'passive' },
    notes: { MP: 'Raises 6% of hands' },
    action: [['MP', 'raise', 4]],
    options: ['fold', 'call', '3bet'],
    correct: ['call'],
    why: 'A passive player who rarely raises and makes it 4bb has a very strong range, so no equity edge. But JTs makes two pair, straights and flushes that a strong range pays off, and you have position. Call, as long as nobody in the blinds 3-bets aggressively.',
    factors: [['sizing', 'for', 'A big raise from a passive player: very strong, and likely to pay off'], ['implied', 'for', 'JTs makes strong hands'], ['equity', 'against', 'No equity edge']],
  },
];

export const SET_SPOTS = [
  {
    id: 'sm-book-1',
    source: 'book',
    lesson: 'setmine',
    title: 'A maniac raises',
    hero: { seat: 'BB', hand: '22' },
    reads: { CO: 'maniac' },
    stacks: { CO: 168 },
    action: [['CO', 'raise', 4]],
    options: ['fold', 'call'],
    correct: ['call'],
    why: 'The stacks are deep enough and this player bluffs and overplays top pair, so a set gets paid. His starting hands are often weak, which counts against the call, but the way he plays more than makes up for it.',
    factors: [['stacks', 'for', 'Need 60bb, can win 100bb'], ['strength', 'against', 'Often does not have a strong hand'], ['style', 'for', 'Bluffs and bets heavily with one pair']],
    math: { call: 4, effective: 100 },
  },
  {
    id: 'sm-book-2',
    source: 'book',
    lesson: 'setmine',
    title: 'A raise and a call',
    hero: { seat: 'CO', hand: '44', stack: 105 },
    reads: { UTG: 'tag', MP: 'passive' },
    stacks: { UTG: 147, MP: 47 },
    action: [['UTG', 'raise', 3], ['MP', 'call', 3]],
    options: ['fold', 'call'],
    correct: ['call'],
    why: 'You need 45bb and both opponents have it. The UTG raiser has a strong range, and between the two of them a set should get paid. Call, unless an aggressive 3-bettor is still to act behind you.',
    factors: [['stacks', 'for', 'Need 45bb: 105bb against the raiser, 47bb against the caller'], ['strength', 'for', 'A UTG raise is a strong range'], ['style', 'for', 'Two opponents who can flop top pair']],
    math: { call: 3, effective: 105 },
  },
  {
    id: 'sm-book-3',
    source: 'book',
    lesson: 'setmine',
    title: 'A nit 3-bets your open',
    hero: { seat: 'CO', hand: '33', stack: 89 },
    reads: { BTN: 'nit' },
    stacks: { BTN: 89 },
    action: [['CO', 'raise', 3], ['BTN', 'raise', 10]],
    options: ['fold', 'call'],
    correct: ['call'],
    why: 'Calling 7bb more needs 105bb by the 15-to-1 rule and only 89bb is there. But that is still almost 13 times the call, well past the 9 times needed to break even, and a nit who 3-bets has AA, KK, QQ or AKs and will not let go of it.',
    factors: [['stacks', 'against', 'Need 105bb, can win 89bb: just under 13 to 1'], ['strength', 'for', 'A nit 3-bets only AA, KK, QQ, AKs'], ['style', 'for', 'Will stack off with an overpair']],
    math: { call: 7, effective: 89 },
  },
  {
    id: 'sm-derived-short',
    source: 'derived',
    lesson: 'setmine',
    title: 'A short stack raises',
    hero: { seat: 'BTN', hand: '55' },
    reads: { MP: 'unknown' },
    stacks: { MP: 22 },
    action: [['MP', 'raise', 3]],
    options: ['fold', 'call'],
    correct: ['fold'],
    why: 'The most you can win is 22bb. A 3bb call needs 45bb by the 15-to-1 rule, and 27bb just to break even. There is not enough behind to mine for a set.',
    factors: [['stacks', 'against', 'Need 45bb, can win 22bb']],
    math: { call: 3, effective: 22 },
  },
];

// ---- The short version: what to know, and how to remember it

export const CHEAT = [
  {
    title: 'Before you call, check',
    rows: [
      ['Equity edge', 'Ahead of their range'],
      ['Implied odds', 'Can win a big pot when it hits'],
      ['Playability', 'Position on a wide opener'],
      ['Raise size', 'Big raise from a passive player: strong'],
      ['Players behind', '3-bettor: tighter · weak callers: wider'],
    ],
  },
  {
    title: 'Set mining',
    rows: [
      ['Flop a set', '1 time in 8.5'],
      ['Break even', 'Win 9 × the call'],
      ['The rule', 'Call only if you can win 15 × the call'],
      ['A 3bb call needs', '45bb'],
      ['Then check', 'Opponent is strong · opponent pays off'],
    ],
  },
];

export const TRICKS = [
  'Three zones against a raise: 3-bet the top, call the middle, fold the rest.',
  'Call one pair below your 3-bets: 3-bet KK+ so call QQ down, 3-bet QQ+ so call JJ down, 3-bet JJ+ so call TT down.',
  'Later raiser, wider call: 7.7% against UTG, 9.7% against MP, 11% against the cutoff.',
  'Dominated hands fold. KTs against a UTG raise loses to KJ, KQ and AK.',
  '15 to 1: multiply the call by 15. If the smaller stack is not that big, fold the small pair.',
];

export const FACTS = [
  { id: 'gap', q: 'The gap concept in one line?', a: 'Calling a raise needs a stronger hand than making one', wrong: ['Call with any hand you would open', 'Never call a raise', 'Only call with pairs'], why: 'You need a stronger hand to call a raise than to raise yourself.' },
  { id: 'zones', q: 'Against a raise, what do you do with your middle-strength hands?', a: 'Call', wrong: ['3-bet', 'Fold', 'Go all-in'], why: '3-bet the strongest, call the good ones not quite strong enough to 3-bet, fold the rest.' },
  { id: 'kts', q: 'KTs facing a UTG raise?', a: 'Fold', wrong: ['Call', '3-bet', 'All-in'], why: 'An underdog, and dominated by KJ, KQ and AK when it pairs the king.' },
  { id: 'behind-3b', q: 'An aggressive 3-bettor is still to act behind you. Your calling range gets...', a: 'Tighter', wrong: ['Wider', 'No different', 'Replaced by all-ins'], why: 'Drop the weaker calls and keep hands that can stand a 3-bet, like AQs and JJ.' },
  { id: 'behind-rec', q: 'Weak players behind you are likely to call too. You can add hands that...', a: 'Play well in a crowd', wrong: ['Are offsuit and unconnected', 'Need to win unimproved', 'Dominate nothing'], why: 'Suited connectors and small pairs gain implied odds in multi-way pots.' },
  { id: 'pairs-utg', q: 'Which pairs call a UTG open?', a: 'QQ down to 44', wrong: ['Every pair', 'TT down to 22', 'KK down to 99'], why: 'KK+ 3-bets; QQ to 44 call; 33 and 22 fold by default.' },
  { id: 'pairs-co', q: 'Which pairs call a cutoff open?', a: 'TT down to 22', wrong: ['QQ down to 44', 'JJ down to 22', 'Only 99 and 88'], why: 'JJ+ 3-bets against the cutoff, and every smaller pair calls.' },
  { id: 'set-odds', q: 'How often does a pocket pair flop a set or better?', a: '1 time in 8.5', wrong: ['1 time in 3', '1 time in 5', '1 time in 20'], why: '11.76% of flops.' },
  { id: 'set-even', q: 'To break even set mining, you must win how many times the call?', a: '9 times', wrong: ['3 times', '5 times', '15 times'], why: 'You hit about 1 time in 9 after rounding up, so the win must cover 9 calls.' },
  { id: 'set-rule', q: 'The rule for a profitable set-mine?', a: '15 to 1', wrong: ['5 to 1', '9 to 1', '50 to 1'], why: 'Only call if you can win 15 times the call when you hit.' },
  { id: 'set-45', q: 'By the 15-to-1 rule, a 3bb call needs...', a: '45bb', wrong: ['15bb', '27bb', '100bb'], why: '15 × 3bb.' },
  { id: 'set-eff', q: 'The effective stack is...', a: 'The smaller of your stack and theirs', wrong: ['Your stack', 'Their stack', 'Both stacks added'], why: 'It is the most you can win from that opponent.' },
];
