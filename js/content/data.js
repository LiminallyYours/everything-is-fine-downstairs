'use strict';
// Numbers and nonsense: floors, monsters, items. Tweak freely. The game refers to things by
// their `id` / object key (drawings, coat colours, saved graves), so rename those with care;
// a display `name` can change freely. Some ids are older than the names they now carry
// (Yesterday's Soup is still `bat`, the Ahem `wraith`, the Empty Sandwich `thing`,
// Better-Late-Than-Never `zombie`, Somebody Else's Breakfast `eggs`, the Pie `ham`): they were
// left alone when the names changed in November 2026.

// Inks on paper. Every colour is 6-digit hex so it can be faded toward the paper.
const C = {
  bg: '#efe4cc', ink: '#1b1519', gray: '#5d544b', dim: '#8a7f6e', faint: '#c9b99a',
  red: '#a3192b', pink: '#a83a68', orange: '#a8520f', yellow: '#806000', player: '#1b1519',
  green: '#356b28', teal: '#1d6b66', blue: '#274f94', purple: '#5b2f86', white: '#000000',
  select: '#e0cfa8', stunned: '#dccaa2', hurt: '#e9b9b0',
};

const FLOORS = [
  {
    name: 'The Cellar of Smells', wall: '#9a78aa', floor: '#6a6078', light: 8,
    deco: { ch: ',', color: '#8a7a62', name: 'crumbs', density: 0.03 },
    prop: { ch: 'o', color: '#b08a5a', name: 'barrel of pickled regrets', count: 8, hide: true },
    grass: 0, water: 0,
    monsters: [['mite', 5], ['bat', 3], ['putaway', 2]],
    verse: [
      'Beneath the old house on the corner of Glum',
      'is a cellar that hums a most horrible hum.',
      'It smells of wet socks and of pickles and fright,',
      "so hold your nose tight, and please don't mind the bite.",
    ],
  },
  {
    name: "The Top of Somebody's Head", wall: '#b0766a', floor: '#7a5f52', light: 7,
    deco: { ch: "'", color: '#d8cdb8', name: 'stray flakes', density: 0.05 },
    prop: { ch: '♣', color: '#8a5a3a', name: 'cowlick', count: 10 },
    grass: 11, water: 0,
    monsters: [['mite', 2], ['bat', 3], ['opinion', 4], ['putaway', 2]],
    verse: [
      'The next floor is hair. It is somebody\'s head.',
      "Whose head? We don't ask. It's bad manners, it's said.",
      "It's combed every morning and parted with care,",
      'and it rustles when something gets loose in the hair.',
    ],
  },
  {
    name: 'The Sock-Drawer Catacombs', wall: '#a89a88', floor: '#6a605a', light: 7,
    deco: { ch: ',', color: '#e0d8c0', name: 'bones', density: 0.04 },
    prop: { ch: '∩', color: '#b0b0bc', name: 'tiny tombstone for a sock', count: 9 },
    grass: 0, water: 0,
    monsters: [['opinion', 3], ['zombie', 3], ['mimic', 2], ['wraith', 2], ['bat', 1]],
    verse: [
      'Where do lost socks go? Why, they go down to here,',
      'to be buried in rows, one by one, every year.',
      'Some socks are just socks. Some socks have a twin.',
      "Some twins have a mouth. Don't put your foot in.",
    ],
  },
  {
    name: 'The Sorrowful Sea-Caves', wall: '#4c88b0', floor: '#4a5c70', light: 6,
    deco: { ch: ',', color: '#d0a8a8', name: 'weeping seashells', density: 0.03 },
    prop: { ch: '*', color: '#ff9f9f', name: 'coral that is quietly crying', count: 7 },
    grass: 0, water: 5,
    monsters: [['zombie', 2], ['wraith', 3], ['thing', 3], ['opinion', 2], ['mimic', 1]],
    verse: [
      'The Sea-Caves are wet, and the Sea-Caves are sad.',
      "They're the saddest wet caves that a cave ever had.",
      'An Empty Sandwich floats by on the brine.',
      "If you cut it in two, it'll be twice as fine.",
    ],
  },
  {
    name: 'The Clockwork Nursery', wall: '#c8905a', floor: '#6a5646', light: 6,
    deco: { ch: ',', color: '#d8b060', name: 'loose cogs', density: 0.04 },
    prop: { ch: '=', color: '#e8c890', name: 'empty crib (still rocking)', count: 8 },
    grass: 0, water: 0,
    monsters: [['tot', 3], ['thing', 2], ['mimic', 2], ['wraith', 2], ['giraffe', 2]],
    verse: [
      'Tick-tock goes the nursery, tock-tick goes the crib.',
      "The Tots are wound tight, and they're wearing a bib.",
      "They'll count down your minutes, they'll count down your toes,",
      "and where Bottom Half's top half is, nobody knows.",
    ],
  },
  {
    name: 'The Bottom of Below', wall: '#aa3a5a', floor: '#6a3a4a', light: 6,
    deco: { ch: ',', color: '#e8d8c8', name: 'nibbled name-tags', density: 0.05 },
    prop: { ch: '∩', color: '#aa8a9a', name: 'heap of forgotten names', count: 6 },
    grass: 0, water: 0,
    monsters: [['mite', 3], ['giraffe', 2], ['tot', 2]],
    verse: [
      'At the Bottom of Below, where the Bottom is found,',
      'sits the Nameless Nibbler, all hungry and round.',
      "It has eaten ten thousand small names, maybe more,",
      "and yours is the dessert that it's been saving for.",
    ],
  },
];

