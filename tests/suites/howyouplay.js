'use strict';
// The "how you play" changes of November 2026: three kinds of rhyme (a shove, a lullaby, a
// tongue-twister) picked before you recite; a hoarse voice for rhyming too often; dark rooms with
// a prize; the Mold-Mite that sleeps in your lap; the Second Opinion that calls another; and the
// Tick-Tock Tot you can hear coming.

const { createGame, checker, startGame } = require('./lib');

const SEED = Number(process.env.SEED) || 909;
const { check, finish } = checker('howyouplay');
const H = createGame({ seed: SEED }), G = H.G;
startGame(H);
H.run(`Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; }); G.cardQueue = [];`);

// An open, walled-off patch of floor around you, with nothing else on it.
H.run(`globalThis.__clear = (depth) => {
  if (depth && depth !== G.depth) { enterFloor(depth); toPlay(); G.cardQueue = []; }
  const L = G.level, p = G.player;
  p.x = clamp(p.x, 14, MAP_W - 15); p.y = clamp(p.y, 9, MAP_H - 10);
  for (let dy = -8; dy <= 8; dy++) for (let dx = -13; dx <= 13; dx++) L.tiles[idx(p.x + dx, p.y + dy)] = Math.abs(dx) === 13 || Math.abs(dy) === 8 ? T.WALL : T.FLOOR;
  L.monsters = []; L.items = []; L.fixtures = []; L.phantoms = []; L.ghosts = []; L.stalker = null; L.turnsHere = 0; L.surprise = null; L.darkRoom = null;
  Object.assign(p, { hp: 9999, maxHp: 9999, wick: 400, dread: 0, confused: 0, poisoned: 0, hidden: false, darkTurns: 0,
    verve: 9, maxVerve: 9, hoarse: 0, hoarseTimer: 0, lastRhymeTurn: null, lastRhymeKind: 'shove', lap: [] });
  G.mode = 'play'; G.page = null; G.rhyme = null; G.threat = null; G.encounter = null; G.log.length = 0; G.logMark = 0;
  computeFOV(L, p.x, p.y, lightRadius());
};
// Recite a rhyme of this kind and get it right (or wrong).
globalThis.__rhyme = (kind, right = true) => {
  startRhyme(kind); G.rhyme.fuseT0 = 1;
  answerRhyme(right ? G.rhyme.options.indexOf(G.rhyme.answer) : G.rhyme.options.findIndex(o => o !== G.rhyme.answer));
  finishRhyme();
};`);
const logHas = re => G.log.some(l => re.test(l.text));

