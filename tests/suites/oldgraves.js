'use strict';
// Old graves still work. Graves saved before gear and killers had ids (commit 5f091bd and
// earlier) keep gear with only a display name and the killer as plain text. Those graves must
// still show in the graveyard and on the title, still raise ghosts and bones, and their gear must
// loot, wear and draw: known names map to their id (and draw exactly like new gear), unknown
// ones get a fallback drawing.
//
//   node suites/oldgraves.js

const { createGame, checker } = require('./lib');

// Recorded by playing the game at commit 5f091bd (five deaths on floor 3: a Gloop of Regret,
// spoiled eggs, a biting wall, the tea party, the Tuck-You-In), exactly as it stored them.
const RECORDED = [
  {"run": 1, "depth": 3, "floor": "The Sock-Drawer Catacombs", "turns": 1, "level": 1, "gold": 0, "kills": 0, "date": "9/28/2026", "killer": "a Gloop of Regret", "epitaph": ["Oh, the places you'll go! Oh, the things you will see!", "Like a Gloop of Regret... and then nothing.", "Then dirt. Then a tree.", "They bonked no one. Pacifism is its own reward. This is the reward."], "won": false, "bones": [{"kind": "weapon", "plus": 2, "name": "Umbrella Most Unfortunate", "atk": 2, "tier": 2, "desc": "It only opens indoors."}, {"kind": "armor", "name": "Colander of Courage", "slot": "head", "def": 2, "tier": 3, "desc": "Keeps your thoughts in and the drips out."}, {"kind": "weapon", "plus": 0, "name": "Seven-Years Shard", "atk": 4, "tier": 4, "desc": "Bad luck, but pointy."}]},
  {"run": 2, "depth": 3, "floor": "The Sock-Drawer Catacombs", "turns": 1, "level": 1, "gold": 0, "kills": 0, "date": "9/28/2026", "killer": "a spoiled Plate of Green Eggs", "epitaph": ["Oh, the places you'll go! Oh, the things you will see!", "Like a spoiled Plate of Green Eggs... and then nothing.", "Then dirt. Then a tree.", "They bonked no one. Pacifism is its own reward. This is the reward."], "won": false, "bones": [{"kind": "armor", "name": "Sock-Knit Chainmail", "slot": "body", "def": 2, "tier": 3, "desc": "Knitted from ten thousand lost socks."}, {"kind": "pair", "id": "argyle", "worn": true}, {"kind": "food", "id": "eggs"}]},
  {"run": 3, "depth": 3, "floor": "The Sock-Drawer Catacombs", "turns": 1, "level": 1, "gold": 0, "kills": 0, "date": "9/28/2026", "killer": "a hungry wall", "epitaph": ["Somebody #3 took a step, then another, then three,", "then a hungry wall came by, and it wanted some tea.", "Now Somebody #3 rests here, all tidy and flat.", "At least they went out in a wonderful hat.", "They bonked no one. Pacifism is its own reward. This is the reward."], "won": false, "bones": [{"kind": "weapon", "plus": 0, "name": "Grumbling Garden Shears", "atk": 3, "tier": 3, "desc": "They complain the whole time, but they cut."}, {"kind": "armor", "name": "Knight-Shade Nightgown", "slot": "body", "def": 3, "tier": 5, "desc": "The comfiest armor ever feared."}, {"kind": "weapon", "plus": 0, "name": "Snicker-Snack Snipper", "atk": 4, "tier": 4, "desc": "It giggles when it hits."}]},
  {"run": 4, "depth": 3, "floor": "The Sock-Drawer Catacombs", "turns": 1, "level": 1, "gold": 0, "kills": 0, "date": "9/28/2026", "killer": "a cup of tea at a party", "epitaph": ["Beneath this small stone, in a very small hole,", "lies Somebody #4, a somewhat unfortunate soul.", "They met a cup of tea at a party. It did not go well.", "The rest of the story is too sad to tell.", "They bonked no one. Pacifism is its own reward. This is the reward."], "won": false, "bones": [{"kind": "weapon", "plus": 0, "name": "Spork of Sorrow", "atk": 1, "tier": 1, "desc": "Half spoon, half fork, all sadness."}, {"kind": "armor", "name": "Oobleck-Crusted Overcoat", "slot": "body", "def": 1, "tier": 2, "desc": "Sticky, but things bounce off it."}, {"kind": "armor", "name": "Tall Stripy Hat", "slot": "head", "def": 1, "tier": 1, "desc": "Very tall. Very stripy. Mildly protective."}]},
  {"run": 5, "depth": 3, "floor": "The Sock-Drawer Catacombs", "turns": 1, "level": 1, "gold": 0, "kills": 0, "date": "9/28/2026", "killer": "the Tuck-You-In", "epitaph": ["Oh, the places you'll go! Oh, the things you will see!", "Like the Tuck-You-In... and then nothing.", "Then dirt. Then a tree.", "They bonked no one. Pacifism is its own reward. This is the reward."], "won": false, "bones": [{"kind": "armor", "name": "Colander of Courage", "slot": "head", "def": 2, "tier": 3, "desc": "Keeps your thoughts in and the drips out."}, {"kind": "potion", "id": "sight"}]},
];
// Older still, written by hand: a v1 grave (no bones at all), a grave whose armor has no slot and
// whose gear has names this game doesn't know, and an escape.
const HAND_WRITTEN = [
  { run: 6, depth: 2, floor: 'The Gloomwood Glen', turns: 80, level: 2, gold: 12, kills: 3, date: '9/27/2026', killer: 'a Wocket', epitaph: ['Here lies Somebody #6.', 'The end.'], won: false },
  { run: 7, depth: 4, floor: 'The Sorrowful Sea-Caves', turns: 300, level: 5, gold: 90, kills: 20, date: '9/27/2026', killer: 'a Zizzer-Zazzer Zombie',
    epitaph: ['Somebody #7 was brave!', 'Somebody #7 is now exceptionally cold.'], won: false,
    bones: [
      { kind: 'armor', name: 'Tall Stripy Hat', def: 1, tier: 1, desc: 'Very tall. Very stripy. Mildly protective.' },
      { kind: 'weapon', name: 'Ladle of Last Resort', atk: 2, plus: 1, tier: 2, desc: 'Nobody remembers this one.' },
      { kind: 'armor', name: 'Mystery Poncho', def: 1, tier: 2, desc: 'Nobody remembers this one either.' },
    ] },
  { run: 8, depth: 6, floor: 'The Bottom of Below', turns: 900, level: 9, gold: 300, kills: 60, date: '9/28/2026', killer: '', epitaph: ['Got their name back. Sort of.'], won: true },
];
const OLD = RECORDED.concat(HAND_WRITTEN);
// What each old gear name should map to.
const EXPECT = {
  'Spork of Sorrow': 'spork', 'Umbrella Most Unfortunate': 'umbrella', 'Grumbling Garden Shears': 'shears',
  'Snicker-Snack Snipper': 'snipper', 'Butter-Side-Down Battle-Axe': 'axe', 'Seven-Years Shard': 'shard',
  'Tall Stripy Hat': 'nest', 'Oobleck-Crusted Overcoat': 'overcoat', 'Colander of Courage': 'colander',
  'Sock-Knit Chainmail': 'chainmail', 'Knight-Shade Nightgown': 'nightgown',
  'Ladle of Last Resort': null, 'Mystery Poncho': null,
};

