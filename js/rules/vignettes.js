'use strict';
// Hand-built rooms: one or two odd little set-pieces per floor. Each has a centrepiece you walk
// into, a verse, and three choices. Scare first (a sting when you find it), then the joke.
// This file is what the rooms do. Their words are in content/vignette-words.js and their
// pictures in draw/vignette-art.js, all keyed by the same room and choice ids.

const VIGNETTE_FLOORS = {
  1: ['teaparty', 'lostfound'],
  2: ['teaparty', 'birthday', 'lostfound'],
  3: ['birthday', 'mirror', 'well', 'lostfound'],
  4: ['mirror', 'well', 'birthday'],
  5: ['musicbox', 'mirror'],
  6: ['namepile'],
};

// Each room's choices, in the order offered: [choice id, what it does]. What it does returns
// [outcome key] or [outcome key, { values }]: the lines under that key in VIGNETTE_WORDS are
// what you read, with the values filled in. `fx` is the room on the map.
const VIGNETTES = {
  teaparty: {
    choices: [
      ['pour', () => {
        const p = G.player, r = Math.random(), R = RULES.rooms.teaparty;
        if (r < R.well) {
          heal(p.maxHp);
          p.poisoned = 0;
          return ['well'];
        }
        if (r < R.poisoned) {
          p.poisoned += ruleAt(R.poison, G.depth);
          p.poisonBy = 'tea';
          return ['poisoned'];
        }
        p.dread = 0;
        p.confused += R.calmConfused;
        return ['calm'];
      }],
      ['sugar', () => {
        const n = RNG.int(...RULES.rooms.teaparty.sugar) * G.depth;
        G.player.gold += n;
        addDread(RULES.rooms.teaparty.sugarDread);
        return ['took', { n }];
      }],
      ['tiptoe', () => ['done']],
    ],
  },

  birthday: {
    choices: [
      ['wish', fx => {
        const p = G.player;
        fx.blown = true;
        const boon = RNG.pick(['rhyme', 'know', 'big']);
        if (boon === 'rhyme') { p.maxVerve++; p.verve = p.maxVerve; } // its words say (+1 rhyme)
        else if (boon === 'know') {
          POTIONS.forEach(x => { G.known.potion[x.id] = true; });
          SCROLLS.forEach(x => { G.known.scroll[x.id] = true; });
        } else { p.maxHp += 4; heal(4); } // its words say (+4 health)
        return [boon];
      }],
      ['candles', fx => {
        const p = G.player;
        fx.took = true;
        p.wick = Math.min(RULES.candle.max, p.wick + RULES.rooms.birthday.candlesWax);
        addDread(RULES.rooms.birthday.candlesDread);
        return ['took'];
      }],
      ['cake', () => {
        const p = G.player, R = RULES.rooms.birthday;
        heal(R.cakeHeal);
        addDread(R.cakeDread);
        if (RNG.chance(R.waxy)) {
          p.poisoned += R.waxPoison;
          p.poisonBy = 'wax';
          return ['waxy'];
        }
        return ['lemon'];
      }],
    ],
  },

  mirror: {
    choices: [
      ['shake', fx => {
        const p = G.player;
        fx.empty = true;
        const gift = randomGear(ruleAt(RULES.rooms.giftTier, G.depth));
        let took = null;
        if (p.inv.length) took = p.inv.splice(RNG.int(0, p.inv.length - 1), 1)[0];
        if (!pocketsFull(p)) p.inv.push(gift);
        else dropItem(G.level, p.x, p.y, gift);
        return took ? ['traded', { took: itemName(took), gift: aName(itemName(gift)) }] : ['given', { gift: aName(itemName(gift)) }];
      }],
      ['smash', fx => {
        const p = G.player;
        fx.smashed = true;
        G.stats.smashedMirror = true;
        addDread(RULES.rooms.mirror.smashDread);
        const shard = Object.assign({ kind: 'weapon', plus: 0 }, MIRROR_SHARD);
        if (!pocketsFull(p)) p.inv.push(shard);
        else dropItem(G.level, p.x, p.y, shard);
        Sound.play('hit', 1.4);
        return ['done'];
      }],
      ['back', () => {
        addDread(RULES.rooms.mirror.backDread);
        return ['done'];
      }],
    ],
  },

  lostfound: {
    choices: [
      ['name', () => {
        const alias = RNG.pick(ALIASES);
        G.alias = alias;
        addDread(RULES.rooms.lostfound.nameDread);
        return ['tag', { alias }];
      }],
      ['handin', () => {
        const p = G.player;
        if (!p.inv.length) return ['nothing'];
        const given = p.inv.splice(RNG.int(0, p.inv.length - 1), 1)[0];
        for (let i = 0; i < 2; i++) { // its words say "two things"
          const it = randomItem(G.depth);
          if (it.kind === 'gold') p.gold += it.amount;
          else if (!pocketsFull(p)) p.inv.push(it);
          else dropItem(G.level, p.x, p.y, it);
        }
        return ['swapped', { given: itemName(given) }];
      }],
      ['bell', () => {
        const L = G.level, p = G.player;
        G.stats.rangBell = true;
        Sound.play('bell');
        let n = 0;
        for (let i = 0; i < RULES.rooms.lostfound.bell; i++) {
          const s = freeNeighbor(L, p.x, p.y);
          if (!s) break;
          const type = RNG.weighted(L.floor.monsters);
          spawnMonster(L, type === 'mimic' ? 'opinion' : type, s[0], s[1]).awake = true;
          n++;
        }
        return [n ? 'everybody' : 'nobody'];
      }],
    ],
  },

  well: {
    choices: [
      ['coins', fx => { // its words say "Toss in 20 coins" and "twenty coins"
        const p = G.player;
        if (p.gold < 20) {
          fx.used = false;
          return ['poor'];
        }
        p.gold -= 20;
        heal(p.maxHp);
        p.wick = Math.min(RULES.candle.max, p.wick + RULES.rooms.well.wax);
        addDread(RULES.rooms.well.coinDread);
        return ['paid'];
      }],
      ['lean', () => {
        const p = G.player;
        const dead = Store.load('graveyard', []).filter(g => !g.won).length;
        addDread(RULES.rooms.well.leanDread);
        p.maxVerve++; // its words say (+1 rhyme)
        p.verve = p.maxVerve;
        return dead ? ['faces', { dead }] : ['yours'];
      }],
      ['walk', () => ['done']],
    ],
  },

  musicbox: {
    choices: [
      ['wind', fx => {
        const L = G.level;
        fx.wound = true;
        if (L.stalker) {
          L.monsters = L.monsters.filter(m => m !== L.stalker);
          L.stalker = null;
        }
        L.turnsHere = Math.max(0, L.turnsHere - RULES.rooms.musicbox.windBack);
        for (const m of L.monsters) if (m.type === 'tot') { m.awake = true; m.frenzy = RULES.rooms.musicbox.windFrenzy; }
        return ['done'];
      }],
      ['smash', fx => {
        const L = G.level, p = G.player;
        fx.smashed = true;
        for (let i = 0; i < 2; i++) { // its words say "two things"
          const it = randomGear(ruleAt(RULES.rooms.giftTier, G.depth));
          if (!pocketsFull(p)) p.inv.push(it);
          else dropItem(L, p.x, p.y, it);
        }
        gainXp(RULES.rooms.musicbox.smashXp);
        if (!L.stalker) spawnStalker(L);
        return ['done'];
      }],
      ['close', fx => {
        fx.closed = true;
        addDread(RULES.rooms.musicbox.closeDread);
        return ['done'];
      }],
    ],
  },

  namepile: {
    choices: [
      ['dig', () => {
        const L = G.level, p = G.player, R = RULES.rooms.namepile;
        if (RNG.chance(R.mites)) {
          for (let i = 0; i < 2; i++) {
            const s = freeNeighbor(L, p.x, p.y);
            if (s) spawnMonster(L, 'mite', s[0], s[1]).awake = true;
          }
          return ['mites'];
        }
        gainXp(R.xp);
        heal(R.heal);
        const found = RNG.pick(VIGNETTE_WORDS.namepile.names);
        return ['found', { found }];
      }],
      ['read', () => {
        const p = G.player;
        p.verve = p.maxVerve;
        addDread(RULES.rooms.namepile.readDread);
        return ['done'];
      }],
      ['leave', () => ['done']],
    ],
  },
};

