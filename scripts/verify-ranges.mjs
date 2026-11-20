// Prints each seat's range as combos, a percentage and a 13x13 chart,
// for checking js/data/preflop-ranges.js against the paper notes.
//   node scripts/verify-ranges.mjs
import { POSITIONS, NOTE_ROWS, rowLabel, handAt } from '../js/ranges.js';

for (const pos of POSITIONS) {
  const same = pos.sameAs ? ` (same as ${pos.sameAs})` : '';
  console.log(`\n${pos.id}${same}: ${pos.hands.size} hands, ${pos.combos} combos = ${pos.pct.toFixed(2)}%`);
  for (let r = 0; r < 13; r++) {
    let line = '';
    for (let c = 0; c < 13; c++) line += (pos.hands.has(handAt(r, c)) ? handAt(r, c) : '.').padEnd(4);
    console.log(line);
  }
}

console.log('\nCut-offs');
console.log('row'.padEnd(16) + POSITIONS.map((p) => p.id.padEnd(8)).join(''));
for (const key of NOTE_ROWS) {
  console.log(rowLabel(key).padEnd(16) + POSITIONS.map((p) => (p.rows[key].label || '-').padEnd(8)).join(''));
}
