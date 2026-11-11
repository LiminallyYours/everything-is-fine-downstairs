'use strict';
// 39 checks: gear and the equipment page, picking things up, walking into a horror (the encounter
// card), the reaction card when one goes for you, and thrown potions.

const { createGame, checker } = require('./lib');

const H = createGame({ seed: Number(process.env.SEED) || 303 }), G = H.G;
const { check, finish, out } = checker('newfeat');
const start = depth => {
  H.run('goTitle()'); H.press('Enter');
  for (let i = 0; i < 80 && G.mode !== 'play'; i++) { H.press('Enter'); H.tick(40); }
  if (depth > 1) H.run(`enterFloor(${depth}); toPlay();`);
  H.run(`G.level.monsters = G.level.monsters.filter(m => m.type === 'nibbler'); G.cardQueue = []; G.level.fixtures = [];
    Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; });`);
};
// helper: an open floor cell next to the player
const openDir = `DIR4.find(([dx, dy]) => passable(G.level.tiles[idx(G.player.x + dx, G.player.y + dy)]) && !monsterAt(G.player.x + dx, G.player.y + dy) && !fixtureAt(G.level, G.player.x + dx, G.player.y + dy) && G.level.tiles[idx(G.player.x + dx, G.player.y + dy)] !== T.STAIRS)`;

// ---------------- 1. equipment
start(1);
let r = H.run(`(() => {
  const p = G.player; p.inv = [];
  p.inv.push(makeItem('weapon', 1), makeItem('armor', 0), makeItem('armor', 2), makeItem('armor', 1), { kind: 'pair', id: 'argyle' });
  const a0 = playerAtk(), d0 = playerDef();
  equip(0);                        // umbrella -> hand
  const hand = p.gear.hand && p.gear.hand.name;
  equip(p.inv.findIndex(i => i.name === 'Second-Hand Nest'));
  equip(p.inv.findIndex(i => i.name === 'Marmalade-Crusted Overcoat'));
  equip(p.inv.findIndex(i => i.kind === 'pair'));
  const full = { hand: p.gear.hand.name, head: p.gear.head.name, body: p.gear.body.name, feet: p.gear.feet.id, atk: playerAtk(), def: playerDef(), inv: p.inv.map(i => i.name) };
  equip(p.inv.findIndex(i => i.name === 'Colander of Courage')); // swap: the nest goes back to pockets
  const swapped = { head: p.gear.head.name, hatBack: p.inv.some(i => i.name === 'Second-Hand Nest') };
  const offOk = unequip('hand');
  const afterOff = { hand: p.gear.hand, umbrellaInPocket: p.inv.some(i => i.name === 'Umbrella Most Unfortunate'), atk: playerAtk() };
  while (p.inv.length < 10) p.inv.push(makeItem('food', 'muffin'));
  const blocked = unequip('head') === false && !!p.gear.head;
  p.inv = p.inv.filter(i => i.kind !== 'food');
  const viaUse = useItem(p.inv.findIndex(i => i.name === 'Umbrella Most Unfortunate')) && p.gear.hand && p.gear.hand.name;
  G.known.scroll.enchant = true; p.inv.push(makeItem('scroll', 'enchant')); useItem(p.inv.length - 1);
  const plus = p.gear.hand.plus;
  const bones = bonesFor(p).map(i => i.name || i.kind);
  return { a0, d0, hand, full, swapped, offOk, afterOff, blocked, viaUse, plus, bones };
})()`);
const e = JSON.parse(JSON.stringify(r));
check('equip puts things in the right slots', e.full.hand === 'Umbrella Most Unfortunate' && e.full.head === 'Second-Hand Nest' && e.full.body === 'Marmalade-Crusted Overcoat' && e.full.feet === 'argyle', e.full);
check('gear changes attack and defense', e.full.atk === e.a0 + 2 && e.full.def === e.d0 + 3, { a0: e.a0, d0: e.d0, atk: e.full.atk, def: e.full.def });
check('equipping into a filled slot swaps the old one back to pockets', e.swapped.head === 'Colander of Courage' && e.swapped.hatBack, e.swapped);
check('unequip moves it to pockets', e.offOk && e.afterOff.hand === null && e.afterOff.umbrellaInPocket && e.afterOff.atk === e.a0, e.afterOff);
check('cannot unequip into full pockets', e.blocked);
check('using gear from pockets equips it', e.viaUse === 'Umbrella Most Unfortunate');
check('enchant scroll sharpens the wielded weapon', e.plus === 1, e.plus);
check('bones include what you wore', e.bones.includes('Umbrella Most Unfortunate'), e.bones);