// ai: chase | erratic | thief | ghost | mimic | splitter | boss
const MONSTERS = {
  mite: {
    ch: 'm', name: 'Mumbling Mold-Mite', color: '#9bd46a', hp: 4, atk: 2, def: 0, xp: 2, speed: 1, ai: 'chase',
    verbs: ['nibbles', 'gums', 'mumbles at'],
    blurb: 'It mumbles moldy lullabies to itself.',
    death: 'The Mold-Mite mumbles its last: "mmf."',
    lap: true,                // wait beside it instead of fighting, and it climbs into your lap and sleeps
  },
  bat: {
    ch: 'b', name: "Yesterday's Soup", color: '#c9a0ff', hp: 5, atk: 2, def: 0, xp: 3, speed: 1.5, ai: 'erratic',
    snuff: { chance: 0.35, wax: 25 }, // when it hits you, it may slop your candle half out
    verbs: ['slops onto', 'laps at', 'goes cold on'],
    blurb: 'It has gone cold, and it would like not to be.',
    death: "Yesterday's Soup is spilt. Nobody cries over it.",
  },
  putaway: {
    ch: 'w', name: 'Put-Away', color: '#ffa447', hp: 6, atk: 1, def: 0, xp: 5, speed: 1.2, ai: 'thief',
    steal: { chance: 0.5, gold: [5, 20] }, // instead of hitting: your things, or this many coins
    verbs: ['tidies', 'straightens'],
    blurb: 'It likes things put away. Your things. Away.',
    death: 'The Put-Away is put away. Nobody knows where.',
  },
  opinion: {
    ch: 'g', name: 'Second Opinion', color: '#4fd6c8', hp: 9, atk: 4, def: 1, xp: 6, speed: 1, ai: 'chase',
    verbs: ['examines', 'gnaws', 'prods'],
    blurb: 'It has had a look at you, and it does not agree.',
    death: 'The Second Opinion is overruled.',
    call: { after: 4, near: [5, 10], steps: 'squeak…' }, // after this many turns of fighting you, it calls one more (once), from this far away; until you can see the colleague, its footsteps are written where it walks
  },
  zombie: {
    ch: 'z', name: 'Better-Late-Than-Never', bare: true, color: '#8fbe9f', hp: 16, atk: 6, def: 1, xp: 10, speed: 0.5, ai: 'chase',
    verbs: ['puts the piano down on', 'unloads onto', 'leans on'],
    blurb: 'Slow, but it has an awful lot to carry.',
    death: 'Better-Late-Than-Never is, at last, never.',
  },
  wraith: {
    ch: 's', name: 'Ahem', color: '#a8c8ff', hp: 10, atk: 4, def: 0, xp: 9, speed: 1, ai: 'ghost',
    snuff: { chance: 0.5, wax: 20 }, // each "ahem" shrinks your flame
    verbs: ['coughs on', 'clears its throat at', 'ahems'],
    blurb: 'A cough with nobody attached. It comes through walls.',
    death: 'The Ahem clears its throat one last time, and has nothing to say.',
  },
  mimic: {
    ch: 'H', name: 'Nothing-to-Worry-About', color: '#ff5b5b', hp: 14, atk: 6, def: 1, xp: 12, speed: 1, ai: 'mimic',
    verbs: ['CHOMPS', 'worries', 'gobbles'],
    blurb: 'It is nothing. It has teeth. It is nothing.',
    death: 'The Nothing-to-Worry-About is nothing at all, now.',
  },
  thing: {
    ch: 'T', name: 'Empty Sandwich', color: '#ff8fc8', hp: 14, atk: 4, def: 1, xp: 7, speed: 1, ai: 'splitter',
    split: { chance: 0.5, gens: 2, minHp: 4 }, // chance a hit splits it; at most gens times; not below minHp
    verbs: ['slaps', 'folds over', 'butters'],
    blurb: 'Cut it in half and you get more, not less.',
    death: 'The Empty Sandwich goes stale. It never did get a filling.',
  },
  tot: {
    ch: 't', name: 'Tick-Tock Tot', color: '#ffe066', hp: 10, atk: 4, def: 1, xp: 12, speed: 2, ai: 'chase',
    verbs: ['tick-tocks', 'bites', 'kicks'],
    blurb: "Wound far too tight. It's very fast.",
    death: 'The Tick-Tock Tot winds down... dowwwn... d o w n.',
    tick: { hear: 10, silent: 3 }, // out of sight you hear it ticking (and see "tick… tock…") this many steps away; this close, it goes silent
  },
  giraffe: {
    ch: 'L', name: 'Bottom Half – Giraffe', bare: true, color: '#e8a860', hp: 26, atk: 7, def: 2, xp: 25, speed: 1, ai: 'chase',
    verbs: ['kicks', 'knees', 'steps on'],
    blurb: 'Four legs and some knees. Nobody has seen the rest.',
    death: 'Bottom Half – Giraffe folds at the knees. Far above, something is very surprised.',
  },
  sockling: {
    ch: 'j', name: 'Sockling', color: '#f0d8f0', hp: 5, atk: 3, def: 0, xp: 3, speed: 1.5, ai: 'chase',
    verbs: ['socks', 'slaps', 'smothers'],
    blurb: 'A lost sock, looking for its partner.',
    death: 'The Sockling goes limp. It is just a sock now. It always was.',
  },
  tuck: {
    ch: 'Ω', name: 'Tuck-You-In', color: '#e8e0ff', hp: 999, atk: 11, def: 99, xp: 0, speed: 0.7, ai: 'chase',
    unique: true, invulnerable: true,
    hitDread: 12, snuff: { wax: 20 }, // every time it tucks you in
    verbs: ['tucks', 'smothers', 'sings a lullaby at', 'fluffs a pillow over'],
    blurb: 'It has a blanket. It is time for bed.',
    death: 'The Tuck-You-In folds itself up neatly and goes back upstairs.',
  },
  nibbler: {
    ch: 'N', name: 'Nameless Nibbler', color: '#ff3b6b', hp: 80, atk: 9, def: 3, xp: 0, speed: 1, ai: 'boss', unique: true,
    boss: {
      phase2: 0.66, phase3: 0.33, // phase 2 once its health is no more than this share, phase 3 below that
      nibble2: 0.08, nibble3: 0.17, // how much of the margin's lettering it eats in phases 2 and 3
      eat: 0.28, eatItem: 0.6, eatHeal: 3, // from phase 2: chance per turn it eats (an item, or else a rhyme); heals this
      summonEvery: 7, summonEvery3: 5, crowd: 14, mite: 0.7, // calls a Mold-Mite (or a bat) every so many turns, up to a crowd
      taunt: 0.12,             // chance per turn of a taunt
      biteRhyme: 0.3,          // chance its blow also nibbles a rhyme out of your head
      lastRhymeHeal: 0.25,     // a wrong Last Rhyme heals it back to this share of its health
    },
    verbs: ['nibbles', 'NIBBLES', 'gnashes', 'gnaws on'],
    blurb: 'Round and hungry and full of other people\'s names.',
    death: 'The Nameless Nibbler bursts like a bun! Names flutter out everywhere.',
  },
};

