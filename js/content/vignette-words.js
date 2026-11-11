'use strict';
// The words of the odd rooms, by room id and choice id. What each choice does is in
// rules/vignettes.js: it returns an outcome key (and maybe some {values}), and the lines under
// that key are what you read. The pictures are in draw/vignette-art.js.
//
// Each room: its name, the line when you first see it (found), the line when you walk into it
// again (usedMsg), its verse, and its choices in the order offered. Each choice: its label, then
// one list of lines per outcome. Numbers the words spell out ("Toss in 20 coins", "+4 health")
// are typed again next to the rule that does it, in rules/vignettes.js; change both together.
// tests/check-rooms.js checks every choice has both words and rules, and every {value} is filled.

// The name tags at the Lost & Found.
const ALIASES = ['Gerald', 'Mildred', 'Barnaby Noodle', 'Agatha Pumpernickel', 'Kevin', 'Ignatius Flump', 'Dorothea Sprocket'];

const VIGNETTE_WORDS = {
  teaparty: {
    name: 'The Tea Party',
    found: 'A tea party is laid out in the dark. The only guest is asleep. Probably asleep.',
    usedMsg: 'The tea party is over. The guest is still asleep. Probably.',
    verse: [
      'A table, a teapot, three cups and a guest',
      'who is either asleep or eternally at rest.',
      'The tea is still steaming. It smells of regret.',
      "There's a chair with your name on. (You don't have one yet.)",
    ],
    choices: {
      pour: {
        label: 'Pour yourself a cup',
        well: ['It is delicious, and it is still warm.', 'The guest smiles in its sleep. You feel entirely better.'],
        poisoned: ['It tastes of old pennies and older secrets.', 'You have been poisoned, but very politely.'],
        calm: ['You feel very, very calm.', 'Suspiciously calm. The room is gently spinning. That is fine. That is fine.'],
      },
      sugar: {
        label: 'Pocket the sugar lumps',
        took: ['You pocket a fistful of sugar lumps. They are, oddly, {n} coins.', 'The guest opens one eye. "Manners," it says, and goes back to sleep.'],
      },
      tiptoe: {
        label: 'Tiptoe away',
        done: ['You tiptoe away. Very wise. Rude, but wise.'],
      },
    },
  },

  birthday: {
    name: 'The Birthday Room',
    found: 'Somewhere in the dark, a small crowd whispers: "Surprise."',
    usedMsg: 'The party is over. The wax you is still smiling.',
    verse: [
      'HAPPY DEATHDAY, it says, in icing so neat,',
      'on a cake that is candled and wholly complete.',
      'And there in the corner, in wax, there is you,',
      'with a party balloon. It is smiling. At who?',
    ],
    choices: {
      wish: {
        label: 'Blow out the candles and make a wish',
        rhyme: ['You blow out the candles and wish with your whole chest.', 'You feel a new rhyme settle in, like a cat on a chair. (+1 rhyme)', 'The wax you smiles a little wider.'],
        know: ['You blow out the candles and wish with your whole chest.', 'Suddenly you know what every potion and every scroll is for. That is a lot to know.', 'The wax you smiles a little wider.'],
        big: ['You blow out the candles and wish with your whole chest.', 'You feel a size bigger. (+4 health)', 'The wax you smiles a little wider.'],
      },
      candles: {
        label: 'Take the birthday candles',
        took: ['You take the birthday candles. It is your deathday, after all. You deserve some light.', 'When you look back, the wax you has turned its head to watch you go.'],
      },
      cake: {
        label: 'Eat the cake',
        waxy: ['You eat a slice. It is mostly wax. You eat another. That was a mistake.'],
        lemon: ['You eat a slice of your own deathday cake.', 'It is lemon. Your favourite. How did they know?'],
      },
    },
  },

  mirror: {
    name: 'The Mirror',
    found: 'There is a tall mirror here. Your reflection arrives a moment after you do.',
    usedMsg: 'The mirror is quiet now. It is not reflecting anything, including you.',
    verse: [
      'The mirror is tall and the mirror is old.',
      'Your reflection is there, as you hoped. As you\'re told.',
      'You lift up your hand, and it lifts up its own,',
      'a moment too late. Then it waves on its own.',
    ],
    choices: {
      shake: {
        label: 'Shake its hand',
        traded: [
          'You reach into the mirror. Its hand is cold, and it is holding something.',
          'It takes your {took} and gives you {gift}. Fair trade. Probably.',
          'When you let go, the mirror is empty. Your reflection has gone somewhere else.',
        ],
        given: [
          'You reach into the mirror. Its hand is cold, and it is holding something.',
          'It gives you {gift} and asks for nothing. That is the frightening part.',
          'When you let go, the mirror is empty. Your reflection has gone somewhere else.',
        ],
      },
      smash: {
        label: 'Smash it',
        done: ['CRASH. Seven years of bad luck.', 'Luckily, you will not live that long.', 'You keep the sharpest piece. (Seven-Years Shard)'],
      },
      back: {
        label: "Back away (don't turn around)",
        done: ['You back away slowly.', 'Your reflection does not.'],
      },
    },
  },

  lostfound: {
    name: 'The Lost & Found',
    found: 'A desk stands in the dark with a bell on it. Behind the desk, something is filing its nails. The nails are bones.',
    usedMsg: 'The clerk is busy. The clerk has been busy for four hundred years.',
    verse: [
      'LOST & FOUND, says the sign, and behind it, a clerk',
      'made of bones and of patience, who\'s been here since work',
      'was invented. "Lost something?" It sighs. "Take a seat.',
      'Everyone down here has lost something. Name? ... Neat."',
    ],
    choices: {
      name: {
        label: 'Ask for your name back',
        tag: ['The clerk rummages for a very long time.', 'It hands you a name tag. It says "{alias}". It is not yours.', 'You wear it anyway. It helps, a little.'],
      },
      handin: {
        label: 'Hand in something you found',
        nothing: ['You have nothing to hand in. The clerk writes that down, slowly.'],
        swapped: ['You hand in your {given}.', 'The clerk files it under M, for Mine, and gives you two things somebody else lost.'],
      },
      bell: {
        label: 'Ring the bell',
        everybody: ['DING.', 'Nobody rings the bell. That is the rule. Here comes everybody.'],
        nobody: ['DING.', 'Nobody rings the bell. Luckily, nobody came.'],
      },
    },
  },

  well: {
    name: 'The Wishing Well',
    found: 'You hear water somewhere below. Also, very faintly, something saying your number.',
    usedMsg: 'The well has nothing more to say to you. It is sulking.',
    verse: [
      'A well in the dark, with a bucket and chain,',
      'and a voice at the bottom that sounds like the rain.',
      '"A coin for a wish," it says, sweet as can be,',
      '"or lean in real close. I have something to see."',
    ],
    choices: {
      coins: {
        label: 'Toss in 20 coins',
        poor: ['You do not have twenty coins. The well can tell. The well is disappointed in you.'],
        paid: ['Plink. The well hiccups.', 'You feel refreshed, re-lit, and only slightly haunted.'],
      },
      lean: {
        label: 'Lean in close',
        faces: ['You lean in close.', 'At the bottom there are {dead} faces. They all look like you. They all wave.', "They teach you a rhyme. You wish they hadn't. (+1 rhyme)"],
        yours: ['You lean in close.', 'At the bottom there is one face. It is yours. It waves.', "They teach you a rhyme. You wish they hadn't. (+1 rhyme)"],
      },
      walk: {
        label: 'Walk on',
        done: ['The well sounds disappointed. Wells always do.'],
      },
    },
  },

  musicbox: {
    name: 'The Music Box',
    found: 'A music box is playing somewhere close by. It is playing your song. It has always been playing your song.',
    usedMsg: 'The music box has nothing more to play for you.',
    verse: [
      'A music box sits on a stool in the gloom,',
      'with a dancer who spins in a very small room.',
      "It's playing your song. It's been playing for years.",
      "It's been waiting for you. And it's wound up. It hears.",
    ],
    choices: {
      wind: {
        label: 'Wind it up',
        done: ['You wind the key. The little dancer spins. The song starts over from the very beginning.', 'Bedtime has been put off. The Tots, however, are wide awake.'],
      },
      smash: {
        label: 'Smash it',
        done: ['The music stops.', 'Somewhere upstairs, something gets out of bed.', 'In the wreckage you find two things worth keeping.'],
      },
      close: {
        label: 'Close the lid gently',
        done: ['You close the lid. The dancer stops mid-spin.', 'Good night, dancer.'],
      },
    },
  },

  namepile: {
    name: 'The Name Pile',
    found: 'A great heap of paper tags rustles in the dark. Every one of them has a name on it. None of them are yours. Probably.',
    usedMsg: 'The names have settled down again.',
    verse: [
      'Here are the names that the Nibbler has chewed,',
      'the Berts and the Beas and a Gwendolyn, stewed.',
      'And somewhere in here, maybe, maybe, your own,',
      'in the heap with the rest, sucked right down to the bone.',
    ],
    // the names you might dig up
    names: ['KEVIN', 'GWENDOLYN', 'BERT', 'BEA', 'HORACE', 'SOMEBODY #3'],
    choices: {
      dig: {
        label: 'Dig for your name',
        mites: ['You dig. Some of the names were not names.', 'Some of the names were Mold-Mites.'],
        found: ['You dig and you dig and you find a name. It says {found}. It is not yours.', 'Whoever they were, they will not be needing it. You feel a little bigger for holding it.'],
      },
      read: {
        label: 'Read some of them aloud',
        done: ['You read the names aloud, one by one.', 'The dead appreciate it. The living, less so. (Your rhymes are refilled.)'],
      },
      leave: {
        label: 'Leave them in peace',
        done: ['You leave the names in peace. They were not going anywhere.'],
      },
    },
  },
};
