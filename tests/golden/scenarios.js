'use strict';
// The golden scenarios. Each runs in its own fresh game (own seed), and everything it shows is
// written down by the recorder. Most of it is played through the keyboard; where a situation is
// hard to reach by hand, a little setup code arranges it (marked with "#" lines in the record).
//
// A few texts are chosen at random by the game (couplets, epitaphs, tips, speech...). To show every
// one of them, `arm(table, i)` makes the game's next random pick from that exact table return
// entry i. It still uses up one random number, exactly like a normal pick, so nothing else moves.
// If a later refactor moves one of these tables, update the expression here; the baseline itself
// must not change.

const { playGame, afterGame, GOLDEN_KEYS } = require('../bot');

const PAGE_MODES = ['story', 'floorcard', 'card', 'win', 'choice', 'rhyme', 'dead'];
const ARROWS = { '0,-1': 'ArrowUp', '1,0': 'ArrowRight', '0,1': 'ArrowDown', '-1,0': 'ArrowLeft' };

// Everything a scenario gets.
function makeCtx(H, rec) {
  const G = H.G;
  const ctx = {
    H, G, rec,
    tick: ms => H.tick(ms),
    key(k, ms = 34) { H.press(k); if (ms) H.tick(ms); },
    keys(list, ms = 34) { for (const k of list) ctx.key(k, ms); },
    note: t => rec.note(t),
    setup: (label, code) => rec.run(label, code),
    val: code => H.run(code),
    force: (...v) => H.forceRandom(...v),
    god() { G.player.hp = G.player.maxHp; },
    // Let a verse page play out on its own, then press Enter (repeat while pages keep coming).
    readPages(maxPages = 6) {
      for (let n = 0; n < maxPages && ['story', 'floorcard', 'card', 'win'].includes(G.mode); n++) {
        for (let t = 0; t < 120 && !H.run('pageDone(G.page)'); t++) H.tick(500);
        H.tick(300);
        ctx.key('Enter', 100);
      }
    },
    // Hurry a page along with Enter (lines come sooner), the way an impatient player would.
    skipPages(max = 40) {
      for (let n = 0; n < max && ['story', 'floorcard', 'card', 'win'].includes(G.mode); n++) ctx.key('Enter', 68);
    },
    // From any screen, through the title and the story, to the map of floor 1.
    newGame({ natural = false } = {}) {
      if (G.mode === 'splash') ctx.key('x', 300);
      if (G.mode !== 'title') ctx.setup('back to the title', 'goTitle()');
      ctx.key('Enter', 300);
      if (natural) ctx.readPages(); else ctx.skipPages();
      if (G.mode !== 'play') throw new Error('newGame: stuck in ' + G.mode);
    },
    // Jump to a floor (as if arriving by the stairs) and read its card. The floor's surprise is
    // called off, so it can't go off in the middle of something else (the 'surprises' scenario
    // has them on purpose).
    floor(depth, { natural = false, surprise = false } = {}) {
      ctx.setup(`go to floor ${depth}`, `enterFloor(${depth})${surprise ? '' : '; G.level.surprise = null'}`);
      if (natural) ctx.readPages(); else ctx.skipPages();
    },
    // Know every monster already (no bestiary pages interrupting), optionally clear the floor.
    quiet(clear = true) {
      ctx.setup('every bestiary page already seen' + (clear ? ', floor cleared of monsters' : ''),
        `Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; }); G.cardQueue = [];${clear ? ' G.level.monsters = []; G.level.stalker = null;' : ''}`);
    },
    // The next pick the game makes from `table` (a JS expression) returns entry i.
    arm(table, i) {
      H.run(`(() => {
        if (!globalThis.__armed) {
          globalThis.__armed = [];
          const orig = RNG.pick;
          RNG.pick = function (arr) {
            const k = __armed.findIndex(a => a.arr === arr);
            if (k < 0) return orig.apply(this, arguments);
            const a = __armed.splice(k, 1)[0];
            Math.random();
            return arr[a.i];
          };
        }
        __armed.push({ arr: ${table}, i: ${i}, name: ${JSON.stringify(table + '[' + i + ']')} });
      })()`);
    },
    armed: () => H.run('(globalThis.__armed || []).length'),
    // Forget any armed picks. One that never came up means the scenario no longer reaches that
    // text, so it fails loudly rather than quietly recording less than before.
    disarm() {
      const left = H.run('(() => { const a = globalThis.__armed || []; const n = a.map(x => x.name); a.length = 0; return n; })()');
      if (left.length) throw new Error('armed pick never came up: ' + left.join(', '));
    },
    // A free cell next to the player (or next to x, y), as [dx, dy].
    openDir(x, y) {
      return H.run(`(() => { const L = G.level, px = ${x === undefined ? 'G.player.x' : x}, py = ${y === undefined ? 'G.player.y' : y};
        return DIR4.find(([dx, dy]) => passable(L.tiles[idx(px + dx, py + dy)]) && L.tiles[idx(px + dx, py + dy)] !== T.STAIRS && !monsterAt(px + dx, py + dy) && !fixtureAt(L, px + dx, py + dy) && !(px + dx === G.player.x && py + dy === G.player.y)) || null; })()`);
    },
    arrow: d => ARROWS[String(d)],
    // Put the player somewhere roomy: a floor cell whose four neighbours are open.
    roomy() {
      return ctx.setup('stand somewhere roomy', `(() => { const L = G.level, p = G.player;
        for (let t = 0; t < 400; t++) { const s = freeTile(L, 0); if (!s) continue;
          if (DIR8.every(([dx, dy]) => passable(L.tiles[idx(s[0] + dx, s[1] + dy)]) && L.tiles[idx(s[0] + dx, s[1] + dy)] !== T.STAIRS && !fixtureAt(L, s[0] + dx, s[1] + dy) && !monsterAt(s[0] + dx, s[1] + dy))) {
            p.x = s[0]; p.y = s[1]; p.hidden = false; computeFOV(L, p.x, p.y, lightRadius()); updateCamera(true); return true; } }
        return false; })()`);
    },
    // One of the odd rooms, right next to you (to your left), not yet noticed.
    placeRoom(kind, label, before = '', after = '') {
      return ctx.setup(label || `a ${kind} room next to you`, `(() => {
        const L = G.level, p = G.player; ${before}
        L.fixtures = []; L.monsters = [];
        for (let t = 0; t < 500; t++) {
          const s = freeTile(L, 0); if (!s) continue;
          const [x, y] = s;
          if (!DIR8.every(([dx, dy]) => passable(L.tiles[idx(x + dx, y + dy)]) && L.tiles[idx(x + dx, y + dy)] !== T.STAIRS && !monsterAt(x + dx, y + dy))) continue;
          if (L.items.some(i => Math.abs(i.x - x) <= 1 && Math.abs(i.y - y) <= 1)) continue;
          L.fixtures.push({ kind: '${kind}', x, y, used: false, seen: false });
          p.x = x + 1; p.y = y; p.hidden = false; ${after}
          computeFOV(L, p.x, p.y, lightRadius()); updateCamera(true);
          return true;
        }
        return false;
      })()`);
    },
    // A horror right next to you. Returns its direction from you.
    spawnNext(type, extra = '') {
      const d = ctx.openDir();
      ctx.setup(`a ${type} appears next to you`, `(() => { const p = G.player, m = spawnMonster(G.level, '${type}', p.x + ${d[0]}, p.y + ${d[1]}); globalThis.__m = m; ${extra}; computeFOV(G.level, p.x, p.y, lightRadius()); })()`);
      return d;
    },
    // Keep pressing a key (god mode on) until the condition holds; returns true if it did.
    until(cond, k = ' ', max = 200, ms = 34) {
      for (let i = 0; i < max; i++) {
        if (cond()) return true;
        if (G.mode === 'card') { ctx.skipPages(); continue; }
        if (G.mode === 'encounter') { ctx.key('Escape', ms); continue; }
        if (G.mode !== 'play') return cond();
        ctx.god();
        ctx.key(k, ms);
      }
      return cond();
    },
    // Wait n turns with Space (god mode), dismissing any bestiary page.
    wait(n, ms = 34, god = true) {
      for (let i = 0; i < n; i++) {
        if (G.mode === 'card') ctx.skipPages();
        if (G.mode === 'encounter') ctx.key('Escape', ms);
        if (G.mode !== 'play') return;
        if (god) ctx.god();
        ctx.key(' ', ms);
      }
    },
    // A rhyme duel, played by keys: let the couplet appear, then answer (true = the rhyme,
    // false = a wrong word, null = let the fuse burn out).
    rhyme(answer, { natural = false, god = true } = {}) {
      if (god) ctx.god();
      ctx.key('r', 34);
      if (G.mode !== 'rhyme') return false;
      if (natural) { for (let t = 0; t < 200 && !G.rhyme.fuseT0; t++) H.tick(34); }
      else { ctx.key('Enter', 34); ctx.key('Enter', 34); for (let t = 0; t < 60 && !G.rhyme.fuseT0; t++) H.tick(34); }
      if (answer === null) { for (let t = 0; t < 700 && G.mode === 'rhyme'; t++) H.tick(34); }
      else {
        const opts = G.rhyme.options, i = answer ? opts.indexOf(G.rhyme.answer) : opts.findIndex(o => o !== G.rhyme.answer);
        ctx.key(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][i], 500);
        for (let t = 0; t < 80 && G.mode === 'rhyme'; t++) H.tick(34);
      }
      return true;
    },
  };
  return ctx;
}