const H = createGame({ seed: Number(process.env.SEED) || 77, store: { 'rot.graveyard': JSON.stringify(OLD), 'rot.runs': '8' } });
const G = H.G;
const { check, finish } = checker('oldgraves');
let drawn = [];
H.onText = s => drawn.push(s);
const errors = () => H.consoleLog.filter(l => /^(error|warn)/.test(l)).concat(H.loadErrors.map(e => String(e.error)));

// Every ink stroke a drawing makes, so two drawings can be compared exactly.
H.run(`(() => {
  globalThis.__trace = null;
  for (const name of ['stroke', 'ellipse', 'dot', 'spiral', 'zigzag', 'star', 'tuft']) {
    const real = globalThis[name];
    globalThis[name] = function (...a) {
      if (__trace) __trace.push(name + JSON.stringify(a, (k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v)));
      return real.apply(this, a);
    };
  }
  globalThis.__traceOf = fn => { __trace = []; Ink.t = 1.5; fn(); const t = __trace; __trace = null; return t.join('\\n'); };
})()`);

// 1. The title and the graveyard read the old graves.
H.press('x'); H.tick(300);
if (G.mode !== 'title') H.run('goTitle()');
drawn = []; H.tick(100);
check('the title names the most recent loss from an old grave', drawn.some(s => s.includes('Most recently, #7, by a Zizzer-Zazzer Zombie.')), drawn.filter(s => /Somebodies/.test(s)));
H.press('g'); H.tick(200);
const killers = OLD.filter(g => !g.won).map(g => g.killer);
const shownKillers = [];
for (let i = 0; i < OLD.length; i++) {
  drawn = []; H.tick(68);
  // a long row is cut short with an ellipsis, so look for the start of the killer's words
  for (const k of killers) if (drawn.some(s => s.includes('by ' + k.slice(0, 20)))) shownKillers.push(k);
  H.press('ArrowDown');
}
check('the graveyard lists every old grave with its killer as written', killers.every(k => shownKillers.includes(k)), { killers, missing: killers.filter(k => !shownKillers.includes(k)) });
H.press('Escape'); H.tick(100);
check('no errors drawing the title and graveyard', !errors().length, errors());

