# High-level plan for the next version of the game

Written 10 November 2026, from a chat session with JW, and added to later the same day. This
file is a note of direction, not a build plan. Nothing in it has been started unless it says so.
The move away from the Seuss books has been built: see item 10 under "Decided by JW".

## What this is

The game as it was before this work is in `../sillygame/`, and is left untouched there. It is a
small turn-based horror-comedy game that runs in a web browser: you go down six floors by
candlelight to get your name back from the thing that ate it.

This folder, `sillygame2`, is the next version. It started as a full copy of `../sillygame/`,
with its git history, and is where all new work happens.

## Decided by JW

1. **Move away from the Dr. Seuss books.** JW's words: "i definitely want to shift way from seuss
   books - rhyme and dread and silliness, but no overt content relationship."
   - Stays: rhyme, dread, silliness.
   - Goes: anything that points at a specific Seuss book, character, name, line or picture.
2. **The restructure of the current game comes first.** It is described in
   `../sillygame/RESTRUCTURE-PLAN.md` and is assumed to be in progress. When this note was written,
   its first step (saving the current version in git) was done.
3. **The theme** (agreed in chat, 10 November 2026). JW's words: "stark raving mad with a happy
   nursery rhyme veneer."
   1. **Happy things that are wrong.** The world is bright, sing-song, sweet and funny, and it is
      also insane. JW: "they werent subtle per say. they were happy things that were wrong wrong
      wrong wrong." The wrongness is in plain sight, not hidden and not hinted at.
      - Right: a creature with far too many elbows waves all of them at you, delighted, in a
        well-lit room.
      - Wrong: a creature hides in the dark and jumps out.
   2. **Impossible things, treated as normal.** Things that could never exist are simply there,
      and nothing in the world finds them odd. The game invents its own impossible things. It
      does not borrow them.
   3. **It gets happier and more wrong together.** It does not turn dark as it gets worse. JW:
      "the mad hatter that starts laughing. and laughing harder ... until the laughter eats you."
   4. **You can't tell for sure.** It is genuinely funny and cute, and it can also be read as a
      nightmare, like old fairy tales and nursery rhymes. Both readings must stay open.
   5. **The main character is not a child.** JW: "childlike is not child." The world is
      childlike. The Somebody walking through it is grown. Do not build the horror on "things are
      scary from a child's point of view". That reading was tried and rejected.
   6. **Nothing that should be trustworthy is.** JW: "people and things that almost
      definitionally are trustworthy ... but who arent really - not any of them."
   7. **Surreal, in-between places.** JW: "liminal spaces - if the world were only liminal
      spaces", and "when reality seems like a dream and dreams are real."
   8. **The narrator is the straight man, and the last thing to break.** He tells it warmly and
      matter-of-factly, as a story where everything is fine and normal, and he delivers the
      absurd in the same voice as the sweet. When the fear gets bad enough to reach even him
      (he cannot finish his rhymes, old lines turn to static), that is the alarm. This effect
      already exists in the game and stays. JW: "i think have a 'straightman' is important...then
      having the straightman break down is important"
   9. **Rhyme, singing and saccharine sweetness** carry all of it.

   Touchstones JW named, for feel only and never for content: the Mad Hatter, Willy Wonka,
   Delirium "who was once delight", and the narrator of the film *Ted*.

   Open, for a playtest: the narrator can start dropping rhyme endings at the third of the four
   fear stages. If that feels too early, save it for the worst stage.

   The proposals below were written before this theme was agreed and have not been revised.
   Where one disagrees with the theme, the theme wins.

4. **The naming rule** (agreed in chat, 10 November 2026). A name must not simply say what the
   thing does. JW: "it basically does exactly what its name implied. all of these have to have a
   little nonsense." He also asked for "sillier and less....obvious".
   - What works: a name that makes you ask "the what?", then a verse that answers with reasoning
     that almost makes sense, and ends on a throwaway line that is the scare. The thing is
     cheerful, has its own daft logic, and wants something from you.
   - What was tried and rejected, and why:
     - The Big Cuddle (a deadly hug). JW: "that can be weird."
     - Many-Happy-Returns, the More-the-Merrier, the Indoor Outdoors. JW: "just boring." Each
       was a pun on a pleasant saying, so the name gave the whole joke away.
     - A Damp Thursday. JW: "the weakest - for much the same reason". It was gloomy, not
       happy, and it did not want anything.
     - The Wick Inspector. It did exactly what its name said.
