# Plan: put the game under git, then split it into rules, content and config

> **Status (10 Nov 2026): done.** All five steps are committed (`6e67b1a` through `9b04030`) and
> every check below passed on every commit. `tests/scratch/` no longer exists: its tools live in
> `tests/`. What follows is the plan as approved, kept for the record.
>
> **Status (28 Sep 2026): approved, not started.** Nothing below has been done yet. Start with
> step 1. Each step ends in its own commit and is useful by itself, so the work can stop after
> any step.
>
> **Where the test tools are:** copied as-is into **`tests/scratch/`** on 28 Sep, and checked to
> run from there. Its `README.md` says what each file does and lists the quirks step 2 fixes.
> - `harness.js`: the Node vm loader, stub canvas and localStorage
> - suites: `targeted.js`, `newstuff.js`, `newfeat.js`, `withdraw.js`, `smoke2.js`
> - `shot/`: `shots*.js`, `perf.js`, `prof.js`, `caption.js`, `single.js`, plus `package.json`
>   and `package-lock.json` for `@napi-rs/canvas`
>
> Step 2 starts from these files rather than rebuilding them. In step 1, **commit
> `tests/scratch/`** with the snapshot (it contains no `node_modules` or PNGs). Add
> `tests/scratch/shot/node_modules/` and `tests/scratch/shot/png*/` to `.gitignore` until step 2
> reorganises the folder.

## Context

The game (about 6,900 lines of plain JavaScript in 24 global-scope files loaded by `index.html`) grew quickly over three sessions.

**Three problems**
1. **Git:** only v1 is committed. Everything since is protected only by your three `backup*-claudeignor*` folders.
2. **Writing is tangled into the code.** About 58% of the player-facing writing is already in content-only files. About 465 sentences are still inline in the logic: rooms ~140, items ~64, screens ~57, margin and cards ~46.
3. **Tuning numbers are scattered.** About 450 gameplay numbers live inside the logic, and several are duplicated in 2 to 9 places. For example, pocket size 10 is typed in 9 places. These duplicates are a real bug risk.

**Your decisions**
- **Split depth:** structure plus the big wins.
- **Monster, item and floor numbers** stay with their words (one self-contained entry per monster). Config holds only global rules and user settings.
- **Git:** one snapshot commit of today's version on top of v1.

## How hard and how useful, in what order

| # | Change | Effort | Usefulness |
|---|---|---|---|
| 1 | Git: `.gitignore` + snapshot commit | 15 min | **High, immediately.** Every later change becomes reviewable and reversible. |
| 2 | Tests into the repo, made faithful and repeatable | 2–3 h | **High.** The scratch tests disappear with this session, and they're the safety net for steps 3–5. |
| 3 | Move files into folders (paths only) | ~1 h | Moderate: much easier to find things. |
| 4 | Config: `RULES` + `SETTINGS_DEFAULTS`, all duplicates merged | 4 h | **High.** One place to tune, duplicate bugs gone, groundwork for a settings page. |
| 5 | Content: text out of the four worst files, stable item ids | 7–8 h | Moderate–high. Edit jokes without touching logic, and renaming an item no longer breaks its drawing. |

**Order: git → tests → moves → config → content.**
- Git first protects everything.
- Tests second record a baseline before anything changes.
- Moves are pure renames, so git tracks them cleanly.
- Config is smaller and fixes real duplicate bugs early.
- Content is the largest and riskiest, so it goes last, on settled code.

**Correction:** my 4–6 hour estimate when I asked about depth was low. Done safely, this is about **12–16 hours**. The extra time is the repeatable test setup, which proves each step changes nothing about how the game plays, and the three-way split of the rooms. **Each step ends in its own commit and is useful by itself, so you can stop after any step.**

## Step 1: Git (15 min)

1. Write `.gitignore` before any `git add`:
   ```
   .DS_Store
   backup*-claudeignor*/
   dist/
   tests/node_modules/
   tests/out/
   tests/scratch/shot/node_modules/
   tests/scratch/shot/png*/
   ```
   - `dist/` is untracked because `python3 build.py` rebuilds it exactly.
   - The README gains the line "dist/ is not in git; run python3 build.py".
