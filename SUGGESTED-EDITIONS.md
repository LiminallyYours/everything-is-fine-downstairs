# Suggested Editions

Ideas for future versions of *Everything Is Fine Downstairs* that haven't been built yet, roughly
in the order I'd do them. Effort: **S** = under an hour, **M** = a session, **L** = several sessions.

## 1. Verify and tune what's already there

### A real playtest, with your eyes and ears (S)
Nobody has yet heard the soundtrack, heard the monster babble, or seen the game in a real
browser at your screen size. It has only been checked headlessly. One 20–30 minute run with
notes would catch more than any feature below. Things worth writing down:
- volume of the drone, heartbeat, music box, babble and voice, relative to each other
- whether the Mac voices (Daniel, Cellos, Whisper) were found, and whether narrating each line
  as it appears keeps pace with the text
- verse pacing: "each line hangs a beat too long" is meant to be uncomfortable, but it shouldn't
  be tedious
- anything that's hard to read: ink drawings, the caption ribbon, the margin
- where you died, and whether it felt fair

### A settings page (S–M)
Volume sliders for music, effects and voice; a verse-speed choice; and text size. Verse you've
already seen this run (or in earlier runs) should go faster, because the story and floor verses
repeat every game. The groundwork is in place: the saved settings and their defaults live in
`js/config/settings.js`, and the timings and audio mix in `js/config/rules.js`.

### Save and resume (S)
A run takes 20–30 minutes, and closing the tab loses it. Save the run to browser storage when
the page is hidden or closed, and offer *Continue* on the title page. Everything that needs
saving is plain data except `Uint8Array` map layers, which convert to arrays easily.

### Check the difficulty curve (S)
In simulated play, most deaths are to Second Opinions (then called Grickle-Grackles) on floors 2–3, which suggests a spike
there. The graveyard already records floor, killer, level and turn for every death. After a few
real runs, compare against the curve you want and tune `hp`/`atk` in `js/content/data.js`.

## 2. Replayability and sharing

### Shareable runs and a daily descent (S–M)
Replace `Math.random()` in `js/util.js` with a seeded generator and show the seed on the title
page and the tombstone. Two people can then play the same dungeon and compare epitaphs. A
"daily descent" is the same idea with the date as the seed.

### Unlocks between runs (L)
The graveyard and bestiary are already half of a progress screen. For example:
- finishing the bestiary unlocks a starting nest
- after 10 deaths, you can play as a different Somebody
- each hand-built room you've seen can be revisited from the title page

The fullest version is a walkable town of Glum between runs, with a real graveyard in it.

### Multiple endings (M)
The choices made in the hand-built rooms could steer the ending: you get your name back, you
get the wrong name (the Lost & Found alias already exists), or you become the next Nibbler.

## 3. Housekeeping

### Small fixes found during the restructure (S)
The restructure (November 2026) was not allowed to change how the game plays, so these were
found and left exactly as they were. Each is a one-line decision. Any fix changes the recorded
playthrough, so re-record it with `npm run golden:record` in the same commit and say why.
- **Two Nibbler taunts are cut off.** Speech bubbles hold 3 lines of 26 characters
  (`js/draw/fx.js`), so "…there's room in my belly" loses "for Somebody still!" and "…are a
  snack on two stumbly" loses "feet!". Shorten the taunts or allow a fourth line.
- **The "burning low" candle warning can be skipped.** It fires only when the wick is exactly 40.
  Deep water and snuffing take several points at once, so the wick can jump past it.
- **Edge cases that disagree by one:** the heartbeat starts at Dread above 55, but the
  "afraid" tier starts at 55 itself. Monster eyes in the dark are hidden at exactly 170 ms into a
  blink, while fake eyes and the title eyes are shown.
- **Near-duplicate wording:** the margin says "atk +N" / "def +N" where the gear page says
  "attack +N" / "defense +N", and "lint, and dread" in the margin against "Nothing but lint and
  dread." on the pockets card. Fine as they are if the difference is deliberate.

## Smaller ideas that came up while building

- **A mirror that lags behind you.** The reflection could copy your moves one turn late, then
  stop and stare. Right now it simply holds an unlit candle.
- **An option for a single-line caption** on the map, if the ribbon repeating the log's newest
  lines ever feels redundant.
- **A second tea-party guest who is not asleep.**
