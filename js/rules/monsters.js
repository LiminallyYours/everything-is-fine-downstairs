'use strict';
// Spawning monsters, and their brains (such as they are).

function spawnMonster(L, type, x, y) {
  const d = MONSTERS[type];
  const m = {
    type, d, x, y, hp: d.hp, maxHp: d.hp,
    awake: false, stun: 0, fear: 0, frenzy: 0, energy: Math.random(), speed: null,
    carry: null, disguised: d.ai === 'mimic', gen: 0, timer: 0, enraged: false,
  };
  L.monsters.push(m);
  return m;
}

function populateLevel(L) {
  const f = L.floor, R = RULES.spawn;
  if (L.isBoss) spawnMonster(L, 'nibbler', L.bossSpot.x, L.bossSpot.y);
  const count = L.isBoss ? R.bossMonsters : ruleAt(R.monsters, L.depth);
  for (let i = 0; i < count; i++) {
    const pos = freeTile(L, R.monsterMinDist);
    if (!pos) break;
    const m = spawnMonster(L, RNG.weighted(f.monsters), pos[0], pos[1]);
    if (m.d.ai === 'erratic' && RNG.chance(R.batsAwake)) m.awake = true;
  }
  for (let i = 0; i < ruleAt(R.items, L.depth); i++) {
    const pos = freeTile(L, 0);
    if (pos) dropItem(L, pos[0], pos[1], randomItem(L.depth));
  }
  const gear = freeTile(L, 3); // one guaranteed weapon or armor per floor
  if (gear) dropItem(L, gear[0], gear[1], randomGear(L.depth, RULES.loot.weaponFloors.includes(L.depth) || null));
}

function canEnter(L, m, x, y) {
  if (!inMap(x, y)) return false;
  if (x === G.player.x && y === G.player.y) return false;
  if (L.monsters.some(o => o !== m && o.x === x && o.y === y && o.hp > 0)) return false;
  if (fixtureAt(L, x, y)) return false;
  return m.d.ai === 'ghost' || passable(L.tiles[idx(x, y)]);
}

// Every monster step goes through here, so tall grass can rustle when something unseen moves in it.
// ---------------------------------------------------------------------------------------
// Leaving a fight is never certain, for you or for them. Faster runners get away more often,
// and nobody gets away from the Tuck-You-In easily.

const speedOf = m => m.speed || (m.enraged ? RULES.monsters.enragedSpeed : m.d.speed);

function escapeChance(runnerSpeed, holderSpeed, tucked) {
  const E = RULES.escape;
  return tucked ? E.tuck : clamp(E.even + E.perSpeed * (runnerSpeed - holderSpeed), E.min, E.max);
}

// Is this horror fighting you right now (awake, next to you, and in a state to hold on)?
function engaged(m) {
  return m.hp > 0 && m.awake && !m.disguised && manhattan(m, G.player) === 1
    && !(m.stun > 0) && !(m.dazed > 0) && !(m.fear > 0) && !(m.bored > 0) && !(m.d.ai === 'thief' && m.carry);
}

// Every step a monster takes goes through here. If it's next to you and tries to step away,
// you might not let it. `voluntary` is false when it's being shoved (by a rhyme, say).
// Returns false if it was held.
function moveMonster(L, m, x, y, voluntary = true) {
  const p = G.player;
  if (voluntary && m.awake && !(m.bored > 0) && !p.hidden && manhattan(m, p) === 1 && Math.abs(x - p.x) + Math.abs(y - p.y) !== 1) {
    if (!RNG.chance(escapeChance(speedOf(m), 1))) {
      if (m.fear > 0 || (m.d.ai === 'thief' && m.carry)) msg(`${cap(theM(m))} tries to get away, but you are not letting it.`, C.gray);
      return false;
    }
  }
  m.x = x;
  m.y = y;
  if (L.tiles[idx(x, y)] === T.GRASS && !L.visible[idx(x, y)]) {
    const d = manhattan(m, G.player);
    if (d <= 16) {
      FX.rustle(x, y);
      if (RNG.chance(0.5)) FX.word(x, y, 'rustle');
      Sound.play('rustle', 1 - d / 17, panOf(x));
    }
  }
  return true;
}

