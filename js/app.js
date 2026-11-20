// Entry point: maps the hash to a page and keeps progress in sync.
import { connectSync } from './store.js';
import { takeParams } from './nav.js';
import { home } from './home.js';
import { learnOpen } from './preflop/learn.js';
import { openDrill } from './preflop/open.js';
import { edgesDrill } from './preflop/edges.js';
import { paintDrill } from './preflop/paint.js';
import { progressOpen } from './preflop/progress.js';
import { learnThreeBet, chartDrill, spotsDrill, progressThreeBet } from './threebet/pages.js';
import { learnCall, callDrill, callSpots, setTool, setDrill, progressCall } from './coldcall/pages.js';
import { simulator, simReport, seatDrill, sizeDrill, factsDrill } from './play.js';
import { learnLimp, limpDrill, limpSpots, progressLimp } from './limp/pages.js';

const ROUTES = {
  home,
  play: simulator,
  report: simReport,
  seats: seatDrill,
  sizes: sizeDrill,
  facts: factsDrill,
  'open-learn': learnOpen,
  'open-drill': openDrill,
  'open-weak': openDrill,
  'open-edges': edgesDrill,
  'open-paint': paintDrill('blank'),
  'open-layers': paintDrill('layers'),
  'open-progress': progressOpen,
  'tb-learn': learnThreeBet,
  'tb-charts': chartDrill,
  'tb-spots': spotsDrill,
  'tb-progress': progressThreeBet,
  'call-learn': learnCall,
  'call-drill': callDrill,
  'call-spots': callSpots,
  'call-tool': setTool,
  'call-sets': setDrill,
  'call-progress': progressCall,
  'limp-learn': learnLimp,
  'limp-drill': limpDrill,
  'limp-spots': limpSpots,
  'limp-progress': progressLimp,
};

// Pages that only report progress, so they can be redrawn when synced progress arrives.
const PASSIVE = new Set(['home', 'report', 'open-progress', 'tb-progress', 'call-progress', 'limp-progress']);

const root = document.getElementById('app');
let current = 'home';
let cleanup = null;

function render() {
  if (typeof cleanup === 'function') cleanup();
  const name = location.hash.replace(/^#/, '');
  current = ROUTES[name] ? name : 'home';
  cleanup = ROUTES[current](root, takeParams()) || null;
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();

connectSync().then((replaced) => {
  if (replaced ? PASSIVE.has(current) : current === 'home') render();
});

// Offline support, where the page is served as an installable app.
if ('serviceWorker' in navigator && document.querySelector('link[rel="manifest"]')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
