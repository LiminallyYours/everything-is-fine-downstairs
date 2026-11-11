'use strict';
// Making, naming, describing, and (mis)using the things you find on the floor.

// ---------------------------------------------------------------------------------------
// What you wear and wield lives in four slots, apart from your pockets.

// [slot, its label], in the order shown. What an empty slot holds is TEXT.items.empty[slot].
const SLOTS = ['hand', 'head', 'body', 'feet'].map(slot => [slot, TEXT.items.slots[slot]]);

// Every weapon and armor has a stable id ('spork', 'nest', 'colander'...): drawings and coat
// colours key on it, never on the display name. Gear saved in the graveyard before ids existed
// is matched by its name; anything still unknown gets a fallback drawing.
const GEAR_BY_ID = byId(WEAPONS.concat(ARMORS, [MIRROR_SHARD]));
const GEAR_BY_NAME = Object.fromEntries(WEAPONS.concat(ARMORS, [MIRROR_SHARD]).map(g => [g.name, g]));
// Gear in graves saved before November 2026, by the id or the name it had then.
const GEAR_WAS = { hat: 'nest', 'Tall Stripy Hat': 'nest', 'Oobleck-Crusted Overcoat': 'overcoat' };

function gearId(it) {
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  if (it.id && has(GEAR_BY_ID, it.id)) return it.id;
  if (it.id && has(GEAR_WAS, it.id)) return GEAR_WAS[it.id];
  if (has(GEAR_BY_NAME, it.name)) return GEAR_BY_NAME[it.name].id;
  return has(GEAR_WAS, it.name) ? GEAR_WAS[it.name] : null;
}

function gearSlot(it) {
  if (!it) return null;
  if (it.kind === 'weapon') return 'hand';
  if (it.kind === 'pair') return 'feet';
  if (it.kind === 'armor') {
    if (it.slot) return it.slot;
    const g = GEAR_BY_ID[gearId(it)]; // very old graves: armor saved without a slot
    return g ? g.slot : /Hat|Colander/.test(it.name || '') ? 'head' : 'body';
  }
  return null;
}

// What a piece of gear adds: attack for weapons, defense for everything else.
function gearBonus(it) {
  if (!it) return 0;
  if (it.kind === 'weapon') return it.atk + (it.plus || 0);
  if (it.kind === 'pair') return 1;
  return it.def || 0;
}

// Put on / pick up the item in pocket i. What was in that slot goes back in your pockets.
function equip(i) {
  const p = G.player, it = p.inv[i], slot = gearSlot(it);
  if (!it) return false;
  if (!slot) {
    msg(phrase('items.equip.cannot', { item: aName(itemName(it)) }), C.gray);
    return false;
  }
  p.inv.splice(i, 1);
  const old = p.gear[slot];
  p.gear[slot] = it;
  if (old) p.inv.push(old);
  const swap = old ? phrase('items.equip.swap', { old: itemName(old) }) : '';
  if (slot === 'hand') msg(phrase('items.equip.hand', { item: itemName(it), swap }), C.blue);
  else if (slot === 'head') msg(phrase('items.equip.head', { item: itemName(it), swap }), C.teal);
  else if (slot === 'body') msg(phrase('items.equip.body', { item: itemName(it), swap }), C.teal);
  else {
    msg(phrase('items.equip.feet', { pattern: it.id, swap }), C.pink);
    if (!it.worn) addDread(RULES.floors.socks.pairDread);
  }
  it.worn = true;
  Sound.play('pickup');
  G.invSel = clamp(G.invSel, 0, Math.max(0, pocketRows(p).length - 1));
  return true;
}

function unequip(slot) {
  const p = G.player, it = p.gear[slot];
  if (!it) {
    msg(phrase('items.unequip.nothing', { empty: TEXT.items.empty[slot] }), C.gray);
    return false;
  }
  if (pocketsFull(p)) {
    msg(phrase('items.unequip.full', { item: itemName(it) }), C.gray);
    return false;
  }
  p.gear[slot] = null;
  p.inv.push(it);
  msg(slot === 'hand' ? phrase('items.unequip.hand', { item: itemName(it) })
    : phrase('items.unequip.other', { item: itemName(it) }), C.gray);
  Sound.play('pickup', 0.6);
  return true;
}

// ---------------------------------------------------------------------------------------

// Every pocket taken? (There are RULES.player.pockets of them.)
function pocketsFull(p = G.player) {
  return p.inv.length >= RULES.player.pockets;
}