// --- 1. Three kinds of rhyme ---------------------------------------------------------------
{
  H.run(`__clear();`);
  H.press('r'); H.tick(40);
  const asked = H.run(`({ mode: G.mode, hold: !!(G.page && G.page.hold), kind: G.rhyme && G.rhyme.kind })`);
  check('R first asks which rhyme (the couplet waits)', asked.mode === 'rhyme' && asked.hold && asked.kind === null, asked);
  const shown = []; H.onText = s => shown.push(s); H.tick(80); H.onText = null;
  check('the page shows the three kinds', ['Which rhyme?', 'a Shove', 'a Lullaby', 'a Tongue-Twister'].every(w => shown.some(s => s.includes(w))), [...new Set(shown)].slice(0, 12));
  H.press('Escape'); H.tick(40);
  check('Esc: never mind, no ♪ spent and no turn taken', G.mode === 'play' && H.run('G.player.verve') === 9);
  for (const [key, kind] of [['1', 'shove'], ['2', 'lullaby'], ['3', 'twister'], ['ArrowLeft', 'shove'], ['ArrowUp', 'lullaby'], ['ArrowRight', 'twister']]) {
    H.run(`__clear();`); H.press('r'); H.tick(40); H.press(key); H.tick(40);
    const got = H.run(`({ kind: G.rhyme.kind, hold: G.page.hold })`);
    check(`key ${key} picks ${kind}, and the couplet begins`, got.kind === kind && !got.hold, got);
  }
  H.run(`__clear(); G.player.lastRhymeKind = 'twister';`); H.press('r'); H.tick(40); H.press('Enter'); H.tick(40);
  check('Enter picks the same kind as last time', H.run('G.rhyme.kind') === 'twister');
  H.run(`G.mode = 'play'; G.page = null;`);

  const crowd = `__clear(); const L = G.level, p = G.player;
    const ms = [[1, 0], [-2, 0], [0, 3], [5, 0]].map(([dx, dy]) => { const m = spawnMonster(L, 'opinion', p.x + dx, p.y + dy); m.awake = true; m.hp = m.maxHp = 50; return m; });`;
  const shove = H.run(`(() => { ${crowd} __rhyme('shove'); return ms.map(m => [50 - m.hp, m.stun]); })()`);
  check('a shove: everything within reach reels and is hurt a little (as before); the one far off is untouched',
    shove.slice(0, 3).every(([d, s]) => d >= 2 && d <= 4 && s > 0) && shove[3][0] === 0, shove);
  const lull = H.run(`(() => { ${crowd} __rhyme('lullaby');
    const after = ms.map(m => ({ hurt: 50 - m.hp, awake: m.awake, lulled: m.lulled }));
    const where = ms.map(m => m.x + ',' + m.y).join(' ');
    for (let k = 0; k < 5; k++) endTurn();
    return { after, still: ms.slice(0, 3).map(m => m.x + ',' + m.y).join(' ') === where.split(' ').slice(0, 3).join(' '), asleep: ms.slice(0, 3).every(m => !m.awake && m.lulled > 0), log: G.log.map(l => l.text) }; })()`);
  check('a lullaby: everything within reach lies down asleep, unhurt; the one far off is untouched',
    lull.after.slice(0, 3).every(a => a.hurt === 0 && !a.awake && a.lulled > 0) && lull.after[3].awake && !lull.after[3].lulled && lull.log.some(t => /3 horrors lie down/.test(t)), lull.after);
  check('lulled horrors stay where they are and stay asleep, even right beside you in plain sight', lull.still && lull.asleep, lull);
  const woke = H.run(`(() => { ${crowd} __rhyme('lullaby'); G.log.length = 0;
    for (let k = 0; k < 14; k++) tryMove(0, -1);
    return { up: ms.slice(0, 3).every(m => m.awake && !m.lulled), log: G.log.map(l => l.text) }; })()`);
  check('any noise (bumping a wall) wakes them all, and they are cross about it', woke.up && woke.log.some(t => /wakes up from their lullaby/.test(t)), woke);
  const wearsOff = H.run(`(() => { ${crowd} __rhyme('lullaby'); for (let k = 0; k < RULES.rhyme.lullaby.turns + 2; k++) { G.turn++; monstersAct(G.level); }
    return ms.slice(0, 3).every(m => !m.lulled); })()`);
  check(`left alone, the lullaby wears off after about ${H.run('RULES.rhyme.lullaby.turns')} turns`, wearsOff);
  const tuck = H.run(`(() => { __clear(); const L = G.level, p = G.player, t = spawnMonster(L, 'tuck', p.x + 2, p.y); t.awake = true; __rhyme('lullaby');
    return { awake: t.awake, lulled: !!t.lulled, stun: t.stun, log: G.log.map(l => l.text) }; })()`);
  check('the Tuck-You-In cannot be sung to sleep: it hums along and forgets itself (stunned)', tuck.awake && !tuck.lulled && tuck.stun > 0 && tuck.log.some(t => /hums along/.test(t)), tuck);
  const tw = H.run(`(() => { ${crowd} __rhyme('twister'); return ms.map(m => [50 - m.hp, m.stun]); })()`);
  const T = H.run('RULES.rhyme.twister');
  check(`a tongue-twister: only the nearest horror is hit, for ${T.damage[0]} to ${T.damage[1]}, and reels`,
    tw[0][0] >= T.damage[0] && tw[0][0] <= T.damage[1] && tw[0][1] > 0 && tw.slice(1).every(([d]) => d === 0), tw);
  const wrong = H.run(`(() => { ${crowd} __rhyme('lullaby', false); return { fails: G.stats.rhymeFails > 0, lulled: ms.some(m => m.lulled > 0) }; })()`);
  check('a wrong word does what a wrong word always did, whatever the kind (nobody is sung to sleep)', wrong.fails && !wrong.lulled, wrong);
}

