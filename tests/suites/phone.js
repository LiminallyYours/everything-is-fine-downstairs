'use strict';
// The phone layout (js/draw/phone.js) and touch (js/touch.js): every tap becomes the right key
// press in every mode; holding a finger walks and stops as holding a key does; a stray tap on the
// title can't throw a saved run away; the odd rooms' half-second holds for taps; at 390x844 and
// 412x915 nothing is cut off and everything you can tap is at least a fingertip; written sounds
// from outside the view are pinned to its edge on their side; a phone held sideways asks to be
// turned; and on a computer none of it does anything.

const { createGame, checker, startGame } = require('./lib');

const SEED = Number(process.env.SEED) || 1212;
const { check, finish } = checker('phone');
const SIZES = [[390, 844], [412, 915]];

// A phone: the game at that size, every key press recorded (taps go through pressKey, like keys).
function phone(w, h, opts = {}) {
  const H = createGame(Object.assign({ seed: SEED, width: w, height: h }, opts));
  H.run(`globalThis.__keys = []; { const orig = pressKey; pressKey = function (k, r) { __keys.push(r ? k + '(held)' : k); return orig(k, r); }; }`);
  H.keys = () => H.run('__keys.splice(0)');
  H.targets = () => JSON.parse(H.run('JSON.stringify(Taps.list.map(t => ({ name: t.name, x: t.x, y: t.y, w: t.w, h: t.h, map: !!t.map, act: !!t.act })))'));
  H.find = name => H.targets().filter(t => t.name === name).pop();
  H.down = (x, y) => { for (const fn of H.listeners.pointerdown || []) fn({ clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', preventDefault() {} }); };
  H.up = () => { for (const fn of H.listeners.pointerup || []) fn({ pointerId: 1, pointerType: 'touch' }); };
  H.tapXY = (x, y, ms = 60) => { H.down(x, y); H.up(); H.tick(ms); };
  H.tap = (name, ms = 60) => {
    const t = H.find(name);
    if (!t) throw new Error(`nothing to tap called "${name}" in mode ${H.G.mode}: ${H.targets().map(t => t.name).join(', ')}`);
    H.tapXY(t.x + t.w / 2, t.y + t.h / 2, ms);
    return t;
  };
  H.tick(60);
  H.keys();
  return H;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const toMap = H => { for (let i = 0; i < 80 && H.G.mode !== 'play'; i++) { H.press('Enter'); H.tick(40); } H.tick(60); H.keys(); };

// Every target on screen fits on it and is at least a fingertip; collected as we go.
const FINGER = 44, tooSmall = [], offScreen = [];
function sizesOK(H, where) {
  const [W, Ht] = H.run('[W, H]');
  for (const t of H.targets()) {
    if (t.w < FINGER - 0.01 || t.h < FINGER - 0.01) tooSmall.push(`${where}: ${t.name} ${Math.round(t.w)}x${Math.round(t.h)}`);
    if (t.x < -0.5 || t.y < -0.5 || t.x + t.w > W + 0.5 || t.y + t.h > Ht + 0.5) offScreen.push(`${where}: ${t.name}`);
  }
}

// --- 1. Which layout, and the map's width --------------------------------------------------
for (const [w, h] of SIZES) {
  const H = phone(w, h);
  const L = H.run('({ on: Phone.on, across: View.w / View.S, S: View.S, W, H, setting: RULES.phone.across })');
  check(`${w}x${h}: the phone layout switches on by itself, ${L.setting} squares across (RULES.phone.across)`, L.on && Math.abs(L.across - L.setting) < 0.6 && L.W === w && L.H === h, L);
}
{
  const H = createGame({ seed: SEED, width: 1440, height: 900 });
  H.tick(60);
  const before = H.G.mode;
  for (const fn of H.listeners.pointerdown || []) fn({ clientX: 700, clientY: 450, pointerId: 1, preventDefault() {} });
  H.tick(60);
  check('a computer: no phone layout, nothing to tap, and a tap does nothing', !H.run('Phone.on') && H.run('Taps.list.length') === 0 && H.G.mode === before, H.run('Phone.on'));
  const small = createGame({ seed: SEED, width: 500, height: 400 });
  check('a small computer window keeps the computer layout and its 640 by 420 minimum', !small.run('Phone.on') && same(small.run('[W, H]'), [640, 420]), small.run('[W, H]'));
  startGame(H);
  H.press('b'); H.tick(100);
  const opened = H.G.mode === 'bestiary';
  H.press('Escape'); H.tick(60);
  check('B during a run opens the bestiary, and Esc goes back to the map (no turn taken)', opened && H.G.mode === 'play' && H.G.turn === 0, H.G.mode);
}

// --- 2. Every tap is the right key, mode by mode (390x844) -----------------------------------
const H = phone(390, 844), G = H.G;
check('the splash: a tap anywhere is a key press', (H.tapXY(30, 800), same(H.keys(), ['Enter']) && G.mode === 'title'));
sizesOK(H, 'title');
for (const [name, key, mode] of [['title:G', 'G', 'graveyard'], ['title:B', 'B', 'bestiary'], ['title:?', '?', 'help']]) {
  H.tap(name);
  const sent = H.keys(), m = G.mode;
  sizesOK(H, m);
  H.tap(m === 'graveyard' ? 'grave:close' : m === 'bestiary' ? 'book:close' : 'close');
  H.keys();
  check(`the title: "${name.slice(6)}" sends ${key} and opens the ${mode}, and its close button goes back`, same(sent, [key]) && m === mode && G.mode === 'title', { sent, m, back: G.mode });
}
H.tap('title:Enter');
check('the title: "begin your descent" sends Enter', same(H.keys(), ['Enter']) && G.mode === 'story');
for (let i = 0; i < 6 && G.mode === 'story'; i++) { sizesOK(H, 'story'); H.tapXY(200, 300, 40); }
check('a verse page: a tap anywhere is Enter', H.keys().every(k => k === 'Enter'));
toMap(H);
sizesOK(H, 'play');
H.run(`{ const L = G.level, p = G.player; L.monsters = []; L.items = []; G.cardQueue = [];
  for (let dx = -4; dx <= 4; dx++) for (let dy = -4; dy <= 4; dy++) { const x = p.x + dx, y = p.y + dy; if (x > 0 && y > 0 && x < MAP_W - 1 && y < MAP_H - 1 && L.tiles[idx(x, y)] !== T.STAIRS) L.tiles[idx(x, y)] = T.FLOOR; }
  computeFOV(L, p.x, p.y, lightRadius()); }`);
H.tick(300);
const at = () => H.run('(() => { const p = G.player, S = View.S, [dx, dy] = p.drawAt || [p.x, p.y]; return { x: sx(dx) + S / 2, y: sy(dy) + S / 2, S }; })()');
{
  const sent = [];
  for (const [dx, dy, key] of [[3, 0, 'ArrowRight'], [-3, 0, 'ArrowLeft'], [0, 3, 'ArrowDown'], [0, -3, 'ArrowUp'], [2, -1, 'ArrowRight'], [-1, 2.5, 'ArrowDown'], [0.2, -6, 'ArrowUp']]) {
    const c = at();
    H.tapXY(c.x + dx * c.S, c.y + dy * c.S, 300);
    sent.push([key, H.keys()]);
  }
  check('the map: a tap is a step toward it, by which of four triangles meeting at you it falls in', sent.every(([k, got]) => same(got, [k])), sent);
  const c = at();
  H.tapXY(c.x, c.y);
  check('the map: tapping your own square off the stairs does nothing', H.keys().length === 0);
  H.run('{ const L = G.level, p = G.player; L.tiles[idx(p.x, p.y)] = T.STAIRS; L.stairs = { x: p.x, y: p.y }; }');
  H.tick(200);
  const d0 = G.depth, c2 = at();
  H.tapXY(c2.x, c2.y, 100);
  check('the map: tapping your own square on the stairs goes down (>)', same(H.keys(), ['>']) && G.depth === d0 + 1, G.depth);
  toMap(H);
}
{
  const want = { 'button:Hold still': [' '], 'button:Rhyme': ['r'], 'button:Pockets': ['i'], 'button:Pick up': ['g'] };
  const got = {};
  for (const name of Object.keys(want)) {
    H.tap(name);
    got[name] = H.keys();
    while (G.mode !== 'play') { H.press('Escape'); H.tick(40); }
    H.keys();
  }
  check('the four buttons send space, R, I and G', Object.keys(want).every(k => same(got[k], want[k])), got);
  H.tap('story');
  check('tapping the story strip opens the log (L); any tap closes it', same(H.keys(), ['l']) && G.mode === 'log' && (sizesOK(H, 'log'), H.tapXY(100, 100), G.mode === 'play'), G.mode);
  H.keys();
}
{ // the menu
  H.tap('menu');
  sizesOK(H, 'menu');
  const open = H.run('PhoneMenu.open');
  const got = {};
  for (const [k, mode] of [['e', 'gear'], ['l', 'log'], ['b', 'bestiary'], ['?', 'help']]) {
    if (!H.run('PhoneMenu.open')) H.tap('menu');
    H.tap('menu:' + k);
    got[k] = [H.keys(), G.mode];
    sizesOK(H, G.mode);
    H.press('Escape'); H.tick(60); H.keys();
  }
  H.tap('menu');
  const muted = H.run('Sound.muted');
  for (const k of ['m', 'v', 'f']) H.tap('menu:' + k);
  got.mvf = H.keys();
  const toggled = H.run('Sound.muted') !== muted && H.run('PhoneMenu.open');
  for (const k of ['m', 'v', 'f']) H.tap('menu:' + k);
  H.keys();
  check('the menu: gear, the log, the bestiary and help send E, L, B and ?; sound, voice and calmer effects send M, V and F and stay open',
    open && same(got.e, [['e'], 'gear']) && same(got.l, [['l'], 'log']) && same(got.b, [['b'], 'bestiary']) && same(got['?'], [['?'], 'help']) && same(got.mvf, ['m', 'v', 'f']) && toggled, got);
  H.tap('menu:q');
  const armed = H.run('G.quitArmed') && H.run('PhoneMenu.open') && G.mode === 'play';
  H.tap('menu:close');
  H.tapXY(at().x + View_S(H) * 3, at().y);
  const disarmed = !H.run('G.quitArmed');
  H.keys();
  check('the menu: Give up is Q, and needs a second tap to confirm (any other step keeps you going)', armed && disarmed);
}
function View_S(Hh) { return Hh.run('View.S'); }
// face to face: walk into a horror, and its card's buttons
const spawnNext = (type, awake = true) => H.run(`(() => { const L = G.level, p = G.player; L.monsters = []; G.cardQueue = [];
  const m = spawnMonster(L, '${type}', p.x + 1, p.y); m.awake = ${awake}; G.seenTypes['${type}'] = true; markBestiary('${type}'); computeFOV(L, p.x, p.y, lightRadius()); return true; })()`);
{
  spawnNext('opinion');
  H.tick(100);
  const c = at();
  H.tapXY(c.x + c.S * 3, c.y, 200);
  H.keys();
  check('walking into a horror by tapping brings up the face-off card', G.mode === 'encounter', G.mode);
  sizesOK(H, 'encounter');
  const names = H.targets().map(t => t.name);
  check('the face-off card: attack, rhyme, use something and back off are buttons; Hold still and Pick up wait for your answer',
    ['card:a', 'card:r', 'card:u', 'card:Escape'].every(n => names.includes(n)) && !names.includes('button:Hold still') && !names.includes('button:Pick up'), names);
  const got = {};
  for (const k of ['a', 'r', 'u', 'Escape']) {
    if (G.mode !== 'encounter') { G.mode = 'play'; H.run('G.page = null; G.rhyme = null; G.encounter = null'); spawnNext('opinion'); H.tick(60); H.tapXY(at().x + at().S * 3, at().y, 200); H.keys(); }
    H.run('G.player.hp = G.player.maxHp = 500; G.player.verve = 3; G.level.monsters.forEach(m => { m.hp = m.maxHp = 500; })');
    H.tap('card:' + k, 100);
    got[k] = [H.keys(), G.mode];
  }
  check('the face-off card sends A, R, U and Esc', same(got.a[0], ['a']) && same(got.r, [['r'], 'rhyme']) && same(got.u, [['u'], 'inventory']) && same(got.Escape[0], ['Escape']), got);
  H.run('G.mode = "play"; G.back = "play"; G.page = null; G.rhyme = null; G.encounter = null');
}
{ // the card after a horror goes for you
  spawnNext('opinion');
  H.run('{ G.player.hp = G.player.maxHp = 500; const m = G.level.monsters[0]; m.hp = m.maxHp = 500; G.threat = { m, turn: G.turn, t: FX.now, result: "hit", verb: "gnaws", dmg: 2 }; }');
  H.tick(500);
  sizesOK(H, 'threat');
  const names = H.targets().map(t => t.name);
  H.tap('card:a', 100);
  check('the card after a blow: attack, rhyme and use something are buttons (you can still walk away); attack sends A',
    ['card:a', 'card:r', 'card:u'].every(n => names.includes(n)) && !names.includes('card:Escape') && same(H.keys(), ['a']), names);
}
{ // pockets
  H.run(`{ G.mode = 'play'; G.level.monsters = []; G.threat = {}; const p = G.player; p.inv = [makeItem('food', 'eggs'), makeItem('potion', 'heal'), makeItem('weapon', 1), makeItem('scroll', 'fear')]; }`);
  H.tick(60);
  H.tap('button:Pockets');
  H.keys();
  sizesOK(H, 'pockets');
  H.tap('pocket:2');
  const sel = H.run('G.invSel'), k1 = H.keys();
  H.tap('pocket:0');
  const k0 = H.keys();
  H.tap('pockets:d', 100);
  const drop = H.keys(), dropped = H.run('G.player.inv.length') === 3;
  H.tap('button:Pockets'); H.keys();
  H.tap('button:Hold still', 100);
  const through = H.keys();
  check('pockets: tapping a row chooses it (arrow presses), Drop is D, and a button over the pockets closes them first',
    sel === 2 && same(k1, ['ArrowDown', 'ArrowDown']) && same(k0, ['ArrowDown', 'ArrowDown']) && same(drop, ['d']) && dropped && same(through, ['Escape', ' ']) && G.mode === 'play',
    { sel, k1, k0, drop, through });
  // aimed at a horror: Throw it
  spawnNext('opinion');
  H.run('G.player.inv.unshift(makeItem("potion", "poison"))');
  H.tick(60);
  H.tapXY(at().x + at().S * 3, at().y, 200);
  H.tap('card:u');
  H.keys();
  H.tap('pocket:0');
  const names = H.targets().map(t => t.name);
  H.tap('pockets:t', 100);
  check('pockets aimed at a horror: a potion can be thrown (T)', names.includes('pockets:t') && same(H.keys(), ['t']), names);
  H.run('G.mode = "play"; G.back = "play"; G.level.monsters = []; G.encounter = null; G.useTarget = null; G.threat = {};');
}
{ // gear
  H.run(`{ const p = G.player; p.gear.head = null; p.inv = [makeItem('armor', 0), makeItem('weapon', 1)]; G.mode = 'play'; }`);
  H.tick(60);
  H.tap('menu'); H.tap('menu:e'); H.keys();
  sizesOK(H, 'gear');
  H.tap('slot:head');
  const k = H.keys(), sel = H.run('G.gearSel');
  H.tap('wear:0', 100);
  const wear = H.keys(), worn = H.run('!!G.player.gear.head');
  H.tap('gear:t', 100);
  const off = H.keys(), takenOff = H.run('!G.player.gear.head');
  H.tap('gear:i');
  const toPockets = [H.keys(), G.mode];
  H.press('Escape'); H.tick(60); H.keys();
  check('gear: a slot is chosen by arrow presses, an item from your pockets is put on by its number, Take it off is T, Pockets is I',
    sel === 1 && same(k, ['ArrowDown']) && same(wear, ['1']) && worn && same(off, ['t']) && takenOff && same(toPockets, [['i'], 'inventory']), { k, sel, wear, off, toPockets });
}
{ // which rhyme, and the words
  H.run('G.player.verve = 3; G.mode = "play";');
  H.tap('button:Rhyme', 100);
  H.keys();
  sizesOK(H, 'which rhyme');
  const names = H.targets().map(t => t.name);
  H.tapXY(195, 30, 60); // above the boxes: nothing
  const stray = H.keys();
  H.tap('kind:never', 60);
  const never = [H.keys(), G.mode];
  H.tap('button:Rhyme', 100); H.keys();
  H.tap('kind:lullaby', 100);
  const kind = [H.keys(), H.run('G.rhyme.kind')];
  for (let i = 0; i < 40 && !H.run('G.rhyme.fuseT0'); i++) H.tick(200);
  sizesOK(H, 'rhyme words');
  const words = H.targets().map(t => t.name).filter(n => n.startsWith('word:'));
  const page = H.targets().some(t => t.name === 'page');
  H.tap('word:2', 100);
  const answer = [H.keys(), H.run('G.rhyme.result && G.rhyme.result.word === G.rhyme.options[2]')];
  check('which rhyme: the three kinds send 1, 2 and 3, "never mind" is Esc, and a tap elsewhere picks nothing',
    ['kind:shove', 'kind:lullaby', 'kind:twister'].every(n => names.includes(n)) && !names.includes('page') && stray.length === 0 && same(never, [['Escape'], 'play']) && same(kind, [['2'], 'lullaby']), { names, stray, never, kind });
  check('the rhyme words: four boxes sending 1 to 4, and no stray tap answers for you', same(words, ['word:0', 'word:1', 'word:2', 'word:3']) && !page && same(answer, [['3'], true]), { words, page, answer });
  H.tick(2500);
  toMap(H);
}
{ // the odd rooms, and their half-second
  H.run(`G.mode = 'play'; showChoicePage(G.level.fixtures && G.level.fixtures[0] || { kind: 'teaparty', x: G.player.x, y: G.player.y })`);
  H.tick(100);
  for (let i = 0; i < 20 && !H.run('pageDone(G.page)'); i++) H.tapXY(195, 100, 0); // hurrying the verse
  H.tick(34); // one frame: the choices are drawn, and can be tapped
  H.keys();
  sizesOK(H, 'odd room');
  H.tap('choice:1', 0);
  const early = [H.keys(), H.run('!!G.page.result'), H.run('G.page.sel')];
  H.tick(RULES_pause(H) + 20);
  H.tap('choice:1', 60);
  const later = [H.keys(), H.run('!!G.page.result')];
  check("the odd rooms: a tap on a choice straight after hurrying the verse picks nothing (the half-second holds for taps too); it only moves the choice",
    same(early[0], ['ArrowDown', 'Enter']) && early[1] === false && early[2] === 1, early);
  check('the odd rooms: after the half-second, the same tap chooses it (Enter)', same(later, [['Enter'], true]), later);
  H.tick(600);
  sizesOK(H, 'odd room result');
  H.tapXY(195, 400, 60);
  check('the odd rooms: after the result, a tap goes on (Enter)', G.mode === 'play', G.mode);
}
function RULES_pause(Hh) { return Hh.run('RULES.ui.choicePauseMs'); }
{ // death: three lines, and only they do anything
  H.run('G.killer = "a Second Opinion"; G.player.hp = 0; die();');
  for (let i = 0; i < 40 && !H.run('G.mode === "dead" && pageDone(G.page)'); i++) H.tapXY(195, 200, 200);
  H.tick(100); H.keys();
  sizesOK(H, 'tomb');
  const names = H.targets().map(t => t.name);
  H.tapXY(195, 60, 60);
  const stray = [H.keys(), G.mode];
  H.tap('tomb:g');
  const g = [H.keys(), G.mode];
  sizesOK(H, 'graveyard');
  H.tap('grave:close');
  H.tap('tomb:t');
  check('the tombstone: again, the graveyard and the title are lines to tap (Enter, G, T); a stray tap does nothing',
    ['tomb:Enter', 'tomb:g', 'tomb:t'].every(n => names.includes(n)) && !names.includes('page') && same(stray, [[], 'dead']) && same(g, [['g'], 'graveyard']) && G.mode === 'title', { names, stray, g });
}

// --- 3. A stray tap on the title can't throw a saved run away --------------------------------
{
  const Hs = phone(390, 844);
  Hs.tapXY(100, 100);
  startGame(Hs);
  Hs.press(' '); Hs.tick(100);
  Hs.run('goTitle()'); Hs.tick(100); Hs.keys();
  const saved = () => Hs.run('savedRun && savedRun.runNo');
  const runNo = saved();
  const begin = Hs.find('title:Enter'), carry = Hs.find('title:C');
  const buttons = Hs.targets();
  let stray = 0, sentByStray = [];
  for (let y = 4; y < 844; y += 13) {
    for (let x = 4; x < 390; x += 13) {
      if (buttons.some(t => x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h)) continue;
      Hs.tapXY(x, y, 0);
      stray++;
      const k = Hs.keys();
      if (k.length) sentByStray.push([x, y, k]);
    }
  }
  check(`the title with a run saved: ${stray} taps off the lines send nothing, and the run is still saved`, sentByStray.length === 0 && saved() === runNo && Hs.G.mode === 'title', sentByStray.slice(0, 5));
  check('the title with a run saved: "carry on" is first, and "begin again" is its own line', !!carry && !!begin && carry.y < begin.y && begin.y >= carry.y + carry.h, { carry, begin });
  sizesOK(Hs, 'title, run saved');
  Hs.tap('title:C', 100);
  check('the title: "carry on" sends C and carries on', same(Hs.keys(), ['C']) && Hs.G.mode === 'play' && saved() === runNo);
}

// --- 4. Holding a finger walks, and stops as holding a key does --------------------------------
function corridor(Hh) {
  Hh.run(`{ const L = G.level, p = G.player; L.monsters = []; L.items = []; L.phantoms = []; G.cardQueue = []; L.fixtures = [];
    p.x = 5; p.y = Math.floor(MAP_H / 2); p.hp = p.maxHp = 500; p.dread = 0; p.wick = 400;
    for (let x = 1; x < MAP_W - 1; x++) for (let y = p.y - 1; y <= p.y + 1; y++) L.tiles[idx(x, y)] = y === p.y ? T.FLOOR : T.WALL;
    computeFOV(L, p.x, p.y, lightRadius()); }`);
  Hh.tick(200); Hh.keys();
}
{
  const Hh = phone(390, 844), Gh = Hh.G;
  Hh.tapXY(100, 100);
  startGame(Hh);
  corridor(Hh);
  const R = Hh.run('({ d: RULES.phone.holdDelayMs, r: RULES.phone.holdRepeatMs })');
  const pos = () => Hh.run('G.player.x');
  const x0 = pos(), here = Hh.run('(() => { const p = G.player, S = View.S; return { x: sx(p.x) + S / 2, y: sy(p.y) + S / 2, S }; })()');
  Hh.down(here.x + here.S * 4, here.y);
  Hh.tick(R.d + R.r * 4 + 20);
  const walked = pos() - x0, keys = Hh.keys();
  Hh.up();
  Hh.tick(R.r * 4);
  const afterLift = pos() - x0;
  check('holding a finger down walks that way, a step at a time, as held key presses', walked >= 5 && keys[0] === 'ArrowRight' && keys.slice(1).every(k => k === 'ArrowRight(held)'), { walked, keys });
  check('lifting the finger stops you', afterLift === walked && Hh.keys().length === 0, { walked, afterLift });
  // an awake horror comes into view: the held walk is refused, and ends
  corridor(Hh);
  const y = Hh.run('G.player.y');
  Hh.down(here.x + here.S * 4, here.y);
  Hh.tick(R.d + R.r + 20);
  Hh.run(`{ const L = G.level, p = G.player; const m = spawnMonster(L, 'zombie', p.x + 6, p.y); m.awake = true; G.seenTypes.zombie = true; markBestiary('zombie'); G.cardQueue = []; computeFOV(L, p.x, p.y, lightRadius()); }`);
  const at1 = pos();
  Hh.keys();
  Hh.tick(R.r * 3);
  const refused = Hh.keys().filter(k => k.endsWith('(held)'));
  const stoppedAt = pos();
  Hh.run('G.level.monsters = []');
  Hh.tick(R.r * 3);
  const resumed = pos() !== at1;
  Hh.up();
  // the keyboard, held the same way, is refused the same way
  corridor(Hh);
  Hh.run(`{ const L = G.level, p = G.player; const m = spawnMonster(L, 'zombie', p.x + 6, p.y); m.awake = true; computeFOV(L, p.x, p.y, lightRadius()); }`);
  const kx = pos();
  Hh.press('ArrowRight', true);
  check('an awake horror coming into view stops a held finger, as it stops a held key (and the walk is over)', stoppedAt === at1 && !resumed && refused.length === 1 && Hh.run('Touch.hold') === null && pos() === kx, { at1, stoppedAt, refused, resumed, key: [kx, pos()] });
  // a page opening stops it too
  corridor(Hh);
  Hh.down(here.x + here.S * 4, here.y);
  Hh.tick(R.d + 20);
  Hh.run("showBeastPage('mite')");
  const at2 = pos();
  Hh.tick(R.r * 3);
  check('a page opening stops a held finger', pos() === at2 && Gh.mode === 'card' && Hh.run('Touch.hold') === null, { mode: Gh.mode });
  Hh.up();
  void y;
}

// --- 5. Sounds from outside the view are pinned to its edge, on their side --------------------
{
  const Hc = phone(390, 844, { canvas: require('@napi-rs/canvas') });
  Hc.tapXY(100, 100);
  startGame(Hc);
  corridor(Hc);
  Hc.run('{ const p = G.player; p.x = Math.floor(MAP_W / 2); computeFOV(G.level, p.x, p.y, lightRadius()); }');
  Hc.tick(100);
  Hc.run(`{ globalThis.__drawn = []; const f = ctx.fillText.bind(ctx);
    ctx.fillText = function (s, x, y, mw) { const w = ctx.measureText(s).width, a = ctx.textAlign, m = ctx.getTransform();
      const left = a === 'center' ? x - w / 2 : a === 'right' || a === 'end' ? x - w : x;
      __drawn.push([String(s), (m.a * left + m.c * y + m.e) / dpr, (m.a * (left + w) + m.c * y + m.e) / dpr, (m.b * left + m.d * y + m.f) / dpr]);
      return mw === undefined ? f(s, x, y) : f(s, x, y, mw); }; }`);
  const V = Hc.run('({ x: View.x, y: View.y, w: View.w, h: View.h })');
  const sides = Hc.run(`(() => { updateCamera(true); const p = G.player, cx0 = Math.floor(View.camX), cy0 = Math.floor(View.camY), cols = Math.ceil(View.w / View.S), rows = Math.ceil(View.h / View.S);
    const out = {}; const put = (side, x, y) => { if (inMap(x, y)) { FX.word(x, y, side + '…'); out[side] = [x, y]; } };
    put('left', cx0 - 3, p.y); put('right', cx0 + cols + 3, p.y); put('up', p.x, cy0 - 3); put('down', p.x, cy0 + rows + 3); return out; })()`);
  Hc.run('__drawn = []');
  Hc.frame();
  const drawn = Hc.run('__drawn');
  const where = side => drawn.find(d => d[0] === side + '…');
  const res = {};
  for (const side of Object.keys(sides)) {
    const d = where(side);
    if (!d) { res[side] = 'not drawn'; continue; }
    const mid = (d[1] + d[2]) / 2, y = d[3];
    const inside = d[1] >= V.x && d[2] <= V.x + V.w && y >= V.y && y <= V.y + V.h;
    const onSide = side === 'left' ? mid < V.x + V.w * 0.25 : side === 'right' ? mid > V.x + V.w * 0.75 : side === 'up' ? y < V.y + V.h * 0.2 : y > V.y + V.h * 0.8;
    res[side] = inside && onSide ? 'ok' : [Math.round(mid), Math.round(y)];
  }
  check('written sounds from outside the view are drawn inside its edge, on the side they come from (the map is 26 high, so on a phone mostly left and right)', res.left && res.right && Object.values(res).every(v => v === 'ok'), { res, sides });

  // --- 6. Nothing is cut off at either size (every word drawn on screen, real canvas) ----------
  const cut = [];
  const look = (Hx, where2, mapOK) => {
    Hx.run('__drawn = []');
    Hx.frame();
    const [Wd, Hd] = Hx.run('[W, H]'), Vw = Hx.run('({ x: View.x, y: View.y, w: View.w, h: View.h })');
    for (const [s, l, r, y] of Hx.run('__drawn')) {
      if (!s.trim()) continue;
      const inMapArea = y > Vw.y && y < Vw.y + Vw.h;
      if (mapOK && inMapArea && Hx.G.mode === 'play') continue; // the map's own words move with the map (and are clipped to it, as on a computer)
      if (l < -1 || r > Wd + 1 || y < 0 || y > Hd + 2) cut.push(`${where2}: "${s.slice(0, 30)}" ${Math.round(l)}..${Math.round(r)} @${Math.round(y)}`);
    }
  };
  for (const [w, h] of SIZES) {
    const Hx = phone(w, h, { canvas: require('@napi-rs/canvas') });
    Hx.run(`{ globalThis.__drawn = []; const f = ctx.fillText.bind(ctx);
      ctx.fillText = function (s, x, y, mw) { const w = ctx.measureText(s).width, a = ctx.textAlign, m = ctx.getTransform();
        const left = a === 'center' ? x - w / 2 : a === 'right' || a === 'end' ? x - w : x;
        __drawn.push([String(s), (m.a * left + m.c * y + m.e) / dpr, (m.a * (left + w) + m.c * y + m.e) / dpr, (m.b * left + m.d * y + m.f) / dpr]);
        return mw === undefined ? f(s, x, y) : f(s, x, y, mw); }; }`);
    const tag = `${w}x${h}`;
    look(Hx, tag + ' splash');
    Hx.tapXY(100, 100);
    look(Hx, tag + ' title');
    startGame(Hx);
    Hx.run(`{ const p = G.player; p.gold = 4321; p.poisoned = 5; p.confused = 3; p.hoarse = 2; p.dread = 95; p.inv = [makeItem('weapon', 2), makeItem('armor', 1), makeItem('potion', 'heal'), makeItem('potion', 'heal'), makeItem('scroll', 'fear'), makeItem('food', 'eggs'), makeItem('food', 'ham'), makeItem('potion', 'poison'), {kind:'sock', id:'argyle'}, makeItem('armor', 0)];
      msg('The Second Opinion gnaws you, and then writes it down in a little notebook, with a diagram. (-3)'); }`);
    look(Hx, tag + ' play', true);
    for (const [k, m] of [['i', 'pockets'], ['e', 'gear'], ['?', 'help'], ['l', 'log']]) { Hx.press(k); Hx.tick(60); look(Hx, `${tag} ${m}`, false); Hx.press('Escape'); Hx.tick(60); }
    Hx.run('PhoneMenu.open = true'); look(Hx, tag + ' menu', false); Hx.run('PhoneMenu.open = false');
    Hx.press('b'); Hx.tick(100); look(Hx, tag + ' bestiary'); Hx.press('Escape'); Hx.tick(60);
    Hx.run(`G.player.hoarse = 3; G.player.verve = 3;`); Hx.press('r'); Hx.tick(100); look(Hx, tag + ' which rhyme');
    Hx.press('3'); for (let i = 0; i < 40 && !Hx.run('G.rhyme.fuseT0'); i++) Hx.tick(200); look(Hx, tag + ' rhyme words');
    Hx.press('1'); Hx.tick(2500); toMap(Hx);
    for (const kind of ['teaparty', 'birthday', 'mirror', 'lostfound', 'well', 'musicbox', 'namepile']) {
      Hx.run(`showChoicePage({ kind: '${kind}', x: G.player.x, y: G.player.y })`); Hx.tick(30000); look(Hx, `${tag} room ${kind}`);
      Hx.run('toPlay()');
    }
    for (const t of ['giraffe', 'nibbler', 'tuck', 'mimic', 'opinion']) { Hx.run(`showBeastPage('${t}')`); Hx.tick(20000); look(Hx, `${tag} beast ${t}`); Hx.run('toPlay()'); }
    for (const d of [1, 2, 3, 4, 5, 6]) { Hx.run(`enterFloor(${d}); showFloorPage()`); Hx.tick(30000); look(Hx, `${tag} floor ${d}`); Hx.run('toPlay()'); }
    Hx.run('G.killer = "Bottom Half – Giraffe"; G.player.hp = 0; G.player.gold = 99999; die();'); Hx.tick(30000); look(Hx, tag + ' tomb');
    Hx.press('g'); Hx.tick(100); look(Hx, tag + ' graveyard');
  }
  check('at 390x844 and 412x915 no words run off the screen, on any page or panel', cut.length === 0, cut.slice(0, 12));
}

check('at both sizes, everything you can tap is at least a fingertip (44 by 44)', tooSmall.length === 0, tooSmall.slice(0, 10));
check('at both sizes, everything you can tap is on the screen', offScreen.length === 0, offScreen.slice(0, 10));
for (const [w, h] of SIZES.slice(1)) { // the second size, quickly through the main screens
  const Hz = phone(w, h);
  Hz.tapXY(100, 100); sizesOK(Hz, `${w} title`);
  startGame(Hz); Hz.tick(100); sizesOK(Hz, `${w} play`);
  Hz.press('i'); Hz.tick(60); sizesOK(Hz, `${w} pockets`); Hz.press('Escape');
  Hz.press('e'); Hz.tick(60); sizesOK(Hz, `${w} gear`); Hz.press('Escape');
  Hz.run('PhoneMenu.open = true'); Hz.tick(60); sizesOK(Hz, `${w} menu`); Hz.run('PhoneMenu.open = false');
  Hz.press('r'); Hz.tick(100); sizesOK(Hz, `${w} which rhyme`);
  check(`${w}x${h}: everything you can tap is at least a fingertip, and on the screen`, tooSmall.length === 0 && offScreen.length === 0, tooSmall.concat(offScreen).slice(0, 10));
}

// --- 7. A phone held sideways --------------------------------------------------------------
{
  const Hs = createGame({ seed: SEED, width: 844, height: 390 });
  Hs.sandbox.matchMedia = q => ({ matches: q === '(pointer: coarse)' });
  const seen = [];
  Hs.onText = s => seen.push(s);
  Hs.run('resize()');
  Hs.tick(60);
  const before = Hs.G.mode;
  for (const fn of Hs.listeners.pointerdown || []) fn({ clientX: 400, clientY: 200, pointerId: 1, preventDefault() {} });
  Hs.tick(60);
  Hs.onText = null;
  check('a phone held sideways asks to be turned upright, and a tap does nothing else', Hs.run('Phone.sideways') && seen.includes(Hs.run('TEXT.ui.phone.sideways[0]')) && Hs.G.mode === before, { sideways: Hs.run('Phone.sideways'), mode: Hs.G.mode });
  const Hk = createGame({ seed: SEED, width: 844, height: 390 });
  check('the same size without a touch screen is a (small) computer window, with the computer layout', !Hk.run('Phone.on || Phone.sideways'));
}

finish();
