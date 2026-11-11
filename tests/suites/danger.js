'use strict';
// The rules-and-balance changes of November 2026: bolder horrors (candle out, or the highest
// fear), clumsiness at the highest fear, the middle floors' surprises (the Drawer Closes, Bath
// Time, Nap Time), a weapon guaranteed on floor 1, and pockets shown grouped and counted.

const { createGame, checker, startGame } = require('./lib');

const SEED = Number(process.env.SEED) || 808;
const { check, finish } = checker('danger');
const H = createGame({ seed: SEED }), G = H.G;
startGame(H);
H.run(`Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; }); G.cardQueue = [];`);

// An open, walled-off patch of floor around you, with nothing else on it.
H.run(`globalThis.__clear = (depth) => {
  if (depth && depth !== G.depth) { enterFloor(depth); toPlay(); G.cardQueue = []; }
  const L = G.level, p = G.player;
  p.x = clamp(p.x, 12, MAP_W - 13); p.y = clamp(p.y, 8, MAP_H - 9);
  for (let dy = -7; dy <= 7; dy++) for (let dx = -11; dx <= 11; dx++) L.tiles[idx(p.x + dx, p.y + dy)] = Math.abs(dx) === 11 || Math.abs(dy) === 7 ? T.WALL : T.FLOOR;
  L.monsters = []; L.items = []; L.fixtures = []; L.phantoms = []; L.ghosts = []; L.stalker = null; L.turnsHere = 0; L.surprise = null;
  Object.assign(p, { hp: 9999, maxHp: 9999, wick: 400, dread: 0, confused: 0, poisoned: 0, hidden: false, darkTurns: 0 });
  G.mode = 'play'; G.threat = null; G.encounter = null; G.log.length = 0; G.logMark = 0;
  computeFOV(L, p.x, p.y, lightRadius());
};`);

// --- 1. Bolder horrors -------------------------------------------------------------------
const wakeTrial = (setup, n = 200) => H.run(`(() => {
  let woke = 0;
  for (let k = 0; k < ${n}; k++) {
    __clear(); const p = G.player, L = G.level; ${setup}
    const m = spawnMonster(L, 'mite', p.x + 6, p.y); m.awake = false;
    computeFOV(L, p.x, p.y, lightRadius()); L.visible[idx(m.x, m.y)] = 0;
    monstersAct(L);
    if (m.awake) woke++;
  }
  return woke / ${n};
})()`);
const calmWake = wakeTrial(''), darkWake = wakeTrial('p.wick = 0;'), fearWake = wakeTrial('p.dread = 85;');
check('a sleeping horror out of sight stays asleep when your candle is lit and you are calm', calmWake === 0, calmWake);
check(`with your candle out it may wake (about ${H.run('RULES.bold.wake')} a turn), unseen`, Math.abs(darkWake - H.run('RULES.bold.wake')) < 0.1, darkWake);
check('at the highest fear too', Math.abs(fearWake - H.run('RULES.bold.wake')) < 0.1, fearWake);
const far = H.run(`(() => { __clear(); const p = G.player, L = G.level; p.wick = 0;
  const m = spawnMonster(L, 'mite', p.x + 10, p.y + 5); m.awake = false; L.visible[idx(m.x, m.y)] = 0;
  for (let k = 0; k < 50; k++) monstersAct(L); return m.awake; })()`);
check('one further off than RULES.bold.wakeRange stays asleep', far === false);
const pace = bold => H.run(`(() => { __clear(); const p = G.player, L = G.level; ${bold ? 'p.wick = 0;' : ''}
  const m = spawnMonster(L, 'zombie', p.x - 10, p.y); m.awake = true; m.energy = 0;
  const x0 = m.x; for (let k = 0; k < 12; k++) monstersAct(L); return m.x - x0; })()`);
const slow = pace(false), quick = pace(true);
check('bold horrors move faster (12 turns of Better-Late-Than-Never)', quick > slow, { calm: slow, bold: quick });

