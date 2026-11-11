'use strict';
// Paints the game onto aged paper: the inked map (zoomed in, following you), darkness as ink
// flooding in from beyond your light, a nearly empty margin, and the message log.
// Menus (help, pockets, log, graveyard) are laid out on an 80x34 grid, lettered by hand.

const COLS = 80, ROWS = 34;
const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
let W = 960, H = 640, dpr = 1, paper = null;
let cellW = 12, cellH = 19, fontPx = 16, GRID_X = 0; // the menu grid (centred on the page)
const View = { x: 0, y: 0, w: 0, h: 0, S: 40, camX: 0, camY: 0, level: null };
const Margin = { x: 0, y: 0, w: 0, h: 0 };
const LogBox = { x: 0, y: 0, w: 0, h: 0 };
const INK_RGB = [27, 21, 25];
let fog = null, fogCtx = null, fogImg = null;

// Which layout: a computer's, or (a screen taller than it is wide, and narrow) a phone's, which
// js/draw/phone.js lays out and draws. A touch screen held sideways asks to be turned upright.
const Phone = { on: false, sideways: false };
function whichLayout() {
  const w = window.innerWidth, h = window.innerHeight, P = RULES.phone;
  const touch = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  Phone.on = h > w && w <= P.maxWidth;
  Phone.sideways = !Phone.on && touch && w > h && h <= P.sidewaysHeight;
}

function resize() {
  dpr = window.devicePixelRatio || 1;
  whichLayout();
  if (Phone.on || Phone.sideways) {
    dpr = Math.min(dpr, RULES.phone.pixelRatio);
    W = window.innerWidth;
    H = window.innerHeight;
  } else {
    W = Math.max(640, window.innerWidth);
    H = Math.max(420, window.innerHeight);
  }
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  cellH = H / ROWS;
  fontPx = Math.floor(Math.min(cellH * 0.8, W / COLS / 0.6));
  cellW = fontPx * 0.6; // Courier's own advance, so letters sit naturally
  GRID_X = (W - COLS * cellW) / 2;
  const mw = Math.round(clamp(W * 0.24, 230, 380)), lh = Math.round(clamp(H * 0.17, 110, 180));
  Object.assign(View, { x: 0, y: 0, w: W - mw, h: H - lh });
  View.S = Math.max(24, Math.floor(Math.min(View.w / 21, View.h / 14)));
  Object.assign(Margin, { x: W - mw, y: 0, w: mw, h: H });
  Object.assign(LogBox, { x: 0, y: H - lh, w: W - mw, h: lh });
  if (Phone.on) layoutPhone();
  paper = makePaper(W, H);
  draw();
}

// ---------------------------------------------------------------------------------------
// The typewritten menu grid.

// Fade an ink toward the paper. f=1 full ink, 0 gone.
const shadeCache = {};
function shade(hex, f) {
  f = Math.round(clamp(f, 0, 1) * 20) / 20;
  const key = hex + f;
  if (shadeCache[key]) return shadeCache[key];
  const n = parseInt(hex.slice(1), 16);
  const mix = (c, b) => Math.round(b + (c - b) * f);
  return (shadeCache[key] = `rgb(${mix((n >> 16) & 255, 239)},${mix((n >> 8) & 255, 228)},${mix(n & 255, 204)})`);
}

