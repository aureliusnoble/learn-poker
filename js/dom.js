// A tiny element builder, so pages read as structure rather than string soup.

function append(el, kids) {
  for (const kid of kids) {
    if (kid == null || kid === false) continue;
    if (Array.isArray(kid)) append(el, kid);
    else el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
}

/**
 * h('button', { class: 'btn', onclick: fn }, 'Label')
 * `html` sets innerHTML and is only ever given markup written in this codebase.
 */
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  append(el, kids);
  return el;
}

/** Replaces an element's children, skipping empty slots and flattening lists. */
export function fill(el, ...kids) {
  el.replaceChildren();
  append(el, kids);
  return el;
}

export const pct = (x) => `${Math.round(x * 100)}%`;

export function weightedPick(items, weightOf) {
  let total = 0;
  const weights = items.map((item) => {
    const w = Math.max(0, weightOf(item));
    total += w;
    return w;
  });
  if (!items.length) return undefined;
  if (total <= 0) return items[Math.floor(Math.random() * items.length)];
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}
