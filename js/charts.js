// Charts whose hands fall into named categories: value and bluff 3-bets,
// gap-concept and weaker calls, and so on. Shared by every tutorial that
// teaches a chart.
import { expand, combosOf, edgeDistancesBy, TOTAL_COMBOS, ALL_HANDS } from './ranges.js';

// The colour language is the same everywhere:
// blue raises for value, orange bluffs, green calls.
export const CATEGORY_CLASS = {
  value: 'is-c-value',
  value3bet: 'is-c-value',
  merged: 'is-c-merged',
  bluff: 'is-c-bluff',
  gap: 'is-c-call',
  weaker: 'is-c-call2',
};

/**
 * def: { id, name, title, blurb, note?, categories: [{ id, label, tokens, action? }], optional?: tokens }
 * A hand listed under two categories belongs to the first.
 */
export function makeChart(def) {
  const owner = new Map();
  const categories = def.categories.map((c) => {
    const hands = new Set();
    for (const hand of c.tokens.flatMap(expand)) {
      if (!owner.has(hand)) {
        owner.set(hand, c.id);
        hands.add(hand);
      }
    }
    let combos = 0;
    for (const hand of hands) combos += combosOf(hand);
    return {
      ...c,
      cls: c.cls || CATEGORY_CLASS[c.id] || 'is-in',
      hands,
      combos,
      pct: (combos / TOTAL_COMBOS) * 100,
      shorthand: c.tokens.join(', '),
    };
  });
  const hands = new Set(owner.keys());
  const categoryOf = (hand) => owner.get(hand) || null;
  let combos = 0;
  for (const hand of hands) combos += combosOf(hand);
  return {
    ...def,
    categories,
    hands,
    combos,
    pct: (combos / TOTAL_COMBOS) * 100,
    optional: new Set((def.optional || []).flatMap(expand)),
    categoryOf,
    category: (id) => categories.find((c) => c.id === id) || null,
    classOf: (hand) => {
      const cat = categories.find((c) => c.hands.has(hand));
      return cat ? cat.cls : '';
    },
    // Distance to the nearest hand in a different category, so the borders
    // between categories count as edges too.
    dist: edgeDistancesBy(categoryOf),
  };
}

/** Every hand of one category (or of none, for null), for sampling questions. */
export function handsIn(chart, categoryId) {
  return ALL_HANDS.filter((hand) => chart.categoryOf(hand) === categoryId);
}
