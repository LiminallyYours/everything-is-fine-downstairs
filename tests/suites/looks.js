'use strict';
// The "how it looks" changes of November 2026: the page looks eerier the deeper you go and in
// seldom, random eerie moments (the look only: what fear does in play is unchanged); eyes in the
// dark only for real horrors, and the made-up things in the dark made abstract; the candle in the
// margin drawn inside the outline of a full candle; every horror with something wrong with it;
// the hand-lettered font; verse printed like ink; the made-up horrors and treasures at the edge
// of your light drawn so they are unmistakably not real.

const { createGame, checker, startGame } = require('./lib');

const SEED = Number(process.env.SEED) || 404;
const { check, finish } = checker('looks');
const H = createGame({ seed: SEED }), G = H.G;
startGame(H);
H.run(`Object.keys(BESTIARY).forEach(t => { markBestiary(t); G.seenTypes[t] = true; }); G.cardQueue = [];`);

// --- 1. Eerier with depth, and only the look --------------------------------------------------
{
  const R = H.run('RULES.look.floor');
  const looks = H.run(`(() => { const out = []; for (let d = 1; d <= 6; d++) { enterFloor(d); toPlay(); G.cardQueue = []; G.player.dread = 0; G.eerieAt = null; out.push(lookFrac()); } return out; })()`);
  check('calm, the page looks as eerie as the floor: none on floor 1, more on each floor down', looks.every((v, i) => Math.abs(v - R[i]) < 1e-9) && looks.every((v, i) => !i || v > looks[i - 1]), looks);
  check('the bottom floor looks about "afraid" even when you are calm', looks[5] >= H.run('RULES.dread.tiers.afraid / RULES.dread.max'), looks[5]);
  const frightened = H.run(`(() => { enterFloor(2); toPlay(); G.cardQueue = []; G.player.dread = 90; G.eerieAt = null; return lookFrac(); })()`);
  check('when your real fear is worse than the floor, the page looks as frightened as you are', Math.abs(frightened - 0.9) < 1e-9, frightened);
  const tier = H.run(`(() => { enterFloor(6); toPlay(); G.cardQueue = []; G.player.dread = 0; G.eerieAt = null; return { tier: dreadTier(), clumsy: clumsy(), bold: horrorsBold() }; })()`);
  check('only the look: on the bottom floor, calm, you are still calm in play (no trembling, no bolder horrors)', tier.tier === 0 && !tier.bold && !tier.clumsy, tier);
}

// --- 2. Eerie moments, seldom and at random ----------------------------------------------------
{
  const M = H.run('RULES.look.moment');
  const run = H.run(`(() => { enterFloor(3); toPlay(); G.cardQueue = []; const L = G.level; L.eerieTurn = null; const turns = [];
    const t0 = G.turn; for (let k = 0; k < 4000; k++) { G.turn = t0 + k; const before = L.eerieTurn; eerieTurn(L); if (L.eerieTurn !== before) turns.push(G.turn); }
    const gaps = turns.slice(1).map((t, i) => t - turns[i]); return { n: turns.length, minGap: Math.min(...gaps) }; })()`);
  check(`eerie moments come at random times, seldom (${run.n} in 4000 turns)`, run.n >= 4000 / 300 && run.n <= 4000 / 120, run);
  check(`never two within ${M.gap} turns`, run.minGap >= M.gap, run.minGap);
  const again = H.run(`(() => { const L = G.level; L.eerieTurn = null; const turns = []; const t0 = G.turn - 3999; for (let k = 0; k < 4000; k++) { G.turn = t0 + k; const b = L.eerieTurn; eerieTurn(L); if (L.eerieTurn !== b) turns.push(G.turn); } return turns.length; })()`);
  check('they never touch the game\'s dice (the same run, floor and turns give the same moments)', again === run.n, { first: run.n, again });
  const lift = H.run(`(() => { G.player.dread = 0; enterFloor(1); toPlay(); G.cardQueue = []; G.eerieAt = FX.now; const M = RULES.look.moment;
    FX.now += M.riseMs + 10; const peak = lookFrac(); FX.now += M.holdMs + M.fadeMs + 100; const after = lookFrac(); return { peak, after }; })()`);
  check('a moment lifts the page all the way to the worst look, then eases back', Math.abs(lift.peak - 1) < 1e-9 && lift.after === 0, lift);
  const reduced = H.run(`(() => { FX.reduced = true; G.eerieAt = FX.now - RULES.look.moment.riseMs - 10; const v = lookFrac(); FX.reduced = false; G.eerieAt = null; return v; })()`);
  check('with calmer effects (F) it goes only part of the way', Math.abs(reduced - H.run('RULES.look.moment.reduced')) < 1e-9, reduced);
}