// Stamp one or two set-pieces into rooms that aren't the start or the stairs.
function placeVignettes(L) {
  L.fixtures = [];
  const pool = VIGNETTE_FLOORS[L.depth] || [];
  const kinds = L.depth === 5 ? ['musicbox'].concat(RNG.shuffle(pool.filter(k => k !== 'musicbox'))) : RNG.shuffle(pool.slice());
  const count = Math.min(kinds.length, 1 + (RNG.chance(RULES.rooms.second) ? 1 : 0));
  const inRoom = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  for (const kind of kinds.slice(0, count)) {
    const rooms = RNG.shuffle(L.rooms.filter((r, i) => r.w >= 4 && r.h >= 3 && !(L.isBoss && i === 0)
      && !inRoom(r, L.start.x, L.start.y) && !(L.stairs && inRoom(r, L.stairs.x, L.stairs.y))
      && !L.fixtures.some(f => inRoom(r, f.x, f.y))));
    for (const r of rooms) {
      const c = center(r), cells = [[c.x, c.y]];
      for (let i = 0; i < 20; i++) cells.push([RNG.int(r.x + 1, r.x + r.w - 2), RNG.int(r.y + 1, r.y + r.h - 2)]);
      const spot = cells.find(([x, y]) => passable(L.tiles[idx(x, y)]) && L.tiles[idx(x, y)] !== T.STAIRS
        && DIR8.every(([dx, dy]) => passable(L.tiles[idx(x + dx, y + dy)]))
        && !L.items.some(it => it.x === x && it.y === y) && !L.monsters.some(m => m.x === x && m.y === y));
      if (spot) {
        L.fixtures.push({ kind, x: spot[0], y: spot[1], used: false, seen: false });
        break;
      }
    }
  }
}