// --- 2. Clumsy at the highest fear --------------------------------------------------------
const hitRate = dread => H.run(`(() => { __clear(); const p = G.player, L = G.level; p.dread = ${dread};
  const m = spawnMonster(L, 'mite', p.x + 1, p.y); let hits = 0;
  for (let k = 0; k < 2000; k++) { m.hp = m.maxHp = 9999; const before = m.hp; playerAttack(m); if (m.hp < before) hits++; }
  return hits / 2000; })()`);
const calmHit = hitRate(0), afraidHit = hitRate(60), undoneHit = hitRate(90);
const base = H.run('RULES.combat.playerHit'), less = H.run('RULES.clumsy.hit');
check('your blows land as often as ever when you are calm, or only afraid', Math.abs(calmHit - base) < 0.03 && Math.abs(afraidHit - base) < 0.03, { calmHit, afraidHit });
check(`at the highest fear they land about ${(base - less).toFixed(2)} of the time`, Math.abs(undoneHit - (base - less)) < 0.03, undoneHit);
const escRate = dread => H.run(`(() => { let got = 0;
  for (let k = 0; k < 1500; k++) { __clear(); const p = G.player, L = G.level; p.dread = ${dread};
    const m = spawnMonster(L, 'mite', p.x + 1, p.y); m.awake = true; if (breakAway(p.x - 1, p.y)) got++; }
  return got / 1500; })()`);
const calmEsc = escRate(0), undoneEsc = escRate(90);
check(`getting away fails more at the highest fear (about ${H.run('RULES.clumsy.escape')} less)`, Math.abs(calmEsc - undoneEsc - H.run('RULES.clumsy.escape')) < 0.05, { calmEsc, undoneEsc });
const tags = dread => { H.run(`__clear(); G.player.dread = ${dread};`); const seen = []; H.onText = s => seen.push(s); H.tick(80); H.onText = null; return seen; };
check('the margin says "trembling" at the highest fear, and not before', tags(90).includes('trembling') && !tags(60).includes('trembling'));

// --- 3. A weapon on floor 1 ----------------------------------------------------------------
{
  let missing = [];
  for (let s = 0; s < 30; s++) {
    const W = createGame({ seed: 3000 + s, echoConsole: false });
    W.run('goTitle()'); W.press('Enter');
    if (!W.run('G.level.items.some(e => e.item.kind === "weapon")')) missing.push(3000 + s);
  }
  check('floor 1 always has a weapon lying somewhere (30 new games)', missing.length === 0, missing);
}