// 2. Ghosts and bones from each old grave, one at a time; looting puts the old gear in your pockets.
H.press('Enter');
for (let i = 0; i < 80 && G.mode !== 'play'; i++) { H.press('Enter'); H.tick(40); }
H.run(`Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; }); G.cardQueue = [];`);
const looted = [];
for (const g of OLD.filter(x => !x.won && x.bones)) {
  H.store['rot.graveyard'] = JSON.stringify(OLD);
  const r = H.run(`(() => {
    const keep = Store.load('graveyard', []).filter(x => x.run === ${g.run});
    Store.save('graveyard', keep);
    enterFloor(${g.depth}); toPlay();
    const L = G.level, p = G.player;
    L.monsters = []; L.stalker = null; p.inv = []; p.hp = p.maxHp = 999;
    const gh = L.ghosts.find(x => x.run === ${g.run}), b = L.items.find(i => i.item.kind === 'bones' && i.item.run === ${g.run});
    if (!gh || !b) return { ghost: !!gh, bones: !!b };
    const lines = gh.lines.slice();
    p.x = b.x; p.y = b.y; computeFOV(L, p.x, p.y, lightRadius());
    const before = G.log.length;
    pickUp();
    const log = G.log.slice(before).map(l => l.text);
    return { ghost: true, bones: true, lines, log, inv: p.inv.map(it => ({ name: itemName(it), id: it.kind === 'weapon' || it.kind === 'armor' ? gearId(it) : null, slot: gearSlot(it), kind: it.kind })),
      looted: Store.load('graveyard', []).find(x => x.run === ${g.run}).looted };
  })()`);
  check(`grave #${g.run}: a ghost and its bones appear`, r.ghost && r.bones, r);
  if (!r.bones) continue;
  check(`grave #${g.run}: the ghost says its old epitaph`, JSON.stringify(r.lines) === JSON.stringify(g.epitaph.slice(0, 4)), r.lines);
  check(`grave #${g.run}: the bones name the old killer`, r.log[0] === `Here lie the bones of Somebody #${g.run}, undone by ${g.killer}. You recognize the knees.`, r.log[0]);
  const want = g.bones.map(b => b.name || null).filter(Boolean);
  const got = r.inv.filter(i => i.kind === 'weapon' || i.kind === 'armor');
  check(`grave #${g.run}: its gear loots under its old names and maps to ids by name`,
    want.length === got.length && got.every((it, k) => it.name.replace(/ \+\d+$/, '') === want[k] && it.id === EXPECT[want[k]]), got);
  check(`grave #${g.run}: the grave is marked looted`, r.looted === true, r.looted);
  looted.push(...r.inv);
}
const slots = Object.fromEntries(looted.filter(i => i.kind === 'armor').map(i => [i.name, i.slot]));
check('old armor goes to the right slot (by name when it has none saved)',
  slots['Colander of Courage'] === 'head' && slots['Tall Stripy Hat'] === 'head' && slots['Sock-Knit Chainmail'] === 'body' && slots['Mystery Poncho'] === 'body', slots);