function monstersAct(L) {
  const p = G.player;
  const dist = distanceMap(L, p.x, p.y), bold = horrorsBold(), B = RULES.bold;
  for (const m of L.monsters.slice()) {
    if (m.hp <= 0) continue;
    if (m.lulled > 0) { // sung to sleep: still and unseeing until it wears off, or a noise
      m.lulled--;
      if (L.visible[idx(m.x, m.y)] && RNG.chance(RULES.surprises.nap.zzz)) FX.word(m.x, m.y, 'zzz');
      continue;
    }
    // The Second Opinion: a fight that drags on, and it calls a colleague (once).
    if (m.d.call && !m.called && !m.answering && engaged(m)) {
      m.fightTurns = (m.fightTurns || 0) + 1;
      if (m.fightTurns >= m.d.call.after) callForOpinion(L, m, dist);
    }
    // Bold: a sleeping horror nearby wakes, whether or not you can see it. They're delighted.
    // (Not the Tuck-You-In or the boss: RULES.bold.exempt.)
    const boldHere = bold && !B.exempt.includes(m.type);
    if (boldHere && !m.awake && !m.disguised && !m.napping && dist[idx(m.x, m.y)] <= B.wakeRange && RNG.chance(B.wake)) {
      m.awake = true;
      if (L.visible[idx(m.x, m.y)]) speak(m, 'spot', 0.6);
    }
    if (m.poison > 0) { // a thrown Gloop of Regret, doing its work
      m.poison--;
      m.hp -= 2;
      FX.float(m.x, m.y, '-2', C.green);
      if (m.hp <= 0) {
        msg(`${cap(theM(m))} succumbs to the poison.`, C.green);
        killMonster(m);
        if (G.mode !== 'play') return;
        continue;
      }
    }
    m.energy += speedOf(m) + (m.frenzy > 0 ? RULES.monsters.frenzySpeed : 0) + (boldHere && m.awake && !m.napping ? B.speed : 0);
    if (m.frenzy > 0) m.frenzy--;
    while (m.energy >= 1 && m.hp > 0) {
      m.energy -= 1;
      if (p.hp <= 0 || G.mode !== 'play') return;
      monsterAct(L, m, dist);
    }
  }
}

function monsterAct(L, m, dist) {
  const p = G.player;
  if (m.stun > 0) { m.stun--; return; }
  if (m.dazed > 0) { m.dazed--; wander(L, m); return; } // a thrown Fizz: it's forgotten what it was doing
  if (m.disguised) {
    if (manhattan(m, p) === 1) revealMimic(m); // the reveal is its whole turn
    return;
  }
  if (m.napping) return; // Nap Time: lying down, eyes shut, perfectly still
  if (m.bored > 0) { m.bored--; if (!flee(L, m, dist)) wander(L, m); return; } // you held still, and it lost interest
  if (!m.awake) {
    if (RNG.chance(RULES.monsters.sleepWander)) wander(L, m);
    return;
  }
  const adjacent = manhattan(m, p) === 1;
  // Hiding in a barrel: most things lose track of you. Bedtime and the Nibbler do not.
  if (p.hidden && m.type !== 'tuck' && m.d.ai !== 'boss') {
    if (!adjacent || RNG.chance(RULES.floors.barrel.lose)) {
      if (!adjacent && RNG.chance(RULES.floors.barrel.forget)) m.awake = false;
      wander(L, m);
      return;
    }
  }
  if (m.d.ai === 'boss') bossThink(L, m);
  if (m.fear > 0 || (m.d.ai === 'thief' && m.carry)) {
    if (m.fear > 0) m.fear--;
    if (flee(L, m, dist) || !adjacent || m.d.ai === 'thief') return;
  }
  if (m.d.ai === 'erratic' && RNG.chance(RULES.monsters.erraticWander)) { wander(L, m); return; }
  if (!adjacent) m.pounce = false; // you got away: whatever it was saving, it isn't any more
  if (adjacent) { monsterAttack(m); return; }
  if (m.d.ai === 'ghost') drift(L, m);
  else approach(L, m, dist);
}

