'use strict';
// The phone layout: the same game on a phone held upright (render.js switches it on by itself when
// the screen is taller than it is wide, and narrow; a computer never draws any of this).
//
// Top to bottom: a slim top line (who and where you are, health, the candle, rhymes, coins, the
// menu button), the map (RULES.phone.across squares across) with your conditions along its top,
// the last two lines of the story, and four buttons that are always the same.
//
// Everything you can tap is put on a list as it is drawn (Taps), with the key presses the keyboard
// would send for it; js/touch.js hands those to the same place key presses go. So what you see is
// what you tap, and touch can never do anything the keyboard can't.

const Safe = { t: 0, r: 0, b: 0, l: 0 }; // the notch and the bar at the bottom: nothing is drawn under them
const PhoneBox = { top: null, buttons: null, panel: null, tagsH: 0 };
const PhoneMenu = { open: false }; // the menu button's list (touch only: it has no key of its own)

// What can be tapped this frame. Each: a rectangle, and `keys` (or a function giving them at the
// moment of the tap), or `map` (walk: js/touch.js works out which way), or `act` (the menu only).
const Taps = {
  list: [],
  add(x, y, w, h, t) { this.list.push(Object.assign({ x, y, w, h }, t)); },
  // the one drawn last (on top) wins
  at(px, py) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i];
      if (px >= t.x && px < t.x + t.w && py >= t.y && py < t.y + t.h) return t;
    }
    return null;
  },
};

let safeProbe = null;
function readSafeArea() {
  Safe.t = Safe.r = Safe.b = Safe.l = 0;
  if (typeof getComputedStyle !== 'function' || !document.body || !document.body.appendChild) return;
  if (!safeProbe) {
    safeProbe = document.createElement('div');
    safeProbe.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;'
      + 'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(safeProbe);
  }
  const cs = getComputedStyle(safeProbe);
  Safe.t = parseFloat(cs.paddingTop) || 0;
  Safe.r = parseFloat(cs.paddingRight) || 0;
  Safe.b = parseFloat(cs.paddingBottom) || 0;
  Safe.l = parseFloat(cs.paddingLeft) || 0;
}

// Called by resize() (render.js) when the phone layout is on.
function layoutPhone() {
  readSafeArea();
  const P = RULES.phone, f = P.fingertip;
  const left = Safe.l, w = W - Safe.l - Safe.r, top = Safe.t + 2, bottom = H - Safe.b - 6;
  PhoneBox.top = { x: left, y: top, w, h: 52 };
  PhoneBox.buttons = { x: left + 8, y: bottom - f, w: w - 16, h: f };
  const stripH = 66;
  Object.assign(LogBox, { x: left, y: PhoneBox.buttons.y - stripH - 6, w, h: stripH });
  const mapY = top + PhoneBox.top.h;
  Object.assign(View, { x: left, y: mapY, w, h: LogBox.y - mapY });
  View.S = Math.floor(View.w / P.across);
  Object.assign(Margin, { x: W, y: 0, w: 0, h: H }); // no margin on a phone
  // the pockets, gear, menu, help and log open over the map and the story, leaving the buttons in reach
  PhoneBox.panel = { x: left + 6, y: mapY + 4, w: w - 12, h: LogBox.y + LogBox.h - mapY - 4 };
}

// ---------------------------------------------------------------------------------------
// Little pieces: a paper box, a button, a line of words that fits.

function phoneBox(x, y, w, h, o = {}) {
  Ink.calm(40);
  const [lean, wob] = [Ink.lean, Ink.wobble];
  Ink.lean = 0;
  Ink.wobble = Math.min(wob, 1);
  stroke(rect(x, y, w, h), { closed: true, w: o.w || 1.2, color: o.color || INK, fill: o.fill || PAPER, fillAlpha: o.fillAlpha == null ? 0.97 : o.fillAlpha, noScratch: true });
  if (o.lit) stroke([[x + 4 + h * 0.28, y + h * 0.55], [x + w - 4 - h * 0.28, y + h * 0.5]], { w: h * 0.55, color: '#f2cf4a', alpha: 0.45, noScratch: true, step: 0 });
  [Ink.lean, Ink.wobble] = [lean, wob];
}

