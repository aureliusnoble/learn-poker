// Progress storage. Everything lives in one small JSON object, saved in this
// browser. When the page runs somewhere that offers a per-person document store
// (window.claude), the same object is also synced there so progress survives a
// cleared browser and follows you between devices.
//
// Shape: { v, updatedAt, days: { 'YYYY-MM-DD': {n, c} }, <topic>: { <bucket>: { <key>: item } } }
// A practice item is { n: answers, c: correct, b: correct-in-a-row (capped), t: last seen }.

const KEY = 'learn-poker:v1';
const MAX_BOX = 3;
const TOPICS = {
  open: ['hands', 'edges', 'paint', 'facts', 'time'],
  threebet: ['hands', 'spots', 'facts', 'time'],
  coldcall: ['hands', 'spots', 'sets', 'facts', 'time'],
  table: ['seats', 'sizes', 'time'],
};

function blank() {
  const s = { v: 1, updatedAt: 0, days: {} };
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
  if (topic) state[topic] = blank()[topic];
  else state = blank();
  commit();
}

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