// Each potion's words sit next to its numbers: `drink` is what you read when you drink it
// ({n}: health healed), `splash` when you throw it at a horror ({Them}: "The Second Opinion").
const POTIONS = [
  { id: 'heal', name: 'Tonic of Tolerable Health', freq: 5, desc: 'Heals a good chunk and cures poison.',
    power: { base: 10, per: 3 }, // health healed (drunk or thrown), by depth
    drink: 'Warm and tingly, like a hug from a kettle. (+{n})',
    splash: '{Them} laps it up gratefully. Oops.' },
  { id: 'bigheal', name: 'Elixir of Un-Deadening', freq: 1, desc: 'Heals you completely and makes you a bit bigger.',
    drink: 'You feel un-deadened! Every bit of you is present and accounted for. (+4 max HP)', // the 4 is in items.js
    splash: '{Them} is un-deadened. Completely. That was a waste of a miracle.' },
  { id: 'poison', name: 'Gloop of Regret', freq: 2, desc: 'Poison. Why are you still carrying this?',
    power: { base: 6, per: 1 }, thrown: 6, // turns of poison, by depth (thrown: on a horror)
    drink: 'It tastes like regret and old pennies. You feel extremely poorly.',
    splash: 'It sizzles. {Them} looks extremely poorly.' },
  { id: 'confuse', name: 'Fizz of Flibbertigibbet', freq: 2, desc: 'Makes your legs disagree with your brain.',
    power: 12, thrown: 6, // turns confused (thrown: turns a horror is dazed)
    drink: 'The room goes wibbly. The wibbles go wobbly. Uh oh.',
    splash: '{Them} goes wibbly, then wobbly, and forgets what it was doing.' },
  { id: 'might', name: 'Draught of Muchness', freq: 1, desc: 'Permanently +1 attack. You get mucher.',
    thrown: 2, // attack a horror gains (drinking it gives +1, as its words say)
    drink: 'You feel MUCHER. Much, much mucher. (+1 attack)',
    splash: '{Them} feels MUCHER. That was a mistake.' },
  { id: 'sight', name: 'Brew of Peeping', freq: 2, desc: 'Lets you sense every horror on the floor for a while.',
    power: 60, thrown: 8, // turns of sensing (thrown: turns a horror runs from you)
    drink: 'Your eyeballs itch... you can sense every horror on this floor!',
    splash: '{Them} can suddenly see everything, including you, and it runs.' },
];
const POTION_LOOKS = [
  ['bubbly blue', '#6fa8ff'], ['gloopy green', '#8be07a'], ['sulky puce', '#c07a9a'], ['fizzing pink', '#ff8fc8'],
  ['murky mauve', '#a88ac8'], ['lumpy lemon', '#ffe066'], ['smoky salmon', '#ff9a7a'], ['chunky teal', '#4fd6c8'],
];

