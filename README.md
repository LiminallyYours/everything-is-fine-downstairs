# Everything Is Fine Downstairs

*A most unfortunate descent, in rhyme.*

A small turn-based horror-comedy roguelike, drawn in wobbly ink on old paper, that runs in your browser. Something crept
into the town of Glum overnight and nibbled your name. You are now "Somebody #N". Go down six
floors beneath the town and take your name back from the **Nameless Nibbler**, before your
candle goes out and before bedtime comes for you.

## Running it

**On the web:** https://liminallyyours.com/everything-is-fine-downstairs/ (GitHub Pages, served
straight from this repository, LiminallyYours/everything-is-fine-downstairs). Play it on a
computer with a keyboard, or on a phone held upright (see "On a phone" below): it's the same page,
and it switches to the phone layout by itself. Saves and the graveyard stay in each browser, so
the web copy, your phone and a copy on your Mac each keep their own.

**On your Mac:** there's nothing to install. Double-click **`index.html`** (or drag it onto Safari or Chrome),
keeping the `js/` folder next to it. From Terminal: `open index.html`.

**One file to share:** `dist/everything-is-fine-downstairs.html` is the whole game in a single file,
which you can email or drop into a chat. After changing anything in `js/`, rebuild it with
`python3 build.py`. The single file keeps its own graveyard and bestiary, because browsers
store those per file.

dist/ is not in git; run python3 build.py

**Turn the sound on.** Every sound is synthesized live in the browser, with no audio files.
Browsers won't play audio until you press a key (or tap), which is why the game opens on a
"press any key" screen. On an iPhone, the silent switch also has to be off.

## Controls

| Key | What it does |
| --- | --- |
| Arrow keys | Walk. Walk into a monster to face it: a card asks whether to **A**ttack, **R**hyme, **U**se something, or back off (**Esc**). Pressing the same arrow again attacks. Walk into a barrel to hide inside it (Floor 1). |
| `A` | Attack whatever is next to you, or whatever just went for you. |
| `U` | Use something from your pockets on the monster next to you. Potions can be **thrown** (`T`): poison it, daze it, scare it off, or, oops, heal it. |
| `G` | Pick up what's here. Walking onto an item only tells you it's there. Gold and candle stubs are still scooped up automatically. |
| `E` | What you wear and wield: four slots (hand, head, body, feet), separate from your pockets. Put things on or take them off; each change takes a turn. |
| Space or `.` | **Hold still, and hope.** With an awake horror beside you, it's a gamble: about one time in four it loses interest and wanders off for a few turns, and otherwise its next blow lands half again as hard. The Tuck-You-In and the final boss are never fooled. With nobody beside you, it just passes a turn. |
| `R` | **Recite a Rhyme.** First pick which kind (← ↑ → or 1–3; Enter repeats the last kind; Esc changes your mind for free): **a Shove** (horrors within 3 steps are stunned, shoved and hurt a little), **a Lullaby** (horrors within 3 steps lie down asleep, unhurt, until any noise wakes them) or **a Tongue-Twister** (the nearest horror is hurt badly and reels). Then you get half a couplet and a burning fuse; pick the rhyming word with an arrow key (or 1–4). The fuse lasts 12 seconds when you're calm, down to 7.5 when you're coming undone. If you're wrong, something embarrassing happens. Costs 1 ♪. Rhyme again soon after and your voice goes **hoarse**: a shorter fuse and smudged words, for a while. |
| `I` | Your pockets (↑↓ choose, Enter use or wear, D drop, E equipment, Esc close). |
| `1`–`9`, `0` | Use the item in that pocket slot. |
| `>` or Enter | Go down the stairs while standing on `>`. |
| `L` | Message log. |
| `Q` | Give up and return to the title (press twice). To close the game entirely, close the browser tab (Cmd+W). |
| `?` | Help. |
| `M` / `V` / `F` | Mute sound / turn the narrator voice on or off / calmer effects (no shaking or flashing). |
| `S` | Skip: while a page of verse is still appearing line by line, show the rest of it at once (the narrator stops). |