// A button: a box with words in it, that sends `keys` when tapped. Never smaller than a fingertip.
function phoneButton(x, y, w, h, label, keys, o = {}) {
  const f = RULES.phone.fingertip;
  w = Math.max(w, f);
  h = Math.max(h, f);
  phoneBox(x, y, w, h, { lit: o.lit, color: o.color, fillAlpha: o.dim ? 0.5 : 0.97 });
  hand(sm(o.size || 16), o.style || '');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = o.dim ? C.dim : o.color || INK;
  ctx.fillText(fitText(label, w - 10), x + w / 2, y + h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  if (keys && !o.dim) Taps.add(x, y, w, h, { keys, name: o.name || label });
  return h;
}

// Shrink the current font until `str` fits in `maxW`.
function fitFont(str, size, maxW, style, face) {
  const set = s => { ctx.font = `${style || ''} ${Math.round(s)}px ${face || FONT_VERSE}`; };
  set(size);
  const w = ctx.measureText(str).width;
  if (w > maxW) set(size * maxW / w);
}

// A page title, letters spaced out, made to fit across the phone.
function fitTitle(title, size) {
  fitFont(title.toUpperCase().split('').join(' '), size, W * 0.9, '', FONT_TITLE);
}

// The small lettering, a little larger on a phone (RULES.phone.smallTextPx), never past 16.
const sm = n => (n < 16 ? Math.min(16, n + RULES.phone.smallTextPx) : n);

// Words that name a key or the margin, said for a finger (TEXT.ui.phone.instead), as they are drawn.
let insteadRules = null;
function phoneWords(str) {
  if (!insteadRules) {
    insteadRules = TEXT.ui.phone.instead.map(([from, to]) => {
      const pattern = from.split('#').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\d+');
      return [new RegExp(pattern, 'g'), to];
    });
  }
  for (const [re, to] of insteadRules) str = str.replace(re, to);
  return str;
}

// Key presses that move a list's choice from `from` to `to` (one arrow press per row).
function stepKeys(from, to, n, wraps) {
  if (to === from) return [];
  if (!wraps) return Array(Math.abs(to - from)).fill(to > from ? 'ArrowDown' : 'ArrowUp');
  return Array(((to - from) % n + n) % n).fill('ArrowDown');
}

// The prompt under a verse page, for a finger. The ones that are buttons on a phone are drawn as
// buttons (drawPhone), so they have no prompt here.
function phonePrompt(str) {
  const k = Object.keys(TEXT.pages).find(key => TEXT.pages[key] === str);
  if (k && TEXT.ui.phone.prompts[k]) return TEXT.ui.phone.prompts[k];
  if (str === TEXT.pages.roomChoose) return TEXT.ui.phone.roomChoose;
  if (str === TEXT.pages.beastBrowse || str === TEXT.ui.bestiary.close || str === TEXT.pages.tomb) return '';
  return str;
}

// ---------------------------------------------------------------------------------------
// Drawing a frame on a phone (draw() in render.js calls this).

function drawPhone(inGame) {
  Taps.list = [];
  if (Phone.sideways) return drawSideways();
  if (G.mode !== 'play') PhoneMenu.open = false;
  const all = (keys, name) => Taps.add(0, 0, W, H, { keys, name });
  const pageMode = ['story', 'floorcard', 'card', 'rhyme', 'dead', 'win', 'choice'].includes(G.mode);
  if (pageMode) all(['Enter'], 'page'); // a tap anywhere does what Enter does; choices go on top
  switch (G.mode) {
    case 'splash': drawSplash(); all(['Enter'], 'splash'); break;
    case 'title': drawTitle(); break;
    case 'play': case 'encounter': drawPlay(); break;
    case 'inventory': drawPlay(); drawPhonePockets(); break;
    case 'gear': drawPlay(); drawPhoneGear(); break;
    case 'help': if (inGame) drawPlay(); drawPhoneHelp(); break;
    case 'log': drawPlay(); drawPhoneLog(); break;
    case 'graveyard': drawPhoneGraveyard(); break;
    case 'bestiary': drawBestiary(); drawPhoneBookButtons(); break;
    default: if (pageMode) drawPage(G.page);
  }
  // a page still unfolding line by line: skip (S), where the page's "tap, to go on" will be; a tap elsewhere is Enter, as before
  if (canSkip()) {
    const f = RULES.phone.fingertip, w = Math.min(W * 0.6, 220), y = H - H * 0.05 - f / 2 - 6;
    phoneBox(W / 2 - w / 2, y, w, f, { color: C.red, w: 0.9, fillAlpha: 0.6 });
    serif(clamp(H * 0.02, 12, 18), 'italic');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(FX.now * 0.003);
    ctx.fillStyle = C.red;
    ctx.fillText(TEXT.ui.phone.skip, W / 2, y + f / 2 + 1);
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
    Taps.add(W / 2 - w / 2, y, w, f, { keys: ['s'], name: 'skip' });
  }
  if (PhoneMenu.open) drawPhoneMenu();
}

// A phone held sideways: please turn it.
function drawSideways() {
  const U = TEXT.ui.phone;
  Ink.calm(60);
  drawCandle(W / 2, H * 0.45, H * 0.14, 16, true, 70);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  serif(clamp(H * 0.07, 18, 30));
  ctx.fillStyle = INK;
  ctx.fillText(U.sideways[0], W / 2, H * 0.66);
  serif(clamp(H * 0.045, 13, 20), 'italic');
  ctx.fillStyle = C.gray;
  ctx.fillText(U.sideways[1], W / 2, H * 0.66 + clamp(H * 0.09, 24, 40));
}

// ---------------------------------------------------------------------------------------
// The play screen's parts around the map: drawPlay() (render.js) draws the map, then this.

function drawPhoneBars(p) {
  const U = TEXT.ui.phone, mode = G.mode;
  // the map: a tap walks (or answers a card, drawn on top). Added first, so everything else wins.
  Taps.list.unshift({ x: View.x, y: View.y, w: View.w, h: View.h, map: true, name: 'map' });
  drawPhoneTags(p);
  drawPhoneTop(p);
  drawPhoneStrip();
  // four buttons, always the same
  const B = PhoneBox.buttons, gap = 8, bw = (B.w - gap * 3) / 4;
  const overPanel = mode === 'inventory' || mode === 'gear';
  const btn = [[U.buttons.hold, ' '], [U.buttons.rhyme, 'r'], [U.buttons.pockets, 'i'], [U.buttons.pickUp, 'g']];
  btn.forEach(([label, k], i) => {
    // Over the pockets or the gear, a button closes them first (Pockets just goes back and forth).
    // Face to face with a horror, holding still and picking up wait for your answer on the card.
    const keys = overPanel && k !== 'i' ? ['Escape', k] : [k];
    const dim = mode === 'encounter' && (k === ' ' || k === 'g');
    phoneButton(B.x + i * (bw + gap), B.y, bw, B.h, label, ['play', 'encounter', 'inventory', 'gear'].includes(mode) ? keys : null,
      { dim, size: 16, name: 'button:' + label, lit: (k === 'i' && mode === 'inventory') });
  });
}

function drawPhoneTop(p) {
  const T = PhoneBox.top, f = RULES.phone.fingertip, L = G.level;
  const x0 = T.x + 10, cy = T.y + T.h / 2;
  Ink.calm(40);
  line(T.x + 6, T.y + T.h - 2, T.x + T.w - 6, T.y + T.h - 1, { w: 1, color: C.red, alpha: 0.45 });
  // the menu button
  const mx = T.x + T.w - f - 6, my = cy - f / 2;
  phoneBox(mx, my, f, f, { lit: PhoneMenu.open });
  for (let i = 0; i < 3; i++) line(mx + 12, my + 11 + i * 6, mx + f - 12, my + 11 + i * 6, { w: 1.4, noScratch: true, step: 0 });
  hand(sm(10));
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gray;
  ctx.fillText(TEXT.ui.phone.menuButton, mx + f / 2, my + f - 6);
  if (G.mode === 'play') Taps.add(mx, my, f, f, { act: () => { PhoneMenu.open = !PhoneMenu.open; }, name: 'menu' });
  // who and where
  ctx.textAlign = 'left';
  hand(17);
  ctx.fillStyle = INK;
  const nameW = Math.min(108, T.w * 0.27);
  ctx.fillText(fitText(phrase('somebody', { n: G.runNo }), nameW), x0, T.y + 21);
  hand(sm(12), 'italic');
  ctx.fillStyle = L.floor.wall;
  ctx.fillText(fitText(phrase('floorOf', { n: G.depth, of: FLOORS.length }), nameW), x0, T.y + 39);
  // then health, the candle, rhymes and coins share what's left
  const left = x0 + nameW + 8, right = mx - 8, notesW = 13 * p.maxVerve, coinW = 56, candleW = 18;
  const healthW = Math.max(46, right - left - candleW - notesW - coinW - 3 * 10);
  const low = p.hp <= p.maxHp / 3, frac = clamp(p.hp / p.maxHp, 0, 1);
  if (frac > 0) stroke(rect(left, T.y + 12, healthW * frac, 11), { closed: true, w: 0, fill: C.red, fillAlpha: low ? 0.85 : 0.55, step: 0 });
  stroke(rect(left, T.y + 12, healthW, 11), { closed: true, w: 1 });
  hand(sm(14), 'bold');
  ctx.fillStyle = low ? C.red : INK;
  ctx.fillText(`${Math.max(0, p.hp)}/${p.maxHp}`, left, T.y + 41);
  // the candle you have, inside a faint outline of the fullest candle there can be
  const cx = left + healthW + 10 + candleW / 2, base = T.y + T.h - 7, fullH = T.h - 20;
  const waxH = Math.max(2, fullH * clamp(p.wick / RULES.candle.max, 0, 1));
  Ink.calm(30);
  stroke(rect(cx - 4.5, base - fullH, 9, fullH), { closed: true, w: 0.7, alpha: 0.32, noScratch: true, step: 0 });
  drawCandle(cx, base, waxH, 9, p.wick > 0, 34);
  // rhymes left, as notes
  const nx = left + healthW + 10 + candleW + 10;
  Ink.calm(20);
  for (let i = 0; i < p.maxVerve; i++) drawNote(nx + 4 + i * 13, cy + 8, 11, i < p.verve);
  // coins
  const gx = nx + notesW + 10;
  Ink.calm(20);
  drawItem({ kind: 'gold' }, gx + 8, cy, 18);
  hand(sm(15), 'bold');
  ctx.fillStyle = INK;
  ctx.fillText(fitText(String(p.gold), coinW - 18), gx + 19, cy + 6);
}

// Your conditions, along the top of the map, only when you have one.
function drawPhoneTags(p) {
  const tags = conditionTags(p);
  PhoneBox.tagsH = 0;
  if (!tags.length) return;
  let tx = View.x + 6, ty = View.y + 6;
  const ts = sm(13), th = ts + 9;
  hand(ts, 'italic');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const [, label, col] of tags) {
    const tw = Math.min(ctx.measureText(label).width + 16, View.w - 12);
    if (tx + tw > View.x + View.w - 6) { tx = View.x + 6; ty += th + 4; }
    Ink.calm(40);
    stroke(rect(tx, ty, tw, th), { closed: true, w: 0.9, color: col, fill: PAPER, fillAlpha: 0.92, noScratch: true });
    hand(ts, 'italic');
    ctx.fillStyle = col;
    ctx.fillText(fitText(label, tw - 12), tx + 8, ty + th * 0.7);
    tx += tw + 6;
  }
  PhoneBox.tagsH = ty + th + 4 - View.y;
}

