'use strict';
// The rhyme duel's couplets: [first line, second line with ___ for the missing word, the word
// that rhymes, three that don't]. Add as many as you like; the duel picks one at random.

const COUPLETS = [
  ['One for sorrow, two for boo,', 'I will not be eaten, not by ___!', 'you', ['Gerald', 'a spoon', 'anyone, probably']],
  ['Three blind mice and one blind louse,', 'see how they run from out of my ___!', 'house', ['Kevin', 'lasagna', 'sir']],
  ['Hickory, dickory, dreadful dock,', "back off, beast, or I'll clean your ___!", 'clock', ['teeth', 'mother', 'room']],
  ['Twinkle, twinkle, little fright,', 'get out of my personal ___!', 'light', ['bathtub', 'space, please', 'Tuesday']],
  ["Hush, little horror, don't make a peep,", "or I'll rhyme you right back to ___!", 'sleep', ['Ohio', 'your mum', 'the shop']],
  ['Humpty Dumpty sat on a wall.', "You're next, and you're not even ___!", 'tall', ['Humpty', 'invited', 'an egg']],
  ['Roses are red and the night is black,', "take one more step and I'll bonk you ___!", 'back', ['gently', 'probably', 'with love']],
  ["I have a spork and I'm standing just so,", 'and I will not be eaten, and that is a ___!', 'no', ['maybe', 'pity', 'yes, fine']],
  ['Beware, beware, you beast of the deep,', "my rhymes are sharp, and they don't come ___!", 'cheap', ['wet', 'loud', 'borrowed']],
  ['Out, out, you gnashing, gnawing brute,', "or I'll recite until you're ___!", 'mute', ['bored', 'Belgian', 'dead? maybe?']],
  ['Go back to your hole, go back to your den,', 'and never come nibbling near me ___!', 'again', ['tomorrow', 'on weekends', 'without asking']],
  ['The moon is a bone and the sky is a sore,', 'so kindly go back through the wall or the ___!', 'door', ['window', 'gift shop', 'ceiling']],
  ["I've eaten a breakfast that wasn't for me,", "and I am not scared of whatever you ___!", 'be', ['are', 'is', 'eat']],
  ['Stay where you are, you creep, you crawler,', 'or I will grow suddenly, terribly ___!', 'taller', ['nicer', 'Gerald', 'damp']],
  ['Rock-a-bye monster, on the tree top,', 'when my rhyme hits you, your head will go ___!', 'pop', ['away', 'sideways', 'hmm']],
  ['I am a Somebody, small but not meek,', "I'll rhyme you so hard you won't eat for a ___!", 'week', ['while', 'fortnight', 'minute']],
  ['Down in the dark where the dreadfuls creep,', "I've a rhyme for you, and it cuts ___!", 'deep', ['sideways', 'a little', 'nothing']],
  ['Fee, fi, fo, and a fiddle-dee-dum,', "here comes a rhyme, so you'd better ___!", 'succumb', ['relax', 'hide', 'sit']],
  ["I've a long way to go and a great deal to see,", "and I can't see a thing from the inside of ___!", 'thee', ['the fridge', 'Ohio', 'a sock']],
  ['Tick-tock, tick-tock, you clockwork snot,', "I'll rhyme you so hard you'll be tied in a ___!", 'knot', ['bow', 'Tuesday', 'hug']],
  ['Sing a song of sixpence, a pocket full of doom,', "there isn't enough of you here for this ___!", 'room', ['poem', 'nonsense', 'hallway']],
  ['The candle burns low and the shadows grow long,', 'but nothing can stand up to this, my ___!', 'song', ['spork', 'lawyer', 'mum']],
  ['The night is a sock and the moon is a hole,', "I'll darn you right up, you unravelled old ___!", 'soul', ['sock', 'yarn', 'uncle']],
  ['Little Bo Peep has lost all her sheep,', 'and YOU will be lost in a very big ___!', 'heap', ['pile', 'mess', 'barn']],
  ["I've got a candle and I've got my wits,", "I've got a rhyme that will knock you to ___!", 'bits', ['pieces', 'sleep', 'the shops']],
  ['Your breath smells of cellars, your teeth smell of tombs,', 'so go back to your dark and your damp little ___!', 'rooms', ['house', 'mother', 'bathtub']],
  ['Grumble and gristle and gribble and gruff,', "I've heard all your growling and I've had ___!", 'enough', ['a snack', 'a nap', 'my doubts']],
  ['A spider, a spoon, and a sock full of sand,', "I'm the scariest Somebody in all of the ___!", 'land', ['cellar', 'room', 'hallway']],
  ['Beneath the old stairs, where the cobwebs hang low,', "I've a rhyme up my sleeve, and it's ready to ___!", 'go', ['leave', 'launch', 'sneeze']],
  ['You slither, you slobber, you slurp and you slink,', "but you're not half as scary as you seem to ___!", 'think', ['believe', 'suppose', 'hope']],
  ['A-tisket, a-tasket, a coffin, a casket,', "I'll pack up your bones in a little green ___!", 'basket', ['box', 'sack', 'bag']],
  ['Wee Willie Winkie runs through the town,', "and I'll rhyme you so hard that you'll fall right ___!", 'down', ['over', 'asleep', 'apart']],
  ['Hey diddle diddle, the cat and the fiddle,', "I'll rhyme you in half, right down the ___!", 'middle', ['centre', 'seam', 'spine']],
  ['Pease porridge hot, pease porridge cold,', "you're ugly, you're smelly, and frankly, you're ___!", 'old', ['rude', 'damp', 'late']],
  ['There was an old woman who lived in a boot,', "and she'd boot you right out, you horrible ___!", 'brute', ['creature', 'fellow', 'goblin']],
  ['Baa, baa, black sheep, have you any fright?', "Three bags full, and I'll give you a ___!", 'bite', ['hug', 'nudge', 'receipt']],
  ['Row, row, row your boat, gently down the stream;', "take one more step and I'll shriek, I will ___!", 'scream', ['yell', 'cry', 'complain']],
  ["I'm small and I'm scared and I'm lost in the gloom,", "but I'm not going quietly into your ___!", 'tomb', ['tummy', 'hole', 'mouth']],
  ["I don't want to fight and I don't want to flee,", 'so please be a dear and go bother a ___!', 'bee', ['moth', 'wasp', 'neighbour']],
  ['You moldy old monster, you mumble and moan,', 'go find someone else, and leave me ___!', 'alone', ['be', 'here', 'with snacks']],
];

// The Last Rhyme: when the Nibbler is all but empty, it can only be finished in verse.
const BOSS_COUPLETS = [
  ['You nibbled my name and you nibbled it thin,', "but a name's not a snack, and it's time that I ___!", 'win', ['ate', 'apologised', 'left']],
  ["You're round as a moon and you're wide as a door,", "but you won't eat a Somebody, not any ___!", 'more', ['again? please?', 'on Tuesdays', 'without gravy']],
  ["I've been Somebody Number and Somebody Who,", "and now I'm the Somebody who's finishing ___!", 'you', ['lunch', 'nothing', 'mildly']],
  ['You gobbled the Berts and you gobbled the Beas,', "now spit out my name, and I'll ask you once: ___!", 'please', ['thanks', 'now', 'or else']],
];
