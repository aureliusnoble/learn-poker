// Progress storage. Everything lives in one small JSON object, saved in this
// browser. When the page runs somewhere that offers a per-person document store
// (window.claude), the same object is also synced there so progress survives a
// cleared browser and follows you between devices.
//
// Shape: { v, updatedAt, days: { 'YYYY-MM-DD': {n, c} }, <topic>: { <bucket>: { <key>: item } } }
// A practice item is { n: answers, c: correct, b: correct-in-a-row (capped), t: last seen }.
//
// `log` is the history that shows whether scores are improving. One entry per
// exercise ('sim/steal', 'open/drill' ...), plus 'all' for everything:
//   { d: { 'YYYY-MM-DD': [answers, score] }, r: 'recent results, oldest first' }
// `r` holds one digit per answer, 9 for right and 0 for wrong, so a part-right
// result (a painted chart) can sit in between.

const KEY = 'learn-poker:v1';
const MAX_BOX = 3;
const RECENT_MAX = 200; // answers kept in each exercise's recent run
const LOG_DAYS = 150; // days kept in each exercise's history
const TOPICS = {
  open: ['hands', 'edges', 'paint', 'facts', 'time'],
  threebet: ['hands', 'spots', 'facts', 'time'],
  coldcall: ['hands', 'spots', 'sets', 'facts', 'time'],
  table: ['seats', 'sizes', 'time'],
  limp: ['hands', 'spots', 'facts', 'time'],
  squeeze: ['hands', 'spots', 'facts', 'time'],
  blinds: ['steal', 'defend', 'sums', 'spots', 'facts', 'time'],
  sim: ['situations', 'seats', 'leaks', 'time'],
};

function blank() {
  const s = { v: 1, updatedAt: 0, days: {}, log: {} };
  for (const [topic, buckets] of Object.entries(TOPICS)) {
    s[topic] = Object.fromEntries(buckets.map((b) => [b, {}]));
  }
  return s;
}

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);

function normalise(raw) {
  const base = blank();
  if (!isObj(raw) || raw.v !== 1) return base;
  if (isObj(raw.days)) base.days = raw.days;
  if (isObj(raw.log)) base.log = raw.log;
  // Progress saved before the history existed still has its daily totals: start the overall line from those.
  if (!base.log.all && Object.keys(base.days).length) {
    base.log.all = { d: Object.fromEntries(Object.entries(base.days).map(([day, v]) => [day, [v.n || 0, v.c || 0]])), r: '' };
  }
  for (const [topic, buckets] of Object.entries(TOPICS)) {
    for (const b of buckets) if (isObj(raw[topic]) && isObj(raw[topic][b])) base[topic][b] = raw[topic][b];
  }
  base.updatedAt = Number(raw.updatedAt) || 0;
  return base;
}

let localOk = true;
function readLocal() {
  try {
    return normalise(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    localOk = false;
    return blank();
  }
}
function writeLocal() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    localOk = true;
  } catch {
    localOk = false;
  }
}

let state = readLocal();

// ---- Optional account sync

let cloudDoc = null;
let pushing = false;
let dirty = false;
let pushTimer = null;

function schedulePush(delay = 2500) {
  if (!cloudDoc) return;
  dirty = true;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, delay);
}

async function push() {
  clearTimeout(pushTimer);
  if (!cloudDoc || pushing || !dirty) return;
  pushing = true;
  dirty = false;
  try {
    await cloudDoc.set(JSON.parse(JSON.stringify(state)));
  } catch (err) {
    // A transient failure is retried after the next answer; anything else means
    // this view cannot write, so stop trying and rely on the browser copy.
    if (err && err.code === 'unavailable') dirty = true;
    else cloudDoc = null;
  }
  pushing = false;
  if (dirty && cloudDoc) schedulePush();
}

/**
 * Looks for an account-backed store and, if it holds newer progress than this
 * browser, adopts it. Resolves true when the in-memory progress was replaced.
 */
