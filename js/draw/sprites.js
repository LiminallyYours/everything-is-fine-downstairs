'use strict';
// Ink drawings for you, every horror, and every item: a handful of wobbly strokes each,
// top-heavy and leaning. Coordinates are in cell units from the middle of the cell's
// floor line: p(0, 0) is where the feet go, p(0, -1) is one cell higher.

const unit = (cx, by, S) => (dx, dy) => [cx + dx * S, by + dy * S];
const wash = (color, a) => ({ fill: color, fillAlpha: a == null ? 0.3 : a });
const RED_INK = '#a3192b', GOLD_INK = '#9a7408', WAX = '#f6eedb';

function eye(p, x, y, r, S, look) {
  const [ex, ey] = p(x, y);
  ellipse(ex, ey, r * S, r * S * 1.1, { w: 0.8, fill: PAPER, fillAlpha: 1 });
  dot(ex + (look || 0) * r * S * 0.45, ey, r * S * 0.45);
}

// ---------------------------------------------------------------------------------------
// You, and your candle (whose length is your Wick).

function drawCandle(x, by, h, w, lit, S) {
  stroke([[x - w / 2, by], [x - w / 2, by - h], [x + w / 2, by - h], [x + w / 2, by]], { closed: true, w: 0.9, fill: WAX, fillAlpha: 1, step: 0 });
  stroke([[x - w / 2, by - h], [x - w / 2 - w * 0.2, by - h + h * 0.25], [x - w / 2, by - h + h * 0.35]], { w: 0.7, step: 0 });
  line(x, by - h, x, by - h - S * 0.04, { w: 0.8 });
  const top = by - h - S * 0.04;
  if (lit) {
    const f = Math.sin(Ink.t * 13) * S * 0.018 + Math.sin(Ink.t * 7.3) * S * 0.012;
    const glow = ctx.createRadialGradient(x, top - S * 0.06, 0, x, top - S * 0.06, S * 0.35);
    glow.addColorStop(0, 'rgba(255,190,80,0.35)');
    glow.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - S * 0.4, top - S * 0.45, S * 0.8, S * 0.8);
    stroke([[x - S * 0.035, top], [x - S * 0.03, top - S * 0.08], [x + f, top - S * 0.17], [x + S * 0.03, top - S * 0.08], [x + S * 0.035, top]],
      { closed: true, w: 0.8, fill: '#e07a10', fillAlpha: 0.75, step: 0 });
  } else {
    const a = Ink.alpha;
    Ink.alpha *= 0.5;
    stroke([[x, top], [x + S * 0.04, top - S * 0.08], [x - S * 0.03, top - S * 0.15], [x + S * 0.02, top - S * 0.24]], { w: 0.7 });
    Ink.alpha = a;
  }
}

// What you're wearing shows on you: the coat's colour, your socks, what's on your head, your weapon.
// Keyed by gear id (see gearId in items.js); any other coat is drawn in COAT_INK.other.
const COAT_INK = { overcoat: '#3f7a2e', chainmail: '#8a5a8a', nightgown: '#4a5a9a', other: '#6a6a8a' };

function drawPlayer(cx, by, S, o = {}) {
  const p = unit(cx, by, S), b = Math.sin(Ink.t * 2) * 0.012;
  const wick = o.wick == null ? RULES.candle.max : o.wick;
  const gear = o.gear || {};
  const shoe = gear.feet ? SOCKS[gear.feet.id] || RED_INK : INK;
  const coat = gear.body ? COAT_INK[gearId(gear.body)] || COAT_INK.other : null;
  leaning(0.06, by, () => {
    line(...p(-0.08, -0.12), ...p(-0.1, 0), { w: 1 });
    line(...p(0.07, -0.12), ...p(0.09, 0), { w: 1 });
    ellipse(...p(-0.14, 0), 0.07 * S, 0.035 * S, { w: 0.9, fill: shoe, fillAlpha: 0.85 });
    ellipse(...p(0.13, 0), 0.07 * S, 0.035 * S, { w: 0.9, fill: shoe, fillAlpha: 0.85 });
    stroke([p(-0.2, -0.12), p(-0.24, -0.3), p(-0.14, -0.52), p(0, -0.56), p(0.14, -0.52), p(0.22, -0.3), p(0.18, -0.12), p(0, -0.1)],
      { closed: true, w: 1.1, fill: coat || o.body || '#c9a86a', fillAlpha: coat ? 0.55 : 0.4 });
    if (coat) line(...p(0, -0.54), ...p(0, -0.12), { w: 0.7 });
    if (gear.hand) {
      line(...p(-0.17, -0.38), ...p(-0.3, -0.46), { w: 1 });
      drawItem(gear.hand, ...p(-0.36, -0.55), S * 0.5);
    }
    const hy = -0.74 + b;
    ellipse(...p(-0.01, hy), 0.19 * S, 0.17 * S, { w: 1.1, fill: PAPER, fillAlpha: 0.95 }, 0.04, 2);
    if (gear.head && gearId(gear.head) === 'colander') {
      stroke([p(-0.21, hy - 0.06), p(-0.17, hy - 0.26), p(0, hy - 0.33), p(0.17, hy - 0.26), p(0.2, hy - 0.06)],
        { closed: true, w: 1, fill: '#9a948a', fillAlpha: 0.55 });
      for (const hx of [-0.1, 0, 0.1]) dot(...p(hx, hy - 0.18), 0.016 * S);
      line(...p(-0.26, hy - 0.08), ...p(-0.2, hy - 0.08), { w: 1.2 });
      line(...p(0.2, hy - 0.08), ...p(0.26, hy - 0.08), { w: 1.2 });
    } else if (gear.head) {
      drawNest(unit(...p(-0.01, hy - 0.13), S * 0.55), S * 0.55);
    } else {
      stroke([p(0, hy - 0.16), p(0.03, hy - 0.3), p(0.14, hy - 0.34), p(0.19, hy - 0.26), p(0.11, hy - 0.22)], { w: 1 });
    }
    dot(...p(-0.07, hy - 0.01), 0.024 * S);
    dot(...p(0.05, hy - 0.01), 0.024 * S);
    line(...p(-0.12, hy - 0.07), ...p(-0.04, hy - 0.05), { w: 0.7 });
    line(...p(0.02, hy - 0.05), ...p(0.1, hy - 0.07), { w: 0.7 });
    stroke([p(-0.05, hy + 0.09), p(-0.01, hy + 0.06), p(0.03, hy + 0.09)], { w: 0.8 });
    line(...p(0.17, -0.38), ...p(0.3, -0.46), { w: 1 });
    const [hx, hy2] = p(0.32, -0.44);
    if (!o.noCandle) drawCandle(hx, hy2, S * (0.05 + 0.3 * clamp(wick / RULES.candle.max, 0, 1)), S * 0.075, wick > 0, S);
  });
  if (o.confused) dizzy(p, S, -1.05);
}

