'use strict';
// Core state, the turn loop, player actions, combat, death and victory.

const G = {
  mode: 'splash', back: 'title',
  runNo: Store.load('runs', 0),
  depth: 1, level: null, player: null,
  log: [], logMark: 0, turn: 0, invSel: 0, graveSel: 0, bestSel: 0,
  known: { potion: {}, scroll: {} }, looks: { potion: {}, scroll: {} },
  seenTypes: {}, cardQueue: [], card: null, rhyme: null, page: null, floorVerse: null,
  stats: null, epitaph: null, fact: '', killer: '', killerId: '', won: false,
};

function msg(text, color) {
  G.log.push({ text, color: color || C.ink, t: FX.now, id: (G.msgSeq = (G.msgSeq || 0) + 1) });
  if (G.log.length > RULES.ui.log) { G.log.shift(); G.logMark--; }
}

const slotKey = i => (i < 9 ? String(i + 1) : '0');
// What to call a horror in a sentence. One marked `bare` in content/data.js goes by its name
// alone ("Better-Late-Than-Never kicks you"); a `unique` one is always "the".
const theD = d => (d.bare ? d.name : theName(d.name));
const aD = d => (d.bare ? d.name : d.unique ? 'the ' + d.name : aName(d.name));
const theM = m => theD(m.d);
const aM = m => aD(m.d);
const monsterAt = (x, y) => G.level.monsters.find(m => m.x === x && m.y === y && m.hp > 0);
const panOf = x => clamp((x - G.player.x) / 10, -1, 1);

// Called by FX.say: horrors (and ghosts) babble in their own voices when they speak.
function onSpeak(target, text) {
  if (!G.player || !target) return;
  const voice = target.d ? target.type : target.run ? 'ghost' : null;
  if (voice) Sound.babble(text, voice, panOf(target.x));
}

function playerAtk() {
  const p = G.player;
  return p.baseAtk + gearBonus(p.gear.hand);
}
function playerDef() {
  const p = G.player;
  return p.baseDef + gearBonus(p.gear.head) + gearBonus(p.gear.body) + gearBonus(p.gear.feet);
}
function rollDamage(atk, def) {
  return Math.max(RULES.combat.minDamage, RNG.int(Math.ceil(atk / 2), atk) - def);
}

// A monster says something out loud (maybe), frightened players mangle the rhyme.
function speak(m, kind, chance) {
  const lines = SPEECH[m.type] && SPEECH[m.type][kind];
  if (!lines || !lines.length || !RNG.chance(chance)) return;
  const line = RNG.pick(lines);
  if (line) FX.say(m, breakRhyme(line), m.d.color);
}

function newGame() {
  clearRun(); // beginning again abandons any run in progress
  G.runNo = Store.load('runs', 0) + 1;
  Store.save('runs', G.runNo);
  const S = RULES.player.start;
  G.player = {
    x: 0, y: 0, hp: S.hp, maxHp: S.hp, baseAtk: S.atk, baseDef: S.def, level: 1, xp: 0, xpNext: S.xpNext,
    verve: S.verve, maxVerve: S.verve, verveTimer: 0, regenTimer: 0, hoarse: 0, hoarseTimer: 0, lastRhymeTurn: null,
    lastRhymeKind: 'shove', lap: [],
    gear: { hand: null, head: null, body: null, feet: null }, inv: [], gold: 0, kills: 0,
    confused: 0, poisoned: 0, poisonBy: '', sensing: 0,
    wick: S.wick, dread: 0, hidden: false, darkTurns: 0, slowed: false,
  };
  Object.assign(G, {
    turn: 0, log: [], logMark: 0, won: false, epitaph: null, fact: '', killer: '', killerId: '', invSel: 0,
    seenTypes: {}, cardQueue: [], card: null, rhyme: null, alias: null, finaleWon: false, uiNibble: 0,
    encounter: null, threat: null, useTarget: null,
    known: { potion: {}, scroll: {} }, looks: { potion: {}, scroll: {} },
    stats: {
      waits: 0, waitsInRow: 0, wallBumps: 0, eggs: 0, unknownDrinks: 0, darkTurns: 0, hiddenTurns: 0,
      rhymeWins: 0, rhymeFails: 0, lastStolen: '', gags: {}, stubs: 0, barrels: 0, rooms: 0,
      rangBell: false, smashedMirror: false,
    },
  });
  const looks = RNG.shuffle(POTION_LOOKS.slice());
  POTIONS.forEach((p, i) => { G.looks.potion[p.id] = looks[i]; });
  const titles = RNG.shuffle(SCROLL_TITLES.slice());
  SCROLLS.forEach((s, i) => { G.looks.scroll[s.id] = titles[i]; });
  G.known.potion.heal = true; // everybody's grandma taught them this one
  G.player.inv.push(makeItem('food', 'muffin'), makeItem('food', 'muffin'), makeItem('potion', 'heal'));
  FX.clear();
  msg('You have no name, two muffins, one candle, and a bad feeling about this.', C.purple);
  enterFloor(1);
  showStoryPage();
}

