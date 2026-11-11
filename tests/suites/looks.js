'use strict';
// The "how it looks" changes of November 2026: the page looks eerier the deeper you go and in
// seldom, random eerie moments (the look only: what fear does in play is unchanged); eyes in the
// dark only for real horrors, and the made-up things in the dark made abstract; the candle in the
// margin drawn inside the outline of a full candle; every horror with something wrong with it;
// the hand-lettered font; verse printed like ink.

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

check('no console errors', !H.consoleLog.some(l => /^(warn|error)/.test(l)), H.consoleLog.filter(l => /^(warn|error)/.test(l)).slice(0, 3));
finish();