// --- 4. The middle floors' surprises -------------------------------------------------------
{
  const plan = H.run(`(() => { const out = {}; for (const d of [1, 2, 3, 4, 5, 6]) { const L = { depth: d }; planSurprise(L); out[d] = L.surprise && [L.surprise.kind, L.surprise.at - G.turn]; } return out; })()`);
  const R = H.run('RULES.surprises');
  check('floors 3, 4 and 5 each get their surprise, at a moment between RULES.surprises.from and .to; the others none',
    plan[1] === null && plan[2] === null && plan[6] === null && plan[3][0] === 'drawer' && plan[4][0] === 'bath' && plan[5][0] === 'nap'
    && [3, 4, 5].every(d => plan[d][1] >= R.from && plan[d][1] <= R.to), plan);
}
// The Drawer Closes, on a real floor 3
{
  const D = createGame({ seed: SEED + 1 });
  startGame(D, 3);
  D.run(`Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; }); G.cardQueue = []; G.player.hp = G.player.maxHp = 9999;
    G.level.surprise.at = G.turn + 1;`);
  D.press(' '); D.tick(100); D.press(' '); D.tick(100);
  const s = D.run('G.level.surprise');
  check('the drawer closes: a corridor becomes a wall, and the narrator says so',
    s.stage === 'closed' && D.run(`G.level.tiles[idx(${s.x}, ${s.y})] === T.WALL`) && D.G.log.some(l => /closed the drawer/.test(l.text)), s);
  const cut = D.run(`(() => { const L = G.level, p = G.player, s = L.surprise;
    const a = stepsFrom(L, p.x, p.y, passable); L.tiles[idx(s.x, s.y)] = s.tile; const b = stepsFrom(L, p.x, p.y, passable); L.tiles[idx(s.x, s.y)] = T.WALL;
    const n = d => Array.from(d).filter(v => v >= 0).length;
    return { lost: n(b) - n(a) - 1, stairsCut: L.stairs && a[idx(L.stairs.x, L.stairs.y)] < 0, far: manhattan(s, p) }; })()`);
  check('it cuts the floor in two: the stairs, or a good part of the floor, can no longer be reached', cut.stairsCut || cut.lost >= D.run('RULES.surprises.drawer.cutsOff'), cut);
  // carry on, saved and loaded halfway through
  const D2 = createGame({ seed: SEED + 2, store: D.store }); D2.press('x'); D2.tick(60); D2.press('c'); D2.tick(100);
  check('a closed drawer is saved with the run', D2.run(`G.level.surprise.stage === 'closed' && G.level.tiles[idx(${s.x}, ${s.y})] === T.WALL`));
  for (let k = 0; k < 40 && D2.run('G.level.surprise.stage') !== 'over'; k++) { D2.run('G.player.hp = 9999'); D2.press(' '); D2.tick(60); while (D2.G.mode !== 'play' && D2.G.mode !== 'dead') { D2.press('Enter'); D2.tick(100); } }
  check('after a while the drawer opens again, the corridor is back, and the narrator says so',
    D2.run(`G.level.surprise.stage === 'over' && G.level.tiles[idx(${s.x}, ${s.y})] !== T.WALL`) && D2.G.log.some(l => /opens the drawer again/.test(l.text)));
}
// Bath Time, on a floor 4 laid out by hand: a strip of water from you to a pool six or so cells away
{
  const r = H.run(`(() => { __clear(4); const L = G.level, p = G.player;
    for (let dx = 0; dx <= 6; dx++) L.tiles[idx(p.x + dx, p.y)] = T.DEEP;
    for (let dy = -1; dy <= 1; dy++) for (let dx = 5; dx <= 7; dx++) L.tiles[idx(p.x + dx, p.y + dy)] = T.DEEP;
    p.inv = [makeItem('food', 'muffin'), makeItem('food', 'eggs')]; p.wick = 400;
    L.surprise = { kind: 'bath', stage: 'waiting', at: G.turn, tries: 0 };
    const out = { x0: p.x }; surpriseTurn(L); out.drain = [L.surprise.x - p.x, L.surprise.y - p.y]; out.stage1 = L.surprise.stage;
    for (let k = 0; k < RULES.surprises.bath.warm; k++) { G.turn++; surpriseTurn(L); }
    out.stage2 = L.surprise.stage; out.path = [];
    for (let k = 0; k < 12 && L.surprise.stage !== 'over'; k++) { G.turn++; surpriseTurn(L); out.path.push(p.x - out.x0); }
    out.inv = p.inv.length; out.log = G.log.slice(-6).map(l => l.text); return out; })()`);
  check('bath time: warm and lovely first, then the plug', r.stage1 === 'warm' && r.stage2 === 'drain', r);
  check('then the water pulls you, a step a turn, toward the drain', r.path[0] === 1 && r.path[1] === 2 && r.path.includes(r.drain[0]), r);
  check('at the drain it keeps one of your things, and says thank you', r.inv === 1 && r.log.some(t => /Glug\. The drain keeps your/.test(t)), r);
  const out = H.run(`(() => { __clear(4); const L = G.level, p = G.player;
    for (let dx = 1; dx <= 8; dx++) L.tiles[idx(p.x + dx, p.y)] = T.DEEP;
    L.surprise = { kind: 'bath', stage: 'drain', until: G.turn + 8, x: p.x + 8, y: p.y, kept: false, told: false };
    const x0 = p.x; for (let k = 0; k < 4; k++) { G.turn++; surpriseTurn(L); } return p.x - x0; })()`);
  check('out of the water, it cannot reach you', out === 0, out);
  const moved = H.run(`(() => { __clear(4); const L = G.level, p = G.player;
    for (let dx = 0; dx <= 4; dx++) L.tiles[idx(p.x + dx, p.y)] = T.WATER;
    L.surprise = { kind: 'bath', stage: 'drain', until: G.turn + 8, x: 1, y: 1, kept: false, told: false };
    L.tiles[idx(1, 1)] = T.DEEP; G.turn++; surpriseTurn(L);
    return { dy: L.surprise.y - p.y, inPool: L.surprise.y === p.y && L.surprise.x >= p.x - 1 && L.surprise.x <= p.x + 4 }; })()`);
  check('in a pool of your own, away from the drain, the drain comes to your pool', moved.inPool, moved);
}
// Nap Time, on a floor 5 laid out by hand
{
  const setup = `__clear(5); const L = G.level, p = G.player;
    const ms = [['tot', 3, 0], ['opinion', -3, 0], ['mite', 0, 3], ['tuck', -9, -5]].map(([t, dx, dy]) => { const m = spawnMonster(L, t, p.x + dx, p.y + dy); m.awake = true; return m; });
    L.surprise = { kind: 'nap', stage: 'waiting', at: G.turn, tries: 0 }; surpriseTurn(L);`;
  const nap = H.run(`(() => { ${setup}
    const where = () => L.monsters.map(m => m.x + ',' + m.y).join(' ');
    const out = { napping: L.monsters.map(m => !!m.napping), awake: L.monsters.map(m => m.awake), log: G.log.slice(-1)[0].text };
    const before = where().split(' ').slice(0, 3).join(' ');
    for (let k = 0; k < 5; k++) { endTurn(); }
    out.still = where().split(' ').slice(0, 3).join(' ') === before;
    out.stillAsleep = L.monsters.slice(0, 3).every(m => m.napping && !m.awake);
    return out; })()`);
  check('nap time: everybody but the Tuck-You-In lies down and shuts its eyes', JSON.stringify(nap.napping) === '[true,true,true,false]' && JSON.stringify(nap.awake) === '[false,false,false,true]' && /Nap time!/.test(nap.log), nap);
  check('they stay where they are, asleep, even in plain sight', nap.still && nap.stillAsleep, nap);
  const woke = H.run(`(() => { ${setup}
    const m = L.monsters[1]; p.x = m.x + 1; computeFOV(L, p.x, p.y, lightRadius()); playerAttack(m);
    return { awake: L.monsters.slice(0, 3).map(m => m.awake && !m.napping), frenzy: L.monsters.slice(0, 3).map(m => m.frenzy), log: G.log.slice(-3).map(l => l.text), stage: L.surprise.stage }; })()`);
  check('a blow wakes all of them at once, frantic', woke.awake.every(Boolean) && woke.frenzy.every(f => f > 0) && woke.log.some(t => /wakes up at once/.test(t)) && woke.stage === 'over', woke);
  for (const [what, code] of [['a rhyme', 'G.rhyme = { a: "", b: "", answer: "x", options: ["x"], ms: 9000, fuseT0: 1, result: null }; G.mode = "rhyme"; answerRhyme(0);'],
    ['bumping a wall', 'G.mode = "play"; for (let k = 0; k < 12; k++) tryMove(0, -1);'], ['the clock striking', 'L.clock = RULES.floors.clock.every - 1; clockTurn(L);']]) {
    const w = H.run(`(() => { ${setup} ${code} return L.surprise.stage === 'over' && L.monsters.slice(0, 3).every(m => m.awake && !m.napping); })()`);
    check(`${what} wakes them too`, w);
  }
  const ends = H.run(`(() => { ${setup}
    for (let k = 0; k < RULES.surprises.nap.turns + 2; k++) { G.turn++; surpriseTurn(L); }
    return { up: L.monsters.slice(0, 3).every(m => m.awake && !m.napping && !m.frenzy), log: G.log.slice(-1)[0].text }; })()`);
  check('left alone, the nap ends and they get up, refreshed (not frantic)', ends.up && /Nap time is over/.test(ends.log), ends);
}

