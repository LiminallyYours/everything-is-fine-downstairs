'use strict';
// What monsters say out loud (speech bubbles), what the dark whispers, the narrator's running gags,
// and the personal line added to your epitaph.

const SPEECH = {
  mite: {
    spot: ['Mmf? Mmf-mmf. (Dinner.)', 'mmf. mmf? MMF!', 'A toe! Mmf! A whole toe!'],
    hit: ['Nom. Mmf. Sorry. Nom.', 'mmf-nom.', 'Nibble, nibble, sorry, nibble.'],
    hurt: ['mmf!!', 'Rude. Mmf.'],
    die: ['mmf...'],
  },
  bat: {
    spot: ['Hello! I was soup, once. Yesterday.', 'Ooh. Warm. Are you warm?', 'Ooh, a CANDLE! I love candles!'],
    hit: ['Slop!', 'Lukewarm! Sorry! Lukewarm!', 'Whoops, lap!'],
    hurt: ["You'll spill me!", 'Not the bowl!'],
    die: ['Tell tomorrow... I was... soup...'],
  },
  putaway: {
    spot: ['What a LOT of things you have!', 'Ooh, pockets! Untidy pockets!', "That doesn't go there. I'll take it."],
    hit: ['A place for everything!', 'Tidy! Tidy! Tidy!'],
    hurt: ["Don't! You'll make a mess!"],
    die: ['I never... found... the drawer...'],
  },
  opinion: {
    spot: ["Let's have a look at you.", 'Oh dear. Oh dear, oh dear.', 'Hold still. I only want a little.'],
    hit: ['Does it hurt when I do THIS?', 'Mm. As I thought.'],
    hurt: ['I DISAGREE!', 'In my opinion: ow!'],
    die: ['I should like... a third opinion...'],
    call: ["I'd like a second opinion on this.", 'Colleague! Come and look at THIS.', 'Most unusual. I must consult.'],
  },
  zombie: {
    spot: ["Sorry I'm late. Is this where it goes?", 'Coming... coming...', "Wait for me. I'm not fast."],
    hit: ['Down it goes.', 'There.', 'Mind the pond.'],
    hurt: ['Careful. I am carrying things.'],
    die: ["I'll just... put this... here..."],
  },
  wraith: {
    spot: ['Ahem.', 'Ahem. AHEM.', 'A-hem. Excuse me. Ahem.'],
    hit: ['AHEM.', 'Hem hem.'],
    hurt: ['Ahem?!'],
    die: ['A... hem...'],
  },
  mimic: {
    spot: ["SURPRISE! I'm NOTHING!", "Don't worry! DON'T WORRY!"],
    hit: ['Nothing to it!', "It's nothing! It's NOTHING!"],
    hurt: ["That's nothing!"],
    die: ['It was... nothing...'],
  },
  thing: {
    spot: ['Is that a filling? Is that a WHOLE filling?', "We're a sandwich! There's nothing in us!", 'Hello! Hello! (hello.)'],
    hit: ['Get in!', 'Between us! Go on!'],
    hurt: ['Ow! Now there are MORE of us!'],
    die: ['We never... had... a filling...'],
  },
  tot: {
    spot: ['Are you my mummy? Are you my DINNER?', 'Tick! Tock! PLAYTIME!', 'Wind me up! Wind me UP!'],
    hit: ['Tick-tock, BITE-tock!', 'Nap time is for losers!'],
    hurt: ['WAAAH! (tick)'],
    die: ['tick... tock... ti...'],
  },
  giraffe: {
    spot: ['(from far above) Hello down there!', '(from far above) Is somebody at my feet?', '(from far above) I can hear you. I think.'],
    hit: ['(far above) Was that you? Sorry!', '(far above) Whoops!'],
    hurt: ['(far above) Ow? ...Ow.'],
    die: ['(far above) Oh. I seem to be... shorter...'],
  },
  sockling: {
    spot: ['Is that MY partner?!', 'SOCK! SOCK! SOCK!'],
    hit: ['Give it BACK!'],
    hurt: ['Mnff!'],
    die: ['Unmatched... forever...'],
  },
  tuck: {
    spot: ['Time for bed, sleepyhead.', "You've been up SO late."],
    hit: ['Tuck, tuck, tucky-tuck.', 'Snug as a bug. In a rug. Forever.'],
    hurt: ['Hee hee. That tickles.'],
    die: [''],
    idle: [
      'Ten little toes, all tucked in a row...',
      'Shhh. Shhh. Shhhhhhh.',
      'I have a nice warm blanket for you.',
      "Don't let the bedbugs bite. I'll do it.",
      'Close your eyes. Close them. CLOSE THEM.',
      "Where's my sleepy little Somebody?",
    ],
  },
  nibbler: {
    spot: ['Ooh. Dessert.'],
    hit: ['Nom. NOM. Nom.', 'Your name was DELICIOUS.', 'I ate a Bert once. Better than you.'],
    hurt: ['Mind the teeth! They are all I have!', 'Ow! My tummy of names!', 'You are giving me hiccups!'],
    die: ['I only wanted... to know... who I was...'],
  },
};

