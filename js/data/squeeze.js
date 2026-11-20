// Value squeezing and over-calling (chapter 21 of the source book).
// The chart and the value-range table are transcribed exactly. Lessons are the
// core points in short form, not the book's text. Spots marked source: 'book'
// are its practice hands; 'derived' ones follow directly from a rule it states.

/**
 * Value 3-bets by the seat the raise comes from. With a caller in between they
 * are squeezes: the default range always, the optional one against a weak
 * raiser and a caller who calls light.
 */
export const VALUE_BY_OPENER = [
  { id: 'UTG', default: ['KK+', 'AKs'], optional: ['QQ', 'AKo'] },
  { id: 'MP', default: ['QQ+', 'AKs'], optional: ['JJ', 'AKo', 'AQs'] },
  { id: 'CO', default: ['JJ+', 'AQs+', 'AQo+', 'AJs'], optional: ['AJo', 'ATs', 'KQs'] },
  { id: 'BTN', default: ['JJ+', 'AQs+', 'AQo+', 'AJs'], optional: ['AJo', 'ATs', 'KQs'] },
];

/** The potential over-calling range: suited hands and pairs only. */
export const OVER_CALL = ['TT-55', 'A5s-A2s', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'J9s', 'T9s', 'T8s', '98s', '87s', '76s'];
/** Shaded on the same chart as hands that over-call or 3-bet for value, depending on the spot. */
export const OVER_CALL_OR_3BET = ['JJ', 'AQs', 'AJs', 'ATs', 'KQs', 'AQo'];

/**
 * A squeeze is a 3-bet plus this much for every caller.
 * The 3-bet multiples themselves live in threebet.js (THREE_BET_SIZE). The book
 * prints them the other way round (3.5 times out of position, 3 in position);
 * this app uses the owner's choice of the bigger raise in position.
 */
export const SQUEEZE_PER_CALLER = 3;

export const LESSONS = [
  {
    id: 'terms',
    title: 'Two terms',
    points: [
      'Squeeze: a big re-raise after one player has raised and at least one other has called.',
      'Over-call: calling a raise after someone else has already called it.',
      'So with a raise and a caller in front you have three plays: fold, over-call or squeeze.',
    ],
  },
  {
    id: 'value',
    title: 'Squeeze for value, not as a bluff',
    points: [
      'A squeeze is just a 3-bet. Others use it as a bluff; at micro stakes, where players call 3-bets too often, use it for value only.',
      'Always squeeze your default value range for the seat the raise came from. Add the optional hands when the raiser opens a weak, wide range and the caller calls light.',
      'Callers usually hold weak, capped ranges. The exception is a weak-tight player who just calls with JJ+ or AQ+.',
      'Two things can go right: you build a pot with a premium hand, or everyone folds and you win 7.5bb to 10.5bb at once. TT-JJ and AJ-AQ are happy with the second.',
    ],
  },
  {
    id: 'size',
    title: 'How big',
    points: [
      'Your normal 3-bet size, plus 3bb for every caller.',
      'If the raiser min-raised, size the squeeze as if they had made it 3bb.',
    ],
  },
  {
    id: 'overcall',
    title: 'Over-calling',
    points: [
      'Use it sparingly, and mostly in weak, passive games.',
      'The hands are like the ones you limp behind with, but fewer, because it costs about three times as much: pairs TT-55, small suited aces, suited connectors and gappers, and suited Broadway hands too weak to 3-bet.',
      'No offsuit hands. They do not make flushes, so KQo, ATo and AJo either squeeze for value or fold.',
      'JJ, KQs, ATs, AJs and AQ go either way: over-call or squeeze, depending on the raiser.',
    ],
  },
  {
    id: 'behind',
    title: 'Look behind you',
    points: [
      'An aggressive 3-bettor still to act: fold the over-calls. You will have to fold to their squeeze most of the time.',
      'Loose, passive players still to act: call more. More players in means a bigger pot when you hit.',
      'The more players left to act, the tighter you over-call. In position you can call wider.',
    ],
  },
];

export const CHEAT = [
  {
    title: 'How big',
    rows: [
      ['In position', '3.5 × their raise + 3bb per caller'],
      ['Out of position', '3 × their raise + 3bb per caller'],
      ['3bb raise, one caller', '13.5bb in position · 12bb out'],
      ['They min-raise', 'Size it from a 3bb raise'],
    ],
  },
  {
    title: 'Squeeze for value, by who raised',
    rows: VALUE_BY_OPENER.map((v) => [`${v.id} raises`, `${v.default.join(', ')} · maybe ${v.optional.join(', ')}`]),
  },
  {
    title: 'Over-calling',
    rows: [
      ['Over-call', OVER_CALL.join(', ')],
      ['Over-call or squeeze', OVER_CALL_OR_3BET.join(', ')],
      ['Offsuit hands', 'Squeeze for value or fold'],
      ['Bluff squeeze', 'Not at these stakes'],
    ],
  },
  {
    title: 'Look behind you',
    rows: [
      ['3-bettor still to act', 'Fold the over-calls'],
      ['Passive players behind', 'Call more'],
      ['More players behind', 'Tighter'],
      ['In position', 'Wider'],
    ],
  },
];

