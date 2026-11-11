'use strict';
// Each middle floor has one surprise, once per visit, at a moment nobody tells you about: the
// sock catacombs close a drawer, the sea-caves run a bath, the nursery has nap time. The narrator
// announces each one, cheerfully. Their words are in TEXT.surprises, their numbers in
// RULES.surprises. A floor's surprise is plain data on the level (L.surprise), so it is saved
// with the run.

const SURPRISE_FLOORS = { 3: 'drawer', 4: 'bath', 5: 'nap' };

// When a floor is entered: choose its surprise's moment.
function planSurprise(L) {
  const kind = SURPRISE_FLOORS[L.depth], R = RULES.surprises;
  L.surprise = kind ? { kind, stage: 'waiting', at: G.turn + RNG.int(R.from, R.to), tries: 0 } : null;
}

// Every turn on the floor (from floorTurn).
function surpriseTurn(L) {
  const s = L.surprise;
  if (!s || s.stage === 'over') return;
  if (s.stage !== 'waiting') return SURPRISES[s.kind].turn(L, s);
  if (G.turn < s.at) return;
  if (SURPRISES[s.kind].start(L, s)) return;
  // It couldn't happen just now (nowhere to close a drawer, say): try again a little later.
  s.at = G.turn + RULES.surprises.retry;
  if (++s.tries >= RULES.surprises.tries) s.stage = 'over';
}

// Anything noisy: a blow, a rhyme, a scroll read aloud, a potion smashing, bumping into a wall,
// the clock striking. It wakes everybody from Nap Time at once, everybody sung to sleep by a
// lullaby, and the Mold-Mites in your lap.
function makeNoise() {
  const L = G.level, s = L && L.surprise;
  if (!L) return;
  if (s && s.kind === 'nap' && s.stage === 'napping') SURPRISES.nap.wake(L, s);
  const lulled = L.monsters.filter(m => m.lulled > 0);
  for (const m of lulled) Object.assign(m, { lulled: 0, awake: true });
  if (lulled.length) msg(TEXT.lullaby.woken, C.red);
  wakeLap();
}

const isWater = t => t === T.WATER || t === T.DEEP;

// From (x, y), how many steps to every cell, through cells that pass `ok`.
function stepsFrom(L, x, y, ok) {
  const d = new Int16Array(MAP_W * MAP_H).fill(-1), q = [idx(x, y)];
  d[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], cx = c % MAP_W, cy = (c / MAP_W) | 0;
    for (const [dx, dy] of DIR4) {
      const nx = cx + dx, ny = cy + dy, n = idx(nx, ny);
      if (inMap(nx, ny) && d[n] < 0 && ok(L.tiles[n])) { d[n] = d[c] + 1; q.push(n); }
    }
  }
  return d;
}

// The bath's drain: the water cell with the most water around it. If you are in the water, it is
// in your own pool, wherever that is.
function pickDrain(L) {
  const p = G.player, here = idx(p.x, p.y);
  const pool = isWater(L.tiles[here]) ? stepsFrom(L, p.x, p.y, isWater) : null;
  const wetness = i => {
    let n = 0;
    const x = i % MAP_W, y = (i / MAP_W) | 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (inMap(x + dx, y + dy) && isWater(L.tiles[idx(x + dx, y + dy)])) n++;
    return n + (L.tiles[i] === T.DEEP ? 0.5 : 0);
  };
  let best = -1, bestWet = -1;
  for (let i = 0; i < L.tiles.length; i++) {
    if (!isWater(L.tiles[i]) || (pool && pool[i] < 0)) continue;
    const w = wetness(i);
    if (w > bestWet) { best = i; bestWet = w; }
  }
  return best < 0 ? null : { x: best % MAP_W, y: (best / MAP_W) | 0 };
}

