// Is the score improving? Pure calculations over an exercise's history (see
// store.js for its shape), and the two charts drawn from them. No DOM here, so
// it runs under Node; the charts are SVG markup styled by classes in app.css.

const DAY = 86400000;
const FEW = 5; // a point with fewer answers than this says little, and is drawn hollow
const POOL = 8; // a round shorter than this is joined to the next one that day
export const WINDOW = 25; // answers in "now", and in "before"
const NEED = 10; // answers a window needs before it is compared

const parseDay = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, m - 1, d);
};
const average = (digits) => [...digits].reduce((sum, ch) => sum + Number(ch), 0) / 9 / digits.length;
export const asPct = (x) => `${Math.round(x * 100)}%`;

const dayKeyOf = (at) => `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;

/**
 * One point per round played, oldest first, so several rounds in a day stay
 * separate. A round with fewer than POOL answers is joined to the next one of
 * the same day: a handful of answers says little by itself.
 * points: { at, key: its day, n, pct, parts: rounds joined, wholeDay }
 */
export function rounds(entry, max = 30) {
  const played = ((entry && entry.s) || [])
    .filter((row) => Array.isArray(row) && row[1] > 0 && Number.isFinite(row[0]))
    .map(([t, n, c]) => ({ at: new Date(t * 1000), n, c: Number(c) || 0, parts: 1, wholeDay: false }));
  const perDay = {};
  for (const p of played) {
    const cell = perDay[dayKeyOf(p.at)] || (perDay[dayKeyOf(p.at)] = [0, 0]);
    cell[0] += p.n;
    cell[1] += p.c;
  }
  // Answers counted for a day but not for any round come from before rounds
  // were kept. They become one point at the start of that day.
  const earlier = [];
  for (const [key, v] of Object.entries((entry && entry.d) || {})) {
    const at = parseDay(key);
    const n = (Number(v && v[0]) || 0) - (perDay[key] ? perDay[key][0] : 0);
    const c = (Number(v && v[1]) || 0) - (perDay[key] ? perDay[key][1] : 0);
    if (n >= 1 && !Number.isNaN(at.getTime())) earlier.push({ at, n, c: Math.max(0, c), parts: 1, wholeDay: true });
  }
  const all = [...earlier, ...played].sort((x, y) => x.at - y.at);
  const pooled = [];
  for (const p of all) {
    const last = pooled[pooled.length - 1];
    if (last && last.n < POOL && dayKeyOf(last.at) === dayKeyOf(p.at)) {
      last.n += p.n;
      last.c += p.c;
      last.parts += 1;
      last.at = p.at;
      last.wholeDay = last.wholeDay && p.wholeDay;
    } else {
      pooled.push({ ...p });
    }
  }
  return {
    total: all.reduce((sum, p) => sum + p.n, 0),
    points: pooled.slice(-max).map((p) => ({
      at: p.at, key: dayKeyOf(p.at), n: p.n, pct: Math.min(1, p.c / p.n), parts: p.parts, wholeDay: p.wholeDay,
    })),
  };
}

/**
 * The last 25 answers against the 25 before them. Counting answers, not days,
 * keeps the comparison fair however often the exercise is played.
 */
export function momentum(entry, size = WINDOW) {
  const r = String((entry && entry.r) || '');
  const now = r.slice(-size);
  const before = r.slice(-2 * size, -size);
  const a = now.length >= NEED ? average(now) : null;
  const b = before.length >= NEED ? average(before) : null;
  return { now: a, before: b, nNow: now.length, nBefore: before.length, delta: a != null && b != null ? a - b : null };
}

/** A change in words: within three points either way counts as level. */
export function trendWord(delta) {
  if (delta == null) return null;
  const points = Math.round(Math.abs(delta) * 100);
  if (points < 3) return { dir: 'level', short: 'Level', text: 'Level with before' };
  const unit = points === 1 ? 'point' : 'points';
  return delta > 0
    ? { dir: 'up', short: String(points), text: `Up ${points} ${unit}` }
    : { dir: 'down', short: String(points), text: `Down ${points} ${unit}` };
}

/** One line for the end of a round: this round against the answers that came before it. */
export function roundNote(entry, answered, right) {
  const r = String((entry && entry.r) || '');
  const before = r.slice(0, Math.max(0, r.length - answered)).slice(-50);
  if (!answered || before.length < NEED) return null;
  const was = average(before);
  const now = right / answered;
  const diff = Math.round((now - was) * 100);
  const how = Math.abs(diff) < 3 ? 'about the same as'
    : diff > 0 ? `${diff} ${diff === 1 ? 'point' : 'points'} better than`
    : `${-diff} ${diff === -1 ? 'point' : 'points'} below`;
  return `${asPct(now)} this round: ${how} your ${before.length} answers before it (${asPct(was)}).`;
}

export function dayLabel(key, today = new Date()) {
  const at = parseDay(key);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const ago = Math.round((end - at) / DAY);
  if (ago === 0) return 'Today';
  if (ago === 1) return 'Yesterday';
  return at.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** When a point was played: 'Today 14:05', 'Yesterday 09:30', 'Fri 20 Nov 18:00'. */
export function whenLabel(p, today = new Date()) {
  const day = dayLabel(p.key, today);
  if (p.wholeDay) return day;
  return `${day} ${p.at.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

const fix = (n) => Number(n.toFixed(1));
const along = (i, count, from, to) => fix(count > 1 ? from + (i / (count - 1)) * (to - from) : (from + to) / 2);

/** A small line for a list row: the shape of the score, round by round, with the latest marked. */
export function sparkSvg({ points }) {
  const W = 88;
  const H = 30;
  if (!points.length) return '';
  const x = (i) => along(i, points.length, 4, W - 4);
  const y = (p) => fix(H - 4 - p.pct * (H - 8));
  const end = points.length - 1;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p)}`).join(' ');
  const area = points.length > 1 ? `<path class="sp-area" d="${line} L${x(end)} ${H - 2} L${x(0)} ${H - 2} Z"/>` : '';
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">`
    + `<line class="sp-base" x1="2" y1="${H - 2}" x2="${W - 2}" y2="${H - 2}"/>${area}`
    + (points.length > 1 ? `<path class="sp-line" d="${line}"/>` : '')
    + `<circle class="sp-dot" cx="${x(end)}" cy="${y(points[end])}" r="3.5"/></svg>`;
}