function makeItem(kind, id) {
  if (kind === 'weapon') return Object.assign({ kind, plus: 0 }, WEAPONS[id]);
  if (kind === 'armor') return Object.assign({ kind }, ARMORS[id]);
  return { kind, id };
}

function goldPile(depth) {
  return { kind: 'gold', amount: RNG.int(...RULES.loot.gold) * depth };
}

function randomItem(depth) {
  const kind = RNG.weighted(RULES.loot.kinds);
  if (kind === 'gold') return goldPile(depth);
  if (kind === 'gear') return randomGear(depth);
  const table = kind === 'potion' ? POTIONS : kind === 'scroll' ? SCROLLS : FOODS;
  return makeItem(kind, RNG.weighted(table.map(t => [t.id, t.freq])));
}

// `weapon`: true for a weapon, false for something to wear, left out for either.
function randomGear(depth, weapon) {
  if (weapon == null) weapon = RNG.chance(RULES.loot.weapon);
  const list = weapon ? WEAPONS : ARMORS;
  const ok = [];
  list.forEach((g, i) => { if (g.tier <= depth && g.tier >= depth - RULES.loot.gearTiers) ok.push(i); });
  return makeItem(weapon ? 'weapon' : 'armor', ok.length ? RNG.pick(ok) : 0);
}

function dropItem(L, x, y, item) {
  L.items.push({ x, y, item });
}

function itemName(it) {
  const N = TEXT.items.names;
  switch (it.kind) {
    case 'potion':
      return G.known.potion[it.id] ? POTION_BY[it.id].name : fill(N.potion, { look: G.looks.potion[it.id][0] });
    case 'scroll':
      return G.known.scroll[it.id] ? SCROLL_BY[it.id].name : fill(N.scroll, { title: G.looks.scroll[it.id] });
    case 'food': return FOOD_BY[it.id].name;
    case 'weapon': return it.plus ? fill(N.plus, { name: it.name, plus: it.plus }) : it.name;
    case 'armor': return it.name;
    case 'gold': return fill(N.gold, { n: it.amount });
    case 'sock': return fill(N.sock, { pattern: cap(it.id) });
    case 'pair': return fill(N.pair, { pattern: cap(it.id) });
    case 'candle': return N.candle;
    case 'bones': return fill(N.bones, { who: phrase('somebody', { n: it.run }) });
  }
  return N.unknown;
}

function itemGlyph(it) {
  const color = it.kind === 'potion' ? G.looks.potion[it.id][1] : it.kind === 'sock' ? SOCKS[it.id] : ITEM_COLOR[it.kind];
  return { ch: ITEM_GLYPH[it.kind], color };
}

function itemDesc(it) {
  const D = TEXT.items.desc;
  switch (it.kind) {
    case 'potion': return G.known.potion[it.id] ? POTION_BY[it.id].desc : D.potion;
    case 'scroll': return G.known.scroll[it.id] ? SCROLL_BY[it.id].desc : D.scroll;
    case 'food': { const f = FOOD_BY[it.id]; return fill(D.food, { desc: f.desc, heal: f.heal }); }
    case 'weapon': return fill(D.weapon, { atk: it.atk + it.plus, desc: it.desc });
    case 'armor': return fill(D.armor, { slot: gearSlot(it), def: it.def, desc: it.desc });
    case 'sock': return D.sock;
    case 'pair': return D.pair;
  }
  return '';
}

// Use the item in pocket slot i. Returns true if that took a turn.
function useItem(i) {
  const p = G.player, it = p.inv[i];
  if (!it) {
    msg(phrase('items.emptyPocket', { key: slotKey(i) }), C.gray);
    return false;
  }
  if (it.kind === 'sock') {
    msg(phrase('items.sniff'), C.gray);
    addDread(RULES.floors.socks.sniffDread);
    return false;
  }
  if (gearSlot(it)) return equip(i); // wearing and wielding go through the equipment slots
  p.inv.splice(i, 1);
  switch (it.kind) {
    case 'potion': drink(it); break;
    case 'scroll': readScroll(it); break;
    case 'food': eat(it); break;
  }
  G.invSel = clamp(G.invSel, 0, Math.max(0, pocketRows(p).length - 1));
  return true;
}

