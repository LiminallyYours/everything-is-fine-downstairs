'use strict';
// Where the frame time goes: wraps the main drawing functions and prints real ms per frame for
// each (floor 3, whole map revealed, real canvas). Nested calls are counted in both.
//
//   node shots/prof.js

const { game } = require('./shots');

const { H, run, tick, toPlay } = game(7);
tick(100);
toPlay();
run('enterFloor(3); toPlay(); revealMap(G.level); computeFOV(G.level, G.player.x, G.player.y, lightRadius());');
// The game's performance.now() is the harness's fake clock, so give it a real one to time with.
H.sandbox.__realNow = () => Number(process.hrtime.bigint()) / 1e6;
run(`globalThis.__prof = {};
  for (const name of ['draw', 'drawFlood', 'drawThings', 'drawTerrain', 'drawMargin', 'drawLog', 'drawDarkThings', 'drawBubbles', 'stroke', 'vnoise']) {
    const f = globalThis[name]; if (typeof f !== 'function') continue;
    globalThis[name] = function (...a) { const t = __realNow(); const r = f.apply(this, a); __prof[name] = (__prof[name] || 0) + __realNow() - t; return r; };
  }`);
const frames = 40;
tick(34 * frames);
const prof = H.run('JSON.stringify(__prof)');
for (const [k, v] of Object.entries(JSON.parse(prof)).sort((a, b) => b[1] - a[1])) console.log(k.padEnd(14), (v / frames).toFixed(2), 'ms/frame');
