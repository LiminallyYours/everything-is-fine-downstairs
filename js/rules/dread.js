'use strict';
// Dread (0-100): how frightened you are. It changes what you see and hear, and whether
// the narrator can still finish a rhyme. Darkness, wounds and horrors raise it; light,
// food, good poetry and hiding lower it.

const DREAD_TIERS = [
  { min: RULES.dread.tiers.calm, name: 'calm', color: C.green },
  { min: RULES.dread.tiers.uneasy, name: 'uneasy', color: C.yellow },
  { min: RULES.dread.tiers.afraid, name: 'afraid', color: C.orange },
  { min: RULES.dread.tiers.undone, name: 'undone', color: C.red },
];
const BROKEN_ENDINGS = ['...', '... um.', 'orange.', '(the rhyme does not come)', 'help.', '—', 'mmm-mmm.', 'hmm?'];

// Dread as a share of the whole scale: 0 calm ... 1 undone (for the drawing and the music).
function dreadFrac(p = G.player) {
  return p.dread / RULES.dread.max;
}

function dreadTier() {
  const d = G.player ? G.player.dread : 0;
  let tier = 0;
  DREAD_TIERS.forEach((t, i) => { if (d >= t.min) tier = i; });
  return tier;
}

// With your candle out, or at the highest fear stage, the horrors get bolder (monstersAct).
function horrorsBold() {
  const p = G.player;
  return !!p && (p.wick <= 0 || dreadTier() >= RULES.bold.fromTier);
}

// At the highest fear stage your hands shake: blows miss more and getting away fails more.
function clumsy() {
  return !!G.player && dreadTier() >= RULES.clumsy.fromTier;
}

function addDread(n) {
  const p = G.player;
  const before = dreadTier();
  p.dread = clamp(p.dread + n, 0, RULES.dread.max);
  // No announcement: you read your fear off the picture (wobble, lean, scratchy ink, the dark creeping in).
  if (dreadTier() > before && dreadTier() === 3) Sound.play('whisper', 1);
}

// When you're frightened, the last word of a rhyme sometimes just... doesn't arrive.
function breakRhyme(text) {
  const tier = dreadTier(), R = RULES.dread.brokenRhyme;
  if (tier < R.fromTier || !RNG.chance(tier === R.fromTier ? R.afraid : R.undone)) return text;
  const m = text.match(/^(.*\s)(\S+)$/);
  return m ? m[1] + RNG.pick(BROKEN_ENDINGS) : text;
}

// Swap some letters for noise (used on old log lines when you're undone).
function glitch(text, seed) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const h = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    out += (h - Math.floor(h)) < 0.07 && text[i] !== ' ' ? '▒' : text[i];
  }
  return out;
}

function tickDread(L) {
  const p = G.player, D = RULES.dread, R = D.perTurn;
  const r = lightRadius();
  const threatened = L.monsters.some(m => m.awake && !m.disguised && L.visible[idx(m.x, m.y)]);
  if (inDarkness(r)) addDread(R.dark);
  else if (!threatened && !L.stalker) addDread(R.calm);
  if (p.hp < p.maxHp * R.woundedBelow) addDread(R.wounded);
  if (L.stalker) addDread(R.bedtime);
  if (p.hidden) addDread(R.hidden);
  if (p.gear.feet) addDread(R.warmFeet); // warm feet: the one comfort down here
  const tier = dreadTier();

  // Hallucinations: things at the edge of your light that aren't there.
  const ph0 = D.phantoms;
  if (tier >= ph0.fromTier && L.phantoms.length < ph0.most && RNG.chance(ph0.perTier * tier)) spawnPhantom(L);
  for (const ph of L.phantoms) {
    ph.ttl--;
    if (ph.kind === 'monster' && RNG.chance(ph0.chase)) {
      const dx = Math.sign(p.x - ph.x), dy = Math.sign(p.y - ph.y);
      const [sx, sy] = RNG.chance(0.5) ? [dx, 0] : [0, dy];
      if (inMap(ph.x + sx, ph.y + sy) && passable(L.tiles[idx(ph.x + sx, ph.y + sy)])) { ph.x += sx; ph.y += sy; }
    }
    if (manhattan(ph, p) <= 1) {
      ph.ttl = 0;
      msg(ph.kind === 'monster' ? `${cap(theD(MONSTERS[ph.type]))} was never there. You are fairly sure.`
        : `The ${ph.name} crumbles into nothing when you look at it properly.`, C.dim);
      addDread(D.phantomTouch);
    }
  }
  L.phantoms = L.phantoms.filter(ph => ph.ttl > 0);

  // Whispers from nowhere in particular.
  if (tier >= D.whispers.fromTier && RNG.chance(D.whispers.perTier * tier)) {
    const side = RNG.chance(0.5) ? -1 : 1;
    Sound.play('whisper', 0.5 + tier * 0.25, side * 0.8);
    FX.word(p.x + side * RNG.int(3, 7), p.y + RNG.int(-3, 3), RNG.pick(['psst…', 'whisper whisper', 'somebody…']));
    if (RNG.chance(D.whispers.logged)) msg('"' + RNG.pick(WHISPERS) + '"', C.dim);
  }
  // On the Top of Somebody's Head, the hair rustles when nothing is there.
  if (L.depth === 2 && tier >= D.fakeRustle.fromTier && RNG.chance(D.fakeRustle.perTier * tier)) fakeRustle(L);
}