5. **Replacements agreed so far** (10 November 2026). Each keeps exactly what the old one does
   in play. Only the name, words and drawing change. Now in the game (see item 10).
   1. **The Put-Away** replaces the Wocket (steals from your pockets and runs). JW: "made me
      laugh and be scared - far away the best."

          The Put-Away loves you. It loves what you've got.
          It puts things away, whether you'd like it or not.
          Your hat and your tea have been filed with great care
          in a drawer that it keeps. The drawer isn't there.

   2. **Better-Late-Than-Never** replaces the Zizzer-Zazzer Zombie (slow, hits very hard). The
      name is JW's.

          Better-Late-Than-Never is terribly late.
          It set off last spring with a terrible weight:
          a piano, a pond, and a week from next year.
          It just needs a place it can put them. You're here.

   3. **The Empty Sandwich** replaces the Thing-and-a-Half (splits when hit).

          Cut a sandwich in two and it's two. That's the rule.
          Cut those and it's four, as they teach you in school.
          They've no filling at all, and they're terribly thin,
          and they've all had a look, and they'd like you put in.

   4. **The Ahem** replaces the Sneech-Wraith (drifts through walls, shrinks your candle). A
      written "ahem" can appear in the dark before it reaches you, using the game's existing
      written-sounds effect.

          The Ahem is a cough with nobody attached.
          It comes through the wall, which it leaves quite unscratched.
          It has something to tell you. It won't tell you what.
          Each "ahem" your flame shrinks. It's ahem-ing a lot.

   5. **Yesterday's Soup** replaces the Bumble-Bat (fast, wanders erratically, can knock your
      candle half out).

          Yesterday's Soup has gone cold in its bowl,
          so it's up and it's out for a bit of a stroll.
          It would like to be warm, and it isn't. It's not.
          You've a candle. You're warm. It likes both, quite a lot.

   6. **The Top of Somebody's Head** replaces the second floor, the Gloomwood Glen (tall grass
      that rustles when something unseen moves through it). JW: "excellent."

          The next floor is hair. It is somebody's head.
          Whose head? We don't ask. It's bad manners, it's said.
          It's combed every morning and parted with care,
          and it rustles when something gets loose in the hair.

   7. **The Second Opinion** replaces the Grickle-Grackle (all teeth, the plain fighter of the
      middle floors). JW: "i liked second opinion".

          The Second Opinion has come for a look.
          It's checked both your knees and it's written a book.
          It thinks you've too many of most of your bits.
          It has brought its own teeth, and it's seeing what fits.

   8. **Bottom Half – Giraffe** replaces the Lurkax (the tough one near the bottom). You only
      ever see legs. The rest goes up off the page. The name is JW's: "(it rhymes)".

          Bottom Half – Giraffe is four legs and some knees.
          The rest of it goes through the ceiling with ease.
          What's up at the top? No one's seen it, it's said.
          It's bending down now. That is probably the head.

   9. **The Nothing-to-Worry-About** replaces the Hat-Mimic (lies on the floor looking like
      something to pick up, then bites). It must not look like a hat. On the floor it looks
      like a Second-Hand Nest (Claude's choice while building; see item 10).

          On the floor is a Nothing-to-Worry-About.
          It is nothing. It's lovely. Go on, there's no doubt.
          It has opened, which Nothing-to-Worries all do,
          and it's nothing with teeth. It is nothing to you.

      Rejected for this one: Is-This-Yours (a hat that insists it is yours). JW: "no hats", and
      "is this yours is also boring". A Free Sample was offered alongside and not chosen.
6. **No hats** (agreed 10 November 2026). JW: "no hats." This covers the whole new version: the
   striped hat item, the hat on the title screen and the tombstone, the tea party guest's hat,
   and the disguise of the monster that lies on the floor.
7. **This pass only moves away from Seuss** (agreed 10 November 2026). JW: "keep the rest for
   now. this is a move-away-from-seuss pass". The monsters that are the game's own invention
   keep their names and words for now: the Mumbling Mold-Mite, the Tick-Tock Tot, the Sockling,
   the Tuck-You-In and the Nameless Nibbler. They are not being renamed under the naming rule
   in this pass.

8. **The new title** (agreed 10 November 2026): **Everything Is Fine Downstairs**. JW: "25 is the
   right one." The subtitle "a most unfortunate descent, in rhyme" stays. Offered and not
   chosen: Please Don't Mind the Bite; Somebody Went Downstairs; Nothing to Worry About.
9. **Replacement words, items and pictures** (agreed 10 November 2026). JW: "the rest are keep
   as drafted". Each keeps what the old one does in play. Now in the game (see item 10).
   - **Food**
     1. Plate of Green Eggs becomes **Somebody Else's Breakfast** (JW: 'skip "plate"'). "Still
        warm. Nobody is missing it yet." Gone off: "Somebody Else has noticed. Your tummy
        apologises on your behalf."
     2. Ham of Uncertain Origin becomes **Pie of Uncertain Origin**. Its other words stay.
     3. Slice of Roast Beast becomes **Slice of Roast Something**. "The good stuff. Nobody will
        say what the Something was."
   - **Things to wear**
     4. Tall Stripy Hat becomes **Second-Hand Nest**, worn on the head. "The previous owner
        hasn't quite moved out. Mildly protective."
     5. Oobleck-Crusted Overcoat becomes **Marmalade-Crusted Overcoat**. "Sticky, but things
        bounce off it."
   - **Nonsense titles on unread scrolls**
     6. "YERTLE BURTLE" and "OOBLECKY" become "NOBBLE FENCH" and "GLOMMERY".
   - **Rhyme-duel couplets** (the last word is the one the player picks)
     7. "One for sorrow, two for boo, / I will not be eaten, not by you!" (replaces "One fish,
        two fish")
     8. "Three blind mice and one blind louse, / see how they run from out of my house!"
        (replaces "I do not like you in the house")
     9. "I have a spork and I'm standing just so, / and I will not be eaten, and that is a no!"
        (replaces the spork-and-hat couplet)
     10. "I've eaten a breakfast that wasn't for me, / and I am not scared of whatever you be!"
         (replaces the green eggs and ham couplet)
     11. "I've a long way to go and a great deal to see, / and I can't see a thing from the
         inside of thee!" (replaces "Oh, the places you'll go")
     12. "I've got a candle and I've got my wits, / I've got a rhyme that will knock you to
         bits!" (replaces the candle-and-hat couplet)
     13. "Grumble and gristle and gribble and gruff, / I've heard all your growling and I've
         had enough!" (replaces "Grickle and grackle")
   - **Epitaphs**
     14. "Eeny, meeny, miny, mo, / [the killer] caught [you] by the toe. / They hollered. It did
         not let go." (replaces "One Somebody, two Somebody")
     15. "There was so much to do! There was so much to see! / Like [the killer]... and then
         nothing. / Then dirt. Then a tree." (replaces "Oh, the places you'll go")
     16. The epitaph that ended "went out in a wonderful hat" now ends: "Now [you] rest here,
         all tidy and flat. / They'd have liked a nice send-off. They didn't get that."
     17. "Roses are gray and the violets are dead, / and [the killer] is sleeping in [your] old
         bed."
   - **One-liners**
     18. For eating three: "You have eaten so many of Somebody Else's breakfasts that Somebody
         Else has started skipping lunch."
     19. After five perfect rhymes: "Five perfect rhymes! Somewhere in the dark, something
         claps. It has more than two hands."
     20. Title-screen tagline: "Not approved by any doctor. We asked several."
     21. Finding an earlier Somebody's bones: "You recognize the knees."
     22. Tip: "if the narrator says it's nothing to worry about, worry."
     23. The sock floor's verse, last two lines: "Some socks are just socks. Some socks have a
         twin. / Some twins have a mouth. Don't put your foot in."
   - **Pictures that had hats**
     24. The tombstone gets a single sock draped over it. The figures on the title screen and
         the player's character go bare-headed unless wearing the nest. The tea party guest is
         asleep with no hat. The wax figure holds a party balloon, and its verse line becomes
         "with a party balloon. It is smiling. At who?"
   - **Left as they are:** "Wee Willie Winkie" (a traditional nursery rhyme) and the
     Snicker-Snack Snipper (it echoes Lewis Carroll, not Seuss). JW has not asked for either to
     change.
   - **Follow-on tidying, not needing a decision:** floor verses, tips and messages that mention
     the old monster names are reworded to the new names.

10. **Built** (10 November 2026). Items 5, 6, 8 and 9 above are now in the game in this folder.
    All tests pass (`cd tests && npm test`), and the recorded playthrough was re-recorded for the
    new words. Nobody has yet played it by hand or listened to it. `SESSION-SUMMARY.md` section 9
    lists what changed in the code.

    **Things Claude decided while building, which JW has not yet seen or agreed.** Each is easy
    to change.
    1. Every replaced horror needed more words than its verse: a one-line description, the
       verbs for its attacks, what it says in speech bubbles, and its death line. Claude wrote
       these in the same spirit. They are in `js/content/data.js` and `js/content/speech.js`.
    2. The Put-Away's agreed verse said "Your hat and your tea". Because of "no hats" it now
       says "Your spork and your tea".
    3. The Nothing-to-Worry-About looks like a Second-Hand Nest while it lies on the floor.
       This keeps the trick working exactly as before: a nest on the floor might be a real
       nest, or might not.
    4. The Top of Somebody's Head: the things in the way are cowlicks, the litter is "stray
       flakes", the walls are scalp-coloured, and the hair is brown.
    5. Two other floor verses named replaced horrors and were reworded. The sea-caves: "An
       Empty Sandwich floats by on the brine." The nursery: "They'll count down your minutes,
       they'll count down your toes, / and where Bottom Half's top half is, nobody knows."
    6. The title is set in two inks, as the old one was: "Everything Is Fine" in black and
       "Downstairs" in red.
    7. An unseen Ahem within 8 steps sometimes writes "ahem" in the dark. This is the one
       addition to how the game plays.
    8. The couplet ending "knock you to bits" has new wrong answers: "pieces", "sleep" and
       "the shops".
    9. Inside the code, the old working names `wocket`, `grickle`, `lurkax` and the gear name
       `hat` were replaced. Eight other internal names were left (`bat`, `zombie`, `wraith`,
       `thing`, `mimic`, `eggs`, `ham`, `beast`). Players never see these.

    **Open questions for JW.**
    1. The Tuck-You-In is still drawn in a nightcap. "No hats" was agreed with a list that did
       not include it, and the Tuck-You-In is one of the game's own horrors that this pass
       leaves alone. Keep the nightcap, or remove it?
       **Settled, 11 November 2026: it stays.** JW: "nightcap can stay."
    2. One of the name tags at the Lost & Found is "Bartholomew Noodle". "Bartholomew" is also
       the first name of a Seuss character. Keep it, or change it?
       **Settled, 11 November 2026: changed to "Barnaby Noodle".** JW chose to change the first
       name. Now in the game.

11. **Going through the proposed improvements** (started 11 November 2026, after JW played the
    new version: "played. good."). Each entry is the question as asked, JW's answer, and how it
    is settled. Nothing here is built until it says so.
    - **The proposed list stays whole.** Claude suggested withdrawing two of the proposals
      about how the game looks ("bring the eerie look forward" and "redraw the calm monsters to
      look slightly wrong, not cute"), reading the theme's "happier and more wrong, never
      darker" as ruling them out. JW: "the eerie look details still are on target. ink creeping
      in, lines trembling, etc. the current list was a good start, dont lose any." Settled: no
      proposal is dropped. The page going dark and shaky as fear rises is right for this game.
      "Happier and more wrong" describes the horrors and the narrator, not the page.
    - **The Enter key does three jobs** (next line of verse, confirm a room choice, take the
      stairs), so hurrying a room's verse can pick its first choice unread. Options offered:
      (1) a short pause after the verse finishes, during which Enter does nothing; (2) choices
      by number key only; (3) leave it. JW: "#1." Settled: add the pause. **Built** (11 November):
      for half a second after a room's verse finishes, Enter does nothing. Number keys still pick
      at once. The length is `RULES.ui.choicePauseMs`.
    - **The fight card covers things.** The card with your choices in a fight is always drawn
      directly under you (or above, if there is no room), so it hides anything in that row,
      including other horrors. Options offered: (1) let the card find the spot that covers the
      least, the way the news ribbon on the map already does; (2) move the card off the map into
      the strip along the bottom; (3) leave it. JW: "1". Settled: the card finds a clear spot.
      **Built** (11 November): the card tries below you, above you and either side, and takes the
      one that hides the least (horrors count most). On a narrow window the card is too wide to
      fit beside you, so there it can only choose between below and above.
    - **Walking into a horror asks what to do every time,** so each blow in a fight takes two
      key presses. Options offered: (1) ask once per fight, then walking into it attacks
      straight away; (2) an "always attack" setting, off by default; (3) leave it. JW: "3".
      Settled: no change. The proposal for an "always attack" option is closed.
    - **Save and resume.** A run takes 20 to 30 minutes and closing the tab loses it. Options
      offered: (1) save as you go and continue from exactly where you were, with the save
      erased when you die or win so death stays permanent; (2) save only at the top of each
      floor; (3) leave it. JW: "1". Settled: save as you go. **Built** (11 November). Details
      Claude decided while building, which JW has not yet seen:
      - The run is saved after every turn, and whenever you get back to the map from a page.
        If the tab closes in the middle of a page (a rhyme, a room, a storybook page), you carry
        on from the last moment you were on the map.
      - With a run in progress, the title screen gains "C  carry on as Somebody #N, on Floor N",
        and Enter reads "begin again, and leave Somebody #N down there".
      - The save is wiped on death, on winning, on giving up (Q twice) and on beginning again.
      - A save from a different version of the game, or a damaged one, is thrown away quietly.
      - The save lives in the browser, like the graveyard, so it is separate for the folder
        version and the single-file version.
    - **The dark and the highest fear barely hurt.** In play, a bot crossed a whole floor with
      no candle and fear at its highest and lost almost no health. Options offered: (1) the
      horrors get bolder: sleeping ones nearby wake and awake ones move a little faster;
      (2) the dark bites: a chance each turn of a small unseen nip; (3) fear makes you clumsy:
      your blows miss more and getting away fails more; (4) leave it. JW: "1 and 3?" Claude
      agreed they work together and proposed the shape below to avoid a downward spiral (hurt
      raises fear, fear makes you miss, missing gets you hurt). JW: "agree". Settled:
      - Bolder horrors when your candle is out or your fear is at its highest stage.
      - Clumsy only at the highest fear stage, not for darkness alone.
      - A margin tag (such as "trembling") shows when you are clumsy, so a player knows why.
        The narrator stays cheerful about it.
      - Light, food, good rhymes and hiding still bring fear down, so there is a way out.
      - The amounts are numbers in `js/config/rules.js`. After building, bot games are run
        before and after to check that deaths rise somewhat without runs becoming hopeless,
        and JW sees the comparison.
      **Built** (11 November). Details Claude decided while building, which JW has not yet seen:
      - "Candle out" means no wax left. A dim candle, or a dark corner of a lit floor, doesn't
        count.
      - Bolder: each turn, a sleeping horror within 8 steps has a 35% chance to wake, seen or
        not; awake horrors get a quarter more speed (`RULES.bold`).
      - Trembling: your blows land about 65% of the time instead of about 85%, and getting
        away is 15 points less likely (`RULES.clumsy`). The margin tag is "trembling", in red,
        under what you're wearing.
      - **The comparison** (bot games, before and after, all three groups of this item built;
        `tests/measure.js` gives the same numbers again, and says how to measure an earlier commit):
        - 40 full games by a bot that can die: deaths on floor 1 fell from 14 to 9 (the
          floor-1 weapon), deaths on floor 3 rose from 7 to 12, and the average deepest floor
          went from 1.9 to 2.1. Nobody won either time; the bot plays badly on purpose.
        - Crossing one floor to the stairs with 60 health, 8 tries each, how many died:

          | Floor | Lit and calm, before → after | Candle out and highest fear, before → after |
          | --- | --- | --- |
          | 2 | 4 → 1 | 2 → 1 |
          | 3 | 5 → 3 | 2 → 6 |
          | 4 | 6 → 5 | 6 → 8 |
          | 5 | 6 → 7 | 6 → 8 |

        - Before, the dark at the highest fear was *safer* than the light on floors 2 and 3,
          because sleeping horrors only woke when they could see you. Now it is clearly more
          dangerous from floor 3 down. Eight tries is few, and the floors themselves came out
          differently after the change, so differences of one or two are noise.
        - Hopeless? Only if you stay in the dark at the highest fear for a whole floor, which
          the crossing bot was forced to do. Light, food, rhymes and hiding still bring you back
          down.
    - **The middle floors** (floors 3 to 5) were not dangerous in Claude's play, though most bot
      deaths come on floors 2 and 3. Options offered: (1) more horrors there; (2) tougher
      horrors there; (3) build the dark-and-fear change first, run bot games before and after,
      then decide; (4) leave it. JW: "3 + maybe a couple of floor specific suprises?" Claude
      offered one surprise per middle floor, each happening once per visit at a random moment
      and announced by the cheerful narrator, and suggested only the second and third because
      the first could feel unfair if it traps you with something you can't beat. JW: "all 3".
      Settled: measure first (the bot games include the surprises), and build all three:
      1. **Sock catacombs: The Drawer Closes.** "Somebody closed the drawer. That is what
         drawers are for." A wall slides across one corridor and cuts the floor in two for a
         while, then slides open again. To check in play: that it never feels like a trap
         with no way out.
      2. **Sea-caves: Bath Time.** The water goes warm and bubbly and lovely; then somebody
         pulls the plug, and for a few turns the deep water drags you toward a drain. Getting
         out of the water frees you.
      3. **Clockwork nursery: Nap Time.** A bell, and "Nap time!" Every horror on the floor
         lies down and shuts its eyes. Any noise (a blow, a rhyme, bumping a wall) wakes them
         all at once, frantic.
      Whether the middle floors also need tougher horrors is decided after the measuring.
      **Built** (11 November): the three surprises. Details Claude decided while building,
      which JW has not yet seen:
      - Each comes once per floor, between 30 and 110 turns after you arrive. If it can't
        happen just then (no corridor to close, no horror to put down), it tries again 10
        turns later, up to 6 times.
      - The Drawer Closes: a straight corridor one cell wide, at least 3 steps from you and with
        nothing on it. It prefers one between you and the stairs, otherwise one that shuts off a
        good part of the floor. It stays shut for 30 turns. A drawer front with a knob is drawn
        across it.
      - Bath Time: warm for 3 turns (calming, if you're in the water), then the plug is pulled
        for 8 turns. The drain is in whatever pool you're in, drawn as a blue swirl. It pulls
        you one step a turn; dragged through deep water costs candle as usual. At the drain it
        keeps one thing from your pockets, at random, once.
      - Nap Time: every horror on the floor except the Tuck-You-In and a disguised
        Nothing-to-Worry-About, for 30 turns. Napping horrors are drawn lying on their sides,
        with the odd "zzz". The noises that wake them: any blow (yours or a horror's), a rhyme,
        a scroll read aloud, a potion smashing, bumping into a wall, and the clock striking.
        Woken, they're frantic for 8 turns; left alone, they get up calmly.
      - **Tougher horrors in the middle floors: Claude suggests not yet.** In the bot games
        above, no bot that could die got past floor 3, and the crossing bots died on floors 3 to
        5 more often than not even with the candle lit. JW to decide after playing.
    - **Weapons come too late.** Each floor has one guaranteed piece of gear, a coin toss between
      a weapon and something to wear; in one of Claude's runs the first weapon was on the last
      floor. Options offered: (1) start with the Spork of Sorrow in hand (the opening verse
      says "Take a spork and a snack"); (2) the first floor's guaranteed gear is always a
      weapon; (3) the guaranteed gear alternates, weapon on floors 1, 3 and 5; (4) leave it.
      JW: "2". Settled: floor 1's guaranteed gear is always a weapon. Later floors as now.
      **Built** (11 November). Which floors do this is `RULES.loot.weaponFloors`.
    - **Full pockets.** Ten pockets (keys 1 to 9 and 0), full by floor 3 in Claude's play,
      mostly with repeats. Options offered: (1) identical things share a pocket; (2) more
      pockets; (3) a sort key; (4) leave it. JW: "display the items in inventory grouped and
      counted by type, but leave pocket capacity as is". Settled: you can still carry 10
      things, and each still takes a pocket. What changes is the display: identical things
      are shown once with a count ("Mumble-Muffin ×2"), and things of the same kind sit
      together (food, potions, scrolls...). Claude's reading for building: the number keys
      follow the rows as shown, so 1 uses the first row, and using a row uses one of that
      thing. **Built** (11 November). Rows go food, potions, scrolls, weapons, things to wear,
      pairs of socks, lone socks. Two things share a row only if they are the same in every
      way, so a plain Spork and a +1 Spork get separate rows. The margin heading reads "Pockets 7 of 10".
    - **Checking the rules-and-balance work** (11 November, a fresh session). Claude checked the
      group above with fresh eyes: all tests pass, the new things were looked at in a real
      browser in both the folder and single-file versions with a clean console, and no bugs were
      found. Three things the last session decided while building change how the game plays, so
      they came back to JW, one at a time:
      1. **Who gets bolder.** Asked: with your candle out or at the highest fear, every awake
         horror moves a quarter faster, including the Tuck-You-In (which can't be killed) and the
         final boss. Well past bedtime in the dark, the Tuck-You-In would move 1.4 steps for each
         of yours (before, at most 1.15) and catch you every time; the boss would be faster for
         most of the final fight, and no bot game reaches the boss to measure it. Options offered:
         (1) keep it for both; (2) leave both out, so only ordinary horrors get bolder; (3) leave
         out the Tuck-You-In only. Claude suggested 2: bedtime is already the timer, and a change
         to the boss should be its own decision. JW: "2". Settled: the Tuck-You-In and the boss
         never get bolder. **Built** (11 November): `RULES.bold.exempt` lists them.
      2. **When nap time ends quietly.** Asked: if you stay quiet and the 30 turns of nap time
         run out, every napper gets up awake and hunts you, including horrors that were fast
         asleep before nap time began, so a quiet nap leaves the floor more dangerous than before.
         Options offered: (1) keep it, so staying quiet only delays the trouble; (2) everyone goes
         back to how they were: horrors asleep before nap time stay asleep, ones awake get up
         awake. Claude suggested 2: it matches "left alone, they get up calmly" and rewards
         tiptoeing. JW: "2". Settled: a quiet end to nap time puts each horror back as it was.
         Being woken by a noise is unchanged (all at once, frantic). **Built** (11 November).
      3. **How low trembling can push your odds of getting away.** Asked: trembling takes 15
         points off your chance of breaking away, after the usual lowest limit of 20%. In practice
         the lowest odds are 15% against the Tick-Tock Tot (normally 30%) and 20% against the
         Tuck-You-In (normally 35%); every other horror stays above 20%. Options offered: (1) keep
         it as it is; (2) never below 20%; (3) leave the Tuck-You-In's 35% alone. Claude suggested
         1: trembling is about your own hands, so it fairly applies to every horror. JW: "1".
         Settled: no change.
      **The comparison** (`tests/measure.js`, before and after the first two changes): the same
      numbers almost everywhere. Deaths by floor stayed 9, 18 and 12 on floors 1 to 3, and every
      floor crossing came out exactly the same. Only the health lost per 100 steps changed: in the
      dark, 16.7 to 15.3; at the highest fear, 43.5 to 38.6. The bots seldom meet the Tuck-You-In
      and never reach the boss, and they are rarely quiet through a whole nap, so these changes
      barely show in bot games; they matter in a long, careful run.
    - **Tougher horrors on floors 3 to 5?** (the question left open above). Asked: in 40 bot games
      none got past floor 3; with the candle lit and calm, a bot crossing one floor with 60 health
      died 3 in 8 times on floor 3, 5 in 8 on floor 4 and 7 in 8 on floor 5; but the bots play
      badly on purpose, and the hand-played run that found these floors too easy came before the
      surprises, bolder horrors and trembling. Options offered: (1) not yet: JW plays this version
      first and it is decided after; (2) tougher horrors there now; (3) more horrors there now;
      (4) no, and close the question. Claude suggested 1. JW: "1". Settled: no change for now;
      the question stays open until JW has played this version.
    - **How you play, 1: should a rhyme become a choice?** Asked: today there is one kind of rhyme,
      which shoves, stuns and hurts every horror within three steps and calms you a lot, so there
      is never a reason not to rhyme. Options offered: (1) three kinds of rhyme, picked before you
      recite: a shove (as now), a lullaby (nearby horrors fall asleep, no harm done) and a
      tongue-twister (heavy harm to one horror, the rest untouched); (2) the choice inside the
      couplet, each word on offer doing something different; (3) keep one kind and fix only the
      cost. Claude suggested 1. JW: "1". Settled: three kinds of rhyme. **Built** (11 November).
    - **How you play, 2: what should a rhyme cost?** Asked: today a rhyme costs one ♪, a ♪ comes
      back every 30 turns, and you can hold 3 (more as you level up), so it feels free. Options
      offered: (1) each rhyme burns candle wax, the tongue-twister most; (2) your voice gets
      hoarse: a rhyme soon after the last one gets a shorter fuse and trickier words, and resting
      brings your voice back; (3) a ♪ comes back every 60 turns instead of 30; (4) no extra cost.
      Claude suggested 1. JW: "2". Settled: a hoarse voice. A ♪ still costs one ♪ as now.
      **Built** (11 November).
    - **How you play, 3: what reason should there be to go into the dark?** Asked: "the dark" is
      not a place but your own light shrinking (candle low or out, the clock's lights-out on floor
      5, hiding in a barrel), so you cannot choose it. Options offered: (1) a key blows out and
      relights your candle, and in the dark the ink shows things the light hides (loot, a door, a
      shortcut); (2) dark rooms with a prize: some rooms are always dark, whatever your candle,
      and always hold something good; (3) rhymes are stronger in the dark; (4) leave it. Claude
      suggested 1. JW: "2. for #1, is there a mechanic to relight the candle?" Answered: no; the
      only way a candle lights again is walking onto a candle stub, and there is no way to blow
      it out on purpose. Settled: dark rooms with a prize. Claude will choose the details while
      building (about one per floor, the prize a piece of gear a little better than the floor
      usually gives) and show them to JW afterwards. **Built** (11 November).
    - **How you play, 4: tricks for the plain horrors.** Asked: most horrors just walk at you;
      only the Put-Away, the Nothing-to-Worry-About, the Ahem and the Empty Sandwich do something
      you can outwit; in bot games the Second Opinion and the Mumbling Mold-Mite were the biggest
      killers. Options offered: (1) a trick for every plain horror (eight); (2) a trick for the
      three you meet most: the Mumbling Mold-Mite, the Second Opinion and the Tick-Tock Tot;
      (3) leave it. Claude suggested 2. JW: "2." Settled: tricks for those three, each proposed
      to JW one at a time. **Built** (11 November), as the three entries below.
    - **JW's note for the "how it looks" group: the candle status needs to be better.** JW: "the
      candle status needs to be better. maybe an illustrated candle that has a fill level?" Today
      the margin's drawn candle does shrink as wax burns, but against the most wax a candle can
      ever hold (450), with no outline of a full candle to compare, so an ordinary candle looks
      short and the amount left is hard to judge. To be taken up with that group.
    - **Trick 1 of 3: the Mumbling Mold-Mite.** Asked: it mumbles lullabies, apologizes while it
      nibbles, and in its own verse ends up sitting in your lap; today it just chases and bites.
      Options offered: (1) it would rather sit in your lap: stand still next to it instead of
      fighting and it climbs into your lap and falls asleep, harmless and riding along, until any
      noise wakes it and it bites, apologizing; (2) its mumbling is a warning: louder as it nears,
      quiet just before it bites; (3) its lullaby makes you drowsy (a lost turn) unless you hum
      back with a rhyme. Claude suggested 1. JW: "1". Settled: the Mold-Mite sits in your lap if
      you let it. **Built** (11 November).
    - **Trick 2 of 3: the Second Opinion.** Asked: a doctor-ish horror ("Let's have a look at
      you", "I DISAGREE!") and the biggest killer in bot games. Options offered: (1) it takes
      notes: after each blow that lands it stops a turn to write down its findings, giving you a
      free turn; (2) it always disagrees, doing the opposite of you (Claude noted this does
      exactly what its name says, which the naming rule warns against); (3) it calls for another
      opinion: if a fight with it drags on, a second Second Opinion arrives, so it gets more
      dangerous, not less. Claude suggested 1. JW: "3". Settled: it calls for another opinion.
      Claude will choose the details while building (how long a fight must last, and that each
      one calls only once, so they don't multiply without end) and show them to JW afterwards;
      the danger measurements before and after will show what it does to deaths. **Built** (11
      November).
    - **Trick 3 of 3: the Tick-Tock Tot.** Asked: a wind-up toy with a key in its back, the
      fastest horror, whose verse says it ticks when it's coming. Options offered: (1) it winds
      down: after a few turns of running it stops for a couple of turns to wind itself up again;
      (2) turn its key: step into it from behind and it totters off backwards (needs a drawing
      that shows which way it faces); (3) you can hear it coming: its ticking shows through walls
      as written "tick... tock", and it goes silent just before it pounces. Claude suggested 1.
      JW: "3". Settled: you can hear it coming. **Built** (11 November). The game already had some
      of this (a ticking sound within 10 steps, and a written "tick…" now and then); it now writes
      "tick…" and "tock…" every turn and goes silent within 3 steps.
    - **JW's note: the eyes in the dark** (for the "how it looks" group). JW: "there are eyes in
      the dark in the game...but rarely actual monsters when you get to that areas. i think we
      need a creepy sense of things in the dark...but those eyes imply an actual thing might be
      there, just not what. should there be monsters somewhere where there are eyes? should we
      change the creepy things in the dark visual implications to something more abstract? both?
      something else?" Claude explained: there are two kinds of eyes that look the same, real
      ones for an awake horror you can't see and made-up ones that belong to nothing (more often
      the more frightened you are), so eyes teach you to ignore them; and JW's theme rules out a
      creature that hides in the dark and jumps out. Options offered: (1) eyes always mean
      something real, and the made-up dark becomes abstract and on-theme (ink creeping in, words
      written in the dark, a smile with no face, a toy that wasn't there); (2) monsters where the
      eyes are; (3) both, with an abstract thing sometimes becoming real at the highest fear;
      (4) eyes tell the truth only when you are calm. Claude suggested 1. JW: "1". Settled: eyes
      only for real horrors; the made-up things in the dark become abstract. To be built with the
      "how it looks" group.
    - **How you play: built** (11 November). Details Claude decided while building, which JW has
      not yet seen:
      - Rhymes: R opens a page asking "Which rhyme?": ← ↑ → or 1 to 3 pick a shove, a lullaby or a
        tongue-twister; Enter repeats the last kind; Esc changes your mind with no ♪ spent and no
        turn taken. All three calm you as much as a shove always did. A wrong word does what a wrong
        word always did, whatever the kind.
      - The lullaby: horrors within 3 steps lie down asleep for 12 turns, unhurt, drawn lying on
        their sides. They don't move or see you. Any noise (the same noises that end nap time)
        wakes every one of them, cross but not frantic. After 12 turns they are simply asleep,
        and wake as usual if they see you. The Tuck-You-In and the Nibbler can't be sung to sleep:
        they hum along and are stunned, as by a shove.
      - The tongue-twister: the nearest horror within 3 steps takes 6 to 10 and reels for 2 turns
        (the Nibbler for its usual 2). Nobody else is touched.
      - The hoarse voice: a rhyme within 30 turns of the last makes you one stage hoarser, up to 3.
        Each stage burns the fuse 1.5 seconds shorter (never below 4 seconds) and blots out about an
        eighth of the letters of each word on offer (never a whole word). Every 25 turns without a
        rhyme brings one stage back. The margin says "hoarse · 2". The Last Rhyme is never affected.
      - Dark rooms: one on each of floors 2 to 5, never the room you start in, the stairs' room or
        an odd room's. Inside, your light shrinks to one step whatever your candle, and it counts
        as the dark (fear rises as in the dark). From outside you can't see more than one step
        into it. Its prize is a piece of gear rolled as if the floor were one deeper. Horrors can be
        in it like anywhere else. The first glimpse of a doorway brings a line from the narrator
        and a small shiver of fear; the first step inside, another line. On the map, the parts of
        it you've seen stay inked over, and its doorways hang with drips of ink.
      - The Mold-Mite: waiting (space or .) while an awake Mold-Mite is directly beside you, not
        frantic and not stunned, puts it in your lap on that turn instead. It is drawn small and
        lying down beside you, and the margin says so. Several can pile in. Any noise wakes them
        all: each hops down right beside you (never on a diagonal) and bites once. At the stairs
        they hop out and stay behind.
      - The Second Opinion: counts the turns it spends fighting you (beside you and awake); at 4 it
        calls. The colleague appears 5 to 10 walking steps away, somewhere you can't see, awake. It
        can't call another, and each one calls only once. If there's nowhere for a colleague to come
        from, the call goes unanswered (and still counts as its one call).
      - Two recorded test scenarios changed so they still do what they were for: the Mold-Mite that
        kills you in the "deaths" scenario is made frantic (otherwise it would settle in your lap
        while you wait), and the bedtime scenario keeps the Tuck-You-In 6 to 12 steps away instead
        of relying on the floor's layout.
      **The comparison** (`tests/measure.js`, before and after this group):
      - 40 full games by a bot that can die: deaths on floors 1, 2 and 3 went from 9, 18 and 12 to
        8, 24 and 8; the average deepest floor from 2.1 to 2.0. Second Opinions killed 19 bots
        instead of 16.
      - Crossing one floor to the stairs with 60 health, 8 tries each, how many died:

        | Floor | Lit and calm, before → after | Candle out and highest fear, before → after |
        | --- | --- | --- |
        | 2 | 1 → 1 | 1 → 4 |
        | 3 | 3 → 3 | 6 → 6 |
        | 4 | 5 → 3 | 8 → 7 |
        | 5 | 7 → 8 | 8 → 8 |

      - So: somewhat more dangerous, mostly on floor 2, where the Second Opinion now brings a
        colleague. The dark rooms also change every floor's layout, so differences of one or two
        are noise. The bot doesn't use the new rhymes or the lap on purpose (it presses keys more
        or less at random), so a player who does will find the game a little easier than the bot
        does, and one who rhymes constantly will find it harder.
    - **No more danger measurements.** JW (11 November): "in the future, we don;t need a danger
      measurement check." Settled: later groups are built without running `tests/measure.js`
      before and after.
    - **Working from GitHub only.** JW (11 November): "if my filesystem, id like you to commit/push
      everything and we can start working exclusively from the github repo." Settled: from the
      next session on, the work happens in the GitHub repository, not in the folder on JW's Mac.
    - **Reviewing "How you play: built"** (11 November, a fresh session, working from GitHub). All
      tests pass and both versions run in a browser with a clean console. Claude walked JW through
      the details above. Claude's view: all are tuning to keep except two real choices, the Second
      Opinion's colleague and the lullaby not working on the Tuck-You-In and the boss; for the
      lullaby Claude suggested keeping it as built, since it matches JW's choice that those two
      never get bolder, and asked only about the colleague.
      1. **How should the Second Opinion's colleague arrive?** Asked: the Second Opinion was
         already the biggest killer, and with the call added, bot deaths on floor 2 rose from 18
         to 24 out of 40 games. Right now the colleague just appears somewhere you can't see; the
         only sign is a line in the story strip ("Somewhere a door opens…") as it arrives. That is
         close to "a creature hides in the dark and jumps out", which the theme rules out. Options
         offered: (1) keep it as it is; (2) you can see it coming: its footsteps are written in the
         dark where it walks (squeak… squeak…), the way the Tick-Tock Tot's ticking already is, so
         you know which way it's coming from and can finish the fight or leave; (3) it calls later,
         after 6 turns of fighting instead of 4, still arriving unseen. Claude suggested 2. JW: "2".
         Settled: the colleague's footsteps are written in the dark where it walks, until you can
         see it.
      2. **Where should the project tracking live?** Asked: the plan, the record of decisions and
         the session notes are text files in the repository, saved with every push. Options
         offered: (1) stay in the repository files: every decision is saved with the version of the
         game it produced, and every session already reads them first, but they are plain text on
         GitHub; (2) move to a Claude artifact: nicer to read, easy on a phone, but it lives apart
         from the game, can drift out of step, and isn't in the game's history; (3) both, the files
         official and an artifact as a readable copy, which is one more thing to keep updated.
         Claude suggested 1. JW: "1." Settled: tracking stays in the repository files.
      3. **JW's note: waiting is barely used.** JW: "the mold hood into your lap but the wait
         button is so under used I didn't even know it existed and it's my game. We need to make
         wait.more useful. "Wait still in silence and hope nothing gets you" - some sort of rhyme
         around that. Small chance the monster nearby doesn't attack you and moves away, but more
         damage if it does attack you?" Taken up as the next question.
      4. **How should "hold still and hope" work?** Asked: suppose a Second Opinion is beside you
         and you press space. A narrator couplet sets it up, something like "Stand very still, and
         say nothing at all, / and perhaps it's somebody else it will maul." Then either it loses
         interest and wanders a few steps off, or its next blow lands half again as hard (a 4
         becomes a 6). Whichever option, the Mold-Mite still climbs into your lap as now, the
         Tuck-You-In and the boss never wander off, and the help line at the bottom of the margin
         gains "space hold still". Options offered: (1) fixed odds, about 1 in 4 that it wanders
         off; (2) odds that depend on your fear, about 1 in 3 when calm down to about 1 in 8 at the
         worst stage; (3) odds that depend on the horror, slow dim ones wandering off easily and
         sharp ones rarely. Claude suggested 2. JW: "1 for now. Easy to change later." Settled:
         fixed odds of about 1 in 4. **Built** (11 November), with the colleague's footsteps from
         question 1. Details Claude decided while building:
         - "Beside you" means one step away, not on a diagonal (as for every fight), and only an
           awake horror that is fighting you counts: not one asleep, stunned, dazed, scared,
           napping, sung to sleep, or a Put-Away running off with your things.
         - With several horrors beside you, each one rolls on its own.
         - The couplet goes through the same breaking as the narrator's other rhymes, so at high
           fear its last word can fail to arrive. Three couplets, picked at random; they are in
           `TEXT.holdStill`.
         - Wandering off lasts 3 turns. It walks away from you, says so in the story strip, isn't
           holding onto you (stepping away from it is free), and you don't hold onto it either.
         - Otherwise nothing is said until its next blow: then "…was only waiting for you to stop
           moving" and the blow is half again as hard, rounded up. The extra goes into that next
           attack whether it lands or misses, and is forgotten if you get away from it first.
         - The help page line is now "SPACE or .  hold still, and hope."
         - The colleague's footsteps are "squeak…", written every turn where it is until you first
           see it, and then never again. No new sound yet (left for the sound group).
         - Numbers in `RULES.holdStill`.
      5. **JW's note: a mobile version.** JW: "Also note in the plan that we need a mobile
         version". Noted: the game needs a version that works on a phone (today it needs a desktop
         browser and a keyboard). Not yet discussed how; to be taken up as its own item.
    - **How it looks, 1: bringing the eerie look forward** (11 November). Asked: today the page
      only goes wobbly, leaning and ink-soaked as your fear rises, so a careful player stays calm
      and sees a cute storybook the whole way down. Options offered: (1) a little wrong from the
      start: slight wobble, lean and ink at the edges even when calm, so the jump from calm to
      terrified looks smaller; (2) eerier the deeper you go: floor 1 as now, each floor down
      starting a step further along, so the bottom floor looks "afraid" even when calm, and
      everyone sees the full eerie look by the end; (3) eerie moments: the page lurches to the
      full terrified look for a few seconds when you meet a horror for the first time, step into a
      dark room, or a floor surprise starts, then settles (could feel like a gimmick); (4) leave
      it. Claude suggested 2. JW: "2 and 3?"
      Claude proposed the shape: the page always looks at least as frightened as the floor (floor 1
      as now, the bottom floor about "afraid" even when calm); only the look changes, and everything
      fear does in play (whispers, made-up things at the edge of the light, broken rhymes, the
      shorter fuse, trembling) stays tied to real fear; eerie moments when each kind of horror first
      appears in a run, on the first step into a dark room, when a floor surprise starts and when
      the Tuck-You-In arrives, no more than one every 50 turns or so, gentler with calmer effects
      (F). JW: "Eerie moments: just make them infrequent but random?" Settled: the depth and
      look-only parts as proposed; eerie moments come at random times, not tied to events, and
      seldom (Claude's numbers: about once a floor on average, never two within 50 turns), gentler
      with calmer effects.
    - **How it looks, 2: calm horrors drawn slightly wrong** (11 November). Asked: today the calm
      drawings are simply cute (the Second Opinion is a round teal creature with a toothy grin, eyes
      on stalks and a notebook), and the theme asks for happy things that are plainly wrong.
      Options offered: (1) one wrong detail each, always, cute at a glance and wrong on a second
      look (the Second Opinion's smile has a second row of teeth behind the first and one eye-stalk
      looks the other way; the Mold-Mite has one too many little arms), 13 drawings to adjust;
      (2) wronger as the page gets eerier (depth, fear, eerie moments), so floor 1 stays cute for a
      calm player; (3) both: one wrong detail always, more creeping in as the page gets eerier.
      Claude suggested 3. JW: "3." Settled: both.
    - **How it looks, 3: hand-inked lettering** (11 November). Asked: the map, margin and verse
      pages use a book typeface (Baskerville) only Macs have, falling back to Georgia elsewhere; the
      help page, legend, pockets and log use a typewriter font (Courier); none of it looks hand-made.
      Options offered: (1) book type printed like ink everywhere, typewriter dropped: letters
      slightly off their line, uneven darkness, the odd blot, trembling more as the page gets
      eerier; nothing added, but non-Macs still look different; (2) a free hand-lettered font built
      into the game file (about 50–100 KB) for headings, labels, the margin and the help pages,
      replacing the typewriter, with the long verse staying in book type; the same on every
      computer, which helps the web and later phone versions; (3) letters drawn with the wobbly pen,
      only for titles; (4) leave it. Claude suggested 2, with option 1's ink treatment on the book
      type for the verse. JW: "2". Settled: a built-in hand-lettered font for headings, labels, the
      margin and the help pages; the verse stays in book type, printed like ink. Claude picks the
      font while building and shows it to JW; it is easy to swap.
    - **How it looks, 4: ink that looks like ink** (11 November). Asked: every line is drawn the
      same thickness all along and shading is flat colour; real pen-and-ink has lines that go thick
      and thin as the pen presses, blots where the pen paused, and shadows made of crossed lines.
      Options offered: (1) all three, always: the most ink-like, but a busier map and some drawing
      speed; (2) thick-and-thin lines and blots only, flat shading stays; (3) thick-and-thin lines
      and hatching always, with blots that get more frequent as the page gets eerier (a careful hand
      on a calm page, spilled ink on a frightened one). Claude suggested 3. JW: "3". Settled: 3.
      The "how it looks" group has now all been discussed, with the candle and the eyes decided
      earlier; it is built next.
    - **How it looks: built** (11 November). All six: the eerie look forward, the calm horrors
      drawn wrong, the hand lettering, ink like ink, the candle and the eyes. Details Claude decided
      while building, which JW has not yet seen:
      - **Eerier with depth:** the page looks at least as frightened as floors 1 to 6 set it (none,
        then a little more each floor; the bottom floor just past where "afraid" starts). From
        floor 5 down that brings the thin ink tendrils even when calm. Numbers in `RULES.look.floor`.
      - **Eerie moments:** each turn a 1 in 200 chance, never two within 50 turns (in a long test,
        22 in 4000 turns, about one every 180). The page lurches up in a quarter of a second, holds
        half a second, and eases back over about two and a half seconds; with calmer effects (F) it
        goes half way. They are worked out from the run, the floor and the turn, not from the
        game's dice, so they can never change what happens in play. No sound yet (sound group).
      - **Only the look:** whispers, the made-up things at the edge of your light, broken rhymes,
        the shorter fuse, trembling, bolder horrors and the log turning to static all still follow
        your real fear.
      - **Wrong horrors:** one thing always: the Mold-Mite has one arm too many; Yesterday's Soup has
        a finger poking up out of it; the Put-Away has fingers curled over its drawer from inside;
        the Second Opinion has a second row of teeth and one eye looking somewhere else;
        Better-Late-Than-Never has a third leg; the Ahem's polite fist has one knuckle too many; the
        Nothing-to-Worry-About lets its tongue hang out; the Empty Sandwich has a single tooth in its
        missing filling; the Tick-Tock Tot has a second key on its head; Bottom Half – Giraffe has a
        leg with two knees; the Sockling has a real toe poking out; the Tuck-You-In's nightcap bobble
        is an eye; the Nameless Nibbler has one eye far bigger than the other. More once the page is
        eerie (fading in between 0.3 and 0.5 of the way to the worst look): a third eye on the
        Mold-Mite, more fingers and an eye in the soup, teeth along the Put-Away's top drawer, a third
        eye-stalk on the Second Opinion, Better-Late's smile running past its face, a mouth on the
        Ahem after all, more eyes inside the Nothing-to-Worry-About, something looking out from the
        sandwich, the Tot's eyes turning into clock hands, drool coming down from the top of the
        Giraffe, a mouth opening in the Sockling's stitching, far too many feet under the
        Tuck-You-In, and a second, smaller mouth on the Nibbler. They are small, as a second look
        should be; all in `WRONG` in `js/draw/sprites.js`.
      - **Hand lettering:** the font is Patrick Hand (free, SIL Open Font License, about 24 KB,
        kept inside the game with its licence). It is used for the margin, the section headings,
        "The Story So Far" heading, the face-off card, and the help, pockets, gear, log and
        graveyard pages (which were the typewriter font). Left in book type: the verse pages, the
        title page, the story strip's lines, the news ribbon, speech bubbles and the sounds written
        in the dark.
      - **Verse printed like ink:** each letter sits a little off its line and comes out slightly
        darker or lighter, with the odd blot by a letter; the letters tremble and blot more as the
        page gets eerier.
      - **Ink:** every line has a stretch in its middle pressed harder; filled shapes bigger than a
        small item are hatched with fine diagonal lines on their lower right, with a crossing set in
        the deepest corner once the page is over a third of the way to its worst; paper-coloured
        cards, bubbles and panels are never hatched. Blots at the start or end of about 1 stroke in
        80 on a calm page, rising to about 1 in 6 at the worst (`INK_BLOT`). Frame time in the
        test's software drawing went from about 12–16 to 16–18 milliseconds; a browser draws much
        faster.
      - **The candle:** a faint outline of the fullest candle there can be (450 wax), with your
        candle standing inside it at its real height. Nothing else was added to it (marks at each
        quarter were tried and taken out, as not asked for; easy to put back).
      - **Eyes:** made-up eyes are gone from the map. Eyes in the dark are only ever an awake horror
        you can't see. The made-up things are a wide smile with nobody behind it, a toy that wasn't
        there (a striped ball, a spinning top, a lettered block), and ripples spreading in the ink;
        they come exactly as often as the made-up eyes did. The eyes peering in at the edges of the
        title page are left as they were.
      - **Not changed, for JW to decide:** the made-up horrors and treasures that appear at the edge
        of your light when you are frightened (they are drawn as real horrors and things, then
        vanish). They are not in the dark, so the eyes decision didn't cover them, but they do teach
        that what you see might not be there.
        **Asked** (11 November): when you're frightened, a fake horror or a fake treasure sometimes
        appears just inside your light, then vanishes; it's not in the dark, so the eyes decision
        didn't cover it, but it teaches the same lesson the made-up eyes did. Options offered:
        (1) keep them as they are; (2) make them unmistakably wrong: drawn in pale, scratchy ink, so
        a careful player can tell they're not real; (3) replace them with the abstract things (a
        faceless smile or a toy at the edge of your light). Claude suggested 2. JW: "2." Settled:
        the made-up horrors and treasures at the edge of your light are drawn so they are
        unmistakably not real. **Not built yet:** JW asked for a hand-off to a fresh session first;
        the next session builds it. (Today they are drawn at a little over half strength with
        scratchy lines; "unmistakably" means going clearly further, such as pale paper-coloured ink
        with the outline broken up, so no careful player mistakes one for a real horror.)
      - Tests: a new suite, `tests/suites/looks.js` (17 checks). The golden transcript was
        re-recorded: the menu pages are now written in runs of hand lettering, not typed one letter
        at a time, so the recording groups their words differently; the toy block's letter shows up
        as drawn text; and one measurement now counts the made-up things in the dark instead of
        made-up eyes (same count, 182). Nothing that happens in play changed in any scenario.

Everything below this line is **proposed by Claude and not yet agreed**. Treat the lists as
possibly incomplete.

## Order of work (proposed)

1. Finish the restructure in `../sillygame/`.
2. Replace the borrowed Seuss material, as one deliberate change.
   - Why after the restructure: the restructure checks itself by comparing the game's text word
     for word against a recording. Renaming things midway would break that check. The restructure
     also moves most text into its own files, which makes the renaming much easier.
3. Make the improvements below, one at a time, playing the game after each.

## What Claude found by playing (10 November 2026)

Claude played the current game in a browser: one run by hand (about 340 turns, died on floor 2)
and a second run mostly driven by a simple key-pressing script (reached the final boss and died
with the boss at 17 of 80 health). Claude could not hear the sound.

- The writing is the strongest part. It is funny throughout.
- The tall-grass floor, the Birthday Room ambush, the bedtime stalker and the boss all work.
- With the candle out and Dread at its highest, the game looks properly eerie. In its calm state
  it looks cute.
- **Main finding: the scariest parts do not hurt the player.** The script crossed a whole floor
  with no candle and Dread at its highest and lost almost no health. A careful player never sees
  the game's best look, and a careless one is not punished.
- Rhymes refill constantly, hit everything within three steps, and the right answer is obvious.
  Rhyming is a free win.
- Apart from one ambush, the middle floors were not dangerous.
- Not tested: running away from a fight, and anything to do with sound.

## Proposed improvements, by category

### Identity (replacing the Seuss material)

- Replace everything borrowed. Seen so far: the title, the striped hat (title screen, the hat
  item, the tea party guest, the tombstone), most monster names, the green eggs and the ham,
  some scroll titles, and several rhyming couplets. This list comes from play, not from a full
  read of the text. A full pass through all text and drawings is needed.
- Build the new identity on what is already the game's own: a bedtime story that does not want
  you to wake up. The bedtime stalker, the music box, the town of Glum and a monster that eats
  names all fit this and borrow nothing.
- Traditional nursery rhymes ("Row, row, row your boat", "Twinkle, twinkle") can probably stay,
  since they are traditional and not from the Seuss books.
- A new title and new monster names are JW's to choose.

### Storytelling

- Let the choices made in the hand-built rooms lead to different endings: you get your name
  back, you get the wrong name, or you become the next name-eater.
- Shorten the opening verse on repeat runs. It currently replays in full every time.
- Let the player's earlier dead characters matter more.

### Visual

- Bring the eerie look forward so players see it without playing badly.
- Redraw the calm-state monsters to look slightly wrong, not cute.
- Replace the plain typeface with hand-inked lettering.
- Make the ink look like ink: uneven pressure, blots, cross-hatched shading.
- No change of graphics engine. The current drawing method can do all of this, and moving
  engines would cost a rewrite for no gain in creepiness.

### Gameplay mechanics

- Make each rhyme a choice between different effects, and give it a cost.
- Give the player a reason to go into the dark, such as loot or stronger rhymes there.
- Give the plain monsters a trick the player can outwit.

### Rules and balance

- Give darkness and the highest level of Dread real consequences.
- Make the middle floors more dangerous.
- Put weapons on earlier floors. In one run the first weapon appeared on the last floor.
- Enlarge the pockets or make them easier to sort. They were full by floor 3.

### Controls and interface

- Give the Enter key one job. It currently shows the next line of verse, confirms a room
  choice and takes the stairs, so skipping verse can pick a room option before the player has
  seen it.
- Stop the fight card from covering monsters.
- Add an "always attack" option, so walking into a monster does not ask what to do every time.
- Add save and resume. A run takes 20 to 30 minutes and closing the tab loses it.

### Sound

- Not judged. It needs JW's ears.

## Regular content updates

JW asked whether new content will be easy to add after the restructure. Going by the restructure
plan as written:

- **Easy:** new writing, tuning numbers, new items, simple new monsters.
- **Moderate:** a monster with its own drawing or its own trick; a new hand-built room (it needs
  words, effects and a drawing).
- **Harder:** a new floor with its own rule.
- **Maps:** there are no hand-made maps. The game builds a new layout every run. New kinds of
  layout mean changing that builder.
- **Proposed follow-on:** after the restructure, write a short recipe for adding a monster, a
  room and a floor, so every update follows the same steps.
