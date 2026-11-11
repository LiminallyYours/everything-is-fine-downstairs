'use strict';
// Ink drawings for the floors themselves: bulging walls with a texture for each floor, sparse
// marks on the ground, water, grass, stairs, and each floor's props and litter.
// Lit cells get full ink; remembered cells get a thin pencil outline.

const WATER_INK = '#2a5aa0', HAIR_INK = '#4a2f1c';
const tileAt = (L, x, y) => (inMap(x, y) ? L.tiles[idx(x, y)] : T.WALL);

function drawTerrain(L, x, y, px, py, S, lit) {
  const t = L.tiles[idx(x, y)];
  if (t === T.WALL) return drawWall(L, x, y, px, py, S, lit);
  if (!lit) {
    if (t === T.STAIRS) drawStairs(px, py, S, false);
    else if (t === T.PROP) pencil(() => drawProp(L, x, y, px, py, S));
    return;
  }
  const seed = hash(x * 31 + y * 17 + L.depth);
  if (t === T.WATER || t === T.DEEP) {
    drawWater(px, py, S, t === T.DEEP, x, y);
    // Bath Time: the drain, turning, once the plug is pulled
    const s = L.surprise;
    if (s && s.kind === 'bath' && s.stage === 'drain' && s.x === x && s.y === y) {
      const pts = [];
      for (let i = 0; i <= 30; i++) {
        const a = (i / 14) * Math.PI * 2 - Ink.t * 3, r = S * 0.42 * (1 - i / 30);
        pts.push([px + S / 2 + Math.cos(a) * r, py + S / 2 + Math.sin(a) * r * 0.8]);
      }
      stroke(pts, { w: 1.1, color: WATER_INK, step: 0 });
      dot(px + S / 2, py + S / 2, S * 0.06, INK);
    }
    return;
  }
  if (t === T.FLOOR && seed < 0.33) floorMark(L.depth, px, py, S, seed, L.floor.floor);
  if (t === T.GRASS) {
    const r = FX.rustles.find(rs => rs.x === x && rs.y === y);
    const sway = Math.sin(Ink.t * 1.5 + x * 0.7) * S * 0.05 + (r ? Math.sin(Ink.t * 30) * S * 0.2 : 0);
    const hair = L.depth === 2; // the Top of Somebody's Head: it isn't grass
    tuft(px + S * 0.3, py + S * 0.92, S * (hair ? 0.62 : 0.5), hair ? 5 : 4, sway, { w: 0.8, color: hair ? HAIR_INK : '#3f6a2a' });
    tuft(px + S * 0.72, py + S * 0.7, S * (hair ? 0.5 : 0.38), hair ? 4 : 3, sway, { w: 0.8, color: hair ? HAIR_INK : '#3f6a2a' });
  }
  if (t === T.DECO) drawDeco(L.depth, px + S / 2, py + S / 2, S, seed, L.floor.deco.color);
  if (t === T.STAIRS) drawStairs(px, py, S, true);
  if (t === T.PROP) drawProp(L, x, y, px, py, S);
}

function pencil(fn) {
  const [a, c, s] = [Ink.alpha, Ink.color, Ink.scratch];
  Ink.alpha = 0.55;
  Ink.color = '#6b6258';
  fn();
  [Ink.alpha, Ink.color, Ink.scratch] = [a, c, s];
}

