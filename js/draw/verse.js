'use strict';
// Verse set as verse. The story, floor verses, bestiary pages, rhyme duels, epitaphs and the
// ending each take over the whole page: large serif type, one line at a time, every line
// left hanging a beat longer than is comfortable. Enter brings the next line sooner.

// A rough syllable count, so longer lines are given longer to sink in.
function syllables(line) {
  return line.split(/\s+/).reduce((n, word) => {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return n;
    return n + Math.max(1, (w.replace(/e$/, '').match(/[aeiouy]+/g) || []).length);
  }, 0);
}

function openPage(mode, page) {
  G.mode = mode;
  G.page = Object.assign({ stanza: 0, lineBeat: RULES.pages.lineBeat, lead: RULES.pages.lead }, page);
  startStanza(G.page);
}

function startStanza(pg) {
  pg.t0 = FX.now;
  pg.spoken = -1;
  pg.doneFired = false;
  pg.times = [];
  const P = RULES.pages;
  let t = pg.lead;
  for (const l of pg.stanzas[pg.stanza]) {
    pg.times.push(t);
    t += pg.fast ? P.fastLine + syllables(l) * P.fastPerSyllable : P.line + syllables(l) * P.perSyllable + pg.lineBeat;
  }
  pg.doneAt = pg.times[pg.times.length - 1] + (pg.fast ? P.fastDone : P.done);
}

const pageLines = pg => pg.stanzas[pg.stanza];
const pageShown = pg => pg.times.filter(t => FX.now - pg.t0 >= t).length;
const pageDone = pg => FX.now - pg.t0 >= pg.doneAt;
const lastStanza = pg => pg.stanza >= pg.stanzas.length - 1;

// Enter: bring on the next line now, or turn to the next stanza. True when the page is finished.
function pageAdvance(pg) {
  const el = FX.now - pg.t0, n = pageShown(pg);
  if (n < pg.times.length) {
    pg.t0 -= pg.times[n] - el;
    return false;
  }
  if (!pageDone(pg)) {
    pg.t0 -= pg.doneAt - el;
    return false;
  }
  if (!lastStanza(pg)) {
    pg.stanza++;
    startStanza(pg);
    return false;
  }
  return true;
}

// Every frame: narrate lines as they appear, and fire the page's onDone once.
function pageTick(pg) {
  if (pg.hold) return; // waiting for something first (which kind of rhyme)
  const lines = pageLines(pg), n = pageShown(pg);
  while (pg.spoken < n - 1) {
    pg.spoken++;
    if (pg.voice) Voice.queue(lines[pg.spoken], pg.voice);
    if (!pg.quiet) Sound.play('scroll', 0.25);
  }
  if (pg.onDone && !pg.doneFired && pageDone(pg) && lastStanza(pg)) {
    pg.doneFired = true;
    pg.onDone(pg);
  }
}

// ---------------------------------------------------------------------------------------
// The pages.

function showStoryPage() {
  const who = phrase('somebody', { n: G.runNo });
  const lines = TEXT.story.map(l => fill(l, { who }));
  const cut = lines.indexOf('');
  openPage('story', {
    style: 'story', over: who, voice: 'narrator',
    stanzas: [lines.slice(0, cut), lines.slice(cut + 1)],
    art: (cx, by, S) => drawPlayer(cx, by, S, { wick: RULES.candle.max }),
    prompt: TEXT.pages.story,
  });
}

function showFloorPage() {
  const f = G.level.floor, fakeL = { depth: G.depth, floor: f };
  openPage('floorcard', {
    style: 'floor', over: phrase('floorOf', { n: G.depth, of: FLOORS.length }), title: f.name, voice: 'narrator',
    stanzas: [G.floorVerse],
    art: (cx, by, S) => {
      drawProp(fakeL, 3, 3, cx - S / 2, by - S * 0.9, S);
      drawDeco(G.depth, cx - S * 1.3, by - S * 0.35, S, 0.5, f.deco.color);
      drawDeco(G.depth, cx + S * 1.2, by - S * 0.25, S, 0.2, f.deco.color);
    },
    prompt: TEXT.pages.floor,
  });
}

function showBeastPage(type, browsing) {
  const b = BESTIARY[type], d = MONSTERS[type];
  const fake = { type, d, x: 0, y: 0, stun: 0, frenzy: 0, enraged: false };
  openPage(browsing ? 'bestiary' : 'card', {
    style: 'beast', over: TEXT.pages.beastOver, title: d.name, titleColor: d.color, voice: browsing ? null : 'narrator',
    stanzas: [b.verse], tip: b.tip, quiet: browsing,
    art: (cx, by, S, el) => {
      const shiver = !browsing && !FX.reduced && el < 700 ? (Math.random() - 0.5) * S * 0.12 : 0;
      drawMonster(fake, cx + shiver, by, S * (type === 'nibbler' ? 0.5 : type === 'tuck' ? 0.8 : 1));
    },
    prompt: browsing ? TEXT.pages.beastBrowse : TEXT.pages.beastNext,
  });
  if (browsing) G.page.t0 = -1e9;
}

