// Expands the shorthand in data/preflop-ranges.json into individual hands,
// counts combos, and prints a 13x13 grid per position for checking against the charts.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RANKS = 'AKQJT98765432';
const path = fileURLToPath(new URL('../data/preflop-ranges.json', import.meta.url));
const data = JSON.parse(readFileSync(path, 'utf8'));

export function expand(token) {
  const plus = token.endsWith('+');
  const t = plus ? token.slice(0, -1) : token;
  const hi = RANKS.indexOf(t[0]);
  const lo = RANKS.indexOf(t[1]);
  if (hi < 0 || lo < 0) throw new Error(`Bad token: ${token}`);
  if (hi === lo) {
    if (t.length !== 2) throw new Error(`Bad pair token: ${token}`);
    const out = [];
    for (let i = plus ? 0 : hi; i <= hi; i++) out.push(RANKS[i] + RANKS[i]);
    return out;
  }
  const kind = t[2];
  if (hi > lo || !'so'.includes(kind) || t.length !== 3) throw new Error(`Bad token: ${token}`);
  const out = [];
  for (let k = plus ? hi + 1 : lo; k <= lo; k++) out.push(RANKS[hi] + RANKS[k] + kind);
  return out;
}

const combos = (h) => (h.length === 2 ? 6 : h[2] === 's' ? 4 : 12);
const byId = Object.fromEntries(data.positions.map((p) => [p.id, p]));

for (const pos of data.positions) {
  const src = pos.sameAs ? byId[pos.sameAs] : pos;
  const tokens = [...src.pairs, ...src.suited, ...src.offsuit];
  const hands = new Set(tokens.flatMap(expand));
  const n = [...hands].reduce((a, h) => a + combos(h), 0);
  const pct = ((n / 1326) * 100).toFixed(2);
  const noted = src.percentInNotes == null ? 'none written' : `${src.percentInNotes}%`;
  console.log(`\n${pos.id}${pos.sameAs ? ` (same as ${pos.sameAs})` : ''}: ${hands.size} hands, ${n} combos = ${pct}%  (notes: ${noted})`);
  for (let r = 0; r < 13; r++) {
    let line = '';
    for (let c = 0; c < 13; c++) {
      const h = r === c ? RANKS[r] + RANKS[c] : r < c ? RANKS[r] + RANKS[c] + 's' : RANKS[c] + RANKS[r] + 'o';
      line += (hands.has(h) ? h : '.').padEnd(4);
    }
    console.log(line);
  }
}
