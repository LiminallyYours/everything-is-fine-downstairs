'use strict';
// R: Recite a Rhyme. You get half a couplet and a burning fuse; pick the word that rhymes.
// Get it right and the horrors reel. Get it wrong and something embarrassing happens.
// The couplets themselves are in content/couplets.js.

const RHYME_KEYS = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];

function startRhyme() {
  const p = G.player;
  if (p.verve < 1) {
    msg('You open your mouth, but the rhymes have all fled. (No ♪ left.)', C.gray);
    return;
  }
  const [a, b, answer, wrong] = RNG.pick(COUPLETS);
  const options = RNG.shuffle([answer, ...wrong]);
  const ms = ruleAt(RULES.rhyme.fuseMs, dreadTier()); // 12s calm ... 7.5s undone
  G.rhyme = { a, b, answer, options, ms, fuseT0: 0, result: null };
  openPage('rhyme', {
    style: 'rhyme', fast: true, lead: RULES.pages.rhymeLead, quiet: true, voice: 'narrator',
    stanzas: [['"' + a, b + '"']],
    onDone: () => { G.rhyme.fuseT0 = FX.now; },
  });
}

// choice: index into options, or -1 if the fuse burned out. The verdict sits on the page a moment.
function answerRhyme(choice) {
  makeNoise(); // reciting is noisy (Nap Time)
  const r = G.rhyme;
  if (r.result || !r.fuseT0) return;
  const word = choice >= 0 ? r.options[choice] : null;
  r.result = { word, right: word === r.answer, t: FX.now };
  Sound.play(r.result.right ? 'rhymeGood' : 'wah');
  if (!r.result.right) FX.jolt(3, C.red);
}

// Back to the map, where the rhyme takes effect.
function finishRhyme() {
  const r = G.rhyme, p = G.player, word = r.result.word;
  G.mode = 'play';
  G.page = null;
  G.logMark = G.log.length;
  if (!r.final) p.verve--;
  const line = r.b.replace('___', word ? word.toUpperCase() : TEXT.pages.uh);
  msg(`You recite: "${r.a} ${line}"`, C.purple);
  FX.say(p, line, word === r.answer ? C.purple : C.gray, 2600);
  if (r.final) return finishFinale(r, word === r.answer);
  if (word === r.answer) rhymeHit();
  else rhymeMiss(word);
  endTurn();
}

function startFinale(m) {
  G.logMark = G.log.length;
  msg('The Nibbler reels. It is nearly empty. "Wait," it says. "Say something. Say it in RHYME."', C.red);
  FX.say(m, 'Say it in RHYME, little Somebody.', m.d.color, 3500);
  const [a, b, answer, wrong] = RNG.pick(BOSS_COUPLETS);
  G.rhyme = { a, b, answer, options: RNG.shuffle([answer, ...wrong]), ms: RULES.rhyme.lastFuseMs, fuseT0: 0, result: null, final: true, boss: m };
  Sound.play('sting');
  FX.jolt(8, C.red);
  openPage('rhyme', {
    style: 'rhyme', final: true, fast: true, lead: RULES.pages.lastRhymeLead, quiet: true, voice: 'narrator',
    stanzas: [['"' + a, b + '"']],
    onDone: () => { G.rhyme.fuseT0 = FX.now; },
  });
}

function finishFinale(r, right) {
  const m = r.boss;
  if (right) {
    G.finaleWon = true;
    msg('The last rhyme lands. The Nibbler hiccups, and hiccups, and bursts.', C.purple);
    killMonster(m);
    return;
  }
  m.hp = Math.round(m.maxHp * m.d.boss.lastRhymeHeal);
  msg('The Nibbler swallows your wrong word whole and laughs. It looks much better now.', C.red);
  FX.say(m, 'Delicious. Try again, dessert.', m.d.color, 3000);
  hurtPlayer(RULES.rhyme.lastWrongHurt, 'nibbler');
  endTurn();
}

function nearbyMonsters(radius) {
  const p = G.player;
  return G.level.monsters.filter(m => Math.max(Math.abs(m.x - p.x), Math.abs(m.y - p.y)) <= radius);
}

function rhymeHit() {
  const p = G.player, L = G.level, R = RULES.rhyme;
  G.stats.rhymeWins++;
  addDread(R.goodDread);
  const hit = nearbyMonsters(R.reach);
  for (const m of hit) {
    if (m.disguised) revealMimic(m);
    m.awake = true;
    m.stun = m.d.ai === 'boss' ? R.bossStun : R.stun;
    const tx = m.x + Math.sign(m.x - p.x), ty = m.y + Math.sign(m.y - p.y);
    if (canEnter(L, m, tx, ty)) moveMonster(L, m, tx, ty, false);
    if (!m.d.invulnerable) {
      const dmg = RNG.int(...R.damage);
      m.hp -= dmg;
      FX.float(m.x, m.y, '-' + dmg, C.purple);
      if (m.hp <= 0) killMonster(m);
    }
  }
  msg(hit.length ? `It rhymes! ${hit.length === 1 ? 'A horror reels' : hit.length + ' horrors reel'} from the sheer poetry of it.`
    : 'It rhymes beautifully. Nobody is here to appreciate it. Typical.', C.purple);
}

function rhymeMiss(word) {
  const p = G.player, L = G.level, R = RULES.rhyme;
  G.stats.rhymeFails++;
  addDread(R.badDread);
  msg(word ? `"${word}"? That doesn't rhyme. That doesn't even try.` : 'The fuse burns out. You say "uh." The horrors wait politely.', C.gray);
  const near = nearbyMonsters(R.reach).filter(m => !m.disguised);
  const outcome = RNG.pick(near.length ? ['laugh', 'offend', 'confuse', 'mite'] : ['confuse', 'mite']);
  if (outcome === 'laugh') {
    near.forEach(m => { m.stun = Math.max(m.stun, 1); });
    Sound.play('laugh', 1, 0, 0.9);
    msg('The horrors laugh so hard at your poetry that they forget to eat you. Briefly.', C.pink);
  } else if (outcome === 'offend') {
    nearbyMonsters(R.offendReach).forEach(m => { if (!m.disguised) { m.awake = true; m.frenzy = R.offendFrenzy; } });
    msg('The horrors are OFFENDED. That was not even close. They come at you faster.', C.red);
  } else if (outcome === 'confuse') {
    p.confused += R.badConfused;
    msg('You confuse yourself. What rhymes with anything? What is a word?', C.pink);
  } else {
    const s = freeNeighbor(L, p.x, p.y);
    if (s) {
      spawnMonster(L, 'mite', s[0], s[1]).awake = true;
      msg('Your rhyme was so bad it curdled into a Mold-Mite.', C.orange);
    } else {
      msg('Your rhyme was so bad that the air itself winces.', C.orange);
    }
  }
}