function drawBarrel(p, S, eyes) {
  ellipse(...p(0, -0.42), 0.3 * S, 0.4 * S, { w: 1.3, fill: '#8a5a2a', fillAlpha: 0.35 }, 0.03);
  for (const y of [-0.2, -0.64]) stroke([p(-0.29, y), p(0, y + 0.04), p(0.29, y)], { w: 1.1 });
  for (const x of [-0.12, 0.1]) stroke([p(x, -0.78), p(x * 1.3, -0.42), p(x, -0.06)], { w: 0.6, alpha: 0.6 });
  if (eyes) {
    const blink = (Ink.t % 4) < 0.15;
    for (const ex of [-0.07, 0.07]) {
      if (blink) line(...p(ex - 0.03, -0.84), ...p(ex + 0.03, -0.84), { w: 0.9 });
      else eye(p, ex, -0.85, 0.045, S, Math.sin(Ink.t * 0.8));
    }
  }
}

function dizzy(p, S, y) {
  for (let i = 0; i < 3; i++) {
    const a = Ink.t * 3 + (i * Math.PI * 2) / 3;
    const [x, yy] = p(Math.cos(a) * 0.2, y + Math.sin(a) * 0.05);
    star(x, yy, 0.05 * S, { w: 0.7, fill: GOLD_INK, fillAlpha: 0.5 });
  }
}

// ---------------------------------------------------------------------------------------
// The horrors. Each gets (p, S, m, c): the unit mapper, cell size, the monster, its ink.

// A Second-Hand Nest, right way up: p(0, 0) is the middle of its underside. The previous owner
// hasn't quite moved out.
const NEST_INK = '#8a6a3a';
function nestBowl(p, w, y0, y1) {
  stroke([p(-w, y1), p(-w * 0.86, y0 - 0.1), p(-w * 0.42, y0), p(w * 0.42, y0), p(w * 0.86, y0 - 0.1), p(w, y1)],
    { closed: true, w: 1.1, fill: NEST_INK, fillAlpha: 0.45 });
  for (let i = 0; i < 6; i++) {
    const x = -w * 0.8 + i * w * 0.3, k = hash(i * 7.3 + w);
    line(...p(x, y0 - 0.05 - k * (y0 - y1) * 0.6), ...p(x + w * 0.42, y0 - 0.1 - (1 - k) * (y0 - y1) * 0.5), { w: 0.6 });
  }
  for (const [x, dx, dy] of [[-w, -0.1, -0.07], [w, 0.11, -0.05], [-w * 0.6, -0.04, -0.11], [w * 0.62, 0.05, -0.1]]) line(...p(x, y1), ...p(x + dx, y1 + dy), { w: 0.7 });
}
function drawNest(p, S) {
  nestBowl(p, 0.34, 0, -0.3);
  const blink = (Ink.t % 5) < 0.2;
  for (const ex of [-0.07, 0.07]) {
    if (blink) line(...p(ex - 0.035, -0.37), ...p(ex + 0.035, -0.37), { w: 0.8 });
    else eye(p, ex, -0.38, 0.045, S, Math.sin(Ink.t * 0.7));
  }
}