function gridFont() {
  ctx.font = `${Math.round(fontPx * 1.15)}px ${FONT_HAND}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
}

function put(x, y, ch, fg, bg) {
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(GRID_X + x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
  }
  if (!ch || ch === ' ') return;
  ctx.fillStyle = fg || C.ink;
  ctx.fillText(ch, GRID_X + x * cellW + cellW / 2, y * cellH + cellH / 2 + 1);
}

// A run of hand lettering starting at a grid cell. The letters keep their own widths (they
// are written, not typed), so a run is usually a little shorter than its cells.
function text(x, y, str, fg, bg) {
  if (bg) for (let i = 0; i < str.length; i++) put(x + i, y, ' ', null, bg);
  if (!str) return;
  ctx.textAlign = 'left';
  ctx.fillStyle = fg || C.ink;
  ctx.fillText(str, GRID_X + x * cellW + cellW * 0.15, y * cellH + cellH / 2 + 1);
  ctx.textAlign = 'center';
}

function centerText(y, str, fg) {
  ctx.textAlign = 'center';
  ctx.fillStyle = fg || C.ink;
  ctx.fillText(str, GRID_X + (COLS * cellW) / 2, y * cellH + cellH / 2 + 1);
}

// A paper card with an inked, slightly wobbly border.
function box(x0, y0, w, h, title) {
  ctx.globalAlpha = 0.97;
  ctx.fillStyle = PAPER;
  ctx.fillRect(GRID_X + x0 * cellW, y0 * cellH, w * cellW, h * cellH);
  ctx.globalAlpha = 1;
  Ink.calm(40);
  Ink.lean = 0;
  const a = [GRID_X + x0 * cellW + 4, y0 * cellH + 4], b = [GRID_X + (x0 + w) * cellW - 4, (y0 + h) * cellH - 4];
  stroke([a, [b[0], a[1]], b, [a[0], b[1]]], { closed: true, w: 1.3 });
  gridFont();
  if (title) {
    const tw = ctx.measureText(title).width, mid = GRID_X + (x0 + w / 2) * cellW;
    ctx.fillStyle = PAPER;
    ctx.fillRect(mid - tw / 2 - cellW, y0 * cellH, tw + cellW * 2, cellH);
    ctx.fillStyle = C.red;
    ctx.fillText(title, mid, y0 * cellH + cellH / 2 + 1);
  }
}

// ---------------------------------------------------------------------------------------
// Proportional text helpers for the page-like parts.

function serif(size, style) {
  ctx.font = `${style || ''} ${Math.round(size)}px ${FONT_VERSE}`;
}

// Hand lettering (the margin, headings and labels). It has no italic or bold of its own, so
// those are left to the browser; it runs a little small, so it is drawn a little larger.
function hand(size, style) {
  ctx.font = `${style || ''} ${Math.round(size * 1.12)}px ${FONT_HAND}`;
}

function wrapPx(str, maxW) {
  const out = [];
  let line = '';
  for (const word of String(str).split(' ')) {
    const tryLine = line ? line + ' ' + word : word;
    if (line && ctx.measureText(tryLine).width > maxW) { out.push(line); line = word; }
    else line = tryLine;
  }
  out.push(line);
  return out;
}

function fitText(str, maxW) {
  if (ctx.measureText(str).width <= maxW) return str;
  while (str.length > 1 && ctx.measureText(str + '…').width > maxW) str = str.slice(0, -1);
  return str + '…';
}

// ---------------------------------------------------------------------------------------

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (FX.shake > 0.2) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  ctx.drawImage(paper, 0, 0, W, H);
  Ink.t = FX.now / 1000;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const inGame = G.player && G.level && G.back === 'play';
  if (Phone.on || Phone.sideways) drawPhone(inGame); // js/draw/phone.js
  else switch (G.mode) {
    case 'splash': drawSplash(); break;
    case 'title': drawTitle(); break;
    case 'play': drawPlay(); break;
    case 'inventory': drawPlay(); drawInventory(); break;
    case 'gear': drawPlay(); drawGear(); break;
    case 'encounter': drawPlay(); break;
    case 'help': if (inGame) drawPlay(); drawHelp(); break;
    case 'log': drawPlay(); drawLogOverlay(); break;
    case 'graveyard': drawGraveyard(); break;
    case 'bestiary': drawBestiary(); break;
    case 'story': case 'floorcard': case 'card': case 'rhyme': case 'dead': case 'win': case 'choice':
      drawPage(G.page);
      break;
  }
  if (G.mode === 'title' || G.mode === 'splash') {
    for (const e of FX.eyes) if (e.space === 'screen') inkEyes(e.x * W, e.y * H, 26, e.color, e.seed);
  }
  if (FX.flash > 0.01) {
    ctx.globalAlpha = FX.flash;
    ctx.fillStyle = FX.flashColor;
    ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.globalAlpha = 1;
  }
}

// A pair of eyes glowing out of an ink blot.
function inkEyes(x, y, size, color, seed) {
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI * 2, r = size * (0.75 + 0.2 * Math.sin(a * 3 + seed));
    const px = x + Math.cos(a) * r * 1.3, py = y + Math.sin(a) * r * 0.8;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
  if ((FX.now + seed) % RULES.ui.blinkPeriodMs < RULES.ui.blinkClosedMs) return; // blink
  drawEyes(x, y, size * 0.5, color);
}

function drawEyes(x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.8;
  for (const dx of [-0.42, 0.42]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * size, y, size * 0.2, size * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------------------
// The map.

const sx = x => View.x + (x - View.camX) * View.S;
const sy = y => View.y + (y - View.camY) * View.S;

// Where the camera is heading (it glides there over a few frames).
function cameraTarget() {
  const p = G.player, S = View.S, cols = View.w / S, rows = View.h / S;
  const tx = p.x + 0.5 - cols / 2, ty = p.y + 0.5 - rows / 2;
  return [cols >= MAP_W ? (MAP_W - cols) / 2 : clamp(tx, 0, MAP_W - cols), rows >= MAP_H ? (MAP_H - rows) / 2 : clamp(ty, 0, MAP_H - rows)];
}

function updateCamera(snap) {
  const [tx, ty] = cameraTarget();
  if (snap) { View.camX = tx; View.camY = ty; return; }
  View.camX += (tx - View.camX) * 0.2;
  View.camY += (ty - View.camY) * 0.2;
}

function drawPlay() {
  const L = G.level, p = G.player, S = View.S, d = lookFrac(p);
  updateCamera(View.level !== L);
  View.level = L;
  Ink.setMood(d, S, p.confused ? S * 0.08 : 0);
  Ink.leanY = View.y + View.h / 2;
  if (FX.reduced) { Ink.wobble *= 0.3; Ink.lean *= 0.2; }
  const x0 = Math.max(0, Math.floor(View.camX) - 1), x1 = Math.min(MAP_W - 1, Math.ceil(View.camX + View.w / S));
  const y0 = Math.max(0, Math.floor(View.camY) - 1), y1 = Math.min(MAP_H - 1, Math.ceil(View.camY + View.h / S));

  ctx.save();
  ctx.beginPath();
  ctx.rect(View.x, View.y, View.w, View.h);
  ctx.clip();
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = idx(x, y);
      if (L.seen[i]) drawTerrain(L, x, y, sx(x), sy(y), S, !!L.visible[i]);
    }
  }
  drawDarkRoom(L, S, x0, y0, x1, y1);
  drawStains(L, S);
  for (const tt of FX.teeth) zigzag(sx(tt.x) + S * 0.1, sy(tt.y) + S * 0.5, sx(tt.x) + S * 0.9, sy(tt.y) + S * 0.5, 4, S * 0.18, { w: 1.6, color: C.red });
  drawThings(L, p, S);
  drawFlood(L, p, x0, y0, x1, y1);
  drawDarkThings(L, p, S);
  drawWords(L, S);
  drawEdges(p);
  drawCaption();
  drawBubbles(L, p, S);
  drawFaceOff(p, S);
  drawFloats(S);
  ctx.restore();
  if (Phone.on) return drawPhoneBars(p);
  drawMargin(p);
  drawLog();
}

// Where to draw something this frame: its cell, eased from where it was drawn before (with a
// little hop), plus any lunge (it's attacking) or recoil (it's been hit). A jump of more than a
// couple of cells (teleports, things you couldn't see moving) just snaps.
function animPos(e, dur) {
  if (e.ax == null || Math.abs(e.ax - e.x) + Math.abs(e.ay - e.y) > 2.6) {
    e.ax = e.x; e.ay = e.y; e.fromX = e.x; e.fromY = e.y; e.moveT0 = -1e9;
  } else if (e.ax !== e.x || e.ay !== e.y) {
    const [cx, cy] = e.drawAt || [e.ax, e.ay];
    e.fromX = cx; e.fromY = cy; e.ax = e.x; e.ay = e.y; e.moveT0 = FX.now;
  }
  const k = FX.reduced ? 1 : clamp((FX.now - e.moveT0) / dur, 0, 1), ease = 1 - (1 - k) * (1 - k);
  let x = e.fromX + (e.x - e.fromX) * ease, y = e.fromY + (e.y - e.fromY) * ease;
  e.drawAt = [x, y];
  const lift = Math.sin(k * Math.PI) * 0.14;
  if (!FX.reduced) {
    for (const [a, amt, ms] of [[e.lunge, 0.32, 220], [e.recoil, 0.2, 280]]) {
      if (!a) continue;
      const t = (FX.now - a.t0) / ms;
      if (t < 0 || t >= 1) continue;
      const push = Math.sin(t * Math.PI) * amt, len = Math.hypot(a.dx, a.dy) || 1;
      x += (a.dx / len) * push;
      y += (a.dy / len) * push;
    }
  }
  return [x, y, lift];
}

// Everything standing on the map, drawn back to front so tall things overlap the row above.
function drawThings(L, p, S) {
  const things = [];
  const vis = (x, y) => L.visible[idx(x, y)];
  for (const it of L.items) {
    if (!vis(it.x, it.y)) continue;
    things.push([it.y, 0, () => {
      if (!drawItem(it.item, sx(it.x) + S / 2, sy(it.y) + S * 0.55, S)) glyph(itemGlyph(it.item).ch, it.x, it.y, itemGlyph(it.item).color);
    }]);
  }
  for (const f of L.fixtures || []) {
    // set-pieces are drawn larger than a cell: they're meant to be noticed
    if (vis(f.x, f.y)) things.push([f.y, 0.5, () => VIGNETTE_ART[f.kind](sx(f.x) + S / 2, sy(f.y) + S * 0.9, S * 1.4, f)]);
  }
  for (const ph of L.phantoms) {
    if (!vis(ph.x, ph.y)) continue;
    const [ax, ay] = animPos(ph, 160);
    things.push([ay, 1, () => {
      Ink.unreal = true; // pale, scratchy and broken: unmistakably not there
      const type = ph.type;
      const ok = ph.kind === 'monster' && MONSTERS[type]
        ? drawMonster({ type, d: MONSTERS[type], x: ph.x, y: ph.y, stun: 0 }, sx(ax) + S / 2, sy(ay) + S * 0.9, S)
        : drawItem({ kind: { '!': 'potion', '?': 'scroll', ')': 'weapon' }[ph.ch] || 'gold' }, sx(ph.x) + S / 2, sy(ph.y) + S * 0.55, S, ph.color);
      if (!ok) glyph(ph.ch, ph.x, ph.y, towardPaper(ph.color, INK_UNREAL.wash));
      Ink.unreal = false;
    }]);
  }
  for (const gh of L.ghosts) {
    if (gh.gone || !vis(gh.x, gh.y)) continue;
    things.push([gh.y, 2, () => {
      const [a, c] = [Ink.alpha, Ink.color];
      Ink.alpha = 0.4 + 0.2 * Math.sin(FX.now * 0.004);
      Ink.color = GHOST_COLOR;
      drawPlayer(sx(gh.x) + S / 2, sy(gh.y) + S * 0.9 - Math.sin(FX.now * 0.002) * S * 0.06, S, { wick: 0, body: GHOST_COLOR });
      [Ink.alpha, Ink.color] = [a, c];
    }]);
  }
  for (const m of L.monsters) {
    if (!vis(m.x, m.y)) continue;
    const [ax, ay, lift] = animPos(m, (m.speed || m.d.speed) >= 1.5 ? 90 : 140);
    things.push([ay, 3, () => {
      const cx = sx(ax) + S / 2, by = sy(ay) + S * 0.9 - lift * S;
      if (m.disguised) drawItem(BLANK_GEAR.head, cx, sy(m.y) + S * 0.55, S);
      else if (!(m.napping || m.lulled > 0 ? lyingDown(cx, by, S, () => drawMonster(m, cx, by, S)) : drawMonster(m, cx, by, S))) glyph(m.d.ch, m.x, m.y, m.d.color);
      if (!m.disguised && !m.d.invulnerable && m.hp < m.maxHp) {
        const hw = S * (m.type === 'nibbler' ? 1.4 : 0.6), hy = sy(ay) + S * 0.97;
        line(cx - hw / 2, hy, cx + hw / 2, hy, { w: 0.7, color: C.dim, noScratch: true });
        line(cx - hw / 2, hy, cx - hw / 2 + hw * clamp(m.hp / m.maxHp, 0, 1), hy, { w: 2.2, color: C.red, noScratch: true });
      }
    }]);
  }
  for (const d of FX.deaths) {
    if (vis(d.m.x, d.m.y)) things.push([d.m.y, 3.5, () => drawDeath(d, S)]);
  }
  const [px, py, plift] = animPos(p, 120);
  things.push([py, 4, () => {
    const cx = sx(px) + S / 2, by = sy(py) + S * 0.9 - plift * S;
    if (p.hidden) drawBarrel(unit(cx, by, S), S, true);
    else drawPlayer(cx, by, S, { wick: p.wick, confused: p.confused > 0, gear: p.gear });
    // Mold-Mites asleep in your lap, small, curled up, breathing
    (p.hidden ? [] : p.lap || []).forEach((m, k) => {
      const lx = cx + (k % 2 ? -1 : 1) * S * (0.34 + 0.14 * Math.floor(k / 2)), ly = by + S * 0.02;
      lyingDown(lx, ly, S * 0.7, () => drawMonster(m, lx, ly, S * 0.7));
    });
  }]);
  things.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  for (const t of things) t[2]();
}

// A dead horror: the pen scribbles it out, it fades, and a blot is left on the floor.
function drawDeath(d, S) {
  const age = FX.now - d.t0, cx = sx(d.m.x) + S / 2, by = sy(d.m.y) + S * 0.9;
  const scale = d.m.type === 'nibbler' ? 1.9 : 1;
  const fade = clamp(1 - (age - 350) / 600, 0, 1);
  if (fade > 0) {
    const a = Ink.alpha;
    Ink.alpha = fade;
    drawMonster(d.m, cx, by, S);
    Ink.alpha = a;
  }
  const n = 9, k = clamp(age / 330, 0, 1), w = S * 0.36 * scale, top = by - S * 1.05 * scale, bot = by - S * 0.08;
  const pts = [];
  for (let i = 0; i <= Math.ceil(n * k); i++) {
    pts.push([cx + (i % 2 ? w : -w) + (hash(i + d.t0 * 0.01) - 0.5) * S * 0.12, top + ((bot - top) * i) / n]);
  }
  if (pts.length > 1) stroke(pts, { w: 2.1, alpha: clamp(1.5 - age / RULES.fx.deathMs, 0, 1), noScratch: true, step: 0 });
}

// Ink blots where things died. They stay.
function drawStains(L, S) {
  for (const st of L.stains || []) {
    if (!L.visible[idx(st.x, st.y)]) continue;
    const a = clamp((FX.now - st.t0 - 350) / 700, 0, 1) * 0.55;
    if (a <= 0) continue;
    const cx = sx(st.x) + S / 2, cy = sy(st.y) + S * 0.74, r = S * (st.big ? 0.75 : 0.26);
    ctx.globalAlpha = a;
    ctx.fillStyle = INK;
    ctx.beginPath();
    for (let k = 0; k <= 10; k++) {
      const ang = (k / 10) * Math.PI * 2, q = r * (0.7 + 0.45 * hash(st.seed * 97 + k));
      const x = cx + Math.cos(ang) * q, y = cy + Math.sin(ang) * q * 0.55;
      if (k) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.fill();
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(cx + (hash(st.seed + k) - 0.5) * r * 3, cy + (hash(st.seed + k + 7) - 0.5) * r * 1.4, S * 0.025, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// Sounds, written where they came from: pale on the ink, dark on the paper.
function drawWords(L, S) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const life = RULES.fx.wordMs;
  for (const w of FX.words) {
    if (!inMap(w.x, w.y)) continue;
    const age = FX.now - w.t0, a = clamp(Math.min(age / 200, (life - age) / 500), 0, 1);
    const lit = L.visible[idx(w.x, w.y)];
    if (Phone.on && pinnedWord(w, a, S)) continue; // outside the phone's smaller view: at its edge
    serif(S * (w.big ? 0.55 : 0.32), 'italic');
    ctx.globalAlpha = a * 0.85;
    ctx.fillStyle = lit ? INK : '#efe3c8';
    ctx.fillText(w.text, sx(w.x) + S / 2 + Math.sin(age * 0.004 + w.seed * 9) * S * 0.08, sy(w.y) + S * 0.45 - (age / life) * S * 0.45);
  }
  ctx.globalAlpha = 1;
}

// Fallback for anything without a drawing: its old letter, in ink.
function glyph(ch, x, y, color) {
  const S = View.S;
  ctx.font = `bold ${Math.round(S * 0.7)}px ${FONT_VERSE}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color || INK;
  const [wx, wy] = warp(sx(x) + S / 2, sy(y) + S / 2);
  ctx.fillText(ch, wx, wy);
}