// --- 2. A hoarse voice ---------------------------------------------------------------------
{
  const run = H.run(`(() => { __clear(); const p = G.player, out = { stages: [], ms: [], shown: [] };
    for (let k = 0; k < 4; k++) {
      startRhyme('shove'); out.ms.push(G.rhyme.ms); out.shown.push({ shown: G.rhyme.shown.slice(), options: G.rhyme.options.slice() });
      G.rhyme.fuseT0 = 1; answerRhyme(G.rhyme.options.indexOf(G.rhyme.answer)); finishRhyme();
      out.stages.push(p.hoarse);
    }
    out.log = G.log.map(l => l.text);
    return out; })()`);
  const Hs = H.run('RULES.rhyme.hoarse');
  check('rhymes close together make you hoarser, one stage each, up to the most', JSON.stringify(run.stages) === JSON.stringify([0, 1, 2, 3].map(s => Math.min(s, Hs.most))), run.stages);
  check('the narrator says so', run.log.some(t => /going hoarse/.test(t)) && run.log.some(t => /very hoarse/.test(t)), run.log.filter(t => /hoarse/.test(t)));
  check(`each stage burns the fuse ${Hs.fuseMs / 1000}s shorter`, run.ms[0] === run.ms[1] && run.ms[2] === run.ms[1] - Hs.fuseMs && run.ms[3] === run.ms[1] - 2 * Hs.fuseMs, run.ms);
  const blots = run.shown.map(s => s.shown.filter((w, i) => w !== s.options[i]).length);
  const fair = run.shown.every(s => s.shown.every((w, i) => w.length === s.options[i].length && /[a-z]/i.test(w)));
  check('a hoarse voice smudges the words on offer (never a whole word); a clear voice does not', blots[0] === 0 && blots[2] > 0 && run.shown[2].shown.some(w => w.includes('▒')) && fair, run.shown.map(s => s.shown));
  const rest = H.run(`(() => { const p = G.player; G.log.length = 0; const before = p.hoarse; for (let k = 0; k < RULES.rhyme.hoarse.rest; k++) { G.turn++; restVoice(p); } return { before, after: p.hoarse, log: G.log.map(l => l.text) }; })()`);
  check(`resting ${Hs.rest} turns brings one stage back`, rest.after === rest.before - 1 && rest.log.some(t => /voice comes back/.test(t)), rest);
  const spaced = H.run(`(() => { __clear(); const p = G.player; __rhyme('shove'); G.turn += RULES.rhyme.hoarse.within + 1; __rhyme('shove'); return p.hoarse; })()`);
  check(`rhymes more than ${Hs.within} turns apart don't make you hoarse`, spaced === 0, spaced);
  const tags = (() => { H.run(`__clear(); G.player.hoarse = 2;`); const seen = []; H.onText = s => seen.push(s); H.tick(80); H.onText = null; return seen; })();
  check('the margin says "hoarse · 2"', tags.some(s => /hoarse · 2/.test(s)), tags.filter(s => /hoarse/.test(s)));
  const fin = H.run(`(() => { __clear(); const L = G.level, p = G.player; p.hoarse = 3; const s = freeNeighbor(L, p.x, p.y); const m = spawnMonster(L, 'nibbler', s[0], s[1]); m.awake = true; startFinale(m); return { ms: G.rhyme.ms, last: RULES.rhyme.lastFuseMs }; })()`);
  check('the Last Rhyme is never cut short by a hoarse voice', fin.ms === fin.last, fin);
  H.run(`G.mode = 'play'; G.page = null;`);
}

