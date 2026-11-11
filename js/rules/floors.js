'use strict';
// What makes each floor itself: your candle, the Tuck-You-In who comes if you dawdle,
// and one signature rule per floor.

const stalkerDue = depth => ruleAt(RULES.stalker.due, depth); // turns on a floor before bedtime

function lightRadius() {
  const p = G.player, L = G.level;
  if (!p || !L) return 1;
  if (p.hidden || p.darkTurns > 0 || p.wick <= 0 || inDarkRoom(L, p.x, p.y)) return 1;
  return clamp(Math.ceil(1 + (L.floor.light - 1) * Math.min(1, p.wick / RULES.candle.full)), 1, L.floor.light);
}

// In the dark: your light reaches RULES.candle.darkRadius cells or less.
function inDarkness(r = lightRadius()) {
  return r <= RULES.candle.darkRadius;
}

function floorEnter(L) {
  Object.assign(L, { turnsHere: 0, phantoms: [], ghosts: [], searched: new Set(), stalker: null, clock: 0, strikes: 0, tideOn: false });
  for (let i = 0; i < RULES.spawn.stubs + (L.depth >= RULES.spawn.extraStubFrom ? 1 : 0); i++) {
    const pos = freeTile(L, 4);
    if (pos) dropItem(L, pos[0], pos[1], { kind: 'candle' });
  }
  if (L.depth === 3) placeSocks(L);
  L.stains = [];
  placeVignettes(L);
  placeDarkRoom(L);
  placeGhosts(L);
  planSurprise(L);
}

// You hear a Tick-Tock Tot coming before you see it: "tick…", "tock…", written where it is, every
// turn, through walls. When it gets close, it goes silent. Then it pounces.
function totTicks(L) {
  const p = G.player;
  for (const m of L.monsters) {
    if (!m.d.tick || !m.awake || m.napping || m.lulled > 0 || L.visible[idx(m.x, m.y)]) continue;
    const d = manhattan(m, p), T2 = m.d.tick;
    if (d <= T2.silent || d > T2.hear) continue;
    m.tock = !m.tock;
    Sound.play('tick', 1.2 - d / T2.hear, clamp((m.x - p.x) / 8, -1, 1));
    FX.word(m.x, m.y, m.tock ? 'tock…' : 'tick…');
  }
}

// --- Dark rooms: one room on some floors where the light will not go, with a prize in it. ----

const inRect = (r, x, y) => !!r && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
const inDarkRoom = (L, x, y) => inRect(L.darkRoom, x, y);

function placeDarkRoom(L) {
  L.darkRoom = null;
  const D = RULES.darkRooms;
  if (L.isBoss || !D.floors.includes(L.depth)) return;
  const rooms = RNG.shuffle(L.rooms.filter(r => r.w >= 3 && r.h >= 3 && !inRect(r, L.start.x, L.start.y)
    && !(L.stairs && inRect(r, L.stairs.x, L.stairs.y)) && !L.fixtures.some(f => inRect(r, f.x, f.y))));
  const r = rooms[0];
  if (!r) return;
  L.darkRoom = { x: r.x, y: r.y, w: r.w, h: r.h, seen: false, entered: false };
  const c = center(r), free = (x, y) => passable(L.tiles[idx(x, y)]) && L.tiles[idx(x, y)] !== T.STAIRS && !L.items.some(it => it.x === x && it.y === y);
  const spot = free(c.x, c.y) ? c : pickSpot(L, r);
  const prize = randomGear(L.depth + D.better);
  if (spot && prize) dropItem(L, spot.x, spot.y, prize);
}

// Every turn: the first glimpse of a dark room's doorway, and the first step inside.
function darkRoomTurn(L) {
  const r = L.darkRoom, p = G.player;
  if (!r) return;
  if (!r.seen && darkRoomDoors(L).some(([, , ox, oy]) => L.visible[idx(ox, oy)])) {
    r.seen = true;
    msg(TEXT.darkRoom.notice, C.purple);
    addDread(RULES.darkRooms.noticeDread);
  }
  if (!r.entered && inDarkRoom(L, p.x, p.y)) {
    r.entered = true;
    r.seen = true;
    msg(TEXT.darkRoom.enter, C.purple);
  }
}