2. Check the ignore rules with `git check-ignore -v backup-claudeignor backup2-claudeignore backup3-claudeignore dist .DS_Store`.
3. `git add -A`, then review `git status --short`. It should show 11 modified files, plus 14 new js files, `build.py`, the three `.md` files (`SESSION-SUMMARY`, `SUGGESTED-EDITIONS`, `RESTRUCTURE-PLAN`), `tests/scratch/` and `.gitignore`. No backup, dist, `.DS_Store`, `node_modules` or PNG paths.
4. Commit with your configured git identity and the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` line.
5. **Going forward:** one commit per finished change, with plain-English messages.

## Step 2: Tests into `tests/` (2–3 h)

Reorganise the tools already copied into `tests/scratch/`:
- the loader
- the suites: `targeted`, `newstuff`, `newfeat` (39 checks), `withdraw` (16 checks), `smoke`
- the screenshot tools: `shots*`, `perf`, `single`

Delete `tests/scratch/` once everything has a new home.

Fix them while moving:
- **Find the project root from the test folder's own location** instead of the hard-coded path.
- **Find scripts the way `build.py` does** (`/<script src="([^"]+)"><\/script>/`).
- **Load one file at a time** (one `vm.runInContext` per file, with its filename) so load-order mistakes fail like they would in a browser. Today's harness glues the files together and hides them.
- **Add a fixed random seed** (a seeded `Math.random` in the sandbox, plus a stubbed `Date`) so runs are repeatable.
- **Add a "golden" test:** several fixed-seed bot runs record every log line, speech bubble, room result, mode change, drawn label and final epitaph. The result is saved in `tests/golden/baseline.json`. Every later step must reproduce it exactly.
- **Add `lint-globals.js`** (using acorn). It fails on any top-level name defined in two files, including the silent case where one function overwrites another.
- **Add a `tests/package.json`** (`@napi-rs/canvas`, `acorn`) and one command, `npm test`.
- **Keep screenshot baselines local** in `tests/out/`, since fonts render slightly differently on each machine.

Commit: *Add test harness, suites, screenshot tools and golden baseline*.

## Step 3: Folders (about 1 h, two commits)

- **3a:** `git mv` only, plus the `src` paths in index.html and the file map in README.md and SUGGESTED-EDITIONS.md. `git show --stat -M` must show every file as a 100% rename.
- **3b:** regroup the script tags by folder (a separate commit).

