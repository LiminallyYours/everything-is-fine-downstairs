'use strict';
// Forced checks of the floor systems: bedtime (the Tuck-You-In), barrels, the candle going out,
// the tide, the clock, biting walls, socks, ghosts and bones, and every page drawing cleanly.

const { createGame, checker } = require('./lib');

const H = createGame({ seed: Number(process.env.SEED) || 101 }), G = H.G;
const { check, finish } = checker('targeted');
const start = depth => {
  H.run('goTitle()'); H.press('Enter');
  for (let i = 0; i < 80 && G.mode !== 'play'; i++) { H.press('Enter'); H.tick(40); }
  if (depth > 1) H.run(`enterFloor(${depth}); G.mode = 'play'; G.back = 'play';`);
  H.run('G.level.monsters = G.level.monsters.filter(m => m.type === "nibbler")'); // a quiet floor
};
const waitTurns = (n, god = true) => {
  for (let i = 0; i < n; i++) {
    if (god) G.player.hp = G.player.maxHp;
    if (G.mode === 'card') H.press('Enter'), H.press('Enter');
    if (G.mode === 'rhyme') H.press('ArrowUp');
    if (G.mode !== 'play') break;
    H.press(' ');
  }
};

// 1. Bedtime on floor 1
start(1);
H.run('G.level.turnsHere = stalkerDue(1) - 81');
const wick0 = G.player.wick;
waitTurns(85);
const L1 = G.level;
check('the Tuck-You-In comes at bedtime', !!L1.stalker);
check('its bestiary page is shown', JSON.parse(H.store['rot.bestiary'] || '[]').includes('tuck'));
let hits = 0;
for (let i = 0; i < 120 && L1.stalker; i++) {
  G.player.hp = 999; G.player.maxHp = 999;
  if (G.mode === 'card') H.press('Enter'), H.press('Enter');
  H.press(' ');
  if (L1.stalker && Math.abs(L1.stalker.x - G.player.x) + Math.abs(L1.stalker.y - G.player.y) === 1) hits++;
}
check('it reaches you and tucks you in (the candle shrinks)', hits > 0 && G.player.wick < wick0 - 100, { hits, wick: G.player.wick });
const st = L1.stalker;
H.run('playerAttack(G.level.stalker)');
check('hitting it does nothing', st.hp === 999, st.hp);
G.player.verve = 3;
H.run('startRhyme(); G.rhyme.fuseT0 = 1; answerRhyme(G.rhyme.options.indexOf(G.rhyme.answer)); finishRhyme();');
check('a good rhyme stuns it', st.stun > 0 && G.stats.rhymeWins === 1, { stun: st.stun, wins: G.stats.rhymeWins });
G.player.verve = 3; H.run('startRhyme()'); H.tick(20000);
check('a rhyme fuse that burns out closes the duel and counts as a failure', G.mode !== 'rhyme' && G.stats.rhymeFails === 1, { mode: G.mode, fails: G.stats.rhymeFails });
for (let i = 0; i < 10 && G.mode === 'card'; i++) { H.press('Enter'); H.tick(40); } // a page for whatever the bad rhyme made
G.player.hp = 1; G.player.maxHp = 30; st.stun = 0;
H.run('G.level.monsters = G.level.monsters.filter(m => m === G.level.stalker)');
for (let i = 0; i < 40 && (G.mode === 'play' || G.mode === 'card'); i++) H.press(G.mode === 'card' ? 'Enter' : ' ');
check('dying to it says so on the stone', G.mode === 'dead' && /Tuck-You-In/.test(G.killer) && G.fact.length > 10, { killer: G.killer, fact: G.fact });
H.tick(3000);

// 2. A barrel on floor 1
start(1);
let L = G.level;
let barrel = null;
for (let i = 0; i < L.tiles.length && !barrel; i++) if (L.tiles[i] === 6) barrel = [i % 58, (i / 58) | 0];
const nb = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => [barrel[0] + dx, barrel[1] + dy, dx, dy]).find(([x, y]) => L.tiles[y * 58 + x] !== 0 && L.tiles[y * 58 + x] !== 6);
G.player.x = nb[0]; G.player.y = nb[1];
H.press(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][[[0, 1], [-1, 0], [0, -1], [1, 0]].findIndex(([a, b]) => a === nb[2] && b === nb[3])]);
check('walking into a barrel hides you in it', G.player.hidden && G.player.x === barrel[0] && G.player.y === barrel[1], { hidden: G.player.hidden });
check('inside a barrel you can see only next to you', H.run('lightRadius()') === 1);

// 3. The candle goes out
G.player.wick = 2; G.player.hidden = false; G.player.x = nb[0]; G.player.y = nb[1];
for (let i = 0; i < 10 && G.player.wick > 0; i++) { G.player.hp = G.player.maxHp; if (G.mode !== 'play') H.press('Enter'); else H.press(' '); }
check('when the candle goes out you see only next to you', H.run('lightRadius()') === 1 && G.player.wick === 0, { wick: G.player.wick });

// 4. The tide on floor 4
start(4);
const water = () => { let w = 0, d = 0; for (const t of G.level.tiles) { if (t === 3) w++; if (t === 7) d++; } return w + d; };
const w0 = water();
waitTurns(200);
check('the tide comes in on floor 4', water() > w0 + 20, { before: w0, after: water() });
check('no bedtime yet after 200 turns on floor 4', !G.level.stalker);

// 5. The clock on floor 5
start(5);
waitTurns(45);
check('the nursery clock strikes after 45 turns', G.level.strikes === 1, G.level.strikes);