check('the old matching pair still goes on your feet', looted.some(i => i.kind === 'pair' && i.slot === 'feet'), looted.filter(i => i.kind === 'pair'));

// 3. Old gear draws exactly like new gear with the same id; unknown gear draws a fallback.
const drawCheck = H.run(`(() => {
  const all = ${JSON.stringify(OLD)}.flatMap(g => g.bones || []).filter(it => it.kind === 'weapon' || it.kind === 'armor');
  const out = [];
  for (const old of all) {
    const id = gearId(old);
    const fresh = id ? Object.assign({ kind: old.kind, plus: old.plus }, GEAR_BY_ID[id]) : null;
    const a = __traceOf(() => drawItem(old, 100, 100, 40));
    const b = fresh ? __traceOf(() => drawItem(fresh, 100, 100, 40)) : null;
    out.push({ name: old.name, id, same: b === null ? null : a === b, strokes: a.split('\\n').length });
  }
  return out;
})()`);
check('every old gear name draws exactly as the gear with its id', drawCheck.filter(d => d.id).every(d => d.same && d.strokes > 0), drawCheck.filter(d => d.id && !d.same));
const fallback = H.run(`(() => {
  const ladle = __traceOf(() => drawItem({ kind: 'weapon', name: 'Ladle of Last Resort', atk: 2, plus: 1 }, 100, 100, 40));
  const spork = __traceOf(() => drawItem({ kind: 'weapon', id: 'spork' }, 100, 100, 40));
  const poncho = __traceOf(() => drawItem({ kind: 'armor', name: 'Mystery Poncho', def: 1 }, 100, 100, 40));
  const coat = __traceOf(() => drawItem({ kind: 'armor', id: 'overcoat' }, 100, 100, 40));
  return { ladleIsSpork: ladle === spork, ponchoDrawn: poncho.length > 0, ponchoIsNotOvercoat: poncho !== coat };
})()`);
check('unknown old gear gets a fallback drawing (the spork, a plain coat)', fallback.ladleIsSpork && fallback.ponchoDrawn && fallback.ponchoIsNotOvercoat, fallback);
const worn = H.run(`(() => {
  const old = ${JSON.stringify(RECORDED[0].bones.concat(RECORDED[1].bones, RECORDED[3].bones))};
  const by = n => old.find(b => b.name === n || (b.kind === 'pair' && n === 'pair'));
  const fresh = n => Object.assign({ kind: by(n).kind, plus: by(n).plus }, GEAR_BY_ID[gearId(by(n))]);
  const oldGear = { hand: by('Umbrella Most Unfortunate'), head: by('Colander of Courage'), body: by('Sock-Knit Chainmail'), feet: by('pair') };
  const newGear = { hand: fresh('Umbrella Most Unfortunate'), head: fresh('Colander of Courage'), body: fresh('Sock-Knit Chainmail'), feet: { kind: 'pair', id: 'argyle' } };
  const a = __traceOf(() => drawPlayer(200, 200, 60, { gear: oldGear }));
  const b = __traceOf(() => drawPlayer(200, 200, 60, { gear: newGear }));
  const hat = __traceOf(() => drawPlayer(200, 200, 60, { gear: { head: by('Tall Stripy Hat'), body: by('Oobleck-Crusted Overcoat') } }));
  const hat2 = __traceOf(() => drawPlayer(200, 200, 60, { gear: { head: fresh('Tall Stripy Hat'), body: fresh('Oobleck-Crusted Overcoat') } }));
  return { colanderCoat: a === b, hatOvercoat: hat === hat2 };
})()`);
check('you look the same wearing old gear as new (colander, coat colour, socks, hat)', worn.colanderCoat && worn.hatOvercoat, worn);