/**
 * The full chart: share right in each round, 0 to 100%, oldest on the left.
 * Rounds are evenly spaced, with a tick on the baseline where the day changes.
 * `selected` is the index of the point to ring. Each point has a larger
 * invisible target carrying data-i, for taps.
 */
export function chartSvg({ points }, selected = points.length - 1, today = new Date()) {
  const W = 340;
  const H = 168;
  const L = 36;
  const R = W - 12;
  const T = 12;
  const B = H - 30;
  const x = (i) => along(i, points.length, L + 6, R - 6);
  const y = (pct) => fix(B - pct * (B - T));

  const grid = [0, 0.5, 1].map((g) =>
    `<line class="tc-grid${g === 0 ? ' tc-grid--base' : ''}" x1="${L}" y1="${y(g)}" x2="${R}" y2="${y(g)}"/>`
    + `<text class="tc-label" x="${L - 7}" y="${y(g) + 4}" text-anchor="end">${asPct(g)}</text>`).join('');
  const ticks = points.map((p, i) => (i && p.key !== points[i - 1].key
    ? `<line class="tc-tick" x1="${fix((x(i) + x(i - 1)) / 2)}" y1="${B}" x2="${fix((x(i) + x(i - 1)) / 2)}" y2="${B + 6}"/>` : '')).join('');
  const line = points.length > 1
    ? `<path class="tc-line" d="${points.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.pct)}`).join(' ')}"/>` : '';
  const marks = points.map((p, i) =>
    (i === selected ? `<circle class="tc-ring" cx="${x(i)}" cy="${y(p.pct)}" r="9"/>` : '')
    + `<circle class="tc-dot${p.n < FEW ? ' tc-dot--few' : ''}" cx="${x(i)}" cy="${y(p.pct)}" r="4.5"/>`).join('');
  const targets = points.map((p, i) =>
    `<circle class="tc-hit" data-i="${i}" cx="${x(i)}" cy="${y(p.pct)}" r="15">`
    + `<title>${whenLabel(p, today)}: ${asPct(p.pct)} of ${p.n}</title></circle>`).join('');
  const first = points[0];
  const last = points[points.length - 1];
  const edge = (p) => (p ? dayLabel(p.key, today).replace(/^\w+,? (?=\d)|^(\w{3}),? /, '') : '');
  const labels = !first ? ''
    : first.key === last.key ? `<text class="tc-label" x="${fix((L + R) / 2)}" y="${H - 8}" text-anchor="middle">${edge(first)}</text>`
    : `<text class="tc-label" x="${L}" y="${H - 8}">${edge(first)}</text>`
      + `<text class="tc-label" x="${R}" y="${H - 8}" text-anchor="end">${edge(last)}</text>`;

  return `<svg class="tchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Share of answers right in each round, oldest first">`
    + grid + ticks + line + marks + targets + labels + '</svg>';
}

export { FEW, POOL };