// Darkness is ink soaking into the page from everywhere your light isn't. Each cell says how
// much ink it wants; that is sampled finely, stirred with slow noise so the edge creeps and
// feathers like wet ink, then used as a mask over a mottled ink-wash texture.
const FOG_K = 6;
let cellInk = new Float32Array(0), flood = null, floodCtx = null, inkTex = null;

// Smooth value noise in [-1, 1] from a lookup table (much cheaper than sin() per pixel).
const NOISE = new Float32Array(256 * 256).map((_, i) => hash(i * 0.618) * 2 - 1);
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const x0 = ix & 255, x1 = (ix + 1) & 255, y0 = (iy & 255) << 8, y1 = ((iy + 1) & 255) << 8;
  const a = NOISE[x0 + y0], b = NOISE[x1 + y0], c = NOISE[x0 + y1], d = NOISE[x1 + y1];
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function makeInkTexture(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = INK;
  g.fillRect(0, 0, w, h);
  const rnd = (i, k) => hash(i * 7.3 + k * 13.9 + 5);
  // Everything is drawn nine times, shifted by the texture's size, so it tiles without seams.
  const wrapped = fn => { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) fn(dx, dy); };
  const pool = (x, y, r, rgba) => wrapped((dx, dy) => {
    const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
    gr.addColorStop(0, rgba);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
  });
  for (let i = 0; i < 70; i++) pool(rnd(i, 1) * w, rnd(i, 2) * h, 30 + rnd(i, 3) * 170, 'rgba(95,70,80,0.2)');
  for (let i = 0; i < 40; i++) pool(rnd(i, 4) * w, rnd(i, 5) * h, 20 + rnd(i, 6) * 120, 'rgba(0,0,0,0.35)');
  g.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) { // tide marks, where puddles of ink dried
    const x = rnd(i, 7) * w, y = rnd(i, 8) * h, r = 20 + rnd(i, 9) * 110;
    g.strokeStyle = `rgba(0,0,0,${0.25 + rnd(i, 10) * 0.3})`;
    wrapped((dx, dy) => {
      g.beginPath();
      for (let k = 0; k <= 24; k++) {
        const a = (k / 24) * Math.PI * 2, q = r * (1 + 0.12 * Math.sin(a * 3 + i) + 0.06 * Math.sin(a * 7 + i));
        if (k) g.lineTo(x + dx + Math.cos(a) * q, y + dy + Math.sin(a) * q);
        else g.moveTo(x + dx + Math.cos(a) * q, y + dy + Math.sin(a) * q);
      }
      g.stroke();
    });
  }
  for (let i = 0; i < (w * h) / 700; i++) {
    g.fillStyle = `rgba(150,120,100,${0.05 + rnd(i, 11) * 0.1})`;
    g.fillRect(rnd(i, 12) * w, rnd(i, 13) * h, 1.5, 1.5);
  }
  return c;
}

let floodKey = '', floodAt = -1e9, floodBox = null;

// The ink layer is rebuilt a few times a second (or when anything changes), in map space, so
// moving the camera only slides it. Its texture is anchored to the map, so the ink stays put.
function drawFlood(L, p, x0, y0, x1, y1) {
  const S = View.S, d = lookFrac(p);
  const key = [L.depth, G.turn, x0, y0, x1, y1, S, Math.round(d * 20), lightRadius(), p.x, p.y].join();
  if (key !== floodKey || FX.now - floodAt > 140) {
    buildFlood(L, p, x0, y0, x1, y1);
    floodKey = key;
    floodAt = FX.now;
  }
  const b = floodBox;
  ctx.drawImage(flood, sx(b.x0), sy(b.y0), b.cw * S, b.ch * S);
  drawTendrils(L, p, x0, y0, x1, y1, d);
}