// The story so far: its last two lines, the newest highlighted. Tap it for all of it.
function drawPhoneStrip() {
  const b = LogBox, px = b.x + 8, py = b.y + 8, pw = b.w - 16, ph = b.h - 10;
  Ink.calm(40);
  stroke(rect(px, py, pw, ph), { closed: true, w: 1.1, fill: '#f7f0dd', fillAlpha: 0.95 });
  const title = TEXT.ui.storySoFar.split('').join(' ');
  ctx.font = `${sm(11)}px ${FONT_HAND}`;
  const ttw = ctx.measureText(title).width;
  ctx.fillStyle = '#f7f0dd';
  ctx.fillRect(b.x + b.w / 2 - ttw / 2 - 8, py - 6, ttw + 16, 12);
  ctx.fillStyle = C.red;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, b.x + b.w / 2, py + 4);
  const size = sm(14), lh = size * 1.3, maxW = pw - 20, cx = px + pw / 2;
  const undone = dreadTier() === 3, bottomFloor = G.depth === FLOORS.length;
  const lines = [];
  for (let i = G.log.length - 1; i >= 0 && lines.length < 2; i--) {
    const m = G.log[i], fresh = i >= G.logMark;
    let t = phoneWords(m.text);
    if (!fresh && undone) t = glitch(t, i);
    if (!fresh && bottomFloor) t = nibble(t, i);
    serif(size, fresh ? '' : 'italic');
    const wrapped = wrapPx(t, maxW);
    for (let k = wrapped.length - 1; k >= 0 && lines.length < 2; k--) lines.unshift({ t: wrapped[k], col: m.color, fresh });
  }
  lines.forEach((l, i) => {
    const y = py + 7 + (i + 1) * lh + (2 - lines.length) * lh;
    serif(size, l.fresh ? '' : 'italic');
    if (l.fresh) {
      const tw = ctx.measureText(l.t).width;
      stroke([[cx - tw / 2 - 6, y - size * 0.3], [cx + tw / 2 + 6, y - size * 0.36]], { w: size * 0.62, color: '#f2cf4a', alpha: 0.55, noScratch: true, step: 0 });
      ctx.fillStyle = l.col;
    } else ctx.fillStyle = shade(l.col, 0.6);
    ctx.fillText(l.t, cx, y);
  });
  if (G.mode === 'play') Taps.add(b.x, b.y, b.w, b.h, { keys: ['l'], name: 'story' });
}

// A sound written outside the phone's view (tick… tock…, squeak…, ahem, whispers): shown at the
// edge of the map on the side it came from, with a little arrow pointing that way. True if it was.
function pinnedWord(w, a, S) {
  const wx = sx(w.x) + S / 2, wy = sy(w.y) + S / 2;
  const inside = wx >= View.x && wx <= View.x + View.w && wy >= View.y && wy <= View.y + View.h;
  if (inside) return false;
  serif(w.big ? 17 : sm(14), 'italic');
  const tw = ctx.measureText(w.text).width, bw = tw + 22, bh = 22;
  const top = View.y + 4 + PhoneBox.tagsH, bottom = View.y + View.h - bh - 4;
  const x = clamp(wx - bw / 2, View.x + 4, View.x + View.w - bw - 4), y = clamp(wy - bh / 2, top, Math.max(top, bottom));
  const dx = wx < View.x ? -1 : wx > View.x + View.w ? 1 : 0, dy = wy < View.y ? -1 : wy > View.y + View.h ? 1 : 0;
  Ink.alpha = a;
  stroke(rect(x, y, bw, bh), { closed: true, w: 0.9, color: C.gray, fill: PAPER, fillAlpha: 0.9, noScratch: true });
  Ink.alpha = 1;
  ctx.globalAlpha = a;
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(w.text, x + bw / 2 + dx * 4, y + bh / 2 + 5);
  // the arrow, on the side the sound came from
  const ax = dx ? (dx < 0 ? x + 7 : x + bw - 7) : x + bw / 2, ay = dy ? (dy < 0 ? y + 5 : y + bh - 5) : y + bh / 2;
  if (dx || dy) {
    const len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    stroke([[ax - uy * 3.5 - ux * 2, ay + ux * 3.5 - uy * 2], [ax + ux * 3, ay + uy * 3], [ax + uy * 3.5 - ux * 2, ay - ux * 3.5 - uy * 2]], { w: 1.1, alpha: a, noScratch: true, step: 0 });
  }
  ctx.globalAlpha = 1;
  return true;
}