**Final layout** (every base name stays unique; `draw.js` becomes `ink.js` because `draw()` is already the renderer's main function):

```
js/util.js
js/config/   rules.js  settings.js                      (new, step 4)
js/content/  data.js  text.js  speech.js  bestiary.js  couplets.js*  vignette-words.js*
js/rules/    map.js  game.js  dread.js  monsters.js  items.js  floors.js  ghosts.js  rhyme.js  vignettes.js
js/sound/    audio.js  voice.js
js/draw/     fx.js  ink.js  render.js  sprites.js  terrain.js  verse.js  screens.js  vignette-art.js*
js/main.js                                              (* = created in step 5)
```

- **Load order:** this order keeps every load-time dependency working: `ink.js` recolors data after `data.js` and `text.js`, dread uses the palette, render uses `hash` from ink, and screens uses `RNG`/`TEXT`. The per-file loader enforces it.
- **`build.py` needs no change**, as long as index.html keeps the exact `<script src="..."></script>` form.

## Step 4: Config (about 4 h, three commits)

**`js/config/rules.js`** holds one frozen `RULES` object, grouped by system, with about 150 knobs:
- player start and pocket size
- XP, regen and verve refill
- combat hit chances
- escape odds
- candle
- stalker timing
- spawn counts and loot weights
- Dread rates and tiers
- floor rules (barrels, socks, tide, clock, chewing)
- ghosts and graveyard size
- room odds
- rhyme fuses
- verse page timings
- caption, card and effect timers
- audio mix

How it's organized:
- **No functions in config.** Values that depend on depth or tier use `{ base, per, min, max }`, read through one helper, `ruleAt()`, in `util.js`.
- **Drawing coordinates stay where they are,** about 3,000 of them.
- **Hot constants stay local.** `map.js` keeps `MAP_W`/`MAP_H`, now read from RULES.

**`js/config/settings.js`** holds `SETTINGS_DEFAULTS` (muted, voice, reducedFx) and a small `Settings` get/set. **Storage keys stay the same**, so nobody loses settings or the graveyard.

**Commits**
- **4a: rules scaffold, and every duplicate gets one home:**
  - pocket size (9 places) behind `pocketsFull()`
  - candle full/low levels, now shared by `floors.js` and `render.js`
  - the darkness cutoff behind `inDarkness()`
  - the Dread scale and tiers behind `dreadFrac()` (keeping each original `>` versus `>=` comparison)
  - the music-box warning
  - the Tuck-You-In's speed
  - effect lifetimes, blink timing and the monster-card delay
  - the enraged speed
  - the heal amount, typed twice
  - the master volume
- **4b:** combat, player, XP, candle, stalker and Dread knobs.
- **4c:** spawn, loot, floor rules, rooms, ghosts, rhyme, page timings, UI and effect timers, audio. Entity numbers move into their entries in `data.js` (potion and scroll `power`, bat and wraith candle-snuffing, the Thing's splitting, the Nibbler's boss phases).

A "where to tune" section is added to the README.

## Step 5: Content (7–8 h, five or six commits)

- **5a: stable ids (do this first).**
  - Gear gets ids (`spork`, `hat`, `colander`…). Drawings and coat colors key on the id instead of the display name.
  - Old graveyard gear without ids maps by name, with a fallback drawing.
  - Hallucinated monsters store their `type`.
  - The killer gets an id (`G.killerId`) that death facts check. Potion and food killers take their names from the item, and one-off killers ("a hungry wall") move into the text file.
- **5b: a `phrase(key, vars)` helper** in `util.js` that only looks up and fills a template (random picks stay one-for-one), plus `tests/check-text.js`, which fails on missing keys, unfilled `{tokens}` and unused text.
- **5c: rooms split three ways by room and choice id:**
  - words in `content/vignette-words.js`
  - effects in `rules/vignettes.js`, returning an outcome key and values like `['took', { n }]`
  - drawings in `draw/vignette-art.js`
  - A test checks that every choice has both words and rules.
- **5d: item messages move into the item entries** (drink, thrown and read lines next to `power`). Shared lines (names, descriptions, slot labels, equip lines) go to `TEXT.items`.
- **5e: screen, margin and card labels** move to `TEXT.ui`.
- **5f: remaining prompts** move to `TEXT`.
  - Repeated lines are merged: "Somebody #N", "Floor X of Y", and the "no stairs" line that appears twice.
  - Dead text is deleted: the unused `TEXT.rhymes` and the leftover ASCII bestiary art.
  - Couplets optionally move to `content/couplets.js`.

Rare one-off lines elsewhere stay put (your "big wins" choice).

Finally, update SUGGESTED-EDITIONS.md (remove "keep the tests" and "commit to git") and SESSION-SUMMARY.md.

## Verification (every commit)

1. **Duplicate names:** `lint-globals.js` passes, with no top-level name defined twice.
2. **Load order:** the per-file loader runs clean, and config loads on its own.
3. **Golden transcript** identical to the baseline from step 3a on. If a step truly has to change behavior, re-record the baseline in that commit and say why.
4. **Test suites:** all five pass (targeted, rooms, 39 feature checks, 16 escape checks, randomized smoke runs).
5. **Single-file build:** `python3 build.py` reports as many scripts as index.html has, and `single.js` reaches play.
6. **Screenshots** (at 3a, 4c, 5a, 5c, 5e): compare them with the step-2 baseline, and look at any that differ.
7. **Speed** (at 3b, 4a–c, 5e): frame time stays within 10% of today's roughly 9–11 ms.
8. **Guard searches** fail if `inv.length … 10`, `dread / 100` or a raw `'Somebody #'` reappear.
9. **Real browser** at the end of steps 3, 4 and 5: open `index.html` and the dist file, go from the title to floor 1, open pockets, gear and help, try M/V/F, and check that the console is clean.

## Risks to watch

- **The frozen RULES object throws on any change.** Copy values (`{ ...RULES.player.start }`, `.slice()` before shuffling). A mistake shows up as an error in the tests rather than silently.
- **Changing the order of random calls** would change the golden output. Keep each random pick one-for-one.
- **Old graveyard entries** have gear without ids and killer names as text. The fallbacks above cover them.
- **New helper names** are checked against today's globals and are all unused. The name lint guards against clashes in later steps.