const fixtureAt = (L, x, y) => (L.fixtures || []).find(f => f.x === x && f.y === y);

// The first time you see one: a sting, then (on the page, when you walk in) the joke.
function noticeFixtures(L) {
  for (const f of L.fixtures || []) {
    if (f.seen || !L.visible[idx(f.x, f.y)]) continue;
    f.seen = true;
    msg(VIGNETTE_WORDS[f.kind].found, C.purple);
    Sound.play('sting', 0.35);
    FX.jolt(2, INK);
    addDread(RULES.rooms.seenDread);
    if (f.kind === 'birthday') FX.word(f.x, f.y - 1, 'surprise…', true);
  }
}

// Walking into the centrepiece. Returns true if it took a turn.
function useFixture(f) {
  if (f.used) {
    msg(VIGNETTE_WORDS[f.kind].usedMsg, C.gray);
    return false;
  }
  showChoicePage(f);
  return false; // the turn is spent when the page closes
}

// Choice i on the room's page: do it, then show (and log) the words for how it went.
function chooseFixture(pg, i) {
  const f = pg.fx, v = VIGNETTES[f.kind], words = VIGNETTE_WORDS[f.kind];
  i = clamp(i, 0, v.choices.length - 1);
  f.used = true;
  G.stats.rooms++;
  const [id, effect] = v.choices[i];
  const [outcome, values] = effect(f);
  const said = words.choices[id];
  const lines = said[outcome].map(l => fill(l, values || {}));
  pg.result = { choice: said.label, lines, t: FX.now };
  G.logMark = G.log.length;
  msg(`${words.name}: ${said.label}. ${lines.join(' ')}`, C.purple);
}