// Your pockets as you see them: identical things share a row with a count, and things of a kind
// sit together (food, then potions, scrolls, weapons, things to wear, socks). Each thing still
// takes its own pocket, RULES.player.pockets of them. The number keys go by row.
const POCKET_ORDER = ['food', 'potion', 'scroll', 'weapon', 'armor', 'pair', 'sock'];
const pocketKey = it => [it.kind, it.id || '', it.name || '', it.plus || 0].join('|');
function pocketRows(p = G.player) {
  const rows = [], byKey = new Map();
  p.inv.forEach((it, i) => {
    const k = pocketKey(it);
    if (byKey.has(k)) byKey.get(k).idx.push(i);
    else { const r = { it, idx: [i] }; byKey.set(k, r); rows.push(r); }
  });
  const rank = r => (POCKET_ORDER.includes(r.it.kind) ? POCKET_ORDER.indexOf(r.it.kind) : POCKET_ORDER.length);
  return rows.map((r, n) => [r, n]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([r]) => r);
}
// The pocket behind a row (an index into your things), or -1 if there is no such row.
function pocketAt(row) {
  const r = pocketRows()[row];
  return r ? r.idx[0] : -1;
}
// The row a thing is shown in.
function rowOf(it) {
  return pocketRows().findIndex(r => r.idx.some(i => G.player.inv[i] === it));
}
// A number key: use one of whatever is in that row.
function usePocket(row) {
  const i = pocketAt(row);
  if (i < 0) {
    msg(phrase('items.emptyPocket', { key: slotKey(row) }), C.gray);
    return false;
  }
  return useItem(i);
}

function dropFromPockets(i) {
  const p = G.player, it = p.inv[i];
  if (!it) return false;
  p.inv.splice(i, 1);
  dropItem(G.level, p.x, p.y, it);
  msg(phrase('items.drop', { the: theName(itemName(it)) }), C.gray);
  G.invSel = clamp(G.invSel, 0, Math.max(0, pocketRows(p).length - 1));
  return true;
}

function drink(it) {
  const p = G.player, wasKnown = G.known.potion[it.id];
  msg(phrase('items.drink', { item: itemName(it) }));
  if (!wasKnown) G.stats.unknownDrinks++;
  G.known.potion[it.id] = true;
  Sound.play('drink');
  switch (it.id) {
    case 'heal': {
      const n = heal(ruleAt(POTION_BY.heal.power, G.depth));
      p.poisoned = 0;
      msg(fill(POTION_BY.heal.drink, { n }), C.green);
      break;
    }
    case 'bigheal':
      p.maxHp += 4; // its words say (+4 max HP)
      p.hp = p.maxHp;
      p.poisoned = 0;
      p.confused = 0;
      msg(POTION_BY.bigheal.drink, C.green);
      break;
    case 'poison':
      p.poisoned += ruleAt(POTION_BY.poison.power, G.depth);
      p.poisonBy = 'potion:' + it.id;
      msg(POTION_BY.poison.drink, C.red);
      break;
    case 'confuse':
      p.confused += POTION_BY.confuse.power;
      msg(POTION_BY.confuse.drink, C.pink);
      break;
    case 'might':
      p.baseAtk++;
      msg(POTION_BY.might.drink, C.orange);
      break;
    case 'sight':
      p.sensing += POTION_BY.sight.power;
      msg(POTION_BY.sight.drink, C.teal);
      break;
  }
  if (!wasKnown) msg(phrase('items.identified', { name: POTION_BY[it.id].name }), C.gray);
}

