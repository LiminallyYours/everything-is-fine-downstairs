'use strict';
// 16 checks of getting away: walking off from a fight, sleeping/stunned/scared horrors, monsters
// fleeing you, rhyme shoves, the stairs mid-fight, and what the encounter and reaction cards do.

const { createGame, checker } = require('./lib');

const H = createGame({ seed: Number(process.env.SEED) || 404 }), G = H.G;
const { check, finish, out } = checker('withdraw');
H.run('goTitle()'); H.press('Enter');
for (let i = 0; i < 80 && G.mode !== 'play'; i++) { H.press('Enter'); H.tick(40); }
H.run(`Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; }); G.cardQueue = [];`);
// Put the player in a clear spot with a monster on one side and open floor on the other.
const setup = `(type, opts) => {
  const L = G.level, p = G.player;
  for (let tries = 0; tries < 500; tries++) {
    const s = freeTile(L, 0); if (!s) continue;
    const [x, y] = s;
    if (!DIR4.every(([dx, dy]) => passable(L.tiles[idx(x + dx, y + dy)]) && L.tiles[idx(x + dx, y + dy)] !== T.STAIRS && !fixtureAt(L, x + dx, y + dy))) continue;
    L.monsters = []; L.items = []; L.fixtures = [];
    p.x = x; p.y = y; p.hidden = false; p.confused = 0; p.hp = p.maxHp = 9999;
    const m = spawnMonster(L, type, x + 1, y);
    Object.assign(m, { awake: true, stun: 0, hp: 9999, maxHp: 9999 }, opts || {});
    computeFOV(L, p.x, p.y, lightRadius());
    G.threat = null; G.mode = 'play';
    return m;
  }
}`;
H.run(`globalThis.__setup = ${setup};`);
// 1. Walking away from a fight: only sometimes works; failing costs the turn.
const trial = (type, opts, n = 300) => H.run(`(() => {
  let away = 0, heldTurnSpent = 0;
  for (let i = 0; i < ${n}; i++) {
    const m = __setup('${type}', ${JSON.stringify(opts || {})}); const p = G.player, x0 = p.x, t0 = G.turn;
    tryMove(-1, 0);                       // step directly away from it
    if (p.x !== x0) away++; else if (G.turn === t0) heldTurnSpent++;
  }
  return { rate: away / ${n}, expected: +escapeChance(1, MONSTERS['${type}'].speed, '${type}' === 'tuck').toFixed(2) };
})()`);
for (const [type, opts] of [['opinion'], ['zombie'], ['tot'], ['tuck']]) {
  const r = trial(type, opts);
  check(`walking away from a ${type} works only sometimes (~${Math.round(r.expected * 100)}%)`, Math.abs(r.rate - r.expected) < 0.1, r);
}
const asleep = trial('opinion', { awake: false }), stunned = trial('opinion', { stun: 5 }), scared = trial('opinion', { fear: 5 });
check('a sleeping horror never holds you', asleep.rate === 1, asleep);
check('a stunned horror never holds you', stunned.rate === 1, stunned);
check('a scared horror never holds you', scared.rate === 1, scared);
// Being held really does cost the turn (so it gets its swing)
const held = H.run(`(() => {
  for (let i = 0; i < 200; i++) {
    const m = __setup('tot'); const p = G.player, x0 = p.x, t0 = G.turn;
    H_act: { G.logMark = G.log.length; if (tryMove(-1, 0)) endTurn(); }
    if (p.x === x0) return { turnPassed: G.turn === t0 + 1, told: G.log.slice(G.logMark).map(l => l.text).find(t => /sleeve|foot|let you go|follows/.test(t)) || null, threat: !!G.threat };
  }
  return null;
})()`.replace('H_act: ', ''));
check('when held: the turn passes, you are told, and it gets its swing', held && held.turnPassed && !!held.told && held.threat, held);
// Sidestepping while staying next to it is not leaving the fight
const side = H.run(`(() => {
  let moved = 0;
  for (let i = 0; i < 100; i++) {
    const m = __setup('tot'); const p = G.player;
    // monster at (x+1, y). A diagonal-adjacent cell (x+1, y-1) keeps contact: step up then... use a cell adjacent to the monster: (x+1,y) is it; (x, y-1) is NOT adjacent to it (distance 2). So test moving toward a cell adjacent to it: put the monster at (x, y-1)... done below.
    m.x = p.x + 1; m.y = p.y - 1;        // diagonal: not "engaged" by our 4-way rule
    const x0 = p.x; tryMove(-1, 0); if (p.x !== x0) moved++;
  }
  return moved;
})()`);
check('a horror only diagonally near you is not holding you', side === 100, side);
// 2. Monsters trying to get away from you
const mflee = H.run(`(() => {
  let got = 0;
  for (let i = 0; i < 300; i++) {
    const m = __setup('opinion', { fear: 5 }); const L = G.level, p = G.player;
    const dist = distanceMap(L, p.x, p.y); const x0 = m.x;
    flee(L, m, dist);
    if (Math.abs(m.x - p.x) + Math.abs(m.y - p.y) > 1) got++;
  }
  return { rate: got / 300, expected: escapeChance(1, 1) };
})()`);
check(`a scared horror only sometimes gets away from you (~${Math.round(mflee.expected * 100)}%)`, Math.abs(mflee.rate - mflee.expected) < 0.1, mflee);
const putaway = H.run(`(() => {
  let got = 0;
  for (let i = 0; i < 300; i++) {
    const m = __setup('putaway', { carry: makeItem('food', 'muffin') }); const L = G.level, p = G.player;
    flee(L, m, distanceMap(L, p.x, p.y));
    if (Math.abs(m.x - p.x) + Math.abs(m.y - p.y) > 1) got++;
  }
  return { rate: got / 300, expected: escapeChance(1.2, 1) };
})()`);
check(`a Put-Away with your stuff escapes only sometimes (~${Math.round(putaway.expected * 100)}%)`, Math.abs(putaway.rate - putaway.expected) < 0.1, putaway);
const shoved = H.run(`(() => {
  let ok = 0;
  for (let i = 0; i < 50; i++) { const m = __setup('opinion'); const p = G.player; if (moveMonster(G.level, m, m.x + 1, m.y, false)) ok++; }
  return ok;
})()`);
check('a rhyme can always shove a horror away (no roll)', shoved === 50, shoved);
// 3. The stairs while fighting
const stairs = H.run(`(() => {
  let left = 0, n = 200;
  for (let i = 0; i < n; i++) {
    const L = G.level; const m = __setup('opinion'); const p = G.player;
    L.tiles[idx(p.x, p.y)] = T.STAIRS;
    const depth = G.depth;
    const spent = tryDescend();
    if (G.depth !== depth) { left++; enterFloor(depth); toPlay(); G.cardQueue = []; }
    else if (!spent) return 'held but no turn spent';
  }
  return { rate: left / n, expected: escapeChance(1, 1) };
})()`);
check(`taking the stairs mid-fight works only sometimes (~${Math.round((stairs.expected || 0) * 100)}%)`, typeof stairs === 'object' && Math.abs(stairs.rate - stairs.expected) < 0.1, stairs);
// 4. The encounter card: leave a sleeper be for free; backing out of a fight is a gamble
const arrowFor = d => ({ '0,-1': 'ArrowUp', '1,0': 'ArrowRight', '0,1': 'ArrowDown', '-1,0': 'ArrowLeft' })[d];
H.run(`__setup('opinion', { awake: false })`);
let t0 = G.turn;
H.press('ArrowRight'); const enc1 = [G.mode, H.run('G.encounter && G.encounter.engaged')];
H.press('Escape');
check('bumping a sleeper: "leave it be" costs nothing and does not wake it', enc1[0] === 'encounter' && enc1[1] === false && G.turn === t0 && H.run('G.level.monsters[0].awake') === false, { enc1, turn: G.turn - t0 });
let backed = 0, stayedButSpent = 0;
for (let i = 0; i < 200; i++) {
  H.run(`__setup('opinion')`);
  const x0 = H.run('G.player.x'), tt = G.turn;
  H.press('ArrowRight'); H.press('Escape');
  if (H.run('G.player.x') !== x0) backed++; else if (G.turn === tt + 1) stayedButSpent++;
}
check('Esc in a fight: backing away works only sometimes, and a failure costs the turn', backed > 60 && backed < 160 && backed + stayedButSpent === 200, { backed, stayedButSpent });
// 5. The reaction card reports what happened, and waits for the blow to land
const card = H.run(`(() => {
  const m = __setup('opinion', { hp: 50, maxHp: 50 });
  let r = null;
  for (let i = 0; i < 40 && !(r && r.result === 'hit'); i++) { monsterAttack(m); r = G.threat; }
  return { result: r.result, dmg: r.dmg, verb: r.verb, stamped: typeof r.t === 'number' };
})()`);
check('the threat records how the blow landed (result, damage, verb, time)', card.result === 'hit' && card.dmg > 0 && !!card.verb && card.stamped, card);
if (out.length !== 16) check('all 16 checks ran', false, out.length);
finish();
