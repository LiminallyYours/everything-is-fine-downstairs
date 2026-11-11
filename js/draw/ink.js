'use strict';
// The ink-on-paper drawing kit. Every stroke passes through warp(), which bends it with slow
// sine waves so nothing is ever quite straight or quite still. Like a real pen, a line swells
// where it is pressed and thins where it lifts, and filled shapes are shaded with hatching on
// their shadow side. How eerie the page looks turns the knobs: more wobble, the page leaning
// further off true, broken, scratchy lines, crossed hatching, and more blots where the pen paused.

const PAPER = '#efe4cc', INK = '#1b1519';
const FONT_VERSE = '"Baskerville", "Hoefler Text", "Big Caslon", Georgia, serif';
const FONT_TITLE = '"Big Caslon", "Baskerville", "Didot", Georgia, serif';
const FONT_HAND = `"${HAND_FONT}", "Noteworthy", "Bradley Hand", "Marker Felt", "Baskerville", serif`; // headings, labels, the margin, the help pages

const Ink = {
  t: 0,          // seconds, for animation
  wobble: 0.6,   // px of sine wobble on every point
  lean: 0,       // how far the whole page shears off vertical
  leanY: 0,      // the row the page leans around
  objLean: 0,    // extra lean for the object being drawn, from its feet
  baseY: 0,
  scratch: 0,    // 0..1: gaps and doubled strokes
  weight: 1.6,   // base line width in px
  alpha: 1,
  color: INK,
  unreal: false, // true while drawing a made-up horror or treasure (see INK_UNREAL)

  // Called once per frame from the current Dread (0..1) and cell size.
  setMood(d, S, extraWobble) {
    this.wobble = S * (0.012 + 0.09 * d * d) + (extraWobble || 0);
    this.lean = (0.012 + 0.11 * d) * Math.sin(this.t * 0.33);
    this.scratch = clamp((d - 0.3) / 0.7, 0, 1);
    this.weight = Math.max(1.1, S / 26) * (1 - 0.25 * this.scratch);
    this.bleed = d; // blots, and crossed hatching, grow with this
  },
  calm(S) { this.setMood(0, S); this.lean = 0; },
};

function warp(x, y) {
  const a = Ink.wobble, t = Ink.t;
  let wx = x + Math.sin(y * 0.043 + t * 1.3 + x * 0.011) * a + Math.sin(y * 0.11 - t * 0.7) * a * 0.35;
  const wy = y + Math.sin(x * 0.047 + t * 1.1 + y * 0.013) * a * 0.7;
  wx += Ink.lean * (Ink.leanY - y) + Ink.objLean * (Ink.baseY - y);
  return [wx, wy];
}

// Stable pseudo-random numbers from a seed, so a stroke's scratchiness doesn't flicker.
function hash(n) {
  const h = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return h - Math.floor(h);
}

function subdivide(pts, closed, step) {
  const out = [], n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n];
    const segs = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / step));
    for (let k = 0; k < segs; k++) out.push([x1 + ((x2 - x1) * k) / segs, y1 + ((y2 - y1) * k) / segs]);
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

function tracePath(w, closed) {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  ctx.beginPath();
  if (w.length < 3) {
    ctx.moveTo(w[0][0], w[0][1]);
    for (let i = 1; i < w.length; i++) ctx.lineTo(w[i][0], w[i][1]);
    if (closed) ctx.closePath();
    return;
  }
  if (closed) {
    const m0 = mid(w[w.length - 1], w[0]);
    ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < w.length; i++) {
      const m = mid(w[i], w[(i + 1) % w.length]);
      ctx.quadraticCurveTo(w[i][0], w[i][1], m[0], m[1]);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(w[0][0], w[0][1]);
    for (let i = 1; i < w.length - 1; i++) {
      const m = mid(w[i], w[i + 1]);
      ctx.quadraticCurveTo(w[i][0], w[i][1], m[0], m[1]);
    }
    ctx.lineTo(w[w.length - 1][0], w[w.length - 1][1]);
  }
}