function readScroll(it) {
  makeNoise(); // reading aloud (Nap Time)
  const p = G.player, L = G.level, wasKnown = G.known.scroll[it.id];
  msg(phrase('items.read', { item: itemName(it) }));
  G.known.scroll[it.id] = true;
  Sound.play('scroll');
  if (!wasKnown) addDread(3);
  const seen = L.monsters.filter(m => L.visible[idx(m.x, m.y)] && !m.disguised);
  switch (it.id) {
    case 'teleport': {
      const pos = freeTile(L, 0);
      if (pos) { p.x = pos[0]; p.y = pos[1]; }
      msg(SCROLL_BY.teleport.read, C.purple);
      stepOnto();
      break;
    }
    case 'map':
      revealMap(L);
      msg(SCROLL_BY.map.read, C.yellow);
      break;
    case 'fear':
      seen.forEach(m => { m.fear = m.d.ai === 'boss' || m.d.invulnerable ? SCROLL_BY.fear.bossPower : SCROLL_BY.fear.power; m.awake = true; });
      msg(seen.length ? SCROLL_BY.fear.read.seen : SCROLL_BY.fear.read.alone, C.purple);
      break;
    case 'smite':
      msg(SCROLL_BY.smite.read.boom, C.yellow);
      if (!seen.length) msg(SCROLL_BY.smite.read.alone, C.gray);
      Sound.play('hit', 1.5);
      FX.jolt(4, '#fff4b0');
      for (const m of seen) {
        if (m.d.invulnerable) {
          msg(fill(SCROLL_BY.smite.read.tickles, { them: theM(m) }), C.yellow);
          continue;
        }
        const d = RNG.int(...SCROLL_BY.smite.power);
        m.hp -= d;
        m.awake = true;
        msg(fill(SCROLL_BY.smite.read.licks, { them: theM(m), n: d }), C.yellow);
        if (m.hp <= 0) killMonster(m);
      }
      break;
    case 'enchant':
      if (p.gear.hand) {
        p.gear.hand.plus = (p.gear.hand.plus || 0) + 1;
        msg(fill(SCROLL_BY.enchant.read.weapon, { weapon: p.gear.hand.name }), C.blue);
      } else {
        p.baseAtk++;
        msg(SCROLL_BY.enchant.read.fists, C.blue);
      }
      break;
    case 'summon': {
      let n = 0;
      const want = RNG.int(...SCROLL_BY.summon.power);
      for (let i = 0; i < want; i++) {
        const s = freeNeighbor(L, p.x, p.y);
        if (!s) break;
        const type = RNG.weighted(L.floor.monsters);
        const m = spawnMonster(L, type === 'mimic' ? 'opinion' : type, s[0], s[1]);
        speak(m, 'spot', 1);
        m.awake = true;
        n++;
      }
      msg(n ? SCROLL_BY.summon.read.company : SCROLL_BY.summon.read.noRoom, C.red);
      break;
    }
  }
  if (!wasKnown) msg(phrase('items.identified', { name: SCROLL_BY[it.id].name }), C.gray);
}

function eat(it) {
  const p = G.player, f = FOOD_BY[it.id];
  if (it.id === 'eggs') G.stats.eggs++;
  addDread(RULES.food.dread);
  if (RNG.chance(f.spoil)) {
    const n = heal(Math.floor(f.heal / 2));
    p.poisoned += RULES.food.spoiledPoison;
    p.poisonBy = 'food:' + f.id;
    msg(phrase('items.spoiled', { bad: f.bad, n }), C.red);
  } else {
    const n = heal(f.heal);
    msg(phrase('items.eat', { the: theName(f.name), n }), C.green);
  }
}

// Throw a potion at a horror instead of drinking it. Some of these are good ideas.
function throwPotion(i, m) {
  makeNoise(); // smash (Nap Time)
  const p = G.player, it = p.inv[i];
  if (!it || it.kind !== 'potion' || !m || m.hp <= 0) return false;
  p.inv.splice(i, 1);
  const wasKnown = G.known.potion[it.id], them = theM(m), Them = cap(them);
  const name = itemName(it);
  G.known.potion[it.id] = true;
  FX.lunge(p, m.x - p.x, m.y - p.y);
  FX.recoil(m, m.x - p.x, m.y - p.y);
  Sound.play('splash');
  m.awake = true;
  msg(phrase('items.throw', { item: name, them }));
  if (m.d.invulnerable) {
    msg(phrase('items.blanket'), C.gray);
  } else {
    switch (it.id) {
      case 'heal':
        m.hp = Math.min(m.maxHp, m.hp + ruleAt(POTION_BY.heal.power, G.depth));
        msg(fill(POTION_BY.heal.splash, { Them }), C.red);
        break;
      case 'bigheal':
        m.hp = m.maxHp;
        msg(fill(POTION_BY.bigheal.splash, { Them }), C.red);
        break;
      case 'poison':
        m.poison = (m.poison || 0) + POTION_BY.poison.thrown;
        msg(fill(POTION_BY.poison.splash, { Them }), C.green);
        break;
      case 'confuse':
        m.dazed = Math.max(m.dazed || 0, POTION_BY.confuse.thrown);
        msg(fill(POTION_BY.confuse.splash, { Them }), C.pink);
        break;
      case 'might':
        m.bonusAtk = (m.bonusAtk || 0) + POTION_BY.might.thrown;
        msg(fill(POTION_BY.might.splash, { Them }), C.red);
        break;
      case 'sight':
        m.fear = Math.max(m.fear || 0, POTION_BY.sight.thrown);
        msg(fill(POTION_BY.sight.splash, { Them }), C.teal);
        break;
    }
  }
  if (!wasKnown) msg(phrase('items.identified', { name: POTION_BY[it.id].name }), C.gray);
  G.invSel = clamp(G.invSel, 0, Math.max(0, pocketRows(p).length - 1));
  return true;
}