function enterFloor(depth) {
  G.depth = depth;
  const L = G.level = makeLevel(depth);
  const p = G.player;
  p.x = L.start.x;
  p.y = L.start.y;
  p.verve = p.maxVerve;
  p.hidden = false;
  p.darkTurns = 0;
  populateLevel(L);
  floorEnter(L);
  computeFOV(L, p.x, p.y, lightRadius());
  FX.clear();
  Sound.setScene(depth);
  msg(phrase('prompts.floor', { n: depth, name: L.floor.name }), C.purple);
  msg(depth === 1 ? TEXT.prompts.firstFloor : RNG.pick(TEXT.tips), C.gray);
  showFloorCard();
}

function showFloorCard() {
  G.floorVerse = floorVerse();
  showFloorPage();
}

// The floor's verse, as your current Dread lets you remember it.
function floorVerse() {
  const verse = G.level.floor.verse.slice();
  verse[3] = breakRhyme(verse[3]);
  return verse;
}

function tryMove(dx, dy) {
  const p = G.player, L = G.level;
  let wobbled = false;
  if (p.confused > 0 && RNG.chance(RULES.player.stumble)) {
    [dx, dy] = RNG.pick(DIR4);
    wobbled = true;
  }
  const nx = p.x + dx, ny = p.y + dy;
  const m = inMap(nx, ny) && monsterAt(nx, ny);
  if (m) {
    if (wobbled) { playerAttack(m); return true; } // you stumbled into it: no time to think
    if (m.disguised) { revealMimic(m); return true; } // you reached for it. It reached back.
    openEncounter(m, dx, dy);
    return false;
  }
  const fixture = inMap(nx, ny) && fixtureAt(L, nx, ny);
  if (fixture) return useFixture(fixture);
  const t = inMap(nx, ny) ? L.tiles[idx(nx, ny)] : T.WALL;
  const barrel = t === T.PROP && L.floor.prop.hide && !wobbled;
  if ((barrel || passable(t)) && !breakAway(nx, ny)) return true; // held: the turn is gone, and it gets its swing
  if (barrel) {
    enterBarrel(L, nx, ny);
    return true;
  }
  if (!passable(t)) {
    const what = t === T.PROP ? L.floor.prop.name : 'wall';
    if (wobbled) { msg(`You wobble into the ${what}. Bonk.`, C.pink); Sound.play('thud'); makeNoise(); return true; }
    if (t === T.PROP) msg(`${cap(aName(what))} is in the way.`, C.gray);
    else { G.stats.wallBumps++; makeNoise(); }
    return false;
  }
  if (p.hidden) {
    p.hidden = false;
    msg('You climb out of the barrel, smelling faintly of regret.', C.gray);
  }
  p.x = nx;
  p.y = ny;
  G.stats.waitsInRow = 0;
  Sound.play('step');
  if (t === T.STAIRS) msg(TEXT.prompts.stairs, C.yellow);
  else if (t === T.DEEP) {
    p.slowed = true;
    if (p.wick > 0) p.wick = Math.max(1, p.wick - RULES.candle.deepWater);
    Sound.play('splash');
    if (RNG.chance(0.25)) msg('You wade through deep, weeping water. It slows you, and your candle hisses.', C.blue);
  } else if (t === T.WATER && RNG.chance(0.1)) {
    msg(RNG.pick(TEXT.water), C.blue);
    Sound.play('splash', 0.5);
  } else if (t === T.DECO && RNG.chance(0.06)) msg(`You step on some ${L.floor.deco.name}. Crunch.`, C.gray);
  stepOnto();
  return true;
}