// Where a tap on the map goes: a step up, down, left or right (the map cut into four triangles
// meeting at you), or, on your own square, down the stairs if you're on them (else nothing).
function mapTapKey(x, y) {
  const p = G.player, S = View.S, [dx0, dy0] = p.drawAt || [p.x, p.y];
  const px = sx(dx0), py = sy(dy0);
  if (x >= px && x < px + S && y >= py && y < py + S) return G.level.tiles[idx(p.x, p.y)] === T.STAIRS ? '>' : null;
  const dx = x - (px + S / 2), dy = y - (py + S / 2);
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'ArrowLeft' : 'ArrowRight';
  return dy < 0 ? 'ArrowUp' : 'ArrowDown';
}

// ---------------------------------------------------------------------------------------
// The face-off card, for a finger: its answers are buttons.

function drawPhoneFaceOff(p, S, m, enc, th) {
  const K = TEXT.ui.card, U = TEXT.ui.phone.card, f = RULES.phone.fingertip;
  const [lean, wob] = [Ink.lean, Ink.wobble];
  Ink.lean = 0;
  Ink.wobble = Math.min(wob, 1.2);
  const title = enc ? fill(K.face, { m: aM(m) })
    : th.result === 'hit' ? fill(K.hit, { Them: cap(theM(m)), verb: th.verb, dmg: th.dmg })
    : th.result === 'steal' ? fill(K.steal, { Them: cap(theM(m)) }) : fill(K.miss, { Them: cap(theM(m)) });
  const w = Math.min(View.w - 16, 360);
  hand(16);
  const titleLines = wrapPx(title, w - 110).slice(0, 2);
  const note = enc ? (enc.engaged ? U.fighting : U.sleeping) : null;
  const h = 14 + titleLines.length * 20 + 8 + f * 2 + 6 + (note ? 20 : 4) + 6;
  const [dx, dy] = p.drawAt || [p.x, p.y];
  const pcx = sx(dx) + S / 2, top = sy(dy), pcy = top + S * 0.45;
  const [x0, y0, side] = placeFaceOff(m, w, h, pcx, top, S);
  if (side === 'below' || side === 'above') {
    const tipY = side === 'below' ? y0 : y0 + h, tipTo = side === 'below' ? top + S * 0.95 : top - S * 0.75, bx = clamp(pcx, x0 + 14, x0 + w - 14);
    stroke([[bx - 8, tipY], [pcx, tipTo], [bx + 8, tipY]], { w: 1.2, fill: PAPER, fillAlpha: 1, noScratch: true, step: 0 });
  } else {
    const tipX = side === 'right' ? x0 : x0 + w, tipTo = side === 'right' ? pcx + S * 0.45 : pcx - S * 0.45, by = clamp(pcy, y0 + 12, y0 + h - 12);
    stroke([[tipX, by - 8], [tipTo, pcy], [tipX, by + 8]], { w: 1.2, fill: PAPER, fillAlpha: 1, noScratch: true, step: 0 });
  }
  stroke(rect(x0, y0, w, h), { closed: true, w: enc ? 1.6 : 1.2, color: enc ? INK : C.red, fill: PAPER, fillAlpha: 0.97, noScratch: true });
  Taps.add(x0, y0, w, h, { keys: [], name: 'card' }); // a tap on the card itself, between its buttons, does nothing
  Ink.calm(20);
  drawMonster(m, x0 + 22, y0 + 36, m.type === 'nibbler' ? 10 : 22);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  hand(16);
  ctx.fillStyle = enc ? INK : C.red;
  titleLines.forEach((l, i) => ctx.fillText(l, x0 + 44, y0 + 26 + i * 20));
  if (!m.d.invulnerable) {
    for (let i = 0; i < 5; i++) {
      const filled = i < Math.ceil((m.hp / m.maxHp) * 5);
      ellipse(x0 + w - 62 + i * 11, y0 + 20, 3.5, 3.5, { w: 0.8, fill: C.red, fillAlpha: filled ? 0.8 : 0, noScratch: true }, 0);
    }
  }
  const by = y0 + 14 + titleLines.length * 20 + 8, bw = (w - 30) / 2;
  const opts = [[K.attack, ['a']], [p.verve > 0 ? K.rhyme : K.noRhymes, ['r']], [K.use, ['u']]];
  if (enc) opts.push([enc.engaged ? K.backAway : K.leave, ['Escape']]);
  opts.forEach(([label, keys], i) => phoneButton(x0 + 10 + (i % 2) * (bw + 10), by + Math.floor(i / 2) * (f + 6), bw, f, label, keys, { size: 15, name: 'card:' + keys[0] }));
  if (!enc) {
    hand(sm(14), 'italic');
    ctx.textAlign = 'center';
    ctx.fillStyle = C.gray;
    ctx.fillText(U.walkAway, x0 + 10 + bw * 1.5 + 10, by + f + 6 + f / 2 + 5);
  }
  if (note) {
    hand(sm(12), 'italic');
    ctx.textAlign = 'left';
    ctx.fillStyle = C.gray;
    ctx.fillText(fitText(note, w - 20), x0 + 12, y0 + h - 10);
  }
  [Ink.lean, Ink.wobble] = [lean, wob];
}

// ---------------------------------------------------------------------------------------
// Panels over the map: pockets, gear, the menu.

function panelFrame(title, color) {
  const P = PhoneBox.panel;
  phoneBox(P.x, P.y, P.w, P.h, { fillAlpha: 0.98 });
  Taps.add(P.x, P.y, P.w, P.h, { keys: [], name: 'panel' }); // the map under it can't be tapped
  hand(18);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color || C.red;
  ctx.fillText(fitText(title.trim(), P.w - 20), P.x + P.w / 2, P.y + 26);
  return P;
}

