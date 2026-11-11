'use strict';
// A bot plays randomized full games (fixed seeds), checking after every step that nothing is in a
// wall, on top of you, dead-but-still-there, or not a number. Even games refill your health and
// take the stairs now and then, so they reach the deep floors and the boss.
//
//   node suites/smoke.js           the full run: 14 games of up to 3000 steps
//   node suites/smoke.js --quick   3 games of up to 1000 steps (what npm test runs)

const { createGame, checker } = require('./lib');
const { playGame, afterGame } = require('../bot');

const quick = process.argv.includes('--quick');
const games = quick ? 3 : 14, maxSteps = quick ? 1000 : 3000;
const { check, finish } = checker(`smoke${quick ? ' (quick)' : ''}`);
const H = createGame({ seed: 505 });
const totals = { deaths: 0, wins: 0, maxDepth: 0, killers: {}, cards: new Set(), modes: new Set(), rooms: 0, rhymes: 0, finales: 0, stalkers: 0, barrels: 0, phantoms: 0, socks: 0 };
let crashed = null;
for (let run = 0; run < games && !crashed; run++) {
  try {
    // Stuck: hundreds of steps go by and not one turn passes.
    let mark = { step: 0, turn: -1 };
    const onStep = step => {
      if (step - mark.step < 400) return;
      if (H.G.turn === mark.turn) throw new Error(`stuck: no turn passed in 400 steps (mode ${H.G.mode}, turn ${H.G.turn})`);
      mark = { step, turn: H.G.turn };
    };
    const s = playGame(H, { botSeed: 1000 + run, god: run % 2 === 0, maxSteps, onStep });
    totals.maxDepth = Math.max(totals.maxDepth, s.maxDepth);
    if (s.end === 'dead') { totals.deaths++; totals.killers[s.killer] = (totals.killers[s.killer] || 0) + 1; }
    if (s.end === 'win') totals.wins++;
    for (const k of ['rooms', 'rhymes', 'finales', 'stalkers', 'barrels', 'phantoms', 'socks']) totals[k] += s[k];
    s.cards.forEach(c => totals.cards.add(c));
    s.modes.forEach(m => totals.modes.add(m));
    console.log(`game ${run + 1}: ${s.end} on floor ${s.maxDepth} after ${s.steps} steps${s.killer ? ' (' + s.killer + ')' : ''}`);
    afterGame(H);
  } catch (e) {
    crashed = { run: run + 1, error: e.stack };
  }
}
const graves = JSON.parse(H.store['rot.graveyard'] || '[]');
check('no crashes, and the map stayed sane every step', !crashed, crashed);
check('no game got stuck (a turn passed at least every 400 steps)', !crashed || !/stuck/.test(crashed.error), crashed && crashed.error.split('\n')[0]);
check('deaths are written in the graveyard', graves.filter(g => !g.won).length === totals.deaths, { graves: graves.length, deaths: totals.deaths });
check('the god-mode games got deep', totals.maxDepth >= (quick ? 3 : 5), totals.maxDepth);
check('rooms, rhyme duels and bestiary pages all came up', totals.rooms > 0 && totals.rhymes > 0 && totals.cards.size > 3, { rooms: totals.rooms, rhymes: totals.rhymes, cards: [...totals.cards] });
check('no console errors', !H.consoleLog.some(l => /^(warn|error)/.test(l)), H.consoleLog.filter(l => /^(warn|error)/.test(l)).slice(0, 5));
console.log(JSON.stringify(Object.assign({}, totals, { cards: [...totals.cards], modes: [...totals.modes] })));
finish();