// `read`: what you read when you read it aloud (a few have more than one way to go).
const SCROLLS = [
  { id: 'teleport', name: 'Scroll of Sudden Elsewhere', freq: 3, desc: 'Poofs you to a random spot on this floor.',
    read: 'POOF! You are suddenly elsewhere, which is not necessarily better.' },
  { id: 'map', name: 'Scroll of Knowing Where', freq: 2, desc: 'Reveals the layout of this floor.',
    read: 'The whole floor unrolls in your head like a map made of cheese.' },
  { id: 'fear', name: 'Scroll of Unfriendly Verse', freq: 2, desc: 'Every horror you can see runs away.',
    power: 15, bossPower: 4, // turns they run (the Nibbler and the Tuck-You-In: bossPower)
    read: {
      seen: 'You read a verse so unfriendly that everything nearby feels personally attacked. They flee!',
      alone: 'You read a verse so unfriendly that the walls blush. Nobody else is here to hear it.',
    } },
  { id: 'smite', name: 'Scroll of Thunderous Rhyme', freq: 2, desc: 'Lightning hits every horror you can see.',
    power: [6, 12], // damage to each (least, most)
    read: {
      boom: 'Thunder rhymes with blunder! KRA-KA-THOOM!',
      alone: '...but it hits nobody. The ceiling is slightly singed.',
      tickles: 'Lightning tickles {them}. It giggles.', // {them}: "the Tuck-You-In"
      licks: 'Lightning licks {them}. ({n})',           // {n}: the damage
    } },
  { id: 'enchant', name: 'Scroll of Sharpening Things', freq: 2, desc: 'Makes your weapon (or your fists) meaner.',
    read: {
      weapon: 'Your {weapon} grows sharper and meaner. (+1)',
      fists: 'Your fists feel pointier. (+1 attack)',
    } },
  { id: 'summon', name: 'Scroll of Company', freq: 1, desc: 'Summons monsters. Nobody knows why it exists.',
    power: [2, 3], // how many come (fewest, most)
    read: {
      company: 'You read aloud and... oh no. You have Company.',
      noRoom: 'Company tries to arrive, but there is no room. Phew.',
    } },
];
const SCROLL_TITLES = ['ZIBBLE ZOB', 'KLOPP NOODLE', 'NOBBLE FENCH', 'FLUNK-A-DUNK', 'WIBBA WUMP', 'SNORKLE HUD', 'BLIX VON GRUE', 'GLOMMERY'];

