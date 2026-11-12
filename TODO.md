# To do

The bugs found in the review of 12 November 2026, and JW's priorities for them. Nothing here is
built yet. JW (12 November): "initial priorities: capture, will be amended, don't execute yet".
So this is a list to work from once JW says go, and the priorities may change. JW's words for each
choice are in `PLAN.md`, item 11.

Each line says what goes wrong, in plain words, and (in brackets) where to look. "Small phones"
means screens like the iPhone SE or older 360-wide Androids, in the space the browser leaves for
the page; JW's own phone is probably fine.

## First: JW's priorities

### Phone
- [ ] **P2. Walking carries on by itself.** If the layout switches while a finger is held down
  (a tablet or foldable turned sideways), lifting the finger doesn't stop the walk. Against a
  wall it bumps every 150 ms, and each bump is noisy and wakes horrors. (`js/touch.js`: lifting a
  finger is ignored outside the phone layout; also stop the walk when the layout changes or the
  page is hidden.)
- [ ] **P3. Turning the phone sideways during a rhyme burns the fuse.** The "turn it upright" page
  hides the rhyme but its timer keeps running. (`js/main.js` fuse check; `js/draw/phone.js`
  sideways page.)
- [ ] **P5. Sound, narrator and calmer effects can only be changed from the map's menu.** You
  can't turn the narrator off before the opening story is read aloud, or change them on any other
  page. On a computer M, V and F work everywhere. (`js/draw/phone.js`: the menu works only on the
  map; the phone title has no such line.)

### Computer
- [ ] **C1. The narrator keeps reading the old page after Enter turns to a new one.** The story
  runs on over the floor verse (which then never gets read); the tombstone runs on into a new
  game; the couplet runs on after a rhyme. (`js/draw/verse.js` `openPage` and
  `js/rules/rhyme.js` `finishRhyme` don't stop the voice.)
- [ ] **C2. A full pocket list runs off the bottom on common laptop screens.** At 1366×768 the
  last rows print over the key hints; at 1024×600 only 4 of 10 show. (`js/draw/render.js`, the
  margin's pocket rows.)
- [ ] **C4. Opening the bestiary mid-run plays the title's music box over the floor's hum.** In
  play that tune means bedtime is coming, so it's a false warning. (`js/main.js` `soundState`.)
- [ ] **C5. Speech bubbles are cut to 3 short lines.** Two of the Nibbler's taunts lose their
  rhyming endings; long ghost lines are cut too. (`js/draw/fx.js` `say`.)
- [ ] **C7. Smaller things on a computer:**
  - "The Story So Far" and the L log can start mid-sentence.
  - The smallest window size (640×420) overlaps: the title menu runs into the footer, the
    margin's pockets fall off.
  - A ghost's long whisper may be cut short by Chrome's online voices (about 15 seconds), and it
    delays the next floor's verse.
  - The error message on a copy played from disk says only "Script error", not what broke.
  - The bestiary would break if a saved game names a horror that a later update removed.

### New from JW (12 November)
- [ ] **Tap and skip should look the same.** JW: "tap and skip should at least look the same."
  (Claude's reading, to check with JW before building: on the phone, the "tap, to go on" prompt
  and the "tap here to skip" box at the bottom of a page should be drawn in the same style.)
- [ ] **Wear things from the pockets.** JW: "what is being worn should be an option from within
  the pocket - not just the main menu." (Claude's reading, to check with JW before building: from
  the pockets page you can see and change what you're wearing and wielding, without going back
  to the menu. Ask whether this is the phone, the computer, or both.)

## Not yet prioritised

### Phone
- [ ] **P1. Tablets can't be played at all.** A touch screen wider than 700 held upright (iPad,
  big Android tablet, foldable), or sideways and taller than 500, gets the computer layout and
  touch is switched off: it sits on "Press any key." for good. Needs JW to decide how tablets
  should look. (`js/draw/render.js` `whichLayout`, `js/touch.js`.)
- [ ] **P4. Small phones overflow:**
  - A full pocket list runs under the Use/Drop/Close buttons: the 9th row can't be tapped, and
    tapping "Pockets" to close selects the 10th instead. The gear page can list too few weapons.
  - The help page runs off the bottom, over "Tap anywhere to close."
  - The "it went for you" card slides under the top bar, hiding the damage line.
  - The coin count runs under the menu button once you have 5 or 6 rhymes.
  - The graveyard shows only 6 to 9 headstones, with no way to reach older ones.
  - At 320 wide, card titles lose their endings, sometimes the damage number ("−12").
- [ ] **P6. A sound warning in the console on the first tap.** On a phone the first tap starts
  the sound as the finger touches down, which Chrome doesn't allow yet ("The AudioContext was
  not allowed to start"); it does start when the finger lifts, so sound works. It was already
  there before 12 November. (`js/touch.js`: start the sound only when the finger lifts.)

### Computer
- [ ] **C3. The graveyard keeps 40 graves but shows only 15.** Down past the 15th moves an
  invisible highlight; coming back takes up to 25 presses of Up. (`js/draw/screens.js`,
  `js/main.js`.)
- [ ] **C6. Windows narrower than about 1150 crowd:** the rhyme notes print over the word
  "Rhymes"; the key-hint line is cut off at the right edge. (`js/draw/render.js`.)

### Game rules (both versions)
- [ ] **R1. Esc in an odd room picks the last choice.** In two rooms that's the risky one: "Eat
  the cake" (Birthday Room) and "Ring the bell" (Lost & Found). Needs JW to decide what Esc should
  do. (`js/main.js` `onChoiceKey`.)
- [ ] **R2. Health can reach zero without dying.** Bumping a wall is noisy, which wakes Mold-Mites
  in your lap, and they can bite you to zero; you stay on the map, can drink a potion and carry
  on, and a later tombstone blames the wrong horror. Also: other horrors' poison keeps ticking
  after one has killed you, and a level-up from a poison kill can heal you back.
  (`js/rules/game.js`, `js/rules/monsters.js`.)
- [ ] **R3. Reading a Scroll of Sudden Elsewhere from inside a barrel leaves you hidden out in the
  open.** Horrors lose track of you until your next step. (`js/rules/items.js`, teleport.)
- [ ] **R4. Bath Time can drag you onto coins or a candle stub without picking them up.** Pick up
  then puts them in your pockets as useless items; using them destroys them.
  (`js/rules/surprises.js`, `js/rules/game.js` `pickUp`.)
- [ ] **R5. Smashing the Music Box early brings a Tuck-You-In that barely moves** (about a fifth
  of its usual speed). If its arrival spot is taken, it silently doesn't come. (`js/rules/floors.js`.)
- [ ] **R6. For JW to decide (balance, not clear bugs):**
  - Hitting a horror from inside a barrel keeps you hidden, so it loses you 3 times in 4.
  - Thrown potions ignore the Nibbler's limits: scared 8 turns (the scroll: 4), dazed 6 turns
    (rhymes: 2).
- [ ] **R7. Small:** help or the log opened from the title after a death plays a full heartbeat;
  one extra Enter after a horror's page might take you downstairs; the Tuck-You-In can arrive
  standing on an odd room's centrepiece.

### From the first review (11–12 November)
- [ ] A hidden tab (or a phone call) burns the rhyme fuse.
- [ ] Sound and the narrator keep going in a hidden tab.
- [ ] Reloading the page undoes a bad odd-room or rhyme result (the run is only saved on the map).
- [ ] Quick wins: a link preview and icon; "add to home screen" as a full-screen app; tests run
  by GitHub on every push; a licence; archive the finished plans.
