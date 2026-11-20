// Entry point: maps the hash to a page and keeps progress in sync.
import { connectSync } from './store.js';
import { takeParams } from './nav.js';
import { home } from './home.js';
import { learnOpen } from './preflop/learn.js';
import { openDrill } from './preflop/open.js';
import { edgesDrill } from './preflop/edges.js';
import { paintDrill } from './preflop/paint.js';
import { progressOpen } from './preflop/progress.js';

const ROUTES = {
  home,
  'open-learn': learnOpen,
  'open-drill': openDrill,
  'open-weak': openDrill,
  'open-edges': edgesDrill,
  'open-paint': paintDrill('blank'),
  'open-layers': paintDrill('layers'),
  'open-progress': progressOpen,
};

// Pages that only report progress, so they can be redrawn when synced progress arrives.
const PASSIVE = new Set(['home', 'open-progress']);

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