const itemsHere = () => G.level.items.filter(i => i.x === G.player.x && i.y === G.player.y);

// Walking onto a cell: gold and candle stubs are scooped up on their own (they don't take a
// pocket). Anything else is only pointed out; picking it up is your choice (G).
function stepOnto() {
  const p = G.player, L = G.level;
  for (const it of itemsHere()) {
    if (it.item.kind === 'gold') {
      L.items.splice(L.items.indexOf(it), 1);
      p.gold += it.item.amount;
      msg(`You pocket ${it.item.amount} Tootle-Coins. Somewhere, chains jingle back.`, C.yellow);
      Sound.play('pickup');
    } else if (it.item.kind === 'candle') {
      L.items.splice(L.items.indexOf(it), 1);
      meltStub();
    }
  }
  L.phantoms = L.phantoms.filter(ph => {
    if (ph.x !== p.x || ph.y !== p.y) return true;
    msg(`You reach for the ${ph.name}. Your hand closes on nothing. There was never anything there.`, C.dim);
    addDread(RULES.dread.phantomGrab);
    return false;
  });
  const here = itemsHere();
  if (!here.length) return;
  const bones = here.find(i => i.item.kind === 'bones');
  if (bones) msg(phrase('prompts.bonesHere', { who: phrase('somebody', { n: bones.item.run }) }), GHOST_COLOR);
  const names = here.filter(i => i.item.kind !== 'bones').map(i => aName(itemName(i.item)));
  if (names.length === 1) msg(phrase('prompts.oneHere', { item: names[0] }), C.teal);
  else if (names.length > 1) msg(phrase('prompts.manyHere', { n: names.length, list: names.slice(0, -1).join(', '), last: names[names.length - 1] }), C.teal);
}

// G: pick up everything here that fits in your pockets. Returns true if it took a turn.
function pickUp() {
  const p = G.player, L = G.level, here = itemsHere();
  if (!here.length) {
    msg(TEXT.prompts.nothingHere, C.gray);
    return false;
  }
  let took = 0;
  for (const it of here) {
    const item = it.item;
    if (item.kind === 'bones') { lootBones(L, it); took++; continue; }
    if (pocketsFull(p)) {
      msg(phrase('prompts.pocketsFull', { the: theName(itemName(item)) }), C.gray);
      continue;
    }
    L.items.splice(L.items.indexOf(it), 1);
    p.inv.push(item);
    took++;
    msg(phrase('prompts.pickedUp', { item: aName(itemName(item)), key: slotKey(rowOf(item)) }), C.teal);
    Sound.play('pickup');
    if (item.kind === 'sock') { socksRise(L); checkSockPair(); }
  }
  return took > 0;
}

// Walking into a horror: stop and choose (attack, rhyme, use something, or back off).
// Trying to leave a fight: each horror you're fighting that you'd lose touch with gets a chance to
// hold on. (nx, ny) is where you're going; null means you're leaving altogether (the stairs).
// Returns false if one of them holds you.
function breakAway(nx, ny) {
  const p = G.player;
  const holders = G.level.monsters.filter(m => engaged(m) && (nx === null || Math.abs(m.x - nx) + Math.abs(m.y - ny) !== 1));
  for (const m of holders) {
    if (!RNG.chance(escapeChance(1, speedOf(m), m.type === 'tuck') - (clumsy() ? RULES.clumsy.escape : 0))) {
      msg(fill(RNG.pick(TEXT.heldBack), { the: theM(m), The: cap(theM(m)) }), C.red);
      FX.lunge(m, p.x - m.x, p.y - m.y);
      Sound.play('thud', 0.6);
      return false;
    }
  }
  if (holders.length) msg(`You break away from ${holders.length === 1 ? theM(holders[0]) : 'them'}.`, C.gray);
  return true;
}