const SURPRISES = {
  // Floor 3. A wall slides across one corridor and cuts the floor in two for a while. It
  // prefers a corridor between you and the stairs; failing that, any corridor that shuts off a
  // good part of the floor. Never right next to you, and never on anything.
  drawer: {
    start(L, s) {
      const p = G.player, R = RULES.surprises.drawer;
      const fromYou = stepsFrom(L, p.x, p.y, passable);
      const fromStairs = L.stairs ? stepsFrom(L, L.stairs.x, L.stairs.y, passable) : null;
      const reach = Array.from(fromYou).filter(v => v >= 0).length;
      const toStairs = L.stairs ? fromYou[idx(L.stairs.x, L.stairs.y)] : -1;
      const cands = [];
      for (let y = 1; y < MAP_H - 1; y++) for (let x = 1; x < MAP_W - 1; x++) {
        const i = idx(x, y), t = L.tiles[i];
        if (!passable(t) || t === T.STAIRS || fromYou[i] < R.minDist) continue;
        if (monsterAt(x, y) || L.items.some(it => it.x === x && it.y === y) || fixtureAt(L, x, y)) continue;
        const open = DIR4.map(([dx, dy]) => passable(L.tiles[idx(x + dx, y + dy)]));
        const straight = (open[0] && open[2] && !open[1] && !open[3]) || (open[1] && open[3] && !open[0] && !open[2]);
        if (!straight) continue; // a straight bit of corridor, one cell wide
        const onPath = toStairs > 0 && fromStairs && fromYou[i] + fromStairs[i] === toStairs;
        cands.push({ x, y, i, onPath, d: fromYou[i] });
      }
      cands.sort((a, b) => (b.onPath - a.onPath) || a.d - b.d);
      let pick = null;
      for (const c of cands.slice(0, 120)) {
        const was = L.tiles[c.i];
        L.tiles[c.i] = T.WALL;
        const after = stepsFrom(L, p.x, p.y, passable);
        L.tiles[c.i] = was;
        const lost = reach - 1 - Array.from(after).filter(v => v >= 0).length;
        const stairsCut = L.stairs && after[idx(L.stairs.x, L.stairs.y)] < 0;
        if ((c.onPath && stairsCut) || lost >= R.cutsOff) { pick = c; break; }
      }
      if (!pick) return false;
      Object.assign(s, { stage: 'closed', x: pick.x, y: pick.y, tile: L.tiles[pick.i], until: G.turn + R.turns });
      L.tiles[pick.i] = T.WALL;
      msg(TEXT.surprises.drawer.close, C.purple);
      Sound.play('thud', 1.2);
      FX.jolt(3, INK);
      return true;
    },
    turn(L, s) {
      if (G.turn < s.until) return;
      if (L.tiles[idx(s.x, s.y)] === T.WALL) L.tiles[idx(s.x, s.y)] = s.tile;
      s.stage = 'over';
      msg(TEXT.surprises.drawer.open, C.purple);
      Sound.play('thud', 0.6);
    },
  },

  // Floor 4. The water goes warm and lovely; then somebody pulls the plug, and for a few turns
  // the water drags you toward a drain, one step a turn. Get out of the water and it can't. At
  // the drain itself, it keeps one of your things.
  bath: {
    start(L, s) {
      const drain = pickDrain(L);
      if (!drain) return false;
      Object.assign(s, { stage: 'warm', until: G.turn + RULES.surprises.bath.warm, x: drain.x, y: drain.y, kept: false, told: false });
      msg(TEXT.surprises.bath.warm, C.purple);
      if (isWater(L.tiles[idx(G.player.x, G.player.y)])) addDread(RULES.surprises.bath.warmDread);
      Sound.play('splash', 0.8);
      return true;
    },
    turn(L, s) {
      const p = G.player, B = TEXT.surprises.bath;
      if (s.stage === 'warm') {
        if (G.turn < s.until) return;
        Object.assign(s, { stage: 'drain', until: G.turn + RULES.surprises.bath.drain }, pickDrain(L));
        msg(B.plug, C.purple);
        Sound.play('splash', 1.2);
        return;
      }
      if (G.turn >= s.until) {
        s.stage = 'over';
        msg(B.over, C.purple);
        return;
      }
      if (!isWater(L.tiles[idx(p.x, p.y)])) return; // out of the water: it can't reach you
      if (p.x === s.x && p.y === s.y) return this.keep(s);
      let d = stepsFrom(L, s.x, s.y, isWater), here = d[idx(p.x, p.y)];
      if (here < 0) { // a different pool from the drain's: the drain comes to yours
        Object.assign(s, pickDrain(L));
        d = stepsFrom(L, s.x, s.y, isWater);
        here = d[idx(p.x, p.y)];
      }
      if (here <= 0) return;
      for (const [dx, dy] of DIR4) {
        const nx = p.x + dx, ny = p.y + dy, n = idx(nx, ny);
        if (!inMap(nx, ny) || d[n] < 0 || d[n] >= here || monsterAt(nx, ny) || fixtureAt(L, nx, ny)) continue;
        p.x = nx;
        p.y = ny;
        if (L.tiles[n] === T.DEEP && p.wick > 0) p.wick = Math.max(1, p.wick - RULES.candle.deepWater);
        if (!s.told) { s.told = true; msg(B.pulled, C.blue); }
        Sound.play('splash', 0.3);
        if (p.x === s.x && p.y === s.y) this.keep(s);
        return;
      }
    },
    // At the drain: it keeps one of your things (once a bath).
    keep(s) {
      const p = G.player;
      if (s.kept || !p.inv.length) return;
      s.kept = true;
      const it = p.inv.splice(RNG.int(0, p.inv.length - 1), 1)[0];
      G.invSel = clamp(G.invSel, 0, Math.max(0, pocketRows(p).length - 1));
      msg(phrase('surprises.bath.drain', { item: itemName(it) }), C.purple);
      Sound.play('splash', 0.6);
    },
  },

  // Floor 5. A bell, and "Nap time!" Every horror on the floor (but the Tuck-You-In) lies down
  // and shuts its eyes. They don't see you and don't move. Any noise wakes all of them at once,
  // frantic; otherwise, when the nap is over, each goes back to how it was before (awake ones
  // get up, refreshed; sleeping ones sleep on).
  nap: {
    start(L, s) {
      const sleepers = L.monsters.filter(m => m.type !== 'tuck' && !m.disguised);
      if (!sleepers.length) return false;
      for (const m of sleepers) Object.assign(m, { napping: true, wasAwake: m.awake, awake: false, frenzy: 0 });
      Object.assign(s, { stage: 'napping', until: G.turn + RULES.surprises.nap.turns });
      msg(TEXT.surprises.nap.start, C.purple);
      Sound.play('bell', 0.8);
      return true;
    },
    turn(L, s) {
      const nappers = L.monsters.filter(m => m.napping);
      if (G.turn >= s.until || !nappers.length) {
        // A quiet end: each one goes back to how it was. Those asleep before nap time stay asleep.
        for (const m of nappers) { m.napping = false; m.awake = m.wasAwake !== false; delete m.wasAwake; }
        s.stage = 'over';
        if (nappers.length) msg(TEXT.surprises.nap.over, C.purple);
        return;
      }
      for (const m of nappers) if (L.visible[idx(m.x, m.y)] && RNG.chance(RULES.surprises.nap.zzz)) FX.word(m.x, m.y, 'zzz');
    },
    wake(L, s) {
      const nappers = L.monsters.filter(m => m.napping);
      for (const m of nappers) { Object.assign(m, { napping: false, awake: true, frenzy: RULES.surprises.nap.frenzy }); delete m.wasAwake; }
      s.stage = 'over';
      msg(TEXT.surprises.nap.woken, C.red);
      Sound.play('sting', 0.8);
      FX.jolt(4, C.red);
    },
  },
};
