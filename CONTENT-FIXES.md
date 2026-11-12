# Content fixes (agreed with JW, 12 November 2026)

A review of the game's words (not its code) found the problems below. JW settled each one in
conversation; his answer is given after each. This file is a work order: **delete it when the
fixes are done** (see the prompt at the end).

## Changes to make

1. **The Nibbler is round, but the opening story calls it long.** In the opening story
   (`TEXT.story` in `js/content/text.js`), replace
   "Down under the town, where the stair-steps go wrong, / lives the Nameless Nibbler, who's
   hungry and long." with:
   > Down under the town, where the stairs go around,
   > lives the Nameless Nibbler, all hungry and round.

   Why: everywhere else it is round (floor 6's verse, the bestiary, its entrance, a Last Rhyme
   couplet, its drawing). Both lines change because they rhyme with each other.
   JW: "Nibbler: 1, round".

2. **The story promises a spork you never get.** In the same verse,
   "Go down! Get it back! Take a spork and a snack." becomes
   "Go down! Get it back! Take a light and a snack."
   Why: you start with bare fists, two muffins and a candle. Play does not change. JW: "#1".

3. **Some tombstone verses only work for creatures.** No words change; only which verse is
   picked (`die()` in `js/rules/game.js`, verses in `TEXT.epitaphs`):
   - "{Killer} came calling, as horrors will do" and "Roses are gray... {killer} is sleeping in
     {who}'s old bed" are used only when a horror killed you.
   - "Hush now, {who}... {Killer} has tucked you in, terribly deep" is used only when the
     Tuck-You-In killed you.
   - Deaths by a hungry wall, tea, birthday wax or spoiled food get the other verses.
   Why: "a spoiled Somebody Else's Breakfast is sleeping in Somebody #11's old bed" reads like a
   mistake. JW: "1".

4. **The lullaby line sounds as if you woke up.** `TEXT.lullaby.woken` becomes
   "Everything you sang to sleep wakes up at once. It is all very cross about it."
   Why: "Somebody" is the player's own name. The drawer and bath lines that say "Somebody" stay
   as they are (there it is a deliberate hint). JW: "1".

5. **"a Elixir".** "(That was a Elixir of Un-Deadening.)" must read "an". Use "an" before any
   name starting with a vowel (`TEXT.items.identified`). No decision needed.

6. **The shears are plural.** "You wield the Grumbling Garden Shears. It feels ominously
   appropriate." becomes "They feel ominously appropriate." for the shears only. No decision
   needed.

7. **One face is "they" at the Wishing Well.** In `VIGNETTE_WORDS.well`, the "yours" outcome
   (one face at the bottom): "They teach you a rhyme. You wish they hadn't. (+1 rhyme)" becomes
   "It teaches you a rhyme. You wish it hadn't. (+1 rhyme)". The "faces" outcome (many faces)
   keeps "They". No decision needed.

8. **Two lines for the same thing.** When the Nibbler eats a rhyme, one line ends "(-1 ♪)" and
   the other "(-1 rhyme)". Both end "(-1 rhyme)". No decision needed.

9. **The help page is out of date (computer).** In `TEXT.help` and `TEXT.legend`:
   - The R line becomes "Recite a Rhyme: pick a Shove, a Lullaby or a Tongue-Twister, then the
     word that rhymes. Costs 1 ♪."
   - The water entry "water (≈ is deep & slow)" becomes "water (deep water is slow)". The map
     is drawn in pictures now, so the ≈ means nothing.
   If the longer R line doesn't fit the help page, shorten it and say so. No decision needed.

10. **A keyboard hint on phones.** Finding matching socks says "...Put them on from your
    equipment (E)." On a phone this must read "Put them on from your Pockets." Add the pair to
    `TEXT.ui.phone.instead`. No decision needed.

11. **The Mirror rhymes a word with itself** ("own" / "own"). Its last line becomes
    "a moment too late. Then it waves, all alone." JW: "1".

12. **The Wishing Well says "see" where it means "show".** Its last line becomes
    '"or lean in real close, and I'll show you. You'll see."' JW: "1".

13. **The sock floor's verse has a line too long for its beat.** Its second line becomes
    "to be buried in rows, one by one, every year." JW: "1".

14. **The Clockwork Nursery's filler line.** "The Tots are wound tight, and they don't wear a
    bib." becomes "The Tots are wound tight, and they're wearing a bib." JW: "1".

15. **A rhyme duel that doesn't make sense.** In `js/content/couplets.js`, the "A-tisket,
    a-tasket" couplet becomes:
    > A-tisket, a-tasket, a coffin, a casket,
    > I'll pack up your bones in a little green ___!

    Answer: **basket**. Wrong answers: **box**, **sack**, **bag**. JW: "1".

16. **A boast that takes itself back.** The "Beware, beware, you beast of the deep" couplet's
    second line becomes "my rhymes are sharp, and they don't come ___!" The answer stays
    **cheap**, and the wrong answers stay wet, loud, borrowed. JW: "1".

17. **Two whispers say the same thing.** In `WHISPERS` (`js/content/speech.js`), replace
    "we saved you a seat" with "your name is on the tip of our tongue". "we kept your seat warm"
    stays. JW: "1".

## Looked at and left as they are (do not change)

- The Ahem's bestiary verse ("Each "ahem" your flame shrinks"). JW: "2".
- The "Twinkle, twinkle, little fright" duel: "space, please" is a fair trap; "light" rhymes.
  JW: "1".
- The Colander of Courage, worn on the head. JW: "1".
- The Tick-Tock Tot's "Are you my mummy?". JW: "1".

## Prompt for Claude Code

Make the content fixes in CONTENT-FIXES.md (in the project's top folder). They are words only:
nothing about how the game plays changes, except item 3, which changes only which tombstone
verse is picked. JW has already decided every item; build them exactly as written and don't
add anything. If a fix can't work as written (a line doesn't fit, a check fails on it), ask JW
before changing it, one question at a time, in plain words, with numbered options and which you
would pick.

Follow the project's usual routine in CLAUDE.md: tests pass before and after; build the single
file; check the computer and phone layouts in headless Chrome with a clean console. The golden
transcript will change where these words appear in the recorded games: check that every
difference is one of these fixes before re-recording, and say so in the commit. Update
tests/suites/phone.js's swap list along with item 10 if needed.

Record the fixes in PLAN.md item 11 as one entry, "Content fixes (12 November)", copying each
item's problem, fix and JW's answer from CONTENT-FIXES.md, and listing any details you decided
alone. When everything is built, tested and recorded, delete CONTENT-FIXES.md in the same
commit, then push.
