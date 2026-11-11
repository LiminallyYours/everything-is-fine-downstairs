'use strict';
// Where the turn's news ribbon lands: many random spots on every floor, with horrors about.
// Prints the closest it ever came to you (in cells; the design says 3), how often it was closer,
// which side it went, and how many visible horrors it covered. Fails if it ever lands on you.
//
//   node shots/caption.js

const { game } = require('./shots');

const { run, tick, toPlay } = game(9);
tick(100);
toPlay();
const res = JSON.parse(run(`(() => {
  const out = { trials: 0, minGap: 99, closeCalls: 0, sides: {}, coveredMonsters: 0 };
  for (let d = 1; d <= 6; d++) {
    for (let k = 0; k < 40; k++) {
      enterFloor(d); toPlay();
      const L = G.level, p = G.player;
      const spot = freeTile(L, 0); if (!spot) continue;
      p.x = spot[0]; p.y = spot[1];
      L.monsters = [];
      for (let i = 0; i < 4; i++) { const s = freeTile(L, 0); if (s && Math.abs(s[0] - p.x) + Math.abs(s[1] - p.y) < 9) { const m = spawnMonster(L, 'opinion', s[0], s[1]); m.awake = true; } }
      computeFOV(L, p.x, p.y, lightRadius());
      updateCamera(true);
      G.logMark = G.log.length; msg('You whack the Second Opinion with a thwack! (5)'); msg('The Second Opinion gnaws you! (-3)');
      FX.now += 50; draw();
      const S = View.S, b = captionBox; if (!b) continue;
      out.trials++;
      const pcx = sx(p.x) + S / 2, pcy = sy(p.y) + S / 2;
      const dx = Math.max(b.x - pcx, 0, pcx - (b.x + b.w)), dy = Math.max(b.y - pcy, 0, pcy - (b.y + b.h - 12));
      const gap = Math.hypot(dx, dy) / S;
      out.minGap = Math.min(out.minGap, +gap.toFixed(2));
      if (gap < 2.99) out.closeCalls++;
      const side = b.y + b.h < pcy ? 'above' : b.y > pcy ? 'below' : b.x > pcx ? 'right' : 'left';
      out.sides[side] = (out.sides[side] || 0) + 1;
      out.coveredMonsters += L.monsters.filter(m => L.visible[idx(m.x, m.y)] && sx(m.x) + S > b.x && sx(m.x) < b.x + b.w && sy(m.y) + S > b.y && sy(m.y) - S < b.y + b.h).length;
    }
  }
  return JSON.stringify(out);
})()`));
console.log(JSON.stringify(res));
const ok = res.trials > 100 && res.minGap > 0.5;
console.log(`caption: ${ok ? 'PASS' : 'FAIL'} (${res.trials} placements, closest ${res.minGap} cells, ${res.closeCalls} closer than 3)`);
process.exit(ok ? 0 : 1);
