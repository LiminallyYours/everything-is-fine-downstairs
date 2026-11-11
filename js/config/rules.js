'use strict';
// The game's global rules: every tuning number that isn't one particular monster's, item's or
// floor's (those live with their words in content/data.js). One frozen object, grouped by system.
//
// No functions here, only numbers. A number that changes with depth, level or tier is written
// { base, per, min, max } and read with ruleAt(rule, n) (util.js): base + per * n, kept between
// min and max. Drawing coordinates stay with the drawings.
//
// RULES is frozen all the way down, so changing it while the game runs throws. Copy before
// you change anything ({ ...RULES.x }, list.slice()).

const RULES = (function freezeDeep(o) {
  for (const v of Object.values(o)) if (v && typeof v === 'object') freezeDeep(v);
  return Object.freeze(o);
})({
  player: {
    start: { hp: 24, atk: 3, def: 0, xpNext: 12, verve: 3, wick: 350 }, // a new Somebody
    pockets: 10,              // pocket slots (keys 1-9 and 0)
    regenTurns: { base: 10, per: -1, min: 4 }, // turns per 1 health back, by level
    verveTurns: 30,           // turns per rhyme (♪) back, up to your most
    stumble: 0.5,             // chance a confused step goes somewhere else
  },

  // Levelling up.
  xp: {
    nextGrowth: 1.4,          // the next level needs this many times as much XP...
    nextPlus: 4,              // ...plus this
    maxHp: 5,                 // most health gained per level
    heal: 8,                  // health healed on levelling up
    atk: 1,                   // attack gained per level
    verveEvery: 3,            // one more rhyme slot every this many levels
  },

  combat: {
    playerHit: 0.85,          // chance your blow lands
    monsterHit: 0.75,         // chance a horror's blow lands
    minDamage: 1,             // a blow that lands always does at least this
  },

  // Getting out of a fight (you stepping away, or a horror trying to get away from you).
  escape: {
    even: 0.55,               // chance at equal speed
    perSpeed: 0.25,           // plus this for each step of speed the runner has over the holder
    min: 0.2,
    max: 0.9,
    tuck: 0.35,               // getting away from the Tuck-You-In
  },

  candle: {
    max: 450,                 // the most wax a candle can hold
    full: 120,                // at or above this your light reaches its furthest
    low: 40,                  // "burning low" warning; below it the margin says "guttering"
    stub: 150,                // wax added by a candle stub
    tall: 280,                // at or above this the margin says "tall and bright"
    deepWater: 3,             // wax lost wading through deep water (it never quite goes out)
    darkRadius: 2,            // a light radius this small or smaller counts as being in the dark
  },

  // Bedtime: the Tuck-You-In comes down the stairs if you stay too long on a floor.
  stalker: {
    due: { base: 340, per: -20 }, // turns on a floor before bedtime, by depth
    musicBoxLead: 80,         // turns before bedtime that the music box starts playing
    closerLead: 40,           // turns before bedtime that it gets closer (and Dread rises)
    closerDread: 8,           // Dread when it gets closer
    arriveDread: 15,          // Dread when the Tuck-You-In arrives
    arriveMinDist: 10,        // it comes down the stairs unless you're this close to them
    speedMax: 1.15,           // it speeds up from its own speed to this...
    speedRampTurns: 400,      // ...by 1 every this many turns past bedtime
    hearRange: 16,            // you hear (and see the words of) it within this many steps
    hum: 0.4,                 // chance per turn of a written "♪", "hush…" while unseen
    talk: 0.15,               // chance per turn that it says something
  },

  // When the dark or your fear gets the better of you: with your candle out, or at the highest
  // fear stage (3, undone), the horrors get bolder; at the highest fear stage you get clumsy.
  bold: {
    fromTier: 3,              // the fear stage that makes them bold (the candle being out always does)
    wakeRange: 8,             // a sleeping horror this many steps away or nearer may wake...
    wake: 0.35,               // ...with this chance each turn, whether or not you can see it
    speed: 0.25,              // awake horrors move this much faster (1 is one step a turn)
  },
  clumsy: {
    fromTier: 3,              // the fear stage that makes you clumsy (the margin says "trembling")
    hit: 0.2,                 // your blows land this much less often (combat.playerHit is 0.85)
    escape: 0.15,             // getting away from a fight works this much less often
  },

  // How horrors behave in general (each one's own numbers are in content/data.js).
  monsters: {
    enragedSpeed: 1.5,        // how fast an enraged horror (the Nibbler's last phase) moves
    frenzySpeed: 0.6,         // extra speed while in a frenzy (struck clocks, offended horrors)
    sleepWander: 0.3,         // chance per turn that a sleeping horror shuffles about
    stuckWander: 0.3,         // chance that one stuck behind another shuffles instead
    erraticWander: 0.5,       // chance per turn that an erratic one (bats) flutters off
  },

  dread: {
    max: 100,                 // the Dread scale runs from 0 to this
    tiers: { calm: 0, uneasy: 30, afraid: 55, undone: 80 }, // where each stage starts
    // every turn
    perTurn: {
      dark: 1.2,              // in the dark (see candle.darkRadius)
      calm: -0.6,             // lit, nothing hunting you, no bedtime
      wounded: 0.8,           // health below woundedBelow of your most
      woundedBelow: 0.3,
      bedtime: 1.2,           // while the Tuck-You-In is about
      hidden: -2,             // hiding in a barrel
      warmFeet: -0.3,         // wearing matching socks
    },
    // once, when it happens
    hurt: 2,                  // each time you're hurt
    newHorror: 5,             // the first time you see each kind of horror on a run
    storyPage: 3,             // a horror's storybook page opens
    candleOut: 12,            // your candle goes out
    stub: -8,                 // a candle stub
    levelUp: -20,             // levelling up
    phantomTouch: 2,          // a hallucination vanishes next to you
    phantomGrab: 3,           // you reach for a hallucinated item
    // what fear does to you (tier 1 uneasy, 2 afraid, 3 undone)
    phantoms: { fromTier: 2, most: 3, perTier: 0.035, monster: 0.7, chase: 0.6, monsterTurns: [4, 9], itemTurns: [6, 12] },
    whispers: { fromTier: 1, perTier: 0.018, logged: 0.6 },
    fakeRustle: { fromTier: 1, perTier: 0.04 },   // in the Gloomwood Glen
    brokenRhyme: { fromTier: 2, afraid: 0.35, undone: 0.7 }, // chance a rhyme loses its last word
    eyes: { perMs: 0.00003, plus: 5 },            // eyes in the dark: chance dt * perMs * (plus + dread) per frame
  },

  // Each floor's map.
  map: {
    w: 58, h: 26,             // size in cells
    rooms: [8, 11],           // rooms on a floor (fewest, most)
    bossRooms: 7,             // rooms on the last floor, besides the Nibbler's
    loops: 2,                 // extra corridors, so not every place is a dead end
  },

  // What each floor starts with.
  spawn: {
    monsters: { base: 4, per: 2 }, // horrors, by depth...
    bossMonsters: 6,          // ...or on the Nibbler's floor
    monsterMinDist: 8,        // none starts closer to you than this
    batsAwake: 0.5,           // chance an erratic horror starts awake
    items: { base: 6, per: 1 }, // items, by depth (plus one guaranteed weapon or armor)
    stubs: 2,                 // candle stubs...
    extraStubFrom: 3,         // ...and one more from this floor down
  },

  loot: {
    kinds: [['potion', 30], ['scroll', 22], ['food', 22], ['gold', 18], ['gear', 8]], // what a random item is (weights)
    gold: [3, 9],             // a gold pile: this many coins (fewest, most), times the depth
    killGold: 0.25,           // chance a slain horror drops gold
    weapon: 0.5,              // chance random gear is a weapon (otherwise something to wear)
    gearTiers: 2,             // gear can be up to this many tiers below the floor's depth
    weaponFloors: [1],        // on these floors the one guaranteed piece of gear is always a weapon
  },

  food: {
    dread: -10,               // eating anything calms you
    spoiledPoison: 4,         // turns of poison from something spoiled (it heals half)
  },

  // Each floor's own rule.
  floors: {
    barrel: {                 // Floor 1: walk into a barrel to hide
      mite: 0.15,             // chance a Mold-Mite is already inside...
      loot: 0.35,             // ...or else (up to this) something is
      lootDread: 4,
      lose: 0.75,             // chance a horror next to your barrel loses you each turn
      forget: 0.3,            // chance one further off forgets you were ever there
    },
    socks: {                  // Floor 3: take a sock and the sock graves rise
      minDist: 6,             // lone socks lie at least this far from the start
      reach: [10, 8],         // graves this far across and up/down from you can rise...
      most: 3,                // ...at most this many...
      rise: 0.6,              // ...each with this chance
      riseDread: 6,
      pairDread: -25,         // putting on a matching pair for the first time
      sniffDread: 2,          // sniffing a lone sock
    },
    tide: {                   // Floor 4: the tide comes in
      every: 8,               // turns between rises
      most: 0.45,             // stops once water covers this share of the floor
      spread: 10,             // puddles that spread each time
      deepen: 0.5,            // chance a surrounded puddle turns deep
      splash: 0.3,
    },
    clock: {                  // Floor 5: the clock strikes
      every: 45,              // turns between strikes
      warn: 38,               // the clock whirrs from this turn of the hour
      dark: 4,                // turns the lights stay out
      dread: 10,
      frenzy: 6,              // turns the Tots stay frantic
      bells: 3,               // most bongs you hear
    },
    chew: {                   // Floor 6: the walls bite
      bite: 0.04,             // chance per turn that a wall next to you bites
      every: 12,              // turns between crunches somewhere nearby...
      gnaw: 0.3,              // ...each with this chance that a wall eats a hole in itself
    },
    tickRange: 10,            // you hear an unseen Tick-Tock Tot within this many steps
    tickWord: 0.45,           // chance its "tick…" is written down
    ahemRange: 8,             // an unseen Ahem within this many steps may clear its throat...
    ahemWord: 0.3,            // ...with this chance each turn, written down where it is
  },

  // The middle floors' surprises (js/rules/surprises.js): one per visit, at a moment between
  // `from` and `to` turns after you arrive.
  surprises: {
    from: 30, to: 110,
    retry: 10,                // if it can't happen just then, try again this many turns later...
    tries: 6,                 // ...this many times at most
    drawer: { turns: 30, minDist: 3, cutsOff: 20 }, // Floor 3: shut this many turns, at least minDist steps from you, cutting off at least cutsOff cells
    bath: { warm: 3, drain: 8, warmDread: -5 },     // Floor 4: lovely warm turns (and the Dread they take off), then turns of pulling
    nap: { turns: 30, frenzy: 8, zzz: 0.25 },       // Floor 5: how long the nap lasts, how long they're frantic if woken, chance of a written "zzz"
  },

  // Ghosts of earlier Somebodies, and the graveyard they come from.
  ghosts: {
    graves: 4,                // the latest graves on a floor that can haunt it
    two: 0.35,                // chance two ghosts appear rather than one
    minDist: 10,              // their bones lie at least this far from the start
    near: 5,                  // a ghost talks once you're within this many steps
    talkEvery: 3,             // turns between its lines
    lines: 4,                 // lines of its epitaph it says
    bones: 3,                 // things a dying Somebody leaves in their bones
    graveyard: 40,            // graves the graveyard keeps
  },

  // The odd rooms. (Numbers that the rooms' words mention, like the well's 20 coins, stay
  // with the words in js/rules/vignettes.js.)
  rooms: {
    second: 0.3,              // chance of a second room on a floor
    giftTier: { base: 1, per: 1, max: 5 }, // gear from the mirror and the music box, by depth
    teaparty: { well: 0.6, poisoned: 0.85, poison: { base: 6, per: 1 }, calmConfused: 3, sugar: [15, 30], sugarDread: 8 },
    birthday: { candlesWax: 200, candlesDread: 8, cakeHeal: 15, cakeDread: -15, waxy: 0.25, waxPoison: 4 },
    mirror: { smashDread: 20, backDread: 6 },
    lostfound: { nameDread: -10, bell: 3 },
    well: { wax: 120, coinDread: -30, leanDread: 15 },
    musicbox: { windBack: 150, windFrenzy: 8, smashXp: 20, closeDread: -10 },
    namepile: { mites: 0.3, xp: 15, heal: 10, readDread: 10 },
    seenDread: 3,             // the sting the first time you see a room
  },

  // R: the rhyme duel.
  rhyme: {
    fuseMs: { base: 12000, per: -1500 }, // how long the fuse burns, by Dread tier (0 calm ... 3 undone)
    lastFuseMs: 9000,         // the Last Rhyme's fuse
    reach: 3,                 // a good rhyme hits horrors this many steps away (in any direction)
    stun: 4,                  // turns they reel...
    bossStun: 2,              // ...or the Nibbler does
    damage: [2, 4],
    goodDread: -15,
    badDread: 5,
    offendReach: 7,           // a bad rhyme offends horrors this far away...
    offendFrenzy: 4,          // ...into a frenzy this long
    badConfused: 4,           // or confuses you this long
    lastWrongHurt: 4,         // a wrong Last Rhyme hurts you this much
  },

  // Full-page verse: when each line appears, in milliseconds.
  pages: {
    lead: 900,                // before the first line
    lineBeat: 1300,           // extra time each line hangs
    line: 700, perSyllable: 200, // plus this, and this per syllable
    fastLine: 500, fastPerSyllable: 120, // a fast page (the rhyme duel), with no line beat
    done: 1100, fastDone: 500, // after the last line, before Enter turns the page
    tombBeat: 1500,           // your epitaph hangs longer
    roomBeat: 900,            // the odd rooms' verses hang less
    rhymeLead: 400,           // the rhyme duel's couplet...
    lastRhymeLead: 900,       // ...and the Last Rhyme's
  },

  // How long the little effects last, in milliseconds.
  fx: {
    bubbleMs: 2800,           // a speech bubble, unless the speaker says otherwise
    floatMs: 900,             // a floating damage number
    deathMs: 1100,            // a slain horror being scribbled out
    wordMs: 1700,             // a written sound ("tick…", "rustle")
    rustleMs: 900,            // grass rustling
    biteMs: 1300,             // a wall's teeth
  },

  ui: {
    blinkPeriodMs: 3200,      // eyes in the dark blink once every this many milliseconds...
    blinkClosedMs: 170,       // ...and stay shut this long
    threatCardDelayMs: 350,   // a blow lands, and is seen to land, before its card offers a reply
    resultMs: 400,            // a rhyme's or room's result stays at least this long before a key moves on
    choicePauseMs: 500,       // once a room's verse has finished, Enter does nothing for this long (so hurrying the verse can't pick a choice unread)
    rhymeResultMs: 1800,      // then the rhyme's verdict leaves by itself
    captionMs: 6500,          // the news ribbon on the map fades after this
    log: 300,                 // lines of The Story So Far kept
    bubbleRange: 16,          // speech bubbles further than this many steps away aren't drawn
    frameMs: 30,              // the animation draws at most once every this many milliseconds
    titleEyes: 0.0006,        // eyes appearing on the title page, per millisecond
  },

  // The sound mix (each sound effect's own shape stays in js/sound/audio.js).
  audio: {
    master: 0.8,              // master volume when not muted
    drone: 0.1,               // each floor's low hum
    wind: 0.25,               // the wind in the hum...
    seaWind: 0.5,             // ...in the Sea-Caves
    musicBox: 0.5,            // the music box at full volume
    echo: 0.23, echoFeedback: 0.35, // the music box's echo (seconds, feedback)
    heartbeatFrom: 0.2,       // danger above which you hear your heart
    narrator: 0.9,            // the narrator's voice
    // how loud the music box is, and how close danger feels (main.js soundState)
    titleBox: 0.6,            // on the title and story pages
    nurseryBox: 0.25,         // always, in the Clockwork Nursery
    bedtimeBox: { near: 30, least: 0.2 }, // once it's bedtime: louder as it nears, from this many steps
    warningBox: { from: 0.08, rise: 0.3 }, // during the music-box warning: from, plus up to rise
    closeDanger: 0.45,        // an awake horror within closeSteps
    closeSteps: 3,
    fearDanger: 0.6,          // times your Dread, once you're afraid
  },
});