// A colleague arrives, from somewhere out of sight a little way off. It can't call another.
function callForOpinion(L, m, dist) {
  m.called = true;
  const [near, far] = m.d.call.near, cells = [];
  for (let i = 0; i < L.tiles.length; i++) {
    const x = i % MAP_W, y = (i / MAP_W) | 0;
    if (dist[i] < near || dist[i] > far || L.visible[i] || !passable(L.tiles[i]) || L.tiles[i] === T.STAIRS) continue;
    if (monsterAt(x, y) || fixtureAt(L, x, y)) continue;
    cells.push([x, y]);
  }
  speak(m, 'call', 1);
  if (!cells.length) return;
  const [x, y] = RNG.pick(cells), c = spawnMonster(L, m.type, x, y);
  Object.assign(c, { awake: true, answering: true });
  msg(TEXT.opinionCall, C.red);
  Sound.play('thud', 0.5);
}

// Holding still beside a horror (space or .), and hoping. For each awake horror beside you: it may
// lose interest and wander off for a few turns, or else its next blow lands harder. The narrator
// sets it up in a couplet. Returns false if there was nobody beside you to hold still for.
function holdStill() {
  const L = G.level, H = RULES.holdStill;
  const near = L.monsters.filter(m => engaged(m) && !m.napping && !(m.lulled > 0) && !H.exempt.includes(m.type));
  if (!near.length) return false;
  msg(breakRhyme(RNG.pick(TEXT.holdStill.couplets)), C.purple);
  for (const m of near) {
    if (RNG.chance(H.wander)) {
      Object.assign(m, { bored: H.turns, pounce: false });
      if (G.encounter && G.encounter.m === m) G.encounter = null;
      msg(fill(RNG.pick(TEXT.holdStill.wander), { The: cap(theM(m)) }), C.green);
    } else m.pounce = true;
  }
  return true;
}

// The Second Opinion's colleague, on its way: until you can see it, its footsteps are written in
// the dark where it walks, every turn, the way a Tick-Tock Tot's ticking is.
function colleagueSteps(L) {
  for (const m of L.monsters) {
    if (!m.answering || m.arrived) continue;
    if (L.visible[idx(m.x, m.y)]) { m.arrived = true; continue; }
    if (m.awake && !m.napping && !(m.lulled > 0)) FX.word(m.x, m.y, m.d.call.steps);
  }
}

// The Mold-Mite: wait beside it instead of fighting, and it climbs into your lap and sleeps.
function climbIntoLap(m) {
  const p = G.player, L = G.level;
  L.monsters.splice(L.monsters.indexOf(m), 1);
  if (G.encounter && G.encounter.m === m) G.encounter = null;
  p.lap = (p.lap || []).concat([m]);
  msg(TEXT.lap.climb, C.green);
  FX.say(p, 'mmf…', m.d.color, 1600);
}

// Any noise: the Mold-Mites in your lap wake with a start, hop down and bite (apologizing).
function wakeLap() {
  const p = G.player, L = G.level;
  if (!p || !L || !p.lap || !p.lap.length) return;
  const lap = p.lap;
  p.lap = [];
  for (const m of lap) {
    // it hops down right beside you (not on a diagonal, so it can bite)
    const s = RNG.shuffle(DIR4.slice()).map(([dx, dy]) => [p.x + dx, p.y + dy])
      .find(([x, y]) => inMap(x, y) && passable(L.tiles[idx(x, y)]) && !monsterAt(x, y) && !fixtureAt(L, x, y));
    if (!s) continue; // nowhere to hop down to: it rolls away into the dark
    Object.assign(m, { x: s[0], y: s[1], awake: true, energy: 0 });
    L.monsters.push(m);
    msg(TEXT.lap.wake, C.red);
    if (p.hp > 0) monsterAttack(m);
  }
}

