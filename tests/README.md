# Tests

Everything here runs the real game files in Node, inside a fake browser (`harness.js`). Nothing
in `js/` is changed to make them work. Set up once with `npm ci` in this folder (it installs
`acorn` and `@napi-rs/canvas`).

```
npm test        # every check below, side by side (about a minute); never re-records anything
```

## What `npm test` runs

| Check | What it proves |
| --- | --- |
| `lint-globals.js` | No top-level name is defined twice across (or within) the game files, including the silent case where a later `function` replaces an earlier one. Parsed with acorn. |
| `load-check.js` | Each script in `index.html` loads on its own, in order, like a browser: a file that uses something from a later file fails here. The page then boots with a clean console. Once `js/config/` exists, its files must also load entirely on their own. |
| `guards.js` | Numbers and words that used to be typed in several places stay in their one home: no raw pocket-size check (`inv.length >= 10`; use `pocketsFull()`), no raw Dread scale (`dread / 100`; use `dreadFrac()`) and no raw `'Somebody #'` (use `phrase('somebody', { n })`) anywhere under `js/`. |
| `check-text.js` | The words and the code that looks them up agree: no lookup of text that isn't there (`TEXT.a.b`, `phrase('a.b')`, a room's words, a bestiary field, a potion's, scroll's or food's own lines), no `{token}` left unfilled, and no text that nothing looks up (a documented allow-list for known-unused text exists, and is empty). It reads lookups with acorn, including random picks, callbacks over a table and local names for an entry. Every run ends with a self-test that breaks a copy of the game each of those ways and checks it fails. |
| `check-rooms.js` | Every odd room has words (`content/vignette-words.js`), rules (`rules/vignettes.js`) and a drawing (`draw/vignette-art.js`), by room and choice id: every choice has both words and rules, every outcome a rule can return (read from its code) has lines and every outcome in the words is returned, and every `{value}` in those lines is filled. Ends with a self-test that breaks a copy each of those ways. |
| `golden/golden.js` | The golden transcript (below) matches `golden/baseline.json` exactly. |
| `suites/targeted.js` | Bedtime, barrels, the candle, tide, clock, biting walls, socks, ghosts, every page drawing. |
| `suites/newstuff.js` | Room placement on every floor, all 21 room choices, the boss phases and the Last Rhyme, animations. |
| `suites/newfeat.js` | 39 checks: gear, picking up, the encounter and reaction cards, thrown potions. |
| `suites/withdraw.js` | 16 checks: escape odds and what failing to get away costs. |
| `suites/oldgraves.js` | Graves saved before gear and killers had ids (a graveyard recorded with commit 5f091bd, plus hand-written older ones) still show in the graveyard and on the title, raise ghosts and bones, loot, wear and draw: old gear names map to their ids and draw exactly like new gear; unknown gear gets a fallback drawing. |
| `suites/saveresume.js` | 30 checks: a run with a bit of everything in it is saved, loaded in a fresh page and comes back exactly as it was, then plays on; dying, winning, giving up and beginning again wipe the save; a save that can't be trusted is thrown away. Also: Enter can't pick a room's choice the instant its verse finishes, and the face-off card goes where it covers the least. |
| `suites/danger.js` | 35 checks: bolder horrors with the candle out or at the highest fear (they wake unseen and move faster); trembling (blows miss and getting away fails more, only at the highest fear, with the margin tag); floor 1's gear is always a weapon; the three floor surprises (when they're planned, the drawer cutting the way to the stairs and opening again across a save, the bath pulling you to the drain and keeping a thing, nap time and the noises that end it); pockets grouped and counted. |
| `suites/howyouplay.js` | 63 checks: the three kinds of rhyme (picking by key, Esc, Enter for the last kind; the shove, the lullaby and its waking, the tongue-twister); the hoarse voice (stages, shorter fuse, smudged words, rest, the margin tag, never on the Last Rhyme); dark rooms (which floors, never holding the start, stairs or an odd room, the prize, the light inside, seeing in from the doorway, saving); the Mold-Mite in your lap; the Second Opinion's colleague; the Tick-Tock Tot heard coming and going silent; the colleague's footsteps written in the dark until you see it; holding still beside a horror (the couplet, the odds it wanders off, the harder blow otherwise and forgetting it if you get away, never the Tuck-You-In or the boss, the Mold-Mite still taking your lap). |
| `suites/looks.js` | 25 checks: the page eerier with depth and in seldom random moments, but only the look (nothing in play changes); eerie moments never use the game's dice and never come two within 50 turns; no eyes that belong to nothing, only a faceless smile, a toy or a ripple; every horror has something wrong with it, and more only on an eerie page; the hand-lettered font; verse printed like ink still reads as whole lines; the made-up horrors and treasures at the edge of your light are drawn pale and broken, on the map and in the margin, and the real horror beside them isn't. |
| `suites/phone.js` | 54 checks on the phone layout (390x844 and 412x915, as the harness's window size): it switches on by itself, with `RULES.phone.across` squares across; every tap becomes the right key press in every mode (splash, title, verse pages, the map's four triangles, your own square on and off the stairs, the four buttons, the story strip, the menu, the face-off card and the card after a blow, pockets, gear, which rhyme, the rhyme words, the odd rooms, the tombstone, the graveyard, the bestiary, help and the log); holding a finger walks as held key presses and stops when lifted, when an awake horror comes into view (exactly as a held key is refused) or a page opens; 1,400-odd stray taps on the title with a run saved send nothing; the odd rooms' half-second holds for taps; written sounds from outside the view are pinned inside its edge on their side; every target is at least 44 by 44 and on the screen; no words run off the screen on any page or panel (real canvas); no lettering smaller than 12 pixels, and no story line, tip, tag, prompt or description naming a key or the margin (each line the phone swaps still matches the computer's words); skip (at the bottom, or S) shows the rest of an unfolding page at once, the narrator reading none of it, with the odd rooms' half-second still after it and a rhyme's fuse starting at once; held sideways it asks to be turned upright; on a computer none of it does anything, and B during a run opens the bestiary. |
| `suites/smoke.js --quick` | A bot plays 3 games (fixed seeds, up to 1000 steps), checking the map stays sane after every step and that no game gets stuck. |