export const TRICKS = [
  'A squeeze is a 3-bet with a toll: add 3bb for every caller.',
  'Suited or paired to over-call. Offsuit hands squeeze or fold.',
  'An over-call costs three limps, so the range is tighter than limping behind: no pair below 55 and no connector below 76s.',
  'The caller is rarely strong. Pick the squeezing range by who raised.',
  'Check behind you before calling: one aggressive 3-bettor turns every over-call into a fold.',
];

export const FACTS = [
  { id: 'def', q: 'What is a squeeze?', a: 'A re-raise after a raise and at least one call', wrong: ['Any raise from the blinds', 'A call behind another caller', 'An all-in over a limp'], why: 'One player raises, another calls, and you re-raise them both.' },
  { id: 'overcall', q: 'What is an over-call?', a: 'Calling a raise after someone else has called it', wrong: ['Calling a 3-bet', 'Calling the big blind after a limper', 'Calling out of position'], why: 'You are the second or later caller of the same raise.' },
  { id: 'per-caller', q: 'How much do you add to a 3-bet for each caller?', a: '3bb', wrong: ['1bb', '2bb', '5bb'], why: 'A squeeze is your normal 3-bet plus 3bb per caller.' },
  { id: 'size-ip', q: 'They raise to 3bb and one player calls. Your squeeze in position?', a: '13.5bb', wrong: ['9bb', '10.5bb', '12bb'], why: '3.5 × 3bb, plus 3bb for the caller.' },
  { id: 'size-oop', q: 'They raise to 3bb and one player calls. Your squeeze out of position?', a: '12bb', wrong: ['9bb', '10.5bb', '13.5bb'], why: '3 × 3bb, plus 3bb for the caller.' },
  { id: 'bluff', q: 'Squeezing as a bluff at micro stakes?', a: 'Leave it out', wrong: ['With any suited connector', 'Whenever there are two callers', 'Every time from the blinds'], why: 'Opponents call 3-bets too often, so squeeze for value.' },
  { id: 'offsuit', q: 'KQo, ATo and AJo facing a raise and a caller?', a: 'Squeeze for value or fold', wrong: ['Always over-call', 'Always squeeze', 'Call and hope'], why: 'Offsuit hands play badly in multi-way pots, so they never over-call.' },
  { id: 'behind', q: 'An aggressive 3-bettor is still to act. Your over-calling hands...', a: 'Fold', wrong: ['Call as usual', 'Squeeze as a bluff', 'Go all-in'], why: 'You would have to fold to their squeeze most of the time.' },
  { id: 'minraise', q: 'They min-raise to 2bb and get a caller. Size your squeeze as if the raise was...', a: '3bb', wrong: ['2bb', '4bb', '1bb'], why: 'Basing it on 3bb makes them fold more often and wins more when they call.' },
  { id: 'val-late', q: 'Default value squeeze against a cutoff or button raise?', a: 'JJ+, AQ+, AJs', wrong: ['KK+, AKs', 'QQ+, AKs', 'Any pair'], why: 'Late-position raisers open wide, so more hands are ahead.' },
  { id: 'cost', q: 'Why is the over-calling range tighter than the limping-behind range?', a: 'It costs about three times as much', wrong: ['Suited hands are worse against raises', 'You are always out of position', 'Raisers never pay off'], why: 'Calling 3bb is three times the price of limping for 1bb.' },
  { id: 'capped', q: 'What does a player who just calls a raise usually hold?', a: 'A weak, capped range', wrong: ['AA or KK', 'Nothing at all', 'Exactly the same range as the raiser'], why: 'They would usually have 3-bet their strongest hands.' },
];