// Walls: only the faces that touch open ground are drawn, as fat bulging ink lines,
// with the wall's own texture just behind the face.
function drawWall(L, x, y, px, py, S, lit) {
  const open = [tileAt(L, x, y - 1), tileAt(L, x + 1, y), tileAt(L, x, y + 1), tileAt(L, x - 1, y)].map(t => t !== T.WALL);
  if (!open.some(Boolean)) return;
  const f = L.floor, bulge = S * (L.depth === 2 || L.depth === 6 ? 0.14 : 0.06);
  const w = lit ? 1.9 : 0.9, color = lit ? INK : '#6b6258', alpha = lit ? 1 : 0.6;
  if (lit) {
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = f.wall;
    ctx.fillRect(px, py, S, S);
    ctx.globalAlpha = 1;
    wallTexture(L.depth, px, py, S, hash(x * 7 + y * 13), f.wall, open);
  }
  const edges = [
    [[px, py], [px + S, py], [0, -1]], [[px + S, py], [px + S, py + S], [1, 0]],
    [[px + S, py + S], [px, py + S], [0, 1]], [[px, py + S], [px, py], [-1, 0]],
  ];
  edges.forEach(([a, b, [nx, ny]], i) => {
    if (!open[i]) return;
    const mid = [(a[0] + b[0]) / 2 + nx * bulge, (a[1] + b[1]) / 2 + ny * bulge];
    stroke([a, mid, b], { w, color, alpha, step: 0 });
  });
  // The Drawer Closes: the corridor that slid shut is a drawer front, with a knob.
  const s = L.surprise;
  if (lit && s && s.kind === 'drawer' && s.stage === 'closed' && s.x === x && s.y === y) {
    stroke([[px + S * 0.12, py + S * 0.2], [px + S * 0.88, py + S * 0.2], [px + S * 0.88, py + S * 0.8], [px + S * 0.12, py + S * 0.8]],
      { closed: true, w: 1.3, fill: '#b08a5a', fillAlpha: 0.45 });
    ellipse(px + S * 0.5, py + S * 0.5, S * 0.07, S * 0.07, { w: 1, fill: GOLD_INK, fillAlpha: 0.8 });
  }
}

function wallTexture(depth, px, py, S, seed, col, open) {
  const o = { w: 0.7, color: col, alpha: 0.7 };
  switch (depth) {
    case 1: // bricks
      line(px + S * 0.1, py + S * 0.35, px + S * 0.9, py + S * 0.35, o);
      line(px + S * 0.1, py + S * 0.7, px + S * 0.9, py + S * 0.7, o);
      line(px + S * (0.3 + seed * 0.4), py + S * 0.35, px + S * (0.3 + seed * 0.4), py + S * 0.7, o);
      break;
    case 2: // scalp: a few short hairs, combed the same way
      for (let i = 0; i < 4; i++) {
        const hx = px + S * (0.15 + hash(seed + i) * 0.7), hy = py + S * (0.2 + hash(seed + i + 4) * 0.6);
        stroke([[hx, hy], [hx + S * 0.06, hy - S * 0.1], [hx + S * 0.14, hy - S * 0.13]], { w: 0.7, color: HAIR_INK, alpha: 0.7 });
      }
      break;
    case 3: // stacked stones
      ellipse(px + S * 0.5, py + S * 0.5, S * 0.3, S * 0.22, o, 0.1, seed * 9);
      break;
    case 4: { // wet rock, crusted with barnacles (not wavy: wavy means water)
      const rock = { w: 0.7, color: '#5d544b', alpha: 0.7 };
      ellipse(px + S * (0.35 + seed * 0.3), py + S * 0.45, S * 0.26, S * 0.18, rock, 0.18, seed * 7);
      for (let i = 0; i < 3; i++) {
        const bx = px + S * (0.2 + hash(seed + i) * 0.6), by = py + S * (0.2 + hash(seed + i + 3) * 0.6);
        stroke([[bx - S * 0.05, by], [bx, by - S * 0.05], [bx + S * 0.05, by]], { w: 0.7, color: '#5d544b', step: 0 });
      }
      break;
    }
    case 5: // striped wallpaper
      for (const fx of [0.2, 0.6]) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = col;
        ctx.fillRect(px + S * fx, py, S * 0.18, S);
        ctx.globalAlpha = 1;
      }
      break;
    case 6: // gums
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#a3192b';
      ctx.fillRect(px, py, S, S);
      ctx.globalAlpha = 1;
      if (open[2]) zigzag(px + S * 0.1, py + S * 0.85, px + S * 0.9, py + S * 0.85, 3, -S * 0.12, { w: 0.9 });
      break;
  }
}