// The ways into a dark room: [x, y] just inside, and [ox, oy] just outside.
function darkRoomDoors(L) {
  const r = L.darkRoom, out = [];
  if (!r) return out;
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
    if (x !== r.x && x !== r.x + r.w - 1 && y !== r.y && y !== r.y + r.h - 1) continue;
    for (const [dx, dy] of DIR4) {
      const ox = x + dx, oy = y + dy;
      if (inMap(ox, oy) && !inRect(r, ox, oy) && passable(L.tiles[idx(ox, oy)])) out.push([x, y, ox, oy]);
    }
  }
  return out;
}

// Once per turn, after the monsters move.
function floorTurn(L) {
  const p = G.player;
  L.turnsHere++;
  if (p.wick > 0) {
    p.wick--;
    if (p.wick === RULES.candle.low) msg('Your candle is burning low. The dark leans in to watch.', C.orange);
    if (p.wick === 0) {
      msg('Your candle gutters... and goes out. The dark says hello.', C.red);
      Sound.play('snuff');
      addDread(RULES.dread.candleOut);
    }
  }
  if (p.darkTurns > 0) p.darkTurns--;
  if (inDarkness()) G.stats.darkTurns++;
  if (p.hidden) G.stats.hiddenTurns++;
  stalkerTick(L);
  darkRoomTurn(L);
  surpriseTurn(L);
  if (L.depth === 4) tideTurn(L);
  if (L.depth === 5) clockTurn(L);
  if (L.depth === 6) chewTurn(L);
  totTicks(L);
  // An Ahem clears its throat in the dark before it reaches you.
  for (const m of L.monsters) {
    if (m.type !== 'wraith' || !m.awake || L.visible[idx(m.x, m.y)]) continue;
    if (manhattan(m, p) <= RULES.floors.ahemRange && RNG.chance(RULES.floors.ahemWord)) FX.word(m.x, m.y, 'ahem');
  }
}

// --- Candle -----------------------------------------------------------------

function snuff(amount, why) {
  const p = G.player;
  if (p.wick <= 0) return;
  p.wick = Math.max(0, p.wick - amount);
  msg(why + (p.wick === 0 ? ' Your candle goes out!' : ''), C.orange);
  Sound.play('snuff', 0.7);
  if (p.wick === 0) addDread(RULES.dread.candleOut);
}

function meltStub() {
  const p = G.player, wasOut = p.wick <= 0;
  p.wick = Math.min(RULES.candle.max, p.wick + RULES.candle.stub);
  G.stats.stubs++;
  Sound.play('candle');
  msg(wasOut ? 'You find a candle stub and light it with trembling fingers. Light! Beautiful, flickering light!'
    : 'You squish a candle stub onto your candle. The dark backs off a step. (+' + RULES.candle.stub + ')', C.orange);
  addDread(RULES.dread.stub);
}

// --- The Tuck-You-In ---------------------------------------------------------

function stalkerTick(L) {
  if (L.isBoss) return;
  const R = RULES.stalker, due = stalkerDue(L.depth), t = L.turnsHere;
  if (!L.stalker) {
    if (t === due - R.musicBoxLead) msg('Somewhere far above you, a music box begins to play.', C.pink);
    else if (t === due - R.closerLead) {
      msg('The music box is closer now. It is playing your song. It is almost bedtime.', C.pink);
      addDread(R.closerDread);
    } else if (t >= due) spawnStalker(L);
    return;
  }
  const m = L.stalker;
  m.speed = Math.min(R.speedMax, MONSTERS.tuck.speed + (t - due) / R.speedRampTurns);
  if (!L.visible[idx(m.x, m.y)] && manhattan(m, G.player) < R.hearRange && RNG.chance(R.hum)) FX.word(m.x, m.y, RNG.pick(['♪', '♫', 'shhh…', 'hush…']));
  if (RNG.chance(R.talk) && manhattan(m, G.player) < R.hearRange) FX.say(m, breakRhyme(RNG.pick(SPEECH.tuck.idle)), MONSTERS.tuck.color);
}

