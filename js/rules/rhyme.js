'use strict';
// R: Recite a Rhyme. First pick which kind (a shove, a lullaby or a tongue-twister); then you
// get half a couplet and a burning fuse, and pick the word that rhymes. Get it right and the
// kind you picked takes effect. Get it wrong and something embarrassing happens. Rhyme too often
// and your voice goes hoarse: shorter fuses, smudged words, until you rest it.
// The couplets themselves are in content/couplets.js.

const RHYME_KEYS = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
const RHYME_KINDS = ['shove', 'lullaby', 'twister'];          // keys 1, 2, 3
const RHYME_KIND_KEYS = ['ArrowLeft', 'ArrowUp', 'ArrowRight']; // the same, by arrow

// kind: 'shove', 'lullaby' or 'twister'; left out, the page first asks which.
function startRhyme(kind) {
  const p = G.player;
  if (p.verve < 1) {
    msg('You open your mouth, but the rhymes have all fled. (No ♪ left.)', C.gray);
    return;
  }
  const [a, b, answer, wrong] = RNG.pick(COUPLETS);
  const options = RNG.shuffle([answer, ...wrong]);
  const H = RULES.rhyme.hoarse, hoarse = p.hoarse || 0;
  let ms = ruleAt(RULES.rhyme.fuseMs, dreadTier()); // 12s calm ... 7.5s undone
  if (hoarse) ms = Math.max(Math.min(ms, H.minFuseMs), ms - hoarse * H.fuseMs);
  const shown = options.map(w => blotWord(w, hoarse * H.blot));
  G.rhyme = { a, b, answer, options, shown, ms, fuseT0: 0, result: null, kind: kind || null };
  openPage('rhyme', {
    style: 'rhyme', fast: true, lead: RULES.pages.rhymeLead, quiet: true, voice: 'narrator',
    stanzas: [['"' + a, b + '"']], hold: !kind,
    onDone: () => { G.rhyme.fuseT0 = FX.now; },
  });
}

// A hoarse voice smudges words: this share of a word's letters are blotted out (never all of them).
function blotWord(w, share) {
  const letters = [...w].map((ch, i) => (/[a-z]/i.test(ch) ? i : -1)).filter(i => i >= 0);
  const n = Math.min(letters.length - 1, Math.round(letters.length * share));
  if (n <= 0) return w;
  const out = [...w];
  for (const i of RNG.shuffle(letters).slice(0, n)) out[i] = '▒';
  return out.join('');
}

// The kind picked on the page: now the couplet begins.
function chooseRhymeKind(kind) {
  const r = G.rhyme;
  r.kind = kind;
  G.player.lastRhymeKind = kind;
  G.page.hold = false;
  startStanza(G.page);
}

// Esc before picking: no rhyme, no ♪ spent, no turn taken.
function cancelRhyme() {
  G.mode = 'play';
  G.page = null;
  G.rhyme = null;
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
  const kind = r.kind || 'shove';
  const line = r.b.replace('___', word ? word.toUpperCase() : TEXT.pages.uh);
  msg(`You recite: "${r.a} ${line}"`, C.purple);
  FX.say(p, line, word === r.answer ? C.purple : C.gray, 2600);
  if (r.final) return finishFinale(r, word === r.answer);
  if (word !== r.answer) rhymeMiss(word);
  else if (kind === 'lullaby') rhymeLullaby();
  else if (kind === 'twister') rhymeTwister();
  else rhymeHit();
  getHoarser(p);
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

// A lullaby: horrors near you lie down and sleep a while, unharmed. Any noise wakes them (makeNoise).
// The ones that can't be put to sleep (the Tuck-You-In, the Nibbler) hum along and forget themselves.
function rhymeLullaby() {
  const R = RULES.rhyme, L = G.level;
  G.stats.rhymeWins++;
  addDread(R.goodDread);
  const near = nearbyMonsters(R.reach).filter(m => !m.disguised), sleepy = [];
  for (const m of near) {
    if (m.d.invulnerable || m.d.ai === 'boss') {
      m.stun = Math.max(m.stun || 0, m.d.ai === 'boss' ? R.bossStun : R.stun);
      msg(fill(TEXT.lullaby.hums, { The: cap(theM(m)) }), C.purple);
      continue;
    }
    Object.assign(m, { awake: false, lulled: R.lullaby.turns, frenzy: 0, energy: 0 });
    sleepy.push(m);
    if (L.visible[idx(m.x, m.y)]) FX.word(m.x, m.y, 'zzz');
  }
  if (sleepy.length === 1) msg(fill(TEXT.lullaby.one, { The: cap(theM(sleepy[0])) }), C.purple);
  else if (sleepy.length) msg(fill(TEXT.lullaby.hit, { n: sleepy.length }), C.purple);
  else if (!near.length) msg(TEXT.lullaby.nobody, C.purple);
}

// A tongue-twister: the nearest horror takes it all, and reels.
function rhymeTwister() {
  const p = G.player, R = RULES.rhyme, Tw = R.twister;
  G.stats.rhymeWins++;
  addDread(R.goodDread);
  const near = nearbyMonsters(R.reach).filter(m => !m.disguised).sort((a, b) => manhattan(a, p) - manhattan(b, p));
  const m = near[0];
  if (!m) return msg(TEXT.twister.nobody, C.purple);
  msg(fill(TEXT.twister.hit, { The: cap(theM(m)) }), C.purple);
  m.awake = true;
  m.lulled = 0;
  m.stun = Math.max(m.stun || 0, m.d.ai === 'boss' ? R.bossStun : Tw.stun);
  if (!m.d.invulnerable) {
    const dmg = RNG.int(...Tw.damage);
    m.hp -= dmg;
    FX.float(m.x, m.y, '-' + dmg, C.purple);
    FX.recoil(m, m.x - p.x, m.y - p.y);
    if (m.hp <= 0) killMonster(m);
  }
}

// After every rhyme (not the Last Rhyme): one soon after the last makes you hoarser.
function getHoarser(p) {
  const H = RULES.rhyme.hoarse, before = p.hoarse || 0;
  if (p.lastRhymeTurn != null && G.turn - p.lastRhymeTurn <= H.within && before < H.most) {
    p.hoarse = before + 1;
    msg(p.hoarse >= 2 ? TEXT.hoarse.worst : TEXT.hoarse.worse, C.pink);
  }
  p.lastRhymeTurn = G.turn;
  p.hoarseTimer = 0;
}

// Every turn: rest brings your voice back, a stage at a time.
function restVoice(p) {
  if (!p.hoarse) return;
  p.hoarseTimer = (p.hoarseTimer || 0) + 1;
  if (p.hoarseTimer < RULES.rhyme.hoarse.rest) return;
  p.hoarseTimer = 0;
  p.hoarse--;
  msg(TEXT.hoarse.better, C.purple);
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