function monsterAttack(m) {
  makeNoise(); // a blow is noisy (Nap Time)
  const p = G.player;
  // The blow lands (or doesn't) first; only then do you get to choose how to answer it.
  const threat = G.threat = { m, turn: G.turn, t: FX.now, result: 'miss' };
  const pounce = m.pounce;
  m.pounce = false; // whatever it was saving goes into this blow, landed or not
  if (m.d.ai === 'thief' && !m.carry && RNG.chance(m.d.steal.chance) && steal(m)) { threat.result = 'steal'; return; }
  if (!RNG.chance(RULES.combat.monsterHit)) {
    msg(cap(fill(RNG.pick(TEXT.monMiss), { The: cap(theM(m)) })), C.gray);
    return;
  }
  let dmg = rollDamage(m.d.atk + (m.bonusAtk || 0), playerDef());
  if (pounce) {
    dmg = Math.ceil(dmg * RULES.holdStill.harder);
    msg(fill(TEXT.holdStill.harder, { The: cap(theM(m)) }), C.red);
  }
  FX.lunge(m, p.x - m.x, p.y - m.y);
  FX.recoil(p, p.x - m.x, p.y - m.y);
  hurtPlayer(dmg, m.type);
  const verb = RNG.pick(m.d.verbs);
  Object.assign(threat, { result: 'hit', dmg, verb });
  msg(`${cap(theM(m))} ${verb} you! (-${dmg})`, C.red);
  speak(m, 'hit', 0.25);
  if (m.type === 'bat' && RNG.chance(m.d.snuff.chance)) snuff(m.d.snuff.wax, "Yesterday's Soup slops over your candle. Half the flame hisses out.");
  if (m.type === 'wraith' && RNG.chance(m.d.snuff.chance)) snuff(m.d.snuff.wax, 'Ahem. Your flame shrinks, as if it had been told off.');
  if (m.type === 'tuck') {
    addDread(m.d.hitDread);
    snuff(m.d.snuff.wax, 'It tucks you in so tightly that your candle gutters.');
  }
  if (m.d.ai === 'boss' && p.verve > 0 && RNG.chance(m.d.boss.biteRhyme)) {
    p.verve--;
    msg('It nibbles a rhyme right out of your head! (-1 rhyme)', C.pink);
  }
}

function steal(m) {
  const p = G.player;
  if (p.inv.length) {
    m.carry = p.inv.splice(RNG.int(0, p.inv.length - 1), 1)[0];
    G.stats.lastStolen = itemName(m.carry);
    msg(`The Put-Away puts away your ${itemName(m.carry)}! It hums, and scampers off.`, C.orange);
  } else if (p.gold > 0) {
    const n = Math.min(p.gold, RNG.int(...m.d.steal.gold));
    p.gold -= n;
    m.carry = { kind: 'gold', amount: n };
    msg(`The Put-Away puts away ${n} of your Tootle-Coins! So tidy.`, C.orange);
  } else {
    return false;
  }
  Sound.play('laugh');
  FX.say(m, breakRhyme(RNG.pick(SPEECH.putaway.hit)), m.d.color);
  G.invSel = clamp(G.invSel, 0, Math.max(0, pocketRows(p).length - 1));
  return true;
}

function revealMimic(m) {
  m.disguised = false;
  m.awake = true;
  G.seenTypes.mimic = true;
  msg('That has TEETH! It was a Nothing-to-Worry-About all along!', C.red);
  speak(m, 'spot', 1);
  if (bestiarySeen().includes('mimic')) { Sound.play('sting', 0.6); FX.jolt(5, C.red); }
  else queueCard('mimic');
  addDread(6);
}

function trySplit(m) {
  const L = G.level, S = m.d.split;
  if (m.gen >= S.gens || m.hp < S.minHp || !RNG.chance(S.chance)) return;
  const spot = freeNeighbor(L, m.x, m.y);
  if (!spot) return;
  const half = Math.floor(m.hp / 2);
  m.hp -= half;
  m.gen++;
  const kid = spawnMonster(L, m.type, spot[0], spot[1]);
  Object.assign(kid, { hp: half, maxHp: m.maxHp, gen: m.gen, awake: true });
  msg('The Empty Sandwich is cut in two! Now it is two sandwiches. That is the rule.', C.pink);
  speak(m, 'hurt', 1);
}