const WHISPERS = [
  'the tea is getting cold',
  'happy deathday, somebody',
  'your reflection is waiting for you',
  'we kept your seat warm',
  'shhh. the nibbler is sleeping. (it is not)',
  'psst. psst. behind you.',
  'your name tasted like lemons',
  'down, down, further down',
  'is that your shadow? are you sure?',
  'your name is on the tip of our tongue',
  'one of these walls is breathing',
  'somebody, somebody, nobody',
  'it is almost bedtime',
];

// [key, condition(stats), line] — each fires once per run.
const GAGS = [
  ['coward', () => G.depth >= 3 && G.player.kills === 0, 'You have reached Floor 3 without bonking anything. The horrors are starting to find it insulting.'],
  ['hoarder', () => pocketsFull(), 'Your pockets are so full that they have started making noises.'],
  ['stubs', s => s.stubs >= 6, 'You have collected so many candle stubs that you smell like a small, frightened church.'],
  ['pickle2', s => s.barrels >= 4, 'You have been inside more barrels than most pickles.'],
  ['strangers', s => s.rooms >= 3, 'You keep accepting invitations from strangers in the dark. Your mother would be so proud. Or so dead.'],
  ['gerald', s => s.waitsInRow >= 12, 'You have stood still so long that a spider has named you. It named you Gerald.'],
  ['wall', s => s.wallBumps >= 6, 'The wall remains unconvinced by your arguments.'],
  ['eggs', s => s.eggs >= 3, "You have eaten so many of Somebody Else's breakfasts that Somebody Else has started skipping lunch."],
  ['labels', s => s.unknownDrinks >= 4, 'You drink mystery liquids with the confidence of someone who has never read a label.'],
  ['dark', s => s.darkTurns >= 25, 'You have been in the dark so long that your eyes have stopped bothering.'],
  ['pickle', s => s.hiddenTurns >= 15, 'You have been in the barrel so long that you are legally a pickle.'],
  ['heckle', s => s.rhymeFails >= 3, 'Your poetry is getting worse. Somewhere in the dark, something is heckling.'],
  ['support', () => G.player.kills >= 25, 'The horrors have started a support group about you. It meets on Floor 4.'],
  ['rich', () => G.player.gold >= 300, 'You have so many Tootle-Coins that they have started to tootle.'],
  ['poet', s => s.rhymeWins >= 5, 'Five perfect rhymes! Somewhere in the dark, something claps. It has more than two hands.'],
];

function checkGags() {
  for (const [key, cond, line] of GAGS) {
    if (!G.stats.gags[key] && cond(G.stats)) {
      G.stats.gags[key] = true;
      msg(line, C.purple);
    }
  }
}

// One extra, personal line for the tombstone, built from how the run actually went.
function deathFact() {
  const p = G.player, s = G.stats;
  const snacks = p.inv.filter(i => i.kind === 'food').length;
  const unknown = p.inv.filter(i =>
    (i.kind === 'potion' && !G.known.potion[i.id]) || (i.kind === 'scroll' && !G.known.scroll[i.id])).length;
  const facts = [
    [G.killerId === 'tuck', 'They dawdled. Now they sleep. Nobody will wake them. Nobody will try.'],
    [G.killerId === 'wall', 'They were eaten by the architecture, which is rare, and a little embarrassing.'],
    [p.wick <= 0, 'They died in the dark, which saved everyone the trouble of looking.'],
    [!!s.lastStolen, `A Put-Away has put their ${s.lastStolen} somewhere safe. Nobody will ever find it.`],
    [snacks >= 2, `They died with ${snacks} snacks uneaten. Such waste. Such taste.`],
    [unknown >= 2, `They carried ${unknown} mysteries they never opened. Now they never will.`],
    [G.depth === 1, 'They made it all the way to the first floor.'],
    [p.kills === 0, 'They bonked no one. Pacifism is its own reward. This is the reward.'],
    [s.rhymeFails >= 3, `Their last ${s.rhymeFails} rhymes did not rhyme. Nobody will miss those.`],
    [s.waits >= 60, `They spent ${s.waits} turns waiting for things to get better.`],
    [p.dread >= RULES.dread.tiers.undone, 'By the end they could not even rhyme. They could not even'],
    [G.killerId === 'nibbler', 'They got so very close. The Nibbler says thank you for the effort, and also for the flavour.'],
    [!!s.rangBell, 'They rang the bell at the Lost & Found. Nobody rings the bell.'],
    [!!s.smashedMirror, 'Seven years of bad luck, the mirror promised. It was generous.'],
    [!!G.alias, `For a little while, they were called ${G.alias}. It suited them.`],
  ].filter(f => f[0]);
  return facts.length ? RNG.pick(facts.slice(0, 2))[1] : `They reached Level ${p.level}, which was not enough.`;
}