function showTombPage() {
  const p = G.player;
  openPage('dead', {
    style: 'tomb', voice: 'sing', lineBeat: RULES.pages.tombBeat,
    stanzas: [G.epitaph.concat([G.fact])],
    stats: phrase('pages.tombStats', { who: phrase('somebody', { n: G.runNo }), depth: G.depth, level: p.level, kills: p.kills, gold: p.gold }),
    prompt: TEXT.pages.tomb,
  });
}

function showEndingPage() {
  const stanzas = [];
  let cur = [];
  for (const l of TEXT.ending) {
    if (l === '') { stanzas.push(cur); cur = []; } else cur.push(l);
  }
  stanzas.push(cur, TEXT.pages.theEnd.slice());
  openPage('win', {
    style: 'story', over: phrase('somebody', { n: G.runNo }), voice: 'narrator', stanzas,
    art: (cx, by, S) => drawPlayer(cx, by, S, { wick: 0 }),
    prompt: TEXT.pages.ending,
  });
}

// ---------------------------------------------------------------------------------------
// Drawing a page.

function verseSize(lines, scale) {
  let size = clamp(H * 0.042, 20, 44) * (scale || 1);
  serif(size);
  const widest = Math.max(...lines.map(l => ctx.measureText(l).width), 1);
  if (widest > W * 0.84) size *= (W * 0.84) / widest;
  return size;
}