// --- 3. Dark rooms -------------------------------------------------------------------------
{
  const D = createGame({ seed: SEED + 3 });
  startGame(D);
  const per = D.run(`(() => { const out = {};
    for (let n = 0; n < 6; n++) for (const d of [1, 2, 3, 4, 5, 6]) {
      enterFloor(d); toPlay(); G.cardQueue = [];
      const L = G.level, r = L.darkRoom, key = 'floor ' + d; out[key] = out[key] || [];
      if (!r) { out[key].push(null); continue; }
      const inside = (x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
      const gear = L.items.filter(it => inside(it.x, it.y) && (it.item.kind === 'weapon' || it.item.kind === 'armor'));
      out[key].push({ start: inside(L.start.x, L.start.y), stairs: !!L.stairs && inside(L.stairs.x, L.stairs.y), room: L.fixtures.some(f => inside(f.x, f.y)), gear: gear.length });
    }
    return out; })()`);
  check('floors 2 to 5 each have a dark room; floors 1 and 6 none', per['floor 1'].every(x => x === null) && per['floor 6'].every(x => x === null)
    && [2, 3, 4, 5].every(d => per['floor ' + d].every(x => x)), per);
  const all = [2, 3, 4, 5].flatMap(d => per['floor ' + d]);
  check('a dark room never holds where you start, the stairs or an odd room, and always has a piece of gear in it',
    all.every(x => !x.start && !x.stairs && !x.room && x.gear >= 1), all);
  const look = D.run(`(() => { enterFloor(3); toPlay(); G.cardQueue = []; const L = G.level, r = L.darkRoom, p = G.player;
    p.wick = 400; p.hidden = false; p.darkTurns = 0;
    const doors = darkRoomDoors(L); const [x, y, ox, oy] = doors[0];
    p.x = ox; p.y = oy; G.log.length = 0; computeFOV(L, p.x, p.y, lightRadius()); darkRoomTurn(L);
    let deep = 0; for (let yy = r.y; yy < r.y + r.h; yy++) for (let xx = r.x; xx < r.x + r.w; xx++) if (L.visible[idx(xx, yy)] && Math.max(Math.abs(xx - p.x), Math.abs(yy - p.y)) > 1) deep++;
    const outside = { light: lightRadius(), deep, noticed: r.seen, log: G.log.map(l => l.text) };
    p.x = x; p.y = y; G.log.length = 0; darkRoomTurn(L);
    const inside = { light: lightRadius(), dark: inDarkness(), log: G.log.map(l => l.text) };
    return { outside, inside }; })()`);
  check('from the doorway, with a good candle, you see no more than a step into it', look.outside.light > 1 && look.outside.deep === 0, look.outside);
  check('the first glimpse of its doorway: the narrator mentions it', look.outside.noticed && look.outside.log.some(t => /light will not go/.test(t)), look.outside.log);
  check('inside, your light shrinks to a dot whatever your candle, and it counts as the dark', look.inside.light === 1 && look.inside.dark && look.inside.log.some(t => /shrinks to a dot/.test(t)), look.inside);
  const saved = D.run(`(() => { const s = unpackRun(JSON.parse(JSON.stringify(packRun({ L: G.level })))); return !!s.L.darkRoom && s.L.darkRoom.w === G.level.darkRoom.w && inDarkRoom(s.L, G.level.darkRoom.x, G.level.darkRoom.y); })()`);
  check('a dark room is saved with the run', saved);
}