// equipment screen keys: E opens, a turn passes per change, screen stays open
start(1);
r = H.run(`(() => {
  const p = G.player; p.inv = [makeItem('weapon', 0), makeItem('armor', 0)];
  return G.turn;
})()`);
const t0 = r;
H.press('e');
const opened = G.mode;
H.press('1');                       // hand slot selected: put on candidate 1 (spork)
const afterEquip = [G.mode, G.turn, H.run('G.player.gear.hand && G.player.gear.hand.name')];
H.press('ArrowDown'); H.press('Enter'); // head slot: Enter puts on first candidate (the nest)
const afterEnter = [G.mode, G.turn, H.run('G.player.gear.head && G.player.gear.head.name')];
H.press('t');                       // take the nest off again
const afterT = [G.mode, G.turn, H.run('G.player.gear.head')];
H.press('Escape');
check('E opens the equipment page', opened === 'gear', opened);
check('1 wields a candidate, takes a turn, page stays open', afterEquip[0] === 'gear' && afterEquip[1] === t0 + 1 && afterEquip[2] === 'Spork of Sorrow', afterEquip);
check('Enter puts on the first candidate', afterEnter[2] === 'Second-Hand Nest' && afterEnter[1] === t0 + 2, afterEnter);
check('T takes it off', afterT[2] === null && afterT[1] === t0 + 3, afterT);
check('Esc closes it', G.mode === 'play', G.mode);

// ---------------- 2. picking up is a choice
start(1);
r = H.run(`(() => {
  const L = G.level, p = G.player, d = ${openDir};
  const x = p.x + d[0], y = p.y + d[1];
  dropItem(L, x, y, makeItem('potion', 'heal'));
  dropItem(L, x, y, { kind: 'gold', amount: 7 });
  dropItem(L, x, y, { kind: 'candle' });
  const inv0 = p.inv.length, gold0 = p.gold, wick0 = p.wick;
  G.logMark = G.log.length;
  tryMove(d[0], d[1]);
  const left = L.items.filter(i => i.x === x && i.y === y).map(i => i.item.kind);
  const told = G.log.slice(G.logMark).map(l => l.text).find(t => /G to pick it up/.test(t)) || null;
  const auto = { gold: p.gold - gold0, wick: p.wick - wick0, inv: p.inv.length - inv0 };
  const took = pickUp();
  const after = { inv: p.inv.length - inv0, left: L.items.filter(i => i.x === x && i.y === y).length };
  const nothing = pickUp();
  return { left, told, auto, took, after, nothing };
})()`);
check('walking onto an item leaves it on the floor', JSON.stringify(r.left) === '["potion"]', r.left);
check('you are told what is there and how to take it', !!r.told, r.told);
check('gold and candle stubs are still scooped up', r.auto.gold === 7 && r.auto.wick > 0 && r.auto.inv === 0, r.auto);
check('G picks it up', r.took === true && r.after.inv === 1 && r.after.left === 0, r.after);
check('G on an empty floor takes no turn', r.nothing === false);
r = H.run(`(() => {
  const L = G.level, p = G.player; while (p.inv.length < 10) p.inv.push(makeItem('food', 'muffin'));
  dropItem(L, p.x, p.y, makeItem('scroll', 'map'));
  const took = pickUp();
  return { took, stillThere: L.items.some(i => i.x === p.x && i.y === p.y) };
})()`);
check('full pockets: the item stays put', r.took === false && r.stillThere, r);
// the G key itself
start(1);
r = H.run(`(() => { const p = G.player; dropItem(G.level, p.x, p.y, makeItem('food', 'eggs')); return [p.inv.length, G.turn]; })()`);
H.press('g');
check('the G key picks up and takes a turn', H.run('G.player.inv.length') === r[0] + 1 && G.turn === r[1] + 1, [H.run('G.player.inv.length'), G.turn]);

// ---------------- 3. walking into a horror: choose
const setupFoe = type => H.run(`(() => {
  const L = G.level, p = G.player, d = ${openDir};
  const m = spawnMonster(L, '${type}', p.x + d[0], p.y + d[1]); m.awake = true; m.stun = 0;
  computeFOV(L, p.x, p.y, lightRadius());
  globalThis.__foe = m; globalThis.__d = d;
  return { d, hp: m.hp, turn: G.turn };
})()`);
const arrowFor = d => ({ '0,-1': 'ArrowUp', '1,0': 'ArrowRight', '0,1': 'ArrowDown', '-1,0': 'ArrowLeft' })[d.join()];
start(1);
let f = setupFoe('zombie');
H.run('__foe.awake = false;'); // not fighting yet: backing off is free (fights are covered in withdraw.js)
H.press(arrowFor(f.d));
check('walking into a horror opens the choice, no turn yet', G.mode === 'encounter' && G.turn === f.turn && H.run('__foe.hp') === f.hp, [G.mode, G.turn, f.turn]);
H.press('Escape');
check('Esc leaves a sleeping horror be, without spending a turn', G.mode === 'play' && G.turn === f.turn, [G.mode, G.turn]);
H.press(arrowFor(f.d)); H.press('a');
check('A attacks (one turn)', G.mode === 'play' && G.turn === f.turn + 1, [G.mode, G.turn]);
const t1 = G.turn;
H.run('__foe.stun = 5; __foe.hp = 99; __foe.maxHp = 99;');
const log1 = G.log.length;
H.press(arrowFor(f.d)); H.press(arrowFor(f.d));
// An attack can miss on the dice, so accept a hit (damage) or one of the miss lines, as long as
// exactly one turn went on the attack.
const missLines = H.run('TEXT.miss.map(t => cap(fill(t, { m: __foe.d.name })))');
const said = G.log.slice(log1).map(l => l.text);
const struck = H.run('__foe.hp') < 99, missed = said.some(t => missLines.includes(t));
check('the same arrow again attacks', G.turn === t1 + 1 && G.mode === 'play' && (struck || missed), { turn: G.turn - t1, hp: H.run('__foe.hp'), said });
H.press(arrowFor(f.d)); H.press('r');
check('R starts a rhyme duel', G.mode === 'rhyme', G.mode);
H.run('toPlay(); G.page = null;');
H.press(arrowFor(f.d)); H.press('u');
check('U opens your pockets aimed at it', G.mode === 'inventory' && H.run('G.useTarget === __foe'), [G.mode]);
H.press('Escape');
check('closing pockets clears the target', G.mode === 'play' && H.run('G.useTarget') === null);
// a disguised mimic still bites first
start(3);
H.run(`(() => { const L = G.level, p = G.player, d = ${openDir}; const m = spawnMonster(L, 'mimic', p.x + d[0], p.y + d[1]); globalThis.__mim = m; globalThis.__d = d; computeFOV(L, p.x, p.y, lightRadius()); })()`);
H.press(arrowFor(H.run('__d')));
check('bumping a disguised nest reveals the mimic (no menu)', G.mode !== 'encounter' && H.run('__mim.disguised') === false, [G.mode]);

