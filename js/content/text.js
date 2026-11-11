'use strict';
// The words. {the} / {The} = a horror in a sentence ("the Put-Away"), {m} = its name, {n} = a number, {who} = "Somebody #N" (TEXT.somebody, the one place
// it is written), {killer}/{Killer}/{floor} in epitaphs.
// The code reads a line with phrase('group.key', { token: value }) or picks one at random from a
// list. tests/check-text.js fails if a key is missing, a {token} is never filled, or a line is unused.

const TEXT = {
  // What everybody calls you now (and every Somebody before you). The one place it is written:
  // tests/guards.js fails if 'Somebody #' is typed anywhere else.
  somebody: 'Somebody #{n}',
  floorOf: 'Floor {n} of {of}', // on the floor's page, in the margin and in your pockets

  taglines: [
    'Now with 40% more dread!',
    'Not approved by any doctor. We asked several.',
    'Ages 8 and up. Way, way down.',
    'Some assembly required. Some disassembly inevitable.',
    'Contains rhymes. Contains crimes. Contains many bad times.',
  ],

  story: [
    'You woke with no name. Not a Bert. Not a Bea.',
    'Just a gap in your head where your name used to be.',
    'The townsfolk now call you "{who}",',
    'which is terribly sad, and does not rhyme with anything.',
    '',
    'Down under the town, where the stair-steps go wrong,',
    'lives the Nameless Nibbler, who\'s hungry and long.',
    'Go down! Get it back! Take a spork and a snack.',
    '(Most Somebodies don\'t. Most Somebodies don\'t come back.)',
  ],

  hit: [
    'You bonk {the}.',
    'You whack {the} with a thwack!',
    'You smack {the}. Smack-a-lack!',
    'You poke {the} somewhere it holds dear.',
    'You wallop {the}. It did not want to be walloped.',
    'You clobber {the}. Clobber, clobber!',
  ],
  miss: [
    'You swing and you miss, with a whiff and a whish.',
    'You miss {the}. It snickers.',
    'You flail at the air, which did nothing to deserve it.',
    '{The} dodges. How rude.',
  ],
  monMiss: [
    '{The} misses you. Luck is a fickle old fish.',
    '{The} lunges and whiffs.',
    '{The} swipes at you, but you are, for once, lucky.',
  ],

  levelUp: [
    'You are taller! Or the ceiling is lower! Either way: Level {n}.',
    'Level {n}! Somewhere, a very small trumpet plays, then thinks better of it.',
    'You feel bigger! You feel bolder! You feel roughly one day older! (Level {n})',
    'Your knees are knobblier, your elbows more pointy. You are Level {n}, and slightly anointy.',
    'You have grown! In some way! Emotionally, maybe! (Level {n})',
  ],

  descend: [
    'Down you go. The stairs count along with you, and lose count on purpose.',
    'You descend. The air gets colder, and the jokes get worse.',
    'You go down the stairs. The stairs go "creak." Your knees go "creak." Everything goes "creak."',
    'Down, down, down you go, where the light gets thin and low.',
    'You descend. Somewhere above you, somebody forgets you existed.',
  ],

  water: [
    'You wade through cold, sad water. It sighs at you.',
    'Something in the water brushes your ankle. Politely.',
    'Splish. Splosh. Sob. (The water is sobbing.)',
  ],

  heldBack: [
    'You try to pull away, but {the} has you by the sleeve!',
    'You try to slip off. {The} steps on your foot. Rudely.',
    '{The} will not let you go. Not yet.',
    'You back away, and {the} simply follows, closer than ever.',
  ],
  idle: [
    'You wait. Somewhere, a clock you cannot see skips a tick to keep up.',
    'You stand still and listen. The dark stands still and listens back.',
    'You wait. The dark waits too. It is better at it.',
    'You hum to yourself. Something hums back.',
    'You stand very still and pretend to be furniture.',
  ],

  bossIntro: 'There it is: the Nameless Nibbler, round as a moon and twice as hungry. "Ooh," it says. "Dessert."',
  bossTaunts: [
    'I\'ve eaten a Bert and a Bea and a Bill, and there\'s room in my belly for Somebody still!',
    'Your name tasted lovely, like lemon and dread!',
    'Come closer, come closer, I\'ll nibble your head!',
    'A name is a snack, and a snack is a treat, and YOU are a snack on two stumbly feet!',
  ],
  bossSummon: [
    'The Nibbler coughs up a critter. "Chew on THAT," it burps.',
    'Something wriggles out of the Nibbler\'s mouth. It does not look grateful.',
  ],
  bossEnrage: 'The Nibbler goes FRANTIC and FRAZZLED and FAST!',

  epitaphs: [
    ['Eeny, meeny, miny, mo,', '{Killer} caught {who} by the toe.', 'They hollered. It did not let go.'],
    ['{who} was undone in {floor}.', 'The end.', '(There is no more.)', '(We checked.)'],
    ['Here lies {who}. They went down a stair.', 'They came to a dark. They were eaten in there.',
      'The moral is simple, the moral is plain:', 'take the stairs up next time. Or at least take a cane.'],
    ['Beneath this small stone, in a very small hole,', 'lies {who}, a somewhat unfortunate soul.',
      'They met {killer}. It did not go well.', 'The rest of the story is too sad to tell.'],
    ['{Killer} came calling, as horrors will do,', 'and it left the place humming. But where is {who}?',
      'Ask the dirt. Ask the worms. Ask the moon, if you please.', 'They are down here. With the roots. And the damp. And the fleas.'],
    ['{who} was a Somebody. Now they are none,', 'undone by {killer}, who thought it was fun.',
      'The worms send their thanks and the worms send their love,', 'and a note to the Somebodies still up above.'],
    ['Here lies {who}, who went down the stair,', 'and met {killer}, who was not very fair.',
      'They wished they had stayed at home in their bed,', 'but wishing is hard when you\'re terribly dead.'],
    ['{who} was brave! {who} was bold!', '{who} is now exceptionally cold.',
      'Undone by {killer} in {floor}.', 'Please do not knock. They won\'t answer the door.'],
    ['There was so much to do! There was so much to see!', 'Like {killer}... and then nothing.',
      'Then dirt. Then a tree.'],
    ['{who} took a step, then another, then three,', 'then {killer} came by, and it wanted some tea.',
      'Now {who} rests here, all tidy and flat.', 'They\'d have liked a nice send-off. They didn\'t get that.'],
    ['Roses are gray and the violets are dead,', 'and {killer} is sleeping in {who}\'s old bed.'],
    ['Hush now, {who}, and don\'t make a peep.', '{Killer} has tucked you in, terribly deep.',
      'Sleep tight. Don\'t let the bedbugs bite.', '(They already have. It is fine. Good night.)'],
  ],

  // What the game tells you to do (or not to): keys, stairs, things on the floor.
  prompts: {
    floor: 'Floor {n}: {name}.',
    firstFloor: 'Arrow keys to walk. Press ? for help if you are the sort who asks.',
    stairs: 'Stairs, going down. Press > or Enter to descend (gulp).',
    noStairs: 'There are no stairs here. Just floor, and your feelings about floor.', // pressing > anywhere else
    bonesHere: 'The bones of {who} lie here. (G to search them)',
    oneHere: 'There is {item} here. (G to pick it up)',
    manyHere: 'There are {n} things here: {list} and {last}. (G to pick them up)',
    nothingHere: 'There is nothing here to pick up. Just floor.',
    pocketsFull: 'Your pockets are full, so {the} stays where it is. (Drop something: I, then D.)', // {the}: "the Spork of Sorrow"
    pickedUp: 'You pick up {item}. (pocket {key})',
    whichOne: 'There is more than one of them. Walk into the one you mean.',
    nobodyNear: 'There is nothing close enough to bonk.',
    leaveBe: 'You leave {them} be. For now.',
    carriedOn: 'You carry on, exactly where you were. Nothing moved while you were away. Probably.', // C on the title page
    giveUp: 'Give up and go back to the title? Press Q again. (Any other key keeps you going.)',
  },

  // Your earlier Somebodies, and their bones.
  ghosts: {
    met: 'A pale Somebody stands over a pile of bones. It is {who}. It looks a lot like you.',
    bones: 'Here lie the bones of {who}, undone by {killer}. You recognize the knees.',
    nothing: 'They had nothing left. Not even a name. Relatable.',
    take: "You take their {item}. They won't be needing it.",
    farewell: "Take it. I won't be needing it where I'm going. (Here.)", // what the ghost says, as it goes
  },

  // The words around the full-page verse: what is written over it, the prompt under it.
  pages: {
    story: 'Enter, to go down',
    floor: 'Enter, to go on down',
    beastOver: 'a page from the bestiary',
    beastNext: 'Enter, to turn the page',
    beastBrowse: '← →  turn the pages      Esc  close the book',
    rip: 'R  I  P',
    tombStats: '{who}  ·  Floor {depth}  ·  Level {level}  ·  {kills} horrors bonked  ·  {gold} coins',
    tomb: 'Enter, to be born again (worse)      G  the graveyard      T  the title',
    theEnd: ['THE END', '(probably)'],
    ending: 'Enter, to go back to the title, nameless but alive',
    next: 'Enter', // a page with more to come
    recite: 'Recite!',
    lastRhyme: 'The Last Rhyme',
    listening: 'the Nibbler is listening, with its mouth open',
    pick: 'pick the word that rhymes',
    whichRhyme: 'Which rhyme?',
    whichKeys: '←  ↑  →  or 1, 2, 3 to choose · Enter: the same as last time · Esc: never mind',
    hoarse: '(your voice is hoarse)',
    rhymes: 'It rhymes!',
    noRhyme: 'That does not rhyme.',
    burntOut: 'The fuse burns out.',
    uh: '... uh', // what you say when the fuse burns out
    roomOver: 'something odd, in the dark',
    roomChoose: 'up and down to choose, Enter to decide (or 1, 2, 3)',
    roomNext: 'Enter, to go on',
  },

  // The words every item shares: slots, names, descriptions, and what you read when you use one.
  // (Each potion's, scroll's and food's own lines are in its entry in content/data.js.)
  items: {
    slots: { hand: 'In hand', head: 'On your head', body: 'On your body', feet: 'On your feet' },
    empty: { hand: 'bare, trembling fists', head: 'nothing (a cold head)', body: 'pajamas', feet: 'bare feet' },
    names: {
      potion: '{look} potion',
      scroll: 'scroll titled "{title}"',
      plus: '{name} +{plus}',
      gold: '{n} Tootle-Coins',
      sock: 'Lone {pattern} Sock',
      pair: 'Matching Pair of {pattern} Socks',
      candle: 'candle stub',
      bones: 'bones of {who}',
      unknown: 'mystery lump',
    },
    desc: {
      potion: 'A potion. It sloshes suspiciously. The only way to learn what it does is to drink it (bravely).',
      scroll: 'Nonsense words in wobbly ink. Reading it aloud will do... something.',
      food: '{desc} Heals about {heal}.',
      weapon: 'In hand: attack +{atk}. {desc} (Enter to wield it, or see E.)',
      armor: 'On your {slot}: defense +{def}. {desc} (Enter to wear it, or see E.)',
      sock: 'A single lost sock. Somewhere down here is its partner. The other socks would very much like it back.',
      pair: 'Two socks that match. A miracle. On your feet: defense +1, and your dread fades faster. (Enter to wear them.)',
    },
    equip: {
      cannot: "You can't wear or wield {item}. (Try using it instead.)",
      hand: 'You wield the {item}. It feels ominously appropriate.{swap}',
      head: 'You put the {item} on your head. You feel braver, and considerably taller.{swap}',
      body: 'You put on the {item}. Snug as a bug in a... bug.{swap}',
      feet: 'You put on the matching {pattern} socks. For the first time in ages, your feet are warm.{swap}',
      swap: ' You put the {old} in your pocket.',
    },
    unequip: {
      nothing: "There's nothing to take off there. You have {empty}.",
      full: 'Your pockets are too full to put the {item} in. Drop something first.',
      hand: 'You put the {item} away. Your hands feel very empty.',
      other: 'You take off the {item} and stuff it in a pocket.',
    },
    emptyPocket: 'Pocket {key} is empty, like the name-shaped hole in your heart.',
    sniff: 'You sniff the lone sock. You regret it immediately.',
    drop: 'You drop {the}. It lands with a sad little flop.',
    drink: 'You drink the {item}.',
    read: 'You read the {item} aloud.',
    identified: '(That was a {name}.)',
    eat: 'You eat {the}. Delicious! Probably. (+{n})',
    spoiled: '{bad} (+{n}, but poisoned)',
    throw: 'You throw the {item} at {them}. Smash!',
    blanket: 'It soaks into the blanket. The Tuck-You-In does not even notice.',
  },

  // The words on the screens, the margin and the cards (the drawing is in draw/).
  ui: {
    // the card when you face a horror, or one goes for you
    card: {
      face: 'You face {m}.',
      hit: '{Them} {verb} you: −{dmg}.',
      steal: '{Them} picked your pocket!',
      miss: '{Them} went for you, and missed.',
      attack: 'attack',
      rhyme: 'rhyme',
      noRhymes: 'rhyme (no rhymes left)',
      use: 'use something',
      backAway: 'try to back away',
      leave: 'leave it be',
      arrows: 'arrows',
      getAway: 'try to get away',
      fighting: '(same arrow again attacks · backing out of a fight may fail)',
      sleeping: '(same arrow again attacks · it has not noticed you yet)',
    },
    // the margin: your character page
    margin: {
      level: 'Level {level}   ·   {floor}',
      health: 'Health',
      toLevel: '{n} more to Level {next}',
      candle: 'Your candle & you',
      attack: 'Attack',
      defense: 'Defense',
      rhymes: 'Rhymes',
      coins: 'Coins',
      gear: 'Wearing & wielding  (E)',
      atk: 'atk +{n}',
      def: 'def +{n}',
      nearby: 'Nearby',
      unknownHealth: '?',
      pockets: 'Pockets  {n} of {of}',
      noPockets: 'lint, and dread',
      keys: '?  help    I  pockets    E  gear    G  pick up    space  hold still',
    },
    // how your candle is doing, under it in the margin
    candle: { out: 'out!', guttering: 'guttering', low: 'burning low', burning: 'burning', tall: 'tall and bright' },
    // your conditions, as little tags in the margin
    tags: {
      poisoned: 'poisoned · {n}',
      confused: 'confused · {n}',
      sensing: 'sensing horrors · {n}',
      hidden: 'hidden in a barrel',
      dark: 'the lights are out',
      candleOut: 'your candle is out',
      bedtime: 'it is bedtime',
      musicBox: 'a music box is playing…',
      stairs: 'on the stairs: press >',
      here: 'something here: G to pick up',
      threat: 'A attack back · U use something',
      trembling: 'trembling', // the highest fear: your blows miss more, and getting away fails more
      hoarse: 'hoarse · {n}', // rhyming too often: shorter fuses and smudged words; rest brings your voice back
      lap: 'a Mold-Mite in your lap', // any noise wakes it
      laps: '{n} Mold-Mites in your lap',
    },
    storySoFar: 'THE STORY SO FAR',
    splash: { press: 'Press any key.', dare: 'If you dare.', best: '(best with the sound on and the lights off)' },
    title: {
      before: 'Everything Is Fine ', // the title is set in two inks: this, then
      rot: 'Downstairs',
      subtitle: 'a most unfortunate descent, in rhyme',
      menu: [['Enter', 'begin your descent'], ['G', 'visit the graveyard'], ['B', 'read the bestiary'], ['?', 'learn how not to die']],
      // with a run in progress: one more line on top, and Enter says what it will cost
      carryOn: 'carry on as {who}, on Floor {n}',
      beginAgain: 'begin again, and leave {who} down there',
      lost: 'Somebodies lost so far: {n}.',
      noneLost: 'No Somebodies lost yet. Yet.',
      floorOne: ' {n} of them on Floor 1. The Mold-Mites have started a fan club.',
      recent: ' Most recently, #{run}, by {killer}.',
      settings: 'M {mute}   ·   V voice {voice}   ·   F calmer effects {calm}',
      mute: 'mute', unmute: 'unmute', on: 'on', off: 'off',
    },
    bestiary: {
      empty: 'The bestiary is empty. You have not met anything yet.',
      wait: 'Give it time. Everything down there wants to meet you.',
      close: 'Esc, to close the book',
      page: 'page {n} of {seen} (of {all})',
    },
    pockets: {
      title: ' Your Pockets ({n} of {of}) ',
      count: '{name} ×{n}', // identical things share a row
      useOn: ' Use Something on {m} ',
      empty: 'Nothing but lint and dread.',
      throwTag: '  (T: throw)',
      wearTag: '  (wear: {slot})',
      level: 'Level {level}   ({xp} of {next} to the next)',
      numbers: 'Attack {atk}   Defense {def}   Tootle-Coins {gold}',
      floor: '{floor}: {name}',
      gear: 'What you wear and wield: press E.',
      keysUse: 'Enter use   T throw a potion at it   D drop',
      keys: 'Enter use (or wear)   D drop   1-0 use that pocket',
      keys2: '↑↓ choose   E wear & wield   Esc close',
    },
    gear: {
      title: ' What You Wear and Wield ',
      attack: 'attack +{n}',
      defense: 'defense +{n}',
      nothing: 'nothing here',
      from: 'From your pockets, for {slot}:',
      none: 'Nothing you are carrying goes there.',
      better: '+{n} better',
      worse: '{n} worse',
      same: 'the same',
      numbers: 'Attack {atk}   Defense {def}',
      turn: "Each change takes a turn. Horrors don't wait.",
      keys: '↑↓ choose a slot   1-7 put that on   T take it off',
      keys2: 'Enter swap   I pockets   Esc close',
    },
    help: {
      title: ' How Not To Die (Much) ',
      pictures: 'What the pictures mean:',
      after: [
        'Your candle burns down as you go. The dark raises your Dread, and Dread',
        'shows: the page wobbles, leans, scratches, and the ink creeps in. Linger',
        'on a floor and it becomes bedtime. Anything with eyes is a horror.',
      ],
    },
    logTitle: ' What Has Happened So Far ',
    close: 'Press any key to close.', // the help and the log
    graveyard: {
      title: ' Here Lie the Somebodies ',
      empty: 'The graveyard is empty. Give it time.',
      escaped: '#{run}  * ESCAPED with their name (sort of)',
      lost: '#{run}  + Floor {depth}, by {killer}{looted}',
      looted: ' (bones picked clean)',
      row: 'lvl {level}  turn {turns}  {date}',
      keys: '↑↓ read the headstones   Esc go back',
    },
    // A phone held upright (js/draw/phone.js): the same game by touch. Only the words that say
    // which key to press are different here; everything else is the computer's words.
    phone: {
      buttons: { hold: 'Hold still', rhyme: 'Rhyme', pockets: 'Pockets', pickUp: 'Pick up' },
      menuButton: 'menu',
      menu: {
        gear: 'What you wear and wield',
        log: 'The story so far',
        bestiary: 'The bestiary',
        help: 'How not to die (help)',
        sound: 'Sound: {state}',
        voice: "The narrator's voice: {state}",
        calm: 'Calmer effects: {state}',
        giveUp: 'Give up',
        giveUpSure: 'Tap again to give up for good',
        close: 'Close the menu',
        on: 'on', off: 'off',
      },
      splash: 'Tap anywhere.',
      sideways: ['Turn your phone upright, please.', 'Everything is fine downstairs, but only this way up.'],
      silent: 'No sound? Turn the silent switch off.',
      tomb: { again: 'be born again (worse)', graveyard: 'the graveyard', title: 'the title' },
      // the prompt under a verse page, by the name of the computer's prompt in TEXT.pages
      prompts: {
        story: 'tap, to go down',
        floor: 'tap, to go on down',
        beastNext: 'tap, to turn the page',
        ending: 'tap, to go back to the title, nameless but alive',
        next: 'tap',
        roomNext: 'tap, to go on',
      },
      roomChoose: 'tap one to decide',
      whichNever: 'never mind',
      whichLast: '(marked: the same as last time)',
      pick: 'tap the word that rhymes',
      // the face-off card
      card: { fighting: '(backing out of a fight may fail)', sleeping: '(it has not noticed you yet)', walkAway: 'or walk away' },
      tags: { stairs: 'on the stairs: tap yourself to go down', here: 'something here: Pick up', threat: 'it went for you: answer on its card' },
      pockets: { use: 'Use', wear: 'Wear', throw: 'Throw it', drop: 'Drop', close: 'Close' },
      gear: { takeOff: 'Take it off', pockets: 'Pockets', close: 'Close', wearOne: 'tap one to put it on' },
      book: { back: 'back', close: 'close the book', next: 'next' },
      graveyard: { close: 'Go back' },
      close: 'Tap anywhere to close.', // the help and the log
      help: [
        ['Tap around you', 'walk that way: the map is cut into four, meeting at you. Hold your finger down to keep walking.'],
        ['Into a horror', 'face it, and tap what to do. Out of a fight: maybe.'],
        ['Tap yourself', 'on the stairs: go down.'],
        ['Hold still', 'and hope.'],
        ['Rhyme', 'pick the kind, then the word that rhymes. Costs 1 ♪.'],
        ['Pockets', 'use, wear, throw or drop what you carry.'],
        ['Pick up', 'what is here. Gold and stubs pick themselves up.'],
        ['The story', 'tap the two lines at the bottom for all of it.'],
        ['The menu', 'gear, the bestiary, this help, sound, voice, calmer effects, giving up.'],
        ['A keyboard', 'works too, with the same keys as on a computer.'],
      ],
    },
  },

  // The three kinds of rhyme (js/rules/rhyme.js), picked before you recite.
  rhymeKinds: {
    shove: { name: 'a Shove', desc: 'everything near you reels back' },
    lullaby: { name: 'a Lullaby', desc: 'everything near you nods off' },
    twister: { name: 'a Tongue-Twister', desc: 'the nearest horror gets the worst of it' },
  },
  lullaby: {
    hit: 'It rhymes, softly. {n} horrors lie down and close their eyes. Shh.',
    one: 'It rhymes, softly. {The} lies down and closes its eyes. Shh.',
    nobody: 'It rhymes, softly. Nobody is here to be sung to. You feel a little sleepy yourself.',
    hums: '{The} hums along, and forgets what it was doing.',
    woken: 'Somebody wakes up from their lullaby. They are cross about it.',
  },
  twister: {
    hit: 'It rhymes, fast and twisty and twice as hard. {The} gets the worst of it.',
    nobody: 'It rhymes, fast and twisty. Your tongue is very proud of itself. Nobody else is here.',
  },
  hoarse: {
    worse: 'Your voice is going hoarse. The next rhyme will come out thinner.',
    worst: 'Your voice is very hoarse now. The words come out smudged.',
    better: 'Your voice comes back a little.',
  },

  // Dark rooms (js/rules/floors.js): always dark inside, and something nice in each.
  darkRoom: {
    notice: 'There is a room here where the light will not go. Something is waiting in it. Something nice. Probably.',
    enter: 'Your candle shrinks to a dot. It is not frightened. It is only being polite.',
  },

  // The Mold-Mite in your lap, and the Second Opinion's second opinion.
  lap: {
    climb: 'The Mold-Mite climbs into your lap, mumbles "mmf, sorry," and falls asleep.',
    wake: 'The Mold-Mite in your lap wakes with a start and bites you. "Mmf! Sorry!"',
    stairs: 'The Mold-Mite hops out of your lap at the stairs and waves goodbye. Mmf.',
  },
  opinionCall: 'Somewhere a door opens. "Did somebody ask for a second opinion?"',

  // Holding still beside a horror (space or .), and hoping. The narrator sets it up in a couplet.
  holdStill: {
    couplets: [
      'Stand very still, and say nothing at all, and perhaps it\'s somebody else it will maul.',
      'Be a lamp, be a chair, be a coat on a hook, and it may not bother to take a good look.',
      'Hold your breath, little Somebody, quiet as stone, and perhaps it will wander and leave you alone.',
    ],
    wander: [ // {The}: the horror, at the start of a sentence
      '{The} loses interest, and potters off, humming.',
      '{The} decides you are probably furniture, and wanders away.',
      '{The} looks straight through you, and goes to look at something else.',
    ],
    harder: '{The} was only waiting for you to stop moving.', // said when its blow lands
  },

  // The middle floors' surprises (js/rules/surprises.js), in the narrator's cheerful voice.
  surprises: {
    drawer: {
      close: 'Somebody closed the drawer. That is what drawers are for.',
      open: 'Somebody opens the drawer again. They were looking for something. It was not you. Probably.',
    },
    bath: {
      warm: 'The water goes warm and bubbly. It is lovely. It is bath time.',
      plug: 'Somebody pulls the plug.',
      pulled: 'The water pulls you toward the drain. It would like you to come too.',
      drain: 'Glug. The drain keeps your {item}. It says thank you.',
      over: 'The bath is over. The water goes cold and sad again.',
    },
    nap: {
      start: 'A little bell rings, and a voice says: "Nap time!" Every horror on the floor lies down and shuts its eyes.',
      woken: 'Everybody wakes up at once. Nobody is happy about it.',
      over: 'Nap time is over. Everybody gets up, very refreshed.',
    },
  },

  // Who did it, for the tombstone and the graveyard (monsters and potions are named from their entries).
  killers: {
    wall: 'a hungry wall',
    tea: 'a cup of tea at a party',
    wax: 'a mouthful of birthday wax',
    spoiled: 'a spoiled {food}',
    unknown: 'something unspeakable',
  },

  ending: [
    'You clobbered the Nibbler! It burst like a bun,',
    'and out flew the names, every last single one.',
    'They fluttered like moths up the stairs toward the light,',
    'and yours flew the fastest. It knew you on sight.',
    '',
    'You climbed and you climbed, and you came to the top,',
    'where the Mayor of Glum held his hand up. "Stop.',
    'We passed a new law while you dawdled below:',
    'No Names After Dark! And it\'s dark now, you know."',
    '',
    'So he folded your name and he tucked it away',
    'in a drawer full of names he\'ll give back someday.',
    'And you stood in the street, rather nameless and small,',
    'but alive! Which is something. Or nothing at all.',
  ],

  help: [
    ['ARROW KEYS', 'walk. Into a horror: face it. Out of a fight: maybe.'],
    ['A', 'attack whatever is next to you (or whatever just bit you).'],
    ['R', 'Recite a Rhyme: pick the word that rhymes. Costs 1 ♪.'],
    ['U', 'use something on the horror beside you (throw potions!).'],
    ['G', 'pick up what is here. Gold and stubs pick themselves up.'],
    ['I', 'your pockets. 1-9 and 0 use a pocket straight away.'],
    ['E', 'what you wear and wield: hand, head, body and feet.'],
    ['SPACE or .', 'hold still, and hope.     > or ENTER: go down the stairs.'],
    ['L / Q / ?', 'the log / give up (press twice) / this help.'],
    ['M / V / F', 'mute sound / narrator voice / calmer effects.'],
  ],
  legend: [
    ['@', '#fff4b0', 'you'], ['>', '#ffe066', 'stairs down'],
    ['!', '#ff8fc8', 'potion (unknown until drunk)'], ['?', '#f0e6c8', 'scroll (unknown until read)'],
    ['%', '#b8e07a', 'food (heals, calms you)'], [')', '#8fb8ff', 'weapon'],
    ['[', '#4fd6c8', 'armor... or is it?'], ['$', '#ffe066', 'Tootle-Coins (score)'],
    ['¡', '#ffb050', 'candle stub (more light)'], ['§', '#ff8fc8', 'a lone sock (careful)'],
    ['†', '#d8d0c0', 'bones of a previous you'], ['~', '#3f7fcf', 'water (≈ is deep & slow)'],
    ['"', '#5f9a4a', 'tall grass, or hair (hides things)'], [',', '#8a7a62', 'crumbs, bones, junk (harmless)'], ['o', '#b08a5a', 'barrel (walk in to hide)'],
  ],
  tips: [
    'Tip: walk into a horror and you get to choose: bonk it, rhyme at it, or throw something at it.',
    'Tip: things on the floor stay there until you press G. Socks, especially, are a decision.',
    'Tip: odd rooms have odd things in them. Walk into the centrepiece to see what it wants.',
    'Tip: the Nameless Nibbler cannot be killed with a spork alone. Save a rhyme for the end.',
    'Tip: your candle is your life. Watch it burn down in the margin. Grab every stub you see.',
    'Tip: dawdle too long on one floor and it will be bedtime. Keep moving.',
    'Tip: Dread makes you see things. Food, light, rhymes and hiding calm you down.',
    'Tip: the little notes in the margin are rhymes left in you. They come back downstairs, and slowly over time.',
    'Tip: the Put-Away takes your things. Bonk it to get them back.',
    "Tip: if the narrator says it's nothing to worry about, worry.",
    'Tip: the Ahem comes through walls. Walls are no comfort.',
  ],
};