function buildFlood(L, p, x0, y0, x1, y1) {
  const S = View.S, cw = x1 - x0 + 1, ch = y1 - y0 + 1, d = lookFrac(p), r = lightRadius();
  floodBox = { x0, y0, cw, ch };
  if (cellInk.length < cw * ch) cellInk = new Float32Array(cw * ch);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = idx(x, y);
      cellInk[(y - y0) * cw + (x - x0)] = L.visible[i]
        ? clamp(Math.pow(Math.hypot(x - p.x, y - p.y) / (r + 0.6), 2) * (0.3 + 0.45 * d), 0, 0.85)
        : L.seen[i] ? 0.44 + d * 0.3 : 0.97;
    }
  }
  const w = cw * FOG_K, h = ch * FOG_K;
  if (!fog || fog.width !== w || fog.height !== h) {
    fog = document.createElement('canvas');
    fog.width = w;
    fog.height = h;
    fogCtx = fog.getContext('2d');
    fogImg = fogCtx.createImageData(w, h);
  }
  const data = fogImg.data, t = Ink.t * 0.12, amp = 0.3 + 0.3 * d;
  for (let v = 0; v < h; v++) {
    const gy = (v + 0.5) / FOG_K - 0.5, iy = clamp(Math.floor(gy), 0, ch - 1), iy2 = Math.min(ch - 1, iy + 1), fy = clamp(gy - iy, 0, 1);
    const wy = y0 + (v + 0.5) / FOG_K;
    for (let u = 0; u < w; u++) {
      const gx = (u + 0.5) / FOG_K - 0.5, ix = clamp(Math.floor(gx), 0, cw - 1), ix2 = Math.min(cw - 1, ix + 1), fx = clamp(gx - ix, 0, 1);
      const c00 = cellInk[iy * cw + ix], c10 = cellInk[iy * cw + ix2], c01 = cellInk[iy2 * cw + ix], c11 = cellInk[iy2 * cw + ix2];
      const a = (c00 * (1 - fx) + c10 * fx) * (1 - fy) + (c01 * (1 - fx) + c11 * fx) * fy;
      // only stir the ink where light meets dark; even washes stay even
      const edge = clamp((Math.max(c00, c10, c01, c11) - Math.min(c00, c10, c01, c11)) * 2.2, 0, 1);
      let q = a;
      if (edge > 0) {
        const wx = x0 + (u + 0.5) / FOG_K;
        const n = vnoise(wx * 1.3 + t, wy * 1.3 - t * 0.7) * 0.65 + vnoise(wx * 3.4 - t, wy * 3.4) * 0.35;
        q = a + (n * amp + d * 0.12) * edge;
      }
      data[(v * w + u) * 4 + 3] = Math.round(clamp((q - 0.5) * 1.7 + 0.5, 0, 1) * 255);
    }
  }
  fogCtx.putImageData(fogImg, 0, 0);
  const res = Math.min(dpr, 1.5), fw = Math.round(cw * S * res), fh = Math.round(ch * S * res);
  if (!flood || flood.width !== fw || flood.height !== fh) {
    flood = document.createElement('canvas');
    flood.width = fw;
    flood.height = fh;
    floodCtx = flood.getContext('2d');
  }
  if (!inkTex) inkTex = makeInkTexture(1024, 768);
  floodCtx.setTransform(res, 0, 0, res, 0, 0);
  floodCtx.globalCompositeOperation = 'source-over';
  floodCtx.clearRect(0, 0, cw * S, ch * S);
  // Lay down the ink texture, anchored to the map so it doesn't swim when you walk...
  const tw = inkTex.width, th = inkTex.height;
  const ox = -((((x0 * S) % tw) + tw) % tw), oy = -((((y0 * S) % th) + th) % th);
  for (let ty = oy; ty < ch * S; ty += th) for (let tx = ox; tx < cw * S; tx += tw) floodCtx.drawImage(inkTex, tx, ty);
  // ...then keep it only where the mask says there should be ink (one draw, so nothing is erased twice).
  floodCtx.globalCompositeOperation = 'destination-in';
  floodCtx.imageSmoothingEnabled = true;
  floodCtx.imageSmoothingQuality = 'high';
  floodCtx.drawImage(fog, 0, 0, cw * S, ch * S);
  floodCtx.globalCompositeOperation = 'source-over';
}

function drawTendrils(L, p, x0, y0, x1, y1, d) {
  const S = View.S;
  // When you're frightened, thin tendrils of ink crawl in from the dark toward you.
  if (d > 0.45) {
    for (let y = Math.max(1, y0); y <= Math.min(MAP_H - 2, y1); y++) {
      for (let x = Math.max(1, x0); x <= Math.min(MAP_W - 2, x1); x++) {
        const i = idx(x, y), seed = hash(i);
        if (L.visible[i] || seed > (d - 0.4) * 0.8) continue;
        const toward = DIR4.find(([dx, dy]) => L.visible[idx(x + dx, y + dy)]);
        if (!toward) continue;
        const len = (d - 0.35) * 3 * S * (0.6 + 0.4 * Math.sin(Ink.t * 0.5 + seed * 20));
        const bx = sx(x) + S / 2, by = sy(y) + S / 2, [dx, dy] = toward;
        const pts = [];
        for (let k = 0; k <= 5; k++) {
          const f = k / 5, side = Math.sin(f * 5 + Ink.t + seed * 9) * S * 0.18 * f;
          pts.push([bx + dx * len * f - dy * side, by + dy * len * f + dx * side]);
        }
        stroke(pts, { w: 1.3, alpha: 0.85, noScratch: true, step: 0 });
      }
    }
  }
}

// A dark room: ink fills it wherever your light isn't, and the doorways hang with ink, like a
// curtain somebody drew. It shows on the map once you have glimpsed a doorway.
function drawDarkRoom(L, S, x0, y0, x1, y1) {
  const r = L.darkRoom;
  if (!r || !r.seen) return;
  ctx.fillStyle = INK;
  for (let y = Math.max(r.y, y0); y < Math.min(r.y + r.h, y1 + 1); y++) {
    for (let x = Math.max(r.x, x0); x < Math.min(r.x + r.w, x1 + 1); x++) {
      if (L.visible[idx(x, y)] || !L.seen[idx(x, y)]) continue;
      ctx.globalAlpha = 0.82;
      ctx.fillRect(sx(x), sy(y), S + 0.5, S + 0.5);
    }
  }
  ctx.globalAlpha = 1;
  for (const [x, y, ox, oy] of darkRoomDoors(L)) {
    if (!L.seen[idx(ox, oy)] || x < x0 || x > x1 || y < y0 || y > y1) continue;
    // drips along the edge between the doorway and the room
    const ex = sx(x) + S / 2 - (x - ox) * S / 2, ey = sy(y) + S / 2 - (y - oy) * S / 2;
    for (let k = -2; k <= 2; k++) {
      const len = S * (0.25 + 0.2 * (hash(x * 7 + y * 13 + k) % 1));
      const along = k * S * 0.18, sway = Math.sin(Ink.t * 2 + k) * S * 0.02;
      const [ax, ay] = x !== ox ? [ex, ey + along] : [ex + along, ey];
      const [dx, dy] = x !== ox ? [(x - ox) * len, sway] : [sway, (y - oy) * len];
      stroke([[ax, ay], [ax + dx, ay + dy]], { w: 1.6, color: INK, step: 0 });
    }
  }
}

// Nap time: a horror lies down on its side, head to the left, and breathes slowly.
function lyingDown(cx, by, S, draw) {
  const breathe = 1 + 0.05 * Math.sin(FX.now * 0.0025 + cx * 0.1);
  ctx.save();
  ctx.translate(cx, by - S * 0.22);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(0.85, 0.85 * breathe);
  ctx.translate(-cx, -(by - S * 0.4));
  const drawn = draw();
  ctx.restore();
  return drawn;
}

// Things you know about but can't see: eyes in the ink, rustling grass, and anything the
// Brew of Peeping shows you.
function drawDarkThings(L, p, S) {
  const r = lightRadius(), blink = RULES.ui.blinkPeriodMs, shut = RULES.ui.blinkClosedMs;
  for (const m of L.monsters) {
    if (L.visible[idx(m.x, m.y)] || m.disguised) continue;
    const cx = sx(m.x) + S / 2, cy = sy(m.y) + S / 2;
    if (p.sensing > 0) {
      const [a, c] = [Ink.alpha, Ink.color];
      Ink.alpha = 0.6;
      Ink.color = '#d8cbb0';
      drawMonster(m, cx, sy(m.y) + S * 0.9, S);
      [Ink.alpha, Ink.color] = [a, c];
    } else if (m.awake && manhattan(m, p) <= r + 8 && (FX.now + m.x * 977 + m.y * 131) % blink > shut) {
      drawEyes(cx, cy - S * 0.2, S * 0.35, m.type === 'tuck' ? '#f4f0ff' : '#ffd84a');
    }
  }
  for (const h of FX.haunts) {
    if (!inMap(h.x, h.y) || L.visible[idx(h.x, h.y)]) continue;
    drawHaunt(h, sx(h.x) + S / 2, sy(h.y) + S / 2, S);
  }
  for (const rs of FX.rustles) {
    if (L.visible[idx(rs.x, rs.y)]) continue;
    tuft(sx(rs.x) + S / 2, sy(rs.y) + S * 0.85, S * 0.5, 4, Math.sin(Ink.t * 30) * S * 0.2, { w: 1.2, color: '#9fc88a' });
  }
}