// ---------------- 4. when a horror bumps into you
start(1);
f = setupFoe('opinion');
H.run(`G.player.hp = 999; G.player.maxHp = 999; for (let i = 0; i < 12 && !(G.threat && G.threat.m === __foe); i++) { monsterAttack(__foe); } G.threat.turn = G.turn;`);
check('a horror that goes for you becomes the threat', H.run('currentThreat() === __foe'));
const hp1 = H.run('__foe.hp = 40, __foe.maxHp = 40, __foe.stun = 5, 40');
const tt = G.turn;
let presses = 0;
while (presses < 8 && H.run('__foe.hp') >= hp1) { H.run('G.threat = { m: __foe, turn: G.turn }; __foe.stun = 5;'); H.press('a'); presses++; }
check('A attacks back at it (one turn per press; misses happen)', G.turn === tt + presses && H.run('__foe.hp') < hp1, [presses, G.turn - tt, H.run('__foe.hp')]);
H.run('G.threat = { m: __foe, turn: G.turn };');
H.press('u');
check('U opens pockets aimed at the threat', G.mode === 'inventory' && H.run('G.useTarget === __foe'));
H.press('Escape');
// thrown potions
const throwTest = (id, type) => H.run(`(() => {
  const L = G.level, p = G.player; L.monsters = [];
  const d = ${openDir}; const m = spawnMonster(L, '${type || 'opinion'}', p.x + d[0], p.y + d[1]); m.awake = true; m.hp = 5;
  p.inv = [makeItem('potion', '${id}')];
  const before = { hp: m.hp };
  throwPotion(0, m);
  const after = { hp: m.hp, poison: m.poison || 0, dazed: m.dazed || 0, bonusAtk: m.bonusAtk || 0, fear: m.fear || 0, known: !!G.known.potion['${id}'], inv: p.inv.length };
  let poisonKill = null;
  if ('${id}' === 'poison') { m.stun = 99; for (let i = 0; i < 4 && L.monsters.includes(m); i++) monstersAct(L); poisonKill = !L.monsters.includes(m); }
  return { before, after, poisonKill };
})()`);
const heal = throwTest('heal'), pois = throwTest('poison'), conf = throwTest('confuse'), might = throwTest('might'), sight = throwTest('sight'), tuck = throwTest('poison', 'tuck');
check('thrown healing heals the horror (oops)', heal.after.hp > heal.before.hp, heal.after);
check('thrown poison poisons it, and it can die of it', pois.after.poison === 6 && pois.poisonKill === true, pois);
check('thrown fizz dazes it', conf.after.dazed === 6, conf.after);
check('thrown muchness makes it stronger (oops)', might.after.bonusAtk === 2, might.after);
check('thrown peeping scares it off', sight.after.fear >= 8, sight.after);
check('throwing identifies the potion and uses it up', heal.after.known && heal.after.inv === 0);
check('the Tuck-You-In shrugs it off', tuck.after.poison === 0, tuck.after);
// T in pockets throws
start(1);
f = setupFoe('opinion');
H.run(`G.player.inv = [makeItem('potion', 'poison')]; __foe.stun = 5;`);
const tb = G.turn;
H.press(arrowFor(f.d)); H.press('u'); H.press('t');
check('U then T throws the potion (one turn)', G.mode === 'play' && G.turn === tb + 1 && H.run('(__foe.poison || 0) > 0 || !G.level.monsters.includes(__foe)'), [G.mode, G.turn, tb]);

if (out.length !== 39) check('all 39 checks ran', false, out.length);
finish();
