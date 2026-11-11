'use strict';
// The ink-on-paper drawing kit. Every stroke passes through warp(), which bends it with slow
// sine waves so nothing is ever quite straight or quite still. Dread turns the knobs:
// more wobble, the page leaning further off true, and broken, scratchy lines.

const PAPER = '#efe4cc', INK = '#1b1519';
const FONT_VERSE = '"Baskerville", "Hoefler Text", "Big Caslon", Georgia, serif';
const FONT_TITLE = '"Big Caslon", "Baskerville", "Didot", Georgia, serif';
const FONT_HAND = '"Noteworthy", "Bradley Hand", "Marker Felt", "Baskerville", serif';

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

  // Called once per frame from the current Dread (0..1) and cell size.
  setMood(d, S, extraWobble) {
    this.wobble = S * (0.012 + 0.09 * d * d) + (extraWobble || 0);
    this.lean = (0.012 + 0.11 * d) * Math.sin(this.t * 0.33);
    this.scratch = clamp((d - 0.3) / 0.7, 0, 1);
    this.weight = Math.max(1.1, S / 26) * (1 - 0.25 * this.scratch);
    this.bleed = d;
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
  const seed = pts[0][0] * 0.37 + pts[0][1] * 1.91;
  ctx.lineWidth = (o.w || 1) * Ink.weight;
  ctx.strokeStyle = o.color || Ink.color;
  ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * Ink.alpha;
  const sc = o.noScratch ? 0 : Ink.scratch;
  if (sc > 0.05) {
    const dash = [];
    for (let i = 0; i < 6; i++) dash.push(6 + hash(seed + i) * 26 * (1.2 - sc), 1 + hash(seed + i + 9) * 9 * sc);
    ctx.setLineDash(dash);
  }
  ctx.stroke();
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
  ctx.fillStyle = color || Ink.color;
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
