# Everything Is Fine Downstairs

A browser roguelike in plain JavaScript (no libraries, no build step to play). The owner, JW, is
not a programmer: write to him in plain words. Start each session with SESSION-SUMMARY.md ("Next
session: start here"); PLAN.md is the running record of what was asked, decided and built. How to
play, the file list and where each number lives are in README.md.

## Where to work
- Only this repository (LiminallyYours/everything-is-fine-downstairs). Never work in
  `~/Documents/claude-projects/sillygame2`, and never push its branch `history-before-github`: it
  holds JW's Mac username, his email address and the Seuss-era game. Leave `../sillygame/` alone.
- A push to `main` republishes the live game (GitHub Pages,
  https://liminallyyours.com/everything-is-fine-downstairs/) within a minute or two, so every
  push is a release.
- Commit as: `git -c user.name="LiminallyYours" -c user.email="64442823+LiminallyYours@users.noreply.github.com" commit ...`

## How JW decides
- Ask one question at a time, in plain words, with numbered options and what each leads to. Put
  the recommended option first, labelled "(Recommended)", with the reason.
- If something seems missing, or a detail can't work as written, ask before building it. Don't add
  anything that wasn't asked for.
- Record each question in PLAN.md, item 11, with JW's answer word for word. Under each "built"
  entry, list the details Claude decided alone and say JW hasn't seen them yet.
- Project tracking stays in these files, not in Claude artifacts. No danger measurements:
  `tests/measure.js` stays but isn't part of the routine.

## Every change
- `cd tests && npm ci` (once), then `npm test`: it must say ALL PASSED before you change anything,
  and again after.
- The golden transcript (`tests/golden/baseline.json`) must match exactly. If it changes, find out
  why before re-recording (`npm run golden:record`), and say why in the commit.
- `python3 build.py` rebuilds `dist/` (not in git). Then check both `index.html` and
  `dist/everything-is-fine-downstairs.html` in headless Chrome. Use playwright-core installed in a
  scratch folder, driving the Chromium already cached under
  `~/Library/Caches/ms-playwright/chromium-1248/`. Check a phone with touch at 390x844 and 412x915
  held upright, once held sideways, and once at computer size. The console must stay clean.
- Then update README.md, tests/README.md (if tests changed), SESSION-SUMMARY.md and PLAN.md, then
  commit and push.

## Rules that aren't obvious from the code
- Numbers live in `js/config/rules.js` (`RULES`, frozen). Each horror's or item's own numbers stay
  in its entry in `js/content/data.js`. Words live in `js/content/`. `tests/check-text.js` fails on
  any text nothing uses, any lookup of missing text, and any `{token}` left unfilled.
- One game, two layouts. The phone layout switches on by itself (`Phone.on`: a screen taller than
  it is wide and at most `RULES.phone.maxWidth` wide). Never make a separate page, a copy, or a
  switch between layouts. Gate phone-only changes on `Phone.on`, so the computer stays exactly as
  it is: the golden transcript records the computer layout.
- Touch can never do anything the keyboard can't. Every tap becomes key presses through
  `pressKey()` (`js/main.js`). What can be tapped is registered as it is drawn (`Taps`,
  `js/draw/phone.js`). So a new phone action needs a key.
- On a phone, lines that name a key or the margin are swapped for touch words as they are drawn
  (`TEXT.ui.phone.instead`); the rules code never knows about phones. Rewording a matched line fails
  `tests/suites/phone.js`, so update the swap list along with it.
- Phone settings JW tunes after playing are in `RULES.phone`: squares across, small-text size,
  music volume, how fast a held finger walks, and the two speed settings.
- The game has moved away from Dr. Seuss: no Seuss names, rhymes or pictures, and no hats. The
  theme and naming rule are in PLAN.md, items 3 to 9.
