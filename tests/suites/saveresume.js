'use strict';
// Saving a run as you go and carrying on with it (C on the title page), plus two small things
// about keys and cards: Enter can't pick a room's choice the instant its verse finishes, and
// the face-off card goes where it covers the least.

const { createGame, checker, startGame } = require('./lib');
const { checkInvariants } = require('../bot');
const { makeRandom } = require('../harness');

const SEED = Number(process.env.SEED) || 606;
const { check, finish } = checker('saveresume');

// Everything about a run that should survive being saved and loaded, as one string.
const FINGERPRINT = `(() => {
  const L = G.level, p = G.player;
  const skip = ['ax', 'ay', 'fromX', 'fromY', 'moveT0', 'drawAt', 'lunge', 'recoil', 'd', 't', 't0'];
  const strip = o => JSON.parse(JSON.stringify(o, (k, v) => (skip.includes(k) ? undefined : v)));
  return JSON.stringify({
    depth: G.depth, turn: G.turn, runNo: G.runNo, player: strip(p),
    monsters: strip(L.monsters), items: strip(L.items), fixtures: strip(L.fixtures), phantoms: strip(L.phantoms),
    ghosts: strip(L.ghosts), stains: strip(L.stains), searched: [...L.searched].sort(),
    tiles: Array.from(L.tiles).join(''), seen: Array.from(L.seen).join(''), visible: Array.from(L.visible).join(''),
    turnsHere: L.turnsHere, clock: L.clock, strikes: L.strikes, tideOn: L.tideOn, rooms: L.rooms, start: L.start, stairs: L.stairs,
    stalker: L.stalker ? L.monsters.indexOf(L.stalker) : -1, floor: FLOORS.indexOf(L.floor),
    known: G.known, looks: G.looks, seenTypes: G.seenTypes, stats: G.stats, alias: G.alias || null,
    finaleWon: !!G.finaleWon, uiNibble: G.uiNibble || 0, msgSeq: G.msgSeq, log: G.log.map(l => [l.text, l.color, l.id]),
  });
})()`;
const titleText = H => { const seen = []; H.onText = s => seen.push(s); H.tick(120); H.onText = null; return seen; };
const fresh = store => { const H = createGame({ seed: SEED + 1, store }); H.press('x'); H.tick(60); return H; };

// --- 1. A run with a bit of everything in it, saved by taking a turn ----------------------
const H = createGame({ seed: SEED }), G = H.G;
check('nothing to carry on with at first', H.run('savedRun') === null && H.store['rot.run'] === undefined);
startGame(H, 3);
check('reaching the map saves the run', !!H.store['rot.run'] && H.run('savedRun.depth') === 3, H.run('savedRun'));
H.run(`{ const L = G.level, p = G.player;
  Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; }); G.cardQueue = [];
  p.gear.head = makeItem('armor', 0); p.gear.hand = makeItem('weapon', 2); p.gear.hand.plus = 2; p.gear.feet = { kind: 'pair', id: 'argyle', worn: true };
  p.inv.push(makeItem('scroll', 'fear'), makeItem('food', 'eggs'), { kind: 'sock', id: 'holey' }); p.gold = 77; p.dread = 61.5; p.wick = 203; p.poisoned = 3; p.poisonBy = 'tea';
  G.alias = 'Mildred'; G.known.potion.sight = true; G.stats.rooms = 2; G.stats.gags.hoarder = true; G.stats.lastStolen = 'Mumble-Muffin';
  L.turnsHere = stalkerDue(L.depth) + 5; spawnStalker(L);
  L.phantoms.push({ x: clamp(p.x + 7, 1, MAP_W - 2), y: p.y, kind: 'monster', type: 'opinion', ch: 'g', color: '#4fd6c8', name: 'Second Opinion', ttl: 50 });
  L.searched.add(41); L.searched.add(7); L.stains.push({ x: p.x, y: p.y, seed: 0.25, t0: FX.now, big: false });
  const thief = L.monsters.find(m => m.type !== 'tuck'); thief.carry = makeItem('potion', 'heal'); thief.awake = true; thief.fear = 4;
  p.hp = p.maxHp = 500; }`);
H.press(' '); // wait a turn: the world moves, and the run is saved
H.tick(200);
while (G.mode !== 'play') { H.press('Enter'); H.tick(200); }
const before = JSON.parse(H.run(FINGERPRINT));
check('the save holds a stalker, a hallucination, a thief with your things, and a floor in progress',
  before.stalker >= 0 && before.phantoms.length >= 1 && before.monsters.some(m => m.carry) && before.searched.length === 2, { stalker: before.stalker, phantoms: before.phantoms.length });