// `bad`: what you read when it has gone off (and poisons you).
const FOODS = [
  { id: 'eggs', name: "Somebody Else's Breakfast", heal: 9, spoil: 0.3, freq: 3,
    desc: 'Still warm. Nobody is missing it yet.',
    bad: 'Somebody Else has noticed. Your tummy apologises on your behalf.' },
  { id: 'ham', name: 'Pie of Uncertain Origin', heal: 13, spoil: 0.15, freq: 2,
    desc: 'Where did it come from? Best not to ask.',
    bad: "The Pie's origin becomes suddenly, horribly certain." },
  { id: 'beast', name: 'Slice of Roast Something', heal: 20, spoil: 0, freq: 1,
    desc: 'The good stuff. Nobody will say what the Something was.', bad: '' },
  { id: 'muffin', name: 'Mumble-Muffin', heal: 6, spoil: 0, freq: 3,
    desc: 'It mumbles a little when you bite it. Harmless.', bad: '' },
];

const WEAPONS = [
  { id: 'spork', name: 'Spork of Sorrow', atk: 1, tier: 1, desc: 'Half spoon, half fork, all sadness.' },
  { id: 'umbrella', name: 'Umbrella Most Unfortunate', atk: 2, tier: 2, desc: 'It only opens indoors.' },
  { id: 'shears', name: 'Grumbling Garden Shears', atk: 3, tier: 3, desc: 'They complain the whole time, but they cut.' },
  { id: 'snipper', name: 'Snicker-Snack Snipper', atk: 4, tier: 4, desc: 'It giggles when it hits.' },
  { id: 'axe', name: 'Butter-Side-Down Battle-Axe', atk: 6, tier: 5, desc: 'Always lands the wrong way. On your enemies.' },
];
// Things you wear go on your head or your body (matching socks go on your feet).
const ARMORS = [
  { id: 'nest', name: 'Second-Hand Nest', slot: 'head', def: 1, tier: 1, desc: "The previous owner hasn't quite moved out. Mildly protective." },
  { id: 'overcoat', name: 'Marmalade-Crusted Overcoat', slot: 'body', def: 1, tier: 2, desc: 'Sticky, but things bounce off it.' },
  { id: 'colander', name: 'Colander of Courage', slot: 'head', def: 2, tier: 3, desc: 'Keeps your thoughts in and the drips out.' },
  { id: 'chainmail', name: 'Sock-Knit Chainmail', slot: 'body', def: 2, tier: 3, desc: 'Knitted from ten thousand lost socks.' },
  { id: 'nightgown', name: 'Knight-Shade Nightgown', slot: 'body', def: 3, tier: 5, desc: 'The comfiest armor ever feared.' },
];
// Never found lying about: only the Mirror gives it (smash it).
const MIRROR_SHARD = { id: 'shard', name: 'Seven-Years Shard', atk: 4, tier: 4, desc: 'Bad luck, but pointy.' };

const ITEM_GLYPH = {
  potion: '!', scroll: '?', food: '%', weapon: ')', armor: '[', gold: '$',
  candle: '¡', sock: '§', pair: '§', bones: '†',
};
const ITEM_COLOR = {
  scroll: '#f0e6c8', food: '#b8e07a', weapon: '#8fb8ff', armor: '#4fd6c8', gold: '#ffe066',
  candle: '#ffb050', pair: '#ff8fc8', bones: '#d8d0c0',
};

const byId = list => Object.fromEntries(list.map(x => [x.id, x]));
const POTION_BY = byId(POTIONS);
const SCROLL_BY = byId(SCROLLS);
const FOOD_BY = byId(FOODS);

// Lone socks on the Catacombs floor. Two of the same pattern make a pair.
const SOCKS = { argyle: '#ff8fc8', stripy: '#8fb8ff', 'polka-dot': '#ffe066', holey: '#c8c0b0' };