// Esc on the encounter card, when it's already a fight: step back, if there's anywhere to step.
function backAway(m) {
  const p = G.player, L = G.level;
  const away = [[p.x - m.x, p.y - m.y]].concat(DIR4.filter(([dx, dy]) => (dx !== m.x - p.x || dy !== m.y - p.y) && (dx !== p.x - m.x || dy !== p.y - m.y)));
  for (const [dx, dy] of away) {
    const x = p.x + dx, y = p.y + dy;
    if (inMap(x, y) && passable(L.tiles[idx(x, y)]) && !monsterAt(x, y) && !fixtureAt(L, x, y)) return tryMove(dx, dy);
  }
  msg(`There is nowhere to back away to. It's you and ${theM(m)} now.`, C.red);
  return false;
}

// > on the stairs. If something is fighting you, it may catch you on the top step.
function tryDescend() {
  const p = G.player, L = G.level;
  if (L.tiles[idx(p.x, p.y)] !== T.STAIRS) {
    msg(TEXT.prompts.noStairs, C.gray);
    return false;
  }
  if (!breakAway(null, null)) return true;
  descend();
  return false; // a new floor: nothing up here gets a turn
}

function openEncounter(m, dx, dy) {
  // A horror that's already fighting you won't let you just walk off. A sleeping one might.
  G.encounter = { m, dx, dy, t0: FX.now, engaged: engaged(m) };
  G.mode = 'encounter';
  G.logMark = G.log.length;
}

// The horror that just went for you, if it's still right next to you.
function currentThreat() {
  const t = G.threat, p = G.player;
  return t && t.turn === G.turn && t.m.hp > 0 && G.level.monsters.includes(t.m) && manhattan(t.m, p) === 1 ? t.m : null;
}

function adjacentMonsters() {
  const p = G.player;
  return G.level.monsters.filter(m => m.hp > 0 && !m.disguised && manhattan(m, p) === 1);
}

// A: attack whatever just went for you, or the only thing next to you.
function attackAdjacent() {
  const near = adjacentMonsters(), target = currentThreat() || (near.length === 1 ? near[0] : null);
  if (target) { playerAttack(target); return true; }
  msg(near.length ? TEXT.prompts.whichOne : TEXT.prompts.nobodyNear, C.gray);
  return false;
}

function playerAttack(m) {
  if (m.disguised) revealMimic(m);
  m.awake = true;
  if (m.d.invulnerable) {
    msg(`You hit ${theM(m)}. It is very soft. It does not mind at all.`, C.gray);
    Sound.play('thud');
    speak(m, 'hurt', 0.6);
    return;
  }
  FX.lunge(G.player, m.x - G.player.x, m.y - G.player.y);
  makeNoise();
  if (RNG.chance(RULES.combat.playerHit - (clumsy() ? RULES.clumsy.hit : 0))) {
    const dmg = rollDamage(playerAtk(), m.d.def);
    m.hp -= dmg;
    FX.recoil(m, m.x - G.player.x, m.y - G.player.y);
    msg(cap(fill(RNG.pick(TEXT.hit), { the: theM(m) })) + ` (${dmg})`, C.ink);
    FX.float(m.x, m.y, '-' + dmg, C.white);
    Sound.play('hit');
    if (m.hp <= 0) killMonster(m);
    else {
      speak(m, 'hurt', 0.2);
      if (m.d.ai === 'splitter') trySplit(m);
    }
  } else {
    msg(cap(fill(RNG.pick(TEXT.miss), { the: theM(m), The: cap(theM(m)) })), C.gray);
    Sound.play('miss');
  }
}

function killMonster(m) {
  const L = G.level, p = G.player;
  // The Nibbler can't be finished with a spork. It ends in rhyme.
  if (m.d.ai === 'boss' && !G.finaleWon) {
    m.hp = 1;
    startFinale(m);
    return;
  }
  m.hp = 0;
  FX.death(m);
  if (!L.stains) L.stains = [];
  L.stains.push({ x: m.x, y: m.y, seed: Math.random(), t0: FX.now, big: m.type === 'nibbler' });
  L.monsters = L.monsters.filter(o => o !== m);
  p.kills++;
  msg(m.d.death, C.orange);
  speak(m, 'die', 1);
  Sound.play('kill', 1, panOf(m.x));
  const floorOk = passable(L.tiles[idx(m.x, m.y)]);
  if (m.carry) {
    dropItem(L, floorOk ? m.x : p.x, floorOk ? m.y : p.y, m.carry);
    msg('It drops what it put away. So that is where the drawer was.', C.yellow);
  } else if (floorOk && RNG.chance(RULES.loot.killGold)) {
    dropItem(L, m.x, m.y, goldPile(G.depth));
  }
  gainXp(m.d.xp);
  if (m.d.ai === 'boss') win();
}