// The Nibbler fights in three phases. Past two thirds, it starts eating your things and the page
// itself (letters go missing from the margin). Past one third it's frantic and the walls join in.
// At the very end it can't be killed with a weapon: it wants a rhyme (see startFinale).
function bossThink(L, m) {
  const p = G.player, frac = m.hp / m.maxHp, B = m.d.boss;
  const phase = frac > B.phase2 ? 1 : frac > B.phase3 ? 2 : 3;
  if (phase > (m.phase || 1)) {
    m.phase = phase;
    if (phase === 2) {
      msg('The Nibbler looks down at the page. It licks its lips. It starts to eat the WORDS.', C.red);
      FX.say(m, 'Letters! Crunchy little letters!', m.d.color, 3200);
      G.uiNibble = B.nibble2;
    } else {
      m.enraged = true;
      msg(TEXT.bossEnrage + ' The walls are chewing too.', C.red);
      FX.say(m, 'MORE. I want MORE.', m.d.color, 3200);
      G.uiNibble = B.nibble3;
    }
    FX.jolt(6, C.red);
    Sound.play('sting');
  }
  if (phase >= 2 && RNG.chance(B.eat)) {
    if (p.inv.length && RNG.chance(B.eatItem)) {
      const eaten = p.inv.splice(RNG.int(0, p.inv.length - 1), 1)[0];
      m.hp = Math.min(m.maxHp, m.hp + B.eatHeal);
      msg(`The Nibbler eats your ${itemName(eaten)}. From across the room. With its mind.`, C.red);
      FX.say(m, 'Crunchy.', m.d.color);
    } else if (p.verve > 0) {
      p.verve--;
      msg('The Nibbler nibbles a rhyme right out of your head. (-1 rhyme)', C.pink);
    }
  }
  if (++m.timer >= (phase === 3 ? B.summonEvery3 : B.summonEvery)) {
    m.timer = 0;
    const spot = freeNeighbor(L, m.x, m.y);
    if (spot && L.monsters.length < B.crowd) {
      spawnMonster(L, RNG.chance(B.mite) ? 'mite' : 'bat', spot[0], spot[1]).awake = true;
      msg(RNG.pick(TEXT.bossSummon), C.red);
    }
  } else if (RNG.chance(B.taunt) && L.visible[idx(m.x, m.y)]) {
    FX.say(m, breakRhyme(RNG.pick(TEXT.bossTaunts)), m.d.color, 3500);
  }
}

// Step to the neighbouring cell that is closest (by walking) to the player.
function approach(L, m, dist) {
  let best = null, bestD = dist[idx(m.x, m.y)];
  for (const [dx, dy] of RNG.shuffle(DIR4.slice())) {
    const x = m.x + dx, y = m.y + dy;
    if (!canEnter(L, m, x, y)) continue;
    const d = dist[idx(x, y)];
    if (d < bestD) { bestD = d; best = [x, y]; }
  }
  if (best) moveMonster(L, m, best[0], best[1]);
  else if (RNG.chance(RULES.monsters.stuckWander)) wander(L, m); // stuck behind a friend: shuffle about
}

function flee(L, m, dist) {
  let best = null, bestD = dist[idx(m.x, m.y)];
  for (const [dx, dy] of RNG.shuffle(DIR4.slice())) {
    const x = m.x + dx, y = m.y + dy;
    if (!canEnter(L, m, x, y)) continue;
    const d = dist[idx(x, y)];
    if (d < FAR && (bestD >= FAR || d > bestD)) { bestD = d; best = [x, y]; }
  }
  if (!best) return false;
  moveMonster(L, m, best[0], best[1]);
  return true;
}

// Ghosts ignore walls and just float straight at you.
function drift(L, m) {
  const p = G.player;
  const dx = Math.sign(p.x - m.x), dy = Math.sign(p.y - m.y);
  const opts = Math.abs(p.x - m.x) >= Math.abs(p.y - m.y) ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]];
  for (const [ox, oy] of opts) {
    if ((ox || oy) && canEnter(L, m, m.x + ox, m.y + oy)) { moveMonster(L, m, m.x + ox, m.y + oy); return; }
  }
}

function wander(L, m) {
  const [dx, dy] = RNG.pick(DIR4);
  const x = m.x + dx, y = m.y + dy;
  if (canEnter(L, m, x, y) && passable(L.tiles[idx(x, y)])) moveMonster(L, m, x, y);
}
