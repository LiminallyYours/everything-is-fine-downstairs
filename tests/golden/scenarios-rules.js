'use strict';
// The numbers behind the game, measured from the outside: many quick trials of each chance and
// rule, each written down as one summary line (counts of what happened). A change to almost any
// tuning number (a hit chance, an escape odd, a loot weight, the candle, Dread, bedtime, the XP
// curve...) moves at least one of these counts, even when no text changes.
//
// The individual messages of these trials are not recorded (they are covered elsewhere); only
// the summaries, written as "=" lines.

module.exports = (add) => {
  const tally = (c, label, code) => {
    const r = c.rec.quietly(() => c.H.run(code));
    c.rec.push(`= ${label}: ${typeof r === 'string' ? r : JSON.stringify(r)}`);
  };

  // A fresh, roomy spot with the player in it and (optionally) one horror next door, in-game code.
  // The log keeps only its last 300 lines, so "what was said since" goes by the last line seen.
  const SETUP = `globalThis.__said = () => { const last = G.log[G.log.length - 1]; return () => G.log.slice(G.log.lastIndexOf(last) + 1).map(l => l.text); };
  globalThis.__arena = (type, opts) => {
    const L = G.level, p = G.player;
    for (let tries = 0; tries < 500; tries++) {
      const s = freeTile(L, 0); if (!s) continue;
      const [x, y] = s;
      if (!DIR8.every(([dx, dy]) => passable(L.tiles[idx(x + dx, y + dy)]) && L.tiles[idx(x + dx, y + dy)] !== T.STAIRS && !fixtureAt(L, x + dx, y + dy))) continue;
      L.monsters = []; L.items = []; L.fixtures = []; L.phantoms = []; L.stalker = null;
      p.x = x; p.y = y; p.hidden = false; p.confused = 0; p.poisoned = 0; p.hp = p.maxHp = 9999;
      G.mode = 'play'; G.threat = null; G.cardQueue = [];
      if (!type) { computeFOV(L, p.x, p.y, lightRadius()); return null; }
      const m = spawnMonster(L, type, x + 1, y);
      Object.assign(m, { awake: true, stun: 0, hp: 9999, maxHp: 9999 }, opts || {});
      computeFOV(L, p.x, p.y, lightRadius());
      return m;
    }
  };`;

  add('rules', 141, c => {
    c.newGame();
    c.quiet();
    c.H.run(SETUP);
    // combat: your blows and theirs
    tally(c, 'your attacks on a Second Opinion, 600 swings (hits, total damage, by attack 3 and 9)', `(() => {
      const out = [];
      for (const atk of [3, 9]) { G.player.baseAtk = atk; let hits = 0, dmg = 0;
        for (let i = 0; i < 300; i++) { const m = __arena('opinion'); const h = m.hp; playerAttack(m); if (m.hp < h) { hits++; dmg += h - m.hp; } }
        out.push([atk, hits, dmg]); }
      G.player.baseAtk = 3; return out; })()`);
    tally(c, 'blows against you, 400 per horror (hits, damage), defense 0 and 3', `(() => {
      const out = {};
      for (const type of Object.keys(MONSTERS).filter(t => t !== 'tuck')) for (const def of [0, 3]) {
        G.player.baseDef = def; let hits = 0, dmg = 0;
        for (let i = 0; i < 200; i++) { const m = __arena(type, { disguised: false }); const p = G.player; p.inv = []; p.gold = 0; const h = p.hp; monsterAttack(m); if (p.hp < h) { hits++; dmg += h - p.hp; } }
        out[type + '/' + def] = [hits, dmg]; }
      G.player.baseDef = 0; return out; })()`);
    tally(c, 'what else a blow does, 300 each (bat and wraith snuff the candle, a Put-Away steals, the Nibbler eats a rhyme, the Tuck-You-In)', `(() => {
      const out = {};
      for (const type of ['bat', 'wraith', 'putaway', 'nibbler', 'tuck']) { let snuffed = 0, stolen = 0, rhymes = 0, wick = 0, dread = 0;
        for (let i = 0; i < 300; i++) { const m = __arena(type); const p = G.player; p.wick = 300; p.verve = 3; p.dread = 0; p.inv = [makeItem('food', 'muffin')]; p.gold = 30;
          monsterAttack(m); if (p.wick < 300) snuffed++; wick += 300 - p.wick; if (m.carry) stolen++; rhymes += 3 - p.verve; dread += p.dread; }
        out[type] = [snuffed, wick, stolen, rhymes, Math.round(dread)]; }
      return out; })()`);
    tally(c, 'the Empty Sandwich splitting, 300 hits', `(() => { let splits = 0;
      for (let i = 0; i < 300; i++) { const m = __arena('thing', { hp: 14, maxHp: 14 }); G.player.baseAtk = 5; playerAttack(m); if (G.level.monsters.length > 1) splits++; }
      G.player.baseAtk = 3; return splits; })()`);
    tally(c, 'loot from kills, 400 Mold-Mites killed on floor 2 (coin drops, total coins, xp)', `(() => { let drops = 0, coins = 0; const xp0 = G.player.xp;
      for (let i = 0; i < 400; i++) { const m = __arena('mite', { hp: 1 }); G.player.baseAtk = 50; playerAttack(m); if (G.level.monsters.length) playerAttack(m);
        const g = G.level.items.find(it => it.item.kind === 'gold'); if (g) { drops++; coins += g.item.amount; } }
      G.player.baseAtk = 3; return [drops, coins, G.player.level, G.player.xp, G.player.xpNext, G.player.maxHp, G.player.baseAtk, G.player.maxVerve]; })()`);
    // getting away
    tally(c, 'walking away from a fight, 400 tries each (got away)', `(() => { const out = {};
      for (const [type, opts] of [['opinion'], ['zombie'], ['tot'], ['bat'], ['sockling'], ['tuck'], ['opinion', { enraged: true }], ['opinion', { stun: 3 }], ['opinion', { awake: false }], ['opinion', { fear: 3 }]]) {
        let away = 0;
        for (let i = 0; i < 400; i++) { __arena(type, opts); const p = G.player, x0 = p.x; tryMove(-1, 0); if (p.x !== x0) away++; }
        out[type + (opts ? JSON.stringify(opts) : '')] = away; }
      return out; })()`);
    tally(c, 'horrors trying to get away from you, 400 tries each (got away)', `(() => { const out = {};
      for (const [type, opts] of [['opinion', { fear: 5 }], ['bat', { fear: 5 }], ['zombie', { fear: 5 }], ['putaway', { carry: { kind: 'gold', amount: 5 } }]]) {
        let got = 0;
        for (let i = 0; i < 400; i++) { const m = __arena(type, opts); flee(G.level, m, distanceMap(G.level, G.player.x, G.player.y)); if (manhattan(m, G.player) > 1) got++; }
        out[type] = got; }
      return out; })()`);
    tally(c, 'taking the stairs mid-fight, 300 tries (got away)', `(() => { let left = 0; const depth = G.depth;
      for (let i = 0; i < 300; i++) { __arena('opinion'); G.level.tiles[idx(G.player.x, G.player.y)] = T.STAIRS; tryDescend(); if (G.depth !== depth) { left++; enterFloor(depth); G.mode = 'play'; } }
      return left; })()`);
    // rhymes
    tally(c, 'bad rhymes, 300 (laugh / offend / confuse / mite / no room)', `(() => { const out = {};
      for (let i = 0; i < 300; i++) { __arena('opinion'); const said = __said(); G.player.confused = 0; rhymeMiss('Gerald');
        const t = said().join(' '); const k = /laugh/.test(t) ? 'laugh' : /OFFENDED/.test(t) ? 'offend' : /confuse yourself/.test(t) ? 'confuse' : /Mold-Mite/.test(t) ? 'mite' : 'other'; out[k] = (out[k] || 0) + 1; }
      return out; })()`);
    tally(c, 'good rhymes, 200 (total damage to a Second Opinion, stun)', `(() => { let dmg = 0, stun = 0;
      for (let i = 0; i < 200; i++) { const m = __arena('opinion', { hp: 50, maxHp: 50 }); rhymeHit(); dmg += 50 - m.hp; stun += m.stun; }
      return [dmg, stun]; })()`);
    tally(c, 'the rhyme fuse and the Last Rhyme fuse, by Dread tier (ms)', `(() => { const out = [];
      for (const d of [0, 30, 55, 80]) { __arena(); G.player.dread = d; G.player.verve = 3; startRhyme(); out.push(G.rhyme.ms); G.mode = 'play'; G.page = null; }
      const L = G.level; const m = spawnMonster(L, 'nibbler', G.player.x + 2, G.player.y); startFinale(m); out.push(G.rhyme.ms); G.mode = 'play'; G.page = null; L.monsters = [];
      return out; })()`);
    // food, potions, scrolls
    tally(c, 'eating, 300 of each food from 1 health (spoiled, total healed)', `(() => { const out = {};
      for (const f of FOODS) { let bad = 0, healed = 0;
        for (let i = 0; i < 300; i++) { __arena(); const p = G.player; p.hp = 1; p.maxHp = 60; p.poisoned = 0; eat(makeItem('food', f.id)); if (p.poisoned) bad++; healed += p.hp - 1; }
        out[f.id] = [bad, healed]; }
      return out; })()`);
    tally(c, 'drinking each potion on floor 2 (health, max, attack, poison, confusion, sensing)', `(() => { const out = {};
      for (const x of POTIONS) { __arena(); const p = G.player; p.hp = 5; p.maxHp = 60; p.poisoned = 0; p.confused = 0; p.sensing = 0; p.baseAtk = 3;
        drink(makeItem('potion', x.id)); out[x.id] = [p.hp, p.maxHp, p.baseAtk, p.poisoned, p.confused, p.sensing]; }
      G.player.baseAtk = 3; return out; })()`);
    tally(c, 'throwing each potion at a Second Opinion with 5 health (hp, poison, dazed, bonus, fear)', `(() => { const out = {};
      for (const x of POTIONS) { const m = __arena('opinion', { hp: 5, maxHp: 9 }); G.player.inv = [makeItem('potion', x.id)]; throwPotion(0, m);
        out[x.id] = [m.hp, m.poison || 0, m.dazed || 0, m.bonusAtk || 0, m.fear || 0]; }
      return out; })()`);
    tally(c, 'scrolls of lightning, 200 (total damage), and summoning, 200 (horrors summoned)', `(() => { let dmg = 0, summoned = 0;
      for (let i = 0; i < 200; i++) { const m = __arena('opinion', { hp: 50, maxHp: 50 }); readScroll(makeItem('scroll', 'smite')); dmg += 50 - m.hp; }
      for (let i = 0; i < 200; i++) { __arena(); readScroll(makeItem('scroll', 'summon')); summoned += G.level.monsters.length; }
      return [dmg, summoned]; })()`);
    // levels, health, rhymes coming back, the candle
    tally(c, 'the experience curve: xp needed for levels 2-12, and what each level gives', `(() => { __arena(); const p = G.player; p.level = 1; p.xp = 0; p.xpNext = 12; p.maxHp = 24; p.hp = 24; p.baseAtk = 3; p.maxVerve = 3;
      const out = []; for (let i = 0; i < 11; i++) { out.push(p.xpNext); gainXp(p.xpNext); } out.push([p.maxHp, p.hp, p.baseAtk, p.maxVerve]);
      p.level = 1; p.xp = 0; p.xpNext = 12; p.maxHp = 24; p.hp = 24; p.baseAtk = 3; p.maxVerve = 3; return out; })()`);
    tally(c, 'healing on your own and rhymes coming back: health and rhymes every 10 turns, levels 1 and 7', `(() => { const out = [];
      for (const lvl of [1, 7]) { __arena(); const p = G.player; p.level = lvl; p.maxHp = 40; p.hp = 1; p.verve = 0; p.maxVerve = 3; p.regenTimer = 0; p.verveTimer = 0; const row = [];
        for (let t = 1; t <= 90; t++) { tickStatus(); if (t % 10 === 0) row.push(p.hp + '/' + p.verve); } out.push(row.join(' ')); }
      G.player.level = 1; return out; })()`);
    tally(c, 'how far you can see, by candle (wick 0..450 in steps of 25) on floors 1-6', `(() => { const out = []; const p = G.player, depth = G.depth;
      for (let d = 1; d <= 6; d++) { G.level = { depth: d, floor: FLOORS[d - 1] }; const row = []; for (let w = 0; w <= 450; w += 25) { p.wick = w; row.push(lightRadius()); } out.push(row.join('')); }
      enterFloor(depth); G.mode = 'play'; p.wick = 300; return out; })()`);
    tally(c, 'the candle over 120 turns, and candle stubs (wick after each)', `(() => { __arena(); const p = G.player, L = G.level; p.wick = 130; const out = [];
      for (let t = 0; t < 120; t++) floorTurn(L); out.push(p.wick);
      meltStub(); out.push(p.wick); p.wick = 400; meltStub(); out.push(p.wick); return out; })()`);
    tally(c, 'Dread after 20 turns from 50, by situation', `(() => { const out = {};
      const cases = { lit: () => {}, dark: p => { p.wick = 0; }, hurt: p => { p.hp = 1; p.maxHp = 40; }, hidden: p => { p.hidden = true; },
        socks: p => { p.gear.feet = { kind: 'pair', id: 'argyle' }; }, watched: () => { const m = spawnMonster(G.level, 'opinion', G.player.x + 1, G.player.y); m.awake = true; } };
      for (const [name, f] of Object.entries(cases)) { __arena(); const p = G.player; p.wick = 300; p.dread = 50; p.gear.feet = null; f(p); computeFOV(G.level, p.x, p.y, lightRadius());
        for (let t = 0; t < 20; t++) { tickDread(G.level); p.dread = Math.max(p.dread, 0); } out[name] = +p.dread.toFixed(2); p.hp = p.maxHp = 9999; p.hidden = false; p.gear.feet = null; }
      return out; })()`);
    tally(c, 'Dread: hallucinations and whispers over 300 turns at dread 90 (phantoms seen, whispers, eyes)', `(() => { __arena(); const p = G.player, L = G.level; let phantoms = 0, whispers = 0; const seen = new Set();
      for (let t = 0; t < 300; t++) { p.dread = 90; const said = __said(); tickDread(L); L.phantoms.forEach(ph => seen.add(ph)); whispers += said().filter(t => t.startsWith('"')).length; }
      let eyes = 0; G.mode = 'play'; for (let f = 0; f < 2000; f++) { const n = FX.eyes.length; dreadFrame(34); if (FX.eyes.length > n) eyes++; }
      return [seen.size, whispers, eyes]; })()`);
    // floors: rules, generation, bedtime
    tally(c, 'barrels, 400 climbed into (mite, something, nothing)', `(() => { const out = { mite: 0, thing: 0, none: 0 }; enterFloor(1); G.mode = 'play';
      const L = G.level; let b = null; for (let i = 0; i < L.tiles.length && !b; i++) if (L.tiles[i] === T.PROP) b = [i % MAP_W, (i / MAP_W) | 0];
      for (let i = 0; i < 400; i++) { L.monsters = []; L.searched = new Set(); G.player.inv = []; const said = __said(); enterBarrel(L, b[0], b[1]);
        const t = said().join(' '); if (/Mold-Mite/.test(t)) out.mite++; else if (/Someone left/.test(t)) out.thing++; else out.none++; }
      G.player.hidden = false; return out; })()`);
    tally(c, 'the tide on floor 4: water tiles every 40 turns', `(() => { enterFloor(4); G.mode = 'play'; const L = G.level; const out = [];
      for (let t = 1; t <= 400; t++) { L.turnsHere = t; tideTurn(L); if (t % 40 === 0) { let w = 0; for (const x of L.tiles) if (x === T.WATER || x === T.DEEP) w++; out.push(w); } }
      return out.join(' '); })()`);
    tally(c, 'the clock on floor 5: strikes, warnings and dark turns over 200 turns', `(() => { enterFloor(5); G.mode = 'play'; const L = G.level; const out = [];
      for (let t = 1; t <= 200; t++) { const said = __said(); G.player.darkTurns = 0; clockTurn(L); const msgs = said().join(' ');
        if (msgs) out.push(t + (/BONG/.test(msgs) ? 'B' + G.player.darkTurns : 'w')); }
      return out.join(' '); })()`);
    tally(c, 'the walls on floor 6: 2000 turns next to a wall (bites, self-bites)', `(() => { enterFloor(6); G.mode = 'play'; const L = G.level, p = G.player; L.monsters = [];
      for (let k = 0; k < L.tiles.length; k++) { const x = k % MAP_W, y = (k / MAP_W) | 0; if (L.tiles[k] === T.FLOOR && DIR4.some(([dx, dy]) => L.tiles[idx(x + dx, y + dy)] === T.WALL)) { p.x = x; p.y = y; break; } }
      let bites = 0, self = 0; p.hp = p.maxHp = 99999;
      for (let t = 1; t <= 2000; t++) { L.turnsHere = t; const said = __said(); chewTurn(L); const s = said().join(' '); if (/BITES/.test(s)) bites++; if (/itself/.test(s)) self++; }
      return [bites, self, p.hp]; })()`);
    tally(c, 'socks rising: 200 times, the number of Socklings', `(() => { enterFloor(3); G.mode = 'play'; const L = G.level, p = G.player; let n = 0; const tiles = L.tiles.slice();
      for (let i = 0; i < 200; i++) { L.tiles.set(tiles); L.monsters = []; G.cardQueue = []; socksRise(L); n += L.monsters.length; }
      return n; })()`);
    tally(c, 'bedtime, by floor: turn of the first music-box warning, the second, and the arrival; then its speed', `(() => { const out = {};
      for (let d = 1; d <= 5; d++) { enterFloor(d); G.mode = 'play'; const L = G.level; L.monsters = []; const marks = [];
        for (let t = 0; t < 400 && !L.stalker; t++) { const said = __said(); stalkerTick(L); L.turnsHere++; if (said().length) marks.push(L.turnsHere - 1); }
        const s = L.stalker; const speeds = []; for (let t = 0; t < 300; t += 100) { L.turnsHere += 100; stalkerTick(L); speeds.push(+s.speed.toFixed(3)); }
        out[d] = marks.concat(speeds); }
      return out; })()`);
    tally(c, 'what the floors are made of: 25 new floors each (rooms, monsters by kind, items by kind, rooms by kind, candles, socks)', `(() => { const out = {};
      for (let d = 1; d <= 6; d++) { const tally = {}; const inc = k => { tally[k] = (tally[k] || 0) + 1; };
        for (let i = 0; i < 25; i++) { enterFloor(d); const L = G.level; inc('rooms:' + L.rooms.length);
          for (const m of L.monsters) inc('m:' + m.type + (m.awake ? '!' : ''));
          for (const it of L.items) inc('i:' + (it.item.kind === 'gold' ? 'gold' + it.item.amount : it.item.kind === 'weapon' || it.item.kind === 'armor' ? it.item.name : it.item.kind + ':' + (it.item.id || '')));
          for (const f of L.fixtures) inc('f:' + f.kind); }
        out[d] = Object.keys(tally).sort().map(k => k + '=' + tally[k]).join(' '); }
      enterFloor(2); G.mode = 'play'; return out; })()`);
    tally(c, 'ghosts: 100 visits to floor 2 with three unlooted graves there (ghosts met)', `(() => { const saved = Store.load('graveyard', []);
      Store.save('graveyard', [1, 2, 3].map(r => ({ run: 900 + r, depth: 2, won: false, killer: 'a Put-Away', epitaph: ['a', 'b'], bones: [] })));
      let n = 0; for (let i = 0; i < 100; i++) { enterFloor(2); n += G.level.ghosts.length; }
      Store.save('graveyard', saved); enterFloor(2); G.mode = 'play'; return n; })()`);
    tally(c, 'the boss: 300 thoughts each in phases 2 and 3 (things eaten, rhymes eaten, helpers summoned)', `(() => { enterFloor(6); G.mode = 'play'; const out = [];
      for (const frac of [0.5, 0.2]) { const L = G.level, p = G.player; const m = L.monsters.find(x => x.type === 'nibbler'); let ate = 0, rhymes = 0, summons = 0;
        for (let i = 0; i < 300; i++) { L.monsters = [m]; m.hp = Math.round(m.maxHp * frac); p.inv = [makeItem('food', 'muffin')]; p.verve = 3; bossThink(L, m); ate += 1 - p.inv.length; rhymes += 3 - p.verve; summons += L.monsters.length - 1; }
        out.push([ate, rhymes, summons, m.phase, G.uiNibble]); }
      return out; })()`);
    tally(c, 'a monster asleep, 1000 turns (steps it wandered)', `(() => { const m = __arena('opinion', { awake: false }); let moves = 0;
      for (let i = 0; i < 1000; i++) { const x = m.x, y = m.y; G.player.x = 1; G.player.y = 1; monsterAct(G.level, m, distanceMap(G.level, 1, 1)); if (m.x !== x || m.y !== y) moves++; m.awake = false; }
      return moves; })()`);
  });
};
