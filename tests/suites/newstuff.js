'use strict';
// Rooms (vignettes) on every floor and all 21 of their choices, the boss's three phases and the
// Last Rhyme, and the little animations (hops, lunges, scribbled-out deaths, ink stains, words).

const { createGame, checker } = require('./lib');

const H = createGame({ seed: Number(process.env.SEED) || 202 }), G = H.G;
const { check, finish } = checker('newstuff (rooms)');
const start = depth => {
  H.run('goTitle()'); H.press('Enter');
  for (let i = 0; i < 80 && G.mode !== 'play'; i++) { H.press('Enter'); H.tick(40); }
  if (depth > 1) H.run(`enterFloor(${depth}); toPlay();`);
  H.run('Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; }); G.cardQueue = [];');
};
start(1);
// 1. placement across many levels
const place = H.run(`(() => {
  const res = {};
  for (let d = 1; d <= 6; d++) {
    let levels = 0, withOne = 0, total = 0, bad = 0; const kinds = {};
    for (let k = 0; k < 60; k++) {
      enterFloor(d); toPlay();
      const L = G.level; levels++;
      if (L.fixtures.length) withOne++;
      total += L.fixtures.length;
      for (const f of L.fixtures) {
        kinds[f.kind] = (kinds[f.kind] || 0) + 1;
        const around = DIR8.every(([dx, dy]) => passable(L.tiles[idx(f.x + dx, f.y + dy)]));
        const onStart = f.x === L.start.x && f.y === L.start.y;
        const dist = distanceMap(L, L.start.x, L.start.y);
        const reachable = DIR4.some(([dx, dy]) => dist[idx(f.x + dx, f.y + dy)] < FAR);
        if (!around || onStart || !reachable) bad++;
      }
    }
    res[d] = { levels, withOne, total, bad, kinds };
  }
  return JSON.stringify(res);
})()`);
const placed = JSON.parse(place), pools = H.run('JSON.stringify(VIGNETTE_FLOORS)');
for (const [d, r] of Object.entries(placed)) {
  check(`floor ${d}: every level gets a room, never on the start, never boxed in`, r.bad === 0 && r.withOne === r.levels, r);
  check(`floor ${d}: only this floor's rooms appear, and all of them do`, JSON.stringify(Object.keys(r.kinds).sort()) === JSON.stringify(JSON.parse(pools)[d].slice().sort()), r.kinds);
}
// 2. every choice of every vignette
for (const kind of ['teaparty', 'birthday', 'mirror', 'lostfound', 'well', 'musicbox', 'namepile']) {
  const depth = { teaparty: 1, birthday: 2, mirror: 3, lostfound: 1, well: 3, musicbox: 5, namepile: 6 }[kind];
  for (let c = 0; c < 3; c++) {
    start(depth);
    const r = H.run(`(() => {
      const L = G.level, p = G.player;
      L.fixtures = [];
      const spot = freeTile(L, 0);
      const f = { kind: '${kind}', x: spot[0], y: spot[1], used: false, seen: false };
      L.fixtures.push(f);
      p.gold = 50; p.inv.push(makeItem('food', 'eggs'));
      const n = DIR4.find(([dx, dy]) => passable(L.tiles[idx(f.x + dx, f.y + dy)]) && !monsterAt(f.x + dx, f.y + dy));
      p.x = f.x + n[0]; p.y = f.y + n[1];
      const before = { hp: p.hp, gold: p.gold, inv: p.inv.length, wick: p.wick, verve: p.maxVerve, mons: L.monsters.length, dread: Math.round(p.dread) };
      tryMove(-n[0], -n[1]);
      const opened = G.mode;
      G.page.t0 = -1e9;
      chooseFixture(G.page, ${c});
      const res = G.page.result;
      toPlay(); endTurn();
      const after = { hp: p.hp, gold: p.gold, inv: p.inv.length, wick: p.wick, verve: p.maxVerve, mons: L.monsters.length, dread: Math.round(p.dread) };
      const again = (tryMove(-n[0], -n[1]), G.mode);
      return JSON.stringify({ opened, choice: res.choice, first: res.lines[0].slice(0, 60), used: f.used, reopen: again, mode: G.mode, changed: Object.keys(before).filter(k => before[k] !== after[k]) });
    })()`);
    const o = JSON.parse(r);
    check(`${kind} choice ${c + 1} ("${o.choice}"): opens the page, says what happened, then is used up`, o.opened === 'choice' && !!o.choice && o.first.length > 0 && o.used && o.reopen === 'play', o);
  }
}
// 3. boss phases and finale
start(6);
const boss = H.run(`(() => {
  const L = G.level, p = G.player, m = L.monsters.find(x => x.type === 'nibbler');
  L.monsters = [m];
  p.inv.push(makeItem('food', 'eggs'), makeItem('food', 'ham'), makeItem('potion', 'heal'));
  m.awake = true; m.hp = Math.round(m.maxHp * 0.6); bossThink(L, m);
  const p2 = { phase: m.phase, nib: G.uiNibble };
  let ate = 0; for (let i = 0; i < 40; i++) { const n = p.inv.length; bossThink(L, m); if (p.inv.length < n) ate++; }
  m.hp = Math.round(m.maxHp * 0.3); bossThink(L, m);
  const p3 = { phase: m.phase, nib: G.uiNibble, enraged: m.enraged };
  // kill blow: should open the Last Rhyme, not kill
  m.x = p.x + 1; m.y = p.y; m.hp = 1; m.stun = 5;
  G.player.baseAtk = 99; for (let i = 0; i < 30 && m.hp > 0 && G.mode !== 'rhyme'; i++) { G.mode = 'play'; playerAttack(m); }
  const modeAfterHit = G.mode, final = !!(G.rhyme && G.rhyme.final), bossAlive = L.monsters.includes(m);
  // answer wrong first
  G.rhyme.fuseT0 = 1; answerRhyme(G.rhyme.options.findIndex(o => o !== G.rhyme.answer)); finishRhyme();
  const afterWrong = { mode: G.mode, hpFrac: +(m.hp / m.maxHp).toFixed(2), alive: L.monsters.includes(m) };
  // then land the killing blow again and answer right
  m.hp = 1; m.stun = 5; for (let i = 0; i < 30 && G.mode !== 'rhyme'; i++) { G.mode = 'play'; playerAttack(m); }
  G.rhyme.fuseT0 = 1; answerRhyme(G.rhyme.options.indexOf(G.rhyme.answer)); finishRhyme();
  return JSON.stringify({ p2, ate, p3, modeAfterHit, final, bossAlive, afterWrong, end: G.mode, won: G.won });
})()`);
const b = JSON.parse(boss);
check('boss phase 2 below two thirds: it starts eating the page', b.p2.phase === 2 && b.p2.nib > 0, b.p2);
check('boss phase 2+: it eats things from your pockets', b.ate > 0, b.ate);
check('boss phase 3 below one third: enraged, eats more of the page', b.p3.phase === 3 && b.p3.enraged && b.p3.nib > b.p2.nib, b.p3);
check('the killing blow opens the Last Rhyme instead of killing it', b.modeAfterHit === 'rhyme' && b.final && b.bossAlive, b);
check('a wrong last word heals it to a quarter', b.afterWrong.alive && b.afterWrong.hpFrac === 0.25 && b.afterWrong.mode !== 'rhyme', b.afterWrong);
check('the right last word wins the game', b.end === 'win' && b.won === true, { end: b.end, won: b.won });
// 4. animation, deaths, stains, words, babble
start(1);
const anim = H.run(`(() => {
  const L = G.level, p = G.player;
  const dir = DIR4.find(([dx, dy]) => passable(L.tiles[idx(p.x + dx, p.y + dy)]) && !monsterAt(p.x + dx, p.y + dy) && !fixtureAt(L, p.x + dx, p.y + dy));
  draw(); const before = p.drawAt ? p.drawAt.slice() : null;
  tryMove(dir[0], dir[1]); endTurn();
  draw(); // the hop starts on the first frame after the move
  FX.now += 60; draw(); const mid = p.drawAt.slice();
  FX.now += 400; draw(); const end = p.drawAt.slice();
  const s = freeNeighbor(L, p.x, p.y); const m = spawnMonster(L, 'mite', s[0], s[1]); m.awake = true;
  computeFOV(L, p.x, p.y, lightRadius());
  G.player.baseAtk = 99; for (let i = 0; i < 30 && L.monsters.includes(m); i++) playerAttack(m);
  FX.now += 100; draw();
  const deaths = FX.deaths.length, stains = L.stains.length, lunge = !!p.lunge;
  FX.word(p.x + 3, p.y, 'tick…'); FX.now += 50; draw();
  onSpeak(m, 'hello there'); Sound.babble('hello', 'opinion', 0);
  return JSON.stringify({ before, mid, end, pos: [p.x, p.y], deaths, stains, lunge, words: FX.words.length });
})()`);
const a = JSON.parse(anim);
check('walking hops: halfway there mid-step, arrived after', JSON.stringify(a.mid) !== JSON.stringify(a.before) && JSON.stringify(a.end) !== JSON.stringify(a.mid), a);
check('a kill is scribbled out and leaves a stain', a.deaths >= 1 && a.stains >= 1, a);
check('attacking lunges', a.lunge, a);
check('sounds are written in the dark', a.words >= 1, a);
check('no console errors', !H.consoleLog.some(l => /^(warn|error)/.test(l)), H.consoleLog);
finish();
