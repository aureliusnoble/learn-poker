// Walkthroughs: each concept shown at the table, one step at a time.
//
// The ideas come from the source book; the wording is this app's own, kept
// short and concrete. A step shows one thing and says one thing. Where a step
// names the right play, `expect` names the engine that must agree with it, and
// the tests hold the two together.
//
// See js/walkthrough.js for what a step may carry.

const raise = (seat, to = 3) => [seat, 'raise', to];

export const LESSONS = [
  // ------------------------------------------------------------------ The table
  {
    id: 'table-seats',
    chapter: 'table',
    title: 'Seats and position',
    blurb: 'Where you sit decides when you act.',
    practice: { route: 'seats', label: 'Practise: find your seat' },
    steps: [
      {
        spot: { players: 6, hero: { seat: 'CO' }, dealt: true },
        focus: ['BTN'],
        head: 'Start with the button',
        text: [
          'The disc marked **D** is the dealer button. Every seat takes its name from where it sits relative to the button.',
          'After each hand the button moves one seat to the left. Your seat changes every hand.',
        ],
      },
      {
        focus: ['SB', 'BB'],
        head: 'The two blinds',
        text: 'The two seats after the button must bet before they see their cards. The **small blind** puts in half a bet. The **big blind** puts in a whole one.',
        callout: { kind: 'term', title: 'bb', text: 'Everything is counted in big blinds. A stack of 100bb is 100 times the big blind.' },
      },
      {
        focus: ['UTG'],
        head: 'Who acts first',
        text: [
          'Before the flop, the seat after the big blind goes first. It is called **under the gun**, or UTG.',
          'The action then runs clockwise: UTG, middle position (MP), cutoff (CO), button (BTN), and last the two blinds.',
        ],
      },
      {
        focus: ['CO', 'BTN'],
        head: 'Late seats know more',
        text: 'By the time the action reaches the cutoff and the button, most of the table has already folded or raised. They decide with more information.',
        callout: { kind: 'why', text: 'That is why you play more hands from late seats and fewer from early ones.' },
      },
      {
        spot: { players: 6, hero: { seat: 'BTN' }, action: [raise('MP')] },
        head: 'Position',
        text: [
          'After the flop the order changes. The small blind acts first and the button acts last, on every round.',
          'Here MP has raised and you are on the button. You will see what MP does before you decide. That is being **in position**.',
        ],
        whatIf: [
          {
            label: 'You are in the big blind',
            spot: { players: 6, hero: { seat: 'BB' }, action: [raise('MP')] },
            text: 'Now you act before MP on every later round, without knowing what they will do. You are **out of position**.',
          },
        ],
      },
      {
        spot: { players: 5, hero: { seat: 'CO' }, dealt: true },
        head: 'Smaller tables',
        text: [
          'With five players there is no UTG seat. The first to act is MP.',
          'The seats near the button keep their names, so count from the button, not from the first seat.',
        ],
        whatIf: [
          {
            label: 'Four players',
            spot: { players: 4, hero: { seat: 'CO' }, dealt: true },
            text: 'With four there is no MP either. The cutoff acts first, then the button and the two blinds.',
          },
        ],
      },
      {
        spot: { players: 5, hero: { seat: 'CO' }, dealt: true },
        hideSeats: true,
        head: 'Your turn',
        ask: {
          q: 'Find the button. Which seat are you in?',
          options: [{ id: 'MP', label: 'MP' }, { id: 'CO', label: 'CO' }, { id: 'BTN', label: 'BTN' }, { id: 'SB', label: 'SB' }],
          correct: 'CO',
          why: 'You sit one seat before the button. That is the cutoff.',
        },
      },
    ],
  },

  // ------------------------------------------------------------ Opening ranges
  {
    id: 'open-first',
    chapter: 'open',
    title: 'Opening the pot',
    blurb: 'Everyone folds to you. Raise or fold?',
    practice: { route: 'open-drill', label: 'Practise: raise or fold' },
    steps: [
      {
        spot: { players: 6, hero: { seat: 'CO', hand: 'K9s' }, dealt: true },
        head: 'King-nine suited in the cutoff',
        text: 'The cards are out and nobody has acted. Your decision depends on what happens before it reaches you.',
      },
      {
        spot: { players: 6, hero: { seat: 'CO', hand: 'K9s' } },
        head: 'Everyone before you folds',
        text: 'Two players fold. Nobody has put in more than the blinds, so the pot is **unopened** and you can be the first to raise.',
        callout: { kind: 'rule', title: 'Raise or fold', text: 'When you are first in, never just call the big blind. Raise, or fold.' },
      },
      {
        head: 'Your turn',
        ask: {
          q: 'K9 suited, folded to you in the cutoff.',
          options: [{ id: 'fold', label: 'Fold' }, { id: 'raise', label: 'Raise' }],
          correct: 'raise',
          why: 'From the cutoff you open K9 suited and every better suited king.',
        },
        play: 'Raise to 3bb',
        callout: { kind: 'rule', title: 'One size', text: 'Every opening raise is three big blinds, whatever you hold.' },
        expect: { by: 'open', play: 'raise' },
      },
      {
        spot: { players: 6, hero: { seat: 'UTG', hand: 'K9s' } },
        head: 'The same hand under the gun',
        text: [
          'Now you are first to act, with five players still to come. Any one of them could hold something better.',
          'So you open fewer hands from here. Under the gun, the weakest suited king you raise is KJ.',
        ],
        play: 'Fold',
        expect: { by: 'open', play: 'fold' },
        whatIf: [
          {
            label: 'Middle position',
            spot: { players: 6, hero: { seat: 'MP', hand: 'K9s' } },
            text: 'One fewer player behind you, and one more hand: MP opens KT suited. K9 suited still folds.',
            play: 'Fold',
            expect: { by: 'open', play: 'fold' },
          },
          {
            label: 'The button',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'K9s' } },
            text: 'Only the two blinds are left to act. The button opens suited kings down to K7.',
            play: 'Raise to 3bb',
            expect: { by: 'open', play: 'raise' },
          },
        ],
      },
      {
        head: 'Learn the edges, not the hands',
        text: 'You do not need to memorise 169 hands. For each kind of hand, learn the weakest one you open from each seat. Everything stronger plays.',
        rows: [['Under the gun', 'KJs or better'], ['Middle position', 'KTs or better'], ['Cutoff', 'K9s or better'], ['Button', 'K7s or better']],
        callout: { kind: 'tip', text: 'Suited kings drop one rank a seat: KJ, KT, K9, then K7 on the button.' },
      },
      {
        spot: { players: 6, hero: { seat: 'UTG', hand: 'ATo' } },
        head: 'Suited is worth more',
        text: 'Two cards of one suit can make a flush. Two of different suits cannot. So an offsuit hand has to be stronger to play: under the gun you need AJ.',
        play: 'Fold',
        expect: { by: 'open', play: 'fold' },
        whatIf: [
          {
            label: 'Ace-ten suited',
            spot: { players: 6, hero: { seat: 'UTG', hand: 'ATs' } },
            text: 'The same two ranks in one suit are good enough.',
            play: 'Raise to 3bb',
            expect: { by: 'open', play: 'raise' },
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'SB', hand: 'A9o' } },
        head: 'The small blind copies the cutoff',
        text: 'When everyone folds to you in the small blind, only the big blind is left. Open the same hands you would open from the cutoff.',
        play: 'Raise to 3bb',
        expect: { by: 'open', play: 'raise' },
      },
      {
        spot: { players: 5, hero: { seat: 'MP', hand: 'A9s' } },
        head: 'Your turn',
        text: 'A five-handed table. There is no UTG seat, so you are first to act in middle position.',
        ask: {
          q: 'Ace-nine suited.',
          options: [{ id: 'fold', label: 'Fold' }, { id: 'raise', label: 'Raise' }],
          correct: 'raise',
          why: 'MP opens ace-nine suited or better. The range belongs to the seat, however many players are at the table.',
        },
        expect: { by: 'open', play: 'raise' },
      },
    ],
  },

  // ------------------------------------------------------------------ 3-betting
  {
    id: 'tb-threebet',
    chapter: 'threebet',
    title: 'The 3-bet',
    blurb: 'Someone raises. When do you raise again, and how big?',
    practice: { route: 'tb-spots', label: 'Practise: play the spot' },
    steps: [
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'QQ' }, action: [raise('CO')] },
        head: 'Count the bets',
        text: 'The blinds are the first bet. The cutoff\'s raise is the second. If you raise again, that is the third: a **3-bet**.',
        rows: [['1st bet', 'The blinds'], ['2nd', 'An opening raise'], ['3rd', 'A 3-bet'], ['4th', 'A 4-bet'], ['5th', 'All-in']],
      },
      {
        head: 'Your turn',
        text: 'You hold pocket queens. Only aces and kings beat you.',
        ask: {
          q: 'The cutoff has raised to 3bb.',
          options: [{ id: 'fold', label: 'Fold' }, { id: 'call', label: 'Call 3bb' }, { id: '3bet', label: '3-bet' }],
          correct: '3bet',
          why: 'When you are well ahead, you want more money in the pot. Queens are a 3-bet against anyone.',
        },
        callout: { kind: 'term', title: 'Value bet', text: 'A bet you make because worse hands will call it.' },
      },
      {
        head: 'How big',
        text: [
          'Size a 3-bet from their raise, not from the blinds.',
          'On the button you act after the cutoff for the rest of the hand. You are in position.',
        ],
        callout: { kind: 'rule', text: 'In position, 3.5 times their raise. Out of position, 3 times.' },
        play: '3-bet to 10.5bb',
        whatIf: [
          {
            label: 'You are in the big blind',
            spot: { players: 6, hero: { seat: 'BB', hand: 'QQ' }, action: [raise('CO')] },
            text: 'From the blinds you act first after the flop. Out of position, make it 3 times their raise.',
            play: '3-bet to 9bb',
          },
          {
            label: 'They raised to 2.5bb',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'QQ' }, action: [raise('CO', 2.5)] },
            text: 'A smaller raise, a smaller 3-bet: 3.5 × 2.5bb.',
            play: '3-bet to 8.75bb',
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'AQo' }, action: [raise('CO')] },
        head: 'Who raised matters',
        text: [
          'Now you hold ace-queen offsuit against the same raise.',
          'The cutoff opens about one hand in five. Much of what calls your 3-bet is worse than ace-queen.',
        ],
        play: '3-bet to 10.5bb',
        callout: { kind: 'rule', text: 'A 3-bet is for value only if worse hands call it. The tighter the raiser, the fewer of your hands pass that test.' },
        whatIf: [
          {
            label: 'UTG raised',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'AQo' }, action: [raise('UTG')] },
            text: 'UTG opens fewer than one hand in ten. What continues against a 3-bet now beats ace-queen, so just call.',
            play: 'Call 3bb',
            expect: { by: 'call', play: 'call' },
          },
          {
            label: 'MP raised',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'AQo' }, action: [raise('MP')] },
            text: 'Still too tight a raiser. Against MP you 3-bet queens or better and ace-king suited.',
            play: 'Call 3bb',
            expect: { by: 'call', play: 'call' },
          },
        ],
      },
      {
        head: 'One more pair per seat',
        text: 'The later the raiser, the wider your value 3-bets.',
        rows: [['UTG raises', 'KK+, AKs'], ['MP raises', 'QQ+, AKs'], ['CO or BTN raises', 'JJ+, AQ+, AJs']],
        callout: { kind: 'tip', text: 'Kings against UTG, queens against MP, jacks against the cutoff.' },
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'KQs' }, reads: { CO: 'lag' }, notes: { CO: 'Opens a wide range' }, action: [raise('CO')] },
        head: 'A raiser who opens too many hands',
        text: 'This cutoff raises far more hands than most. Against a range that wide, king-queen suited is ahead often enough to 3-bet for value.',
        callout: { kind: 'term', title: 'Merged 3-bet', text: 'Adding good-but-not-great hands to your value 3-bets against a loose raiser.' },
        play: '3-bet to 10.5bb',
        whatIf: [
          {
            label: 'A tight raiser',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'KQs' }, reads: { MP: 'nit' }, notes: { MP: 'Opens few hands' }, action: [raise('MP')] },
            text: 'Against a tight range, king-queen suited is not ahead of what calls. It goes back to being a call.',
            play: 'Call 3bb',
            expect: { by: 'call', play: 'call' },
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'A4s' }, reads: { CO: 'tag' }, notes: { CO: 'Folds to 3-bets often' }, action: [raise('CO')] },
        head: 'The bluff',
        text: [
          'A 3-bet can also win because they fold. That is a bluff.',
          'Bluff with hands that can still make something when called: small suited aces, suited connectors, small pairs.',
        ],
        callout: { kind: 'watch', text: 'Use it rarely. A bluff only works on a player who folds, and at these stakes many do not.' },
        play: '3-bet to 10.5bb, now and then',
        whatIf: [
          {
            label: 'They never fold',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'A4s' }, reads: { CO: 'rec' }, notes: { CO: 'Rarely folds' }, action: [raise('CO')] },
            text: 'No fold, no bluff. Against this player, 3-bet for value only.',
            play: 'No 3-bet',
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'SB', hand: 'JJ' }, action: [raise('BTN')] },
        head: 'Your turn',
        text: 'Jacks against a button raise are a value 3-bet.',
        ask: {
          q: 'You are in the small blind. How big?',
          options: [{ id: '7.5', label: '7.5bb' }, { id: '9', label: '9bb' }, { id: '10.5', label: '10.5bb' }, { id: '12', label: '12bb' }],
          correct: '9',
          why: 'The small blind acts first after the flop. Out of position, 3 times their raise.',
        },
      },
    ],
  },
  {
    id: 'tb-facing',
    chapter: 'threebet',
    title: 'When they 3-bet you',
    blurb: 'You raise and get re-raised. Fold, call or raise again?',
    practice: { route: 'tb-spots', label: 'Practise: play the spot' },
    steps: [
      {
        spot: { players: 6, hero: { seat: 'CO', hand: 'QJs' }, action: [raise('CO')] },
        head: 'You open queen-jack suited',
        text: 'Folded to you in the cutoff. A normal raise to 3bb.',
      },
      {
        spot: { players: 6, hero: { seat: 'CO', hand: 'QJs' }, reads: { BTN: 'nit' }, notes: { BTN: '3-bets only QQ+ and AKs' }, action: [raise('CO'), raise('BTN', 10.5)] },
        head: 'The button re-raises',
        text: 'You face a 3-bet. You can fold, call, or raise again. Before you choose, ask one question.',
        callout: { kind: 'rule', title: 'The question', text: 'Do they 3-bet only their strong hands, or do they bluff as well?' },
      },
      {
        head: 'Strong hands only',
        text: 'This player 3-bets queens or better and ace-king suited, and nothing else. Queen-jack suited loses to every one of those hands.',
        callout: { kind: 'rule', text: 'Against strong hands only: fold when you are behind their range, raise again when you are ahead of it.' },
        play: 'Fold',
        whatIf: [
          {
            label: 'You hold kings',
            spot: { players: 6, hero: { seat: 'CO', hand: 'KK' }, reads: { BTN: 'nit' }, notes: { BTN: '3-bets only QQ+ and AKs' }, action: [raise('CO'), raise('BTN', 10.5)] },
            text: 'Kings beat queens and ace-king. You are ahead of their range, so raise again for value.',
            play: '4-bet',
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'CO', hand: 'KQs' }, reads: { BB: 'aggro3b' }, action: [raise('CO'), raise('BB', 9)] },
        head: 'A player who 3-bets a lot',
        text: [
          'This big blind re-raises often, bluffs included. Their range is much weaker.',
          'King-queen, a fold against the tight player, is now ahead often enough to call. You also act last after the flop.',
        ],
        play: 'Call 6bb',
        whatIf: [
          {
            label: 'You hold jacks',
            spot: { players: 6, hero: { seat: 'CO', hand: 'JJ' }, reads: { BB: 'aggro3b' }, action: [raise('CO'), raise('BB', 9)] },
            text: 'Against a range full of bluffs, jacks are well ahead. Raise again for value.',
            play: '4-bet',
          },
          {
            label: 'They 3-bet only premiums',
            spot: { players: 6, hero: { seat: 'CO', hand: 'KQs' }, reads: { BB: 'nit' }, notes: { BB: '3-bets only premium hands' }, action: [raise('CO'), raise('BB', 9)] },
            text: 'Then king-queen is behind and often dominated. It folds.',
            play: 'Fold',
          },
        ],
      },
      {
        head: 'If it keeps happening',
        text: 'Some players in the blinds re-raise your late-seat opens again and again. Three fixes, easiest first.',
        rows: [
          ['Open fewer, stronger hands', 'A stronger range folds less'],
          ['Open to 2bb or 2.5bb from CO and BTN', 'Each raise risks less'],
          ['Call and 4-bet more against wide 3-bettors', 'Most of all in position'],
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'AJs' }, reads: { SB: 'aggro3b' }, action: [raise('BTN'), raise('SB', 9)] },
        head: 'Your turn',
        ask: {
          q: 'An aggressive 3-bettor in the small blind makes it 9bb.',
          options: [{ id: 'fold', label: 'Fold' }, { id: 'call', label: 'Call 6bb' }, { id: '4bet', label: '4-bet' }],
          correct: 'call',
          why: 'Against a wide 3-betting range, ace-jack moves from a fold to a call, and you have position.',
        },
      },
    ],
  },
  {
    id: 'tb-fourbet',
    chapter: 'threebet',
    title: '4-bets',
    blurb: 'Raising a 3-bet, and what to do when they raise yours.',
    practice: { route: 'sizes', label: 'Practise: size the raise' },
    steps: [
      {
        spot: { players: 6, hero: { seat: 'CO', hand: 'KK' }, action: [raise('CO'), raise('BTN', 10.5)] },
        head: 'You open, the button 3-bets',
        text: 'You hold kings. Raising again here is a **4-bet**.',
      },
      {
        head: 'For value, never as a bluff',
        text: 'At these stakes a player who 3-bets usually has a strong hand and is happy to get all the chips in. So 4-bet only hands that beat what they continue with.',
        callout: { kind: 'rule', title: 'The test', text: 'Will they put in more money with a worse hand?' },
        rows: [['Always', 'KK+'], ['Add against loose players', 'AK, QQ, JJ']],
        play: '4-bet',
      },
      {
        head: 'How big',
        text: 'A 4-bet is a little more than double their 3-bet. In the cutoff you act before the button after the flop, so you are out of position.',
        callout: { kind: 'rule', text: 'In position, 2 to 2.2 times their 3-bet. Out of position, 2.2 to 2.5 times.' },
        play: '4-bet to about 23bb to 26bb',
        whatIf: [
          {
            label: 'You are on the button',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'KK' }, action: [raise('BTN'), raise('BB', 9)] },
            text: 'The big blind 3-bets to 9bb. You act last after the flop, so use the smaller multiple: 2 to 2.2 times 9bb.',
            play: '4-bet to about 18bb to 20bb',
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'CO', hand: 'QQ' }, reads: { BTN: 'nit' }, notes: { BTN: '3-bets only premium hands' }, action: [raise('CO'), raise('BTN', 10.5)] },
        head: 'Queens against a nit',
        text: 'A nit who 3-bets holds aces, kings, queens or ace-king. If you raise again, the hands you beat fold and the hands that beat you stay.',
        play: 'No 4-bet',
        whatIf: [
          {
            label: 'A loose player 3-bets',
            spot: { players: 6, hero: { seat: 'CO', hand: 'QQ' }, reads: { BTN: 'rec' }, notes: { BTN: 'Weak and loose' }, action: [raise('CO'), raise('BTN', 10.5)] },
            text: 'This player calls with worse. Now queens pass the test.',
            play: '4-bet',
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'QQ' }, reads: { CO: 'nit' }, notes: { CO: 'Only 4-bets KK+' }, action: [raise('CO'), raise('BTN', 10.5), raise('CO', 24)] },
        head: 'When they 4-bet you',
        text: 'You 3-bet queens and the cutoff raises again. At the lowest stakes, many players 4-bet only aces and kings.',
        play: 'Fold',
        whatIf: [
          {
            label: 'They bluff with 4-bets',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'QQ' }, reads: { CO: 'lag' }, notes: { CO: '4-bets light, bluffs included' }, action: [raise('CO'), raise('BTN', 10.5), raise('CO', 24)] },
            text: 'With bluffs in their range, queens are too strong to fold.',
            play: 'Call, or go all-in',
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'CO', hand: 'A5s' }, reads: { BTN: 'tag' }, notes: { BTN: '3-bets a strong range' }, action: [raise('CO'), raise('BTN', 10.5)] },
        head: 'Your turn',
        ask: {
          q: 'A5 suited made a good 3-bet bluff. Is it a 4-bet bluff here?',
          options: [{ id: 'no', label: 'No' }, { id: 'yes', label: 'Yes' }],
          correct: 'no',
          why: 'At these stakes you 4-bet for value only. A strong 3-betting range does not fold enough to bluff.',
        },
      },
    ],
  },

  // ---------------------------------------------------- Cold-calling, set mining
  {
    id: 'call-gap',
    chapter: 'coldcall',
    title: 'Calling a raise',
    blurb: 'A raise in front of you changes which hands are worth playing.',
    practice: { route: 'call-drill', label: 'Practise: call, 3-bet or fold' },
    steps: [
      {
        spot: { players: 6, hero: { seat: 'MP', hand: 'AQs' }, reads: { UTG: 'tag' }, action: [raise('UTG')] },
        head: 'UTG raises, you hold ace-queen suited',
        text: 'If you call, you are **cold-calling**: being the first player to call a raise.',
      },
      {
        head: 'A raise raises the bar',
        text: 'You would open ace-queen suited from any seat. But UTG has already shown strength. A player who raises from the first seat holds a strong hand.',
        callout: { kind: 'rule', title: 'The gap', text: 'You need a stronger hand to call a raise than to make one.' },
      },
      {
        head: 'Three zones',
        text: 'Against a raise, every hand falls into one of three zones.',
        rows: [['Your strongest hands', '3-bet'], ['Good, but not strong enough to 3-bet', 'Call'], ['Everything else', 'Fold']],
        callout: { kind: 'why', text: 'Ace-queen suited wins a little over half the time against a UTG range. Enough to call, not enough to 3-bet a range that tight.' },
        play: 'Call 3bb',
        expect: { by: 'call', play: 'call' },
      },
      {
        spot: { players: 6, hero: { seat: 'MP', hand: 'KTs' }, reads: { UTG: 'tag' }, action: [raise('UTG')] },
        head: 'A hand that looks playable',
        text: 'King-ten suited is a hand you open yourself. Against a UTG raise it is in trouble: when you pair your king, UTG often shows KJ, KQ or AK.',
        callout: { kind: 'term', title: 'Dominated', text: 'You share a card with a better hand, and their other card beats yours.' },
        play: 'Fold',
        expect: { by: 'call', play: 'fold' },
        whatIf: [
          {
            label: 'The cutoff raised',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'KTs' }, action: [raise('CO')] },
            text: 'The cutoff opens more than twice as many hands as UTG. King-ten suited is ahead of far more of them, and you are on the button.',
            play: 'Call 3bb',
            expect: { by: 'call', play: 'call' },
          },
        ],
      },
      {
        head: 'Later raiser, wider call',
        text: 'The later the seat the raise comes from, the more hands you can call with.',
        rows: [['Against UTG', 'Call 7.7% of hands'], ['Against MP', '9.7%'], ['Against the cutoff', '11%']],
      },
      {
        spot: { players: 6, hero: { seat: 'CO', hand: 'ATs' }, reads: { BTN: 'aggro3b' }, action: [raise('MP')] },
        head: 'Look behind you',
        text: 'Ace-ten suited is a normal call against MP. But the button behind you re-raises a lot. Call, get re-raised, fold: you lose 3bb for nothing.',
        play: 'Fold',
        whatIf: [
          {
            label: 'Quiet players behind',
            spot: { players: 6, hero: { seat: 'CO', hand: 'ATs' }, action: [raise('MP')] },
            text: 'With nobody likely to re-raise, it is a call again.',
            play: 'Call 3bb',
            expect: { by: 'call', play: 'call' },
          },
          {
            label: 'You hold ace-queen suited',
            spot: { players: 6, hero: { seat: 'CO', hand: 'AQs' }, reads: { BTN: 'aggro3b' }, action: [raise('MP')] },
            text: 'A hand strong enough to stand a re-raise can still call. Ace-queen suited and jacks are the kind.',
            play: 'Call 3bb',
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: '97s' }, reads: { CO: 'lag', SB: 'rec', BB: 'rec' }, action: [raise('CO')] },
        head: 'When the table says call',
        text: 'Nine-seven suited is not a default call. Here three things point the other way: the raiser opens wide, two weak players in the blinds will probably come along, and you act last.',
        callout: { kind: 'term', title: 'Implied odds', text: 'What you stand to win on later rounds when your hand hits.' },
        play: 'Call 3bb',
        whatIf: [
          {
            label: 'You know nothing about them',
            spot: { players: 6, hero: { seat: 'BTN', hand: '97s' }, action: [raise('CO')] },
            text: 'With no reason to stray, stay with the default ranges.',
            play: 'Fold',
            expect: { by: 'call', play: 'fold' },
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'JTs' }, reads: { MP: 'passive' }, notes: { MP: 'Raises 6% of hands' }, action: [raise('MP', 4)] },
        head: 'Read the size of the raise',
        text: [
          'A passive player who rarely raises makes it 4bb. That is a very strong range. You are not ahead of it.',
          'But jack-ten suited makes straights, flushes and two pair, and a strong hand pays you when it does.',
        ],
        play: 'Call 4bb',
      },
      {
        head: 'Five things to weigh',
        text: 'Before you call a raise, run down the list.',
        rows: [
          ['Are you ahead?', 'Of the hands this raiser opens'],
          ['Can you win big?', 'Deep stacks, a hand that makes strong hands'],
          ['Do you have position?', 'On a raiser who opens wide'],
          ['How big is the raise?', 'A big raise from a passive player is strong'],
          ['Who is behind you?', 'A re-raiser: tighter. Weak callers: wider'],
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'CO', hand: 'KJo' }, action: [raise('UTG')] },
        head: 'Your turn',
        text: 'UTG raises. You know nothing about any of the players.',
        ask: {
          q: 'King-jack offsuit in the cutoff.',
          options: [{ id: 'fold', label: 'Fold' }, { id: 'call', label: 'Call 3bb' }, { id: '3bet', label: '3-bet' }],
          correct: 'fold',
          why: 'King-jack offsuit is not strong enough to call a UTG raise: AK, KQ and AJ all dominate it. With no reads, stay with the default ranges.',
        },
        expect: { by: 'call', play: 'fold' },
      },
    ],
  },
  {
    id: 'call-setmine',
    chapter: 'coldcall',
    title: 'Set mining',
    blurb: 'Calling with a small pair, hoping for a third.',
    practice: { route: 'call-sets', label: 'Practise: set mining' },
    steps: [
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: '44' }, reads: { UTG: 'tag' }, action: [raise('UTG')] },
        head: 'UTG raises, you hold pocket fours',
        text: 'Fours are behind a UTG range. You would call for one reason: to flop a third four.',
        callout: { kind: 'term', title: 'Set', text: 'Three of a kind made with a pair in your hand. Calling to hit one is **set mining**.' },
      },
      {
        head: 'How often it comes',
        text: 'You flop a set about one time in eight and a half. The other times you mostly give up the hand.',
        rows: [['Flop a set or better', '11.8% of the time'], ['Miss', '88.2%']],
      },
      {
        head: 'What the one hit must win',
        text: [
          'You pay 3bb every time and hit about one time in nine. To break even, the hit has to win back nine calls: 27bb.',
          'Breaking even is not the goal. So the rule asks for more.',
        ],
        callout: { kind: 'rule', title: '15 to 1', text: 'Call only if you can win 15 times the call when you hit. A 3bb call needs 45bb.' },
      },
      {
        head: 'First check: the stacks',
        text: 'You can win only what the smaller stack holds. You and UTG both have 100bb, so the 45bb is there to win.',
        callout: { kind: 'term', title: 'Effective stack', text: 'The smaller of your stack and theirs.' },
        play: 'Call 3bb',
        whatIf: [
          {
            label: 'The raiser has 22bb',
            spot: { players: 6, hero: { seat: 'BTN', hand: '44' }, reads: { UTG: 'tag' }, stacks: { UTG: 22 }, action: [raise('UTG')] },
            text: 'The most you can win is 22bb. You need 45bb. There is nothing to mine for.',
            play: 'Fold',
          },
        ],
      },
      {
        head: 'Then check the player',
        text: 'Deep stacks are not enough. The money only goes in if your opponent has a hand worth paying with, and is the type to pay.',
        rows: [['The stacks', 'Can you win 15 times the call?'], ['Their hand', 'A strong range pays off a set'], ['Their style', 'Will they put the money in?']],
        whatIf: [
          {
            label: 'A maniac raises',
            spot: { players: 6, hero: { seat: 'BB', hand: '22' }, reads: { CO: 'maniac' }, stacks: { CO: 168 }, action: [raise('CO', 4)] },
            text: 'His hands are often weak, which counts against the call. But he bluffs and overplays one pair, so a set gets paid.',
            play: 'Call 3bb',
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'CO', hand: '33', stack: 89 }, reads: { BTN: 'nit' }, stacks: { BTN: 89 }, action: [raise('CO'), raise('BTN', 10)] },
        head: 'Your turn',
        text: 'You open threes and a nit 3-bets to 10bb. Calling costs 7bb. There is 89bb to win.',
        ask: {
          q: '15 to 1 would need 105bb.',
          options: [{ id: 'fold', label: 'Fold' }, { id: 'call', label: 'Call 7bb' }],
          correct: 'call',
          why: 'It is short of 15 to 1, but 89bb is almost 13 times the call, well past break-even. And a nit who 3-bets holds aces, kings, queens or ace-king, and will not let go of them.',
        },
      },
    ],
  },

  // -------------------------------------------------------------------- Limpers
  {
    id: 'limp-raise',
    chapter: 'limp',
    title: 'Raising a limper',
    blurb: 'Someone just calls the big blind. Make them pay to play.',
    practice: { route: 'limp-drill', label: 'Practise: limpers in front' },
    steps: [
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'AJo' }, action: [['UTG', 'limp']] },
        head: 'UTG just calls the big blind',
        text: 'Calling the big blind instead of raising is a **limp**. At these stakes, only weak players limp in first.',
      },
      {
        head: 'Why raise them',
        text: 'Most of your profit comes from weak players. A raise here does three things.',
        rows: [
          ['Gets you one-on-one', 'The others fold and you play the weak player alone'],
          ['Gives you the lead', 'You act last, with the better hand'],
          ['Often wins at once', 'Everyone folds and you take the pot'],
        ],
        callout: { kind: 'term', title: 'Isolation raise', text: 'A raise made to play a limper one-on-one.' },
      },
      {
        head: 'Your turn',
        text: 'Most limpers call a raise with almost anything. So raise hands good enough to win when the cards are turned over, not hands that need a fold.',
        ask: {
          q: 'Ace-jack offsuit on the button.',
          options: [{ id: 'fold', label: 'Fold' }, { id: 'limp', label: 'Limp 1bb' }, { id: 'iso', label: 'Raise' }],
          correct: 'iso',
          why: 'Ace-jack is in the default range for raising a limper.',
        },
        rows: [['Raise by default', '88+, AJs+, KJs+, QJs, AJo+, KJo+']],
        expect: { by: 'limp', play: 'iso' },
      },
      {
        head: 'How big',
        text: 'Start at 3bb. Add 1bb for the limper.',
        callout: { kind: 'rule', text: '3bb, plus 1bb for each limper, plus 1bb if you are out of position.' },
        play: 'Raise to 4bb',
        whatIf: [
          {
            label: 'Two limpers',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'AJo' }, action: [['UTG', 'limp'], ['MP', 'limp']] },
            text: 'One more limper, one more big blind.',
            play: 'Raise to 5bb',
            expect: { by: 'limp', play: 'iso' },
          },
          {
            label: 'You are in the small blind',
            spot: { players: 6, hero: { seat: 'SB', hand: 'AJo' }, action: [['BTN', 'limp']] },
            text: 'You will act first after the flop. Out of position, add another big blind: 3 + 1 + 1.',
            play: 'Raise to 5bb',
            expect: { by: 'limp', play: 'iso' },
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'CO', hand: 'KTs' }, reads: { MP: 'weaktight' }, notes: { MP: 'Plays 12% of hands, raises 6%, folds to most flop bets' }, action: [['MP', 'limp']] },
        head: 'Who limped?',
        text: 'This limper plays few hands and gives up when the flop misses. Against a player who folds this much, you can raise more hands than the default.',
        play: 'Raise to 4bb',
        expect: { by: 'limp', play: 'iso' },
        whatIf: [
          {
            label: 'A calling station limps',
            spot: { players: 6, hero: { seat: 'CO', hand: 'KTs' }, reads: { MP: 'station' }, action: [['MP', 'limp']] },
            text: 'This one never folds. King-ten suited is no longer a clear raise: raise it or limp behind. With a weaker hand such as 87 suited, just limp.',
            play: 'Raise, or limp',
          },
        ],
      },
      {
        head: 'Telling them apart',
        text: 'Look at two numbers: how many hands a player plays, and how many they raise. A big gap between the two is a limper.',
        rows: [['Weak-tight', 'Plays about 15%, raises 6%'], ['Weak-loose', 'Plays about 50%, raises 8%']],
        callout: { kind: 'tip', text: 'Tight limper: raise more hands. Loose limper: raise stronger hands, and raise bigger.' },
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'T9s' }, action: [['UTG', 'limp'], ['MP', 'limp'], ['CO', 'limp']] },
        head: 'More limpers, stronger hand',
        text: [
          'Three players have limped. If each folds to a raise 65% of the time, all three fold only 27% of the time.',
          'So you will usually be playing a crowd. Raise big cards and strong pairs. With ten-nine suited, take the cheap flop.',
        ],
        play: 'Limp 1bb',
        expect: { by: 'limp', play: 'limp' },
        whatIf: [
          {
            label: 'You hold ace-queen',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'AQo' }, action: [['UTG', 'limp'], ['MP', 'limp'], ['CO', 'limp']] },
            text: 'Big cards keep their value against a crowd. 3bb plus 1bb for each of the three limpers.',
            play: 'Raise to 6bb',
            expect: { by: 'limp', play: 'iso' },
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BB', hand: 'JJ' }, action: [['CO', 'limp']] },
        head: 'Your turn',
        text: 'The cutoff limps, the others fold, and you hold jacks in the big blind.',
        ask: {
          q: 'How big do you raise?',
          options: [{ id: '3', label: '3bb' }, { id: '4', label: '4bb' }, { id: '5', label: '5bb' }, { id: '6', label: '6bb' }],
          correct: '5',
          why: '3bb, plus 1bb for the limper, plus 1bb because the big blind acts first after the flop.',
        },
      },
    ],
  },
  {
    id: 'limp-behind',
    chapter: 'limp',
    title: 'Limping behind',
    blurb: 'When calling the big blind is the right play.',
    practice: { route: 'limp-drill', label: 'Practise: limpers in front' },
    steps: [
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: '44' }, action: [['UTG', 'limp'], ['MP', 'limp']] },
        head: 'Two limpers, and you hold fours',
        text: 'Being the first to limp is a mistake. Limping **behind** players who have already limped is a different thing.',
      },
      {
        head: 'Why not raise',
        text: [
          'Two limpers rarely both fold, and fours seldom win without improving.',
          'But for 1bb you see a flop in position. If a four comes, you can win a big pot from players who call too much.',
        ],
        play: 'Limp 1bb',
        expect: { by: 'limp', play: 'limp' },
      },
      {
        head: 'The hands to limp with',
        text: 'Hands that are weak now but can make something big: three of a kind, a flush, a straight.',
        rows: [['Pairs', '77 down to 22'], ['Suited aces', 'A9s down to A2s'], ['Suited connectors and gappers', 'Down to 54s']],
      },
      {
        spot: { players: 6, hero: { seat: 'CO', hand: '76s' }, reads: { BTN: 'isoraiser' }, action: [['UTG', 'limp']] },
        head: 'Look behind you',
        text: 'The button raises limpers often. Limp here and you will probably face a raise with a weak hand.',
        callout: { kind: 'watch', text: 'Never limp into a raiser. Raise your better hands yourself and fold the rest.' },
        play: 'Fold, or raise',
        whatIf: [
          {
            label: 'Nobody aggressive behind',
            spot: { players: 6, hero: { seat: 'CO', hand: '76s' }, action: [['UTG', 'limp']] },
            text: 'With quiet players behind you, limp along.',
            play: 'Limp 1bb',
            expect: { by: 'limp', play: 'limp' },
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: '76s' }, stacks: { MP: 24 }, action: [['MP', 'limp']] },
        head: 'A short stack limps',
        text: 'This limper has only 24bb and can push all of it in over your raise. Raise only hands you would be glad to call that with: ace-jack or better, nines or better.',
        play: 'Limp, or fold',
        expect: { by: 'limp', play: 'limp' },
        whatIf: [
          {
            label: 'You hold ace-queen',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'AQo' }, stacks: { MP: 24 }, action: [['MP', 'limp']] },
            text: 'A hand you are happy to get all-in with. Raise the normal size.',
            play: 'Raise to 4bb',
            expect: { by: 'limp', play: 'iso' },
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'J9s', stack: 98 }, reads: { UTG: 'passive', MP: 'passive', BB: 'passive' }, stacks: { UTG: 80, MP: 48, BB: 170 }, action: [['UTG', 'limp'], ['MP', 'limp']] },
        head: 'Your turn',
        ask: {
          q: 'Two passive players limp. Another passive player is in the big blind.',
          options: [{ id: 'fold', label: 'Fold' }, { id: 'limp', label: 'Limp 1bb' }, { id: 'iso', label: 'Raise' }],
          correct: 'limp',
          why: 'Nobody is likely to raise behind you, and jack-nine suited can make a big hand. In the book this hand flopped two pair and won a 227bb pot.',
        },
        expect: { by: 'limp', play: 'limp' },
      },
    ],
  },

  // ------------------------------------------------------- Squeeze and over-call
  {
    id: 'sq-squeeze',
    chapter: 'squeeze',
    title: 'A raise and a caller',
    blurb: 'Two players are in before you. Re-raise them both, call along, or fold.',
    practice: { route: 'sq-drill', label: 'Practise: a raise and a caller' },
    steps: [
      {
        spot: { players: 6, hero: { seat: 'BB', hand: 'AQs' }, dealt: true },
        head: 'Ace-queen suited in the big blind',
        text: 'You are last to act before the flop. Watch what the others do.',
      },
      {
        spot: { players: 6, hero: { seat: 'BB', hand: 'AQs' }, action: [raise('BTN'), ['SB', 'call']] },
        head: 'A raise, then a call',
        text: 'The button raises to 3bb and the small blind calls. With a raise and a caller in front of you, there are three plays.',
        rows: [['Fold', ''], ['Over-call', 'Call after someone else has called'], ['Squeeze', 'Re-raise them both']],
      },
      {
        head: 'Squeeze for value',
        text: [
          'Against a button raise, ace-queen suited is a value 3-bet. A caller in between does not change that.',
          'A player who just calls rarely has a big hand. They would have re-raised it.',
        ],
        callout: { kind: 'watch', text: 'Squeeze for value only. At these stakes players call re-raises too often for a bluff to work.' },
        play: 'Squeeze',
        expect: { by: 'squeeze', play: '3bet' },
      },
      {
        head: 'How big',
        text: 'Start with your normal 3-bet. From the big blind you are out of position: 3 times 3bb is 9bb. Then add 3bb for the caller.',
        callout: { kind: 'rule', text: 'A squeeze is your 3-bet plus 3bb for every caller.' },
        play: 'Squeeze to 12bb',
        whatIf: [
          {
            label: 'In position, with aces',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'AA' }, action: [raise('UTG'), ['MP', 'call']] },
            text: 'On the button the 3-bet is 3.5 times: 10.5bb. Add 3bb for the caller.',
            play: 'Squeeze to 13.5bb',
            expect: { by: 'squeeze', play: '3bet' },
          },
          {
            label: 'Two callers',
            spot: { players: 6, hero: { seat: 'BB', hand: 'AQs' }, action: [raise('CO'), ['BTN', 'call'], ['SB', 'call']] },
            text: 'Each caller adds 3bb: 9bb plus 6bb.',
            play: 'Squeeze to 15bb',
            expect: { by: 'squeeze', play: '3bet' },
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'JJ' }, action: [raise('UTG'), ['MP', 'call']] },
        head: 'The raiser still decides',
        text: 'Pick the squeezing range by who raised, exactly as for a 3-bet. Against UTG that is kings or better and ace-king suited. Jacks are not in it, but they are too good to fold.',
        play: 'Call 3bb',
        expect: { by: 'squeeze', play: 'call' },
        whatIf: [
          {
            label: 'The cutoff raised',
            spot: { players: 6, hero: { seat: 'BB', hand: 'JJ' }, action: [raise('CO'), ['BTN', 'call']] },
            text: 'Against a late raiser, jacks are a value hand. Out of position: 9bb plus 3bb.',
            play: 'Squeeze to 12bb',
            expect: { by: 'squeeze', play: '3bet' },
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BB', hand: '76s' }, reads: { BTN: 'lag', SB: 'passive' }, action: [raise('BTN'), ['SB', 'call']] },
        head: 'Calling along',
        text: 'Seven-six suited is no value hand. But it costs 2bb more to see a flop, nobody can raise behind you, and the hand can make a straight or a flush against two players who make mistakes.',
        play: 'Call 2bb',
        expect: { by: 'squeeze', play: 'call' },
        rows: [['Over-call with', 'Pairs TT to 55, small suited aces, suited connectors, suited Broadway']],
        callout: { kind: 'watch', text: 'No offsuit hands. King-queen, ace-jack and ace-ten offsuit squeeze for value or fold.' },
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: '98s' }, reads: { BB: 'aggro3b' }, action: [raise('UTG'), ['MP', 'call']] },
        head: 'Look behind you',
        text: 'Nine-eight suited is an over-calling hand. But the big blind re-raises often, and a raise with two callers is their favourite target.',
        play: 'Fold',
        expect: { by: 'squeeze', play: 'fold' },
        whatIf: [
          {
            label: 'Passive blinds',
            spot: { players: 6, hero: { seat: 'BTN', hand: '98s' }, reads: { SB: 'passive', BB: 'passive' }, action: [raise('UTG'), ['MP', 'call']] },
            text: 'Nobody will re-raise, and more callers mean a bigger pot when you hit.',
            play: 'Call 3bb',
            expect: { by: 'squeeze', play: 'call' },
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'KQo' }, action: [raise('MP'), ['CO', 'call']] },
        head: 'Your turn',
        ask: {
          q: 'King-queen offsuit on the button.',
          options: [{ id: 'fold', label: 'Fold' }, { id: 'call', label: 'Call 3bb' }, { id: '3bet', label: 'Squeeze' }],
          correct: 'fold',
          why: 'It is not a value hand against an MP raise, and offsuit hands never over-call. That leaves folding.',
        },
        expect: { by: 'squeeze', play: 'fold' },
      },
    ],
  },

  // ------------------------------------------------ Stealing and blind defence
  {
    id: 'bl-steal',
    chapter: 'blinds',
    title: 'Stealing the blinds',
    blurb: 'Raising from late position to win the blinds without a fight.',
    practice: { route: 'bl-steal', label: 'Practise: steal the blinds' },
    steps: [
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'K7s' } },
        head: 'Folded to you on the button',
        text: 'Only the two blinds are left. A raise from here can win their 1.5bb without seeing a flop.',
        callout: { kind: 'term', title: 'Steal', text: 'Raising first from the cutoff, button or small blind, hoping the blinds fold.' },
      },
      {
        head: 'What you risk, what you win',
        text: 'You put in 3bb to win 1.5bb. How often must the blinds fold for that to break even?',
        callout: { kind: 'rule', title: 'Break-even', text: 'Risk ÷ (risk + reward). Here 3 ÷ (3 + 1.5) = 67%.' },
      },
      {
        head: 'Risk less',
        text: 'A smaller raise wins the same blinds and has to work less often.',
        rows: [['3bb steal', 'Must work 66.7% of the time'], ['2.5bb steal', '62.5%'], ['2bb steal', '57.1%']],
        callout: { kind: 'tip', text: 'A steal has to work about two times in three.' },
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'K7s' }, reads: { SB: 'nit', BB: 'nit' }, notes: { SB: 'Folds to 80% of steals', BB: 'Folds to 80% of steals' } },
        head: 'Two players have to fold',
        text: [
          'Each blind folds 80% of the time. For both to fold, multiply: 0.8 × 0.8 = 64%.',
          'A 2.5bb steal needs 62.5%. This one makes money on the folds alone.',
        ],
        play: 'Raise to 2bb or 2.5bb',
        expect: { by: 'steal', play: 'open' },
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'T8o' }, reads: { SB: 'nit', BB: 'nit' }, notes: { SB: 'Folds to 80% of steals', BB: 'Folds to 80% of steals' } },
        head: 'Against tight blinds, steal wider',
        text: 'Ten-eight offsuit is not in your usual button range. Against blinds that fold this often, it does not have to be a good hand. It only has to make them fold.',
        play: 'Raise to 2bb or 2.5bb',
        expect: { by: 'steal', play: 'open' },
        whatIf: [
          {
            label: 'A calling station in the big blind',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'T8o' }, reads: { SB: 'nit', BB: 'station' } },
            text: 'The big blind will not fold two times in three. Drop the hands at the bottom of your range.',
            play: 'Fold',
            expect: { by: 'steal', play: 'fold' },
          },
          {
            label: 'You know nothing about them',
            spot: { players: 6, hero: { seat: 'BTN', hand: 'T8o' } },
            text: 'With no read, keep to your default range.',
            play: 'Fold',
            expect: { by: 'steal', play: 'fold' },
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'BTN', hand: 'AJs' }, reads: { SB: 'tag', BB: 'rec' }, notes: { SB: 'Defends the blind well' } },
        head: 'Some hands want a call',
        text: 'Not every button raise is a steal. About the top 10% of hands, the ones you would open under the gun, are glad to be called. Raise them whoever is in the blinds.',
        rows: [['Wants a call', '77+, A9s+, KTs+, QTs+, AJo+, KQo'], ['The rest of your range', 'Hopes they fold']],
        play: 'Raise to 3bb',
        expect: { by: 'steal', play: 'open' },
      },
      {
        head: 'And when they call anyway',
        text: 'You act last on every later round. The blinds, playing out of position, make more mistakes than you do.',
      },
      {
        spot: { players: 6, hero: { seat: 'CO', hand: '65s' } },
        head: 'Your turn',
        ask: {
          q: 'Six-five suited, folded to you in the cutoff. You know nothing about the blinds.',
          options: [{ id: 'fold', label: 'Fold' }, { id: 'open', label: 'Raise' }],
          correct: 'fold',
          why: 'Six-five suited is only in the wider range. Open it once you know the blinds fold a lot.',
        },
        expect: { by: 'steal', play: 'fold' },
      },
    ],
  },
  {
    id: 'bl-defend',
    chapter: 'blinds',
    title: 'Defending your blind',
    blurb: 'Someone raises from late position and you have a blind in the pot.',
    practice: { route: 'bl-defend', label: 'Practise: defend your blind' },
    steps: [
      {
        spot: { players: 6, hero: { seat: 'BB', hand: '22' }, action: [raise('BTN')] },
        head: 'The button raises, you are in the big blind',
        text: 'The small blind folds. You hold pocket twos and already have 1bb in the pot.',
        callout: { kind: 'rule', title: 'The goal', text: 'Everyone loses money in the blinds over time. Aim to lose as little as you can.' },
      },
      {
        head: 'The price',
        text: [
          'Calling costs 2bb more, for a pot that will hold 6.5bb.',
          '2 ÷ 6.5 = 31%. If you win more than 31% of the time, the call pays.',
        ],
        callout: { kind: 'term', title: 'Pot odds', text: 'The call, divided by the pot after you call. It is how often you need to win.' },
      },
      {
        head: 'Why not call with everything',
        text: 'At that price almost any two cards qualify. But you act first on every later round, and a hand played out of position wins less than its share.',
        callout: { kind: 'why', text: 'So you defend a range that is ahead of the raiser, not every hand that gets the price.' },
      },
      {
        head: 'The big blind calls wide',
        text: 'Nobody can raise behind you, and you get the best price at the table. Small pairs, suited aces and suited connectors all call.',
        play: 'Call 2bb',
        expect: { by: 'defend', play: 'call' },
        whatIf: [
          {
            label: 'You are in the small blind',
            spot: { players: 6, hero: { seat: 'SB', hand: '22' }, action: [raise('BTN')] },
            text: 'The big blind is still to act. They can re-raise, or call and leave you first to act against two players. From here, call only medium pairs and Broadway hands.',
            play: 'Fold',
            expect: { by: 'defend', play: 'fold' },
          },
        ],
      },
      {
        spot: { players: 6, hero: { seat: 'SB', hand: 'AQo' }, action: [raise('CO')] },
        head: 'Re-raise your best hands',
        text: 'From either blind, 3-bet jacks or better, ace-jack suited or better, and ace-queen or better. You are out of position, so make it 3 times their raise.',
        play: '3-bet to 9bb',
        expect: { by: 'defend', play: '3bet' },
      },
      {
        head: 'The two ranges',
        text: 'The same value hands from both blinds. The calls are what differ.',
        rows: [
          ['3-bet from either blind', 'JJ+, AJs+, AQo+'],
          ['Small blind calls', 'TT to 77, and Broadway hands'],
          ['Big blind calls', 'Those, plus small pairs, suited aces, suited connectors'],
        ],
        callout: { kind: 'term', title: 'Broadway', text: 'Any card ten or higher. A Broadway hand is two of them.' },
      },
      {
        spot: { players: 6, hero: { seat: 'SB', hand: 'KTo' }, action: [raise('BTN')] },
        head: 'Your turn',
        ask: {
          q: 'King-ten offsuit in the small blind.',
          options: [{ id: 'fold', label: 'Fold' }, { id: 'call', label: 'Call 2.5bb' }, { id: '3bet', label: '3-bet' }],
          correct: 'call',
          why: 'King-ten is a Broadway hand: two cards ten or higher. It is in the small blind\'s calling range.',
        },
        expect: { by: 'defend', play: 'call' },
      },
    ],
  },
];

export const lessonsFor = (chapter) => LESSONS.filter((l) => l.chapter === chapter);