const MONSTER_ART = {
  mite(p, S, m, c) {
    ellipse(...p(0, -0.2), 0.26 * S, 0.19 * S, Object.assign({ w: 1.1 }, wash(c, 0.35)), 0.18, 1.3);
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * (1.12 + i * 0.15), [x, y] = p(Math.cos(a) * 0.27, -0.2 + Math.sin(a) * 0.21);
      line(x, y, x + Math.cos(a) * S * 0.06, y + Math.sin(a) * S * 0.06, { w: 0.7 });
    }
    for (const ex of [-0.08, 0.08]) {
      stroke([p(ex - 0.05, -0.27), p(ex, -0.25), p(ex + 0.05, -0.27)], { w: 0.9 });
      dot(...p(ex, -0.235), 0.018 * S);
    }
    zigzag(...p(-0.07, -0.13), ...p(0.07, -0.13), 3, 0.02 * S, { w: 0.8 });
  },

  // Yesterday's Soup: a bowl that has got up and gone for a stroll, with its spoon still in.
  bat(p, S, m, c) {
    const step = Math.sin(Ink.t * 9 + m.x) * 0.035, look = Math.sin(Ink.t * 1.3 + m.x);
    for (const s of [-1, 1]) {
      stroke([p(0.08 * s, -0.2), p(0.11 * s + step * s, -0.02), p(0.2 * s + step * s, 0)], { w: 1 });
    }
    stroke([p(-0.32, -0.5), p(-0.27, -0.3), p(-0.11, -0.19), p(0.11, -0.19), p(0.27, -0.3), p(0.32, -0.5)],
      { closed: true, w: 1.2, fill: PAPER, fillAlpha: 0.97 });
    ellipse(...p(0, -0.5), 0.32 * S, 0.085 * S, Object.assign({ w: 1.1 }, wash(c, 0.55)), 0.04);
    stroke([p(0.22, -0.47), p(0.31, -0.4), p(0.28, -0.3)], { w: 1.8, color: c });
    line(...p(-0.14, -0.5), ...p(-0.33, -0.88), { w: 1.1 });
    ellipse(...p(-0.36, -0.94), 0.05 * S, 0.07 * S, { w: 1, fill: '#9a948a', fillAlpha: 0.4 }, 0.04);
    eye(p, -0.04, -0.56, 0.055, S, look);
    eye(p, 0.11, -0.56, 0.055, S, look);
    stroke([p(-0.02, -0.33), p(0.04, -0.3), p(0.1, -0.33)], { w: 0.8 });
  },

  // The Put-Away: a small chest of drawers, very pleased to help. Something of yours is
  // already in the bottom drawer.
  putaway(p, S, m, c) {
    const look = Math.sin(Ink.t * 1.7 + m.x);
    line(...p(-0.19, -0.08), ...p(-0.22, 0.02), { w: 1.1 });
    line(...p(0.19, -0.08), ...p(0.22, 0.02), { w: 1.1 });
    stroke([p(-0.28, -0.08), p(-0.3, -0.78), p(0.3, -0.8), p(0.28, -0.08)], Object.assign({ closed: true, w: 1.2 }, wash(c, 0.35)));
    line(...p(-0.295, -0.56), ...p(0.295, -0.57), { w: 0.9 });
    eye(p, -0.1, -0.68, 0.062, S, look);
    eye(p, 0.1, -0.68, 0.062, S, look);
    dot(...p(0, -0.49), 0.028 * S);
    stroke([p(-0.13, -0.44), p(0, -0.38), p(0.13, -0.44)], { w: 0.9 });
    // the bottom drawer, pulled out
    stroke([p(-0.28, -0.3), p(0.28, -0.3), p(0.33, -0.26), p(-0.33, -0.26)], { closed: true, w: 0.8, fill: INK, fillAlpha: 0.85 });
    stroke([p(-0.33, -0.26), p(0.33, -0.26), p(0.32, -0.1), p(-0.32, -0.1)], { closed: true, w: 1.1, fill: PAPER, fillAlpha: 0.95 });
    dot(...p(0, -0.18), 0.028 * S);
    ellipse(...p(0.17, -0.3), 0.055 * S, 0.04 * S, { w: 0.8, fill: GOLD_INK, fillAlpha: 0.6 });
    stroke([p(-0.2, -0.28), p(-0.19, -0.36), p(-0.12, -0.37), p(-0.11, -0.28)], { w: 0.9, color: RED_INK });
  },

  // The Second Opinion: spectacles, its own teeth, and the book it has written about you.
  opinion(p, S, m, c) {
    for (const lx of [-0.2, 0, 0.2]) line(...p(lx, -0.16), ...p(lx * 1.2, 0), { w: 1 });
    const sw = Math.sin(Ink.t * 2.3) * 0.03, ey = -1.04;
    for (const s of [-1, 1]) {
      stroke([p(0.12 * s, -0.72), p(0.14 * s + sw, -0.86), p(0.15 * s + sw, -0.94)], { w: 1 });
      ellipse(...p(0.15 * s + sw, ey), 0.1 * S, 0.1 * S, { w: 1, fill: PAPER, fillAlpha: 0.9 }, 0.02);
      dot(...p(0.15 * s + sw + 0.02, ey + 0.01), 0.03 * S);
    }
    line(...p(-0.05 + sw, ey), ...p(0.05 + sw, ey), { w: 1 });
    ellipse(...p(0, -0.45), 0.4 * S, 0.3 * S, Object.assign({ w: 1.3 }, wash(c, 0.35)), 0.08, 4);
    stroke([p(-0.3, -0.5), p(-0.1, -0.46), p(0.1, -0.46), p(0.3, -0.5), p(0.15, -0.28), p(-0.15, -0.28)],
      { closed: true, w: 1.1, fill: INK, fillAlpha: 0.82 });
    zigzag(...p(-0.26, -0.48), ...p(0.26, -0.48), 6, 0.07 * S, { w: 1, color: PAPER });
    stroke([p(0.3, -0.36), p(0.4, -0.3)], { w: 1 });
    stroke([p(0.34, -0.42), p(0.56, -0.5), p(0.6, -0.24), p(0.38, -0.16)], { closed: true, w: 1, fill: PAPER, fillAlpha: 0.97 });
    line(...p(0.41, -0.36), ...p(0.54, -0.41), { w: 0.5 });
    line(...p(0.42, -0.29), ...p(0.55, -0.34), { w: 0.5 });
    line(...p(0.43, -0.22), ...p(0.5, -0.25), { w: 0.5 });
  },

  // Better-Late-Than-Never: bent double under a piano, a pond, and a week from next year.
  zombie(p, S, m, c) {
    leaning(0.14, p(0, 0)[1], () => {
      const h = Math.sin(Ink.t * 1.2 + m.x) * 0.015;
      stroke([p(-0.04, -0.26), p(-0.12, -0.13), p(-0.08, 0), p(-0.15, 0)], { w: 1.1 });
      stroke([p(0.1, -0.26), p(0.2, -0.14), p(0.16, 0), p(0.24, 0)], { w: 1.1 });
      ellipse(...p(0.05, -0.36), 0.18 * S, 0.13 * S, Object.assign({ w: 1.2 }, wash(c, 0.4)), 0.08, 3);
      ellipse(...p(0.32, -0.38), 0.105 * S, 0.1 * S, { w: 1.1, fill: PAPER, fillAlpha: 0.97 }, 0.05, 2);
      dot(...p(0.3, -0.41), 0.019 * S);
      dot(...p(0.37, -0.41), 0.019 * S);
      stroke([p(0.28, -0.35), p(0.33, -0.31), p(0.38, -0.35)], { w: 0.8 });
      // the piano
      stroke([p(-0.36, -0.5 + h), p(-0.38, -1.0 + h), p(0.2, -1.04 + h), p(0.22, -0.53 + h)], { closed: true, w: 1.2, fill: '#4a352a', fillAlpha: 0.5 });
      stroke([p(-0.32, -0.74 + h), p(0.17, -0.77 + h), p(0.17, -0.67 + h), p(-0.32, -0.64 + h)], { closed: true, w: 0.8, fill: PAPER, fillAlpha: 1 });
      for (let i = 1; i < 8; i++) line(...p(-0.32 + i * 0.061, -0.74 + h - i * 0.0037), ...p(-0.32 + i * 0.061, -0.675 + h - i * 0.0037), { w: 0.5 });
      stroke([p(-0.37, -0.76 + h), p(-0.06, -0.47), p(0.21, -0.78 + h)], { w: 0.7 });
      // the pond, and a week from next year
      ellipse(...p(-0.12, -1.09 + h), 0.22 * S, 0.055 * S, { w: 1, fill: WATER_INK, fillAlpha: 0.4 }, 0.04);
      stroke([p(-0.22, -1.09 + h), p(-0.14, -1.105 + h), p(-0.06, -1.09 + h)], { w: 0.6, color: WATER_INK });
      stroke([p(0.1, -1.2 + h), p(0.27, -1.24 + h), p(0.3, -1.07 + h), p(0.13, -1.04 + h)], { closed: true, w: 0.8, fill: PAPER, fillAlpha: 1 });
      line(...p(0.11, -1.16 + h), ...p(0.28, -1.2 + h), { w: 1.3, color: RED_INK });
      for (let i = 0; i < 3; i++) dot(...p(0.15 + i * 0.045, -1.1 + h - i * 0.01), 0.012 * S);
    });
  },

  // The Ahem: a cough with nobody attached. A pair of spectacles, a bow tie, a fist held up
  // politely to a mouth that isn't there, and the cough.
  wraith(p, S, m, c) {
    const a = Ink.alpha, hem = (Ink.t * 0.55 + m.x * 0.37) % 1, j = hem < 0.1 ? -0.04 : 0;
    for (const s of [-1, 1]) {
      stroke([p(0, -0.52), p(0.2 * s, -0.63), p(0.2 * s, -0.41)], { closed: true, w: 1, fill: c, fillAlpha: 0.45 });
      ellipse(...p(0.1 * s - 0.01, -1.08 + j), 0.08 * S, 0.075 * S, { w: 1 }, 0.02);
    }
    line(...p(-0.03, -1.08 + j), ...p(0.01, -1.08 + j), { w: 1 });
    ellipse(...p(0, -0.52), 0.04 * S, 0.05 * S, { w: 0.9, fill: PAPER, fillAlpha: 1 });
    stroke([p(0.16, -0.7 + j), p(0.3, -0.76 + j), p(0.36, -0.62 + j), p(0.22, -0.56 + j)], { closed: true, w: 0.9, fill: PAPER, fillAlpha: 0.95 });
    stroke([p(0.04, -0.78 + j), p(0.02, -0.92 + j), p(0.12, -0.98 + j), p(0.24, -0.93 + j), p(0.26, -0.78 + j), p(0.16, -0.72 + j)],
      { closed: true, w: 1.1, fill: PAPER, fillAlpha: 0.97 });
    for (const kx of [0.08, 0.14, 0.2]) line(...p(kx, -0.93 + j), ...p(kx + 0.005, -0.87 + j), { w: 0.6 });
    Ink.alpha *= 0.75;
    for (let i = 0; i < 3; i++) {
      const f = (hem + i / 3) % 1;
      Ink.alpha = a * 0.75 * (1 - f);
      ellipse(...p(-0.06 - f * 0.34, -0.9 - f * 0.16), (0.035 + f * 0.07) * S, (0.03 + f * 0.06) * S, { w: 0.8 }, 0.22, i * 3);
    }
    Ink.alpha = a;
  },

  // The Nothing-to-Worry-About, once it has opened. (Until then it is drawn as the nest it
  // is pretending to be.)
  mimic(p, S) {
    leaning(0.12, p(0, 0)[1], () => {
      const open = 0.12 + 0.06 * Math.sin(Ink.t * 3), top = -0.5 - open;
      nestBowl(p, 0.38, 0, -0.34);
      stroke([p(-0.38, -0.34), p(0.38, -0.34), p(0.33, top), p(-0.33, top)], { closed: true, w: 1, fill: INK, fillAlpha: 0.9 });
      zigzag(...p(-0.34, -0.34), ...p(0.34, -0.34), 7, -0.085 * S, { w: 0.9, color: PAPER });
      zigzag(...p(-0.3, top), ...p(0.3, top), 7, 0.085 * S, { w: 0.9, color: PAPER });
      dot(...p(-0.09, (top - 0.34) / 2 - 0.01), 0.03 * S, RED_INK);
      dot(...p(0.09, (top - 0.34) / 2 - 0.01), 0.03 * S, RED_INK);
      stroke([p(-0.35, top), p(-0.29, top - 0.24), p(0, top - 0.33), p(0.29, top - 0.24), p(0.35, top)], { closed: true, w: 1.1, fill: NEST_INK, fillAlpha: 0.45 });
      for (let i = 0; i < 5; i++) line(...p(-0.24 + i * 0.1, top - 0.06 - hash(i * 3.1) * 0.14), ...p(-0.1 + i * 0.1, top - 0.1 - hash(i * 5.7) * 0.12), { w: 0.6 });
    });
  },

  // The Empty Sandwich: two slices with nothing between them, and half of another.
  thing(p, S, m, c) {
    const slice = (x, y, w, h, o) => stroke([p(x - w, y), p(x - w, y - h * 0.7), p(x - w * 1.14, y - h * 0.88), p(x - w * 0.55, y - h),
      p(x, y - h * 0.92), p(x + w * 0.55, y - h), p(x + w * 1.14, y - h * 0.88), p(x + w, y - h * 0.7), p(x + w, y)], Object.assign({ closed: true, w: 1.2 }, o));
    const gap = 0.06 + 0.025 * Math.sin(Ink.t * 4 + m.x);
    line(...p(-0.24, -0.12), ...p(-0.27, 0), { w: 1 });
    line(...p(-0.02, -0.12), ...p(0.01, 0), { w: 1 });
    slice(-0.13 + gap * 2, -0.14, 0.2, 0.62, wash(c, 0.45));
    slice(-0.13 + gap, -0.125, 0.195, 0.6, { fill: INK, fillAlpha: 0.85, w: 0.6 });
    slice(-0.13, -0.11, 0.2, 0.62, { fill: PAPER, fillAlpha: 0.98 });
    dot(...p(-0.2, -0.5), 0.022 * S);
    dot(...p(-0.07, -0.5), 0.022 * S);
    stroke([p(-0.22, -0.36), p(-0.135, -0.3), p(-0.05, -0.36)], { w: 0.9 });
    // the half
    stroke([p(0.27, -0.05), p(0.27, -0.36), p(0.5, -0.05)], Object.assign({ closed: true, w: 1 }, wash(c, 0.45)));
    stroke([p(0.22, -0.03), p(0.22, -0.34), p(0.45, -0.03)], { closed: true, w: 1.1, fill: PAPER, fillAlpha: 0.98 });
    dot(...p(0.26, -0.16), 0.016 * S);
    dot(...p(0.31, -0.13), 0.016 * S);
  },

  tot(p, S, m, c) {
    line(...p(-0.06, -0.25), ...p(-0.1, 0), { w: 1 });
    line(...p(0.06, -0.25), ...p(0.1, 0), { w: 1 });
    stroke([p(-0.16, -0.24), p(0, -0.52), p(0.16, -0.24)], Object.assign({ closed: true, w: 1.1 }, wash(c, 0.35)));
    const [hx, hy] = p(0, -0.74);
    ellipse(hx, hy, 0.24 * S, 0.24 * S, { w: 1.3, fill: PAPER, fillAlpha: 0.95 }, 0.02);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6, r1 = i % 3 ? 0.19 : 0.15;
      line(hx + Math.cos(a) * r1 * S, hy + Math.sin(a) * r1 * S, hx + Math.cos(a) * 0.21 * S, hy + Math.sin(a) * 0.21 * S, { w: 0.7, noScratch: true });
    }
    const t = Ink.t * (m.frenzy > 0 ? 9 : 3);
    line(hx, hy, hx + Math.cos(t) * 0.15 * S, hy + Math.sin(t) * 0.15 * S, { w: 1.1 });
    line(hx, hy, hx + Math.cos(t / 12) * 0.1 * S, hy + Math.sin(t / 12) * 0.1 * S, { w: 1.4 });
    dot(...p(-0.08, -0.82), 0.024 * S);
    dot(...p(0.08, -0.82), 0.024 * S);
    const k = Math.abs(Math.cos(Ink.t * 5));
    line(...p(0.22, -0.74), ...p(0.34, -0.74), { w: 1 });
    ellipse(...p(0.37, -0.8), 0.01 * S + 0.04 * S * k, 0.05 * S, { w: 0.9 });
    ellipse(...p(0.37, -0.68), 0.01 * S + 0.04 * S * k, 0.05 * S, { w: 0.9 });
  },

  // Bottom Half – Giraffe: four legs and some knees. The rest of it goes up off the page.
  giraffe(p, S, m, c) {
    const a = Ink.alpha, sway = Math.sin(Ink.t * 0.8 + m.x) * 0.02, top = -1.85, knee = -0.78;
    const leg = (x, back) => {
      const kx = x + (back ? 0.04 : -0.03) + sway, t = back ? 0.028 : 0.036;
      stroke([p(x - t, 0), p(kx - t, knee), p(x - t + sway * 2, top), p(x + t + sway * 2, top), p(kx + t, knee), p(x + t, 0)],
        Object.assign({ closed: true, w: back ? 0.9 : 1.2 }, wash(c, back ? 0.3 : 0.45)));
      ellipse(...p(kx, knee), 0.058 * S, 0.066 * S, Object.assign({ w: 1 }, wash(c, 0.6)), 0.1, x * 7);
      stroke([p(x - 0.06, 0), p(x - 0.05, -0.05), p(x + 0.05, -0.05), p(x + 0.06, 0)], { closed: true, w: 1, fill: INK, fillAlpha: 0.85 });
    };
    leg(-0.2, true);
    leg(0.24, true);
    leg(-0.34, false);
    leg(0.1, false);
    for (const [x, y] of [[-0.345, -0.3], [-0.36, -1.1], [-0.35, -1.5], [0.1, -0.45], [0.09, -1.25], [0.085, -0.22], [0.1, -1.6]]) {
      ellipse(...p(x + sway * (y < knee ? 1.5 : 0.5), y), 0.022 * S, 0.045 * S, { w: 0.5, fill: '#7a4a1a', fillAlpha: 0.6 }, 0.25, y * 11);
    }
    stroke([p(0.3 + sway * 2, top + 0.06), p(0.42, top + 0.4), p(0.4, top + 0.58)], { w: 0.9 });
    for (const dx of [-0.03, 0, 0.03]) line(...p(0.4, top + 0.58), ...p(0.4 + dx, top + 0.7), { w: 0.7 });
    Ink.alpha = a * 0.5;
    stroke([p(-0.4 + sway * 2, top), p(-0.2, top - 0.1), p(0.16, top - 0.1), p(0.3 + sway * 2, top)], { w: 1.3 });
    Ink.alpha = a;
  },

  sockling(p, S, m, c) {
    leaning(Math.sin(Ink.t * 5 + m.x) * 0.2, p(0, 0)[1], () => {
      stroke([p(-0.12, -0.95), p(-0.13, -0.3), p(-0.08, -0.08), p(0.12, -0.02), p(0.3, -0.06), p(0.3, -0.2), p(0.14, -0.28), p(0.1, -0.95)],
        Object.assign({ closed: true, w: 1.2 }, wash(c, 0.35)));
      for (const y of [-0.85, -0.75]) line(...p(-0.13, y), ...p(0.11, y), { w: 1.4, color: c });
      for (const ex of [-0.05, 0.05]) {
        ellipse(...p(ex, -0.58), 0.035 * S, 0.035 * S, { w: 0.8 });
        line(...p(ex - 0.02, -0.58), ...p(ex + 0.02, -0.58), { w: 0.5 });
      }
    });
  },

  tuck(p, S) {
    const pts = [p(-0.5, -0.1), p(-0.52, -0.7), p(-0.3, -1.2), p(0, -1.32), p(0.3, -1.2), p(0.52, -0.7), p(0.5, -0.1)];
    for (let i = 0; i <= 8; i++) pts.push(p(0.5 - i * 0.125, -0.08 + (i % 2 ? 0.07 : 0) + Math.sin(Ink.t * 2 + i) * 0.03));
    stroke(pts, { closed: true, w: 1.3, fill: '#7a74b0', fillAlpha: 0.3 });
    for (let i = -1; i <= 1; i++) {
      line(...p(i * 0.25 - 0.18, -0.18), ...p(i * 0.25 + 0.18, -0.62), { w: 0.5, alpha: 0.5 });
      line(...p(i * 0.25 + 0.18, -0.18), ...p(i * 0.25 - 0.18, -0.62), { w: 0.5, alpha: 0.5 });
    }
    ellipse(...p(-0.14, -0.9), 0.07 * S, 0.1 * S, { w: 1, fill: INK, fillAlpha: 0.95 });
    ellipse(...p(0.14, -0.9), 0.07 * S, 0.1 * S, { w: 1, fill: INK, fillAlpha: 0.95 });
    stroke([p(-0.1, -0.74), p(0, -0.69), p(0.1, -0.74)], { w: 1 });
    stroke([p(-0.25, -1.2), p(0.05, -1.55), p(0.45, -1.5), p(0.55, -1.3), p(0.25, -1.24)], { closed: true, w: 1.1, fill: RED_INK, fillAlpha: 0.4 });
    ellipse(...p(0.57, -1.26), 0.07 * S, 0.07 * S, { w: 1, fill: PAPER, fillAlpha: 1 }, 0.25);
  },

  nibbler(p, S, m, c) {
    const shake = m.enraged ? Math.sin(Ink.t * 40) * 0.03 : 0;
    const open = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(Ink.t * 2.4));
    ellipse(...p(shake, -0.75), 0.85 * S, 0.75 * S, Object.assign({ w: 1.6 }, wash(c, 0.35)), 0.06, 5);
    for (const lx of [-0.4, -0.15, 0.15, 0.4]) line(...p(lx, -0.08), ...p(lx * 1.1, 0.02), { w: 1.2 });
    dot(...p(-0.15 + shake, -1.25), 0.03 * S);
    dot(...p(0.15 + shake, -1.25), 0.03 * S);
    line(...p(-0.22, -1.33), ...p(-0.08, -1.3), { w: 1 });
    line(...p(0.22, -1.33), ...p(0.08, -1.3), { w: 1 });
    const top = -0.78 - open, bot = -0.62 + open * 0.6;
    stroke([p(-0.6, -0.72), p(-0.3, top), p(0.3, top), p(0.6, -0.72), p(0.3, bot), p(-0.3, bot)], { closed: true, w: 1.3, fill: INK, fillAlpha: 0.88 });
    zigzag(...p(-0.52, top + 0.04), ...p(0.52, top + 0.04), 9, 0.1 * S, { w: 1, color: PAPER });
    zigzag(...p(0.5, bot - 0.03), ...p(-0.5, bot - 0.03), 8, 0.09 * S, { w: 1, color: PAPER });
    for (let i = 0; i < 3; i++) {
      const f = (Ink.t * 0.4 + i / 3) % 1;
      const [nx, ny] = p(0.2 + f * 0.8, -0.75 - f * 0.9 + Math.sin(f * 9 + i) * 0.05);
      stroke([[nx, ny], [nx + 0.12 * S, ny - 0.02 * S], [nx + 0.13 * S, ny + 0.05 * S], [nx + 0.01 * S, ny + 0.07 * S]],
        { closed: true, w: 0.7, fill: PAPER, fillAlpha: 1, step: 0 });
      line(nx + 0.03 * S, ny + 0.025 * S, nx + 0.1 * S, ny + 0.015 * S, { w: 0.5 });
    }
  },
};