function spawnStalker(L) {
  const p = G.player;
  let spot = L.start;
  if (manhattan(spot, p) < RULES.stalker.arriveMinDist || monsterAt(spot.x, spot.y)) spot = farthestSpot(L, p, L.rooms);
  if (monsterAt(spot.x, spot.y) || (spot.x === p.x && spot.y === p.y)) return; // try again next turn
  const m = spawnMonster(L, 'tuck', spot.x, spot.y);
  m.awake = true;
  m.speed = MONSTERS.tuck.speed;
  L.stalker = m;
  msg('The music box stops. Something has come down the stairs after you. It is carrying a blanket.', C.red);
  addDread(RULES.stalker.arriveDread);
  Sound.play('sting');
  FX.jolt(6, '#e8e0ff');
  queueCard('tuck');
}

// --- Floor 1: the Cellar. Hide in the barrels. -------------------------------

function enterBarrel(L, x, y) {
  const p = G.player, i = idx(x, y);
  p.x = x;
  p.y = y;
  p.hidden = true;
  G.stats.barrels++;
  Sound.play('splash', 0.7);
  if (L.searched.has(i)) {
    msg('You climb back into the barrel. It remembers you.', C.gray);
    return;
  }
  L.searched.add(i);
  const roll = Math.random(), R = RULES.floors.barrel;
  if (roll < R.mite) {
    const s = freeNeighbor(L, x, y);
    if (s) {
      const m = spawnMonster(L, 'mite', s[0], s[1]);
      m.awake = true;
      msg('A Mold-Mite was already in this barrel. It is furious about the pickles.', C.red);
      return;
    }
  }
  if (roll < R.loot) {
    const item = randomItem(L.depth);
    if (item.kind === 'gold') G.player.gold += item.amount;
    else if (!pocketsFull(p)) p.inv.push(item);
    else dropItem(L, p.x, p.y, item);
    msg(`Someone left ${aName(itemName(item))} in this barrel. And also, mostly, themselves.`, C.teal);
    addDread(R.lootDread);
    return;
  }
  msg('You climb into the barrel of pickled regrets. You are hidden. You are also, now, a pickle.', C.green);
}

// --- Floor 3: the Catacombs. Take a sock and the socks rise. ------------------

function placeSocks(L) {
  const [a, b] = RNG.shuffle(Object.keys(SOCKS));
  for (const pattern of [a, a, b]) {
    const pos = freeTile(L, RULES.floors.socks.minDist);
    if (pos) dropItem(L, pos[0], pos[1], { kind: 'sock', id: pattern });
  }
}

function socksRise(L) {
  const p = G.player, R = RULES.floors.socks, [rx, ry] = R.reach;
  let risen = 0;
  for (let y = p.y - ry; y <= p.y + ry && risen < R.most; y++) {
    for (let x = p.x - rx; x <= p.x + rx && risen < R.most; x++) {
      if (!inMap(x, y) || L.tiles[idx(x, y)] !== T.PROP || !RNG.chance(R.rise)) continue;
      const s = freeNeighbor(L, x, y);
      if (!s) continue;
      L.tiles[idx(x, y)] = T.DECO;
      spawnMonster(L, 'sockling', s[0], s[1]).awake = true;
      risen++;
    }
  }
  if (risen) {
    msg('The socks rise! Every lost sock wants its partner back, and every one of them thinks you have it.', C.pink);
    Sound.play('ghost');
    addDread(R.riseDread);
    queueCard('sockling');
  }
}

function checkSockPair() {
  const p = G.player;
  for (const pattern of Object.keys(SOCKS)) {
    const socks = p.inv.filter(i => i.kind === 'sock' && i.id === pattern);
    if (socks.length < 2) continue;
    p.inv = p.inv.filter(i => i !== socks[0] && i !== socks[1]);
    p.inv.push({ kind: 'pair', id: pattern });
    msg(`A MATCHING PAIR of ${pattern} socks! Against all odds! Put them on from your equipment (E).`, C.pink);
    Sound.play('levelup');
  }
}

// --- Floor 4: the Sea-Caves. The tide comes in. -------------------------------

