// Bet sizes as a second question: once the right raise is chosen, how big?
import { THREE_BET_SIZE, FOUR_BET } from './data/threebet.js';
import { readSpot, bb } from './table.js';

const where = (inPosition) => (inPosition ? 'In position' : 'Out of position');

/** The size question for a spot where the hero 3-bets an open-raise. */
export function threeBetSize(spot) {
  const info = readSpot(spot);
  const open = info.high;
  const ip = info.inPosition;
  const mult = ip ? THREE_BET_SIZE.inPosition : THREE_BET_SIZE.outOfPosition;
  return {
    when: '3bet',
    key: `3bet:${ip ? 'ip' : 'oop'}`,
    question: 'How big is your 3-bet?',
    options: [2.5, 3, 3.5, 4.5].map((m) => ({ id: String(m), label: bb(open * m) })),
    correct: String(mult),
    why: `${where(ip)}, 3-bet to ${mult} times their raise: ${mult} × ${bb(open)} = ${bb(open * mult)}.`,
  };
}

/** The size question for a spot where the hero 4-bets a 3-bet. */
export function fourBetSize(spot) {
  const info = readSpot(spot);
  const x = info.high;
  const ip = info.inPosition;
  const [a, b] = ip ? FOUR_BET.sizeInPosition : FOUR_BET.sizeOutOfPosition;
  const span = ([lo, hi]) => `${bb(x * lo)} to ${bb(x * hi)}`;
  return {
    when: '4bet',
    key: `4bet:${ip ? 'ip' : 'oop'}`,
    question: 'How big is your 4-bet?',
    options: [
      { id: 'small', label: bb(x * 1.5) },
      { id: 'ip', label: span(FOUR_BET.sizeInPosition) },
      { id: 'oop', label: span(FOUR_BET.sizeOutOfPosition) },
      { id: 'big', label: bb(x * 3.5) },
    ],
    correct: ip ? 'ip' : 'oop',
    why: `${where(ip)}, 4-bet to ${a} to ${b} times their 3-bet: ${span([a, b])}.`,
  };
}
