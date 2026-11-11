'use strict';
// Real PNG screenshots of every screen, drawn by the real game code into a real (headless)
// canvas. Every group of shots starts a fresh game on a fixed seed, so the pictures are the same
// on every run on the same machine (fonts differ between machines, so baselines stay local).
//
//   node shots/shots.js [out dir]     default: tests/out/shots
//   SW=1280 SH=800 node shots/shots.js   another window size

const fs = require('fs');
const path = require('path');
const { createGame, arrowFor } = require('../harness');

const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'out', 'shots'));
const Wd = +process.env.SW || 1440, Ht = +process.env.SH || 900;

function game(seed) {
  const H = createGame({ seed, canvas: require('@napi-rs/canvas'), width: Wd, height: Ht, echoConsole: true });
  const G = H.G;
  const snap = name => { fs.writeFileSync(path.join(OUT, name + '.png'), H.png()); console.log('saved', name); };
  const toPlay = () => { H.press('x'); H.press('Enter'); for (let i = 0; i < 80 && G.mode !== 'play'; i++) { H.press('Enter'); H.tick(40); } };
  return { H, G, snap, toPlay, run: c => H.run('{' + c + '}'), press: k => H.press(k), tick: ms => H.tick(ms) };
}

const groups = {
  // The title, the story, the first floor, the margin, Dread, every floor, pages, pockets, help, the stone.
  main() {
    const { G, snap, run, press, tick } = game(1);
    tick(100); snap('01-splash');
    press('x'); tick(600); snap('02-title');
    press('Enter'); tick(5200); snap('03-story');
    for (let i = 0; i < 12 && G.mode === 'story'; i++) press('Enter');
    tick(9000); snap('04-floorcard');
    for (let i = 0; i < 12 && G.mode === 'floorcard'; i++) press('Enter');
    tick(300);
    run(`const L = G.level, p = G.player; L.monsters = [];
      const spots = []; for (let dy = -3; dy <= 3; dy++) for (let dx = -4; dx <= 4; dx++) { const x = p.x + dx, y = p.y + dy; if ((dx || dy) && inMap(x, y) && passable(L.tiles[idx(x, y)])) spots.push([x, y]); }
      const types = ['mite', 'bat', 'putaway', 'opinion', 'zombie'];
      types.forEach((t, i) => { const s = spots[i * 3 % spots.length]; if (s) { const m = spawnMonster(L, t, s[0], s[1]); m.awake = true; } });
      [['potion','heal'],['scroll','map'],['food','eggs'],['candle'],['gold']].forEach((k, i) => { const s = spots[(i * 3 + 1) % spots.length]; if (s) dropItem(L, s[0], s[1], k[0] === 'gold' ? goldPile(1) : k[0] === 'candle' ? {kind:'candle'} : makeItem(k[0], k[1])); });
      G.seenTypes = {mite:1,bat:1,putaway:1,opinion:1,zombie:1}; computeFOV(L, p.x, p.y, lightRadius()); FX.say(L.monsters[1], 'Ooh, a CANDLE! I love candles!', L.monsters[1].d.color);`);
    tick(400); snap('05-play-floor1');
    run(`const p = G.player; p.gear.hand = makeItem('weapon', 2); p.gear.hand.plus = 1; p.gear.body = makeItem('armor', 1); p.gear.head = makeItem('armor', 0); p.poisoned = 4; p.confused = 3; p.gold = 142; p.xp = 7; p.verve = 2;
      p.inv.push(makeItem('scroll', 'fear'), makeItem('food', 'ham'), {kind:'sock', id:'argyle'}, makeItem('potion', 'sight'), makeItem('weapon', 0));
      G.level.monsters[3].hp = 4; G.level.monsters[0].hp = 2; G.logMark = G.log.length; msg('You whack the Second Opinion with a thwack! (5)'); msg('The Second Opinion gnaws you! (-3)', C.red); msg('It drops what it stole. Finders keepers, Put-Away weepers!', C.yellow);`);
    tick(300); snap('05b-status');
    run(`const L = G.level, p = G.player; L.monsters.forEach((m, i) => { const x = p.x - 2 + i, y = p.y - 3; if (inMap(x, y) && passable(L.tiles[idx(x, y)])) { m.x = x; m.y = y; } });
      computeFOV(L, p.x, p.y, lightRadius()); G.logMark = G.log.length; msg('Something in the dark hums a lullaby.', C.purple); msg('You spot a Second Opinion. All teeth, no manners.', MONSTERS.opinion.color);`);
    tick(300); snap('05c-caption-crowd-above');
    run('G.player.dread = 88; G.player.wick = 60; G.player.hp = 6; computeFOV(G.level, G.player.x, G.player.y, lightRadius());');
    tick(400); snap('06-play-dread');
    run('G.player.dread = 0; G.player.wick = 300; G.player.hp = 20');
    for (const d of [2, 3, 4, 5, 6]) {
      run(`enterFloor(${d}); G.mode = 'play'; G.back = 'play'; G.page = null; G.cardQueue = [];
        const L = G.level, p = G.player; L.monsters = [];
        const spots = []; for (let dy = -3; dy <= 3; dy++) for (let dx = -4; dx <= 4; dx++) { const x = p.x + dx, y = p.y + dy; if ((dx || dy) && inMap(x, y) && passable(L.tiles[idx(x, y)])) spots.push([x, y]); }
        const types = { 2: ['opinion', 'bat'], 3: ['wraith', 'mimic', 'zombie'], 4: ['thing', 'wraith'], 5: ['tot', 'giraffe', 'tuck'], 6: ['nibbler', 'giraffe', 'sockling'] }[${d}];
        types.forEach((t, i) => { const s = spots[(i * 5 + 2) % spots.length]; if (s) { const m = spawnMonster(L, t, s[0], s[1]); m.awake = true; m.disguised = false; } });
        if (${d} === 4) { for (let i = 0; i < 40; i++) tideTurn(L), L.turnsHere += 8; }
        revealMap(L); computeFOV(L, p.x, p.y, lightRadius());`);
      tick(300); snap('07-floor' + d);
    }
    for (const t of ['opinion', 'tuck', 'nibbler']) { run(`showBeastPage('${t}')`); tick(12000); snap('08-beast-' + t); }
    run('toPlay(); G.player.verve = 3; startRhyme();'); tick(4500); snap('09-rhyme');
    press('ArrowUp'); tick(300); snap('10-rhyme-result');
    tick(2000);
    run(`G.player.inv.push(makeItem('weapon', 1), makeItem('armor', 0), makeItem('potion', 'poison'), {kind:'sock', id:'argyle'}); G.mode = 'play';`);
    press('i'); tick(100); snap('11-pockets'); press('Escape');
    press('?'); tick(100); snap('12-help'); press('x');
    press('l'); tick(100); snap('12b-log'); press('x');
    run(`G.killer = 'a Second Opinion'; G.player.hp = 0; die();`); tick(16000); snap('13-tomb');
    press('g'); tick(200); snap('14-graveyard'); press('Escape');
    press('t'); tick(600); snap('15-title-after-a-death');
    press('b'); tick(300); snap('16-bestiary-book');
  },
  // Each room on the map, a room's page before and after choosing, a scribbled death, the boss.
  rooms() {
    const { snap, run, tick, toPlay } = game(2);
    tick(100); toPlay();
    for (const [kind, depth] of [['teaparty', 1], ['birthday', 2], ['mirror', 3], ['lostfound', 1], ['well', 3], ['musicbox', 5], ['namepile', 6]]) {
      run(`enterFloor(${depth}); toPlay(); G.cardQueue = [];
        const L = G.level, p = G.player; L.monsters = []; L.fixtures = [];
        let spot = null;
        for (const r of L.rooms) { if (r.w >= 5 && r.h >= 4) { const c = center(r); if (DIR8.every(([dx, dy]) => passable(L.tiles[idx(c.x + dx, c.y + dy)])) && passable(L.tiles[idx(c.x, c.y)])) { spot = c; break; } } }
        if (!spot) spot = { x: freeTile(L, 0)[0], y: freeTile(L, 0)[1] };
        L.fixtures.push({ kind: '${kind}', x: spot.x, y: spot.y, used: false, seen: true });
        p.x = spot.x - 2; p.y = spot.y + 1; if (!passable(L.tiles[idx(p.x, p.y)])) { p.x = spot.x; p.y = spot.y + 1; }
        computeFOV(L, p.x, p.y, lightRadius()); updateCamera(true); G.logMark = G.log.length;`);
      tick(300); snap('20-room-' + kind);
    }
    run(`const f = G.level.fixtures[0]; f.kind = 'birthday'; showChoicePage(f); G.page.t0 = -1e9;`);
    tick(200); snap('21-choice-page');
    run('chooseFixture(G.page, 1);'); tick(700); snap('22-choice-result');
    run('toPlay();');
    run(`enterFloor(2); toPlay(); G.cardQueue = []; const L = G.level, p = G.player; L.monsters = [];
      const s = freeNeighbor(L, p.x, p.y); const m = spawnMonster(L, 'opinion', s[0], s[1]); m.awake = true; computeFOV(L, p.x, p.y, lightRadius()); updateCamera(true);
      p.baseAtk = 99; G.logMark = G.log.length; for (let i = 0; i < 20 && L.monsters.includes(m); i++) playerAttack(m);
      FX.word(p.x + 5, p.y - 2, 'tick…'); FX.word(p.x - 6, p.y + 1, 'rustle'); FX.word(p.x + 2, p.y - 5, '♪'); FX.word(p.x - 3, p.y - 4, 'psst…');`);
    tick(200); snap('23-scribble-and-words');
    tick(1500); snap('24-stain-after');
    run(`enterFloor(6); toPlay(); G.cardQueue = []; const L = G.level, p = G.player, m = L.monsters.find(x => x.type === 'nibbler');
      L.monsters = [m]; m.awake = true; m.x = p.x + 2; m.y = p.y; if (!passable(L.tiles[idx(m.x, m.y)])) { m.x = p.x; m.y = p.y - 2; }
      p.inv.push(makeItem('food', 'ham'), makeItem('scroll', 'fear')); m.hp = Math.round(m.maxHp * 0.3); bossThink(L, m); bossThink(L, m);
      computeFOV(L, p.x, p.y, lightRadius()); updateCamera(true);`);
    tick(400); snap('25-boss-phase3');
    run('const m = G.level.monsters[0]; startFinale(m);'); tick(6000); snap('26-last-rhyme');
    run('G.rhyme.fuseT0 = 1; answerRhyme(G.rhyme.options.indexOf(G.rhyme.answer)); finishRhyme();'); tick(30000); snap('27-the-end');
  },
  // Meeting a horror: the encounter card, the reaction card, pockets aimed at it, the equipment page.
  cards() {
    const { G, H, snap, run, press, tick, toPlay } = game(3);
    tick(100); toPlay();
    run(`Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; }); G.cardQueue = [];
      const L = G.level, p = G.player; L.monsters = []; L.fixtures = [];
      p.gear.hand = makeItem('weapon', 2); p.gear.head = makeItem('armor', 0); p.gear.body = makeItem('armor', 1); p.gear.feet = { kind: 'pair', id: 'argyle' };
      p.inv.push(makeItem('potion', 'poison'), makeItem('armor', 2), makeItem('weapon', 1));
      const d = DIR4.find(([dx, dy]) => passable(L.tiles[idx(p.x + dx, p.y + dy)]));
      globalThis.__d = d;
      const m = spawnMonster(L, 'opinion', p.x + d[0], p.y + d[1]); m.awake = true; m.hp = 6; globalThis.__m = m;
      const d2 = DIR4.find(([dx, dy]) => (dx !== d[0] || dy !== d[1]) && passable(L.tiles[idx(p.x + dx, p.y + dy)]));
      if (d2) dropItem(L, p.x + d2[0], p.y + d2[1], makeItem('scroll', 'map'));
      computeFOV(L, p.x, p.y, lightRadius()); updateCamera(true);`);
    tick(300);
    const arrow = arrowFor(H.run('__d'));
    press(arrow); tick(300); snap('40-encounter');
    press('Escape'); tick(100);
    run(`G.player.hp = 99; G.player.maxHp = 99; G.threat = { m: __m, turn: G.turn }; G.logMark = G.log.length; msg('The Second Opinion gnaws you! (-3)', C.red);`);
    tick(300); snap('41-reaction');
    press('u'); tick(200); snap('42-pockets-aimed');
    press('Escape'); press('e'); tick(200); snap('43-equipment');
    press('ArrowDown'); tick(100); snap('44-equipment-head');
    press('Escape');
    run(`const L = G.level, p = G.player; L.monsters = []; G.threat = null; const d = DIR4.find(([dx, dy]) => passable(L.tiles[idx(p.x + dx, p.y + dy)]) && !L.items.some(i => i.x === p.x + dx && i.y === p.y + dy));
      dropItem(L, p.x + d[0], p.y + d[1], makeItem('food', 'ham')); dropItem(L, p.x + d[0], p.y + d[1], {kind: 'sock', id: 'stripy'}); globalThis.__d2 = d;`);
    press(arrowFor(H.run('__d2'))); tick(300); snap('45-item-here');
    run(`const L = G.level, p = G.player; L.monsters = []; L.fixtures = []; G.threat = null;
      const d = DIR4.find(([dx, dy]) => passable(L.tiles[idx(p.x + dx, p.y + dy)]) && !L.items.some(i => i.x === p.x + dx && i.y === p.y + dy));
      globalThis.__d = d; p.hp = p.maxHp = 60;
      const m = spawnMonster(L, 'opinion', p.x + d[0], p.y + d[1]); m.awake = true; m.hp = 6; globalThis.__m = m;
      computeFOV(L, p.x, p.y, lightRadius()); updateCamera(true);`);
    tick(300);
    run(`G.logMark = G.log.length; for (let i = 0; i < 40; i++) { monsterAttack(__m); if (G.threat.result === 'hit') break; }`);
    snap('50-blow-landing');
    tick(400); snap('51-card-after-blow');
    const a2 = arrowFor(H.run('__d'));
    press(a2); tick(200); snap('52-encounter-fighting');
    press('Escape'); tick(100);
    run(`__m.awake = false; __m.x = G.player.x + __d[0]; __m.y = G.player.y + __d[1]; G.threat = null; computeFOV(G.level, G.player.x, G.player.y, lightRadius());`);
    if (G.mode === 'play') { press(a2); tick(200); snap('53-encounter-sleeping'); }
  },
};

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.env.SHOTS ? process.env.SHOTS.split(',') : Object.keys(groups);
  for (const name of only) groups[name]();
  console.log(`shots: wrote ${fs.readdirSync(OUT).filter(f => f.endsWith('.png')).length} PNGs to ${path.relative(process.cwd(), OUT) || '.'}`);
}

if (require.main === module) main();
module.exports = { game };
