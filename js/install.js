// Installing the website as an app. On Android, Chrome builds a small app
// package in the background: it can take a minute, it can land in the app list
// rather than on the home screen, and it can fail without saying so. This card
// says which of those has happened and what to try.
import { h, fill } from './dom.js';

// Only the hosted website can be installed, and it carries a manifest.
const onWeb = typeof document !== 'undefined' && !!document.querySelector('link[rel="manifest"]');
const standalone = () => typeof matchMedia === 'function'
  && (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);

let offer = null; // the browser's saved offer to install
let installed = false; // the phone reports the app as installed
let asked = false; // the install was accepted during this visit
const el = onWeb ? h('section', { class: 'install' }) : null;

/** Asks the phone whether the app is installed. Chrome on Android answers; elsewhere it stays unknown. */
async function check() {
  try {
    if (!navigator.getInstalledRelatedApps) return;
    const apps = await navigator.getInstalledRelatedApps();
    if (apps.length && !installed) {
      installed = true;
      render();
    }
  } catch { /* not supported here: the card keeps to the general steps */ }
}

async function install() {
  const saved = offer;
  if (!saved) return;
  offer = null;
  let choice = null;
  try {
    saved.prompt();
    choice = await saved.userChoice;
  } catch { /* the prompt could not be shown */ }
  asked = !!choice && choice.outcome === 'accepted';
  render();
  if (asked) for (const ms of [20000, 60000, 120000]) setTimeout(check, ms);
}

function render() {
  if (!el) return;
  if (standalone()) return fill(el);
  if (installed) {
    return fill(el,
      h('h2', { class: 'h2' }, 'Installed on this phone'),
      h('p', null, 'Open Learn Poker from your app list. If it is not on your home screen, find it in the app list, press and hold it, and drag it across.'));
  }
  return fill(el,
    h('h2', { class: 'h2' }, 'Put it on your phone'),
    asked
      ? h('p', null, 'Installing. Android builds the app in the background, which can take a minute. Then look in your app list: it does not always go on the home screen.')
      : offer
        ? h('button', { type: 'button', class: 'btn btn--primary', onclick: install }, 'Install')
        : h('p', null, 'Open the browser menu and tap Add to Home screen, then Install.'),
    h('p', { class: 'hint' }, 'If nothing appears, open the browser menu, tap Add to Home screen and choose Create shortcut instead. It opens the same app and works offline.'));
}

if (onWeb) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    offer = e;
    render();
  });
  window.addEventListener('appinstalled', () => {
    asked = true;
    offer = null;
    render();
    setTimeout(check, 5000);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  check();
  render();
}

/** The card, or null where the page cannot be installed. */
export const installCard = () => el;