// --- 2. Close the tab; open the game again; carry on --------------------------------------
const H2 = fresh(H.store), G2 = H2.G;
const menu = titleText(H2);
check('the title offers to carry on, and says what beginning again costs',
  menu.includes('carry on as Somebody #1, on Floor 3') && menu.includes('begin again, and leave Somebody #1 down there') && !menu.includes('begin your descent'), menu.filter(s => /carry|begin/.test(s)));
H2.press('c');
H2.tick(100);
check('C puts you back on the map', G2.mode === 'play' && G2.depth === 3, G2.mode);
const after = JSON.parse(H2.run(FINGERPRINT));
const said = after.log.pop();
check('you are told so', /carry on, exactly where you were/.test(said[0]), said);
after.msgSeq--;
const differ = Object.keys(before).filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
check('everything is exactly as it was (player, horrors, things, map, memory, log)', differ.length === 0, differ);
check('shared things are still shared: the stalker is one of the horrors, each horror has its entry, the floor is the floor',
  H2.run(`G.level.stalker === G.level.monsters[${before.stalker}] && G.level.monsters.every(m => m.d === MONSTERS[m.type]) && G.level.floor === FLOORS[2] && G.level.searched instanceof Set && G.level.tiles instanceof Uint8Array`));
check('nothing saved counts as "just now" (no ribbon, dry stains)', H2.run('G.log.slice(0, -1).every(l => l.t < 0) && G.level.stains.every(s => s.t0 < 0)'));

// --- 3. The carried-on run plays on without trouble ---------------------------------------
{
  const rand = makeRandom(9), keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'a', 'g', 'r', '1', 'Escape', 'Enter', 'i', 'e'];
  let crashed = null;
  try {
    for (let i = 0; i < 400 && G2.mode !== 'dead' && G2.mode !== 'win'; i++) {
      H2.run('G.player.hp = G.player.maxHp');
      H2.press(keys[Math.floor(rand() * keys.length)]);
      H2.tick(60);
      if (G2.level) checkInvariants(H2);
    }
  } catch (e) { crashed = e.stack; }
  check('400 more key presses: no crash, the map stays sane, the turns go by', !crashed && G2.turn > before.turn, crashed || G2.turn);
  check('no console errors after carrying on', !H2.consoleLog.some(l => /^(warn|error)/.test(l)), H2.consoleLog.slice(0, 3));
}

// --- 4. Death, giving up and beginning again all wipe the save ----------------------------
{
  const D = fresh(H.store);
  D.press('c'); D.tick(100);
  D.run(`{ const p = G.player; p.hp = 1; hurtPlayer(50, 'opinion'); endTurn(); }`);
  D.tick(200);
  check('dying wipes the save', D.G.mode === 'dead' && D.run('savedRun') === null && D.store['rot.run'] === 'null', [D.G.mode, D.store['rot.run'] && D.store['rot.run'].slice(0, 20)]);
  const D2 = fresh(D.store);
  D2.press('c'); D2.tick(100);
  check('after that there is nothing to carry on with (C does nothing, the title says "begin your descent")', D2.G.mode === 'title' && titleText(D2).includes('begin your descent'));

  const Q = fresh(H.store);
  Q.press('c'); Q.tick(100); Q.press('q'); Q.press('q'); Q.tick(100);
  check('giving up (Q twice) wipes the save', Q.G.mode === 'title' && Q.run('savedRun') === null && Q.store['rot.run'] === 'null', Q.G.mode);

  const N = fresh(H.store);
  N.press('Enter'); N.tick(100);
  check('beginning again abandons the old run at once', N.run('savedRun') === null && N.G.runNo === 2, [N.run('savedRun'), N.G.runNo]);
  for (let i = 0; i < 80 && N.G.mode !== 'play'; i++) { N.press('Enter'); N.tick(40); }
  check('and the new run is saved as soon as it reaches the map', N.run('savedRun && savedRun.runNo') === 2 && N.run('savedRun.depth') === 1, N.run('savedRun'));

  const W = fresh(H.store);
  W.press('c'); W.tick(100); W.run('win()'); W.tick(100);
  check('winning wipes the save', W.run('savedRun') === null && W.store['rot.run'] === 'null');
}

