# Learn Poker

Short drills for learning poker on a phone: the core lessons from a strategy
book, each turned into charts, a table simulator and practice spots.

## What is in it

Three pre-flop tutorials, each with a study page, drills and a progress page:

1. **Opening ranges**: which hands to open from each seat, raising to 3bb.
2. **3-betting**: value, merged and bluff 3-bets, facing a 3-bet, and 4-bets.
3. **Cold-calling and set mining**: the gap concept, the default calling
   ranges, and the 15-to-1 rule.

They share the same tools:

- **The table simulator** (`js/table.js`): a spot is a few lines of data (who
  raised, who is left to act, what is known about them) and the table plays it
  out seat by seat and works out the pot and the price.
- **The spot drill** (`js/spotdrill.js`): one runner for every "what do you do
  here?" exercise, whether the spot is written by hand or generated from a chart.
- **Feedback** (`js/feedback.js`): the rule in a sentence, the factors for and
  against, the set-mining sum, and the chart with the hand marked.
- **Categorised charts** (`js/charts.js`): value and bluff, call and 3-bet, in
  one colour language. Blue raises for value, orange bluffs, green calls.

Hands near the edge of a range are asked far more often than obvious ones, and a
missed hand comes back a few questions later.

## Running it

There is no build step. Serve the folder and open it:

```sh
npm start        # http://localhost:4173
npm test         # range logic, the table simulator and the tutorial data
npm run ranges   # print every range as a chart, to check against paper notes
```

## Changing the content

Everything taught lives in `js/data/`, written the way the notes read (`66+`,
`ATs+`, `JTs-76s`):

- `preflop-ranges.js`: the opening ranges and the open size.
- `threebet.js`: the 3-bet charts, the lessons and the practice spots.
- `coldcall.js`: the calling charts, the lessons, the practice hands and the
  set-mining numbers.

Charts, drills and explanations are derived from those files. Lesson text and
the "why" on each spot are prose, so update them by hand if a chart changes.

To add a tutorial: write its data file, build its charts with `makeChart`, hand
its spots to `spotDrill`, and add its routes in `js/app.js` and its menu in
`js/home.js`.

## Hosting

The repository root is a static site and an installable web app (it works
offline once opened). On GitHub Pages: Settings, Pages, deploy from a branch,
root folder.

`npm run build:artifact` writes `dist/learn-poker.html`, the whole app as one
self-contained page fragment for hosts that serve a single file.

## Progress

Progress is one small JSON object in the browser's local storage. Where the host
page offers a per-person document store (`window.claude`), it is synced there
too.
