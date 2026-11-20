// Is the score improving? Pure calculations over an exercise's history (see
// store.js for its shape), and the two charts drawn from them. No DOM here, so
// it runs under Node; the charts are SVG markup styled by classes in app.css.

const DAY = 86400000;
const FEW = 5; // a day with fewer answers than this says little, and is drawn hollow
export const WINDOW = 25; // answers in "now", and in "before"
const NEED = 10; // answers a window needs before it is compared

const parseDay = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, m - 1, d);
};
const average = (digits) => [...digits].reduce((sum, ch) => sum + Number(ch), 0) / 9 / digits.length;
export const asPct = (x) => `${Math.round(x * 100)}%`;

/**
 * The days an exercise was practised, placed on a calendar that ends today.
 * span: days shown (at least a week). points: { key, x: day index, n, pct }.
 */
export function series(entry, today = new Date(), max = 60) {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const ago = (at) => Math.round((end - at) / DAY);
  const days = Object.entries((entry && entry.d) || {})
    .map(([key, v]) => ({ key, at: parseDay(key), n: Number(v && v[0]) || 0, c: Number(v && v[1]) || 0 }))
    .filter((p) => p.n > 0 && !Number.isNaN(p.at.getTime()) && ago(p.at) >= 0 && ago(p.at) < max)
    .sort((a, b) => a.at - b.at);
  const span = Math.max(7, days.length ? ago(days[0].at) + 1 : 7);
  return {
    span,
    total: days.reduce((sum, p) => sum + p.n, 0),
    points: days.map((p) => ({ key: p.key, x: span - 1 - ago(p.at), n: p.n, right: p.c, pct: Math.min(1, p.c / p.n) })),
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

const shortDay = (at) => at.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const fix = (n) => Number(n.toFixed(1));

/** A small line for a list row: the shape of the score, with the latest day marked. */
export function sparkSvg({ span, points }) {
  const W = 88;
  const H = 30;
  if (!points.length) return '';
  const x = (p) => fix(4 + (p.x / (span - 1)) * (W - 8));
  const y = (p) => fix(H - 4 - p.pct * (H - 8));
  const last = points[points.length - 1];
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p)} ${y(p)}`).join(' ');
  const area = points.length > 1
    ? `<path class="sp-area" d="${line} L${x(last)} ${H - 2} L${x(points[0])} ${H - 2} Z"/>` : '';
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">`
    + `<line class="sp-base" x1="2" y1="${H - 2}" x2="${W - 2}" y2="${H - 2}"/>${area}`
    + (points.length > 1 ? `<path class="sp-line" d="${line}"/>` : '')
    + `<circle class="sp-dot" cx="${x(last)}" cy="${y(last)}" r="3.5"/></svg>`;
}

/**
 * The full chart: share right on each day practised, 0 to 100%, on a calendar
 * that ends today. `selected` is the index of the point to ring. Each point has
 * a larger invisible target carrying data-i, for taps.
 */
export function chartSvg({ span, points }, selected = points.length - 1, today = new Date()) {
  const W = 340;
  const H = 168;
  const L = 36;
  const R = W - 10;
  const T = 12;
  const B = H - 30;
  const x = (p) => fix(L + (p.x / (span - 1)) * (R - L));
  const y = (pct) => fix(B - pct * (B - T));
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (span - 1));

  const grid = [0, 0.5, 1].map((g) =>
    `<line class="tc-grid${g === 0 ? ' tc-grid--base' : ''}" x1="${L}" y1="${y(g)}" x2="${R}" y2="${y(g)}"/>`
    + `<text class="tc-label" x="${L - 7}" y="${y(g) + 4}" text-anchor="end">${asPct(g)}</text>`).join('');
  const line = points.length > 1
    ? `<path class="tc-line" d="${points.map((p, i) => `${i ? 'L' : 'M'}${x(p)} ${y(p.pct)}`).join(' ')}"/>` : '';
  const marks = points.map((p, i) =>
    (i === selected ? `<circle class="tc-ring" cx="${x(p)}" cy="${y(p.pct)}" r="9"/>` : '')
    + `<circle class="tc-dot${p.n < FEW ? ' tc-dot--few' : ''}" cx="${x(p)}" cy="${y(p.pct)}" r="4.5"/>`).join('');
  const targets = points.map((p, i) =>
    `<circle class="tc-hit" data-i="${i}" cx="${x(p)}" cy="${y(p.pct)}" r="15">`
    + `<title>${dayLabel(p.key, today)}: ${asPct(p.pct)} of ${p.n}</title></circle>`).join('');

  return `<svg class="tchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Share of answers right on each day practised">`
    + grid + line + marks + targets
    + `<text class="tc-label" x="${L}" y="${H - 8}">${shortDay(start)}</text>`
    + `<text class="tc-label" x="${R}" y="${H - 8}" text-anchor="end">Today</text></svg>`;
}

export { FEW };