// 6. Walls that bite on floor 6
start(6);
H.run('G.level.monsters = []');
let bites = 0;
for (let i = 0; i < 300; i++) {
  G.player.hp = G.player.maxHp;
  const Lb = G.level, p = G.player;
  if (![[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => Lb.tiles[(p.y + dy) * 58 + p.x + dx] === 0)) {
    for (let k = 0; k < Lb.tiles.length; k++) {
      const x = k % 58, y = (k / 58) | 0;
      if (Lb.tiles[k] === 1 && [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => Lb.tiles[(y + dy) * 58 + x + dx] === 0)) { p.x = x; p.y = y; break; }
    }
  }
  H.press(' ');
  if (G.log.some(l => /wall BITES/.test(l.text))) { bites++; G.log = []; }
}
check('standing by a wall on floor 6, it bites now and then', bites > 3 && bites < 40, bites);

// 7. Socks on floor 3
start(3);
H.run(`G.player.inv = []; globalThis.__socks = {}; G.level.items.filter(i => i.item.kind === "sock").forEach(s => (__socks[s.item.id] = __socks[s.item.id] || []).push(s));`);
const pairId = H.run('Object.keys(__socks).find(k => __socks[k].length === 2)');
// plant a few tombstones by the first sock, so there is something to rise from
H.run(`(() => { const s = __socks['${pairId}'][0]; let n = 0; for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3], [3, 3], [-3, -3], [3, -3], [-3, 3], [2, 0], [-2, 0], [0, 2], [0, -2]]) { const x = s.x + dx, y = s.y + dy; if (inMap(x, y) && passable(G.level.tiles[idx(x, y)]) && G.level.tiles[idx(x, y)] !== T.STAIRS && n < 10) { G.level.tiles[idx(x, y)] = T.PROP; n++; } } })()`);
const propsNear = H.run(`__socks['${pairId}'].map(s => { let n = 0; for (let y = s.y - 8; y <= s.y + 8; y++) for (let x = s.x - 10; x <= s.x + 10; x++) if (inMap(x, y) && G.level.tiles[idx(x, y)] === T.PROP) n++; return n; })`);
H.run(`for (const s of __socks['${pairId}']) { G.player.x = s.x; G.player.y = s.y; pickUp(); }`);
const risen = G.level.monsters.filter(m => m.type === 'sockling').length;
check('picking up socks makes the socklings rise (from the tombstones nearby)', risen > 0, { propsNear, risen });
check('two matching socks become a pair', G.player.inv.some(i => i.kind === 'pair'));
const sniff = H.run(`(() => { const p = G.player, s = JSON.parse(JSON.stringify(Object.values(__socks).flat()[0].item)); p.inv.push(s);
  const before = p.dread, took = useItem(p.inv.indexOf(s)), last = G.log[G.log.length - 1].text;
  p.inv.splice(p.inv.indexOf(s), 1); return { took, last, rose: p.dread > before }; })()`);
check('using a lone sock sniffs it: no turn taken, a line, and a little more Dread', !sniff.took && /sniff the lone sock/.test(sniff.last) && sniff.rose, sniff);
const def0 = H.run('playerDef()');
H.run(`useItem(G.player.inv.findIndex(i => i.kind === 'pair'))`);
check('wearing the pair adds 1 defense', H.run('playerDef()') === def0 + 1, [def0, H.run('playerDef()')]);

// 8. A ghost and its bones
H.run(`Store.save('graveyard', [{run: 999, depth: 2, floor: 'x', killer: 'a Put-Away', epitaph: ['Here lies a test.', 'It died.'], bones: [makeItem('weapon', 2)], won: false, turns: 1, level: 1, gold: 0, kills: 0}])`);
start(2);
const gh = G.level.ghosts[0];
check('a past Somebody haunts the floor where it died', !!gh);
if (gh) {
  H.run('G.player.x = G.level.ghosts[0].x; G.player.y = G.level.ghosts[0].y; pickUp();');
  check('its bones can be looted', G.player.inv.some(i => i.kind === 'weapon'));
  check('the grave is marked as looted', JSON.parse(H.store['rot.graveyard'])[0].looted === true);
}

// 9. Every bestiary page, every rhyme page and a frightened map draw without errors
let drewOk = true;
try {
  H.run('for (const t of Object.keys(BESTIARY)) { showBeastPage(t); G.page.t0 = -1e9; draw(); } G.mode = "play"; G.page = null;');
  H.run('for (const c of COUPLETS) { G.player.verve = 3; startRhyme(); G.rhyme.fuseT0 = FX.now; G.page.t0 = -1e9; draw(); } G.mode = "play"; G.page = null;');
  H.run('G.player.dread = 90; G.player.hp = 3; G.player.poisoned = 3; G.player.confused = 3; G.player.sensing = 3; G.player.hidden = true; G.level.stalker = G.level.monsters[0] || {x:0,y:0}; draw();');
} catch (e) { drewOk = false; console.log(e.stack); }
check('every bestiary page, rhyme page and a frightened map draw cleanly', drewOk);
const bad = H.run('[...COUPLETS, ...BOSS_COUPLETS].filter(c => c.length !== 4 || !c[1].includes("___") || c[3].length !== 3 || new Set([c[2], ...c[3]]).size !== 4).map(c => c[0])');
check('every couplet has a blank, one answer and three different wrong words', bad.length === 0, bad);
check('no console errors', !H.consoleLog.some(l => /^(warn|error)/.test(l)), H.consoleLog.filter(l => /^(warn|error)/.test(l)));

finish();