function gainXp(n) {
  const p = G.player, X = RULES.xp;
  p.xp += n;
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext;
    p.level++;
    p.xpNext = Math.floor(p.xpNext * X.nextGrowth) + X.nextPlus;
    p.maxHp += X.maxHp;
    p.hp = Math.min(p.maxHp, p.hp + X.heal);
    p.baseAtk += X.atk;
    if (p.level % X.verveEvery === 0) p.maxVerve++;
    msg(breakRhyme(fill(RNG.pick(TEXT.levelUp), { n: p.level })), C.yellow);
    Sound.play('levelup');
    addDread(RULES.dread.levelUp);
  }
}

// `by` is a killer id: a monster type ('opinion'), 'potion:poison', 'food:eggs', or one of the
// one-off killers in TEXT.killers ('wall', 'tea', 'wax'). The first blow that kills you counts.
function hurtPlayer(n, by) {
  const p = G.player;
  p.hp -= n;
  FX.hit(2 + n * 0.6);
  FX.float(p.x, p.y, '-' + n, C.red);
  Sound.play('hurt');
  addDread(RULES.dread.hurt);
  if (p.hp <= 0 && !G.killer) {
    G.killerId = by || '';
    G.killer = killerName(by);
  }
}

// What the tombstone calls a killer: "a Second Opinion", "the Tuck-You-In", "a Gloop of
// Regret", "a spoiled Pie of Uncertain Origin", "a hungry wall". '' for nobody in particular.
function killerName(id) {
  if (!id) return '';
  if (MONSTERS[id]) return aD(MONSTERS[id]);
  const [kind, what] = id.split(':');
  if (kind === 'potion') return aName(POTION_BY[what].name);
  if (kind === 'food') return phrase('killers.spoiled', { food: FOOD_BY[what].name });
  return TEXT.killers[id] || '';
}

function heal(n) {
  const p = G.player, before = p.hp;
  p.hp = Math.min(p.maxHp, p.hp + n);
  if (p.hp > before) FX.float(p.x, p.y, '+' + (p.hp - before), C.green);
  return p.hp - before;
}

function wait() {
  G.stats.waits++;
  G.stats.waitsInRow++;
  const p = G.player;
  const mite = G.level.monsters.find(m => m.d.lap && m.awake && !m.frenzy && !m.disguised && !(m.stun > 0) && manhattan(m, p) === 1);
  if (mite) { climbIntoLap(mite); return true; }
  if (holdStill()) return true;
  if (RNG.chance(0.05)) msg(RNG.pick(TEXT.idle), C.gray);
  return true;
}

function descend() {
  const p = G.player, L = G.level;
  if (L.tiles[idx(p.x, p.y)] !== T.STAIRS) {
    msg(TEXT.prompts.noStairs, C.gray);
    return;
  }
  if (p.lap && p.lap.length) { msg(TEXT.lap.stairs, C.green); p.lap = []; }
  msg(RNG.pick(TEXT.descend), C.purple);
  Sound.play('stairs');
  enterFloor(G.depth + 1);
}

// Everything that happens after the player spends a turn.
function endTurn() {
  if (G.mode !== 'play') return;
  const p = G.player, L = G.level;
  G.turn++;
  computeFOV(L, p.x, p.y, lightRadius());
  noticeMonsters(L);
  noticeFixtures(L);
  monstersAct(L);
  if (p.slowed) { p.slowed = false; monstersAct(L); }
  if (G.mode !== 'play') return;
  floorTurn(L);
  ghostTurn(L);
  tickDread(L);
  if (p.hp > 0) tickStatus();
  checkGags();
  computeFOV(L, p.x, p.y, lightRadius());
  noticeMonsters(L);
  if (p.hp <= 0 && G.mode === 'play') die();
  else if (G.cardQueue.length && G.mode === 'play') showNextCard();
  saveRun(); // only if you're still on the map; otherwise when you get back to it (toPlay)
}

