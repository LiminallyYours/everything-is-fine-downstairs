'use strict';
// How dangerous is the game? Bot games that measure it, so a change to the rules can be compared
// before and after. Not part of `npm test`: it judges balance, it doesn't pass or fail.
//
// Part A: 40 whole games by the test bot, with no health refills. Where it dies, and how much
//         health it loses per 100 steps in light and calm, in the dark, and at the highest fear.
// Part B: "crossings". A simple bot walks one floor to the stairs with 60 health, 8 times per
//         floor (floors 2 to 5): once kept in light and calm, once kept with no candle and at the
//         highest fear. How many die, and how many reach the stairs.
// Everything is seeded, so the same code gives the same numbers. The numbers in PLAN.md (item 11,
// the dark-and-fear entry) came from this script, at commit 64b80f3 (before) and afa0d16 (after).
//
//   node measure.js                      everything, about 7 minutes on a slow machine
//   node measure.js --part A --games 10 --games-from 0 --save a1.json
//   node measure.js --part B --floors 2,3 --save b1.json
//   node measure.js --merge a1.json a2.json b1.json b2.json      one summary from saved pieces
//   node measure.js --project /some/other/copy/tests             measure another copy of the game
//
// Run it in pieces (--part, --games, --games-from, --floors, --save, then --merge) when commands
// are cut off after a few minutes. The pieces must be the same sizes each time to compare.
//
// To measure the game as it was at an earlier commit, unpack that commit somewhere outside this
// folder and point --project at its tests folder (nothing needs installing there):
//   mkdir /tmp/before && git archive 64b80f3 | tar -x -C /tmp/before
//   node measure.js --project /tmp/before/tests
//
// The bot never detours to odd rooms here (the smoke run's bot does), so the numbers stay
// comparable with ones taken before it learned to.
const fs = require('fs'), path = require('path');

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i < 0 ? dflt : args[i + 1]; };
const merge = args.indexOf('--merge');