// Made-up things in the dark, pale on the ink, there and then not: a smile with nobody behind it,
// a toy that wasn't there a moment ago, a ripple as if something dropped into the ink.
const HAUNT_INK = '#efe3c8';
function drawHaunt(h, cx, cy, S) {
  const life = h.until - h.t0, age = FX.now - h.t0;
  const a = clamp(Math.min(age / 350, (life - age) / 450), 0, 1) * 0.8;
  if (a <= 0) return;
  const [al, col] = [Ink.alpha, Ink.color];
  Ink.alpha = a;
  Ink.color = HAUNT_INK;
  const o = { w: 1.2, color: HAUNT_INK, noScratch: true };
  if (h.kind === 'smile') {
    // a wide, delighted smile, and some teeth in it
    const w = S * 0.42, pts = [], low = [];
    for (let k = 0; k <= 10; k++) {
      const f = k / 10, x = cx - w + 2 * w * f;
      pts.push([x, cy - S * 0.02 + Math.sin(f * Math.PI) * S * 0.2]);
      low.push([x, cy - S * 0.02 + Math.sin(f * Math.PI) * S * 0.11]);
    }
    stroke(pts, Object.assign({ step: 0 }, o));
    stroke(low, Object.assign({ step: 0, w: 0.8 }, o));
    for (let k = 1; k < 8; k++) {
      const f = k / 8, x = cx - w + 2 * w * f, top = cy - S * 0.02 + Math.sin(f * Math.PI) * S * 0.11;
      line(x, top, x, top + S * 0.07, Object.assign({}, o, { w: 0.8 }));
    }
  } else if (h.kind === 'toy') {
    const which = Math.floor(h.seed) % 3, by = cy + S * 0.25;
    if (which === 0) { // a ball with a stripe
      ellipse(cx, by - S * 0.17, S * 0.17, S * 0.17, o, 0.02, h.seed);
      stroke([[cx - S * 0.16, by - S * 0.2], [cx, by - S * 0.12], [cx + S * 0.16, by - S * 0.2]], Object.assign({ step: 0 }, o));
    } else if (which === 1) { // a spinning top, still spinning
      const tilt = Math.sin(FX.now * 0.01 + h.seed) * S * 0.03;
      stroke([[cx + tilt, by], [cx - S * 0.18, by - S * 0.2], [cx + tilt, by - S * 0.36], [cx + S * 0.18, by - S * 0.2]], Object.assign({ closed: true, step: 0 }, o));
      line(cx + tilt, by - S * 0.36, cx + tilt, by - S * 0.46, o);
    } else { // a wooden letter block
      const s = S * 0.17;
      stroke([[cx - s, by], [cx + s, by], [cx + s, by - 2 * s], [cx - s, by - 2 * s]], Object.assign({ closed: true, step: 0 }, o));
      serif(S * 0.26, 'bold');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = a;
      ctx.fillStyle = HAUNT_INK;
      ctx.fillText('ABZ'[Math.floor(h.seed / 3) % 3], cx, by - s);
      ctx.globalAlpha = 1;
    }
  } else { // ripples, spreading
    const k = clamp(age / life, 0, 1);
    for (let i = 0; i < 2; i++) {
      const r = S * (0.12 + 0.4 * ((k + i * 0.35) % 1));
      ellipse(cx, cy + S * 0.15, r, r * 0.45, Object.assign({}, o, { w: 0.9, alpha: 1 - ((k + i * 0.35) % 1) }), 0.04, h.seed + i);
    }
  }
  [Ink.alpha, Ink.color] = [al, col];
}

// Where the face-off card goes: next to you, on whichever side covers the least. Below you is
// preferred, then above, then either side. Horrors count most (the one you're facing most of
// all), then stairs, the odd rooms, things on the floor, and the news ribbon. The side is chosen
// once for a given moment (turn, where you and it stand) so the card doesn't hop about.
let faceOffKey = '', faceOffSide = '';
function placeFaceOff(m, w, h, pcx, top, S) {
  const p = G.player, L = G.level;
  const minX = View.x + 6, maxX = View.x + View.w - w - 6, minY = View.y + 6, maxY = View.y + View.h - h - 8;
  const spots = {
    below: [clamp(pcx - w / 2, minX, maxX), top + S * 1.1, 0],
    above: [clamp(pcx - w / 2, minX, maxX), top - S * 0.95 - h, 0.2],
    right: [pcx + S * 0.85, clamp(top + S * 0.45 - h / 2, minY, maxY), 0.5],
    left: [pcx - S * 0.85 - w, clamp(top + S * 0.45 - h / 2, minY, maxY), 0.5],
  };
  const fits = ([x, y]) => x >= minX - 0.5 && x <= maxX + 0.5 && y >= minY - 0.5 && y <= maxY + 0.5;
  const key = [G.turn, G.mode, p.x, p.y, m.x, m.y, Math.round(w), h].join('|');
  if (key !== faceOffKey || !spots[faceOffSide] || !fits(spots[faceOffSide])) {
    let best = null;
    for (const [side, spot] of Object.entries(spots)) {
      if (!fits(spot)) continue;
      const [x, y, pref] = spot;
      // is the thing drawn in this cell (a cell and a bit tall, if it stands up) behind the card?
      const under = (ex, ey, tall) => inMap(ex, ey) && L.visible[idx(ex, ey)]
        && sx(ex) < x + w && sx(ex) + S > x && sy(ey) - (tall ? S * 0.3 : 0) < y + h && sy(ey) + S > y;
      let cost = pref;
      for (const o of L.monsters) if (!o.disguised && under(o.x, o.y, true)) cost += o === m ? 20 : 10; // they stand a cell tall
      for (const it of L.items) if (under(it.x, it.y)) cost += 3;
      for (const f of L.fixtures || []) if (under(f.x, f.y, true)) cost += 4;
      if (L.stairs && under(L.stairs.x, L.stairs.y)) cost += 4;
      const cb = captionBox;
      if (cb && x < cb.x + cb.w && x + w > cb.x && y < cb.y + cb.h && y + h > cb.y) cost += 5;
      if (!best || cost < best.cost) best = { cost, side };
    }
    faceOffKey = key;
    faceOffSide = best ? best.side : top + S * 1.1 + h < View.y + View.h - 8 ? 'below' : 'above'; // a cramped screen: as it always was
  }
  const [x, y] = spots[faceOffSide];
  return [x, y, faceOffSide];
}

// The card that appears when you're face to face with a horror. Walk into one and you choose
// (it waits for you). Get bitten by one and it just offers: answer however you like, or walk.
function drawFaceOff(p, S) {
  const enc = G.mode === 'encounter' ? G.encounter : null;
  const m = enc ? enc.m : G.mode === 'play' ? currentThreat() : null;
  if (!m || !G.level.monsters.includes(m)) return;
  const th = G.threat;
  if (!enc && FX.now - (th.t || 0) < RULES.ui.threatCardDelayMs) return; // let the blow land (and be seen to land) before you answer it
  if (Phone.on) return drawPhoneFaceOff(p, S, m, enc, th);
  const [lean, wob] = [Ink.lean, Ink.wobble];
  Ink.lean = 0;
  Ink.wobble = Math.min(wob, 1.2);
  const K = TEXT.ui.card;
  const title = enc ? fill(K.face, { m: aM(m) })
    : th.result === 'hit' ? fill(K.hit, { Them: cap(theM(m)), verb: th.verb, dmg: th.dmg })
    : th.result === 'steal' ? fill(K.steal, { Them: cap(theM(m)) }) : fill(K.miss, { Them: cap(theM(m)) });
  const opts = [['A', K.attack], ['R', p.verve > 0 ? K.rhyme : K.noRhymes], ['U', K.use],
    enc ? ['Esc', enc.engaged ? K.backAway : K.leave] : [K.arrows, K.getAway]];
  hand(16);
  const titleW = ctx.measureText(title).width;
  let optsW = 0;
  for (const [k, label] of opts) {
    hand(14, 'bold');
    optsW += ctx.measureText(k).width + 6;
    hand(14);
    optsW += ctx.measureText(label).width + 18;
  }
  const w = Math.max(titleW + 110, optsW + 24), h = enc ? 74 : 58;
  const [dx, dy] = p.drawAt || [p.x, p.y];
  const pcx = sx(dx) + S / 2, top = sy(dy), pcy = top + S * 0.45;
  const [x0, y0, side] = placeFaceOff(m, w, h, pcx, top, S);
  // the card's little pointer to you, from whichever edge faces you
  if (side === 'below' || side === 'above') {
    const tipY = side === 'below' ? y0 : y0 + h, tipTo = side === 'below' ? top + S * 0.95 : top - S * 0.75, bx = clamp(pcx, x0 + 14, x0 + w - 14);
    stroke([[bx - 8, tipY], [pcx, tipTo], [bx + 8, tipY]], { w: 1.2, fill: PAPER, fillAlpha: 1, noScratch: true, step: 0 });
  } else {
    const tipX = side === 'right' ? x0 : x0 + w, tipTo = side === 'right' ? pcx + S * 0.45 : pcx - S * 0.45, by = clamp(pcy, y0 + 12, y0 + h - 12);
    stroke([[tipX, by - 8], [tipTo, pcy], [tipX, by + 8]], { w: 1.2, fill: PAPER, fillAlpha: 1, noScratch: true, step: 0 });
  }
  stroke(rect(x0, y0, w, h), { closed: true, w: enc ? 1.6 : 1.2, color: enc ? INK : C.red, fill: PAPER, fillAlpha: 0.97, noScratch: true });
  Ink.calm(20);
  drawMonster(m, x0 + 20, y0 + 30, m.type === 'nibbler' ? 9 : 20);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  hand(16);
  ctx.fillStyle = enc ? INK : C.red;
  ctx.fillText(title, x0 + 40, y0 + 22);
  if (!m.d.invulnerable) {
    for (let i = 0; i < 5; i++) {
      const filled = i < Math.ceil((m.hp / m.maxHp) * 5);
      ellipse(x0 + w - 62 + i * 11, y0 + 16, 3.5, 3.5, { w: 0.8, fill: C.red, fillAlpha: filled ? 0.8 : 0, noScratch: true }, 0);
    }
  }
  let ox = x0 + 14;
  for (const [k, label] of opts) {
    hand(14, 'bold');
    ctx.fillStyle = C.red;
    ctx.fillText(k, ox, y0 + 45);
    ox += ctx.measureText(k).width + 6;
    hand(14);
    ctx.fillStyle = INK;
    ctx.fillText(label, ox, y0 + 45);
    ox += ctx.measureText(label).width + 18;
  }
  if (enc) {
    hand(12, 'italic');
    ctx.fillStyle = C.gray;
    ctx.fillText(enc.engaged ? K.fighting : K.sleeping, x0 + 14, y0 + 64);
  }
  [Ink.lean, Ink.wobble] = [lean, wob];
}