// --- 4. The Mold-Mite in your lap -----------------------------------------------------------
{
  const lap = H.run(`(() => { __clear(); const L = G.level, p = G.player; const m = spawnMonster(L, 'mite', p.x + 1, p.y); m.awake = true;
    act(wait);
    const climbed = { onMap: L.monsters.includes(m), lap: p.lap.length, log: G.log.map(l => l.text) };
    const hp = p.hp; for (let k = 0; k < 20; k++) act(wait);
    return { climbed, harmless: p.hp === hp && p.lap.length === 1 }; })()`);
  check('wait beside a Mold-Mite instead of fighting: it climbs into your lap and falls asleep', !lap.climbed.onMap && lap.climbed.lap === 1 && lap.climbed.log.some(t => /climbs into your lap/.test(t)), lap.climbed);
  check('in your lap it is harmless (20 turns, no bites)', lap.harmless, lap);
  const tags = (() => { const seen = []; H.onText = s => seen.push(s); H.tick(80); H.onText = null; return seen; })();
  check('the margin says a Mold-Mite is in your lap', tags.some(s => /Mold-Mite in your lap/.test(s)), tags.filter(s => /lap/.test(s)));
  const woke = H.run(`(() => { const L = G.level, p = G.player; G.log.length = 0; const hp = p.hp; let got = 0;
    for (let k = 0; k < 14 && p.lap.length; k++) tryMove(0, -1);
    const m = L.monsters.find(m => m.type === 'mite');
    return { back: !!m && m.awake && manhattan(m, p) === 1, lap: p.lap.length, log: G.log.map(l => l.text) }; })()`);
  check('any noise (bumping a wall) wakes it: it hops down beside you and bites, apologizing', woke.back && woke.lap === 0 && woke.log.some(t => /wakes with a start/.test(t)), woke);
  const stairs = H.run(`(() => { __clear(); const L = G.level, p = G.player; p.lap = [spawnMonster(L, 'mite', p.x + 1, p.y)]; L.monsters = [];
    L.tiles[idx(p.x, p.y)] = T.STAIRS; G.log.length = 0; descend(); return { lap: G.player.lap.length, log: G.log.map(l => l.text) }; })()`);
  check('at the stairs it hops out and stays behind', stairs.lap === 0 && stairs.log.some(t => /waves goodbye/.test(t)), stairs);
  H.run(`G.cardQueue = []; toPlay();`);
  const other = H.run(`(() => { __clear(); const L = G.level, p = G.player; const m = spawnMonster(L, 'opinion', p.x + 1, p.y); m.awake = true; act(wait); return { onMap: L.monsters.includes(m), lap: p.lap.length }; })()`);
  check('only the Mold-Mite does this (a Second Opinion does not)', other.onMap && other.lap === 0, other);
  const saved = H.run(`(() => { __clear(); const L = G.level, p = G.player; const m = spawnMonster(L, 'mite', p.x + 1, p.y); m.awake = true; act(wait);
    const s = unpackRun(JSON.parse(JSON.stringify(packRun({ p: G.player })))); return s.p.lap.length === 1 && s.p.lap[0].d === MONSTERS.mite; })()`);
  check('a Mold-Mite in your lap is saved with the run', saved);
}

// --- 5. The Second Opinion calls another ---------------------------------------------------
{
  const call = H.run(`(() => { __clear(); const L = G.level, p = G.player; const m = spawnMonster(L, 'opinion', p.x + 1, p.y); m.awake = true; m.hp = m.maxHp = 999;
    G.log.length = 0;
    const counts = [];
    for (let k = 0; k < 16; k++) { G.turn++; computeFOV(L, p.x, p.y, lightRadius()); monstersAct(L); counts.push(L.monsters.filter(o => o.type === 'opinion').length); }
    const c = L.monsters.find(o => o !== m && o.type === 'opinion');
    return { counts, firstAt: counts.indexOf(2) + 1, awake: !!c && c.awake, answering: !!c && c.answering, log: G.log.map(l => l.text) }; })()`);
  const after = H.run('MONSTERS.opinion.call.after');
  check(`after ${after} turns of fighting you, a second Second Opinion arrives, awake`, call.firstAt === after && call.awake && call.log.some(t => /second opinion\\?/.test(t)), { firstAt: call.firstAt, counts: call.counts });
  check('each calls only once, and the one that came can never call another (16 turns of fighting: still two)', call.counts[call.counts.length - 1] === 2 && call.answering, call.counts);
  const where = H.run(`(() => { const out = []; for (let k = 0; k < 20; k++) { __clear(); const L = G.level, p = G.player; const m = spawnMonster(L, 'opinion', p.x + 1, p.y); m.awake = true; m.hp = m.maxHp = 999;
      const dist = distanceMap(L, p.x, p.y); computeFOV(L, p.x, p.y, lightRadius()); callForOpinion(L, m, dist);
      const c = L.monsters.find(o => o !== m); out.push(c ? [dist[idx(c.x, c.y)], L.visible[idx(c.x, c.y)]] : null); }
    return out; })()`);
  const [lo, hi] = H.run('MONSTERS.opinion.call.near');
  check(`it arrives from out of sight, ${lo} to ${hi} steps away`, where.every(w => w && w[0] >= lo && w[0] <= hi && !w[1]), where);
}