function spawnPhantom(L) {
  const p = G.player, r = lightRadius();
  const cells = [];
  for (let y = p.y - r; y <= p.y + r; y++) {
    for (let x = p.x - r; x <= p.x + r; x++) {
      if (!inMap(x, y) || !L.visible[idx(x, y)] || !passable(L.tiles[idx(x, y)])) continue;
      if (manhattan({ x, y }, p) >= Math.max(3, r - 1) && !monsterAt(x, y)) cells.push([x, y]);
    }
  }
  if (!cells.length) return;
  const [x, y] = RNG.pick(cells);
  const R = RULES.dread.phantoms;
  if (RNG.chance(R.monster)) {
    const type = RNG.pick(['opinion', 'zombie', 'giraffe', 'mimic', 'wraith', 'tot']);
    const d = MONSTERS[type];
    L.phantoms.push({ x, y, kind: 'monster', type, ch: d.ch, color: d.color, name: d.name, ttl: RNG.int(...R.monsterTurns) });
  } else {
    const kind = RNG.pick(['potion', 'scroll', 'weapon', 'gold']);
    const names = { potion: 'shimmering potion', scroll: 'glowing scroll', weapon: 'magnificent sword', gold: 'pile of coins' };
    const color = kind === 'potion' ? RNG.pick(POTION_LOOKS)[1] : ITEM_COLOR[kind];
    L.phantoms.push({ x, y, kind: 'item', ch: ITEM_GLYPH[kind], color, name: names[kind], ttl: RNG.int(...R.itemTurns) });
  }
}

function fakeRustle(L) {
  const p = G.player;
  for (let i = 0; i < 30; i++) {
    const x = p.x + RNG.int(-12, 12), y = p.y + RNG.int(-8, 8);
    if (inMap(x, y) && L.tiles[idx(x, y)] === T.GRASS && !L.visible[idx(x, y)]) {
      FX.rustle(x, y);
      FX.word(x, y, 'rustle');
      Sound.play('rustle', 0.6, clamp((x - p.x) / 12, -1, 1));
      return;
    }
  }
}

// --- How eerie the page looks (drawing only) -------------------------------------------------

// 0..1: at least as frightened as you are, at least as frightened as the floor, and lifted
// toward the worst by an eerie moment while one is on. Nothing in play reads this.
function lookFrac(p = G.player) {
  const R = RULES.look, real = p ? dreadFrac(p) : 0;
  const floor = G.level ? R.floor[clamp(G.level.depth, 1, R.floor.length) - 1] : 0;
  const base = Math.max(real, floor);
  return base + (1 - base) * eerieLift();
}

// How far an eerie moment is lifting the page right now (0 none, 1 all the way).
function eerieLift() {
  const M = RULES.look.moment, t0 = G.eerieAt;
  if (t0 == null) return 0;
  const age = FX.now - t0;
  let k = 0;
  if (age < 0) k = 0;
  else if (age < M.riseMs) k = age / M.riseMs;
  else if (age < M.riseMs + M.holdMs) k = 1;
  else if (age < M.riseMs + M.holdMs + M.fadeMs) { const f = (age - M.riseMs - M.holdMs) / M.fadeMs; k = 1 - f * f * (3 - 2 * f); }
  return k * (FX.reduced ? M.reduced : 1);
}

// Once a turn: maybe an eerie moment. It is decided from the run, the floor and the turn, not
// from the game's dice, so it never changes anything that happens in play.
function eerieTurn(L) {
  const M = RULES.look.moment;
  if (L.eerieTurn != null && G.turn - L.eerieTurn < M.gap) return;
  if (hash(G.runNo * 7919 + L.depth * 104729 + G.turn * 1.618) >= M.chance) return;
  L.eerieTurn = G.turn;
  G.eerieAt = FX.now;
}

// Called every animation frame: things in the dark that belong to nothing (more of them the more
// frightened you are): a smile with no face, a toy that wasn't there, a ripple in the ink. Eyes
// in the dark are only ever real: an awake horror you can't see (drawn in render.js).
function dreadFrame(dt) {
  if (G.mode !== 'play' || !G.level) return;
  const L = G.level, p = G.player, r = lightRadius();
  const chance = dt * RULES.dread.eyes.perMs * (RULES.dread.eyes.plus + p.dread);
  if (!RNG.chance(chance)) return;
  for (let i = 0; i < 20; i++) {
    const x = p.x + RNG.int(-(r + 8), r + 8), y = p.y + RNG.int(-(r + 6), r + 6);
    if (!inMap(x, y) || L.visible[idx(x, y)] || L.tiles[idx(x, y)] === T.WALL) continue;
    FX.haunt(x, y, RNG.pick(['smile', 'toy', 'ripple']), RNG.int(900, 2600));
    return;
  }
}