// 4. Carry, wear and look at the old gear: pockets, the gear page and the margin all draw.
const wearing = H.run(`(() => {
  const p = G.player;
  p.inv = []; p.gear = { hand: null, head: null, body: null, feet: null };
  const old = ${JSON.stringify(OLD)}.flatMap(g => g.bones || []);
  for (const it of old.slice(-3).concat(old).slice(0, RULES.player.pockets)) p.inv.push(it);
  const names = [];
  for (const want of ['Colander of Courage', 'Ladle of Last Resort', 'Mystery Poncho']) {
    const i = p.inv.findIndex(it => it.name === want); if (i >= 0) { equip(i); names.push(want); }
  }
  return { head: p.gear.head && itemName(p.gear.head), hand: p.gear.hand && itemName(p.gear.hand), body: p.gear.body && itemName(p.gear.body), def: playerDef(), atk: playerAtk() };
})()`);
check('old gear can be worn and wielded, and counts', wearing.head === 'Colander of Courage' && wearing.hand === 'Ladle of Last Resort +1' && wearing.body === 'Mystery Poncho' && wearing.def >= 3, wearing);
drawn = [];
H.tick(100); H.press('i'); H.tick(100); H.press('ArrowDown'); H.tick(68); H.press('Escape'); H.press('e'); H.tick(100); H.press('Escape'); H.tick(100);
check('the pockets, the gear page and the margin draw the old gear by name', ['Colander of Courage', 'Ladle of Last Resort +1', 'Mystery Poncho'].every(n => drawn.some(s => s.includes(n))), drawn.filter(s => /Colander|Ladle|Poncho/.test(s)).slice(0, 6));
check('no errors with old gear on the map, in the pockets and on the gear page', !errors().length, errors());

// 5. New graves keep the killer's words and add its id; facts check the id.
const fresh = H.run(`(() => {
  const p = G.player; Store.save('graveyard', []);
  G.killer = ''; G.killerId = ''; p.hp = 1; G.mode = 'play';
  hurtPlayer(5, 'wall'); die();
  const g = Store.load('graveyard', []).pop();
  return { killer: g.killer, killerId: g.killerId, fact: G.fact, epitaph: g.epitaph.join(' ') };
})()`);
check('a new grave stores the killer as words and as an id', fresh.killer === 'a hungry wall' && fresh.killerId === 'wall', fresh);
const names = H.run(`[killerName('opinion'), killerName('tuck'), killerName('nibbler'), killerName('potion:poison'), killerName('food:ham'), killerName('tea'), killerName('wax'), killerName(''), killerName('bat'), killerName('zombie'), killerName('food:eggs')]`);
check('killer ids name their killers', JSON.stringify(names) === JSON.stringify(['a Second Opinion', 'the Tuck-You-In', 'the Nameless Nibbler', 'a Gloop of Regret', 'a spoiled Pie of Uncertain Origin', 'a cup of tea at a party', 'a mouthful of birthday wax', '', "Yesterday's Soup", 'Better-Late-Than-Never', "a spoiled Somebody Else's Breakfast"]), names);

finish();
