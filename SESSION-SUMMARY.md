# Session Summary: *Everything Is Fine Downstairs*

(Called *Oh, the Places You'll Rot!* until 10 November 2026.)

Working sessions, 26–28 September 2026, the restructure on 10 November 2026, and the move away
from the Dr. Seuss books that followed it. What was
built, in what order, what was decided along the way, how it was checked, and what's still open.
For how to play, see `README.md`. For ideas not yet built, see `SUGGESTED-EDITIONS.md`.

## Next session: start here

**Work from the GitHub repository, LiminallyYours/everything-is-fine-downstairs** (public; the
game is live at https://liminallyyours.com/everything-is-fine-downstairs/ through GitHub Pages,
which republishes within a minute or two of every push to `main`). From 11 November 2026 this is
the only place the project is worked on. JW's Mac still has an old copy in
`~/Documents/claude-projects/sillygame2`; don't work there, and never push its local branch
`history-before-github` (it holds his Mac username, his email address and the Seuss-era version).
The first version of the game is kept, untouched, in `../sillygame/` on the Mac only.

- **Setting up:** clone the repository, then `cd tests && npm ci` and `npm test` (one to five
  minutes depending on the machine). It must say ALL PASSED. `tests/README.md` lists every command.
- **If you change behaviour on purpose,** `npm test` fails on the golden transcript. That's
  expected: look at the diff, re-record with `npm run golden:record`, and say why in the commit.
- **Looking at it in a real browser:** a headless Chrome driven by Playwright works on both
  `index.html` and the single file (`python3 build.py` builds `dist/`, which is not in git).
  Check the console stays clean.
- **No danger measurements any more.** JW (11 November): "in the future, we don't need a danger
  measurement check." `tests/measure.js` stays in the project but is no longer part of the routine.
- **Where to change things:** numbers in `js/config/rules.js` (README, "Where to tune"); each
  horror's own numbers in its entry in `js/content/data.js`; words in `js/content/`; drawings in
  `js/draw/`; game logic in `js/rules/`.
- **How JW works through the plan:** `PLAN.md`, item 11, is the running record. One question at
  a time, in plain words, with numbered options, what each leads to and which Claude would pick;
  each settled item recorded there with JW's answer word for word; a group is built once all of it
  has been discussed, then tests, `python3 build.py`, README, this file and `PLAN.md`, commit
  (author `LiminallyYours <64442823+LiminallyYours@users.noreply.github.com>`) and push.
- **To do:** `TODO.md` lists the bugs found on 12 November, with JW's first priorities at the
  top. JW: "don't execute yet": wait for his go-ahead, and expect the priorities to change.
- **Next:** JW tries the mobile version on his Android phone (section 16). The details Claude
  decided while building it are listed in `PLAN.md`, item 11, under "Mobile version: built", for
  JW to look over. The likeliest things to tune after that are all in `RULES.phone`: how many squares
  across (`across`), how fast a held finger walks, and, if the ink stutters, the two speed settings.
  Then the story group, then sound. Still open: whether floors 3 to 5 need tougher horrors, once
  JW has played.
- **Looking at the phone layout:** the same headless Chrome, pretending to be a phone (touch,
  390 by 844 and 412 by 915, upright, and once sideways). `SW=390 SH=844 node shots/shots.js
  out/phone-shots` in `tests/` takes the usual screenshots at phone size.
- **Project tracking stays in these files** in the repository (JW, 11 November), not a Claude
  artifact.

## Where things stand

- **Play it:** open `index.html`, keeping `js/` next to it. Or use the single-file copy,
  `dist/everything-is-fine-downstairs.html`, which you rebuild with `python3 build.py` after any change.
- **Size:** 34 JavaScript files in folders (`config/`, `content/`, `rules/`, `sound/`, `draw/`),
  about 10,300 lines. No libraries, no build step, nothing to install to play.
- **Git and the web:** see "Next session: start here". GitHub's history starts fresh on 11
  November 2026 (section 12). `dist/` is not in git; `python3 build.py` rebuilds it.
- **Tests:** `tests/`, run with `npm test`. Screenshot baselines are kept locally in
  `tests/out/` (not in git), because fonts render slightly differently on each machine.
- **Backups:** `backup-claudeignor/`, `backup2-claudeignore/` and `backup3-claudeignore/` are your
  own snapshots and have been left untouched. Git now protects everything, so they can go
  whenever you like.

## How it got here

### 1. The first version (26 Sep)
You asked for a small, low-graphics, dark Dr. Seuss–style horror game with arrow-key controls and
nothing to install. From your answers: a browser game, a turn-based roguelike, 20–30 minutes over
6 floors, a macabre-cartoon tone, and permadeath with a rhyming epitaph. It was a character-grid
game with 6 floors, 11 monsters, unidentified potions and scrolls, weapons and armor, and a
graveyard of past runs.

### 2. Making the theme land: the Medium plan (27 Sep)
You felt the theme lived only in the text, so I offered three plans and you chose Medium:
- sound made from scratch in code: a drone for each floor, a heartbeat, a music box and effects
- a narrator voice
- screen effects: flicker, shake, flashes, eyes in the dark
- a candle that burns down, and a **Dread** meter that brings hallucinations, whispers and broken rhymes
- **bedtime:** a stalker called the Tuck-You-In that comes if you linger on a floor
- the rhyme duel
- a bestiary page the first time you meet each monster
- one special rule per floor
- ghosts of your past runs, with bones you can loot

**Your tweaks afterwards:**
- a slower rhyme fuse (12 seconds when calm)
- a candle that lasts about 60% longer
- **Q** to quit
- the commas on the map explained in the legend

### 3. Ink and paper (27 Sep)
From your spec, taken in spirit rather than word for word:
- Every monster, item and piece of terrain is drawn live in wobbly ink on aged paper, and the map is zoomed in with a camera that follows you.
- Darkness is ink soaking into the page.
- Dread is shown only in the drawing: more wobble, a leaning page, scratchy lines, ink creeping inward.
- Story, verses, bestiary pages, duels, the epitaph and the ending became full-page verse, revealed one line at a time.
- Performance was cut from about 66 ms to about 10 ms a frame by caching the ink layer.

### 4. Margin and messages (27–28 Sep)
- The margin became a character page: health, progress to the next level, the candle, attack and defense, rhymes, coins, gear, condition tags, nearby monsters and pockets.
- Each turn's news appears as a ribbon on the map, placed **three steps from you** in whichever direction covers the least.
- The log became a centered *Story So Far* strip with the newest lines highlighted.

### 5. More content and more feel (28 Sep)
- Movement hops, attack lunges and recoil when hit.
- Dead monsters get scribbled out and leave a permanent ink stain.
- Each monster babbles in its own voice, and sounds you can't see are written in the dark.
- **Seven hand-built rooms,** each with a verse and three choices: the Tea Party, the Birthday Room, the Mirror, the Lost & Found, the Wishing Well, the Music Box and the Name Pile.
- **A three-phase boss** that eats your things and letters off the page, and can only be finished with *The Last Rhyme*.
- About twice as much writing: 40 couplets (plus four for the boss's Last Rhyme) and 12 epitaphs.
- The single-file build, and `SUGGESTED-EDITIONS.md`.

### 6. Gear, meeting monsters, picking up (28 Sep)
- **Equipment (E):** hand, head, body and feet slots, separate from your pockets, and drawn on your character.
- **Meeting a monster:** walking into one asks what to do (attack, rhyme, use something, or back off). When one goes for you, a card offers the same answers without blocking you.
- **Thrown potions:** they can poison, daze or scare a monster, or accidentally heal or strengthen it.
- **Picking up:** items stay on the floor until you press **G**. Gold and candle stubs are still picked up automatically.

### 7. Blows land first; getting away is a gamble (28 Sep)
- **A monster's attack resolves first.** The card that lets you answer it appears only after
  the blow has visibly landed, and it says what happened.
- **Leaving a fight succeeds only some of the time,** for you (walking away, backing off from
  the card, taking the stairs) and for monsters fleeing you.
  - The odds come from each side's speed, with the Tuck-You-In deliberately sticky.
  - A monster that's asleep, stunned, dazed or scared isn't holding you, and leaving a sleeping
    one be is free.
  - A rhyme's shove is never blocked.

### 8. The restructure (10 Nov)
`RESTRUCTURE-PLAN.md`, carried out start to finish with no change to how the game plays:
1. **Git:** a `.gitignore` and one snapshot commit of the 28 September version (`6e67b1a`).
2. **Tests** moved into `tests/` and made repeatable (`d2de767`):
   - fixed random seeds
   - each file loaded separately, the way a browser does
   - a lint for names defined twice
   - a **golden transcript**: 18 fixed-seed scenarios (about 87,000 lines) recording every
     message, bubble, drawn word and a numeric snapshot of each turn
   - Changing one word of text or one gameplay number anywhere makes it fail. This was checked
     by hand after this step and again at the end.
3. **Folders** (`d59f8d8`, `14b4781`): files moved into `config/`, `content/`, `rules/`,
   `sound/` and `draw/`. `draw.js` became `ink.js`.
4. **Config** (`ec110bb`, `e55d170`, `5f091bd`):
   - One frozen `RULES` object with about 226 tuning numbers, in 20 groups.
   - Every duplicated number now has one home, including the pocket size, which was typed in
     9 places.
   - Each monster's, item's and floor's own numbers stay in its entry in `data.js`.
   - The saved settings and their defaults are in `js/config/settings.js`, under the same
     storage keys, so nobody loses their settings or graveyard.
5. **Content** (`2238e83` … `9b04030`):
   - Gear, killers and hallucinations have stable ids. Old graveyard entries still work: a test
     loads real old-format graves.
   - A `phrase()` helper fills in text templates.
   - Each room is split into words (`content/vignette-words.js`), effects (`rules/vignettes.js`)
     and drawings (`draw/vignette-art.js`).
   - Item, screen, margin, card and prompt text moved into the content files, and the couplets
     into `content/couplets.js`.
   - Repeated lines were merged, and dead text was deleted: the unused `TEXT.rhymes` and the
     old ASCII bestiary portraits.

### 9. Moving away from Seuss (10 Nov)
Everything agreed in `PLAN.md` under "Decided by JW", put into the game in one pass:
- **The title** is now *Everything Is Fine Downstairs*, and the single-file build is
  `dist/everything-is-fine-downstairs.html`.
- **Eight horrors** have new names, verses, speech and drawings: Yesterday's Soup, the Put-Away,
  the Second Opinion, Better-Late-Than-Never, the Ahem, the Nothing-to-Worry-About, the Empty
  Sandwich and Bottom Half – Giraffe. Each does exactly what the horror it replaced did.
- **The second floor** is the Top of Somebody's Head: hair for grass, cowlicks for trees.
- **Food, things to wear, scroll titles, couplets, epitaphs and one-liners** that borrowed from
  Seuss are replaced. There are no hats: the head-slot item is the Second-Hand Nest.
- **One small addition:** an unseen Ahem within 8 steps sometimes writes "ahem" in the dark
  (`RULES.floors.ahemRange`, `ahemWord`).
- **Names in sentences:** a horror or food whose name belongs to somebody ("Yesterday's Soup",
  "Somebody Else's Breakfast") or is marked `bare` in `data.js` takes no "a" or "the".
- **Ids:** `wocket`, `grickle`, `lurkax` and the gear id `hat` were renamed (`putaway`,
  `opinion`, `giraffe`, `nest`). The other ids kept their old working names (`bat`, `zombie`,
  `wraith`, `thing`, `mimic`, `eggs`, `ham`, `beast`). Gear in graves saved under the old ids or
  names still maps across (`GEAR_WAS` in `js/rules/items.js`).
- **Not changed:** the game's own five horrors (Mold-Mite, Tick-Tock Tot, Sockling, Tuck-You-In,
  Nameless Nibbler), all numbers, and every rule.

### 10. Controls and screen (11 Nov)
The first group of improvements from `PLAN.md`, each decided by JW there:
- **Save and resume:** a run is saved as you go (`js/rules/save.js`) and C on the title screen
  carries on with it. Death, winning, giving up and beginning again wipe the save.
- **Enter in the odd rooms:** for half a second after a room's verse finishes, Enter does
  nothing, so hurrying the verse can't pick a choice unread.
- **The face-off card** goes below you, above you or to either side, whichever hides the least.
- **Not changed:** walking into a horror still asks what to do every time (JW chose to leave it).
- New test suite `tests/suites/saveresume.js` (30 checks) covers all three.

### 11. Rules and balance (11 Nov)
The second group from `PLAN.md`, each decided by JW there:
- **Bolder horrors** with your candle out or at the highest fear stage: sleeping ones within 8
  steps may wake unseen, and awake ones move faster (`RULES.bold`).
- **Trembling** at the highest fear stage only: your blows miss more and getting away fails
  more, and the margin says "trembling" (`RULES.clumsy`).
- **Three floor surprises,** once per visit at a random moment (`js/rules/surprises.js`,
  `RULES.surprises`, words in `TEXT.surprises`): the drawer closing a corridor on floor 3, bath
  time on floor 4, nap time on floor 5. Napping horrors are drawn lying on their sides.
- **Floor 1's guaranteed gear is always a weapon** (`RULES.loot.weaponFloors`).
- **Pockets shown grouped and counted,** still 10 things; the number keys follow the rows.
- **Measured before and after** with bot games. Floor-1 deaths fell, and the dark at the
  highest fear went from slightly safer than the light to clearly more dangerous on floors 3–5.
  The numbers are in `PLAN.md`, item 11.
- New test suite `tests/suites/danger.js` (35 checks), and a golden scenario, `surprises`. The
  test bot now detours to odd rooms it has seen, so rooms come up in short runs and not by luck.

### 12. A fresh check, GitHub, and two follow-ups (11 Nov)
- **Checked with fresh eyes:** the rules-and-balance work above passed every test and looked
  right in a real browser (folder and single file, console clean). No bugs. Three things the
  last session had decided alone went back to JW (`PLAN.md`, item 11):
  - The Tuck-You-In and the final boss never get bolder (`RULES.bold.exempt`). **Built.**
  - When nap time ends quietly, each horror goes back to how it was before: sleeping ones
    sleep on. Being woken by noise is unchanged. **Built.**
  - Trembling's penalty to getting away stays as it is.
- **Tests:** three new checks in `danger.js` (38 now), and one in `targeted.js` for sniffing a
  lone sock, which had dropped out of the golden recording by chance. The golden transcript was
  re-recorded for the first change: the only scenarios that changed involve the Tuck-You-In or
  the boss with fear high or the candle out.
- **Moved to GitHub,** public, with GitHub Pages. JW chose a fresh start: the game as it was on
  11 November is the first commit there, because the old history held his Mac username, his
  email address and the Seuss-era version.

### 13. How you play (11 Nov)
The third group from `PLAN.md`, each decided by JW there:
- **Three kinds of rhyme,** picked before you recite (R, then ← ↑ → or 1–3): a shove (as
  before), a lullaby (horrors near you sleep, unhurt, until any noise) and a tongue-twister (the
  nearest horror is hurt badly). `js/rules/rhyme.js`, `RULES.rhyme.lullaby` and `.twister`.
- **A hoarse voice:** rhymes close together give a shorter fuse and smudged words, up to three
  stages; rest brings it back (`RULES.rhyme.hoarse`, margin tag "hoarse").
- **Dark rooms** on floors 2 to 5: always dark inside, with better gear in them
  (`RULES.darkRooms`, `js/rules/floors.js`).
- **Tricks:** the Mold-Mite sleeps in your lap if you wait beside it; the Second Opinion calls a
  colleague after a few turns of fighting; the Tick-Tock Tot's ticking is now always written
  ("tick… tock…") and stops when it gets close (each in its own entry in `content/data.js`).
- **Also decided, for later groups:** the candle in the margin should show how full it is, and
  eyes in the dark should only ever mean a real horror (`PLAN.md`, item 11).
- New suite `tests/suites/howyouplay.js` (47 checks) and a golden scenario, `howyouplay`. Two
  golden scenarios changed so they still do what they were for: the Mold-Mite that kills you is
  made frantic (otherwise it would settle in your lap while you wait), and the bedtime scenario
  keeps the Tuck-You-In within earshot rather than relying on the layout.
- **Measured before and after** (numbers in `PLAN.md`): somewhat more dangerous, mostly on floor
  2, where the Second Opinion now brings a colleague.

### 14. Review, footsteps and holding still (11 Nov)
- **Reviewed** the details the last session decided alone for "how you play" (`PLAN.md`, item
  11). One went back to JW: the Second Opinion's colleague arrived unseen, which the theme rules
  out. **Built:** until you can see the colleague, its footsteps (*squeak…*) are written in the
  dark where it walks.
- **Project tracking stays in the repository files** (JW chose this over a Claude artifact).
- **Holding still** (space or .), JW's idea: with an awake horror beside you, a narrator couplet,
  then about one time in four it loses interest and wanders off for 3 turns; otherwise its next
  blow lands half again as hard. Never the Tuck-You-In or the boss. The Mold-Mite still takes
  your lap. The margin's key line and the help page say "hold still" (`RULES.holdStill`,
  `TEXT.holdStill`).