// The one real drawing call. o: { w, color, closed, fill, fillAlpha, alpha, step, noScratch }
function stroke(pts, o = {}) {
  if (!pts.length) return;
  if (Ink.unreal) return unrealStroke(pts, o);
  const closed = !!o.closed;
  const raw = o.step === 0 ? pts : subdivide(pts, closed, o.step || 10);
  const w = raw.map(p => warp(p[0], p[1]));
  tracePath(w, closed);
  if (o.fill) {
    ctx.globalAlpha = (o.fillAlpha == null ? 0.35 : o.fillAlpha) * Ink.alpha;
    ctx.fillStyle = o.fill;
    ctx.fill();
  }
  if (o.w === 0) { ctx.globalAlpha = 1; return; }
  if (o.fill && o.hatch !== false && !paleInk(o.fill)) hatch(w, o); // no shading on paper-coloured cards and bubbles
  const seed = pts[0][0] * 0.37 + pts[0][1] * 1.91;
  ctx.lineWidth = (o.w || 1) * Ink.weight * (w.length >= 4 ? 0.85 : 1);
  ctx.strokeStyle = o.color || Ink.color;
  ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * Ink.alpha;
  const sc = o.noScratch ? 0 : Ink.scratch;
  if (sc > 0.05) {
    const dash = [];
    for (let i = 0; i < 6; i++) dash.push(6 + hash(seed + i) * 26 * (1.2 - sc), 1 + hash(seed + i + 9) * 9 * sc);
    ctx.setLineDash(dash);
  }
  ctx.stroke();
  // Pen pressure: part of the line, somewhere in its middle, pressed harder.
  if (w.length >= 4 && !o.noPress) {
    const n = w.length, i0 = Math.floor(n * (0.15 + 0.25 * hash(seed + 3))), i1 = Math.min(n - 1, i0 + Math.max(2, Math.floor(n * (0.3 + 0.3 * hash(seed + 4)))));
    tracePath(w.slice(i0, i1 + 1), false);
    const lw = ctx.lineWidth;
    ctx.lineWidth = lw * 1.75;
    ctx.stroke();
    ctx.lineWidth = lw;
  }
  // A blot where the pen paused: seldom on a calm page, more as it gets eerier.
  if (!o.noBlot && hash(seed + 11) < INK_BLOT.calm + INK_BLOT.eerie * Ink.bleed * Ink.bleed) {
    const [bx, by] = hash(seed + 12) < 0.5 ? w[0] : w[w.length - 1], r = ctx.lineWidth * (0.9 + hash(seed + 13) * 0.9);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.arc(bx + (hash(seed + 14) - 0.5) * r * 5, by + (hash(seed + 15) - 0.2) * r * 4, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  if (sc > 0.3) { // a second, shakier pass: the pen is trembling
    const w2 = raw.map((p, i) => warp(p[0] + Math.sin(i + seed) * 1.5 * sc, p[1] + Math.cos(i * 1.3 + seed) * 1.5 * sc));
    tracePath(w2, closed);
    ctx.globalAlpha *= 0.45;
    ctx.lineWidth *= 0.6;
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

const line = (x1, y1, x2, y2, o) => stroke([[x1, y1], [x2, y2]], o);

// Made-up horrors and treasures, the ones fear puts at the edge of your light, are drawn so no
// careful player takes one for real: every colour washed most of the way to the paper (`wash`),
// fills fainter still (`fill`), no shading, no pressed line and no blots, and every outline
// broken into short scratches (`dash`, `gap`, in line widths) and gone over a second time a
// little off (`jitter`, in px), as a pen draws something that isn't there.
const INK_UNREAL = { wash: 0.6, fill: 0.4, dash: [2, 5], gap: [2.5, 5], jitter: 1.6 };

// A colour moved part of the way (k, 0..1) toward the paper. Gradients and patterns are left alone.
function towardPaper(c, k) {
  if (typeof c !== 'string') return c;
  let r, g, b, a = 1, m;
  if (c[0] === '#' && c.length === 7) { const n = parseInt(c.slice(1), 16); [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255]; }
  else if ((m = c.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/))) [r, g, b, a] = [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]];
  else return c;
  const P = parseInt(PAPER.slice(1), 16), mix = (v, pv) => Math.round(v + (pv - v) * k);
  return `rgba(${mix(r, P >> 16)}, ${mix(g, (P >> 8) & 255)}, ${mix(b, P & 255)}, ${a})`;
}

function unrealStroke(pts, o) {
  const U = INK_UNREAL, closed = !!o.closed;
  const raw = o.step === 0 ? pts : subdivide(pts, closed, o.step || 10);
  const w = raw.map(p => warp(p[0], p[1]));
  tracePath(w, closed);
  if (o.fill) {
    ctx.globalAlpha = (o.fillAlpha == null ? 0.35 : o.fillAlpha) * U.fill * Ink.alpha;
    ctx.fillStyle = towardPaper(o.fill, U.wash);
    ctx.fill();
  }
  if (o.w === 0) { ctx.globalAlpha = 1; return; }
  const seed = pts[0][0] * 0.37 + pts[0][1] * 1.91;
  const lw = (o.w || 1) * Ink.weight * (w.length >= 4 ? 0.85 : 1);
  ctx.lineWidth = lw;
  ctx.strokeStyle = towardPaper(o.color || Ink.color, U.wash);
  ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * Ink.alpha;
  const dash = [], span = (r, h) => (r[0] + (r[1] - r[0]) * h) * Math.max(1, lw);
  for (let i = 0; i < 6; i++) dash.push(span(U.dash, hash(seed + i)), span(U.gap, hash(seed + i + 9)));
  ctx.setLineDash(dash);
  ctx.stroke();
  // the second, shakier pass, its breaks falling in different places
  const w2 = raw.map((p, i) => warp(p[0] + Math.sin(i * 2.1 + seed) * U.jitter, p[1] + Math.cos(i * 1.7 + seed) * U.jitter));
  tracePath(w2, closed);
  ctx.lineDashOffset = dash[0] * 0.6;
  ctx.globalAlpha *= 0.6;
  ctx.lineWidth = lw * 0.6;
  ctx.stroke();
  ctx.lineDashOffset = 0;
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

// Is this a pale colour (paper, a card, a bubble)? Those aren't shaded.
const paleCache = {};
function paleInk(c) {
  if (typeof c !== 'string') return true; // a gradient or pattern: leave it alone
  if (c in paleCache) return paleCache[c];
  let r = 0, g = 0, b = 0, m;
  if (c[0] === '#' && c.length === 7) { const n = parseInt(c.slice(1), 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
  else if ((m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/))) [r, g, b] = [+m[1], +m[2], +m[3]];
  else return (paleCache[c] = true);
  return (paleCache[c] = 0.299 * r + 0.587 * g + 0.114 * b > 190);
}

// How often a stroke ends in a blot: `calm` on a calm page, rising by up to `eerie` as it gets eerier.
const INK_BLOT = { calm: 0.012, eerie: 0.16 };

// Shading on a filled shape's shadow side (lower right): fine diagonal lines, clipped to the
// shape. On an eerie page a second set crosses them in the deepest part. Small shapes are left
// plain: hatching there would only be a smudge.
function hatch(w, o) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of w) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const bw = x1 - x0, bh = y1 - y0;
  if (bw < 14 || bh < 14) return;
  const gap = Math.max(3, Math.min(bw, bh) / 7), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  ctx.save();
  ctx.clip();
  ctx.lineWidth = Math.max(0.6, Ink.weight * 0.45);
  ctx.strokeStyle = o.color || Ink.color;
  ctx.globalAlpha = 0.42 * Ink.alpha;
  ctx.beginPath();
  // lines running down-left, only past the middle toward the lower right
  for (let k = cx + cy; k <= x1 + y1; k += gap) { ctx.moveTo(k - y0, y0); ctx.lineTo(k - y1, y1); }
  ctx.stroke();
  if (Ink.bleed > 0.35) { // crossed, in the deepest corner
    const t = cx + cy + (bw + bh) * 0.22; // the corner past the line x + y = t
    ctx.beginPath();
    ctx.moveTo(t - y1, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, t - x1); ctx.closePath();
    ctx.clip();
    ctx.beginPath();
    for (let k = x0 - y1; k <= x1 - y0; k += gap) { ctx.moveTo(k + y0, y0); ctx.lineTo(k + y1, y1); }
    ctx.stroke();
  }
  ctx.restore();
  tracePath(w, !!o.closed); // put the shape's path back for its outline
}

// A lumpy ellipse. lump=0 is a clean oval; 0.2 is a potato.
function ellipse(cx, cy, rx, ry, o = {}, lump = 0.05, seed = 0) {
  const pts = [], n = o.n || 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + lump * Math.sin(a * 3 + seed) + lump * 0.5 * Math.sin(a * 5 + seed * 2.3);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  stroke(pts, Object.assign({ closed: true, step: 0 }, o));
}

function dot(x, y, r, color) {
  const [wx, wy] = warp(x, y);
  ctx.globalAlpha = Ink.alpha;
  ctx.fillStyle = Ink.unreal ? towardPaper(color || Ink.color, INK_UNREAL.wash) : color || Ink.color;
  ctx.beginPath();
  ctx.arc(wx, wy, Math.max(0.6, r), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function spiral(cx, cy, r, turns, o) {
  const pts = [], n = Math.ceil(turns * 14);
  for (let i = 0; i <= n; i++) {
    const a = (i / 14) * Math.PI * 2, rr = (r * i) / n;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  stroke(pts, Object.assign({ step: 0 }, o));
}

function zigzag(x1, y1, x2, y2, n, amp, o) {
  const pts = [], dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  for (let i = 0; i <= n * 2; i++) {
    const f = i / (n * 2), s = i % 2 ? amp : 0;
    pts.push([x1 + dx * f + nx * s, y1 + dy * f + ny * s]);
  }
  stroke(pts, Object.assign({ step: 0 }, o));
}

// Grass: a few curved blades that sway.
function tuft(x, y, h, n, sway, o) {
  for (let i = 0; i < n; i++) {
    const bx = x + (i - (n - 1) / 2) * h * 0.22;
    const bend = (i - (n - 1) / 2) * h * 0.18 + sway;
    stroke([[bx, y], [bx + bend * 0.4, y - h * 0.55], [bx + bend, y - h * (0.8 + 0.2 * hash(i + x))]], Object.assign({ step: 0 }, o));
  }
}

function star(cx, cy, r, o) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  stroke(pts, Object.assign({ closed: true, step: 0 }, o));
}

// A line of verse printed like ink: each letter sits a little off the line and comes out a
// little darker or lighter, with the odd blot, and the letters tremble more as the page gets
// eerier. Uses the current font, colour, alpha and alignment, like fillText.
function inkLine(str, x, y, seed = 0) {
  str = String(str);
  const align = ctx.textAlign, a0 = ctx.globalAlpha, size = parseFloat((ctx.font.match(/([\d.]+)px/) || [0, 16])[1]);
  const widths = [];
  let total = 0;
  for (const ch of str) { const w = ctx.measureText(ch).width; widths.push(w); total += w; }
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const tremble = Ink.bleed || 0;
  ctx.textAlign = 'left';
  let i = 0;
  for (const ch of str) {
    if (ch !== ' ') {
      const h1 = hash(seed * 31.7 + i * 7.13), h2 = hash(seed * 17.3 + i * 91.7);
      const dy = (h1 - 0.5) * size * 0.07 + Math.sin(Ink.t * 3 + i * 1.7) * size * 0.03 * tremble;
      const dx = (h2 - 0.5) * size * 0.02;
      ctx.globalAlpha = a0 * (0.84 + 0.16 * h2);
      ctx.translate(dx, dy); // (moved by the pen, not by where the letter is written)
      ctx.fillText(ch, cx, y);
      ctx.translate(-dx, -dy);
      if (hash(seed * 5.1 + i * 11.3) < 0.006 + 0.03 * tremble * tremble) { // a blot by the letter
        ctx.globalAlpha = a0 * 0.8;
        ctx.beginPath();
        ctx.arc(cx + widths[i] * h1, y + size * 0.05, size * (0.04 + 0.05 * h2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    cx += widths[i++];
  }
  ctx.textAlign = align;
  ctx.globalAlpha = a0;
}

// Draw an object leaning from its feet, then put the lean back.
function leaning(amount, baseY, fn) {
  const prev = [Ink.objLean, Ink.baseY];
  Ink.objLean = amount;
  Ink.baseY = baseY;
  fn();
  [Ink.objLean, Ink.baseY] = prev;
}

// Turn the old glow-in-the-dark colours into inks and watercolour washes for paper.
function inkify(hex) {
  if (typeof hex !== 'string' || hex[0] !== '#' || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  l = clamp(0.16 + l * 0.24, 0.16, 0.4);
  s = Math.min(1, s * 0.85 + 0.15);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => {
    t = (t + 1) % 1;
    const v = t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
    return Math.round(v * 255).toString(16).padStart(2, '0');
  };
  return '#' + f(h + 1 / 3) + f(h) + f(h - 1 / 3);
}

(function inkEverything() {
  for (const m of Object.values(MONSTERS)) m.color = inkify(m.color);
  for (const f of FLOORS) {
    f.wall = inkify(f.wall);
    f.floor = inkify(f.floor);
    f.deco.color = inkify(f.deco.color);
    f.prop.color = inkify(f.prop.color);
  }
  for (const k of Object.keys(ITEM_COLOR)) ITEM_COLOR[k] = inkify(ITEM_COLOR[k]);
  for (const look of POTION_LOOKS) look[1] = inkify(look[1]);
  for (const k of Object.keys(SOCKS)) SOCKS[k] = inkify(SOCKS[k]);
  for (const l of TEXT.legend) l[1] = inkify(l[1]);
})();

// Aged paper: specks, fibres, a few stains, darker edges. Made once per resize.
function makePaper(W, H) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = PAPER;
  g.fillRect(0, 0, W, H);
  const rnd = (i, k) => hash(i * 13.7 + k * 91.3);
  for (let i = 0; i < 7; i++) {
    const x = rnd(i, 1) * W, y = rnd(i, 2) * H, r = 60 + rnd(i, 3) * 220;
    const st = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    st.addColorStop(0, 'rgba(150,110,60,0.07)');
    st.addColorStop(0.8, 'rgba(150,110,60,0.03)');
    st.addColorStop(1, 'rgba(150,110,60,0)');
    g.fillStyle = st;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < (W * H) / 900; i++) {
    g.fillStyle = `rgba(90,60,30,${0.04 + rnd(i, 4) * 0.12})`;
    g.fillRect(rnd(i, 5) * W, rnd(i, 6) * H, 1 + rnd(i, 7) * 1.5, 1 + rnd(i, 8) * 1.5);
  }
  g.strokeStyle = 'rgba(110,80,40,0.06)';
  for (let i = 0; i < (W * H) / 9000; i++) {
    const x = rnd(i, 9) * W, y = rnd(i, 10) * H, a = rnd(i, 11) * 6.28, l = 6 + rnd(i, 12) * 18;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  const edge = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  edge.addColorStop(0, 'rgba(120,85,40,0)');
  edge.addColorStop(1, 'rgba(120,85,40,0.22)');
  g.fillStyle = edge;
  g.fillRect(0, 0, W, H);
  return c;
}