// --- 3. Eyes only for real horrors ------------------------------------------------------------
{
  const made = H.run(`(() => { enterFloor(2); toPlay(); G.cardQueue = []; G.mode = 'play'; const p = G.player; p.dread = 90; p.wick = 0; computeFOV(G.level, p.x, p.y, lightRadius());
    FX.eyes = []; FX.haunts = []; for (let f = 0; f < 4000; f++) dreadFrame(34);
    return { eyes: FX.eyes.length, haunts: FX.haunts.map(h => h.kind) }; })()`);
  check('frightened in the dark, nothing makes eyes that belong to nothing', made.eyes === 0, made.eyes);
  check('instead, made-up things appear in the dark: a smile with no face, a toy, a ripple',
    ['smile', 'toy', 'ripple'].every(k => made.haunts.includes(k)) && made.haunts.every(k => ['smile', 'toy', 'ripple'].includes(k)), [...new Set(made.haunts)]);
}

// --- 4. Every horror has something wrong with it -----------------------------------------------
{
  const w = H.run(`Object.keys(MONSTER_ART).map(t => [t, !!(WRONG[t] && WRONG[t].always && WRONG[t].eerie)])`);
  check('every horror with a drawing has one thing always wrong and more for an eerie page', w.every(([, ok]) => ok), w.filter(([, ok]) => !ok));
  const drawn = H.run(`(() => { const m = { type: 'opinion', d: MONSTERS.opinion, x: 1, y: 1, stun: 0 }; let calls = 0; const real = WRONG.opinion.eerie;
    WRONG.opinion.eerie = (...a) => { calls++; return real(...a); };
    const save = lookFrac; lookFrac = () => 0; drawMonster(m, 100, 100, 40); const calm = calls;
    lookFrac = () => 1; drawMonster(m, 100, 100, 40); lookFrac = save; WRONG.opinion.eerie = real; return { calm, eerie: calls - calm }; })()`);
  check('the extra wrongness is drawn only once the page is eerie', drawn.calm === 0 && drawn.eerie === 1, drawn);
}

// --- 5. Lettering ------------------------------------------------------------------------------
{
  const f = H.run(`({ hand: FONT_HAND, verse: FONT_VERSE, name: HAND_FONT })`);
  check('the hand-lettered font is built in and comes first for headings, labels, the margin and help', f.name === 'Patrick Hand' && f.hand.startsWith('"Patrick Hand"'), f);
  const shown = []; H.onText = s => shown.push(s); H.run(`G.mode = 'help'; G.back = 'play'; draw();`); H.onText = null;
  check('the help page still says everything it did (written in runs, not typed letter by letter)', shown.includes('ARROW KEYS') && shown.some(s => s.startsWith('hold still, and hope.')), shown.slice(0, 6));
  const verse = []; H.onText = s => verse.push(s);
  H.run(`G.mode = 'play'; showBeastPage('opinion');`); H.tick(8000); H.onText = null;
  const first = H.run('BESTIARY.opinion.verse[0]');
  check('verse printed like ink still reads as whole lines', verse.some(s => s === first), verse.filter(s => s.length > 20).slice(0, 3));
}