- **Noted for later:** the game needs a mobile version.
- Tests: 16 new checks in `howyouplay.js` (63 now). The golden transcript was re-recorded: the
  help and margin key lines changed on every screen, and every scenario in which a bot or a
  scenario waits beside a horror now hears a couplet and plays out differently from there. Every
  death scenario still ends in its death.

### 15. How it looks (11 Nov)
The fourth group from `PLAN.md`, each decided by JW there:
- **Eerier the deeper you go,** and seldom, random **eerie moments** when the page lurches to its
  worst look and eases back. Only the look: what fear does in play still follows your real fear
  (`lookFrac()` and `eerieTurn()` in `js/rules/dread.js`, `RULES.look`).
- **Every horror has something wrong with it,** always, and more as the page gets eerier
  (`WRONG` in `js/draw/sprites.js`).
- **Hand lettering** (Patrick Hand, built in: `js/draw/hand-font.js`, with its licence) for the
  margin, headings, labels and the menu pages, which were typewritten. Verse stays in book type,
  printed like ink (`inkLine()` in `js/draw/ink.js`).
- **Ink like ink:** pen pressure, hatched shadows (crossed on an eerie page), blots that grow as the
  page gets eerier (`js/draw/ink.js`).
- **The candle** in the margin stands inside a faint outline of the fullest candle there can be.
- **Eyes in the dark are always real.** The made-up ones became a faceless smile, a toy and a ripple.
- **Made-up horrors and treasures** at the edge of your light (fear's fakes) are drawn so they are
  unmistakably not real: colours washed most of the way to the paper, no shading or blots, every
  line broken into short scratches and gone over again a little off; the same in the margin's
  "Nearby" list (`unrealStroke()` and `INK_UNREAL` in `js/draw/ink.js`). Built as a follow-up the
  same day; the golden transcript didn't change, since it records words, not how lines look.
- New suite `tests/suites/looks.js` (25 checks). Golden re-recorded for the new way the menu pages
  are written and the toy block's letter; nothing in play changed.

### 16. The mobile version (11 Nov)
Built by Claude Code from the design in `PLAN.md`, item 12. One game, not two: the same files and
the same web address, switching to the phone layout by itself on an upright phone (JW).
- **Touch is key presses.** Every tap becomes the key press the keyboard would send, through the
  same `pressKey()` the keyboard now uses (`js/main.js`). What can be tapped is listed as it is
  drawn (`Taps`, `js/draw/phone.js`); `js/touch.js` turns a tap into its keys. No rule, number or
  drawing changed; on a computer nothing changed, except one key JW chose: **B** opens the
  bestiary during a run, because the phone's menu has it.
- **The layout:** the top line, conditions, the map 15 squares across (`RULES.phone.across`; 13 since JW asked for it a little larger),
  written sounds from outside the view pinned to its edge, the story's last two lines, and four
  buttons; the menu; every card, page and panel with things to tap, at least 44 pixels each; a page
  asking you to turn a phone held sideways. Words for the phone are in `TEXT.ui.phone`; story lines
  that name keys were left as written (JW's choice).
- **Speed:** measured first. About 1 to 2 ms a frame in Chrome at phone size, still 30 frames a
  second with the processor slowed four times, so the two speed fixes are settings that change
  nothing as set (`RULES.phone.pixelRatio`, `idleFrameMs`).
- **Checked:** new suite `tests/suites/phone.js` (45 checks); `npm test` 17 of 17. A headless
  Chrome pretending to be a phone (touch, 390 by 844 and 412 by 915, and sideways) and at computer
  size played through both `index.html` and the single file with a clean console: tapping to walk,
  holding a finger to walk and lifting it, the face-off card, rhyming, pockets, gear, the menu,
  help, the log, the bestiary, an odd room (a tap straight after hurrying its verse chose nothing),
  dying and the tombstone's buttons. The golden transcript was re-recorded only because two bot
  games press B on the map after they end, which now opens the bestiary.
- **Asked while building** (PLAN.md, item 11): the bestiary in the menu (JW chose B during a run)
  and words that name keys (Claude's pick: phone words for what the layout draws). JW asked for the
  recommended option to be marked, with the reason, from now on.
- **Found, not fixed:** a faint straight line in the dark where the ink texture's tiles meet, on
  a computer too; older than this work.
- **Two follow-ups the same day** (PLAN.md, item 11): the phone's map a little larger, 13 squares
  across instead of 15 (JW); and a **skip** button on pages still appearing line by line, which
  shows the rest at once and stops the narrator (JW chose this of four options; S on a computer).
  `tests/suites/phone.js` has 50 checks now.
- **Four more (JW, same day):** the map zoomed in to 12 squares across; no line on a phone names a
  key any more (the phone swaps those words as it draws them, `TEXT.ui.phone.instead`); skip moved
  to where "tap, to go on" appears; the small lettering 2 pixels larger (`RULES.phone.smallTextPx`).
  54 checks in `phone.js`.
- **Then:** on a phone the music box and the floors' hum play at half their loudness, so the
  narrator comes through (JW chose half; `RULES.phone.musicVolume`). 55 checks in `phone.js`.

### 17. A bug review and the content fixes (12 Nov)
- **Bug review.** Three read-throughs (rules, phone, computer) plus random play on both layouts
  found about 28 problems; none crash ordinary play. They are listed in `TODO.md` with JW's first
  priorities. Nothing on that list is built: JW said "don't execute yet".
- **Content fixes.** 17 word fixes JW settled in conversation (the story's Nibbler is round, no
  spork, tombstone verses that suit the killer, "an Elixir", the shears are "they", the Mirror and
  Well lines, two duels, a whisper, the help page and more), built from the work order
  `CONTENT-FIXES.md`, which is now deleted. The full list, and the details Claude decided (a
  shorter help line for R than written, because the written one doesn't fit), are in `PLAN.md`,
  item 11.

## Decisions worth remembering

| Decision | Why |
| --- | --- |
| Browser game on a canvas, no libraries | Nothing to install; your Mac's built-in fonts (Baskerville, Big Caslon) work offline |
| A zoomed map that follows you | Detailed ink drawings are unreadable at the old cell size |
| Candle and rhymes drawn in the margin, no meters | Keeps information you need to decide, without breaking the storybook look |
| Only big moments become full-page verse | Level-ups and monster lines stay small, so play isn't interrupted |
| The rhyme-duel fuse starts after the couplet is fully shown | A fair timer |
| Pressing the same arrow again attacks | Keeps the new monster card to one extra keypress |
| Escape odds: 55% base, plus 25% for each unit of speed you have over the monster (20–90%); 35% against the Tuck-You-In | Readable, and speed matters without dominating |
| The card when a monster attacks you doesn't block you | Fleeing isn't slowed |
| A disguised Hat-Mimic still bites first | The surprise is the point |
| Body armor slightly weaker once four slots existed | Keeps defense from stacking too high |
| Captions are recognized by message serial number | Fixed a bug where old captions came back once the log filled up |
| Restructure: numbers in config, words in content, but each monster's and item's numbers stay in its own entry | One self-contained entry per monster; config holds only global rules and settings |
| Restructure: a golden transcript must match exactly after every change | Proves a refactor changed nothing; re-record only for deliberate changes, and say why |
| Restructure: duplicates that disagreed by one (`>` vs `>=`) were kept as they were | No change to play; listed in `SUGGESTED-EDITIONS.md` for you to decide |

## How it was checked

**Since the restructure (10 Nov):** `cd tests && npm test` runs everything below automatically:
the name lint, the per-file load check, guards against reintroduced duplicate numbers, text and
room completeness checks, the golden transcript, every suite, an old-graveyard check and a
short randomized run. `npm run smoke`, `npm run shots:compare` and `npm run perf` run the long
randomized run, the screenshots and the frame timing. At the end of steps 3, 4 and 5 a script
also drove a real Chromium window. On both `index.html` and the single-file build, it went from
the title to floor 1, opened pockets, gear and help, toggled M/V/F, and found the console
clean. No person has played it in a browser or listened to it yet.

Before the restructure, it was checked like this:
- **Simulated play:** the real game code ran in Node with a fake canvas:
  - randomized full runs (the latest: 14 runs, 7 reaching and beating the boss, no crashes)
  - forced checks of every system: bedtime, barrels, candle, tide, clock, walls, socks, ghosts, all 21 room choices, all three boss phases, and the Last Rhyme both won and lost
  - 39 checks for the gear, monster-card and pick-up features
- **Screenshots:** every screen was rendered as real PNG images with a headless canvas (`@napi-rs/canvas`) and looked at directly. That caught blocky darkness, missing arrow characters, overflowing text, a caption covering the player, and two files defining the same name (which would have stopped every room loading in a browser).
- **Those test tools now live in `tests/`** (the `suites/` and `shots/` folders), seeded and asserting, alongside the golden transcript. See `tests/README.md`.

## Still unverified or open

- How it sounds (drone, heartbeat, music box, babble), and whether the Mac voices are found.
- Verse pacing on repeat plays, and whether the extra keypress when you walk into a monster feels right in long fights. An "always attack" option would be the easy fix.
- Difficulty balance, especially the new defense values. In simulated play, most deaths were
  on floors 2–3. Whether the middle floors need tougher horrors is still open (`PLAN.md`, item 11).
- Whether the floor surprises feel fair in real play, the drawer above all.
- The mobile version on a real phone: no person has played it on one yet. JW's Android phone is
  the real test (how many squares across, walking speed, whether the ink keeps up, the voices).
- A settings page, seeded runs, and unlocks between runs: see
  `SUGGESTED-EDITIONS.md`.
- Small inconsistencies the restructure found and deliberately left alone (two cut-off Nibbler
  taunts, a candle warning that can be skipped, two off-by-one edge cases): see
  "Small fixes" in `SUGGESTED-EDITIONS.md`. ("a Elixir" was fixed on 12 November.)