// Returns false if there's no drawing for this monster (the caller falls back to its letter).
function drawMonster(m, cx, by, S) {
  const art = MONSTER_ART[m.type];
  if (!art) return false;
  const lift = m.d.ai === 'ghost' ? Math.sin(Ink.t * 2 + m.x) * 0.05 * S : 0;
  if (m.type === 'nibbler') S *= 1.9; // the boss is enormous; it spills over everything around it
  const p = unit(cx, by + lift, S);
  leaning(0.08 * Math.sin(Ink.t * 0.9 + m.x + m.y), by, () => art(p, S, m, m.d.color));
  if (m.stun > 0) dizzy(p, S, m.type === 'nibbler' ? -1.6 : -1.15);
  return true;
}

// ---------------------------------------------------------------------------------------
// Things on the floor. (cx, cy) is the middle of the cell.

const ITEM_ART = {
  potion(cx, cy, S, it, color) {
    const col = color || (it.id ? G.looks.potion[it.id][1] : RED_INK);
    ellipse(cx, cy + 0.1 * S, 0.2 * S, 0.19 * S, { w: 1.1, fill: col, fillAlpha: 0.55 }, 0.03);
    stroke([[cx - 0.06 * S, cy - 0.08 * S], [cx - 0.06 * S, cy - 0.25 * S]], { w: 1 });
    stroke([[cx + 0.06 * S, cy - 0.25 * S], [cx + 0.06 * S, cy - 0.08 * S]], { w: 1 });
    ellipse(cx, cy - 0.29 * S, 0.07 * S, 0.05 * S, { w: 1, fill: '#8a6a3a', fillAlpha: 0.7 });
    dot(cx - 0.05 * S, cy + 0.06 * S, 0.025 * S, PAPER);
    dot(cx + 0.06 * S, cy + 0.13 * S, 0.018 * S, PAPER);
  },
  scroll(cx, cy, S) {
    stroke([[cx - 0.22 * S, cy - 0.16 * S], [cx + 0.2 * S, cy - 0.2 * S], [cx + 0.22 * S, cy + 0.16 * S], [cx - 0.2 * S, cy + 0.2 * S]],
      { closed: true, w: 1, fill: WAX, fillAlpha: 1 });
    spiral(cx - 0.22 * S, cy - 0.16 * S, 0.07 * S, 1.6, { w: 0.8 });
    spiral(cx + 0.22 * S, cy + 0.16 * S, 0.07 * S, 1.6, { w: 0.8 });
    for (let i = 0; i < 3; i++) zigzag(cx - 0.12 * S, cy - 0.08 * S + i * 0.08 * S, cx + 0.12 * S, cy - 0.09 * S + i * 0.08 * S, 5, 0.02 * S, { w: 0.5 });
  },
  food(cx, cy, S, it) {
    ellipse(cx, cy + 0.14 * S, 0.3 * S, 0.08 * S, { w: 1, fill: PAPER, fillAlpha: 1 });
    if (it.id === 'eggs') { // Somebody Else's Breakfast: a fried egg, and toast with one bite gone
      ellipse(cx - 0.08 * S, cy + 0.06 * S, 0.15 * S, 0.09 * S, { w: 0.9, fill: PAPER, fillAlpha: 1 }, 0.18, 4);
      ellipse(cx - 0.09 * S, cy + 0.045 * S, 0.05 * S, 0.04 * S, { w: 0.7, fill: '#d9a514', fillAlpha: 0.85 });
      stroke([[cx + 0.06 * S, cy + 0.1 * S], [cx + 0.1 * S, cy - 0.14 * S], [cx + 0.17 * S, cy - 0.12 * S], [cx + 0.19 * S, cy - 0.17 * S],
        [cx + 0.25 * S, cy - 0.12 * S], [cx + 0.27 * S, cy + 0.08 * S]], { closed: true, w: 0.9, fill: '#b8823a', fillAlpha: 0.5 });
    } else if (it.id === 'ham') { // Pie of Uncertain Origin
      stroke([[cx - 0.22 * S, cy + 0.08 * S], [cx - 0.16 * S, cy - 0.1 * S], [cx, cy - 0.17 * S], [cx + 0.16 * S, cy - 0.1 * S], [cx + 0.22 * S, cy + 0.08 * S]],
        { closed: true, w: 1, fill: '#b8823a', fillAlpha: 0.55 });
      zigzag(cx - 0.22 * S, cy + 0.08 * S, cx + 0.22 * S, cy + 0.08 * S, 6, -0.035 * S, { w: 0.8 });
      for (const dx of [-0.07, 0, 0.07]) line(cx + dx * S, cy - 0.08 * S, cx + dx * 1.3 * S, cy - 0.02 * S, { w: 0.7 });
    } else if (it.id === 'beast') { // Slice of Roast Something
      ellipse(cx, cy + 0.02 * S, 0.2 * S, 0.12 * S, { w: 1, fill: '#8a4a2a', fillAlpha: 0.55 }, 0.1);
      for (const dx of [-0.08, 0, 0.08]) stroke([[cx + dx * S, cy - 0.12 * S], [cx + dx * S + 0.03 * S, cy - 0.2 * S], [cx + dx * S, cy - 0.28 * S]], { w: 0.6, alpha: 0.6 });
      for (const s2 of [-1, 1]) { // nobody will say how many legs it had
        line(cx + s2 * 0.18 * S, cy + 0.02 * S, cx + s2 * 0.29 * S, cy - 0.06 * S, { w: 1.2 });
        dot(cx + s2 * 0.3 * S, cy - 0.07 * S, 0.022 * S, PAPER);
      }
      line(cx, cy - 0.08 * S, cx + 0.02 * S, cy - 0.18 * S, { w: 1.2 });
    } else {
      stroke([[cx - 0.13 * S, cy + 0.12 * S], [cx - 0.16 * S, cy - 0.02 * S], [cx + 0.16 * S, cy - 0.02 * S], [cx + 0.13 * S, cy + 0.12 * S]],
        { closed: true, w: 0.9, fill: '#c9a86a', fillAlpha: 0.5 });
      ellipse(cx, cy - 0.06 * S, 0.18 * S, 0.1 * S, { w: 1, fill: '#8a5a2a', fillAlpha: 0.5 }, 0.12);
      stroke([[cx - 0.05 * S, cy - 0.07 * S], [cx, cy - 0.05 * S], [cx + 0.05 * S, cy - 0.07 * S]], { w: 0.7 }); // it mumbles
    }
  },
  // Weapons and armor are drawn by their id. Unknown gear (say, from a very old grave) falls back
  // to the spork, the nest, or a plain coat.
  weapon(cx, cy, S, it) {
    const id = gearId(it);
    if (id === 'umbrella') {
      stroke([[cx - 0.25 * S, cy - 0.02 * S], [cx - 0.12 * S, cy - 0.22 * S], [cx + 0.12 * S, cy - 0.22 * S], [cx + 0.25 * S, cy - 0.02 * S]],
        { closed: true, w: 1, fill: RED_INK, fillAlpha: 0.4 });
      stroke([[cx, cy - 0.02 * S], [cx, cy + 0.2 * S], [cx + 0.07 * S, cy + 0.24 * S], [cx + 0.09 * S, cy + 0.17 * S]], { w: 1.1 });
    } else if (id === 'shears' || id === 'snipper') {
      line(cx - 0.25 * S, cy - 0.2 * S, cx + 0.18 * S, cy + 0.12 * S, { w: 1.2 });
      line(cx - 0.25 * S, cy + 0.12 * S, cx + 0.18 * S, cy - 0.2 * S, { w: 1.2 });
      ellipse(cx + 0.22 * S, cy + 0.16 * S, 0.06 * S, 0.06 * S, { w: 1 });
      ellipse(cx + 0.22 * S, cy - 0.24 * S, 0.06 * S, 0.06 * S, { w: 1 });
    } else if (id === 'axe') {
      line(cx - 0.22 * S, cy + 0.24 * S, cx + 0.14 * S, cy - 0.22 * S, { w: 1.4 });
      stroke([[cx + 0.06 * S, cy - 0.26 * S], [cx + 0.3 * S, cy - 0.2 * S], [cx + 0.26 * S, cy + 0.04 * S], [cx + 0.08 * S, cy - 0.08 * S]],
        { closed: true, w: 1, fill: '#9a948a', fillAlpha: 0.5 });
      stroke([[cx - 0.1 * S, cy + 0.1 * S], [cx - 0.02 * S, cy + 0.06 * S], [cx + 0.02 * S, cy + 0.12 * S], [cx - 0.06 * S, cy + 0.16 * S]],
        { closed: true, w: 0.7, fill: '#e0c040', fillAlpha: 0.8 }); // a pat of butter
    } else { // the spork (and the Seven-Years Shard, and anything unknown)
      line(cx - 0.24 * S, cy + 0.22 * S, cx + 0.1 * S, cy - 0.12 * S, { w: 1.3 });
      ellipse(cx + 0.15 * S, cy - 0.17 * S, 0.08 * S, 0.06 * S, { w: 1, fill: '#9a948a', fillAlpha: 0.4 });
      for (const d of [-0.04, 0, 0.04]) line(cx + (0.2 + d) * S, cy - 0.22 * S, cx + (0.26 + d) * S, cy - 0.3 * S, { w: 0.7 });
    }
  },
  armor(cx, cy, S, it) {
    const id = gearId(it) || (gearSlot(it) === 'head' ? 'nest' : 'other');
    if (id === 'nest') return drawNest(unit(cx, cy + 0.24 * S, S * 0.8), S * 0.8);
    if (id === 'colander') {
      stroke([[cx - 0.26 * S, cy + 0.1 * S], [cx - 0.2 * S, cy - 0.14 * S], [cx, cy - 0.22 * S], [cx + 0.2 * S, cy - 0.14 * S], [cx + 0.26 * S, cy + 0.1 * S]],
        { closed: true, w: 1, fill: '#9a948a', fillAlpha: 0.55 });
      for (const [hx, hy] of [[-0.1, -0.05], [0, -0.1], [0.1, -0.05], [-0.05, 0.04], [0.06, 0.04]]) dot(cx + hx * S, cy + hy * S, 0.022 * S);
      line(cx - 0.34 * S, cy + 0.06 * S, cx - 0.26 * S, cy + 0.06 * S, { w: 1.3 });
      line(cx + 0.26 * S, cy + 0.06 * S, cx + 0.34 * S, cy + 0.06 * S, { w: 1.3 });
      return;
    }
    const col = COAT_INK[id];
    stroke([[cx - 0.12 * S, cy - 0.26 * S], [cx - 0.3 * S, cy - 0.12 * S], [cx - 0.22 * S, cy - 0.04 * S], [cx - 0.16 * S, cy - 0.1 * S],
      [cx - 0.2 * S, cy + 0.28 * S], [cx + 0.2 * S, cy + 0.28 * S], [cx + 0.16 * S, cy - 0.1 * S], [cx + 0.22 * S, cy - 0.04 * S],
      [cx + 0.3 * S, cy - 0.12 * S], [cx + 0.12 * S, cy - 0.26 * S], [cx, cy - 0.2 * S]], { closed: true, w: 1, fill: col, fillAlpha: 0.4 });
    if (id === 'chainmail') for (let i = 0; i < 3; i++) line(cx - 0.15 * S, cy + i * 0.08 * S, cx + 0.15 * S, cy + i * 0.08 * S, { w: 0.5 });
  },
  gold(cx, cy, S) {
    for (let i = 0; i < 3; i++) ellipse(cx - 0.06 * S, cy + 0.14 * S - i * 0.07 * S, 0.14 * S, 0.05 * S, { w: 0.9, fill: GOLD_INK, fillAlpha: 0.45 });
    ellipse(cx + 0.16 * S, cy + 0.02 * S, 0.06 * S, 0.12 * S, { w: 0.9, fill: GOLD_INK, fillAlpha: 0.45 });
    spiral(cx + 0.16 * S, cy + 0.02 * S, 0.035 * S, 1.2, { w: 0.5 });
  },
  candle(cx, cy, S) { drawCandle(cx, cy + 0.22 * S, 0.2 * S, 0.1 * S, false, S); },
  sock(cx, cy, S, it) { drawSock(cx, cy, S * 0.8, SOCKS[it.id] || RED_INK); },
  pair(cx, cy, S, it) {
    drawSock(cx - 0.1 * S, cy, S * 0.7, SOCKS[it.id] || RED_INK);
    drawSock(cx + 0.1 * S, cy + 0.03 * S, S * 0.7, SOCKS[it.id] || RED_INK);
  },
  bones(cx, cy, S) {
    line(cx - 0.25 * S, cy + 0.2 * S, cx + 0.25 * S, cy + 0.02 * S, { w: 1.4 });
    line(cx - 0.22 * S, cy + 0.02 * S, cx + 0.24 * S, cy + 0.22 * S, { w: 1.4 });
    ellipse(cx, cy - 0.02 * S, 0.14 * S, 0.12 * S, { w: 1, fill: WAX, fillAlpha: 1 });
    dot(cx - 0.05 * S, cy - 0.02 * S, 0.03 * S);
    dot(cx + 0.05 * S, cy - 0.02 * S, 0.03 * S);
  },
};