// --- 6. Made-up horrors and treasures unmistakably not real -----------------------------------
{
  // Every stroke and dot drawn while drawing one thing: how pale its colour is, and whether the line is broken.
  const look = H.run(`(() => {
    const lum = c => { const m = String(c).match(/rgba?\\(\\s*([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)/), n = String(c)[0] === '#' ? parseInt(String(c).slice(1), 16) : 0;
      const [r, g, b] = m ? [+m[1], +m[2], +m[3]] : [n >> 16, (n >> 8) & 255, n & 255]; return 0.299 * r + 0.587 * g + 0.114 * b; };
    const kept = { stroke: ctx.stroke, setLineDash: ctx.setLineDash };
    let dash = [], marks = [];
    ctx.setLineDash = d => { dash = d; };
    ctx.stroke = () => marks.push({ lum: lum(ctx.strokeStyle), broken: dash.length > 0 });
    const record = (unreal, fn) => { marks = []; Ink.unreal = unreal; fn(); Ink.unreal = false; return marks; };
    G.player.dread = 0; enterFloor(2); toPlay(); G.cardQueue = []; G.eerieAt = null; Ink.calm(40);
    const m = { type: 'opinion', d: MONSTERS.opinion, x: 1, y: 1, stun: 0 };
    const realHorror = record(false, () => drawMonster(m, 100, 100, 40)), madeHorror = record(true, () => drawMonster(m, 100, 100, 40));
    const coin = { kind: 'gold' }, realCoin = record(false, () => drawItem(coin, 100, 100, 40)), madeCoin = record(true, () => drawItem(coin, 100, 100, 40));
    Object.assign(ctx, kept);
    const sum = ms => ({ n: ms.length, darkest: Math.min(...ms.map(k => k.lum)), solid: ms.filter(k => !k.broken).length });
    return { realHorror: sum(realHorror), madeHorror: sum(madeHorror), realCoin: sum(realCoin), madeCoin: sum(madeCoin), paper: lum(PAPER) };
  })()`);
  check('a real horror on a calm page is drawn in dark, unbroken ink', look.realHorror.darkest < 60 && look.realHorror.solid > 0, look.realHorror);
  check('a made-up horror is drawn in pale ink: even its darkest line is washed most of the way to the paper',
    look.madeHorror.n > 0 && look.madeHorror.darkest > 120, look.madeHorror);
  check('every line of a made-up horror is broken up', look.madeHorror.solid === 0, look.madeHorror);
  check('a made-up treasure is drawn the same way: pale, every line broken', look.madeCoin.n > 0 && look.madeCoin.darkest > 120 && look.madeCoin.solid === 0 && look.realCoin.solid > 0, { real: look.realCoin, made: look.madeCoin });

  // On the map and in the margin: the made-up horror is drawn that way, the real one next to it isn't.
  const wired = H.run(`(() => {
    G.player.dread = 90; enterFloor(2); toPlay(); G.cardQueue = []; G.mode = 'play'; const L = G.level, p = G.player;
    computeFOV(L, p.x, p.y, lightRadius());
    const open = []; for (let y = p.y - 4; y <= p.y + 4; y++) for (let x = p.x - 4; x <= p.x + 4; x++)
      if ((x !== p.x || y !== p.y) && inMap(x, y) && L.visible[idx(x, y)] && passable(L.tiles[idx(x, y)]) && !monsterAt(x, y) && manhattan({ x, y }, p) >= 2) open.push([x, y]);
    if (open.length < 3) return { skipped: open.length };
    L.monsters.filter(mo => L.visible[idx(mo.x, mo.y)]).forEach(mo => { mo.x = -9; mo.y = -9; });
    const [a, b, c] = open;
    L.monsters.push(Object.assign({ type: 'zombie', d: MONSTERS.zombie, x: a[0], y: a[1], hp: 9, maxHp: 9, awake: true, stun: 0, frenzy: 0 }));
    L.phantoms = [{ x: b[0], y: b[1], kind: 'monster', type: 'opinion', ch: MONSTERS.opinion.ch, color: MONSTERS.opinion.color, name: MONSTERS.opinion.name, ttl: 5 },
      { x: c[0], y: c[1], kind: 'item', ch: ITEM_GLYPH.gold, color: ITEM_COLOR.gold, name: 'pile of coins', ttl: 5 }];
    const calls = [], keepM = drawMonster, keepI = drawItem;
    drawMonster = (m, ...r) => { calls.push({ what: m.type, unreal: Ink.unreal }); return keepM(m, ...r); };
    drawItem = (it, ...r) => { calls.push({ what: it.kind, unreal: Ink.unreal }); return keepI(it, ...r); };
    draw(); drawMonster = keepM; drawItem = keepI;
    return { calls, after: Ink.unreal };
  })()`);
  if (wired.skipped !== undefined) check('room on the map to set up the made-up things', false, wired);
  else {
    const made = wired.calls.filter(k => k.what === 'opinion'), real = wired.calls.filter(k => k.what === 'zombie'), coin = wired.calls.filter(k => k.what === 'gold');
    check('on the map and in the margin, the made-up horror is drawn as not real (twice: map and "nearby")', made.length >= 2 && made.every(k => k.unreal), made);
    // (the margin's coin count draws a real coin too)
    check('the made-up treasure on the map is drawn as not real, and only it', coin.filter(k => k.unreal).length === 1, coin);
    check('the real horror beside them is drawn as real, on the map and in the margin', real.length >= 2 && real.every(k => !k.unreal), real);
    check('nothing is left drawing as not real after the frame', wired.after === false, wired.after);
  }
}

check('no console errors', !H.consoleLog.some(l => /^(warn|error)/.test(l)), H.consoleLog.filter(l => /^(warn|error)/.test(l)).slice(0, 3));
finish();