function noticeMonsters(L) {
  const p = G.player;
  for (const m of L.monsters) {
    if (m.disguised || m.napping || m.lulled > 0 || !L.visible[idx(m.x, m.y)]) continue;
    if (p.hidden && m.d.ai !== 'boss' && m.type !== 'tuck') continue; // they can't see into the barrel
    if (!m.awake) speak(m, 'spot', 0.6);
    m.awake = true;
    if (!G.seenTypes[m.type]) {
      G.seenTypes[m.type] = true;
      addDread(RULES.dread.newHorror);
      if (m.d.ai === 'boss') msg(TEXT.bossIntro, C.red);
      else msg(`You spot ${aM(m)}. ${m.d.blurb}`, m.d.color);
      if (!bestiarySeen().includes(m.type)) queueCard(m.type);
      else { Sound.play('sting', 0.4); FX.jolt(2, m.d.color); }
    }
  }
}

function queueCard(type) {
  if (!bestiarySeen().includes(type) && !G.cardQueue.includes(type)) G.cardQueue.push(type);
}

// The storybook page: a sting, a jolt, a portrait, a verse.
function showNextCard() {
  const type = G.cardQueue.shift();
  G.card = { type };
  markBestiary(type);
  Sound.play('sting');
  FX.jolt(7, INK);
  addDread(RULES.dread.storyPage);
  Voice.stop();
  showBeastPage(type);
}

function tickStatus() {
  const p = G.player;
  if (p.poisoned > 0) {
    p.poisoned--;
    hurtPlayer(1, p.poisonBy);
    if (!p.poisoned) msg('The poison wears off. Your insides stop complaining.', C.green);
  } else if (++p.regenTimer >= ruleAt(RULES.player.regenTurns, p.level)) {
    p.regenTimer = 0;
    if (p.hp < p.maxHp) p.hp++;
  }
  restVoice(p);
  if (p.confused > 0 && --p.confused === 0) msg('The room stops wibbling. Mostly.', C.pink);
  if (p.sensing > 0 && --p.sensing === 0) msg('Your eyeballs stop itching.', C.gray);
  if (p.verve < p.maxVerve && ++p.verveTimer >= RULES.player.verveTurns) {
    p.verveTimer = 0;
    p.verve++;
    msg('A fresh rhyme pops into your head. (+1 ♪)', C.purple);
  }
}

function die() {
  const p = G.player;
  clearRun();
  const killer = G.killer || phrase('killers.unknown');
  const who = phrase('somebody', { n: G.runNo });
  const vars = { who, killer, Killer: cap(killer), floor: G.level.floor.name.replace(/^The /, 'the ') };
  const by = G.killerId === 'tuck' ? 'tuck' : MONSTERS[G.killerId] ? 'horror' : 'any';
  G.epitaph = RNG.pick(TEXT.epitaphsFor[by]).map(line => fill(line, vars));
  G.fact = deathFact();
  Sound.setScene('dead');
  Sound.play('death');
  Voice.stop();
  showTombPage();
  recordGrave({ killer, killerId: G.killerId, epitaph: G.epitaph.concat(G.fact), won: false, bones: bonesFor(p) });
}

function win() {
  clearRun();
  G.won = true;
  Sound.setScene('win');
  Voice.stop();
  showEndingPage();
  recordGrave({ killer: '', epitaph: ['Got their name back. Sort of.'], won: true });
}

function recordGrave(extra) {
  const p = G.player;
  const list = Store.load('graveyard', []);
  list.push(Object.assign({
    run: G.runNo, depth: G.depth, floor: G.level.floor.name, turns: G.turn,
    level: p.level, gold: p.gold, kills: p.kills, date: new Date().toLocaleDateString(),
  }, extra));
  Store.save('graveyard', list.slice(-RULES.ghosts.graveyard));
}