// ---------------------------------------------------------------------------------------

const scenarios = [];
const add = (name, seed, run, opts = {}) => scenarios.push(Object.assign({ name, seed, run }, opts));

// The title, its pages and overlays, the story and the first floor card, all played naturally;
// then pockets, gear, the log, help and quitting; M, V and F; every tagline.
add('screens', 11, c => {
  const { G } = c;
  c.tick(1500);
  c.key('x', 2500);
  c.key('?', 400); c.key('x', 300);
  c.key('h', 400); c.key('Escape', 300);
  c.key('b', 400); c.key('Escape', 300);
  c.key('g', 400); c.key('Escape', 300);
  c.key('m', 300); c.key('v', 300); c.key('f', 300);
  c.key('m', 300); c.key('v', 300); c.key('f', 300);
  const taglines = c.val('TEXT.taglines.length');
  for (let i = 0; i < taglines; i++) { c.arm('TEXT.taglines', i); c.setup(`tagline ${i + 1}`, 'goTitle()'); c.tick(200); }
  c.tick(6000); // eyes in the dark around the title
  c.key('Enter', 300);
  c.readPages();
  c.tick(1500);
  c.key('i', 400); c.key('ArrowDown', 200); c.key('ArrowDown', 200); c.key('ArrowUp', 200); c.key('Escape', 200);
  c.key('e', 400);
  for (let i = 0; i < 4; i++) c.key('ArrowDown', 200);
  c.key('i', 300); c.key('e', 300); c.key('Escape', 200);
  c.key('l', 400); c.key('x', 200);
  c.key('?', 400); c.key('x', 200);
  c.key('>', 200); c.key('a', 200); c.key('g', 200); c.key('7', 200); c.key('t', 200);
  c.key('q', 300); c.key('x', 300);
  c.key('m', 200); c.key('m', 200); c.key('f', 300); c.key('f', 300); c.key('v', 200); c.key('v', 200);
  c.key('q', 300); c.key('q', 1500);
  c.key('Enter', 200);
  c.skipPages();
  for (let i = 0; i < 6; i++) { c.key(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', ' ', '.'][i], 200); c.readPages(); }
  // Holding a key down walks an empty hall, but not into danger or through pages.
  c.H.press('ArrowLeft', true); c.tick(100); c.H.press('ArrowLeft', true); c.tick(100); c.readPages();
});

// Whole games played by the bot, on fixed seeds. God mode refills health and takes the stairs
// every 450 steps, so those runs reach the deep floors (bot-deep reaches the boss).
const botGame = (botSeed, god, maxSteps) => c => {
  const s = playGame(c.H, { botSeed, god, maxSteps, pageMs: 1200, keys: GOLDEN_KEYS, tickEveryKey: true });
  c.note(`bot finished: ${s.end} on floor ${s.maxDepth} after ${s.steps} steps`);
  afterGame(c.H);
};
add('bot-deep', 21, botGame(1, true, 2800));
add('bot-mortal-1', 22, botGame(2, false, 1500));
add('bot-god-2', 23, botGame(3, true, 1000));
add('bot-mortal-3', 25, botGame(5, false, 1500));
// Two games in a row: the second one meets the first one's ghost.
add('bot-ghosts', 24, c => {
  for (let g = 0; g < 3 && c.G.mode !== 'win'; g++) {
    const s = playGame(c.H, { botSeed: 40 + g, god: g === 2, maxSteps: g === 2 ? 1000 : 900, pageMs: 1200, keys: GOLDEN_KEYS, tickEveryKey: true });
    c.note(`bot game ${g + 1} finished: ${s.end} on floor ${s.maxDepth} after ${s.steps} steps`);
    afterGame(c.H);
  }
});

require('./scenarios-forced')(add, makeCtx);
require('./scenarios-rules')(add, makeCtx);

module.exports = { scenarios, makeCtx, PAGE_MODES };