function drawPage(pg) {
  if (!pg) return;
  const lines = pageLines(pg), el = FX.now - pg.t0;
  Ink.setMood(G.player && G.mode !== 'win' ? lookFrac() * 0.7 : 0, 44);
  Ink.leanY = H / 2;
  if (FX.reduced) { Ink.wobble *= 0.3; Ink.lean *= 0.2; }
  if (pg.style === 'tomb') return drawTomb(pg, lines, el);
  if (pg.style === 'rhyme') return drawRhymePage(pg, lines, el);
  if (pg.style === 'choice') return drawChoicePage(pg, lines, el);
  let y = H * 0.1;
  if (pg.art) {
    const S = H * 0.17;
    pg.art(W / 2, y + S * 1.45, S, el);
    y += S * 1.75;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (pg.over) {
    serif(clamp(H * 0.022, 13, 20), 'italic');
    ctx.fillStyle = C.gray;
    ctx.fillText(pg.over, W / 2, y);
    y += H * 0.07;
  }
  if (pg.title) {
    ctx.font = `${Math.round(clamp(H * 0.05, 24, 52))}px ${FONT_TITLE}`;
    ctx.fillStyle = pg.titleColor || INK;
    ctx.fillText(pg.title.toUpperCase().split('').join(' '), W / 2, y);
    y += H * 0.07;
  }
  const size = verseSize(lines), lh = size * 1.55;
  serif(size);
  lines.forEach((l, i) => {
    const a = clamp((el - pg.times[i]) / 800, 0, 1);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = INK;
    inkLine(l, W / 2, y + i * lh + (1 - a) * 8, i + 1);
  });
  ctx.globalAlpha = 1;
  y += lines.length * lh;
  if (!pageDone(pg)) return;
  if (pg.tip && lastStanza(pg)) {
    serif(clamp(H * 0.024, 14, 22), 'italic');
    ctx.fillStyle = C.teal;
    ctx.fillText(pg.tip, W / 2, y + H * 0.03);
  }
  pagePrompt(lastStanza(pg) ? pg.prompt : TEXT.pages.next);
}

function pagePrompt(str) {
  if (!str) return;
  serif(clamp(H * 0.02, 12, 18), 'italic');
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.55 + 0.35 * Math.sin(FX.now * 0.003);
  ctx.fillStyle = C.red;
  ctx.fillText(str, W / 2, H - H * 0.05);
  ctx.globalAlpha = 1;
}

// A headstone, a single sock left draped over it, and the epitaph set inside.
function drawTomb(pg, lines, el) {
  const w = Math.min(W * 0.62, 720), x0 = (W - w) / 2, x1 = x0 + w, top = H * 0.1, base = H * 0.8, arch = w * 0.2;
  const stone = [[x0, base]];
  for (let k = 0; k <= 12; k++) {
    const a = Math.PI - (k / 12) * Math.PI;
    stone.push([W / 2 + Math.cos(a) * w / 2, top + arch - Math.sin(a) * arch]);
  }
  stone.push([x1, base]);
  stroke(stone, { closed: true, w: 2, fill: '#8a847a', fillAlpha: 0.22 });
  for (let i = 0; i < 9; i++) tuft(x0 - w * 0.08 + (i * w * 1.16) / 8, base + 4, 26, 4, Math.sin(Ink.t + i) * 4, { w: 1, color: '#3f6a2a' });
  line(x0 - w * 0.15, base + 3, x1 + w * 0.15, base + 5, { w: 1.2 });
  const hx = W / 2 + w * 0.22, hy = top + arch - Math.sqrt(1 - Math.pow((hx - W / 2) / (w / 2), 2)) * arch + 6;
  leaning(0.5, hy, () => drawSock(hx - 8, hy - 16, 120, RED_INK));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${Math.round(clamp(H * 0.035, 18, 34))}px ${FONT_TITLE}`;
  ctx.fillStyle = INK;
  ctx.globalAlpha = clamp(el / 900, 0, 1);
  ctx.fillText(TEXT.pages.rip, W / 2, top + arch + H * 0.06);
  ctx.globalAlpha = 1;
  let size = clamp(H * 0.03, 15, 30);
  serif(size);
  const widest = Math.max(...lines.map(l => ctx.measureText(l).width));
  if (widest > w * 0.86) size *= (w * 0.86) / widest;
  const lh = size * 1.5;
  let y = top + arch + H * 0.06 + lh * 1.4;
  lines.forEach((l, i) => {
    const a = clamp((el - pg.times[i]) / 900, 0, 1);
    if (a <= 0) return;
    const last = i === lines.length - 1;
    serif(size, last ? 'italic' : '');
    ctx.globalAlpha = a;
    ctx.fillStyle = last ? C.red : INK;
    inkLine(l, W / 2, y + i * lh + (last ? lh * 0.4 : 0), i + 1);
  });
  ctx.globalAlpha = 1;
  if (!pageDone(pg)) return;
  serif(clamp(H * 0.019, 12, 17), 'italic');
  ctx.fillStyle = C.gray;
  ctx.fillText(pg.stats, W / 2, base + H * 0.06);
  pagePrompt(pg.prompt);
}

// The rhyme duel: the couplet appears, then the choices, then the fuse starts to burn.
function drawRhymePage(pg, lines, el) {
  const r = G.rhyme;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (pg.hold) return drawRhymeKinds();
  serif(clamp(H * 0.026, 14, 24), 'italic');
  ctx.fillStyle = C.red;
  ctx.fillText(pg.final ? TEXT.pages.lastRhyme : TEXT.pages.recite, W / 2, H * 0.14);
  if (pg.final) {
    serif(clamp(H * 0.018, 11, 16), 'italic');
    ctx.fillStyle = C.gray;
    ctx.fillText(TEXT.pages.listening, W / 2, H * 0.18);
  }
  const size = verseSize([lines[0], lines[1].replace('___', r.answer.toUpperCase() + '!!')], 1.1), lh = size * 1.7;
  const y = H * 0.3;
  lines.forEach((l, i) => {
    const a = clamp((el - pg.times[i]) / 700, 0, 1);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    if (i === 1 && l.includes('___')) {
      const [pre, post] = l.split('___');
      const word = r.result ? (r.result.word || TEXT.pages.uh).toUpperCase() : '________';
      const col = !r.result ? C.dim : r.result.right ? C.purple : C.red;
      splitLine(pre, word, post, W / 2, y + i * lh, size, col, r.result && !r.result.right);
    } else {
      serif(size);
      ctx.fillStyle = INK;
      inkLine(l, W / 2, y + i * lh, i + 1);
    }
  });
  ctx.globalAlpha = 1;
  if (r.result) {
    serif(clamp(H * 0.034, 18, 34), 'italic');
    ctx.fillStyle = r.result.right ? C.purple : C.red;
    ctx.fillText(r.result.right ? TEXT.pages.rhymes : r.result.word ? TEXT.pages.noRhyme : TEXT.pages.burntOut, W / 2, H * 0.62);
    return;
  }
  if (!r.fuseT0) return;
  const cx = W / 2, cy = H * 0.66, dx = Math.min(W * 0.24, 300), dy = H * 0.085;
  const tier = dreadTier();
  const words = r.shown || r.options; // a hoarse voice smudges them
  const opt = i => (tier >= 2 && Math.random() < 0.04 * tier ? glitch(words[i], FX.now + i) : words[i]);
  const os = clamp(H * 0.03, 16, 28);
  serif(os, 'italic');
  ctx.fillStyle = INK;
  ctx.fillText(opt(0), cx, cy - dy);
  inkArrow(cx, cy - dy - os * 1.5, 0, -1, os);
  ctx.fillText(opt(2), cx, cy + dy + 10);
  inkArrow(cx, cy + dy + os * 1.3, 0, 1, os);
  ctx.textAlign = 'left';
  ctx.fillText(opt(3), cx - dx - 60 + os * 1.4, cy + 6);
  inkArrow(cx - dx - 60, cy - os * 0.3, -1, 0, os);
  ctx.textAlign = 'right';
  ctx.fillText(opt(1), cx + dx + 60 - os * 1.4, cy + 6);
  inkArrow(cx + dx + 60, cy - os * 0.3, 1, 0, os);
  // The fuse: an inked line burning down from the right, with a spark.
  const left = clamp(1 - (FX.now - r.fuseT0) / r.ms, 0, 1);
  const fx0 = W * 0.2, fx1 = W * 0.2 + W * 0.6 * left, fy = H * 0.87;
  if (left > 0) {
    const pts = [];
    for (let i = 0; i <= 12; i++) pts.push([fx0 + ((fx1 - fx0) * i) / 12, fy + Math.sin(i * 1.3) * 4]);
    stroke(pts, { w: 2.2, color: left < 0.3 ? C.red : INK, step: 0 });
    const glow = ctx.createRadialGradient(fx1, fy, 0, fx1, fy, 26);
    glow.addColorStop(0, 'rgba(255,170,40,0.8)');
    glow.addColorStop(1, 'rgba(255,170,40,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(fx1 - 26, fy - 26, 52, 52);
    star(fx1, fy, 7 + Math.random() * 5, { w: 1, fill: '#e07a10', fillAlpha: 0.8, noScratch: true });
  }
  ctx.textAlign = 'center';
  serif(clamp(H * 0.018, 11, 16), 'italic');
  ctx.fillStyle = C.gray;
  ctx.fillText(TEXT.pages.pick, W / 2, H * 0.93);
}

// Which rhyme? Three kinds, by arrow (left, up, right) or 1 to 3. The last kind used is marked.
function drawRhymeKinds() {
  const p = G.player, K = TEXT.rhymeKinds, last = p.lastRhymeKind || 'shove';
  serif(clamp(H * 0.026, 14, 24), 'italic');
  ctx.fillStyle = C.red;
  ctx.fillText(TEXT.pages.recite, W / 2, H * 0.14);
  serif(clamp(H * 0.05, 24, 48));
  ctx.fillStyle = INK;
  ctx.fillText(TEXT.pages.whichRhyme, W / 2, H * 0.3);
  if (p.hoarse) {
    serif(clamp(H * 0.02, 12, 18), 'italic');
    ctx.fillStyle = C.pink;
    ctx.fillText(TEXT.pages.hoarse, W / 2, H * 0.36);
  }
  const cx = W / 2, cy = H * 0.6, dx = Math.min(W * 0.3, 360), os = clamp(H * 0.03, 16, 28);
  const spots = [[cx - dx, cy + os, -1, 0], [cx, cy - H * 0.1, 0, -1], [cx + dx, cy + os, 1, 0]];
  RHYME_KINDS.forEach((kind, i) => {
    const [x, y, ax, ay] = spots[i];
    serif(os, kind === last ? 'bold italic' : 'italic');
    ctx.fillStyle = kind === last ? C.purple : INK;
    const label = `${i + 1}  ${K[kind].name}`, half = ctx.measureText(label).width / 2;
    ctx.fillText(label, x, y);
    serif(clamp(H * 0.018, 11, 16), 'italic');
    ctx.fillStyle = C.gray;
    ctx.fillText(K[kind].desc, x, y + os * 1.1);
    if (ay) inkArrow(x, y - os * 1.5, 0, -1, os);           // above the middle one
    else inkArrow(x + ax * (half + os * 1.2), y - os * 0.3, ax, 0, os); // beside the side ones
  });
  serif(clamp(H * 0.018, 11, 16), 'italic');
  ctx.fillStyle = C.gray;
  ctx.fillText(TEXT.pages.whichKeys, W / 2, H * 0.93);
}

// ---------------------------------------------------------------------------------------
// The odd rooms: a picture, a verse, and three choices. Then what happened, and back to the map.

function showChoicePage(fx) {
  const words = VIGNETTE_WORDS[fx.kind];
  openPage('choice', {
    style: 'choice', over: TEXT.pages.roomOver, title: words.name, voice: 'narrator', lineBeat: RULES.pages.roomBeat,
    stanzas: [words.verse], fx, sel: 0, result: null,
    choices: VIGNETTES[fx.kind].choices.map(([id]) => words.choices[id].label),
    art: (cx, by, S) => VIGNETTE_ART[fx.kind](cx, by, S, fx),
  });
}

function drawChoicePage(pg, lines, el) {
  let y = H * 0.08;
  const S = H * 0.14;
  pg.art(W / 2, y + S * 1.85, S, el);
  y += S * 2.15;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  serif(clamp(H * 0.02, 12, 18), 'italic');
  ctx.fillStyle = C.gray;
  ctx.fillText(pg.over, W / 2, y);
  y += H * 0.055;
  ctx.font = `${Math.round(clamp(H * 0.042, 22, 44))}px ${FONT_TITLE}`;
  ctx.fillStyle = INK;
  ctx.fillText(pg.title.toUpperCase().split('').join(' '), W / 2, y);
  y += H * 0.055;
  const size = verseSize(lines, 0.82), lh = size * 1.45;
  serif(size);
  lines.forEach((l, i) => {
    const a = clamp((el - pg.times[i]) / 800, 0, 1);
    if (a <= 0) return;
    ctx.globalAlpha = a * (pg.result ? 0.45 : 1);
    ctx.fillStyle = INK;
    inkLine(l, W / 2, y + i * lh + (1 - a) * 8, i + 1);
  });
  ctx.globalAlpha = 1;
  y += lines.length * lh + H * 0.02;
  if (!pageDone(pg)) return;
  if (pg.result) {
    serif(clamp(H * 0.024, 14, 22), 'italic');
    const ra = clamp((FX.now - pg.result.t) / 500, 0, 1);
    ctx.globalAlpha = ra;
    ctx.fillStyle = C.red;
    ctx.fillText(pg.result.choice + '.', W / 2, y);
    ctx.fillStyle = C.purple;
    let ry = y + H * 0.045;
    for (const l of pg.result.lines) {
      for (const w of wrapPx(l, W * 0.7)) {
        ctx.fillText(w, W / 2, ry);
        ry += clamp(H * 0.024, 14, 22) * 1.4;
      }
    }
    ctx.globalAlpha = 1;
    pagePrompt(TEXT.pages.roomNext);
    return;
  }
  const os = clamp(H * 0.027, 15, 24);
  pg.choices.forEach((c, i) => {
    const cy = y + i * os * 1.8, sel = i === pg.sel;
    serif(os, sel ? '' : 'italic');
    const label = `${i + 1}.  ${c}`, tw = ctx.measureText(label).width;
    if (sel) stroke([[W / 2 - tw / 2 - 10, cy - os * 0.3], [W / 2 + tw / 2 + 10, cy - os * 0.36]], { w: os * 0.5, color: '#f2cf4a', alpha: 0.6, noScratch: true, step: 0 });
    ctx.fillStyle = sel ? INK : C.gray;
    ctx.fillText(label, W / 2, cy);
  });
  pagePrompt(TEXT.pages.roomChoose);
}

// An arrow drawn in ink (fonts don't always have arrows).
function inkArrow(x, y, dx, dy, size) {
  const h = size * 0.45, tx = x + dx * h, ty = y + dy * h;
  line(x - dx * h, y - dy * h, tx, ty, { w: 1.4, step: 0 });
  stroke([[tx - dx * h * 0.6 - dy * h * 0.5, ty - dy * h * 0.6 + dx * h * 0.5], [tx, ty], [tx - dx * h * 0.6 + dy * h * 0.5, ty - dy * h * 0.6 - dx * h * 0.5]], { w: 1.4, step: 0 });
}

function splitLine(pre, word, post, cx, y, size, color, strike) {
  serif(size);
  const wPre = ctx.measureText(pre).width, wPost = ctx.measureText(post).width;
  serif(size, 'bold');
  const wWord = ctx.measureText(word).width;
  let x = cx - (wPre + wWord + wPost) / 2;
  ctx.textAlign = 'left';
  serif(size);
  ctx.fillStyle = INK;
  ctx.fillText(pre, x, y);
  x += wPre;
  serif(size, 'bold');
  ctx.fillStyle = color;
  ctx.fillText(word, x, y);
  if (strike) line(x - 2, y - size * 0.3, x + wWord + 2, y - size * 0.36, { w: 1.6, color: C.red });
  x += wWord;
  serif(size);
  ctx.fillStyle = INK;
  ctx.fillText(post, x, y);
  ctx.textAlign = 'center';
}