function tideTurn(L) {
  const R = RULES.floors.tide;
  if (L.turnsHere % R.every !== 0) return;
  let water = 0, open = 0;
  for (const t of L.tiles) {
    if (t === T.WATER || t === T.DEEP) water++;
    if (passable(t)) open++;
  }
  if (water > open * R.most) return;
  if (!L.tideOn) {
    L.tideOn = true;
    msg('The tide is coming in. The Sea-Caves have started crying again.', C.blue);
  }
  const wet = [];
  for (let i = 0; i < L.tiles.length; i++) if (L.tiles[i] === T.WATER) wet.push(i);
  RNG.shuffle(wet);
  for (const i of wet.slice(0, R.spread)) {
    const x = i % MAP_W, y = (i / MAP_W) | 0;
    const [dx, dy] = RNG.pick(DIR4);
    const n = idx(x + dx, y + dy);
    if ([T.FLOOR, T.DECO, T.GRASS].includes(L.tiles[n])) L.tiles[n] = T.WATER;
    const surrounded = DIR4.every(([ax, ay]) => [T.WATER, T.DEEP, T.WALL, T.PROP].includes(L.tiles[idx(x + ax, y + ay)]));
    if (surrounded && RNG.chance(R.deepen)) L.tiles[i] = T.DEEP;
  }
  if (RNG.chance(R.splash)) Sound.play('splash', 0.4);
}

// --- Floor 5: the Nursery. The clock strikes; the lights go out; the Tots wake. ---

function clockTurn(L) {
  const R = RULES.floors.clock, phase = ++L.clock % R.every;
  if (phase === R.warn) msg('The great nursery clock whirrs. Something is about to strike.', C.yellow);
  if (phase >= R.warn) Sound.play('tick', 0.6 + (phase - R.warn) * 0.15);
  if (phase !== 0) return;
  const hour = (L.strikes++ % 12) + 1;
  for (let i = 0; i < Math.min(hour, R.bells); i++) Sound.play('bell', 1, 0, i * 1.1);
  FX.word(G.player.x, G.player.y - 3, 'BONG', true);
  msg(`BONG. The clock strikes ${hour}. The lights go out, and the Tots wake up.`, C.yellow);
  G.player.darkTurns = R.dark;
  addDread(R.dread);
  FX.jolt(3, '#000000');
  for (const m of L.monsters) if (m.type === 'tot' && !m.napping) { m.awake = true; m.frenzy = R.frenzy; }
  makeNoise(); // BONG (Nap Time)
}

// --- Floor 6: the Bottom. Everything down here is a mouth. --------------------

function chewTurn(L) {
  const p = G.player, R = RULES.floors.chew;
  const walls = DIR4.map(([dx, dy]) => [p.x + dx, p.y + dy]).filter(([x, y]) => L.tiles[idx(x, y)] === T.WALL);
  if (walls.length && RNG.chance(R.bite)) {
    const [x, y] = RNG.pick(walls);
    FX.bite(x, y);
    FX.word(x, y, 'CHOMP', true);
    FX.recoil(p, p.x - x, p.y - y);
    Sound.play('chew');
    hurtPlayer(2, 'wall');
    msg('The wall BITES you! (-2) Everything down here is a mouth.', C.red);
  }
  if (L.turnsHere % R.every === 0) {
    Sound.play('chew', 0.3);
    FX.word(p.x + RNG.int(-5, 5), p.y + RNG.pick([-4, 4]), 'crunch…');
    if (RNG.chance(R.gnaw)) {
      for (let i = 0; i < 40; i++) {
        const x = p.x + RNG.int(-10, 10), y = p.y + RNG.int(-6, 6);
        if (x < 1 || y < 1 || x >= MAP_W - 1 || y >= MAP_H - 1 || L.tiles[idx(x, y)] !== T.WALL) continue;
        if (!DIR4.some(([dx, dy]) => passable(L.tiles[idx(x + dx, y + dy)]))) continue;
        L.tiles[idx(x, y)] = T.FLOOR;
        FX.bite(x, y);
        msg('Somewhere nearby, a wall takes a bite out of itself.', C.dim);
        break;
      }
    }
  }
}