function drawSock(cx, cy, S, color) {
  stroke([[cx - 0.08 * S, cy - 0.3 * S], [cx - 0.09 * S, cy + 0.08 * S], [cx - 0.02 * S, cy + 0.2 * S], [cx + 0.2 * S, cy + 0.2 * S],
    [cx + 0.2 * S, cy + 0.08 * S], [cx + 0.07 * S, cy + 0.04 * S], [cx + 0.08 * S, cy - 0.3 * S]], { closed: true, w: 1, fill: color, fillAlpha: 0.45 });
  line(cx - 0.085 * S, cy - 0.2 * S, cx + 0.08 * S, cy - 0.2 * S, { w: 1.2, color });
}

// Returns false if there's no drawing for this kind of item.
function drawItem(it, cx, cy, S, color) {
  const art = ITEM_ART[it.kind];
  if (!art) return false;
  art(cx, cy, S, it, color);
  return true;
}

// A musical note for the margin: filled if you still have that rhyme in you.
function drawNote(x, y, size, filled) {
  ellipse(x, y, size * 0.32, size * 0.24, { w: 1, fill: INK, fillAlpha: filled ? 0.9 : 0 }, 0.05);
  line(x + size * 0.3, y - size * 0.02, x + size * 0.32, y - size * 1.1, { w: 1.2 });
  stroke([[x + size * 0.32, y - size * 1.1], [x + size * 0.6, y - size * 0.85], [x + size * 0.55, y - size * 0.6]], { w: 1.2 });
}
