'use strict';
// Storybook pages: a verse and a tip for every horror (its portrait is drawn, in draw/sprites.js).
// The first time you ever meet one, the game stops and shows its page with a sting.

const BESTIARY = {
  mite: {
    verse: [
      'The Mold-Mite is small and the Mold-Mite is green.',
      'It mumbles the lullabies no one has seen.',
      "It nibbles your toes while you're trying to nap,",
      'then it mumbles "mmf, sorry," and sits in your lap.',
    ],
    tip: 'Weak alone. Rarely alone.',
  },
  bat: {
    verse: [
      "Yesterday's Soup has gone cold in its bowl,",
      "so it's up and it's out for a bit of a stroll.",
      "It would like to be warm, and it isn't. It's not.",
      "You've a candle. You're warm. It likes both, quite a lot.",
    ],
    tip: 'Erratic. Its slopping can snuff your candle.',
  },
  putaway: {
    verse: [
      "The Put-Away loves you. It loves what you've got.",
      "It puts things away, whether you'd like it or not.",
      'Your spork and your tea have been filed with great care',
      "in a drawer that it keeps. The drawer isn't there.",
    ],
    tip: 'Takes things from your pockets and runs. Bonk it to get them back.',
  },
  opinion: {
    verse: [
      'The Second Opinion has come for a look.',
      "It's checked both your knees and it's written a book.",
      "It thinks you've too many of most of your bits.",
      "It has brought its own teeth, and it's seeing what fits.",
    ],
    tip: 'All bite. Fight it in a corridor.',
  },
  zombie: {
    verse: [
      'Better-Late-Than-Never is terribly late.',
      'It set off last spring with a terrible weight:',
      'a piano, a pond, and a week from next year.',
      "It just needs a place it can put them. You're here.",
    ],
    tip: 'Slow, but hits very hard. Just walk away.',
  },
  wraith: {
    verse: [
      'The Ahem is a cough with nobody attached.',
      'It comes through the wall, which it leaves quite unscratched.',
      "It has something to tell you. It won't tell you what.",
      'Each "ahem" your flame shrinks. It\'s ahem-ing a lot.',
    ],
    tip: 'Comes through walls. Each cough shrinks your flame.',
  },
  mimic: {
    verse: [
      'On the floor is a Nothing-to-Worry-About.',
      "It is nothing. It's lovely. Go on, there's no doubt.",
      'It has opened, which Nothing-to-Worries all do,',
      "and it's nothing with teeth. It is nothing to you.",
    ],
    tip: 'Pretends to be something worth picking up.',
  },
  thing: {
    verse: [
      "Cut a sandwich in two and it's two. That's the rule.",
      "Cut those and it's four, as they teach you in school.",
      "They've no filling at all, and they're terribly thin,",
      "and they've all had a look, and they'd like you put in.",
    ],
    tip: 'Splits when hit. Finish the small ones fast.',
  },
  tot: {
    verse: [
      'Tick-tock goes the Tot with a key in its back.',
      "It was wound up too tight, and it's coming to snack.",
      'It runs on its gears and it runs on your fear,',
      "and it ticks when it's coming. Listen. It's near.",
    ],
    tip: 'Very fast. You can hear it ticking before you see it.',
  },
  giraffe: {
    verse: [
      'Bottom Half – Giraffe is four legs and some knees.',
      'The rest of it goes through the ceiling with ease.',
      "What's up at the top? No one's seen it, it's said.",
      "It's bending down now. That is probably the head.",
    ],
    tip: 'Tough. Save a rhyme or a scroll for it.',
  },
  sockling: {
    verse: [
      'Every sock that gets lost leaves a sock that is left,',
      'and the lost ones come here to be buried, bereft.',
      "Now you've taken a sock, and they all want to know:",
      "is it THEIRS? Is it THEIRS? And they won't let you go.",
    ],
    tip: 'Rises when you take a sock. Weak, fast, and many.',
  },
  tuck: {
    verse: [
      'Time for bed! Time for bed! You have dawdled too long,',
      'so the Tuck-You-In comes with its blanket and song.',
      'It will tuck you in tight, it will tuck you in deep.',
      'It will tuck you in forever. Now go to sleep.',
    ],
    tip: 'Cannot be hurt. A good rhyme stuns it. Find the stairs.',
  },
  nibbler: {
    verse: [
      'It is round as a moon, it is wide as a door,',
      'it has eaten ten thousand small names, maybe more.',
      'It hiccups a Bea and it belches a Bert,',
      'and it saved you for last, like a nice, big dessert.',
    ],
    tip: 'Summons help. Speeds up when hurt. Your name is in there.',
  },
};

// Which pages you've ever seen, across all runs.
function bestiarySeen() { return Store.load('bestiary', []); }
function markBestiary(type) {
  const seen = bestiarySeen();
  if (!seen.includes(type)) { seen.push(type); Store.save('bestiary', seen); }
}