function floorMark(depth, px, py, S, seed, col) {
  const cx = px + S * (0.25 + seed * 1.5), cy = py + S * (0.3 + hash(seed * 99) * 0.5);
  const o = { w: 0.6, color: col, alpha: 0.6 };
  switch (depth) {
    case 1: dot(cx, cy, S * 0.018, col); dot(cx + S * 0.08, cy + S * 0.04, S * 0.015, col); break;
    case 2: stroke([[cx, cy + S * 0.05], [cx + S * 0.02, cy - S * 0.04], [cx + S * 0.06, cy - S * 0.07]], o); break;
    case 3: stroke([[cx - S * 0.12, cy], [cx - S * 0.02, cy + S * 0.03], [cx + S * 0.03, cy - S * 0.03], [cx + S * 0.12, cy + S * 0.01]], o); break;
    case 4: for (let i = 0; i < 3; i++) dot(cx + i * S * 0.05, cy + (i % 2) * S * 0.03, S * 0.012, col); break;
    case 5: stroke([[cx, cy - S * 0.08], [cx + S * 0.08, cy], [cx, cy + S * 0.08], [cx - S * 0.08, cy]], Object.assign({ closed: true }, o)); break;
    case 6: stroke([[cx - S * 0.06, cy], [cx, cy - S * 0.04], [cx + S * 0.06, cy]], o); break;
  }
}

function drawWater(px, py, S, deep, x, y) {
  ctx.globalAlpha = deep ? 0.32 : 0.16;
  ctx.fillStyle = WATER_INK;
  ctx.fillRect(px, py, S, S);
  ctx.globalAlpha = 1;
  const n = deep ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const yy = py + S * ((i + 0.6) / (n + 0.2)), ph = Ink.t * 1.4 + x * 0.9 + i * 2;
    const pts = [];
    for (let k = 0; k <= 4; k++) pts.push([px + (S * k) / 4, yy + Math.sin(ph + k * 1.6) * S * 0.04]);
    stroke(pts, { w: 0.7, color: WATER_INK, alpha: deep ? 0.9 : 0.7, step: 0 });
  }
}

function drawStairs(px, py, S, lit) {
  const cx = px + S / 2, cy = py + S * 0.58;
  if (lit) ellipse(cx, cy, S * 0.4, S * 0.26, { w: 1.4, fill: INK, fillAlpha: 0.92 }, 0.06);
  else ellipse(cx, cy, S * 0.4, S * 0.26, { w: 0.9, color: '#6b6258', alpha: 0.7 });
  if (!lit) return;
  for (let i = 0; i < 3; i++) {
    const r = 0.36 - i * 0.1, rot = Ink.t * 0.4 + i;
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const a = rot + (k / 6) * Math.PI;
      pts.push([cx + Math.cos(a) * S * r, cy + Math.sin(a) * S * r * 0.62]);
    }
    stroke(pts, { w: 0.8, color: PAPER, alpha: 0.8, step: 0, noScratch: true });
  }
}

function drawDeco(depth, cx, cy, S, seed, col) {
  const o = { w: 0.8, color: col };
  const jx = (seed - 0.5) * S * 0.4;
  cx += jx;
  switch (depth) {
    case 1:
      for (let i = 0; i < 4; i++) dot(cx + (hash(seed + i) - 0.5) * S * 0.3, cy + (hash(seed + i + 5) - 0.5) * S * 0.3, S * 0.02, col);
      break;
    case 2: // stray flakes
      for (let i = 0; i < 3; i++) {
        ellipse(cx + (hash(seed + i) - 0.5) * S * 0.34, cy + (hash(seed + i + 5) - 0.5) * S * 0.3, S * 0.035, S * 0.022,
          { w: 0.6, color: '#8a7f6e', fill: PAPER, fillAlpha: 1 }, 0.3, seed * 9 + i);
      }
      break;
    case 3:
      line(cx - S * 0.1, cy, cx + S * 0.1, cy, o);
      for (const s of [-1, 1]) {
        dot(cx + s * S * 0.11, cy - S * 0.025, S * 0.025, col);
        dot(cx + s * S * 0.11, cy + S * 0.025, S * 0.025, col);
      }
      break;
    case 4: spiral(cx, cy, S * 0.08, 2, o); break;
    case 5:
      ellipse(cx, cy, S * 0.07, S * 0.07, o);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        line(cx + Math.cos(a) * S * 0.07, cy + Math.sin(a) * S * 0.07, cx + Math.cos(a) * S * 0.1, cy + Math.sin(a) * S * 0.1, { w: 0.6, color: col });
      }
      break;
    case 6:
      stroke([[cx - S * 0.08, cy - S * 0.05], [cx + S * 0.08, cy - S * 0.06], [cx + S * 0.09, cy + S * 0.05], [cx - S * 0.07, cy + S * 0.06]],
        Object.assign({ closed: true, fill: PAPER, fillAlpha: 1 }, o));
      zigzag(cx - S * 0.04, cy, cx + S * 0.05, cy, 2, S * 0.015, { w: 0.5, color: col });
      break;
  }
}