let out;
if (merge >= 0) {
  out = { games: [], cross: [] };
  for (const f of args.slice(merge + 1)) {
    const piece = JSON.parse(fs.readFileSync(f, 'utf8'));
    out.games.push(...piece.games);
    out.cross.push(...piece.cross);
  }
} else {
  const T = path.resolve(opt('project', __dirname));
  const part = (opt('part', 'AB') + '').toUpperCase();
  const GAMES = +opt('games', 40), FROM = +opt('games-from', 0), CROSS = +opt('cross', 8);
  const FLOORS = (opt('floors', '2,3,4,5') + '').split(',').map(Number);
  const { createGame, makeRandom } = require(path.join(T, 'harness'));
  const { playGame } = require(path.join(T, 'bot'));
  out = { games: [], cross: [] };

  // ---- Part A: whole games, no refills ------------------------------------------------
  if (part.includes('A')) {
    for (let g = FROM; g < FROM + GAMES; g++) {
      const H = createGame({ seed: 7000 + g, echoConsole: false });
      // Count health lost by where you were when it happened.
      H.run(`globalThis.__hurt = { dark: 0, fear: 0, calm: 0 };
        const __orig = hurtPlayer;
        hurtPlayer = function (n, by) {
          const p = G.player, before = p.hp;
          __orig(n, by);
          const k = p.wick <= 0 || inDarkness() ? 'dark' : dreadTier() >= 3 ? 'fear' : 'calm';
          __hurt[k] += before - p.hp;
        };`);
      const turns = { dark: 0, fear: 0, calm: 0 };
      const s = playGame(H, { botSeed: 100 + g, god: false, maxSteps: 3000, rooms: false, onStep: () => {
        if (H.G.mode !== 'play' || !H.G.level) return;
        turns[H.run('G.player.wick <= 0 || inDarkness() ? "dark" : dreadTier() >= 3 ? "fear" : "calm"')]++;
      } });
      out.games.push({ seed: 7000 + g, end: s.end, depth: s.maxDepth, steps: s.steps, killer: s.killer, hurt: H.run('__hurt'), turns, turn: H.G.turn });
    }
  }

  // ---- Part B: crossings --------------------------------------------------------------
  const WALK = [['ArrowUp', 0, -1], ['ArrowDown', 0, 1], ['ArrowLeft', -1, 0], ['ArrowRight', 1, 0]];
  const crossing = (seed, depth, scary) => {
    const H = createGame({ seed, echoConsole: false }), G = H.G;
    H.run('goTitle()');
    H.press('Enter');
    for (let i = 0; i < 80 && G.mode !== 'play'; i++) { H.press('Enter'); H.tick(40); }
    H.run(`enterFloor(${depth}); toPlay(); Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; }); G.cardQueue = [];
      const p = G.player; p.hp = p.maxHp = 60; p.baseAtk = 3 + ${depth}; p.level = ${depth};`);
    const rand = makeRandom(seed * 3 + depth);
    const distanceMap = H.get('distanceMap'), W = H.get('MAP_W');
    let lost = 0, turns = 0, reached = false, guard = 0;
    while (guard++ < 3000 && turns < 400) {
      if (G.mode === 'dead') break;
      if (G.mode === 'encounter') { H.press('a'); H.tick(34); continue; } // fight it
      if (G.mode !== 'play') { H.tick(200); H.press('Enter'); H.press('Escape'); H.tick(34); continue; }
      const p = G.player, L = G.level;
      if (scary) H.run('G.player.wick = 0; G.player.dread = Math.max(G.player.dread, 90);');
      else H.run('G.player.wick = 400; G.player.dread = 0;');
      if (L.stairs && p.x === L.stairs.x && p.y === L.stairs.y) { reached = true; break; }
      const dist = distanceMap(L, L.stairs.x, L.stairs.y);
      let best = null, bd = dist[p.y * W + p.x];
      for (const [k, dx, dy] of WALK) { const d = dist[(p.y + dy) * W + p.x + dx]; if (d < bd) { bd = d; best = k; } }
      const hp0 = p.hp, t0 = G.turn;
      H.press(best && rand() < 0.9 ? best : WALK[Math.floor(rand() * 4)][0]); // mostly straight there
      H.tick(34);
      lost += Math.max(0, hp0 - G.player.hp); // (health lost while fighting isn't counted here)
      turns += G.turn - t0;
    }
    return { seed, depth, scary, lost, turns, reached, died: G.mode === 'dead' };
  };
  if (part.includes('B')) {
    for (const d of FLOORS) for (let s = 1; s <= CROSS; s++) for (const scary of [false, true]) out.cross.push(crossing(9000 + s * 17, d, scary));
  }
  const save = opt('save', null);
  if (save) fs.writeFileSync(save, JSON.stringify(out));
}

// ---- Summary --------------------------------------------------------------------------
const sum = (a, f) => a.reduce((x, y) => x + f(y), 0);
const games = out.games, deaths = games.filter(g => g.end === 'dead'), wins = games.filter(g => g.end === 'win');
if (games.length) {
  const byFloor = {}, killers = {};
  for (const g of deaths) { byFloor[g.depth] = (byFloor[g.depth] || 0) + 1; killers[g.killer] = (killers[g.killer] || 0) + 1; }
  const rate = k => { const h = sum(games, g => g.hurt[k]), t = sum(games, g => g.turns[k]); return t ? `${(100 * h / t).toFixed(1)} per 100 steps (${t} steps)` : '-'; };
  console.log(`A. ${games.length} bot games (no refills): ${deaths.length} died, ${wins.length} won, ${games.length - deaths.length - wins.length} ran out of steps`);
  console.log('   deaths by floor:', JSON.stringify(byFloor), ' average deepest floor:', (sum(games, g => g.depth) / games.length).toFixed(2));
  console.log('   health lost in light & calm:', rate('calm'), '| in the dark:', rate('dark'), '| at highest fear:', rate('fear'));
  console.log('   killers:', JSON.stringify(killers));
}
for (const d of [...new Set(out.cross.map(x => x.depth))].sort()) {
  const line = s => {
    const a = out.cross.filter(x => x.depth === d && x.scary === s);
    return `lost ${(sum(a, x => x.lost) / a.length).toFixed(1)} hp avg, ${a.filter(x => x.died).length}/${a.length} died, ${a.filter(x => x.reached).length} reached the stairs, ${(sum(a, x => x.turns) / a.length).toFixed(0)} turns`;
  };
  console.log(`B. floor ${d} crossing (60 hp): light & calm: ${line(false)}  ||  dark & highest fear: ${line(true)}`);
}