// --- 6. The Tick-Tock Tot, heard coming ----------------------------------------------------
{
  const heard = setup => H.run(`(() => { __clear(); const L = G.level, p = G.player; p.wick = 400; ${setup}
    const words = []; const real = FX.word; FX.word = (x, y, w) => { words.push(w); return real.call(FX, x, y, w); };
    for (let k = 0; k < 4; k++) { computeFOV(L, p.x, p.y, lightRadius()); L.visible.fill(0); totTicks(L); }
    FX.word = real; return words; })()`);
  const far = heard(`const t = spawnMonster(L, 'tot', p.x + 8, p.y); t.awake = true;`);
  check('out of sight, you hear an awake Tot coming: "tick…", "tock…", turn by turn', far.length === 4 && far[0] !== far[1] && far.every(w => /^(tick|tock)…$/.test(w)), far);
  const near = heard(`const t = spawnMonster(L, 'tot', p.x + 3, p.y); t.awake = true;`);
  check(`within ${H.run('MONSTERS.tot.tick.silent')} steps it goes silent`, near.length === 0, near);
  const asleep = heard(`const t = spawnMonster(L, 'tot', p.x + 8, p.y); t.awake = false;`);
  check('a sleeping Tot makes no sound', asleep.length === 0, asleep);
  const tooFar = heard(`const t = spawnMonster(L, 'tot', p.x + 12, p.y + 7); t.awake = true;`);
  check(`further off than ${H.run('MONSTERS.tot.tick.hear')} steps you can't hear it`, tooFar.length === 0, tooFar);
}

// --- 7. The colleague's footsteps (added 11 November, after review) -------------------------
{
  const steps = H.run(`(() => { __clear(); const L = G.level, p = G.player; const m = spawnMonster(L, 'opinion', p.x + 1, p.y); m.awake = true; m.hp = m.maxHp = 999;
    const dist = distanceMap(L, p.x, p.y); computeFOV(L, p.x, p.y, lightRadius()); callForOpinion(L, m, dist);
    const c = L.monsters.find(o => o !== m);
    const words = []; const real = FX.word; FX.word = (x, y, w) => { words.push([w, x === c.x && y === c.y]); return real.call(FX, x, y, w); };
    for (let k = 0; k < 3; k++) colleagueSteps(L);
    const unseen = words.length; L.visible[idx(c.x, c.y)] = 1; colleagueSteps(L); L.visible[idx(c.x, c.y)] = 0; colleagueSteps(L);
    FX.word = real; return { unseen, words, after: words.length - unseen, arrived: !!c.arrived, firstStill: (() => { const w = []; FX.word = (x, y, s) => w.push(s); colleagueSteps(L); FX.word = real; return w.length; })() }; })()`);
  check(`until you can see it, the colleague's footsteps ("${H.run('MONSTERS.opinion.call.steps')}") are written where it is, every turn`,
    steps.unseen === 3 && steps.words.every(([w, here]) => w === H.run('MONSTERS.opinion.call.steps') && here), steps);
  check('once you have seen it, the footsteps stop for good (even if it goes out of sight again)', steps.after === 0 && steps.arrived && steps.firstStill === 0, steps);
  const plain = H.run(`(() => { __clear(); const L = G.level, p = G.player; const m = spawnMonster(L, 'opinion', p.x + 8, p.y); m.awake = true;
    const w = []; const real = FX.word; FX.word = (x, y, s) => w.push(s); L.visible.fill(0); colleagueSteps(L); FX.word = real; return w.length; })()`);
  check('an ordinary Second Opinion (not a colleague on its way) makes no footsteps', plain === 0, plain);
}

