'use strict';
// Forced scenarios: every room and choice, rhyme duels, items, every monster, encounters and
// escapes, each floor's rule, Dread, bedtime, the boss and the Last Rhyme, deaths and epitaphs,
// the running gags, and every line of monster speech.

module.exports = (add) => {
  // ---------------------------------------------------------------------------------------
  // Every room, every choice, and every way each choice can go.
  const ROOMS = [
    // [kind, floor, [[choice index, label, setup code, forced random values, armed picks], ...]]
    ['teaparty', 1, [
      [0, 'the tea is lovely', '', [0.1]], [0, 'the tea is poisoned', '', [0.7]], [0, 'the tea is far too calming', '', [0.9]],
      [1, '', '', []], [2, '', '', []]]],
    ['birthday', 2, [
      [0, 'wish: a rhyme', '', [0.1]], [0, 'wish: knowing', '', [0.5]], [0, 'wish: bigger', '', [0.9]],
      [1, '', '', []], [2, 'lemon cake', '', [0.9]], [2, 'wax cake', '', [0.1]]]],
    ['mirror', 3, [
      [0, 'with full pockets', '', []], [0, 'with empty pockets', 'G.player.inv = [];', []],
      [1, '', '', []], [2, '', '', []]]],
    ['lostfound', 1, [
      ...[0, 1, 2, 3, 4, 5, 6].map(i => [0, `name tag ${i + 1}`, '', [], [['ALIASES', i]]]),
      [1, 'something to hand in', '', []], [1, 'nothing to hand in', 'G.player.inv = [];', []],
      [2, '', '', []],
      [2, 'nobody can come', '', [], [], 'for (const [dx, dy] of DIR8) if (dx !== -1 || dy !== 0) L.tiles[idx(p.x + dx, p.y + dy)] = T.WALL;']]],
    ['well', 3, [
      [0, 'with 50 coins', 'G.player.gold = 50;', []], [0, 'with no coins', 'G.player.gold = 0;', []],
      [1, 'no graves yet', '', []],
      [1, 'two graves', "Store.save('graveyard', [{ run: 90, won: false, depth: 99 }, { run: 91, won: false, depth: 99 }, { run: 92, won: true, depth: 6 }]);", []],
      [2, '', '', []]]],
    ['musicbox', 5, [
      [0, 'at bedtime', 'spawnStalker(G.level);', []], [0, 'before bedtime', 'G.level.monsters = G.level.monsters.filter(m => m !== G.level.stalker); G.level.stalker = null;', []],
      [1, '', '', []], [2, '', '', []]]],
    ['namepile', 6, [
      [0, 'mites', '', [0.1]],
      ...[0, 1, 2, 3, 4, 5].map(i => [0, `name ${i + 1}`, 'G.player.xp = 0; G.player.xpNext = 999;', [0.5, (i + 0.5) / 6]]),
      [1, '', '', []], [2, '', '', []]]],
  ];
  add('rooms', 31, c => {
    const { G } = c;
    c.newGame();
    for (const [kind, depth, variants] of ROOMS) {
      c.floor(depth);
      c.quiet();
      let first = true;
      for (const [choice, label, code, forced, arms, after] of variants) {
        if (G.mode !== 'play') c.skipPages();
        c.placeRoom(kind, `${kind}: choice ${choice + 1}${label ? ' (' + label + ')' : ''}`, `p.hp = p.maxHp; p.dread = 0; p.confused = 0; ${code}`, after || '');
        c.key(' ', 300);                       // you notice it (a sting)
        c.key('ArrowLeft', 100);               // walk into it: its page opens
        if (first) { for (let t = 0; t < 100 && !c.val('pageDone(G.page)'); t++) c.tick(300); }
        else { for (let t = 0; t < 12 && !c.val('pageDone(G.page)'); t++) c.key('Enter', 68); }
        c.tick(200);
        if (choice === 1) c.key('ArrowDown', 100);
        for (const [table, i] of arms || []) c.arm(table, i);
        if (forced.length) c.force(...forced);
        c.key(String(choice + 1), first ? 2500 : 900);
        c.key('Enter', 300);
        c.disarm();
        if (first) { c.key('ArrowLeft', 300); first = false; } // walking into it again: it's used up
        c.readPages();
      }
    }
  });

  // ---------------------------------------------------------------------------------------
  // Rhyme duels: won, lost (every way a bad rhyme can go), burnt out at every Dread tier,
  // no rhymes left, rhymes coming back, and every couplet once.
  add('rhymes', 41, c => {
    const { G } = c;
    c.newGame();
    c.quiet();
    c.roomy();
    const foes = () => c.setup('a Second Opinion beside you and two Mold-Mites close by', `(() => {
      const L = G.level, p = G.player; L.monsters = [];
      const cells = [[1, 0], [0, 2], [-2, 0], [2, 2]].filter(([dx, dy]) => passable(L.tiles[idx(p.x + dx, p.y + dy)]));
      cells.slice(0, 3).forEach(([dx, dy], i) => { const m = spawnMonster(L, i ? 'mite' : 'opinion', p.x + dx, p.y + dy); m.awake = true; if (!i) { m.hp = m.maxHp = 99; } });
      computeFOV(L, p.x, p.y, lightRadius());
    })()`);
    foes();
    c.rhyme(true, { natural: true });
    for (let i = 0; i < 8; i++) {
      c.setup('rhymes refilled', 'G.player.verve = G.player.maxVerve; G.player.confused = 0;');
      if (c.val('G.level.monsters.length') < 2) foes();
      c.rhyme(false);
      c.readPages();
    }
    for (const dread of [0, 35, 60, 85]) {
      c.setup(`dread ${dread}, rhymes refilled`, `G.player.dread = ${dread}; G.player.verve = G.player.maxVerve; G.player.confused = 0;`);
      c.rhyme(null, { natural: true });
      c.readPages();
    }
    c.roomy();
    c.setup('alone, walled in, sound off', `(() => { const L = G.level, p = G.player; L.monsters = []; p.verve = p.maxVerve; p.dread = 0; for (const [dx, dy] of DIR8) L.tiles[idx(p.x + dx, p.y + dy)] = T.WALL; })()`);
    c.key('m', 0);
    c.key('r', 34); c.key('Enter', 34); c.key('Enter', 34);
    for (let t = 0; t < 60 && !G.rhyme.fuseT0; t++) c.tick(34);
    c.key(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][G.rhyme.options.findIndex(o => o !== G.rhyme.answer)], 500);
    c.force(0.75);                                                     // the bad rhyme curdles into a mite... with no room for one
    c.key(' ', 300);
    c.key('m', 100);
    c.roomy();
    c.setup('no rhymes left, calm', 'G.player.verve = 0; G.player.dread = 0; G.level.monsters = [];');
    c.key('r', 200);
    c.wait(32);
    const n = c.val('COUPLETS.length');
    for (let i = 0; i < n; i++) {
      c.arm('COUPLETS', i);
      c.setup(`couplet ${i + 1}`, 'G.player.verve = G.player.maxVerve; G.player.dread = 0; G.player.confused = 0;');
      c.rhyme(i % 3 !== 1);
      c.readPages();
    }
    c.setup('a big crowd, then a perfect rhyme', `(() => { const L = G.level, p = G.player; p.verve = p.maxVerve;
      for (const [dx, dy] of DIR8) if (passable(L.tiles[idx(p.x + dx, p.y + dy)]) && !monsterAt(p.x + dx, p.y + dy)) spawnMonster(L, 'mite', p.x + dx, p.y + dy).awake = true; })()`);
    c.rhyme(true);
  });

  // ---------------------------------------------------------------------------------------
  // Items: every potion drunk (unknown, then known) and thrown, every scroll read, every food
  // eaten (fresh and spoiled), all the gear worn and swapped, picking up, dropping, full pockets.
  add('items', 51, c => {
    const { G } = c;
    c.newGame();
    c.quiet();
    c.roomy();
    c.key('i', 300); c.key('Escape', 100);
    c.setup('pockets: one of every potion', "G.player.inv = POTIONS.map(x => makeItem('potion', x.id));");
    c.key('i', 300);
    for (let i = 0; i < 6; i++) c.key('ArrowDown', 150);
    c.key('Escape', 100);
    for (let i = 0; i < 6; i++) { c.god(); c.key('1', 400); }
    c.wait(14, 68);
    c.setup('every potion again, known now', "G.player.inv = POTIONS.map(x => makeItem('potion', x.id)); G.player.confused = 0; G.player.poisoned = 0;");
    for (let i = 0; i < 6; i++) { c.god(); c.key('i', 150); c.key('Enter', 400); }
    c.wait(62, 34);
    // scrolls, with two horrors in view
    const scrollRound = (label, extra) => {
      c.setup(label, `(() => { const L = G.level, p = G.player; L.monsters = []; p.confused = 0;
        const cells = [[2, 0], [-2, 1], [0, -2]].filter(([dx, dy]) => passable(L.tiles[idx(p.x + dx, p.y + dy)]));
        cells.slice(0, 2).forEach(([dx, dy]) => spawnMonster(L, 'opinion', p.x + dx, p.y + dy));
        ${extra}
        p.inv = ['map', 'fear', 'smite', 'enchant', 'summon', 'teleport'].map(id => makeItem('scroll', id));
        computeFOV(L, p.x, p.y, lightRadius()); })()`);
      c.key('i', 300);
      for (let i = 0; i < 6; i++) c.key('ArrowDown', 150);
      c.key('Escape', 100);
      for (let i = 0; i < 6; i++) { c.god(); c.key('1', 500); c.readPages(); if (G.mode === 'encounter') c.key('Escape'); }
    };
    scrollRound('pockets: one of every scroll (unknown), two Second Opinions nearby, empty hands', '');
    c.roomy();
    scrollRound('every scroll again (known), a spork in hand, the Tuck-You-In nearby',
      "p.gear.hand = makeItem('weapon', 0); const s = freeNeighbor(L, p.x, p.y); if (s) { const t = spawnMonster(L, 'tuck', s[0], s[1]); t.stun = 99; }");
    c.setup('a scroll of fear with nobody there, and lightning with nobody there', "G.level.monsters = []; G.player.inv = [makeItem('scroll', 'fear'), makeItem('scroll', 'smite')];");
    c.key('1', 300); c.key('1', 300);
    c.roomy();
    c.setup('walled in, with a scroll of company', "(() => { const L = G.level, p = G.player; for (const [dx, dy] of DIR8) L.tiles[idx(p.x + dx, p.y + dy)] = T.WALL; p.inv = [makeItem('scroll', 'summon')]; })()");
    c.key('1', 300);
    // every kind of thing, looked at in the pockets (the description of the one you point at)
    for (const [label, code] of [
      ['pockets: every potion and scroll, before you know them', "G.known = { potion: { heal: true }, scroll: {} }; G.player.inv = POTIONS.map(x => makeItem('potion', x.id)).concat(SCROLLS.slice(0, 4).map(x => makeItem('scroll', x.id)));"],
      ['pockets: the rest of the scrolls, socks, and food', "G.player.inv = SCROLLS.slice(4).map(x => makeItem('scroll', x.id)).concat([{ kind: 'sock', id: 'holey' }, { kind: 'pair', id: 'polka-dot' }], FOODS.map(x => makeItem('food', x.id)));"],
      ['pockets: every potion and scroll, known', "POTIONS.forEach(x => { G.known.potion[x.id] = true; }); SCROLLS.forEach(x => { G.known.scroll[x.id] = true; }); G.player.inv = POTIONS.map(x => makeItem('potion', x.id)).concat(SCROLLS.slice(0, 4).map(x => makeItem('scroll', x.id)));"],
      ['pockets: the last scrolls and all the weapons', "G.player.inv = SCROLLS.slice(4).map(x => makeItem('scroll', x.id)).concat(WEAPONS.map((w, i) => makeItem('weapon', i)));"],
      ['pockets: all the armor', "G.player.inv = ARMORS.map((a, i) => makeItem('armor', i));"],
    ]) {
      c.setup(label, code);
      c.key('i', 200);
      for (let i = 0; i < 10; i++) c.key('ArrowDown', 100);
      c.key('Escape', 100);
    }
    // food, fresh and spoiled
    c.roomy();
    for (const id of c.val('FOODS.map(f => f.id)')) {
      for (const spoiled of [false, true]) {
        c.setup(`eat the ${id}${spoiled ? ' (it has gone off)' : ''}`, `G.level.monsters = []; G.player.hp = 5; G.player.poisoned = 0; G.player.inv = [makeItem('food', '${id}')];`);
        c.force(spoiled ? 0 : 0.999);
        c.key('1', 400);
      }
    }
    c.wait(6);
    // throwing every potion at a horror (through the encounter card and the pockets)
    for (const [id, type] of c.val("POTIONS.map(x => [x.id, 'opinion'])").concat([['poison', 'tuck']])) {
      c.roomy();
      c.setup(`throw ${id} at the ${type}`, `G.level.monsters = []; G.player.inv = [makeItem('food', 'ham'), makeItem('potion', '${id}')];`);
      const d = c.spawnNext(type, 'm.awake = true; m.hp = Math.min(m.hp, 5); m.stun = 3;');
      c.key(c.arrow(d), 200);
      c.key('u', 300);
      c.key('t', 300);              // not a potion: nothing
      c.key('ArrowDown', 150);
      c.key('t', 400);
      c.wait(4);
    }
    // gear: all the weapons and armor, through the equipment page
    c.roomy();
    c.setup('pockets: every weapon and every piece of armor', 'G.level.monsters = []; G.player.inv = WEAPONS.map((w, i) => makeItem("weapon", i)).concat(ARMORS.map((a, i) => makeItem("armor", i)));');
    c.key('e', 300);
    for (const k of ['1', '1', '2', '3', '1', 't', 'Enter', 'Enter']) { c.god(); c.key(k, 250); }
    c.key('ArrowDown', 200);
    for (const k of ['1', '2', '1', 't', 'Enter']) { c.god(); c.key(k, 250); }
    c.key('ArrowDown', 200);
    for (const k of ['1', '2', '3', '1', 't', 'Enter']) { c.god(); c.key(k, 250); }
    c.key('ArrowDown', 200);
    c.key('t', 250); c.key('Enter', 250);
    c.key('ArrowDown', 200); c.key('ArrowUp', 200); c.key('ArrowUp', 200);
    c.key('i', 300); c.key('ArrowDown', 150); c.key('Enter', 300);
    c.key('e', 300);
    c.setup('pockets stuffed full', "while (G.player.inv.length < 10) G.player.inv.push(makeItem('food', 'muffin'));");
    c.key('t', 300); c.key('Escape', 200);
    c.key('i', 300); c.key('ArrowDown', 150); c.key('d', 300);
    c.key('i', 300); c.key('d', 300);
    // picking things up
    c.roomy();
    const d = c.openDir();
    c.setup('on the floor next to you: a potion, a scroll, coins and a candle stub', `(() => { const L = G.level, p = G.player, x = p.x + ${d[0]}, y = p.y + ${d[1]};
      dropItem(L, x, y, makeItem('potion', 'sight')); dropItem(L, x, y, makeItem('scroll', 'map')); dropItem(L, x, y, { kind: 'gold', amount: 17 }); dropItem(L, x, y, { kind: 'candle' });
      p.inv = p.inv.slice(0, 9); })()`);
    c.key(c.arrow(d), 300);
    c.key('g', 300);
    c.key('g', 300);
    c.setup('a lone sock in your pockets, and your candle out', "G.player.inv = [{ kind: 'sock', id: 'argyle' }, makeItem('weapon', 1)]; G.player.wick = 0;");
    c.key('1', 300);
    c.key('i', 300); c.key('ArrowDown', 150); c.key('e', 300); c.key('Escape', 200);
    c.setup('a candle stub at your feet, in the dark', '(() => { const p = G.player, s = freeNeighbor(G.level, p.x, p.y); dropItem(G.level, s[0], s[1], { kind: "candle" }); globalThis.__s = [s[0] - p.x, s[1] - p.y]; })()');
    const sd = c.val('__s');
    if (Math.abs(sd[0]) + Math.abs(sd[1]) === 1) c.key(c.arrow(sd), 300);
    c.setup('teleported onto the stub', 'G.player.x += __s[0]; G.player.y += __s[1]; G.player.wick = 0; stepOnto();');
    c.setup('a potion and a matching pair of socks to pick up, pockets nearly full', "(() => { const p = G.player; while (p.inv.length < 9) p.inv.push(makeItem('food', 'eggs')); dropItem(G.level, p.x, p.y, makeItem('potion', 'heal')); dropItem(G.level, p.x, p.y, { kind: 'pair', id: 'stripy' }); })()");
    c.key('g', 300);
    c.key('g', 300);
    c.key('i', 300);
    for (let i = 0; i < 10; i++) c.key('ArrowDown', 120);
    c.key('Escape', 200);
  });

  // ---------------------------------------------------------------------------------------
  // Meeting every kind of horror for the first time (its bestiary page), watching it act, and
  // fighting it; then every line each one can say, and every hit and miss line.
  add('monsters', 61, c => {
    const { G } = c;
    c.newGame();
    c.setup('a quiet floor', 'G.level.monsters = []; G.cardQueue = [];');
    const types = ['mite', 'bat', 'putaway', 'opinion', 'zombie', 'wraith', 'mimic', 'thing', 'tot', 'giraffe', 'sockling', 'tuck'];
    for (const type of types) {
      c.roomy();
      c.setup(`a ${type}, two steps away and awake${type === 'mimic' ? ' (disguised as a nest, right next to you)' : ''}`, `(() => { const L = G.level, p = G.player; L.monsters = []; L.stalker = null; p.confused = 0;
        const off = ${type === 'mimic' ? '[[1, 0], [0, 1], [-1, 0], [0, -1]]' : '[[2, 0], [0, 2], [-2, 0], [0, -2], [2, 1]]'}.find(([dx, dy]) => passable(L.tiles[idx(p.x + dx, p.y + dy)]) && !monsterAt(p.x + dx, p.y + dy));
        const m = spawnMonster(L, '${type}', p.x + off[0], p.y + off[1]); m.awake = ${type !== 'mimic'}; globalThis.__m = m;
        ${type === 'putaway' ? "p.inv.push(makeItem('food', 'ham'));" : ''}
        computeFOV(L, p.x, p.y, lightRadius()); })()`);
      if (type === 'mimic') {
        const d = c.val('[__m.x - G.player.x, __m.y - G.player.y]');
        c.key(c.arrow(d), 300);
        c.readPages();
      }
      c.wait(1, 300);
      c.readPages();
      c.wait(8, 68);
      for (let step = 0; step < 40; step++) {
        if (G.mode === 'card') c.readPages();
        if (G.mode !== 'play' && G.mode !== 'encounter') break;
        const near = c.val('G.level.monsters.filter(m => manhattan(m, G.player) === 1 && !m.disguised).map(m => [m.x - G.player.x, m.y - G.player.y])');
        c.god();
        if (!near.length) {
          if (!c.val('G.level.monsters.length')) break;
          c.key(' ', 68);
          continue;
        }
        if (G.mode === 'encounter') c.key('a', 100);
        else { c.key(c.arrow(near[0]), 100); if (G.mode === 'encounter') c.key(step % 5 === 4 ? c.arrow(near[0]) : 'a', 100); }
        if (type === 'tuck' && step > 6) break;
      }
      c.readPages();
    }
    // every line of speech, for every kind of horror and every occasion
    c.roomy();
    c.setup('calm, and a quiet floor', 'G.player.dread = 0; G.level.monsters = []; G.level.stalker = null;');
    const speech = c.val('Object.keys(SPEECH).map(t => [t, Object.keys(SPEECH[t]).map(k => [k, SPEECH[t][k].length])])');
    for (const [type, kinds] of speech) {
      c.spawnNext(type, 'm.awake = true; m.stun = 99;');
      for (const [kind, n] of kinds) {
        for (let i = 0; i < n; i++) {
          c.arm(`SPEECH.${type}['${kind}']`, i);
          c.setup(`the ${type} says its ${kind} line ${i + 1}`, `speak(__m, '${kind}', 1)`);
          c.tick(68);
        }
      }
      c.setup('it leaves', 'G.level.monsters = [];');
    }
    // every hit, miss and monster-miss line
    c.roomy();
    for (const [table, n] of [['TEXT.hit', c.val('TEXT.hit.length')], ['TEXT.miss', c.val('TEXT.miss.length')]]) {
      for (let i = 0; i < n; i++) {
        const d = c.spawnNext('zombie', 'm.awake = true; m.stun = 99; m.hp = m.maxHp = 500;');
        c.arm(table, i);
        c.until(() => c.armed() === 0, 'a', 60, 34);
        c.disarm();
        c.setup('it leaves', 'G.level.monsters = [];');
        void d;
      }
    }
    for (let i = 0; i < c.val('TEXT.monMiss.length'); i++) {
      c.spawnNext('opinion', 'm.awake = true; m.hp = m.maxHp = 500;');
      c.arm('TEXT.monMiss', i);
      c.until(() => c.armed() === 0, ' ', 80, 34);
      c.disarm();
      c.setup('it leaves', 'G.level.monsters = [];');
    }
    // A Nothing-to-Worry-About that has already been found out, seen for the first time this game (its
    // bestiary page is known, so you just spot it).
    c.roomy();
    c.setup('a Nothing-to-Worry-About, out of disguise, right next to you; never spotted this game', `(() => { const L = G.level, p = G.player; L.monsters = []; delete G.seenTypes.mimic; p.wick = 300;
      const off = [[1, 0], [0, 1], [-1, 0], [0, -1]].find(([dx, dy]) => passable(L.tiles[idx(p.x + dx, p.y + dy)]) && !monsterAt(p.x + dx, p.y + dy));
      const m = spawnMonster(L, 'mimic', p.x + off[0], p.y + off[1]); m.disguised = false; m.awake = false; m.stun = 99; })()`);
    c.wait(1, 300);
    c.setup('it leaves', 'G.level.monsters = [];');
  });

  // ---------------------------------------------------------------------------------------
  // Walking into horrors (the encounter card) and being gone for (the reaction card), and every
  // way of getting away or failing to.
  add('encounters', 71, c => {
    const { G } = c;
    c.newGame();
    c.quiet();
    c.roomy();
    let d = c.spawnNext('zombie', 'm.awake = false;');
    c.key(c.arrow(d), 300); c.key('Escape', 200);                      // leave it be
    c.key(c.arrow(d), 300); c.key('a', 300);                           // attack
    c.setup('it is stunned and tough', '__m.stun = 5; __m.hp = __m.maxHp = 99;');
    c.key(c.arrow(d), 300); c.key(c.arrow(d), 300);                    // the same arrow again
    c.key(c.arrow(d), 300); c.key('2', 300); c.rhyme(true); c.readPages();
    c.key(c.arrow(d), 300); c.key('u', 300); c.key('Escape', 200);
    c.key(c.arrow(d), 300); c.key('ArrowDown', 300); c.key('Escape', 200);
    c.setup('it is wide awake now', '__m.stun = 0; __m.awake = true;');
    for (let i = 0; i < 8; i++) {                                       // backing out of a fight
      c.roomy(); d = c.spawnNext('opinion', 'm.awake = true; m.hp = m.maxHp = 99;');
      c.god(); c.key(c.arrow(d), 200); c.key('Escape', 400);
    }
    c.roomy();
    d = c.spawnNext('opinion', 'm.awake = true; m.hp = m.maxHp = 99;');
    c.setup('walls all round, except where it stands', `(() => { const L = G.level, p = G.player; for (const [dx, dy] of DIR4) if (!monsterAt(p.x + dx, p.y + dy)) L.tiles[idx(p.x + dx, p.y + dy)] = T.WALL; })()`);
    c.key(c.arrow(d), 200); c.key('Escape', 400);
    c.setup('another one beside you', '(() => { const p = G.player, L = G.level; G.threat = null; for (const [dx, dy] of DIR4) { const x = p.x + dx, y = p.y + dy; if (passable(L.tiles[idx(x, y)]) && !monsterAt(x, y)) { spawnMonster(L, "mite", x, y).awake = true; break; } } })()');
    c.key('a', 300);
    // walking away from a fight, against several kinds of horror
    for (const type of ['tot', 'zombie', 'opinion', 'tuck']) {
      for (let i = 0; i < 5; i++) {
        c.roomy(); d = c.spawnNext(type, 'm.awake = true; m.hp = Math.max(m.hp, 99); m.maxHp = m.hp;');
        c.god(); c.key(c.arrow([-d[0], -d[1]]), 300);
      }
    }
    for (let i = 0; i < c.val('TEXT.heldBack.length'); i++) {
      c.arm('TEXT.heldBack', i);
      for (let t = 0; t < 30 && c.armed(); t++) { c.roomy(); d = c.spawnNext('tuck', 'm.awake = true;'); c.god(); c.key(c.arrow([-d[0], -d[1]]), 68); }
      c.disarm();
    }
    // a horror goes for you: the reaction card, after the blow lands
    c.roomy();
    c.setup('a calm floor', 'G.level.monsters = [];');
    d = c.spawnNext('opinion', 'm.awake = true; m.hp = m.maxHp = 99;');
    for (let i = 0; i < 6; i++) { c.god(); c.key(' ', 0); c.tick(120); c.tick(400); if (c.val('!!currentThreat()')) { c.key(i % 2 ? 'a' : 'u', 300); if (G.mode === 'inventory') c.key('Escape', 200); } }
    c.setup('a Put-Away next to you, and coins but empty pockets', "G.level.monsters = []; G.player.inv = []; G.player.gold = 40;");
    c.spawnNext('putaway', 'm.awake = true;');
    for (let i = 0; i < 12; i++) { c.god(); c.key(' ', 0); c.tick(500); }
    // the stairs, mid-fight
    for (let i = 0; i < 6 && G.depth === 1; i++) {
      c.roomy(); c.spawnNext('opinion', 'm.awake = true; m.hp = m.maxHp = 99;');
      c.setup('stairs under your feet', 'G.level.tiles[idx(G.player.x, G.player.y)] = T.STAIRS;');
      c.god(); c.key('>', 400);
    }
    c.readPages();
  });

  // ---------------------------------------------------------------------------------------
  // Down through all six floors by the stairs, each floor's rule in action, every tip, every
  // line said on the way down, and the water.
  add('floors', 81, c => {
    const { G } = c;
    c.newGame({ natural: true });
    c.quiet();
    // floor 1: barrels (a mite inside, something inside, nothing inside, and back in again)
    const barrels = c.val('(() => { const L = G.level, out = []; for (let i = 0; i < L.tiles.length; i++) if (L.tiles[i] === T.PROP) { const x = i % MAP_W, y = (i / MAP_W) | 0; const n = DIR4.find(([dx, dy]) => passable(L.tiles[idx(x + dx, y + dy)]) && L.tiles[idx(x + dx, y + dy)] !== T.STAIRS); if (n) out.push([x, y, n[0], n[1]]); } return out; })()');
    const rolls = [[0.1], [0.25], [0.5], [0.9]];
    barrels.slice(0, 4).forEach(([x, y, nx, ny], i) => {
      c.setup(`next to barrel ${i + 1}`, `G.player.hidden = false; G.player.x = ${x + nx}; G.player.y = ${y + ny}; computeFOV(G.level, G.player.x, G.player.y, lightRadius());`);
      c.key('m', 0);                          // sound off, so the barrel's roll is the next random number
      c.force(...rolls[i]);
      c.key(c.arrow([-nx, -ny]), 300);
      c.key('m', 100);
      c.readPages();
      c.wait(i === 3 ? 16 : 2);
      c.key(c.arrow([nx, ny]), 200);
      if (i === 0) { c.key(c.arrow([-nx, -ny]), 300); c.key(c.arrow([nx, ny]), 200); }
    });
    c.setup('every horror sees you', 'G.level.monsters = [];');
    c.key('ArrowUp', 100); c.key('ArrowUp', 100);
    for (let i = 0; i < 7; i++) c.key(['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'][i % 4], 68);
    const tips = c.val('TEXT.tips.length'), descents = c.val('TEXT.descend.length');
    let tip = 0;
    // On every floor: walk into its centrepiece prop, and step on its litter (which crunches).
    const props = () => {
      const spot = c.val(`(() => { const L = G.level; for (let i = 0; i < L.tiles.length; i++) { if (L.tiles[i] !== T.PROP) continue; const x = i % MAP_W, y = (i / MAP_W) | 0;
        const n = DIR4.find(([dx, dy]) => [T.FLOOR, T.GRASS, T.DECO].includes(L.tiles[idx(x + dx, y + dy)]) && !monsterAt(x + dx, y + dy)); if (n) return [x + n[0], y + n[1], -n[0], -n[1]]; } return null; })()`);
      if (spot && G.depth !== 1) { c.setup('next to one of the floor\'s big things', `G.player.hidden = false; G.player.x = ${spot[0]}; G.player.y = ${spot[1]};`); c.key(c.arrow([spot[2], spot[3]]), 200); }
      const deco = c.val(`(() => { const L = G.level; for (let i = 0; i < L.tiles.length; i++) { if (L.tiles[i] !== T.DECO) continue; const x = i % MAP_W, y = (i / MAP_W) | 0;
        const n = DIR4.find(([dx, dy]) => L.tiles[idx(x + dx, y + dy)] === T.FLOOR && !monsterAt(x + dx, y + dy) && !monsterAt(x, y)); if (n) return [x + n[0], y + n[1], -n[0], -n[1]]; } return null; })()`);
      if (deco) {
        c.setup('next to some litter', `G.player.hidden = false; G.player.x = ${deco[0]}; G.player.y = ${deco[1]}; G.player.confused = 0;`);
        c.key('m', 0); c.force(0); c.key(c.arrow([deco[2], deco[3]]), 0); c.key('m', 200);
      }
    };
    props();
    const descend = depth => {
      if (tip < tips) c.arm('TEXT.tips', tip++);
      c.arm('TEXT.descend', (depth - 1) % descents);
      c.setup('walk to the stairs', 'G.player.hidden = false; G.player.x = G.level.stairs.x; G.player.y = G.level.stairs.y;');
      c.key('>', 300);
      c.disarm();
      c.readPages();
      c.quiet();
      c.setup('the floor emptied for a moment', 'globalThis.__keep = G.level.monsters; G.level.monsters = [];');
      props();
      c.setup('and filled again', 'G.level.monsters = __keep.filter(m => !(m.x === G.player.x && m.y === G.player.y));');
    };
    descend(1);
    // floor 2: grass and dread, so things rustle
    c.roomy();
    c.setup('uneasy', 'G.player.dread = 45; G.level.monsters = G.level.monsters.slice(0, 3); G.level.monsters.forEach(m => m.awake = true);');
    c.wait(60);
    descend(2);
    // floor 3: socks
    c.setup('a quiet floor', 'G.level.monsters = [];');
    const socks = c.val('G.level.items.filter(i => i.item.kind === "sock").map(i => [i.x, i.y, i.item.id])');
    const byId = {};
    socks.forEach(s => (byId[s[2]] = byId[s[2]] || []).push(s));
    const order = Object.values(byId).sort((a, b) => a.length - b.length).flat();
    for (const [x, y] of order) {
      c.setup('stand on a sock', `G.player.x = ${x}; G.player.y = ${y}; computeFOV(G.level, G.player.x, G.player.y, lightRadius());`);
      c.key('g', 300);
      c.readPages();
    }
    c.key('e', 300); c.key('ArrowDown', 100); c.key('ArrowDown', 100); c.key('ArrowDown', 100); c.key('1', 300); c.key('Escape', 200);
    c.wait(10);
    descend(3);
    // floor 4: water, deep water, and the tide
    c.setup('a quiet floor', 'G.level.monsters = [];');
    const wet = c.val('(() => { const L = G.level; for (let i = 0; i < L.tiles.length; i++) { if (L.tiles[i] !== T.WATER) continue; const x = i % MAP_W, y = (i / MAP_W) | 0; const n = DIR4.find(([dx, dy]) => L.tiles[idx(x + dx, y + dy)] === T.WATER); if (n) return [x, y, n[0], n[1]]; } return null; })()');
    if (wet) {
      const [x, y, nx, ny] = wet;
      c.setup('standing in water', `G.player.x = ${x}; G.player.y = ${y};`);
      for (let i = 0; i < c.val('TEXT.water.length'); i++) {
        c.arm('TEXT.water', i);
        for (let t = 0; t < 80 && c.armed(); t++) c.key(t % 2 ? c.arrow([-nx, -ny]) : c.arrow([nx, ny]), 34);
        c.disarm();
      }
      c.setup('the water next to you is deep', `G.level.tiles[idx(G.player.x + ${nx}, G.player.y + ${ny})] = T.DEEP;`);
      for (let t = 0; t < 8; t++) c.key(t % 2 ? c.arrow([-nx, -ny]) : c.arrow([nx, ny]), 68);
    }
    c.wait(130);
    descend(4);
    // floor 5: the clock strikes, twice, and the Tots wake
    c.setup('only the Tots stay', 'G.level.monsters = G.level.monsters.filter(m => m.type === "tot").slice(0, 2);');
    c.wait(92);
    descend(5);
    // floor 6: walls that bite
    c.setup('no Nibbler, just you and the walls', 'G.level.monsters = [];');
    for (let i = 0; i < 170; i++) {
      c.setup('stand by a wall', `(() => { const L = G.level, p = G.player; if (DIR4.some(([dx, dy]) => L.tiles[idx(p.x + dx, p.y + dy)] === T.WALL)) return;
        for (let k = 0; k < L.tiles.length; k++) { const x = k % MAP_W, y = (k / MAP_W) | 0; if (L.tiles[k] === T.FLOOR && DIR4.some(([dx, dy]) => L.tiles[idx(x + dx, y + dy)] === T.WALL)) { p.x = x; p.y = y; break; } } })()`);
      c.wait(1);
    }
    while (tip < tips) { c.arm('TEXT.tips', tip++); c.floor(2 + (tip % 4)); c.quiet(); }
  });

  // ---------------------------------------------------------------------------------------
  // Dread: hallucinations, whispers, eyes in the dark, broken rhymes, the frightened page;
  // the candle burning low, going out and being relit; every whisper and level-up line.
  add('dread', 91, c => {
    const { G } = c;
    c.newGame();
    c.floor(2);
    c.quiet();
    c.roomy();
    c.setup('frightened half to death', 'G.player.dread = 92;');
    c.wait(90, 68);
    c.setup('reach for a hallucinated treasure', `(() => { const L = G.level, p = G.player;
      if (!L.phantoms.some(ph => ph.kind === 'item')) L.phantoms.push({ x: 0, y: 0, kind: 'item', ch: '$', color: '#ffe066', name: 'pile of coins', ttl: 9 });
      const ph = L.phantoms.find(f => f.kind === 'item');
      for (const [dx, dy] of DIR4) if (passable(L.tiles[idx(ph.x - dx, ph.y - dy)]) && passable(L.tiles[idx(ph.x, ph.y)])) { p.x = ph.x - dx; p.y = ph.y - dy; globalThis.__d = [dx, dy]; return; }
      ph.x = p.x + 1; ph.y = p.y; globalThis.__d = [1, 0]; })()`);
    c.key(c.arrow(c.val('__d')), 300);
    for (let i = 0; i < c.val('WHISPERS.length'); i++) {
      c.arm('WHISPERS', i);
      c.setup(`whisper ${i + 1} (kept at dread 92 every turn until it comes)`, 'G.player.dread = 92;');
      c.until(() => { c.val('G.player.dread = 92;'); return c.armed() === 0; }, ' ', 400, 34);
      c.disarm();
    }
    const levels = c.val('TEXT.levelUp.length'), broken = c.val('BROKEN_ENDINGS.length');
    for (let i = 0; i < Math.max(levels, broken); i++) {
      if (i < levels) c.arm('TEXT.levelUp', i);
      if (i < broken) c.arm('BROKEN_ENDINGS', i);
      for (let t = 0; t < 20 && c.armed(); t++) c.setup('enough experience for a level', 'G.player.dread = 92; gainXp(G.player.xpNext - G.player.xp);');
      c.disarm();
      c.tick(68);
    }
    c.floor(3, { natural: true });
    c.quiet();
    c.setup('calm again, candle nearly gone', 'G.player.dread = 0; G.player.wick = 43;');
    c.wait(6, 68);
    c.setup('candle on its last breath', 'G.player.wick = 2;');
    c.wait(4, 68);
    c.wait(30, 68);
    const d = c.openDir();
    c.setup('a candle stub just there', `dropItem(G.level, G.player.x + ${d[0]}, G.player.y + ${d[1]}, { kind: 'candle' });`);
    c.key(c.arrow(d), 300);
    c.setup('one more stub, candle nearly full', `G.player.wick = 420; dropItem(G.level, G.player.x - ${d[0]}, G.player.y - ${d[1]}, { kind: 'candle' });`);
    c.key(c.arrow([-d[0], -d[1]]), 300);
    for (const dread of [10, 40, 65, 95]) { c.setup(`dread ${dread}`, `G.player.dread = ${dread};`); c.wait(3, 300); }
    c.floor(6);
    c.quiet();
    c.setup('frightened on the bottom floor', 'G.player.dread = 95;');
    c.wait(12, 68);
  });

  // ---------------------------------------------------------------------------------------
  // Bedtime: the music box, the Tuck-You-In arriving, its page, its lullabies, being tucked in,
  // a rhyme to stun it, and being put to bed for good. Then the stone, the graveyard, the
  // title, and the bestiary book, page by page.
  add('bedtime', 101, c => {
    const { G } = c;
    c.newGame();
    c.floor(2, { natural: true });
    c.setup('a quiet floor, nearly bedtime', 'G.level.monsters = []; G.level.turnsHere = stalkerDue(2) - 85;');
    c.wait(84, 68);
    c.until(() => G.mode === 'card' || !!G.level.stalker, ' ', 30, 68);
    c.readPages();
    for (let i = 0; i < c.val('SPEECH.tuck.idle.length'); i++) {
      c.arm('SPEECH.tuck.idle', i);
      c.setup('keep your distance', '(() => { const L = G.level, s = L.stalker; if (manhattan(s, G.player) < 4) { const f = farthestSpot(L, G.player, L.rooms); s.x = f.x; s.y = f.y; } })()');
      c.until(() => c.armed() === 0, ' ', 80, 68);
      c.disarm();
    }
    c.until(() => c.val('!!G.level.stalker && manhattan(G.level.stalker, G.player) === 1'), ' ', 120, 68);
    c.wait(6, 300);
    c.rhyme(true, { natural: true });
    c.readPages();
    c.wait(3, 300);
    c.setup('weak, and out of tricks', 'G.player.hp = G.player.maxHp = 12; G.player.verve = 0; G.level.stalker.stun = 0;');
    for (let i = 0; i < 80 && G.mode !== 'dead'; i++) { if (G.mode === 'card') c.readPages(); c.key(' ', 68); }
    c.readPages();
    for (let t = 0; t < 120 && G.mode === 'dead' && !c.val('pageDone(G.page)'); t++) c.tick(500);
    c.tick(1000);
    c.key('g', 400); c.key('ArrowDown', 300); c.key('Escape', 300);
    c.key('t', 1000);
    c.key('b', 500);
    for (let i = 0; i < 4; i++) c.key('ArrowRight', 500);
    c.key('ArrowLeft', 500);
    c.key('Escape', 300);
  });

  // ---------------------------------------------------------------------------------------
  // The boss: meeting it, its three phases (eating your things and the page), its taunts and
  // summons, the Last Rhyme lost, burnt out, lost again and won, and the ending.
  add('boss', 111, c => {
    const { G } = c;
    c.newGame();
    c.setup('every lesser horror already met', "Object.keys(BESTIARY).filter(t => t !== 'nibbler').forEach(t => { markBestiary(t); G.seenTypes[t] = true; });");
    c.floor(6, { natural: true });
    c.setup('the arena: just you and the Nibbler, a few steps apart, with full pockets', `(() => { const L = G.level, p = G.player, m = L.monsters.find(x => x.type === 'nibbler');
      L.monsters = [m]; globalThis.__m = m;
      for (const [dx, dy] of [[-3, 0], [3, 0], [0, 3], [0, -3]]) if (passable(L.tiles[idx(m.x + dx, m.y + dy)])) { p.x = m.x + dx; p.y = m.y + dy; break; }
      p.inv = [makeItem('food', 'eggs'), makeItem('food', 'ham'), makeItem('potion', 'heal'), makeItem('scroll', 'fear'), makeItem('weapon', 2), makeItem('food', 'muffin')];
      p.maxVerve = 4; p.verve = 4; computeFOV(L, p.x, p.y, lightRadius()); updateCamera(true); })()`);
    c.wait(1, 300);
    c.readPages();
    c.wait(10, 120);
    c.setup('the Nibbler is down to 60%', '__m.hp = Math.round(__m.maxHp * 0.6);');
    c.wait(14, 120);
    c.setup('the Nibbler is down to 30%', '__m.hp = Math.round(__m.maxHp * 0.3); G.player.inv.push(makeItem("food", "beast"), makeItem("potion", "might"));');
    c.wait(14, 120);
    c.setup('empty pockets: nothing left to eat but your rhymes', 'G.player.inv = []; G.player.verve = G.player.maxVerve;');
    c.wait(12, 120);
    for (const [table, n] of [['TEXT.bossTaunts', c.val('TEXT.bossTaunts.length')], ['TEXT.bossSummon', c.val('TEXT.bossSummon.length')]]) {
      for (let i = 0; i < n; i++) {
        const taunt = table === 'TEXT.bossTaunts';
        c.arm(table, i);
        c.setup(`calm enough to hear it properly (kept calm${taunt ? ', with no helpers due,' : ''} every turn until it speaks)`, 'G.player.dread = 0;');
        // Taunts come only on turns it does not summon, so for those keep its summoning timer back.
        const keep = `G.player.dread = 0;${taunt ? ' __m.timer = 0;' : ''}`;
        if (!c.until(() => { c.val(keep); return c.armed() === 0; }, ' ', 200, 68)) throw new Error(`boss: ${table}[${i}] never came up`);
        c.disarm();
        c.setup('clear the summoned helpers', 'G.level.monsters = [__m]; __m.hp = Math.min(__m.hp, Math.round(__m.maxHp * 0.3));');
      }
    }
    // the Last Rhyme: wrong, burnt out, wrong, right (one of each couplet)
    const finale = (i, answer) => {
      c.arm('BOSS_COUPLETS', i);
      c.setup('it is nearly empty; next to you and dazed', `(() => { const L = G.level, p = G.player, m = __m; L.monsters = [m]; m.hp = 1; m.stun = 3;
        for (const [dx, dy] of DIR4) if (passable(L.tiles[idx(p.x + dx, p.y + dy)]) && !fixtureAt(L, p.x + dx, p.y + dy)) { m.x = p.x + dx; m.y = p.y + dy; break; }
        p.hp = p.maxHp; computeFOV(L, p.x, p.y, lightRadius()); })()`);
      const d = c.val('[__m.x - G.player.x, __m.y - G.player.y]');
      for (let t = 0; t < 20 && G.mode !== 'rhyme'; t++) {
        if (G.mode === 'play') c.key(c.arrow(d), 100);
        if (G.mode === 'encounter') c.key('a', 300);
        c.setup('still dazed', '__m.stun = 3; __m.hp = 1;');
      }
      for (let t = 0; t < 200 && !G.rhyme.fuseT0; t++) c.tick(34);
      if (answer === null) { for (let t = 0; t < 400 && G.mode === 'rhyme'; t++) c.tick(34); }
      else {
        const opts = G.rhyme.options, k = answer ? opts.indexOf(G.rhyme.answer) : opts.findIndex(o => o !== G.rhyme.answer);
        c.key(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][k], 500);
        for (let t = 0; t < 80 && G.mode === 'rhyme'; t++) c.tick(34);
      }
      c.disarm();
    };
    finale(0, false);
    finale(1, null);
    finale(2, false);
    finale(3, true);
    c.readPages(8);
    c.key('g', 500); c.key('Escape', 300);
    c.key('b', 500); c.key('ArrowRight', 300); c.key('Escape', 300);
  });

  // ---------------------------------------------------------------------------------------
  // Deaths: one for every kind of last line on the stone, by many different killers, using every
  // epitaph; then the graveyard, headstone by headstone.
  const DEATHS = [
    // [label, floor, setup before, how it happens: 'monster:type' | 'drink:poison' | 'eat:id' | 'wall' | 'nothing']
    ['nothing in particular (on floor 2)', 2, 'p.kills = 1;', 'monster:opinion'],
    ['on the first floor', 1, 'p.kills = 1;', 'monster:mite'],
    ['having bonked no one', 2, '', 'monster:zombie'],
    ['in the dark', 2, 'p.kills = 1; p.wick = 0;', 'monster:giraffe'],
    ['robbed by a Put-Away', 2, 'p.kills = 1; p.inv = [makeItem("food", "ham")];', 'putaway'],
    ['with two snacks uneaten', 2, 'p.kills = 1; p.inv = [makeItem("food", "eggs"), makeItem("food", "beast")];', 'monster:bat'],
    ['with two mysteries unopened', 2, 'p.kills = 1; p.inv = [makeItem("potion", "might"), makeItem("scroll", "summon")];', 'monster:tot'],
    ['after three bad rhymes', 2, 'p.kills = 1; G.stats.rhymeFails = 3;', 'monster:thing'],
    ['after waiting a lot', 2, 'p.kills = 1; G.stats.waits = 60;', 'drink:poison'],
    ['too frightened to rhyme', 2, 'p.kills = 1; p.dread = 85;', 'monster:wraith'],
    ['having rung the bell', 2, 'p.kills = 1; G.stats.rangBell = true;', 'eat:eggs'],
    ['having smashed the mirror', 2, 'p.kills = 1; G.stats.smashedMirror = true;', 'monster:sockling'],
    ['wearing a borrowed name', 2, 'p.kills = 1; G.alias = "Mildred";', 'monster:opinion'],
    ['bitten by a wall', 6, 'p.kills = 1;', 'wall'],
    ['eaten by the Nibbler', 6, 'p.kills = 1;', 'nibbler'],
    ['of something unspeakable', 2, 'p.kills = 1;', 'nothing'],
    ['put to bed', 2, 'p.kills = 1;', 'monster:tuck'],
    ['of a cup of tea', 1, 'p.kills = 1;', 'room:teaparty'],
    ['of birthday cake', 2, 'p.kills = 1;', 'room:birthday'],
    ['of bad eggs, on the first floor', 1, 'p.kills = 1;', 'eat:eggs'],
  ];
  add('deaths', 121, c => {
    const { G } = c;
    c.newGame();
    const epitaphs = c.val('TEXT.epitaphs.length');
    DEATHS.forEach(([label, depth, code, how], n) => {
      if (n) { c.key('Enter', 300); c.skipPages(); }          // born again (worse)
      if (depth > 1) c.floor(depth);
      c.quiet();
      c.roomy();
      c.setup(`dying ${label}`, `(() => { const p = G.player; p.inv = []; ${code} })()`);
      c.arm('TEXT.epitaphs', n % epitaphs);
      const [kind, arg] = how.split(':');
      if (kind === 'monster' || kind === 'putaway') {
        c.spawnNext(kind === 'putaway' ? 'putaway' : arg, 'm.awake = true; m.hp = m.maxHp = 300;');
        if (kind === 'putaway') { c.until(() => !!c.val('G.stats.lastStolen'), ' ', 60, 34); c.setup('the Put-Away is gone; a Second Opinion takes its place', 'G.level.monsters = []; G.player.hp = 1;'); c.spawnNext('opinion', 'm.awake = true; m.hp = m.maxHp = 300;'); }
        c.setup('one hit from the end', 'G.player.hp = 1;');
        for (let t = 0; t < 80 && G.mode !== 'dead'; t++) { if (G.mode === 'card') c.readPages(); else if (G.mode === 'encounter') c.key('Escape'); else c.key(' ', 68); }
      } else if (kind === 'drink' || kind === 'eat') {
        c.setup('a little poorly already', `G.player.hp = 1; G.player.maxHp = 2; G.player.inv.unshift(makeItem('${kind === 'drink' ? 'potion' : 'food'}', '${arg}'));`);
        if (kind === 'eat') c.force(0);
        c.key('1', 300);
        for (let t = 0; t < 30 && G.mode !== 'dead'; t++) c.key(' ', 68);
      } else if (kind === 'room') {
        c.placeRoom(arg, `a ${arg} room, at death's door`, '', 'p.hp = 1; p.maxHp = 2;');
        c.key('ArrowLeft', 100);
        for (let t = 0; t < 12 && !c.val('pageDone(G.page)'); t++) c.key('Enter', 68);
        c.force(arg === 'teaparty' ? 0.7 : 0.1);
        c.key(arg === 'teaparty' ? '1' : '3', 600);
        c.key('Enter', 100);
        for (let t = 0; t < 30 && G.mode !== 'dead'; t++) c.key(' ', 68);
      } else if (kind === 'wall') {
        c.setup('next to a wall, with 2 health (and no getting better while it waits)', `(() => { const L = G.level, p = G.player; p.hp = 2; L.monsters = [];
          for (let k = 0; k < L.tiles.length; k++) { const x = k % MAP_W, y = (k / MAP_W) | 0; if (L.tiles[k] === T.FLOOR && DIR4.some(([dx, dy]) => L.tiles[idx(x + dx, y + dy)] === T.WALL)) { p.x = x; p.y = y; break; } } })()`);
        for (let t = 0; t < 400 && G.mode !== 'dead'; t++) { c.val('G.player.hp = Math.min(G.player.hp, 2)'); c.key(' ', 34); }
      } else if (kind === 'nibbler') {
        c.setup('the Last Rhyme, with 3 health', `(() => { const L = G.level, p = G.player, s = freeNeighbor(L, p.x, p.y); const m = spawnMonster(L, 'nibbler', s[0], s[1]); m.awake = true; m.hp = 1; L.monsters = [m]; p.hp = 3; startFinale(m); })()`);
        for (let t = 0; t < 200 && !G.rhyme.fuseT0; t++) c.tick(34);
        const k = G.rhyme.options.findIndex(o => o !== G.rhyme.answer);
        c.key(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][k], 500);
        for (let t = 0; t < 80 && G.mode === 'rhyme'; t++) c.tick(34);
      } else {
        c.setup('your health simply runs out', "G.player.hp = 0; G.killer = '';");
        c.key(' ', 100);
      }
      c.disarm();
      if (G.mode !== 'dead') throw new Error('deaths: did not die ' + label + ' (mode ' + G.mode + ')');
      if (n < 2) { for (let t = 0; t < 120 && !c.val('pageDone(G.page)'); t++) c.tick(500); }
      else { for (let t = 0; t < 12 && !c.val('pageDone(G.page)'); t++) c.key('Enter', 100); }
      c.tick(600);
    });
    c.key('t', 500);
    // back to floor 2, where the dead wait by their bones
    c.newGame();
    c.floor(2);
    c.quiet();
    const bones = c.val('G.level.items.filter(i => i.item.kind === "bones").map(i => [i.x, i.y])');
    for (const [x, y] of bones) {
      const n = c.val(`DIR4.find(([dx, dy]) => passable(G.level.tiles[idx(${x} + dx, ${y} + dy)]) && !monsterAt(${x} + dx, ${y} + dy) && !G.level.items.some(i => i.x === ${x} + dx && i.y === ${y} + dy))`);
      c.setup('a few steps from a pile of bones', `G.player.x = ${x} + ${n[0]}; G.player.y = ${y} + ${n[1]}; computeFOV(G.level, G.player.x, G.player.y, lightRadius());`);
      c.wait(7, 400);
      c.key(c.arrow([-n[0], -n[1]]), 300);
      c.key('g', 1500);
      c.wait(2, 300);
    }
    c.key('q', 100); c.key('q', 1000);
    c.key('g', 400);
    for (let i = 0; i < DEATHS.length + 1; i++) c.key('ArrowDown', 200);
    c.key('ArrowUp', 200);
    c.key('Escape', 300);
  });

  // ---------------------------------------------------------------------------------------
  // The running gags, each brought about once.
  add('gags', 131, c => {
    c.newGame();
    c.quiet();
    c.roomy();
    c.wait(13);                                                       // gerald: standing still
    for (let i = 0; i < 4; i++) c.setup('a step', 'G.stats.waitsInRow = 0;');
    c.setup('boxed in by walls on three sides', `(() => { const L = G.level, p = G.player; for (const [dx, dy] of [[0, -1], [1, 0], [-1, 0]]) L.tiles[idx(p.x + dx, p.y + dy)] = T.WALL; })()`);
    for (let i = 0; i < 7; i++) c.key('ArrowUp', 68);                  // wall: bumping into it
    const gags = [
      ['hoarder', "while (G.player.inv.length < 10) G.player.inv.push(makeItem('food', 'muffin'));"],
      ['stubs', 'G.stats.stubs = 6;'], ['pickle2', 'G.stats.barrels = 4;'], ['strangers', 'G.stats.rooms = 3;'],
      ['eggs', 'G.stats.eggs = 3;'], ['labels', 'G.stats.unknownDrinks = 4;'], ['dark', 'G.stats.darkTurns = 25;'],
      ['pickle', 'G.stats.hiddenTurns = 15;'], ['heckle', 'G.stats.rhymeFails = 3;'], ['support', 'G.player.kills = 25;'],
      ['rich', 'G.player.gold = 300;'], ['poet', 'G.stats.rhymeWins = 5;'],
    ];
    for (const [name, code] of gags) { c.setup(`gag: ${name}`, code); c.key(' ', 100); }
    c.setup('gag: coward (floor 3, no kills)', 'G.player.kills = 0; enterFloor(3);');
    c.skipPages();
    c.quiet();
    c.key(' ', 300);
  });

  // ---------------------------------------------------------------------------------------
  // The three floor surprises, each made due at once rather than waited for.
  add('surprises', 151, c => {
    const { G } = c;
    c.newGame();
    // Floor 3: a drawer closes across a corridor, and later opens again.
    c.floor(3);
    c.quiet();
    c.setup('the drawer is due now', 'G.level.surprise = { kind: "drawer", stage: "waiting", at: G.turn + 1, tries: 0 };');
    c.wait(2);
    c.wait(c.val('RULES.surprises.drawer.turns') + 1);
    // Floor 4: in the water when it's bath time; then somebody pulls the plug.
    c.floor(4);
    c.quiet();
    c.setup('standing in a big pool, with the bath due now', `(() => { const L = G.level, p = G.player;
      for (let i = 0; i < L.tiles.length; i++) { if (!isWater(L.tiles[i])) continue;
        const x = i % MAP_W, y = (i / MAP_W) | 0, pool = stepsFrom(L, x, y, isWater);
        if (Array.from(pool).filter(v => v >= 0).length < 12 || Array.from(pool).every(v => v < 4)) continue;
        p.x = x; p.y = y; p.hidden = false; break; }
      computeFOV(L, p.x, p.y, lightRadius()); updateCamera(true);
      L.surprise = { kind: 'bath', stage: 'waiting', at: G.turn + 1, tries: 0 }; })()`);
    c.wait(c.val('RULES.surprises.bath.warm + RULES.surprises.bath.drain') + 3);
    // Floor 5: nap time for three horrors nearby; a bump into a wall wakes them all.
    c.floor(5);
    c.quiet();
    c.setup('next to a wall, three horrors about, and nap time due now', `(() => { const L = G.level, p = G.player;
      for (let i = 0; i < L.tiles.length; i++) { const x = i % MAP_W, y = (i / MAP_W) | 0;
        if (L.tiles[i] !== T.FLOOR || L.tiles[idx(x, y - 1)] !== T.WALL) continue;
        if (![[3, 0], [-3, 0], [0, 3]].every(([dx, dy]) => passable(L.tiles[idx(x + dx, y + dy)]) && L.tiles[idx(x + dx, y + dy)] !== T.STAIRS)) continue;
        p.x = x; p.y = y; p.hidden = false;
        for (const [t, dx, dy] of [['tot', 3, 0], ['opinion', -3, 0], ['mite', 0, 3]]) spawnMonster(L, t, x + dx, y + dy).awake = true;
        break; }
      computeFOV(L, p.x, p.y, lightRadius()); updateCamera(true);
      L.surprise = { kind: 'nap', stage: 'waiting', at: G.turn + 1, tries: 0 }; })()`);
    c.wait(6);
    c.rec.push('= who is napping: ' + c.val('G.level.monsters.map(m => m.type + (m.napping ? " asleep" : " awake")).join(", ")'));
    c.key('ArrowUp', 300);
    c.wait(3);
  });
};