// Actions run in table order. Seats not listed before the hero have folded.
export const SPOTS = [
  {
    id: 'sq-book-1',
    source: 'book',
    lesson: 'value',
    title: 'A button raise and a call',
    hero: { seat: 'BB', hand: 'AQs', stack: 102 },
    stacks: { BTN: 100, SB: 582 },
    action: [['BTN', 'raise', 3], ['SB', 'call']],
    options: ['fold', 'call', '3bet'],
    correct: ['3bet'],
    why: 'Against a button raise AQs is a standard value 3-bet. The small blind calling in between makes it a squeeze, and adds 3bb to the size.',
  },
  {
    id: 'sq-book-2',
    source: 'book',
    lesson: 'size',
    title: 'A min-raise and a call',
    players: 4,
    hero: { seat: 'SB', hand: 'TT' },
    stacks: { CO: 50 },
    reads: { CO: 'rec' },
    notes: { CO: 'Min-raises: usually a hand too weak to raise properly' },
    action: [['CO', 'raise', 2], ['BTN', 'call']],
    options: ['fold', 'call', '3bet'],
    correct: ['3bet'],
    // The read changes the default: by the chart alone TT would over-call a cutoff raise.
    judgement: true,
    sizeBase: 3,
    why: 'A min-raise from a weak player means a weak range, and the big blind will come along cheaply if you just call. Tens play badly out of position four ways, so squeeze: win it now or play one opponent with the lead.',
  },
  {
    id: 'sq-book-3',
    source: 'book',
    lesson: 'overcall',
    title: 'Closing the action in the big blind',
    hero: { seat: 'BB', hand: '76s', stack: 116 },
    stacks: { BTN: 108, SB: 104 },
    reads: { BTN: 'lag', SB: 'passive' },
    notes: { BTN: 'Opens wide and bets half of all flops' },
    action: [['BTN', 'raise', 3], ['SB', 'call']],
    options: ['fold', 'call', '3bet'],
    correct: ['call'],
    why: '76s could be a bluff squeeze, but leave those out at these stakes. It costs 2bb more to close the action with a hand that can make something big, against a wide raiser and a caller who makes mistakes after the flop. Over-call.',
  },
  {
    id: 'sq-book-4',
    source: 'book',
    lesson: 'behind',
    title: 'A small pair on the button',
    hero: { seat: 'BTN', hand: '55', stack: 104 },
    stacks: { UTG: 188, MP: 60, SB: 49, BB: 86 },
    reads: { SB: 'passive', BB: 'lag' },
    notes: { SB: 'Has yet to raise a hand', BB: 'Raises often but 3-bets only 4% of the time' },
    action: [['UTG', 'raise', 3], ['MP', 'call']],
    options: ['fold', 'call', '3bet'],
    correct: ['call'],
    why: '55 is nowhere near a value squeeze against a UTG raise. Neither blind is likely to 3-bet behind you, so over-call in position with a set-mining hand and hope the pot goes four or five ways.',
  },
  {
    id: 'sq-derived-3bettor',
    source: 'derived',
    lesson: 'behind',
    title: 'A 3-bettor waiting behind',
    hero: { seat: 'BTN', hand: '98s' },
    reads: { BB: 'aggro3b' },
    action: [['UTG', 'raise', 3], ['MP', 'call']],
    options: ['fold', 'call', '3bet'],
    correct: ['fold'],
    why: '98s is an over-calling hand, but the big blind 3-bets aggressively and loves to squeeze a raise and two calls. You would have to fold to it most of the time, so fold now.',
  },
  {
    id: 'sq-derived-offsuit',
    source: 'derived',
    lesson: 'overcall',
    title: 'An offsuit Broadway hand',
    hero: { seat: 'BTN', hand: 'KQo' },
    action: [['MP', 'raise', 3], ['CO', 'call']],
    options: ['fold', 'call', '3bet'],
    correct: ['fold'],
    why: 'Offsuit hands do not over-call: they cannot make flushes and play badly multi-way. KQo is not a value squeeze against an MP raise either, so it folds.',
  },
  {
    id: 'sq-derived-jj-utg',
    source: 'derived',
    lesson: 'overcall',
    title: 'Jacks against an early raise',
    hero: { seat: 'BTN', hand: 'JJ' },
    action: [['UTG', 'raise', 3], ['MP', 'call']],
    options: ['fold', 'call', '3bet'],
    correct: ['call'],
    why: 'Against a UTG raise the value range is KK+ and AKs, with QQ and AKo optional. JJ is not in it, but it is one of the strong hands that over-calls.',
  },
  {
    id: 'sq-derived-jj-co',
    source: 'derived',
    lesson: 'value',
    title: 'Jacks against a late raise',
    hero: { seat: 'BB', hand: 'JJ' },
    action: [['CO', 'raise', 3], ['BTN', 'call']],
    options: ['fold', 'call', '3bet'],
    correct: ['3bet'],
    why: 'Against a cutoff raise the default value range is JJ+, AQ+ and AJs. You always squeeze your default value range, and the caller adds 3bb to the size.',
  },
  {
    id: 'sq-derived-two-callers',
    source: 'derived',
    lesson: 'size',
    title: 'Two callers',
    hero: { seat: 'BTN', hand: 'AA' },
    action: [['UTG', 'raise', 3], ['MP', 'call'], ['CO', 'call']],
    options: ['fold', 'call', '3bet'],
    correct: ['3bet'],
    why: 'Aces are a value squeeze against anyone. Each caller adds 3bb to the size, so two callers add 6bb.',
  },
  {
    id: 'sq-concept-goal',
    source: 'derived',
    lesson: 'value',
    title: 'What a squeeze is for',
    question: 'You squeeze with JJ and everyone folds. Is that a good result?',
    options: [
      { id: 'yes', label: 'Yes: you win 7.5bb or more without seeing a flop' },
      { id: 'no', label: 'No: a value hand always wants a call' },
      { id: 'never', label: 'No: you should have just called' },
    ],
    correct: ['yes'],
    why: 'A value squeeze has two ways to win. The more vulnerable value hands, TT-JJ and AJ-AQ, are glad to take the pot right there.',
  },
];