On the title screen, **G** opens the graveyard and **B** opens the bestiary (B also opens it
during a run). If you left a run unfinished, **C** carries on with it.

## On a phone

Open the same web address on your phone and hold it upright: the game switches to a phone layout
by itself (held sideways, it asks you to turn it). Every tap is turned into the key press the
keyboard would send, so the game itself is exactly the same. A keyboard attached to the phone
works too. Where a line would tell you to press a key ("(G to pick it up)"), the phone says what
to tap instead ("(tap Pick up)"), and the small lettering is drawn a little larger. The music box
and each floor's hum play at half their loudness on a phone, so the narrator comes through a small
speaker.

- **The screen:** a slim line at the top (who and where you are, health, your candle, rhymes,
  coins, and the **menu** button), your conditions along the top of the map, the map (12 squares
  across), the last two lines of the story, and four buttons: **Hold still**, **Rhyme**,
  **Pockets**, **Pick up**.
- **Walking:** tap anywhere on the map and you step that way: the map is cut into four triangles
  meeting at you, so you don't have to hit an exact square. Hold your finger down to keep walking;
  you stop when you lift it, or when an awake horror comes into view, or a page or card opens, just
  as holding an arrow key does. Walk into a horror and its card asks what to do: tap attack, rhyme,
  use something, or back off.
- **Going downstairs:** stand on the stairs and tap yourself.
- **Rhyming:** tap Rhyme, tap the kind (or "never mind"), then tap the word that rhymes, from four
  big boxes.
- **Pockets and gear:** tap a row to choose it, then tap what to do with it (use or wear, throw a
  potion at a horror, drop; or, on the gear page, put it on or take it off).
- **Pages of verse:** a tap anywhere does what Enter does (the next line sooner). While a page is
  still appearing line by line, **tap here to skip** at the bottom (where "tap, to go on" will
  be) shows the rest of it at once. In the odd
  rooms, tap a choice; right after the verse finishes (or is skipped) there's half a second when a
  tap only highlights it, so you can't pick one unread.
- **The menu button:** what you wear and wield, the story so far (or tap the story strip), the
  bestiary, help, sound, the narrator's voice, calmer effects, and give up (tap it twice).
- **The title page** has separate lines to tap: carry on (when a run is saved), begin (or begin
  again), the graveyard, the bestiary, help. A tap anywhere else does nothing, so a stray tap can
  never throw a saved run away.

**Your run is saved as you go.** Close the tab or the browser whenever you like: next time, the
title screen offers to carry on from exactly where you were. The save is wiped when you die, win,
give up (Q twice) or begin again, so death is still for good. It lives in this browser only.

## How it looks

The whole game is a children's book gone wrong. There are no images: every monster, item,
wall and puddle is drawn live in shaky ink lines that are never quite straight or still.

- **Darkness is ink.** Wherever your light doesn't reach, ink has soaked into the page.
  Places you remember are left as a faint grey pencil wash.
- **Ink that looks like ink.** Lines swell where the pen pressed and thin where it lifted, and
  filled shapes are shaded with fine hatching on their shadow side. On an eerie page the hatching
  crosses in the deepest shadows, and the pen leaves more blots where it paused.
- **The deeper you go, the eerier the page.** Floor 1 looks calm; each floor down starts a step
  further along, and the bottom floor looks frightened even when you aren't. Now and then, at
  random and seldom (about once a floor), the page lurches to its worst look for a moment and
  eases back. This is only the look: your real fear still decides what fear does in play.
- **Nothing here is quite right.** Every horror has one thing wrong with it all the time (the
  Second Opinion's second row of teeth, the Mold-Mite's one arm too many), and more creeps in as
  the page gets eerier.
- **Your fear is in the drawing, not a number.** As Dread rises, the lines wobble harder, the
  whole page leans off true, strokes break up and double as if the pen were trembling, and
  the ink creeps closer. At its worst, thin tendrils crawl in from the dark toward you.
- **Hand lettering.** Headings, labels, the margin and the help pages are lettered by hand (the
  Patrick Hand typeface, built into the game so it looks the same on every computer). The verse
  is in book type, printed like ink: each letter a little off its line, the odd blot.