function drawProp(L, x, y, px, py, S) {
  const p = unit(px + S / 2, py + S * 0.9, S), col = L.floor.prop.color, by = py + S * 0.9;
  switch (L.depth) {
    case 1: drawBarrel(p, S, false); break;
    case 2: { // a cowlick: a tuft that will not lie down, however it is combed
      const dir = hash(x * 3.7 + y) < 0.5 ? -1 : 1, sway = Math.sin(Ink.t * 1.3 + x) * 0.03;
      for (let i = 0; i < 6; i++) {
        const bx = -0.2 + i * 0.08, k = i / 5;
        stroke([p(bx, 0), p(bx * 0.6 + sway, -0.5 - k * 0.1), p(dir * (0.02 + k * 0.1) + sway * 2, -0.95 - k * 0.12),
          p(dir * (0.22 + k * 0.12) + sway * 3, -1.02 - k * 0.1), p(dir * (0.3 + k * 0.1) + sway * 3, -0.86 - k * 0.06)], { w: 1.2, color: HAIR_INK });
      }
      break;
    }
    case 3: // a tiny tombstone for a sock
      stroke([p(-0.26, 0), p(-0.26, -0.55), p(-0.12, -0.78), p(0.12, -0.78), p(0.26, -0.55), p(0.26, 0)],
        { closed: true, w: 1.2, fill: '#8a847a', fillAlpha: 0.3 });
      drawSock(...p(0, -0.36), S * 0.7, col);
      break;
    case 4: // coral, quietly crying
      for (const s of [-1, 0, 1]) stroke([p(0, 0), p(s * 0.12, -0.4), p(s * 0.25, -0.7), p(s * 0.2, -0.9)], { w: 1.3, color: col });
      stroke([p(0.12, -0.4), p(0.3, -0.5)], { w: 1, color: col });
      {
        const f = (Ink.t * 0.5 + x * 0.3) % 1;
        const [dx, dy] = p(0.25, -0.85 + f * 0.8);
        ellipse(dx, dy, S * 0.025, S * 0.04, { w: 0.6, color: WATER_INK, fill: WATER_INK, fillAlpha: 0.5 });
      }
      break;
    case 5: // an empty crib, still rocking
      leaning(Math.sin(Ink.t * 2 + x) * 0.15, by, () => {
        stroke([p(-0.4, -0.05), p(0, 0.06), p(0.4, -0.05)], { w: 1.4 });
        stroke([p(-0.32, -0.12), p(-0.32, -0.62), p(0.32, -0.62), p(0.32, -0.12)], { closed: true, w: 1.1, fill: col, fillAlpha: 0.15 });
        for (let i = 1; i < 5; i++) line(...p(-0.32 + i * 0.128, -0.62), ...p(-0.32 + i * 0.128, -0.12), { w: 0.7 });
      });
      break;
    case 6: // a heap of forgotten names
      for (let i = 0; i < 5; i++) {
        const [tx, ty] = p(-0.25 + hash(i + x) * 0.4, -0.12 - i * 0.1);
        stroke([[tx, ty], [tx + S * 0.2, ty - S * 0.03], [tx + S * 0.21, ty + S * 0.07], [tx + S * 0.01, ty + S * 0.1]],
          { closed: true, w: 0.8, fill: PAPER, fillAlpha: 1, step: 0 });
        zigzag(tx + S * 0.04, ty + S * 0.04, tx + S * 0.16, ty + S * 0.03, 3, S * 0.012, { w: 0.5 });
      }
      break;
  }
}