// Speech balloons, hand-drawn.
function drawBubbles(L, p, S) {
  const size = clamp(S * 0.36, 12, 17), [lean, wobble] = [Ink.lean, Ink.wobble];
  Ink.lean = 0; // words stay upright, however crooked the world gets
  Ink.wobble = Math.min(wobble, 1.5);
  for (const b of FX.bubbles) {
    const tx = b.target.x, ty = b.target.y;
    if (tx == null || manhattan(b.target, p) > RULES.ui.bubbleRange) continue;
    const seen = b.target === p || L.visible[idx(tx, ty)];
    serif(size, 'italic');
    const lines = wrapPx(b.lines.join(' '), S * 5.5);
    const bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + size * 1.4, bh = lines.length * size * 1.25 + size * 0.8;
    const [dx0, dy0] = b.target.drawAt || [tx, ty];
    const ax = sx(dx0) + S / 2, ay = sy(dy0) - S * 0.5;
    const bx = clamp(ax - bw / 2, View.x + 4, View.x + View.w - bw - 4);
    let by = ay - bh - S * 0.35;
    const c = captionBox;
    const hitsCaption = c && bx < c.x + c.w && bx + bw > c.x && by < c.y + c.h && by + bh > c.y;
    const below = by < View.y + 4 || hitsCaption;
    if (below) by = sy(dy0) + S * 1.25;
    const fade = Math.min(1, (b.until - FX.now) / 400) * (seen ? 1 : 0.75);
    Ink.alpha = fade;
    stroke([[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]], { closed: true, w: 1, fill: PAPER, fillAlpha: 0.96, noScratch: true });
    const tx0 = clamp(ax, bx + size, bx + bw - size), ty0 = below ? by : by + bh, tip = below ? sy(dy0) + S * 1.05 : ay;
    stroke([[tx0 - size * 0.35, ty0], [ax, tip], [tx0 + size * 0.35, ty0]], { w: 1, fill: PAPER, fillAlpha: 0.96, noScratch: true, step: 0 });
    Ink.alpha = 1;
    ctx.globalAlpha = fade;
    ctx.fillStyle = b.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, bx + bw / 2, by + size * 0.9 + i * size * 1.25));
    ctx.globalAlpha = 1;
  }
  [Ink.lean, Ink.wobble] = [lean, wobble];
}

function drawFloats(S) {
  serif(S * 0.42, 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const fl of FX.floats) {
    const age = (FX.now - fl.t0) / RULES.fx.floatMs;
    ctx.globalAlpha = clamp(1 - age, 0, 1);
    ctx.fillStyle = fl.color;
    ctx.fillText(fl.text, sx(fl.x) + S / 2, sy(fl.y) - age * S * 0.9);
  }
  ctx.globalAlpha = 1;
}