// --- 8. Holding still and hoping (added 11 November, after review) --------------------------
{
  const HS = H.run('RULES.holdStill');
  const trial = (type = 'opinion', setup = '') => H.run(`(() => { __clear(); const L = G.level, p = G.player; const m = spawnMonster(L, '${type}', p.x + 1, p.y); m.awake = true; m.hp = m.maxHp = 999; ${setup}
    G.log.length = 0; const x0 = m.x, y0 = m.y; const mite = wait() && p.lap.length > 0;
    const out = { bored: m.bored || 0, pounce: !!m.pounce, log: G.log.map(l => l.text), engaged: engaged(m), mite };
    endTurn(); return Object.assign(out, { moved: m.x !== x0 || m.y !== y0, dist: manhattan(m, p) }); })()`);
  const runs = []; for (let k = 0; k < 400; k++) runs.push(trial());
  const bored = runs.filter(r => r.bored > 0).length;
  check(`holding still beside an awake horror: the narrator sets it up in a couplet every time`,
    runs.every(r => r.log.some(t => H.run(`TEXT.holdStill.couplets`).some(c => t.startsWith(c.split(' ').slice(0, 4).join(' '))))), runs[0].log);
  check(`about ${Math.round(HS.wander * 100)}% of the time it loses interest (${bored} of 400)`, bored > 400 * HS.wander - 45 && bored < 400 * HS.wander + 45, bored);
  check('each time it is one or the other: lost interest, or saving a harder blow', runs.every(r => (r.bored > 0) !== r.pounce), runs.slice(0, 5));
  const b = runs.find(r => r.bored > 0);
  check('when it loses interest it says so, wanders off, and is not holding onto you', b && b.log.some(t => /furniture|potters off|looks straight through/.test(t)) && b.moved && !b.engaged, b);
  const hard = H.run(`(() => { const out = []; for (let k = 0; k < 60; k++) { __clear(); const L = G.level, p = G.player; const m = spawnMonster(L, 'opinion', p.x + 1, p.y); m.awake = true; m.hp = m.maxHp = 999;
      G.log.length = 0; m.pounce = true; p.hp = 1000; const before = p.hp; monsterAttack(m);
      out.push({ dmg: before - p.hp, saved: G.log.some(l => /waiting for you to stop moving/.test(l.text)), left: !!m.pounce, hit: G.threat.result === 'hit' }); }
    return out; })()`);
  check('otherwise its next blow says it was waiting for you to stop moving, and the extra is used up either way',
    hard.filter(h => h.hit).every(h => h.saved) && hard.every(h => !h.left), hard.slice(0, 4));
  const avg = (pounce) => H.run(`(() => { let tot = 0, n = 0; for (let k = 0; k < 600; k++) { __clear(); const L = G.level, p = G.player; const m = spawnMonster(L, 'zombie', p.x + 1, p.y); m.awake = true;
      m.pounce = ${pounce}; p.hp = 1000; monsterAttack(m); if (G.threat.result === 'hit') { tot += 1000 - p.hp; n++; } } return tot / n; })()`);
  const plain = avg(false), saved = avg(true);
  check(`a saved blow lands about ${HS.harder} times as hard (average ${saved.toFixed(1)} against ${plain.toFixed(1)})`, saved / plain > HS.harder - 0.15 && saved / plain < HS.harder + 0.2, { plain, saved });
  const gone = H.run(`(() => { __clear(); const L = G.level, p = G.player; const m = spawnMonster(L, 'opinion', p.x + 4, p.y); m.awake = true; m.pounce = true;
    const dist = distanceMap(L, p.x, p.y); monsterAct(L, m, dist); return !!m.pounce; })()`);
  check('get away from it and whatever it was saving is forgotten', gone === false);
  for (const t of HS.exempt) {
    const r = trial(t);
    check(`the ${t === 'tuck' ? 'Tuck-You-In' : 'final boss'} is never fooled by it (nothing happens)`, r.bored === 0 && !r.pounce, r);
  }
  const alone = H.run(`(() => { __clear(); G.log.length = 0; act(wait); return G.log.map(l => l.text); })()`);
  check('with nobody beside you, holding still is just waiting (no couplet)', !alone.some(t => H.run('TEXT.holdStill.couplets').includes(t)), alone);
  const asleep = trial('opinion', 'm.awake = false;');
  check('a sleeping horror beside you is not part of it', asleep.bored === 0 && !asleep.pounce && !asleep.log.some(t => H.run('TEXT.holdStill.couplets').includes(t)), asleep);
  const mite = trial('mite');
  check('a calm Mold-Mite still climbs into your lap instead', mite.log.some(t => /climbs into your lap/.test(t)) && !mite.pounce, mite);
  check('the help and the margin say "hold still"', /hold still/.test(H.run('TEXT.help.map(r => r[1]).join(" ")')) && /hold still/.test(H.run('TEXT.ui.margin ? TEXT.ui.margin.keys : JSON.stringify(TEXT.ui)')));
}

check('no console errors', !H.consoleLog.some(l => /^(warn|error)/.test(l)), H.consoleLog.filter(l => /^(warn|error)/.test(l)).slice(0, 3));
finish();