// One row of a list: highlighted if chosen, a drawing on the left, words, and a note on the right.
function phoneRow(x, y, w, h, o) {
  if (o.sel) { // the highlighter stays inside its row
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    stroke([[x + 4 + h * 0.35, y + h * 0.55], [x + w - 4 - h * 0.35, y + h * 0.5]], { w: h * 0.7, color: '#f2cf4a', alpha: 0.4, noScratch: true, step: 0 });
    ctx.restore();
  }
  line(x + 4, y + h, x + w - 4, y + h, { w: 0.5, color: C.faint, noScratch: true, step: 0 });
  let tx = x + 10;
  if (o.item) {
    Ink.calm(h);
    Ink.alpha = o.faint ? 0.3 : 1;
    drawItem(o.item, x + 10 + h * 0.4, y + h / 2, h * 0.75);
    Ink.alpha = 1;
    tx = x + 14 + h * 0.8;
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let noteW = 0;
  if (o.note) {
    hand(sm(13), 'italic');
    noteW = ctx.measureText(o.note).width + 8;
    ctx.textAlign = 'right';
    ctx.fillStyle = o.noteColor || C.gray;
    ctx.fillText(o.note, x + w - 8, y + h / 2 + 5);
    ctx.textAlign = 'left';
  }
  if (o.label) {
    hand(sm(12), 'italic');
    ctx.fillStyle = o.sel ? C.red : C.gray;
    ctx.fillText(o.label, tx, y + 15);
  }
  hand(sm(o.size || 17), o.style || '');
  ctx.fillStyle = o.color || INK;
  ctx.fillText(fitText(o.text, x + w - tx - noteW - 6), tx, y + (o.label ? h - 9 : h / 2 + 6));
  if (o.keys) Taps.add(x, y, w, h, { keys: o.keys, name: o.name });
}

function drawPhonePockets() {
  const p = G.player, target = G.useTarget, U = TEXT.ui.pockets, B = TEXT.ui.phone.pockets, f = RULES.phone.fingertip;
  const P = panelFrame(target ? fill(U.useOn, { m: target.d.name }) : fill(U.title, { n: p.inv.length, of: RULES.player.pockets }));
  const rows = pocketRows(p), n = rows.length, sel = G.invSel;
  const it = rows[sel] && rows[sel].it;
  const btnY = P.y + P.h - f - 10;
  let y = P.y + 38;
  // what's below the rows: the chosen thing's description, then your numbers
  hand(sm(14), 'italic');
  const desc = it ? wrapPx(phoneWords(itemDesc(it)), P.w - 30) : [];
  const stats = [fill(U.level, { level: p.level, xp: p.xp, next: p.xpNext }), fill(U.numbers, { atk: playerAtk(), def: playerDef(), gold: p.gold })];
  const below = Math.min(3, desc.length) * 20 + stats.length * 20 + 16;
  const rowH = clamp((btnY - y - below) / Math.max(1, n), f, 50);
  if (!n) {
    hand(16, 'italic');
    ctx.textAlign = 'left';
    ctx.fillStyle = C.gray;
    ctx.fillText(U.empty, P.x + 16, y + 24);
  }
  rows.forEach(({ it: thing, idx: allOf }, i) => {
    const name = cap(allOf.length > 1 ? fill(U.count, { name: itemName(thing), n: allOf.length }) : itemName(thing));
    const note = target && thing.kind === 'potion' ? B.throw : gearSlot(thing) ? TEXT.items.slots[gearSlot(thing)] : '';
    phoneRow(P.x + 6, y + i * rowH, P.w - 12, rowH, { sel: i === sel, item: thing, text: name, note, noteColor: target && thing.kind === 'potion' ? C.red : C.gray,
      keys: () => stepKeys(G.invSel, i, n, true), name: 'pocket:' + i });
  });
  y += Math.max(1, n) * rowH + 10;
  hand(sm(14), 'italic');
  ctx.textAlign = 'left';
  ctx.fillStyle = C.teal;
  for (const l of desc.slice(0, 3)) { if (y + 20 < btnY - stats.length * 20) { ctx.fillText(l, P.x + 14, y + 13); y += 20; } }
  ctx.fillStyle = C.gray;
  for (const s of stats) { if (y + 20 < btnY) { ctx.fillText(fitText(s, P.w - 28), P.x + 14, y + 15); y += 20; } }
  // what you can do with the row you've picked
  const btns = [];
  if (it) btns.push([gearSlot(it) ? B.wear : B.use, ['Enter']]);
  if (it && target && p.inv[pocketAt(sel)] && p.inv[pocketAt(sel)].kind === 'potion') btns.push([B.throw, ['t']]);
  if (it) btns.push([B.drop, ['d']]);
  btns.push([B.close, ['Escape']]);
  const bw = (P.w - 20 - (btns.length - 1) * 8) / btns.length;
  btns.forEach(([label, keys], i) => phoneButton(P.x + 10 + i * (bw + 8), btnY, bw, f, label, keys, { name: 'pockets:' + keys[0] }));
}

function drawPhoneGear() {
  const p = G.player, U = TEXT.ui.gear, B = TEXT.ui.phone.gear, f = RULES.phone.fingertip;
  const P = panelFrame(U.title);
  const btnY = P.y + P.h - f - 10;
  let y = P.y + 36;
  const slotH = 50;
  SLOTS.forEach(([slot, label], i) => {
    const it = p.gear[slot];
    phoneRow(P.x + 6, y + i * slotH, P.w - 12, slotH, { sel: i === G.gearSel, item: it || BLANK_GEAR[slot], faint: !it, label,
      text: it ? cap(itemName(it)) : TEXT.items.empty[slot], color: it ? INK : C.gray, style: it ? '' : 'italic',
      note: it ? fill(slot === 'hand' ? U.attack : U.defense, { n: gearBonus(it) }) : '',
      keys: () => stepKeys(G.gearSel, i, SLOTS.length, true), name: 'slot:' + slot });
  });
  y += SLOTS.length * slotH + 10;
  const [slot, label] = SLOTS[G.gearSel], fits = gearCandidates(slot);
  hand(sm(14), 'italic');
  ctx.textAlign = 'left';
  ctx.fillStyle = C.gray;
  ctx.fillText(fitText(fill(U.from, { slot: label.toLowerCase() }) + (fits.length ? '  ' + B.wearOne : ''), P.w - 24), P.x + 12, y + 13);
  y += 20;
  if (!fits.length) { ctx.fillStyle = C.dim; ctx.fillText(U.none, P.x + 20, y + 12); y += 20; }
  const room = Math.max(1, Math.floor((btnY - 48 - y) / f));
  fits.slice(0, Math.min(7, room)).forEach((i, k) => {
    const it = p.inv[i], diff = gearBonus(it) - gearBonus(p.gear[slot]);
    const verdict = diff > 0 ? fill(U.better, { n: diff }) : diff < 0 ? fill(U.worse, { n: diff }) : U.same;
    phoneRow(P.x + 6, y, P.w - 12, f, { item: it, text: cap(itemName(it)), note: verdict, noteColor: diff > 0 ? C.green : diff < 0 ? C.red : C.dim,
      keys: [String(k + 1)], name: 'wear:' + k });
    y += f;
  });
  hand(sm(14));
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.fillText(fill(U.numbers, { atk: playerAtk(), def: playerDef() }), P.x + 12, btnY - 26);
  hand(sm(12), 'italic');
  ctx.fillStyle = C.dim;
  ctx.fillText(fitText(U.turn, P.w - 24), P.x + 12, btnY - 8);
  const btns = [];
  if (p.gear[slot]) btns.push([B.takeOff, ['t']]);
  btns.push([B.pockets, ['i']], [B.close, ['Escape']]);
  const bw = (P.w - 20 - (btns.length - 1) * 8) / btns.length;
  btns.forEach(([lab, keys], i) => phoneButton(P.x + 10 + i * (bw + 8), btnY, bw, f, lab, keys, { name: 'gear:' + keys[0] }));
}

// The menu button's list. Each line sends the key the keyboard would (E, L, B, ?, M, V, F, Q).
function drawPhoneMenu() {
  const M = TEXT.ui.phone.menu, f = RULES.phone.fingertip;
  Taps.add(0, 0, W, H, { act: () => { PhoneMenu.open = false; }, name: 'menu:outside' });
  const P = PhoneBox.panel;
  phoneBox(P.x, P.y, P.w, P.h, { fillAlpha: 0.98 });
  Taps.add(P.x, P.y, P.w, P.h, { keys: [], name: 'panel' });
  const st = on => (on ? M.on : M.off);
  const closeAfter = k => ({ act: () => { PhoneMenu.open = false; pressKey(k, false); } });
  const items = [
    [M.gear, closeAfter('e'), 'e'], [M.log, closeAfter('l'), 'l'], [M.bestiary, closeAfter('b'), 'b'], [M.help, closeAfter('?'), '?'],
    [fill(M.sound, { state: st(!Sound.muted) }), { keys: ['m'] }, 'm'],
    [fill(M.voice, { state: st(Voice.on) }), { keys: ['v'] }, 'v'],
    [fill(M.calm, { state: st(FX.reduced) }), { keys: ['f'] }, 'f'],
    [G.quitArmed ? M.giveUpSure : M.giveUp, { keys: ['q'] }, 'q'],
    [M.close, { act: () => { PhoneMenu.open = false; } }, 'close'],
  ];
  const rowH = clamp((P.h - 20) / items.length, f, 56);
  items.forEach(([label, t, k], i) => {
    const y = P.y + 10 + i * rowH;
    phoneBox(P.x + 12, y + 3, P.w - 24, rowH - 6, { color: k === 'q' ? C.red : INK, lit: k === 'q' && G.quitArmed });
    hand(17, k === 'close' ? 'italic' : '');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = k === 'q' ? C.red : k === 'close' ? C.gray : INK;
    ctx.fillText(fitText(label, P.w - 40), P.x + P.w / 2, y + rowH / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    Taps.add(P.x + 12, y + 3, P.w - 24, rowH - 6, Object.assign({ name: 'menu:' + k }, t));
  });
}

// ---------------------------------------------------------------------------------------
// Whole pages: the title, help, the log, the graveyard, the bestiary's buttons.

function drawPhoneTitle() {
  const U = TEXT.ui.title, PU = TEXT.ui.phone, f = RULES.phone.fingertip;
  Ink.setMood(0.15, 60);
  Ink.leanY = H * 0.3;
  const cx = W / 2, S = Math.min(H * 0.2, W * 0.42), by = Safe.t + S * 0.42;
  // somebody who went down before you
  ellipse(cx, by + S * 0.13, S * 0.3, S * 0.22, { w: 1.6, fill: PAPER, fillAlpha: 1 }, 0.05);
  for (const ex of [-0.11, 0.11]) {
    line(cx + (ex - 0.04) * S, by + 0.08 * S, cx + (ex + 0.04) * S, by + 0.16 * S, { w: 1.4 });
    line(cx + (ex + 0.04) * S, by + 0.08 * S, cx + (ex - 0.04) * S, by + 0.16 * S, { w: 1.4 });
  }
  zigzag(cx - 0.08 * S, by + 0.24 * S, cx + 0.08 * S, by + 0.24 * S, 3, 0.02 * S, { w: 1.2 });
  stroke([[cx - S * 0.02, by - S * 0.08], [cx + S * 0.03, by - S * 0.24], [cx + S * 0.17, by - S * 0.29], [cx + S * 0.24, by - S * 0.2], [cx + S * 0.14, by - S * 0.15]], { w: 1.6 });
  // the title, on two lines, in two inks
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const a = U.before.trim(), b = U.rot;
  let ts = clamp(H * 0.06, 28, 56);
  ctx.font = `italic ${Math.round(ts)}px ${FONT_TITLE}`;
  const widest = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
  if (widest > W * 0.88) ts *= W * 0.88 / widest;
  ctx.font = `italic ${Math.round(ts)}px ${FONT_TITLE}`;
  let y = by + S * 0.42 + ts;
  ctx.fillStyle = INK;
  ctx.fillText(a, cx, y);
  y += ts * 1.05;
  ctx.fillStyle = C.red;
  ctx.fillText(b, cx, y);
  y += ts * 0.6;
  serif(clamp(H * 0.022, 14, 19), 'italic');
  ctx.fillStyle = C.gray;
  ctx.fillText(fitText(U.subtitle, W * 0.92), cx, y);
  y += clamp(H * 0.022, 14, 19) * 1.3;
  serif(sm(14), 'italic');
  ctx.fillStyle = C.dim;
  for (const l of wrapPx(tagline, W * 0.86).slice(0, 2)) { ctx.fillText(l, cx, y); y += 18; }
  // the bottom: who has been lost so far, and the silent switch
  const lost = Store.load('graveyard', []).filter(g => !g.won);
  const onOne = lost.filter(g => g.depth === 1).length;
  let note = lost.length ? fill(U.lost, { n: lost.length }) : U.noneLost;
  if (onOne >= 3) note += fill(U.floorOne, { n: onOne });
  else if (lost.length) note += fill(U.recent, { run: lost[lost.length - 1].run, killer: lost[lost.length - 1].killer });
  serif(sm(13), 'italic');
  const noteLines = wrapPx(note, W * 0.88).slice(0, 2);
  let ny = H - Safe.b - 12;
  ctx.fillStyle = C.dim;
  ctx.fillText(PU.silent, cx, ny);
  ny -= 20;
  ctx.fillStyle = C.gray;
  for (let i = noteLines.length - 1; i >= 0; i--) { ctx.fillText(noteLines[i], cx, ny); ny -= 17; }
  // the lines you can tap: carry on (with a run saved), begin (again), the graveyard, the bestiary, help
  let menu = U.menu;
  if (savedRun) {
    const who = phrase('somebody', { n: savedRun.runNo });
    menu = [['C', fill(U.carryOn, { who, n: savedRun.depth })], ['Enter', fill(U.beginAgain, { who })]].concat(menu.slice(1));
  }
  const gap = 8, bh = f + 2, bw = Math.min(W * 0.88, 380);
  const room = ny - 8 - y;
  const step = Math.min(bh + gap, room / menu.length);
  let my = y + Math.max(4, (room - step * menu.length) / 2);
  menu.forEach(([k, label], i) => {
    phoneButton(cx - bw / 2, my, bw, Math.max(f, step - gap), label, [k], { size: 17, name: 'title:' + k, color: i === 0 && savedRun ? C.red : INK });
    my += step;
  });
}

// The end of the tombstone page: the stats, then three lines to tap (again, graveyard, title).
function phoneTombEnd(pg, base) {
  const T = TEXT.ui.phone.tomb, f = RULES.phone.fingertip;
  Taps.list = Taps.list.filter(t => t.name !== 'page'); // now only the three lines do anything
  let y = base + 26;
  for (const l of wrapPx(pg.stats, W * 0.9)) { ctx.fillText(l, W / 2, y); y += 18; }
  const bw = Math.min(W * 0.8, 340), x = W / 2 - bw / 2;
  y += 8;
  for (const [label, k] of [[T.again, 'Enter'], [T.graveyard, 'g'], [T.title, 't']]) {
    phoneButton(x, y, bw, f, label, [k], { size: 17, name: 'tomb:' + k });
    y += f + 8;
  }
}

// Which rhyme: three big boxes, and a way to change your mind.
function drawPhoneRhymeKinds() {
  const p = G.player, K = TEXT.rhymeKinds, last = p.lastRhymeKind || 'shove', PU = TEXT.ui.phone, f = RULES.phone.fingertip;
  Taps.list = Taps.list.filter(t => t.name !== 'page'); // here a stray tap must not pick the last kind
  serif(clamp(H * 0.026, 14, 24), 'italic');
  ctx.fillStyle = C.red;
  ctx.fillText(TEXT.pages.recite, W / 2, H * 0.12);
  serif(clamp(H * 0.045, 24, 40));
  ctx.fillStyle = INK;
  ctx.fillText(TEXT.pages.whichRhyme, W / 2, H * 0.21);
  if (p.hoarse) {
    serif(15, 'italic');
    ctx.fillStyle = C.pink;
    ctx.fillText(TEXT.pages.hoarse, W / 2, H * 0.25);
  }
  const bw = Math.min(W * 0.86, 380), x = W / 2 - bw / 2, bh = Math.max(f, 72);
  let y = H * 0.3;
  RHYME_KINDS.forEach((kind, i) => {
    const mine = kind === last;
    phoneBox(x, y, bw, bh, { color: mine ? C.purple : INK, w: mine ? 1.8 : 1.2 });
    serif(22, mine ? 'bold italic' : 'italic');
    ctx.textAlign = 'center';
    ctx.fillStyle = mine ? C.purple : INK;
    ctx.fillText(K[kind].name, W / 2, y + bh * 0.45);
    serif(sm(14), 'italic');
    ctx.fillStyle = C.gray;
    ctx.fillText(fitText(K[kind].desc, bw - 16), W / 2, y + bh * 0.78);
    Taps.add(x, y, bw, bh, { keys: [String(i + 1)], name: 'kind:' + kind });
    y += bh + 12;
  });
  phoneButton(x + bw * 0.2, y + 6, bw * 0.6, f, PU.whichNever, ['Escape'], { size: 17, style: 'italic', name: 'kind:never' });
  serif(sm(13), 'italic');
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gray;
  ctx.fillText(PU.whichLast, W / 2, y + f + 30);
}

// The rhyme words: four big boxes, two by two, big enough to read with letters blotted out.
function drawPhoneRhymeWords(r) {
  const f = RULES.phone.fingertip, tier = dreadTier();
  Taps.list = Taps.list.filter(t => t.name !== 'page'); // a stray tap must not answer for you
  const words = r.shown || r.options; // a hoarse voice smudges them
  const opt = i => (tier >= 2 && Math.random() < 0.04 * tier ? glitch(words[i], FX.now + i) : words[i]);
  const gap = 12, bw = (Math.min(W, 420) - 32 - gap) / 2, bh = Math.max(f, 64), x0 = W / 2 - bw - gap / 2, y0 = H * 0.52;
  for (let i = 0; i < 4; i++) {
    const x = x0 + (i % 2) * (bw + gap), y = y0 + Math.floor(i / 2) * (bh + gap);
    phoneBox(x, y, bw, bh, { w: 1.4 });
    fitFont(opt(i), 26, bw - 14, 'italic');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = INK;
    ctx.fillText(opt(i), x + bw / 2, y + bh / 2);
    ctx.textBaseline = 'alphabetic';
    Taps.add(x, y, bw, bh, { keys: [String(i + 1)], name: 'word:' + i });
  }
  // the fuse, burning down from the right, with a spark
  const left = clamp(1 - (FX.now - r.fuseT0) / r.ms, 0, 1);
  const fx0 = W * 0.12, fx1 = W * 0.12 + W * 0.76 * left, fy = y0 + 2 * bh + gap + 34;
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
  serif(sm(14), 'italic');
  ctx.fillStyle = C.gray;
  ctx.fillText(TEXT.ui.phone.pick, W / 2, fy + 34);
}

// The odd rooms' three choices, as boxes. A tap chooses that one and presses Enter, so the
// half-second after the verse, when Enter can't pick, holds for taps too.
function drawPhoneChoices(pg, y) {
  const f = RULES.phone.fingertip, n = pg.choices.length;
  Taps.list = Taps.list.filter(t => t.name !== 'page'); // between the boxes, a tap does nothing
  const bw = Math.min(W * 0.9, 400), x = W / 2 - bw / 2;
  const promptY = H - H * 0.05 - Safe.b;
  const bh = Math.max(f, Math.min(54, (promptY - 24 - y) / n - 8));
  pg.choices.forEach((c, i) => {
    const by = y + i * (bh + 8), sel = i === pg.sel;
    phoneBox(x, by, bw, bh, { lit: sel, w: sel ? 1.6 : 1.1 });
    fitFont(c, 18, bw - 20, sel ? '' : 'italic');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = sel ? INK : C.gray;
    ctx.fillText(c, W / 2, by + bh / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    Taps.add(x, by, bw, bh, { keys: () => stepKeys(G.page.sel, i, n, true).concat('Enter'), name: 'choice:' + i });
  });
  pagePrompt(TEXT.pages.roomChoose);
}

function drawPhoneBookButtons() {
  const B = TEXT.ui.phone.book, f = RULES.phone.fingertip, gap = 8;
  const y = H - Safe.b - f - 12, w = (Math.min(W, 420) - 24 - gap * 2) / 3, x0 = W / 2 - (w * 3 + gap * 2) / 2;
  const seen = bestiarySeen().length;
  if (seen) phoneButton(x0, y, w, f, B.back, ['ArrowLeft'], { name: 'book:back', dim: G.bestSel <= 0 });
  phoneButton(x0 + w + gap, y, w, f, B.close, ['Escape'], { name: 'book:close' });
  if (seen) phoneButton(x0 + (w + gap) * 2, y, w, f, B.next, ['ArrowRight'], { name: 'book:next', dim: G.bestSel >= seen - 1 });
}

// A full-page card with a title and a close line; any tap closes it (any key does).
function phoneSheet(title) {
  const x = Safe.l + 8, y = Safe.t + 8, w = W - Safe.l - Safe.r - 16, h = H - Safe.t - Safe.b - 16;
  phoneBox(x, y, w, h, { fillAlpha: 0.99 });
  hand(19);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.red;
  ctx.fillText(fitText(title.trim(), w - 20), W / 2, y + 30);
  return { x, y, w, h };
}

function drawPhoneHelp() {
  const S = phoneSheet(TEXT.ui.help.title), PU = TEXT.ui.phone;
  Taps.add(0, 0, W, H, { keys: ['Escape'], name: 'close' });
  const x = S.x + 14, w = S.w - 28, bottom = S.y + S.h - 34;
  // the largest lettering that fits
  const lay = (size, draw) => {
    let y = S.y + 52;
    const lh = size * 1.25;
    hand(size);
    const labelW = Math.min(w * 0.38, Math.max(...PU.help.map(([k]) => ctx.measureText(k).width)) + 8);
    for (const [k, desc] of PU.help) {
      const lines = wrapPx(desc, w - labelW - 6);
      if (draw) {
        ctx.textAlign = 'left';
        ctx.fillStyle = C.red;
        ctx.fillText(k, x, y);
        ctx.fillStyle = INK;
        lines.forEach((l, i) => ctx.fillText(l, x + labelW, y + i * lh));
      }
      y += lines.length * lh + size * 0.3;
    }
    y += size * 0.5;
    if (draw) { ctx.fillStyle = C.gray; ctx.fillText(TEXT.ui.help.pictures, x, y); }
    y += lh * 0.9;
    const half = Math.ceil(TEXT.legend.length / 2), colW = w / 2, icon = size * 1.15;
    TEXT.legend.forEach(([ch, , desc], i) => {
      const cx = x + (i < half ? 0 : colW), cy = y + (i % half) * icon * 1.05;
      if (!draw) return;
      Ink.calm(icon);
      legendIcon(ch, cx + icon * 0.4, cy - size * 0.35, icon * 0.8);
      hand(Math.max(size * 0.8, sm(12)));
      ctx.textAlign = 'left';
      ctx.fillStyle = INK;
      ctx.fillText(fitText(desc, colW - icon - 6), cx + icon, cy);
      hand(size);
    });
    y += half * icon * 1.05 + size * 0.3;
    const after = wrapPx(TEXT.ui.help.after.join(' '), w);
    if (draw) { ctx.fillStyle = C.gray; after.forEach((l, i) => ctx.fillText(l, x, y + i * lh)); }
    return y + after.length * lh;
  };
  let size = 16;
  while (size > sm(12) && lay(size, false) > bottom) size -= 0.5;
  lay(size, true);
  hand(sm(14), 'italic');
  ctx.textAlign = 'center';
  ctx.fillStyle = C.dim;
  ctx.fillText(PU.close, W / 2, S.y + S.h - 14);
}

function drawPhoneLog() {
  const S = phoneSheet(TEXT.ui.logTitle);
  Taps.add(0, 0, W, H, { keys: ['Escape'], name: 'close' });
  const size = sm(15), lh = size * 1.3, top = S.y + 50, bottom = S.y + S.h - 40;
  const lines = [];
  serif(size);
  for (let i = G.log.length - 1; i >= 0 && lines.length * lh < bottom - top; i--) {
    const wrapped = wrapPx(phoneWords(G.log[i].text), S.w - 28);
    for (let k = wrapped.length - 1; k >= 0 && lines.length * lh < bottom - top; k--) lines.unshift([wrapped[k], G.log[i].color]);
  }
  ctx.textAlign = 'left';
  lines.forEach(([l, col], k) => { ctx.fillStyle = col; ctx.fillText(l, S.x + 14, top + k * lh + size); });
  hand(sm(14), 'italic');
  ctx.textAlign = 'center';
  ctx.fillStyle = C.dim;
  ctx.fillText(TEXT.ui.phone.close, W / 2, S.y + S.h - 14);
}

function drawPhoneGraveyard() {
  const U = TEXT.ui.graveyard, f = RULES.phone.fingertip;
  const S = phoneSheet(U.title);
  const list = Store.load('graveyard', []).slice().reverse();
  const btnY = S.y + S.h - f - 12;
  if (!list.length) {
    serif(16, 'italic');
    ctx.textAlign = 'center';
    ctx.fillStyle = C.gray;
    ctx.fillText(U.empty, W / 2, S.y + S.h * 0.4);
  }
  G.graveSel = clamp(G.graveSel, 0, Math.max(0, list.length - 1));
  const rowH = 46, top = S.y + 44, epitaphRoom = 130;
  const fit = Math.max(1, Math.floor((btnY - epitaphRoom - top) / rowH));
  const shown = list.slice(0, Math.min(15, fit));
  shown.forEach((g, i) => {
    const left = g.won ? fill(U.escaped, { run: g.run }) : fill(U.lost, { run: g.run, depth: g.depth, killer: g.killer, looted: g.looted ? U.looted : '' });
    phoneRow(S.x + 6, top + i * rowH, S.w - 12, rowH, { sel: i === G.graveSel, label: fill(U.row, { level: g.level, turns: g.turns, date: g.date || '' }),
      text: left, size: 15, color: g.won ? C.red : INK, keys: () => stepKeys(G.graveSel, i, shown.length, false), name: 'grave:' + i });
  });
  const g = shown[G.graveSel];
  if (g) {
    ctx.textAlign = 'center';
    serif(16, 'italic');
    ctx.fillStyle = C.purple;
    let y = top + shown.length * rowH + 28;
    for (const l of g.epitaph || []) {
      for (const ln of wrapPx(l, S.w - 30)) {
        if (y < btnY - 8) ctx.fillText(ln, W / 2, y);
        y += 20;
      }
    }
  }
  phoneButton(W / 2 - 90, btnY, 180, f, TEXT.ui.phone.graveyard.close, ['Escape'], { name: 'grave:close' });
}