// --- 5. A save that can't be trusted is thrown away ---------------------------------------
for (const [why, mangle] of [
  ['from another version', s => { const o = JSON.parse(s); o.version = 999; return JSON.stringify(o); }],
  ['cut short', s => s.slice(0, Math.floor(s.length / 2))],
  ['pointing at a horror that no longer exists', s => s.replace('"$d":["MONSTERS","tuck"]', '"$d":["MONSTERS","nosuchthing"]')],
  ['with no map in it', s => { const o = JSON.parse(s); o.run.nodes = o.run.nodes.map(n => (n.u8 ? { u8: [1, 2, 3] } : n)); return JSON.stringify(o); }],
]) {
  const store = Object.assign({}, H.store, { 'rot.run': mangle(H.store['rot.run']) });
  const B = fresh(store);
  B.press('c'); B.tick(100);
  check(`a save ${why} is thrown away, quietly`, B.G.mode === 'title' && B.run('savedRun') === null && !B.consoleLog.some(l => /^(warn|error)/.test(l)), [B.G.mode, B.consoleLog.slice(0, 2)]);
}

// --- 6. Enter can't pick a room's choice the instant its verse finishes -------------------
{
  const R = createGame({ seed: SEED + 2 });
  startGame(R);
  R.run(`{ const f = { kind: 'teaparty', x: G.player.x + 1, y: G.player.y, used: false, seen: true }; G.level.fixtures = [f]; showChoicePage(f); }`);
  R.tick(100);
  for (let i = 0; i < 12; i++) R.press('Enter'); // hurrying the verse along, and then some
  check('hammering Enter through the verse does not pick a choice', R.G.mode === 'choice' && !R.G.page.result && R.run('pageDone(G.page)'), [R.G.mode, !!R.G.page.result]);
  R.tick(RULES_PAUSE(R) - 100);
  R.press('Enter');
  check('nor does Enter just before the pause is up', !R.G.page.result);
  R.tick(200);
  R.press('Enter');
  check('after the pause, Enter picks the highlighted choice', !!R.G.page.result && R.G.page.result.choice === 'Pour yourself a cup', R.G.page.result && R.G.page.result.choice);

  const N = createGame({ seed: SEED + 3 });
  startGame(N);
  N.run(`{ const f = { kind: 'teaparty', x: G.player.x + 1, y: G.player.y, used: false, seen: true }; G.level.fixtures = [f]; showChoicePage(f); }`);
  N.tick(100);
  for (let i = 0; i < 12 && !N.run('pageDone(G.page)'); i++) N.press('Enter');
  N.press('3');
  check('a number key still picks at once', !!N.G.page.result && N.G.page.result.choice === 'Tiptoe away', N.G.page.result && N.G.page.result.choice);
}
function RULES_PAUSE(R) { return R.run('RULES.ui.choicePauseMs'); }

// --- 7. The face-off card goes where it covers the least ----------------------------------
{
  const F = createGame({ seed: SEED + 4 });
  startGame(F);
  const scene = spots => F.run(`(() => { const L = G.level, p = G.player;
    p.x = clamp(p.x, 12, MAP_W - 13); p.y = clamp(p.y, 8, MAP_H - 9);
    for (let dy = -6; dy <= 6; dy++) for (let dx = -10; dx <= 10; dx++) L.tiles[idx(p.x + dx, p.y + dy)] = T.FLOOR;
    L.monsters = []; L.items = []; L.fixtures = []; L.stairs = null; L.floor = Object.assign({}, L.floor, { light: 9 }); p.wick = 450; p.hp = p.maxHp = 999;
    Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; }); G.cardQueue = []; G.log.length = 0; G.logMark = 0;
    const ms = ${JSON.stringify(spots)}.map(([dx, dy]) => { const m = spawnMonster(L, 'mite', p.x + dx, p.y + dy); m.awake = false; return m; });
    computeFOV(L, p.x, p.y, lightRadius()); G.mode = 'play'; G.encounter = null; G.threat = null; G.turn++;
    openEncounter(ms[0], ${JSON.stringify(spots)}[0][0], ${JSON.stringify(spots)}[0][1]); })()`);
  const side = spots => { scene(spots); F.tick(200); return F.run('faceOffSide'); };
  check('nothing in the way: the card sits below you, as it always did', side([[1, 0]]) === 'below');
  check('the horror you are facing is below you: the card goes above it', side([[0, 1]]) === 'above');
  check('horrors below and above: the card goes to one side', ['left', 'right'].includes(side([[0, 1], [0, -2], [1, -2], [-1, -2]])));
  check('horrors below, above and to the right: the card goes left', side([[0, 1], [0, -2], [1, -2], [-1, -2], [3, 0], [3, 1]]) === 'left');
  const a = side([[0, 1]]);
  F.tick(600);
  check('the card stays put while nothing changes', F.run('faceOffSide') === a);
}

finish();