export async function connectSync() {
  try {
    const claude = typeof window !== 'undefined' ? window.claude : null;
    if (!claude || typeof claude.use !== 'function') return false;
    const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
    if (!db || !user) return false;
    const uid = await user.id();
    if (!uid) return false;
    const doc = db.doc(`data/users/${uid}/progress`);
    const snap = await doc.get();
    cloudDoc = doc;
    const remote = snap.exists ? snap.data() : null;
    if (remote && remote.v === 1 && (Number(remote.updatedAt) || 0) > state.updatedAt) {
      state = normalise(JSON.parse(JSON.stringify(remote)));
      writeLocal();
      return true;
    }
    if (state.updatedAt) schedulePush(0);
    return false;
  } catch {
    cloudDoc = null;
    return false;
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') push();
  });
}

/** Where progress is kept right now: 'account' | 'browser' | 'none' */
export function storageMode() {
  return cloudDoc ? 'account' : localOk ? 'browser' : 'none';
}

let batching = 0;
function commit() {
  if (batching) return;
  state.updatedAt = Date.now();
  writeLocal();
  schedulePush();
}

/** Groups many records into one save. */
export function batch(fn) {
  batching += 1;
  try {
    fn();
  } finally {
    batching -= 1;
    commit();
  }
}

// ---- Recording

const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * One answer to one practice item. `countsToday: false` is for marks that come
 * out of checking a painted chart rather than from a question.
 */
export function record(topic, bucket, key, ok, { countsToday = true } = {}) {
  const map = state[topic][bucket];
  const it = map[key] || (map[key] = { n: 0, c: 0, b: 0 });
  it.n += 1;
  if (ok) {
    it.c += 1;
    it.b = Math.min(it.b + 1, MAX_BOX);
  } else {
    it.b = 0;
  }
  it.t = Date.now();
  if (countsToday) {
    const day = state.days[dayKey()] || (state.days[dayKey()] = { n: 0, c: 0 });
    day.n += 1;
    if (ok) day.c += 1;
  }
  commit();
}

/** Thinking time for one timed decision, grouped under `key` (a seat, a range). */
export function recordTime(topic, key, ms) {
  const map = state[topic].time;
  const it = map[key] || (map[key] = { ms: 0, n: 0 });
  it.ms += Math.min(ms, 30000);
  it.n += 1;
  commit();
}

/** `score` runs from 0 to 1: the share of the target found, less anything extra. */
export function recordPaint(topic, key, score) {
  const map = state[topic].paint;
  const it = map[key] || (map[key] = { n: 0, best: 0, last: 0 });
  it.n += 1;
  it.last = score;
  it.best = Math.max(it.best, score);
  it.t = Date.now();
  commit();
}

export function resetProgress(topic) {
  if (topic) {
    state[topic] = blank()[topic];
    // The topic's exercises lose their history with it. The overall line is kept.
    for (const id of Object.keys(state.log)) if (id.startsWith(`${topic}/`)) delete state.log[id];
  } else {
    state = blank();
  }
  commit();
}

// ---- History

function logTo(id, day, score) {
  const entry = isObj(state.log[id]) ? state.log[id] : (state.log[id] = { d: {}, r: '' });
  if (!isObj(entry.d)) entry.d = {};
  const cell = Array.isArray(entry.d[day]) ? entry.d[day] : (entry.d[day] = [0, 0]);
  cell[0] += 1;
  cell[1] = Math.round((cell[1] + score) * 1000) / 1000;
  entry.r = (String(entry.r || '') + Math.round(score * 9)).slice(-RECENT_MAX);
  const days = Object.keys(entry.d);
  if (days.length > LOG_DAYS) for (const old of days.sort().slice(0, days.length - LOG_DAYS)) delete entry.d[old];
}

/**
 * Adds one result to an exercise's history, and to the overall line.
 * `score` runs from 0 (wrong) to 1 (right).
 */
export function logAnswer(ids, score) {
  const value = Math.max(0, Math.min(1, Number(score) || 0));
  const day = dayKey();
  for (const id of [].concat(ids)) logTo(id, day, value);
  logTo('all', day, value);
  commit();
}

export const logOf = (id) => state.log[id] || null;
export const logIds = () => Object.keys(state.log);

// ---- Reading

export const stat = (topic, bucket, key) => state[topic][bucket][key] || null;
export const bucketOf = (topic, bucket) => state[topic][bucket];

export function today() {
  return state.days[dayKey()] || { n: 0, c: 0 };
}

/** Consecutive days with practice, counting today or, failing that, up to yesterday. */
export function dayStreak() {
  const d = new Date();
  if (!state.days[dayKey(d)]) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (state.days[dayKey(d)]) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
