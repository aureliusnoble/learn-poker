// Routes are plain hash names (#open-drill). Anything more than the name
// travels in memory, for the one page load that follows.

let pending = null;

export function go(route, params = null) {
  pending = params;
  if (location.hash === `#${route}`) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = route;
}

export function takeParams() {
  const p = pending || {};
  pending = null;
  return p;
}
