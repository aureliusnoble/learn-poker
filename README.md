# Learn Poker

Short drills for learning poker on a phone: the core lessons from a strategy
book, each turned into charts, a table simulator and practice spots.

## What is in it

**Home** has the pre-flop simulator, then seven chapters in the order they are
best learned. Each chapter has its own page:

- **Learn**: a walkthrough for each concept. It shows the hand developing at the
  table a step at a time, with callouts, "what if" variations and a question to
  finish (`js/walkthrough.js`, content in `js/data/lessons.js`).
- **Practise**: the chapter's drills, each showing your score over the last 25 answers.
- **Look it up**: a cheat sheet, and a page of the hands you miss most.

The chapters: the table, opening ranges, 3-betting, calling a raise (and set
mining), limpers, a raise and a caller (squeezing and over-calling), and the
blinds (stealing and defending).

Across chapters:

- **Pre-flop simulator**: any situation the chapters cover, at a table of four
  to six, marked against the book. A raise is sized as a second step and each
  mistake is named (too loose, too passive, wrong size ...).
- **Simulator report**: where you leave the book, by situation, seat and leak.
- **Progress over time**: your score on every exercise, round by round, and
  whether the last 25 answers beat the 25 before.
- **Size the raise** and **Quick facts**: short recall drills.

They share the same tools:

- **The table simulator** (`js/table.js`): a spot is a few lines of data (how
  many players, who limped or raised, what is known about them) and the table
  plays it out seat by seat and works out the pot, the price and who has position.
- **The spot drill** (`js/spotdrill.js`): one runner for every "what do you do
  here?" exercise, whether the spot is written by hand or generated from a chart.
- **Feedback** (`js/feedback.js`): the rule in a sentence, the factors for and
  against, the set-mining sum, the chart with the hand marked, and cheat sheets.
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
- `threebet.js`: the 3-bet charts and sizes, the cheat sheet, the facts and the
  practice spots.
- `coldcall.js`: the calling charts, the lessons, the practice hands and the
  set-mining numbers.
- `limpers.js`: the raise-a-limper and limp-behind charts, the size formula and
  the practice hands.
- `squeeze.js`: value ranges by raiser, the over-calling chart and the
  practice hands.
- `blinds.js`: the wider stealing ranges, steal maths, the pot-odds table and
  the two blind-defence charts.

Bet sizes are constants in those files. 3-bets are 3.5 times the raise in
position and 3 times out of position (`THREE_BET_SIZE` in `threebet.js`). The
book prints those two the other way round; swapping the numbers there changes
every drill.

Charts, drills and explanations are derived from those files. Lesson text and
the "why" on each spot are prose, so update them by hand if a chart changes.

To add a chapter: write its data file, build its charts with `makeChart`, hand
its spots to `spotDrill`, write its walkthroughs in `js/data/lessons.js`, and
list it in `js/chapters.js`. Add the routes for its drills in `js/app.js`.

## Hosting

The repository root is a static site and an installable web app (it works
offline once opened). On GitHub Pages: Settings, Pages, deploy from a branch,
root folder.

`npm run build:artifact` writes `dist/learn-poker.html`, the whole app as one
self-contained page fragment for hosts that serve a single file.

## Progress

Progress is one small JSON object in the browser's local storage. Where the host
page offers a per-person document store (`window.claude`), it is synced there
too. Besides the running totals for each hand and spot, it keeps a history for
each exercise (answers and score per round and per day, and the last 200
results), which is what the Progress over time page charts (`js/trend.js`).