Every suite exits non-zero on failure, and `npm test` prints one line per suite (the full output
of any that fail; `node run-all.js -v` shows all of it). The suites run on fixed seeds; try
another with `SEED=7 node suites/newfeat.js` (targeted, newstuff, newfeat, withdraw).

## Other commands

| Command | What it does |
| --- | --- |
| `npm run lint` / `npm run load` / `npm run guards` / `npm run text` / `npm run rooms` | Just the name lint / just the load check / just the guard searches / just the text check / just the room check (`--no-self` skips a check's self-test). `node load-check.js js/util.js js/config/` loads only the scripts matching those paths or folders (in `index.html` order), on their own. |
| `npm run smoke` | The full smoke run: 14 bot games of up to 3000 steps (about 4 minutes). |
| `npm run golden` | Just the golden comparison. On failure it prints the first differing lines of each scenario (with line numbers) and writes the whole new transcript to `out/golden-current.json`. `--only rooms,boss` runs some scenarios; `--print rooms` prints one; `--list` lists them. |
| `npm run golden:record` | Re-record `golden/baseline.json`. Only when a change is *meant* to show; say why in the commit. |
| `npm run golden:twice` | Run every scenario twice and check both runs are identical (determinism). |
| `npm run golden:coverage` | Report which of the game's texts never appear in the baseline (add `--literals` for every string literal in the code). |
| `npm run shots` | Real PNG screenshots of every screen (`@napi-rs/canvas`) into `out/shots/`. At phone size: `SW=390 SH=844 node shots/shots.js out/phone-shots` (the layout switches by itself). |
| `npm run shots:baseline` | Take the screenshots and save them as the local baseline, `out/baseline/`. |
| `npm run shots:compare` | Take the screenshots again and pixel-compare them with `out/baseline/`; lists the ones that differ and draws each difference into `out/diff/`. |
| `npm run perf` | Milliseconds per frame with a real canvas (calm / frightened). |
| `npm run prof` | Which drawing functions the frame time goes to. |
| `npm run caption` | Where the news ribbon lands relative to you, over many random spots. |
| `node measure.js` | How dangerous the game is, measured by bot games: where a bot that can die dies, and how often a bot crossing one floor dies in light and calm versus in the dark at the highest fear. Seeded, so the same code always gives the same numbers; for comparing balance before and after a change, not pass or fail. About 7 minutes; the top of the file says how to run it in pieces and how to measure an earlier commit. |
| `npm run single` | Runs `python3 build.py`, checks it bundled every script, then plays the scripts *from the built single file* to the map (`out/single-file.png`). |

Screenshots and their baseline stay in `out/` (not in git), because fonts render a little
differently on every machine.

## The harness

`harness.js` finds the project from its own location and the scripts the way `build.py` does
(`<script src="..."></script>` in `index.html`), and runs each file with its own
`vm.runInContext`, so load-order mistakes fail as in a browser. `createGame({ files })` loads
just some of them; `createGame({ sources })` runs already-read code (the dist file's scripts).
`Math.random` is a seeded generator, `Date` is fixed, and time (animation frames,
`performance.now`, timers, the audio clock) only moves when a test calls `tick()`. Sound and
speech are fakes that record what would be played and said. The canvas is a stub that records
every string drawn, or a real `@napi-rs/canvas` for screenshots.

## The golden transcript

`golden/scenarios*.js` play the game on fixed seeds: whole bot games (one reaching and beating the
boss, two with ghosts of earlier runs), plus forced scenarios for the title and every overlay,
every room choice and each way it can go, rhyme duels, every item, every monster, encounters
and escapes, each floor's rule, Dread, bedtime, the boss, many deaths, the running gags, and
bulk measurements of the odds (`=` lines). `golden/recorder.js` writes down what a player would
see and hear: log lines, speech bubbles, the narrator, room results, mode changes, every string
drawn on the canvas (as it appears and goes, with timing), epitaphs, sound (as a hash), and a
compact fingerprint of the numbers (health, candle, Dread, position, monsters, items...). The
line prefixes are explained at the top of `recorder.js`.

It records behaviour, not structure, so moving files, adding fields or moving text into tables
must not change it. If a refactor renames something a scenario *calls* (say a table moves), update
the scenario code; the baseline itself must stay the same. A scenario that forces a particular
pick (`arm`) fails if that pick never comes up, so a scenario can't quietly stop reaching a text.

The same scenario always gives the same transcript, whichever worker thread runs it (checked
with `npm run golden:twice`, and by every fresh `npm test`). Nothing in it depends on fonts or
the machine; a different Node version could in principle change floating-point details, so
re-check with `golden:twice` after upgrading Node.