// Red ink seeping in from the edges when you're dying; a sickly wash when poisoned.
function drawEdges(p) {
  const { x, y, w, h } = View;
  if (p.hp <= p.maxHp * 0.35) {
    const a = (0.22 + 0.12 * Math.sin(FX.now * 0.006)) * (FX.reduced ? 0.5 : 1);
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.7);
    g.addColorStop(0, 'rgba(163,25,43,0)');
    g.addColorStop(1, `rgba(163,25,43,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  if (p.poisoned) {
    ctx.fillStyle = 'rgba(60,120,40,0.08)';
    ctx.fillRect(x, y, w, h);
  }
}

// ---------------------------------------------------------------------------------------
// The margin: a character page. Who and where you are, how you're doing, what you carry,
// what's near you, and what's in your pockets.

const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
// What an empty slot is drawn as (faintly), by gear id. The nest is also what the
// Nothing-to-Worry-About pretends to be.
const BLANK_GEAR = { hand: { kind: 'weapon', id: 'spork' }, head: { kind: 'armor', id: 'nest' },
  body: { kind: 'armor', id: 'overcoat' }, feet: { kind: 'pair', id: 'stripy' } };
// When the Nibbler starts eating the page, letters go missing from the margin.
const nib = (text, seed) => (G.uiNibble ? nibble(text, seed, G.uiNibble) : text);

function sectionLabel(label, x, y, w) {
  ctx.font = `${Math.round(clamp(Margin.w * 0.04, 12, 14))}px ${FONT_HAND}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.red;
  const t = nib(label.toUpperCase(), label.length).split('').join(' ');
  ctx.fillText(t, x, y + 11);
  const tw = ctx.measureText(t).width;
  line(x + tw + 8, y + 7, x + w, y + 7, { w: 0.6, color: C.red, alpha: 0.35, noScratch: true });
  return y + 20;
}

function candleWord(wick) {
  const CW = TEXT.ui.candle;
  if (wick <= 0) return [CW.out, C.red];
  if (wick < RULES.candle.low) return [CW.guttering, C.red];
  if (wick < RULES.candle.full) return [CW.low, C.orange];
  if (wick < RULES.candle.tall) return [CW.burning, C.gray];
  return [CW.tall, C.gray];
}

// Your conditions, as [_, words, colour], for the margin's tags (and the phone's strip under its
// top line, which says how to tap rather than which key to press).
function conditionTags(p) {
  const L = G.level, due = stalkerDue(G.depth);
  const tg = TEXT.ui.tags, ph = Phone.on ? TEXT.ui.phone.tags : tg;
  return [
    [p.poisoned, p.poisoned && fill(tg.poisoned, { n: p.poisoned }), C.green],
    [p.confused, p.confused && fill(tg.confused, { n: p.confused }), C.pink],
    [p.sensing, p.sensing && fill(tg.sensing, { n: p.sensing }), C.teal],
    [p.hidden, tg.hidden, C.green],
    [p.darkTurns, tg.dark, C.red],
    [p.wick <= 0, tg.candleOut, C.red],
    [clumsy(), tg.trembling, C.red],
    [p.hoarse > 0, p.hoarse > 0 && fill(tg.hoarse, { n: p.hoarse }), C.pink],
    [p.lap && p.lap.length, p.lap && (p.lap.length > 1 ? fill(tg.laps, { n: p.lap.length }) : tg.lap), C.green],
    [L.stalker, tg.bedtime, C.red],
    [!L.stalker && !L.isBoss && L.turnsHere >= due - RULES.stalker.musicBoxLead, tg.musicBox, C.pink],
    [L.tiles[idx(p.x, p.y)] === T.STAIRS, ph.stairs, C.blue],
    [itemsHere().length, ph.here, C.blue],
    [currentThreat() && FX.now - (G.threat.t || 0) >= RULES.ui.threatCardDelayMs, ph.threat, C.red],
  ].filter(t => t[0]);
}

function drawMargin(p) {
  const m = Margin, pad = 22, x = m.x + pad, w = m.w - pad * 2, L = G.level, U = TEXT.ui.margin;
  const bottom = H - 30;
  Ink.calm(40);
  stroke([[m.x + 5, 10], [m.x + 3, H / 2], [m.x + 6, H - 10]], { w: 1, color: C.red, alpha: 0.45 });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let y = 36;

  // who and where
  ctx.font = `${Math.round(clamp(m.w * 0.08, 18, 28))}px ${FONT_HAND}`;
  ctx.fillStyle = INK;
  ctx.fillText(phrase('somebody', { n: G.runNo }), x, y);
  y += 21;
  hand(14, 'italic');
  ctx.fillStyle = C.gray;
  ctx.fillText(fill(U.level, { level: p.level, floor: phrase('floorOf', { n: G.depth, of: FLOORS.length }) }), x, y);
  y += 17;
  ctx.fillStyle = L.floor.wall;
  ctx.fillText(fitText(nib(L.floor.name, 7), w), x, y);
  y += 14;

  // health, and how close the next level is
  y = sectionLabel(U.health, x, y, w);
  const bh = 16, barW = w - 66, low = p.hp <= p.maxHp / 3, frac = clamp(p.hp / p.maxHp, 0, 1);
  if (frac > 0) stroke(rect(x, y, barW * frac, bh), { closed: true, w: 0, fill: C.red, fillAlpha: low ? 0.85 : 0.55, step: 0 });
  stroke(rect(x, y, barW, bh), { closed: true, w: 1.1 });
  hand(18, 'bold');
  ctx.fillStyle = low ? C.red : INK;
  ctx.fillText(`${Math.max(0, p.hp)}/${p.maxHp}`, x + barW + 10, y + bh - 1);
  y += bh + 9;
  line(x, y, x + barW, y, { w: 0.6, color: C.dim, noScratch: true });
  if (p.xp > 0) line(x, y, x + barW * clamp(p.xp / p.xpNext, 0, 1), y, { w: 2, color: C.purple, noScratch: true });
  hand(12, 'italic');
  ctx.fillStyle = C.gray;
  ctx.fillText(fill(U.toLevel, { n: p.xpNext - p.xp, next: p.level + 1 }), x, y + 15);
  y += 26;

  // the candle on the left; your numbers on the right
  y = sectionLabel(U.candle, x, y, w);
  const ch = 92, base = y + ch, candleX = x + 26;
  Ink.calm(60);
  ellipse(candleX, base + 2, 24, 5, { w: 1, fill: '#8a847a', fillAlpha: 0.3 });
  // The candle you have, inside a faint outline of the fullest candle there can be, so you can
  // see at a glance how much of it is left.
  const fullH = ch * 0.74, waxH = Math.max(ch * 0.03, fullH * clamp(p.wick / RULES.candle.max, 0, 1));
  stroke(rect(candleX - 7.5, base - fullH, 15, fullH), { closed: true, w: 0.8, alpha: 0.32, noScratch: true, step: 0 });
  drawCandle(candleX, base, waxH, 15, p.wick > 0, 64);
  const [word, wordCol] = candleWord(p.wick);
  hand(12, 'italic');
  ctx.textAlign = 'center';
  ctx.fillStyle = wordCol;
  ctx.fillText(word, candleX, base + 18);
  ctx.textAlign = 'left';
  const colX = x + 66, rh = Math.min(26, (ch + 10) / 4);
  const stat = (i, label, value, icon) => {
    const ry = y + 4 + i * rh;
    Ink.calm(22);
    icon(colX + 10, ry + rh / 2);
    hand(15);
    ctx.fillStyle = C.gray;
    ctx.fillText(label, colX + 28, ry + rh / 2 + 5);
    if (value !== null) {
      hand(17, 'bold');
      ctx.fillStyle = INK;
      ctx.textAlign = 'right';
      ctx.fillText(String(value), x + w, ry + rh / 2 + 5);
      ctx.textAlign = 'left';
    }
  };
  stat(0, U.attack, playerAtk(), (cx, cy) => drawItem(p.gear.hand || BLANK_GEAR.hand, cx, cy, 22));
  stat(1, U.defense, playerDef(), (cx, cy) => drawItem(p.gear.head || p.gear.body || BLANK_GEAR.head, cx, cy, 22));
  stat(2, U.rhymes, null, (cx, cy) => drawNote(cx - 2, cy + 5, 13, p.verve > 0));
  for (let i = 0; i < p.maxVerve; i++) drawNote(x + w - 8 - (p.maxVerve - 1 - i) * 15, y + 4 + 2 * rh + rh / 2 + 5, 13, i < p.verve);
  stat(3, U.coins, p.gold, (cx, cy) => drawItem({ kind: 'gold' }, cx, cy, 22));
  y = base + 26;

  // what you're wearing and wielding, one row per slot (E to change it)
  Ink.calm(40);
  y = sectionLabel(U.gear, x, y, w);
  for (const [slot] of SLOTS) {
    const it = p.gear[slot];
    Ink.calm(20);
    Ink.alpha = it ? 1 : 0.28;
    drawItem(it || BLANK_GEAR[slot], x + 10, y + 10, 20);
    Ink.alpha = 1;
    hand(14, it ? '' : 'italic');
    ctx.fillStyle = it ? INK : C.gray;
    ctx.textAlign = 'left';
    ctx.fillText(fitText(nib(it ? itemName(it) : TEXT.items.empty[slot], y), w - 64), x + 28, y + 15);
    if (it) {
      hand(12, 'italic');
      ctx.fillStyle = C.gray;
      ctx.textAlign = 'right';
      ctx.fillText(fill(slot === 'hand' ? U.atk : U.def, { n: gearBonus(it) }), x + w, y + 15);
      ctx.textAlign = 'left';
    }
    y += 21;
  }
  y += 6;

  // conditions, as little inked tags
  const tags = conditionTags(p);
  if (tags.length) {
    let tx = x;
    hand(13, 'italic');
    for (const [, label, col] of tags) {
      const tw = ctx.measureText(label).width + 16;
      if (tx + tw > x + w) { tx = x; y += 26; }
      Ink.calm(40);
      stroke(rect(tx, y, tw, 20), { closed: true, w: 0.9, color: col, fill: col, fillAlpha: 0.08, noScratch: true });
      hand(13, 'italic');
      ctx.fillStyle = col;
      ctx.fillText(label, tx + 8, y + 14);
      tx += tw + 6;
    }
    y += 30;
  }

  // who's near you, and your pockets: share whatever room is left
  const near = L.monsters
    .filter(mo => !mo.disguised && L.visible[idx(mo.x, mo.y)])
    .map(mo => ({ m: mo, name: mo.d.name, frac: mo.d.invulnerable ? null : mo.hp / mo.maxHp }))
    .concat(L.phantoms.filter(ph => ph.kind === 'monster' && L.visible[idx(ph.x, ph.y)]).map(ph => {
      return { m: { type: ph.type, d: MONSTERS[ph.type], x: ph.x, y: ph.y, stun: 0 }, name: ph.name, frac: undefined };
    }))
    .sort((a, b) => manhattan(a.m, p) - manhattan(b.m, p));
  const rows = pocketRows(p), nRows = Math.max(1, rows.length);
  let pocketH = clamp((bottom - y - 20 - (near.length ? 20 + Math.min(near.length, 3) * 26 : 0)) / nRows, 18, 24);
  const nearRoom = bottom - y - 20 - nRows * pocketH - 26;
  const nearRows = Math.max(0, Math.min(near.length, Math.floor(nearRoom / 26)));
  if (nearRows) {
    y = sectionLabel(U.nearby, x, y, w);
    for (const n of near.slice(0, nearRows)) {
      Ink.calm(22);
      Ink.unreal = n.frac === undefined; // a made-up horror is drawn here as it is on the map
      drawMonster(n.m, x + 11, y + 23, n.m.type === 'nibbler' ? 7 : 21);
      Ink.unreal = false;
      hand(14);
      ctx.fillStyle = INK;
      ctx.fillText(fitText(n.name, w - 96), x + 28, y + 17);
      for (let i = 0; i < 5; i++) {
        const px = x + w - 58 + i * 12, filled = n.frac === null || (n.frac !== undefined && i < Math.ceil(n.frac * 5));
        if (n.frac === undefined) { hand(12, 'italic'); ctx.fillStyle = C.dim; ctx.fillText(U.unknownHealth, px - 3, y + 17); continue; }
        ellipse(px, y + 12, 4, 4, { w: 0.8, fill: n.frac === null ? C.purple : C.red, fillAlpha: filled ? 0.8 : 0, noScratch: true }, 0);
      }
      y += 26;
    }
    y += 6;
  }
  y = sectionLabel(fill(U.pockets, { n: p.inv.length, of: RULES.player.pockets }), x, y, w);
  if (!p.inv.length) {
    hand(14, 'italic');
    ctx.fillStyle = C.dim;
    ctx.fillText(U.noPockets, x + 8, y + 14);
  }
  rows.forEach(({ it, idx: all }, i) => {
    const ry = y + i * pocketH, name = all.length > 1 ? fill(TEXT.ui.pockets.count, { name: itemName(it), n: all.length }) : itemName(it);
    hand(12);
    ctx.fillStyle = C.dim;
    ctx.fillText(slotKey(i), x, ry + pocketH * 0.7);
    Ink.calm(pocketH);
    drawItem(it, x + 22, ry + pocketH / 2, pocketH * 0.95);
    hand(clamp(pocketH * 0.62, 12, 15));
    ctx.fillStyle = INK;
    ctx.fillText(fitText(nib(name, i + 11), w - 40), x + 38, ry + pocketH * 0.7);
  });
  hand(12, 'italic');
  ctx.fillStyle = C.dim;
  ctx.fillText(U.keys, x, H - 14);
}

// What just happened, as a caption ribbon on the map, about three steps from you.
// Each new caption tries above, below, right and left of you, skips any spot that won't fit,
// and takes the one that covers the least (monsters matter most, then stairs, then items,
// then plain lit floor; covering the dark costs nothing). It's pinned to the map, not the
// screen, so it doesn't slide around while the camera glides.
const CAPTION_GAP = 3; // cells between you and the nearest edge of the ribbon
const CAPTION_TAIL = 30;
let captionBox = null, captionKey = '', captionAt = null;

function placeCaption(bw, bh) {
  const S = View.S, p = G.player, L = G.level, [camX, camY] = cameraTarget();
  const pcx = View.x + (p.x + 0.5 - camX) * S, pcy = View.y + (p.y + 0.5 - camY) * S;
  const gap = CAPTION_GAP * S, pad = 10, tail = CAPTION_TAIL;
  const minX = View.x + pad + tail, maxX = View.x + View.w - pad - tail - bw;
  const minY = View.y + pad, maxY = View.y + View.h - pad - bh - 10;
  const spots = [
    [clamp(pcx - bw / 2, minX, maxX), pcy - gap - bh, 0],   // above you (preferred)
    [clamp(pcx - bw / 2, minX, maxX), pcy + gap, 0.4],      // below you
    [pcx + gap + tail, clamp(pcy - bh / 2, minY, maxY), 0.8], // to your right
    [pcx - gap - tail - bw, clamp(pcy - bh / 2, minY, maxY), 0.8], // to your left
  ];
  const cell = (px, py) => [Math.floor((px - View.x) / S + camX), Math.floor((py - View.y) / S + camY)];
  let best = null;
  for (const [x, y, pref] of spots) {
    if (x < minX - 0.5 || x > maxX + 0.5 || y < minY - 0.5 || y > maxY + 0.5) continue;
    const [c0, r0] = cell(x - tail, y), [c1, r1] = cell(x + bw + tail, y + bh + 10);
    let cost = pref;
    for (let cy = r0; cy <= r1; cy++) {
      for (let cx = c0; cx <= c1; cx++) {
        if (!inMap(cx, cy) || !L.visible[idx(cx, cy)]) continue;
        cost += L.tiles[idx(cx, cy)] === T.STAIRS ? 4 : 0.08;
      }
    }
    // monsters are tall, so one standing just below the ribbon still counts
    for (const m of L.monsters) {
      if (!m.disguised && L.visible[idx(m.x, m.y)] && m.x >= c0 && m.x <= c1 && m.y >= r0 && m.y <= r1 + 1) cost += 10;
    }
    for (const it of L.items) {
      if (L.visible[idx(it.x, it.y)] && it.x >= c0 && it.x <= c1 && it.y >= r0 && it.y <= r1) cost += 3;
    }
    if (!best || cost < best.cost) best = { cost, x, y };
  }
  // Nowhere fits three steps away (a cramped screen): fall back to the edge furthest from you.
  if (!best) best = { x: clamp(pcx - bw / 2, minX, maxX), y: pcy > View.y + View.h / 2 ? minY : maxY };
  return { mx: (best.x - View.x) / S + camX, my: (best.y - View.y) / S + camY };
}

function drawCaption() {
  captionBox = null;
  if (G.log.length <= G.logMark) return;
  const newest = G.log[G.log.length - 1], age = FX.now - newest.t, life = RULES.ui.captionMs;
  if (age > life) return;
  const a = clamp(Math.min(age / 180, (life - age) / 900), 0, 1);
  const size = clamp(H * 0.022, 15, 20), lh = size * 1.35, maxW = Math.min(View.w * 0.55, 600);
  serif(size, 'italic');
  // whole messages only, newest first, up to four lines
  let lines = [];
  for (let i = G.log.length - 1; i >= G.logMark; i--) {
    const wrapped = wrapPx(G.log[i].text, maxW).map(l => [l, G.log[i].color]);
    if (lines.length && lines.length + wrapped.length > 4) break;
    lines = wrapped.concat(lines);
  }
  const tw = Math.max(...lines.map(l => ctx.measureText(l[0]).width));
  const bw = tw + 56, bh = lines.length * lh + 16;
  // message serial numbers, not positions: the log is trimmed, so positions repeat
  const key = [G.log[G.logMark].id, newest.id, G.depth, Math.round(bw), Math.round(bh)].join();
  if (key !== captionKey) {
    captionKey = key;
    captionAt = placeCaption(bw, bh);
  }
  const x0 = sx(captionAt.mx), y0 = sy(captionAt.my), x1 = x0 + bw, y1 = y0 + bh, mid = (y0 + y1) / 2, cx = x0 + bw / 2;
  captionBox = { x: x0 - CAPTION_TAIL, y: y0, w: bw + CAPTION_TAIL * 2, h: bh + 12 };
  const [lean, wob] = [Ink.lean, Ink.wobble];
  Ink.lean = 0;
  Ink.wobble = Math.min(wob, 1.2);
  Ink.alpha = a;
  // the ribbon's folded tails, then its face
  stroke([[x0 + 14, y0 + 9], [x0 - 26, y0 + 9], [x0 - 14, mid + 9], [x0 - 26, y1 + 9], [x0 + 14, y1 + 9]], { closed: true, w: 1.1, fill: '#e2d4b2', fillAlpha: 1, noScratch: true });
  stroke([[x1 - 14, y0 + 9], [x1 + 26, y0 + 9], [x1 + 14, mid + 9], [x1 + 26, y1 + 9], [x1 - 14, y1 + 9]], { closed: true, w: 1.1, fill: '#e2d4b2', fillAlpha: 1, noScratch: true });
  stroke(rect(x0, y0, bw, bh), { closed: true, w: 1.3, fill: PAPER, fillAlpha: 1, noScratch: true });
  Ink.alpha = 1;
  [Ink.lean, Ink.wobble] = [lean, wob];
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  serif(size, 'italic');
  lines.forEach(([l, col], i) => {
    ctx.fillStyle = col;
    ctx.fillText(l, cx, y0 + 8 + (i + 0.78) * lh);
  });
  ctx.globalAlpha = 1;
}

// The story so far: a strip of paper across the bottom, newest lines marked with a highlighter.
function drawLog() {
  const b = LogBox, px = b.x + 18, py = b.y + 16, pw = b.w - 36, ph = b.h - 26;
  Ink.calm(40);
  stroke(rect(px, py, pw, ph), { closed: true, w: 1.2, fill: '#f7f0dd', fillAlpha: 0.95 });
  spiral(px + 1, py + ph / 2, 10, 1.6, { w: 0.9 });
  spiral(px + pw - 1, py + ph / 2, 10, 1.6, { w: 0.9 });
  const title = TEXT.ui.storySoFar.split('').join(' ');
  ctx.font = `13px ${FONT_HAND}`;
  const ttw = ctx.measureText(title).width;
  ctx.fillStyle = '#f7f0dd';
  ctx.fillRect(b.x + b.w / 2 - ttw / 2 - 10, py - 7, ttw + 20, 14);
  ctx.fillStyle = C.red;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, b.x + b.w / 2, py + 4);

  const cx = px + pw / 2, maxW = Math.min(pw - 90, 860);
  const big = clamp(H * 0.021, 14, 18), small = big * 0.86;
  const undone = dreadTier() === 3, bottomFloor = G.depth === FLOORS.length;
  const lines = [];
  let room = ph - 22;
  for (let i = G.log.length - 1; i >= 0 && room > 0; i--) {
    const m = G.log[i], fresh = i >= G.logMark;
    let t = m.text;
    if (!fresh && undone) t = glitch(t, i);
    if (!fresh && bottomFloor) t = nibble(t, i);
    serif(fresh ? big : small, fresh ? '' : 'italic');
    const wrapped = wrapPx(t, maxW);
    for (let k = wrapped.length - 1; k >= 0; k--) {
      const lh = (fresh ? big : small) * 1.32;
      if (room < lh) { room = 0; break; }
      room -= lh;
      lines.unshift({ t: wrapped[k], col: m.color, fresh, lh });
    }
  }
  let y = py + ph - 10 - lines.reduce((s, l) => s + l.lh, 0);
  const oldCount = lines.filter(l => !l.fresh).length;
  let oldIdx = 0;
  for (const l of lines) {
    y += l.lh;
    serif(l.fresh ? big : small, l.fresh ? '' : 'italic');
    ctx.textAlign = 'center';
    if (l.fresh) {
      const tw = ctx.measureText(l.t).width;
      stroke([[cx - tw / 2 - 8, y - big * 0.3], [cx + tw / 2 + 8, y - big * 0.36]], { w: big * 0.62, color: '#f2cf4a', alpha: 0.55, noScratch: true, step: 0 });
      ctx.fillStyle = l.col;
    } else {
      ctx.fillStyle = shade(l.col, 0.3 + 0.35 * (++oldIdx / Math.max(1, oldCount)));
    }
    ctx.fillText(l.t, cx, y - 3);
  }
}

function nibble(text, seed, rate = 0.12) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const h = Math.sin(seed * 3.7 + i * 12.1) * 9999;
    out += h - Math.floor(h) < rate && text[i] !== ' ' ? '_' : text[i];
  }
  return out;
}