- **The margin is your character page.** It shows who and where you are, your health and
  progress to the next level, and your candle burning down inside a faint outline of the fullest
  candle there can be, so you can see how much is left (you're holding it on the map too).
  Beside that are your attack, defense, rhymes left (as notes) and coins. Below come what
  you're carrying, tags for conditions like *poisoned* or *a music box is playing…*, the
  horrors in view with tiny portraits and health dots, and your pockets.
- **What just happened is part of the picture.** Each turn's events appear on a paper ribbon
  three steps from you, then fade. It goes above, below or beside you, wherever it covers the
  least (monsters first, then stairs, then items), and never closer than three steps. The strip along the bottom,
  *The Story So Far*, keeps the running account, with the newest lines marked in yellow
  highlighter. Wounded monsters show a thin red health line under their feet.
- **Verse is set as verse.** The story, each floor's verse, bestiary pages, rhyme duels,
  your epitaph and the ending take over the whole page in large type. It appears one line at
  a time, and each line hangs a little too long. Enter brings the next line sooner; S (or skip, on a
  phone) shows the rest of the page at once.

- **Things move like drawings come to life.** You and the horrors hop from cell to cell, lunge
  when attacking, and flinch when hit. A slain horror gets scribbled out by a frantic pen and
  leaves an ink blot on the floor for good.
- **You can see sounds.** What you hear but can't see is written where it happens, pale on the
  ink: *tick…* from an unseen Tot, *ahem* from an unseen Ahem, *squeak…* from a Second Opinion's colleague on its way, *rustle* in the hair, *♪* as bedtime creeps closer, *psst…*
  when you're frightened, *BONG* when the clock strikes. Every horror also babbles in its own
  voice when it speaks.

## Meeting monsters, and what you carry

- **You choose how to face a monster.** Walking into one stops and asks: attack, rhyme, use
  something, or back off, with the monster's health shown. When a monster goes for *you*, its
  blow lands first. A moment later a red card says what happened ("gnaws you: −3", "missed",
  "picked your pocket!") and offers attack back, rhyme or use something. It doesn't block you,
  so you can try to get away instead.
- **Getting out of a fight is a gamble, for both sides.** Stepping away from a monster that's
  fighting you, backing off from its card, or taking the stairs with it on you only works some
  of the time: about 55% against a normal-speed monster, more against slow ones, less against
  fast ones, and about 35% against the Tuck-You-In. Fail, and you lose the turn and it swings
  again. Monsters trying to flee from you (scared ones, or a Put-Away with your things) roll the
  same way. A monster that's asleep, stunned, dazed or scared isn't holding onto you. Walking into
  a sleeping one and choosing *leave it be* costs nothing and doesn't wake it.
- **Picking things up is a choice.** Items stay on the floor until you press G. That matters
  for lone socks, which wake the sock graves when taken. Gold and candle stubs don't take a
  pocket, so they're scooped up automatically.
- **Your pockets hold 10 things, shown grouped.** Identical things share one line with a count
  ("Mumble-Muffin ×2"), food first, then potions, scrolls and gear, and the heading says how
  many pockets are used ("Pockets 7 of 10"). The number keys use a line, so 1 eats one of the
  two muffins.
- **Floor 1 always has a weapon lying about** somewhere, so you aren't stuck with bare fists.
- **Wearing and wielding is separate from your pockets.** Weapons go in your hand. Nests and
  colanders go on your head, coats and nightgowns on your body, and a matching pair of socks on
  your feet (they also help your dread fade). What you wear shows on your character and in the
  margin. The E page lists what from your pockets would fit each slot, and whether it's better
  or worse than what you have on.

## What makes it scary (and silly)

- **Your candle is burning down.** You start with 350 wax (max 450). It drops by 1 every
  turn, and your light radius shrinks once it falls below 120. Candle stubs (`¡`) add 150 each. Yesterday's Soup,
  the Ahem and the Tuck-You-In can put your flame out. In total darkness you can see
  only the cells next to you, plus the **eyes** of any horror awake out there. Eyes in the dark are
  always a real horror.
- **Dread (0–100, never shown as a number).** It rises in the dark, when you're badly hurt, when you meet new horrors
  and while something is hunting you. Light, food, good poetry, levelling up and hiding
  bring it down. It has four stages (calm, uneasy, afraid, undone), and each one makes the
  game stranger:
  - whispers in the dark
  - things in the dark that belong to nothing: a smile with no face, a toy that wasn't there, a
    ripple in the ink
  - made-up horrors and treasures at the edge of your light, drawn in pale, broken, scratchy
    ink so a careful look tells you they aren't there
  - the narrator failing to finish a rhyme
  - old log lines turning to static
  - a shorter fuse on your rhymes
  - at the last stage, **trembling**: your blows miss more and getting away fails more. The
    margin says so. Light, food, a good rhyme or hiding bring you back down.
- **A hoarse voice.** A rhyme within 30 turns of the last one makes you hoarser (up to three
  stages, shown in the margin): each stage burns the fuse 1.5 seconds shorter and blots out
  letters of the words on offer. Every 25 turns without a rhyme brings a stage back. The Last
  Rhyme is never cut short.
- **Dark rooms.** On floors 2 to 5, one room is always dark inside, whatever your candle: your
  light shrinks to a dot in there, and from outside you can't see past its doorway. Each holds a
  piece of gear a little better than the floor usually gives. The narrator mentions it the first
  time you glimpse its doorway, and the doorway hangs with ink.
- **The horrors are bolder in the dark.** With your candle out, or at the last stage of Dread,
  sleeping horrors nearby may wake even though you can't see them, and the ones already awake
  move faster. Not the Tuck-You-In or the final boss: they stay as they are.
- **Bedtime.** Stay too long on one floor and a music box starts playing somewhere upstairs.
  Soon after, the **Tuck-You-In** (`Ω`) comes down the stairs after you. It can't be hurt.
  A good rhyme will stun it for a few turns. The music box gets louder as it gets closer.
  The only real escape is the stairs.
- **Every floor has its own rule:**
  1. **Cellar of Smells:** walk into a barrel to hide in it. Most monsters lose track of you. Some barrels are already occupied.
  2. **The Top of Somebody's Head:** the hair rustles, on screen and in your ears, when something you can't see moves through it.
  3. **Sock-Drawer Catacombs:** lone socks (`§`) are lying around. Pick one up and the sock graves nearby rise as Socklings. Collect a matching pair and put them on for +1 defense and a large drop in Dread.
  4. **Sorrowful Sea-Caves:** the tide keeps rising. Deep water (`≈`) slows you down and makes your candle hiss.
  5. **Clockwork Nursery:** every 45 turns the clock strikes. The lights go out for 4 turns, and every Tick-Tock Tot wakes up in a frenzy.
  6. **Bottom of Below:** the walls bite, and older lines in the message log get nibbled away.
- **Floor surprises.** Three floors each have one surprise, once per visit, at a moment nobody
  warns you about. The narrator announces it, cheerfully.
  - *The Drawer Closes* (floor 3): a wall slides across a corridor, often the one between you and
    the stairs, and opens again about 30 turns later.
  - *Bath Time* (floor 4): the water goes warm and lovely, then somebody pulls the plug and the
    water drags you toward a drain, one step a turn. Get out of the water and it can't. The
    drain keeps one of your things, and says thank you.
  - *Nap Time* (floor 5): every horror on the floor but the Tuck-You-In lies down and stops
    looking. Any noise (a blow, a rhyme, a scroll read aloud, a smashed potion, bumping into a
    wall, the clock) wakes them all at once, frantic. Left alone, after about 30 turns each goes
    back to how it was: the ones that were awake get up, the ones that were asleep sleep on.
- **Odd rooms.** Every floor has one or two hand-built set-pieces. Each one stings when you
  first see it, then gives you a verse and three choices when you walk into its centrepiece:
  - *The Tea Party*, where the only guest is asleep (probably)
  - *The Birthday Room*, with a HAPPY DEATHDAY cake and a wax figure of you
  - *The Mirror*, whose reflection is a moment late
  - *The Lost & Found*, kept by a skeleton clerk (never ring the bell)
  - *The Wishing Well*, which has something to show you
  - *The Music Box*, which can put off bedtime or bring it on at once
  - *The Name Pile*, on the last floor
- **The Nameless Nibbler fights in three phases.** Past two thirds of its health it starts
  eating the page: your things, your rhymes, and letters out of the margin. Past one third it's
  frantic, and the walls join in. It can't be finished with a weapon. The killing blow opens
  **The Last Rhyme**, a final duel where a wrong word heals it back up.
- **Your past runs haunt the floors.** A Somebody who died on a floor may appear there as a
  pale ghost, reciting their own epitaph. Their bones (`†`) still hold their stuff. Each
  grave can be looted only once.
- **Storybook pages.** The first time you *ever* meet each horror, the game stops with a
  sting and shows its page: an ink portrait and a verse. Every page you've seen is in the
  bestiary (B on the title screen).
- **Monsters talk.** Speech bubbles appear when they spot you, hit you or die. You can hear
  a Tick-Tock Tot ticking before you can see it, until it goes quiet, close by.
- **Death is personal.** Your tombstone gets a rhyming epitaph (one that suits what killed you:
  some only fit a horror, and the Tuck-You-In has its own) plus one line about how the
  run actually went (*"They died with 2 snacks uneaten. Such waste. Such taste."*). Then a
  sad trombone plays, and on a Mac the *Cellos* voice sings it to you if it's installed.

### Sound and voice

- The soundtrack is:
  - a low drone for each floor
  - a heartbeat when you're in danger
  - the music box, which slows down and goes out of tune as Dread rises
  - comic sound effects (a slide whistle on a miss, a sad trombone on a bad rhyme)
- The narrator uses the browser's built-in speech. On a Mac it looks for voices named
  *Daniel* (narration), *Cellos* or *Bad News* (sung epitaphs) and *Whisper* (ghosts).
  If a voice isn't installed, it bends the pitch of the default voice instead.
- Press **V** to switch the voice off.

## Monsters (spoilers)

| | Name | Trick |
| --- | --- | --- |
| `m` | Mumbling Mold-Mite | Weak. The boss coughs them up. Hold still beside one instead of fighting and it climbs into your lap and sleeps, harmless, until any noise wakes it (then it bites, apologizing). It hops off at the stairs. |
| `b` | Yesterday's Soup | Fast and erratic. Can slop your candle half out. |
| `w` | Put-Away | Takes things from your pockets and runs. Bonk it to get them back. |
| `g` | Second Opinion | Has brought its own teeth. Fight one for 4 turns and it calls a colleague, who arrives from somewhere out of sight (once; the colleague can't call another). Until you can see the colleague, its footsteps (*squeak…*) are written where it walks. |
| `z` | Better-Late-Than-Never | Slow, hits very hard. |
| `s` | Ahem | Comes through walls. Each cough shrinks your flame. |
| `H` | Nothing-to-Worry-About | Pretends to be a nest lying on the floor. |
| `T` | Empty Sandwich | Splits in two when you hit it. |
| `t` | Tick-Tock Tot | Very fast. Out of sight within 10 steps you hear it, and "tick… tock…" is written where it is. Within 3 steps it goes silent. |
| `L` | Bottom Half – Giraffe | Four legs and some knees. Tough. |
| `j` | Sockling | Rises from sock graves when you take a sock. |
| `Ω` | Tuck-You-In | Comes at bedtime. Can't be hurt. |
| `N` | Nameless Nibbler | The boss. Summons help and speeds up when hurt. |

## Files

```
index.html               page shell; loads the scripts below in order
js/util.js               random numbers, word-wrap, safe localStorage, phrase() to look up a line of TEXT
js/config/rules.js       RULES: the global tuning numbers, in one frozen object (see Where to tune)
js/config/settings.js    the player's settings (sound, voice, calmer effects) and their defaults
js/content/data.js       palette, floors, monsters, items, with their own numbers and words
js/content/text.js       messages, epitaphs, help text, item words (TEXT.items), screen and margin words (TEXT.ui)
js/content/speech.js     monster speech bubbles, whispers, running gags, personal epitaph lines
js/content/bestiary.js   the verse and tip for every horror's page
js/content/couplets.js   the rhyme duel's couplets, and the Last Rhyme's
js/content/vignette-words.js  the odd rooms' words: names, verses, choices and what you read after each
js/rules/map.js          room-and-corridor generator, field of view, walking distances
js/rules/game.js         game state, turn loop, player actions, combat, death and victory
js/rules/dread.js        Dread, hallucinations, whispers, broken rhymes
js/rules/monsters.js     spawning and monster AI
js/rules/items.js        item creation, names and effects
js/rules/floors.js       candle, the Tuck-You-In, and each floor's special rule
js/rules/ghosts.js       ghosts and bones of your previous runs
js/rules/rhyme.js        the rhyme duel and the Nibbler's Last Rhyme
js/rules/vignettes.js    the hand-built rooms: placement, and what each choice does
js/rules/surprises.js    the floor surprises: the drawer, bath time, nap time
js/rules/save.js         saving a run as you go, and carrying on with it from the title screen
js/sound/audio.js        the synthesized soundtrack and sound effects (WebAudio)
js/sound/voice.js        the narrator (browser speech), line by line
js/draw/fx.js            real-time effects: shake, flash, bubbles, rustles, the made-up things in the dark
js/draw/hand-font.js     the hand-lettered typeface (Patrick Hand, SIL Open Font License), built in
js/draw/hand-font-LICENSE.txt  the font's licence
js/draw/ink.js           the ink kit: wobbly strokes with pen pressure, hatching and blots, verse printed like ink, aged paper
js/draw/render.js        the page: camera, ink-flood darkness, margin, message log, menu cards
js/draw/sprites.js       ink drawings of you, every horror, and every item
js/draw/vignette-art.js  ink drawings of the odd rooms
js/draw/terrain.js       ink drawings of walls, floors, water, grass, stairs and props
js/draw/verse.js         full-page verse: story, floor verses, bestiary, rhyme duel, tombstone, ending
js/draw/screens.js       title, splash, bestiary book, pockets, help, log, graveyard
js/draw/phone.js         the phone layout (upright, narrow screens): top line, buttons, menu, the pages for a finger, and what can be tapped
js/main.js               keyboard handling and the animation loop
js/touch.js              touch on a phone: each tap becomes the key press the keyboard would send
build.py                 bundles everything into dist/everything-is-fine-downstairs.html
tests/                   headless tests, the golden transcript and screenshots (cd tests && npm ci && npm test; see tests/README.md)
SUGGESTED-EDITIONS.md    ideas for future versions that haven't been built yet
TODO.md                  known bugs still to fix, with JW's priorities
```

Any monster or item without a drawing falls back to its old letter, so a missing drawing never
breaks the game.
Weapons and armor are drawn by their `id` (`spork`, `nest`, `colander`...), not their name, so a
name can be reworded freely; gear saved in old graves without ids is matched by its name.

It's plain JavaScript with no build step and no dependencies. Edit a file and refresh the page.

## Where to tune

Global rules live in **`js/config/rules.js`**: one `RULES` object, grouped by system, with
every number commented. Each monster's, item's and floor's own numbers stay with its words in
**`js/content/data.js`**. Edit, save, refresh the page.

| To change... | Look at |
| --- | --- |
| Starting health, attack, rhymes, candle; pocket size; healing and rhyme refill | `RULES.player` |
| What a level gives you | `RULES.xp` |
| Hit chances, and the odds of getting away from a fight | `RULES.combat`, `RULES.escape` |
| Candle length, stub size, when it counts as dark | `RULES.candle` |
| How long you get before bedtime, and the Tuck-You-In | `RULES.stalker` (`due` is turns per floor, by depth) |
| How fast Dread rises and falls, and what each stage does | `RULES.dread` |
| How eerie each floor looks, and the eerie moments (how often, how long) | `RULES.look` |
| How often the pen blots, calm and eerie | `INK_BLOT` in `js/draw/ink.js` |
| What is wrong with each horror, and how eerie the page must be for more to creep in | `WRONG` in `js/draw/sprites.js` |
| Bolder horrors in the dark (how near, how likely they wake, how much faster, who never does) | `RULES.bold` |
| Trembling at the last stage of Dread (how much worse blows and getting away are) | `RULES.clumsy` |
| Holding still beside a horror (the chance it wanders off, for how long, how much harder its blow lands otherwise, who is never fooled) | `RULES.holdStill` (the couplets are in `TEXT.holdStill`) |
| When the floor surprises come, and how long each lasts | `RULES.surprises` (the words are in `TEXT.surprises`) |
| How many horrors and items a floor starts with; what random loot is; which floors' guaranteed gear is always a weapon | `RULES.spawn`, `RULES.loot` (`weaponFloors`), `RULES.map` |
| Barrels, socks, the tide, the clock, the biting walls | `RULES.floors` |
| Ghosts, and how many graves the graveyard keeps | `RULES.ghosts` |
| The odd rooms' odds and rewards | `RULES.rooms` (amounts their words mention, like the well's 20 coins, stay in `js/rules/vignettes.js`; the words are in `js/content/vignette-words.js`) |
| Rhyme fuse length, reach and effects; the lullaby, the tongue-twister and the hoarse voice | `RULES.rhyme` |
| Dark rooms: which floors, how much better the prize | `RULES.darkRooms` |
| The Mold-Mite's lap, the Second Opinion's call, the Tick-Tock Tot's ticking | each horror's own entry in `js/content/data.js` (`lap`, `call` with its footstep word, `tick`) |
| How long verse lines hang; captions, cards and effects | `RULES.pages`, `RULES.ui`, `RULES.fx` |
| The phone: how many squares across its map shows (`across`), when the phone layout is used, the fingertip size, how much larger its small lettering is (`smallTextPx`), how loud the music box and the hum are on a phone (`musicVolume`), how fast a held finger walks, and the two speed settings (sharpness, redrawing less often when nothing is happening) | `RULES.phone` (its words are in `TEXT.ui.phone`; the lines it says for a finger instead of naming a key are `TEXT.ui.phone.instead`) |
| Loudness of the drone, music box, heartbeat and narrator | `RULES.audio` (each sound's own shape is in `js/sound/audio.js`) |
| A monster's health, attack, speed, XP, and its tricks (snuffing, stealing, splitting, the Nibbler's phases) | its entry in `MONSTERS`, `js/content/data.js` |
| What a potion or scroll does (`power`, `thrown`), how often items turn up (`freq`), and what you read when you drink, throw or read one (`drink`, `splash`, `read`) | `POTIONS`, `SCROLLS`, `FOODS`, `WEAPONS`, `ARMORS` in `js/content/data.js` (the words all items share, like names, slots and equipping, are in `TEXT.items`) |
| A floor's light, props, grass, water and monster mix | `FLOORS` in `js/content/data.js` |
| The words on the title, the pages over the map, the margin and the cards | `TEXT.ui` in `js/content/text.js` |
| The defaults for M / V / F | `SETTINGS_DEFAULTS` in `js/config/settings.js` |
| More couplets, lines, jokes | `COUPLETS` (`js/content/couplets.js`), `SPEECH`/`GAGS` (`js/content/speech.js`), `TEXT` (`js/content/text.js`), the rooms' `VIGNETTE_WORDS` (`js/content/vignette-words.js`) |

A rule written `{ base, per, min, max }` changes with depth (or level, or Dread stage): it is
`base + per × n`, kept between `min` and `max`. `RULES` is frozen, so the game can't change it
by accident while it runs. Numbers that the game's words spell out ("+4 max HP", "Toss in 20
coins", "(-2)") are still typed next to those words, so the two can't disagree.

To reset the graveyard, bestiary and settings, open the browser console on the game page and
run `localStorage.clear()`.
