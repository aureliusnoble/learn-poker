# Learn Poker

Short drills for learning poker on a phone. The first topic is pre-flop opening
ranges: which hands to open from each seat, raising to 3bb.

## What is in it

- **Study the ranges**: each seat as a chart, as cut-offs, and as what it adds to the seat before.
- **Raise or fold**: one seat, one hand, one decision, with the rule that decides it.
- **Find the cut-off**: name the weakest hand a seat opens in one row.
- **Paint the range** and **What's new?**: fill in a chart from memory and see the difference.
- **Progress**: misses by hand, seat by seat, and a list of weakest spots to drill.

Hands near the edge of a range are asked far more often than obvious ones, and a
missed hand comes back a few questions later.

## Running it

There is no build step. Serve the folder and open it:

```sh
npm start        # http://localhost:4173
npm test         # range logic tests
npm run ranges   # print every range as a chart, to check against paper notes
```

## Changing a range

Ranges live in `js/data/preflop-ranges.js`, written the way the notes read
(`66+`, `ATs+`, `KQo`). Every chart, drill and explanation is derived from that
file. The memory hooks at the bottom of it are prose, so update them by hand if
a range changes.

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
