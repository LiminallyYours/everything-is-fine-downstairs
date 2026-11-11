'use strict';
// A bot that plays whole games through the keyboard, for the smoke runs and the golden transcript.
// Its own choices come from its own seeded random numbers (never the game's), so a run depends
// only on the game seed, the bot seed and the game itself.

const { makeRandom } = require('./harness');

const WALK = [['ArrowUp', 0, -1], ['ArrowDown', 0, 1], ['ArrowLeft', -1, 0], ['ArrowRight', 1, 0]];
const SMOKE_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  ' ', 'r', '1', '2', '3', '0', 'i', 'Escape', 'l', '?', '>', 'Enter', 'x', 'm', 'f', 'v', 'g', 'g', 'a', 'u', 'e', 't'];
// The golden bot leaves sound, voice and effects on (M, V and F are covered by the screens scenario).
const GOLDEN_KEYS = SMOKE_KEYS.filter(k => !['m', 'f', 'v'].includes(k));

function newGameToPlay(H, pageMs) {
  const G = H.G;
  H.run('goTitle()');
  H.press('Enter');
  for (let guard = 0; G.mode !== 'play' && guard < 80; guard++) { H.tick(pageMs); H.press('Enter'); }
  if (G.mode !== 'play') throw new Error('never reached play, stuck in ' + G.mode);
}

// The map must stay sane after every step.
function checkInvariants(H) {
  const G = H.G, p = G.player, L = G.level, W = H.get('MAP_W');
  const passable = t => t !== 0 && t !== 6;
  for (const m of L.monsters) {
    if (m.hp <= 0 && !m.d.invulnerable) throw new Error('dead monster left on the map: ' + m.type);
    if (m.d.ai !== 'ghost' && !passable(L.tiles[m.y * W + m.x])) throw new Error('monster in a wall: ' + m.type);
    if (m.x === p.x && m.y === p.y) throw new Error('monster standing on the player: ' + m.type);
  }
  if (!passable(L.tiles[p.y * W + p.x]) && !(p.hidden && L.tiles[p.y * W + p.x] === 6)) throw new Error('player in a wall');
  if (!Number.isFinite(p.hp) || !Number.isFinite(p.dread) || !Number.isFinite(p.wick)) throw new Error('player stat is not a number');
}

/**
 * Play one game from the title to death, victory, or maxSteps.
 * opts: botSeed, god (refill health every step and take the stairs now and then), maxSteps,
 *       pageMs (how long to let each verse page play before pressing Enter), keys, onStep(step),
 *       rooms (false: never detour to an odd room it has seen)
 */
function playGame(H, opts = {}) {
  const G = H.G;
  const rand = makeRandom(opts.botSeed === undefined ? 1 : opts.botSeed);
  const pick = list => list[Math.floor(rand() * list.length)];
  const keys = opts.keys || SMOKE_KEYS;
  const pageMs = opts.pageMs || 40;
  const maxSteps = opts.maxSteps || 3000;
  const distanceMap = H.get('distanceMap'), W = H.get('MAP_W');
  const stats = { steps: 0, maxDepth: 1, encounters: 0, gear: 0, rooms: 0, rhymes: 0, finales: 0, cards: new Set(), modes: new Set(), stalkers: 0, barrels: 0, phantoms: 0, socks: 0, maxDread: 0 };
  newGameToPlay(H, pageMs);
  const god = !!opts.god;
  for (let step = 0; step < maxSteps && G.mode !== 'dead' && G.mode !== 'win'; step++) {
    stats.steps++;
    if (opts.onStep) opts.onStep(step);
    stats.modes.add(G.mode);
    stats.maxDepth = Math.max(stats.maxDepth, G.depth);
    if (G.mode === 'encounter') { stats.encounters++; H.press(rand() < 0.7 ? 'a' : pick(['r', 'u', 'Escape'])); H.tick(34); continue; }
    if (G.mode === 'gear') { stats.gear++; H.press(pick(['1', 't', 'Enter', 'ArrowDown', 'Escape'])); H.tick(34); continue; }
    if (G.mode === 'choice') { if (!G.page.result) stats.rooms++; H.tick(pageMs); H.press(pick(['Enter', '1', '2', '3'])); H.tick(60); continue; }
    if (G.mode === 'rhyme' && G.rhyme && G.rhyme.final) stats.finales++;
    if (['floorcard', 'story', 'card'].includes(G.mode)) { if (G.mode === 'card') stats.cards.add(G.card.type); H.tick(pageMs); H.press('Enter'); continue; }
    if (G.mode === 'rhyme') { stats.rhymes++; if (rand() < 0.2) H.tick(8000); else { H.tick(pageMs); H.press(WALK[step % 4][0]); } continue; }
    if (G.mode !== 'play') { H.press('Escape'); if (G.mode !== 'play') H.press('Escape'); H.tick(34); continue; }
    const p = G.player, L = G.level;
    if (god) p.hp = p.maxHp;
    checkInvariants(H);
    stats.maxDread = Math.max(stats.maxDread, p.dread);
    if (L.stalker) stats.stalkers++;
    if (p.hidden) stats.barrels++;
    stats.phantoms += L.phantoms.length;
    if (p.inv.some(i => i.kind === 'sock' || i.kind === 'pair')) stats.socks++;
    if (god && step % 450 === 449 && L.stairs) { p.x = L.stairs.x; p.y = L.stairs.y; p.hidden = false; H.press('>'); H.tick(34); continue; }
    if (rand() < 0.65) {
      // Mostly the stairs, but an odd room it has seen and not used yet is worth a detour, so
      // rooms come up in a short game and not only by luck.
      // (opts.rooms === false turns this off: measure.js does, to match its earlier numbers.)
      const room = opts.rooms === false ? null : L.fixtures.find(f => f.seen && !f.used);
      const goal = (room && rand() < 0.5 && room) || L.stairs || (L.monsters.find(m => m.type === 'nibbler') || p);
      const dist = distanceMap(L, goal.x, goal.y);
      let best = null, bd = dist[p.y * W + p.x];
      for (const [k, dx, dy] of WALK) {
        const d = dist[(p.y + dy) * W + p.x + dx];
        if (d < bd) { bd = d; best = k; }
      }
      if (best) { H.press(best); H.tick(34); continue; }
      if (L.stairs && p.x === L.stairs.x && p.y === L.stairs.y) { H.press('>'); H.tick(34); continue; }
    }
    H.press(pick(keys), rand() < 0.1);
    if (opts.tickEveryKey || step % 7 === 0) H.tick(34);
  }
  stats.maxDepth = Math.max(stats.maxDepth, G.depth);
  stats.end = G.mode;
  stats.killer = G.killer;
  stats.cards = [...stats.cards];
  stats.modes = [...stats.modes];
  return stats;
}

// After a game: look at the stone, the graveyard and the bestiary, and get back to the title.
function afterGame(H, pageMs = 3000) {
  const G = H.G;
  if (G.mode === 'dead') { H.tick(pageMs); H.press('g'); H.tick(100); H.press('ArrowDown'); H.tick(100); H.press('Escape'); H.tick(100); H.press('t'); H.tick(100); }
  if (G.mode === 'win') { H.tick(20000); H.press('Enter'); H.tick(100); }
  H.press('b'); H.tick(100); H.press('ArrowRight'); H.tick(100); H.press('Escape'); H.tick(100);
}

module.exports = { playGame, afterGame, newGameToPlay, checkInvariants, SMOKE_KEYS, GOLDEN_KEYS };
