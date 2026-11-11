'use strict';
// Frame time with a real (CPU-rendered) canvas: floor 3, the whole map revealed, calm and then
// frightened. The plan's budget: stay within 10% of the step-2 numbers (about 9-11 ms).
//
//   node shots/perf.js [frames]   (default 60 frames per measurement)

const { game } = require('./shots');

const frames = Number(process.argv[2]) || 60;
const { G, run, tick, toPlay } = game(7);
tick(100);
toPlay();
run('enterFloor(3); toPlay(); revealMap(G.level); computeFOV(G.level, G.player.x, G.player.y, lightRadius());');
const results = [];
for (const d of [0, 90]) {
  run(`G.player.dread = ${d};`);
  tick(200);
  const t0 = process.hrtime.bigint();
  tick(34 * frames);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / frames;
  results.push(ms);
  console.log(`dread ${d}: ${ms.toFixed(1)} ms per frame (JS + CPU-rendered canvas, ${frames} frames)`);
}
if (G.mode !== 'play') { console.log('perf: the game left play mode unexpectedly: ' + G.mode); process.exit(1); }
console.log(`perf: ${results.map(r => r.toFixed(1)).join(' / ')} ms per frame (calm / frightened)`);