// --- 5. Pockets, grouped and counted -------------------------------------------------------
{
  H.run(`__clear(1); const p = G.player; G.known.potion.heal = true;
    p.inv = [makeItem('potion', 'heal'), makeItem('food', 'muffin'), makeItem('scroll', 'fear'), makeItem('food', 'muffin'), makeItem('potion', 'sight'), makeItem('potion', 'sight'), makeItem('potion', 'sight')];`);
  const rows = H.run(`pocketRows().map(r => (r.idx.length > 1 ? r.idx.length + ' x ' : '') + itemName(r.it))`);
  check('identical things share a row with a count; food first, then potions, then scrolls', rows.length === 4 && rows[0] === '2 x Mumble-Muffin' && /^3 x /.test(rows[2]) && rows[1] === 'Tonic of Tolerable Health' && /Scroll|scroll/.test(rows[3]), rows);
  const seen = []; H.onText = s => seen.push(s); H.tick(80); H.onText = null;
  check('the margin shows "Mumble-Muffin ×2" and counts the pockets used: 7 of 10', seen.includes('Mumble-Muffin ×2') && seen.some(s => /^POCKETS +7 OF 10$/.test(s.replace(/\u200a/g, ''))), [...new Set(seen)]);
  H.press('i'); const inv = []; H.onText = s => inv.push(s); H.tick(80); H.onText = null; H.press('Escape');
  check('the pockets page is titled "Your Pockets (7 of 10)"', inv.some(s => /Your Pockets \(7 of 10\)/.test(s)), inv.filter(s => /Pockets/.test(s)));
  H.press('1'); H.tick(60);
  check('key 1 eats one muffin from the first row', H.run(`G.player.inv.filter(i => i.id === 'muffin').length`) === 1 && /Mumble-Muffin/.test(G.log[G.log.length - 1].text) || G.log.slice(-3).some(l => /Mumble-Muffin/.test(l.text)), G.log.slice(-2).map(l => l.text));
  H.run('G.player.hp = 10;');
  H.press('2'); H.tick(60);
  check('key 2 (now the tonic, since the muffins are still a row) drinks the tonic', !H.run(`G.player.inv.some(i => i.id === 'heal')`));
  H.run(`G.player.inv = Array.from({ length: 10 }, () => makeItem('food', 'muffin')); dropItem(G.level, G.player.x, G.player.y, makeItem('food', 'ham'));`);
  H.press('g'); H.tick(60);
  check('you still carry 10 things at most, however few rows they make', H.run('G.player.inv.length') === 10 && H.run('pocketRows().length') === 1 && /pockets are full/.test(G.log[G.log.length - 1].text), G.log[G.log.length - 1].text);
  H.run(`G.player.inv = [makeItem('food', 'muffin'), makeItem('potion', 'heal')]; dropItem(G.level, G.player.x, G.player.y, makeItem('food', 'muffin'));`);
  H.press('g'); H.tick(60);
  check('picking up says which row it went in (pocket 1, with the other muffin)', /\(pocket 1\)/.test(G.log[G.log.length - 1].text), G.log[G.log.length - 1].text);
}

check('no console errors', !H.consoleLog.some(l => /^(warn|error)/.test(l)), H.consoleLog.filter(l => /^(warn|error)/.test(l)).slice(0, 3));
finish();
