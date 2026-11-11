'use strict';
// The odd rooms, drawn: one picture per room, keyed by the room's id (the words are in
// content/vignette-words.js, what each choice does in rules/vignettes.js). Each is drawn larger
// than a cell on the map, and again on the room's page. `fx` is the room on the map: what you
// did there (blown, took, smashed, empty, wound, closed, used) changes the picture.

const WAX_FIGURE = '#e8dcc0'; // the wax you in the Birthday Room

const VIGNETTE_ART = {
  teaparty(cx, by, S, fx) {
    const p = unit(cx, by, S);
    // an empty chair, waiting for you
    stroke([p(-1.05, 0), p(-1.1, -0.95), p(-0.85, -1.0), p(-0.8, -0.45)], { w: 1.1 });
    line(...p(-1.05, -0.45), ...p(-0.8, -0.45), { w: 1 });
    // the guest, asleep
    ellipse(...p(0.85, -1.05), 0.2 * S, 0.18 * S, { w: 1.1, fill: '#9fb4a0', fillAlpha: 0.4 }, 0.08);
    for (const ex of [0.79, 0.92]) stroke([p(ex - 0.04, -1.07), p(ex, -1.04), p(ex + 0.04, -1.07)], { w: 0.9 });
    if (!fx.used || Math.sin(Ink.t) > -2) {
      const z = (Ink.t * 0.6) % 1;
      const [zx, zy] = p(1.15 + z * 0.2, -1.4 - z * 0.4);
      stroke([[zx, zy], [zx + S * 0.1, zy], [zx, zy + S * 0.1], [zx + S * 0.1, zy + S * 0.1]], { w: 0.9, step: 0, alpha: 1 - z });
    }
    // the table and its cloth
    stroke([p(-0.95, -0.45), p(0.95, -0.45), p(0.9, -0.28), p(-0.9, -0.28)], { closed: true, w: 1.2, fill: PAPER, fillAlpha: 1 });
    zigzag(...p(-0.9, -0.28), ...p(0.9, -0.28), 8, 0.06 * S, { w: 0.9, color: RED_INK });
    for (const lx of [-0.75, 0.75]) line(...p(lx, -0.28), ...p(lx * 1.08, 0), { w: 1.2 });
    // teapot, steam, cups
    ellipse(...p(-0.4, -0.6), 0.2 * S, 0.15 * S, { w: 1.1, fill: '#4fa8a0', fillAlpha: 0.4 });
    stroke([p(-0.58, -0.62), p(-0.72, -0.7), p(-0.78, -0.8)], { w: 1.1 });
    stroke([p(-0.22, -0.66), p(-0.1, -0.64), p(-0.2, -0.52)], { w: 1 });
    dot(...p(-0.4, -0.77), 0.03 * S);
    for (let i = 0; i < 2; i++) {
      const sx0 = -0.72 + i * 0.08, ph = Ink.t * 2 + i;
      stroke([p(sx0, -0.86), p(sx0 + 0.05 * Math.sin(ph), -1.0), p(sx0 - 0.04 * Math.sin(ph), -1.14)], { w: 0.7, alpha: 0.6 });
    }
    for (const cxu of [0.05, 0.35, 0.62]) {
      ellipse(...p(cxu, -0.47), 0.11 * S, 0.03 * S, { w: 0.8, fill: PAPER, fillAlpha: 1 });
      stroke([p(cxu - 0.07, -0.49), p(cxu - 0.05, -0.6), p(cxu + 0.05, -0.6), p(cxu + 0.07, -0.49)], { w: 0.9, fill: PAPER, fillAlpha: 1 });
    }
  },

  birthday(cx, by, S, fx) {
    const p = unit(cx, by, S);
    // bunting across the top
    stroke([p(-1.1, -1.55), p(0, -1.4), p(1.1, -1.55)], { w: 0.8 });
    for (let i = 0; i < 6; i++) {
      const f = -0.95 + i * 0.38, yy = -1.5 + Math.abs(f) * -0.05 + 0.1 * (1 - Math.abs(f));
      stroke([p(f - 0.1, yy), p(f + 0.1, yy), p(f, yy + 0.22)], { closed: true, w: 0.7, fill: i % 2 ? RED_INK : '#1d6b66', fillAlpha: 0.45 });
    }
    // the cake
    stroke([p(-0.5, 0), p(-0.5, -0.35), p(0.4, -0.35), p(0.4, 0)], { closed: true, w: 1.2, fill: '#f0c8d0', fillAlpha: 0.7 });
    stroke([p(-0.35, -0.35), p(-0.35, -0.6), p(0.25, -0.6), p(0.25, -0.35)], { closed: true, w: 1.1, fill: '#f0c8d0', fillAlpha: 0.7 });
    zigzag(...p(-0.5, -0.33), ...p(0.4, -0.33), 6, 0.06 * S, { w: 0.8, color: PAPER });
    for (let i = 0; i < 4; i++) {
      const [x, y] = p(-0.27 + i * 0.16, -0.6);
      drawCandle(x, y, S * 0.14, S * 0.04, !fx.blown && !fx.took, S * 0.5);
    }
    if (S > 70) {
      ctx.font = `italic ${Math.round(S * 0.1)}px ${FONT_VERSE}`;
      ctx.fillStyle = RED_INK;
      ctx.textAlign = 'center';
      ctx.fillText('happy deathday', ...p(-0.05, -0.13));
    }
    // the wax you, with a party balloon
    const [wx, wy] = p(0.95, 0);
    const [c, a] = [Ink.color, Ink.alpha];
    drawPlayer(wx, wy, S * 0.9, { body: WAX_FIGURE, noCandle: true });
    Ink.color = c;
    Ink.alpha = a;
    const turned = fx.took ? -0.06 : 0;
    const bob = Math.sin(Ink.t * 1.1) * 0.02;
    stroke([p(1.22, -0.42), p(1.3 + turned, -0.8), p(1.33 + turned + bob, -1.08)], { w: 0.7 });
    ellipse(...p(1.34 + turned + bob, -1.28), 0.17 * S, 0.2 * S, { w: 1, fill: '#1d6b66', fillAlpha: 0.5 }, 0.03);
    stroke([p(1.31 + turned + bob, -1.08), p(1.33 + turned + bob, -1.05), p(1.36 + turned + bob, -1.08)], { w: 0.8 });
  },

  mirror(cx, by, S, fx) {
    const p = unit(cx, by, S);
    line(...p(-0.22, 0), ...p(-0.12, -0.2), { w: 1.2 });
    line(...p(0.22, 0), ...p(0.12, -0.2), { w: 1.2 });
    ellipse(...p(0, -0.95), 0.36 * S, 0.78 * S, { w: 2.2, fill: '#b8c8d8', fillAlpha: fx.smashed ? 0.1 : 0.28 }, 0.02);
    spiral(...p(0, -1.8), 0.1 * S, 1.5, { w: 1 });
    spiral(...p(0, -0.14), 0.07 * S, 1.3, { w: 0.9 });
    if (fx.smashed) {
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9 + 0.3;
        stroke([p(0.05, -1.0), p(0.05 + Math.cos(a) * 0.3, -1.0 + Math.sin(a) * 0.6)], { w: 0.8 });
      }
      return;
    }
    if (!fx.empty) {
      // your reflection: the same, except its candle is not lit
      const a = Ink.alpha;
      Ink.alpha *= 0.55;
      drawPlayer(...p(0, -0.3), S * 0.8, { wick: 0 });
      Ink.alpha = a;
    }
    line(...p(-0.2, -1.4), ...p(-0.05, -1.55), { w: 0.8, color: PAPER, noScratch: true });
    line(...p(-0.22, -1.25), ...p(0.02, -1.5), { w: 0.8, color: PAPER, noScratch: true });
  },

  lostfound(cx, by, S) {
    const p = unit(cx, by, S);
    // the clerk, behind the desk
    ellipse(...p(0.05, -1.05), 0.17 * S, 0.16 * S, { w: 1.1, fill: WAX, fillAlpha: 1 }, 0.06);
    ellipse(...p(-0.01, -1.07), 0.04 * S, 0.05 * S, { w: 0.8, fill: INK, fillAlpha: 0.9 });
    ellipse(...p(0.11, -1.07), 0.04 * S, 0.05 * S, { w: 0.8, fill: INK, fillAlpha: 0.9 });
    zigzag(...p(-0.04, -0.95), ...p(0.14, -0.95), 3, 0.025 * S, { w: 0.7 });
    for (let i = 0; i < 3; i++) stroke([p(-0.12, -0.8 + i * 0.08), p(0.05, -0.78 + i * 0.08), p(0.22, -0.8 + i * 0.08)], { w: 0.8 });
    line(...p(0.05, -0.88), ...p(0.05, -0.6), { w: 1 });
    // the desk, the bell, the sign
    stroke([p(-0.6, 0), p(-0.6, -0.55), p(0.6, -0.55), p(0.6, 0)], { closed: true, w: 1.2, fill: '#8a5a2a', fillAlpha: 0.35 });
    line(...p(-0.6, -0.42), ...p(0.6, -0.42), { w: 0.8 });
    stroke([p(0.3, -0.56), p(0.34, -0.66), p(0.46, -0.66), p(0.5, -0.56)], { closed: true, w: 0.9, fill: GOLD_INK, fillAlpha: 0.5 });
    dot(...p(0.4, -0.7), 0.025 * S);
    line(...p(-0.45, -0.55), ...p(-0.45, -1.35), { w: 1 });
    stroke([p(-0.8, -1.35), p(-0.1, -1.38), p(-0.1, -1.6), p(-0.8, -1.58)], { closed: true, w: 1, fill: PAPER, fillAlpha: 1 });
    if (S > 70) {
      ctx.font = `600 ${Math.round(S * 0.1)}px ${FONT_VERSE}`;
      ctx.fillStyle = RED_INK;
      ctx.textAlign = 'center';
      ctx.fillText('LOST & FOUND', ...p(-0.45, -1.43));
    } else {
      zigzag(...p(-0.72, -1.48), ...p(-0.18, -1.49), 5, 0.02 * S, { w: 0.7, color: RED_INK });
    }
    // things nobody came back for
    drawSock(...p(-0.8, -0.1), S * 0.5, RED_INK);
    line(...p(0.75, 0), ...p(0.9, -0.7), { w: 1.1 });
    stroke([p(0.72, -0.62), p(0.9, -0.8), p(1.08, -0.62)], { w: 1, fill: '#1d6b66', fillAlpha: 0.35 });
  },

  well(cx, by, S, fx) {
    const p = unit(cx, by, S);
    line(...p(-0.42, -0.5), ...p(-0.4, -1.4), { w: 1.3 });
    line(...p(0.42, -0.5), ...p(0.4, -1.4), { w: 1.3 });
    stroke([p(-0.6, -1.3), p(0, -1.75), p(0.6, -1.3)], { closed: true, w: 1.2, fill: '#8a5a2a', fillAlpha: 0.35 });
    line(...p(0.1, -1.38), ...p(0.1, -0.9), { w: 0.7 });
    stroke([p(0.02, -0.9), p(0.18, -0.9), p(0.16, -0.75), p(0.04, -0.75)], { closed: true, w: 0.9, fill: '#8a847a', fillAlpha: 0.4 });
    stroke([p(-0.55, 0), p(-0.55, -0.5), p(0.55, -0.5), p(0.55, 0)], { closed: true, w: 1.3, fill: '#8a847a', fillAlpha: 0.3 });
    for (let i = 0; i < 4; i++) ellipse(...p(-0.38 + i * 0.25, -0.22 - (i % 2) * 0.12), 0.1 * S, 0.06 * S, { w: 0.7 }, 0.2, i);
    ellipse(...p(0, -0.5), 0.55 * S, 0.14 * S, { w: 1.3, fill: INK, fillAlpha: 0.92 });
    const n = fx.used ? 4 : 1;
    for (let i = 0; i < n; i++) {
      if ((FX.now + i * 700) % 2800 < 150) continue;
      const [ex, ey] = p(-0.25 + i * 0.16, -0.5 + (i % 2) * 0.04);
      drawEyes(ex, ey, S * 0.12, '#ffd84a');
    }
  },

  musicbox(cx, by, S, fx) {
    const p = unit(cx, by, S);
    line(...p(-0.3, 0), ...p(-0.25, -0.35), { w: 1.1 });
    line(...p(0.3, 0), ...p(0.25, -0.35), { w: 1.1 });
    stroke([p(-0.4, -0.35), p(0.4, -0.35), p(0.4, -0.7), p(-0.4, -0.7)], { closed: true, w: 1.2, fill: '#8a3a5a', fillAlpha: 0.35 });
    if (fx.smashed) {
      zigzag(...p(-0.4, -0.7), ...p(0.4, -0.72), 5, 0.1 * S, { w: 1 });
      return;
    }
    if (!fx.closed) {
      stroke([p(-0.4, -0.7), p(-0.45, -1.2), p(0.35, -1.25), p(0.4, -0.7)], { closed: true, w: 1, fill: '#8a3a5a', fillAlpha: 0.2 });
      const spin = Math.sin(Ink.t * (fx.wound ? 4 : 1.5));
      const [dx, dy] = p(0, -0.72);
      line(dx, dy, dx, dy - S * 0.3, { w: 1 });
      ellipse(dx, dy - S * 0.36, S * 0.05, S * 0.05, { w: 0.9, fill: PAPER, fillAlpha: 1 });
      zigzag(dx - S * 0.14 * Math.abs(spin) - S * 0.03, dy - S * 0.16, dx + S * 0.14 * Math.abs(spin) + S * 0.03, dy - S * 0.16, 4, S * 0.05, { w: 0.9, color: RED_INK });
      line(dx, dy - S * 0.27, dx + spin * S * 0.12, dy - S * 0.4, { w: 0.8 });
      for (let i = 0; i < 2; i++) {
        const f = (Ink.t * 0.4 + i * 0.5) % 1;
        drawNote(...p(0.35 + f * 0.4, -0.9 - f * 0.8), S * 0.14, i === 0);
      }
    }
    const k = Ink.t * (fx.wound ? 6 : 2);
    line(...p(0.4, -0.52), ...p(0.52, -0.52), { w: 1 });
    line(...p(0.52, -0.52), p(0.52, -0.52)[0] + Math.cos(k) * S * 0.08, p(0.52, -0.52)[1] + Math.sin(k) * S * 0.08, { w: 1.1 });
  },

  namepile(cx, by, S) {
    const p = unit(cx, by, S);
    stroke([p(-0.8, 0), p(-0.5, -0.5), p(0, -0.75), p(0.5, -0.5), p(0.8, 0)], { closed: true, w: 1.2, fill: '#c8b89a', fillAlpha: 0.35 });
    for (let i = 0; i < 12; i++) {
      const u = hash(i + 3) * 1.3 - 0.65, v = -0.1 - hash(i + 9) * (0.6 - Math.abs(u) * 0.6);
      const [tx, ty] = p(u, v);
      stroke([[tx, ty], [tx + S * 0.16, ty - S * 0.03], [tx + S * 0.17, ty + S * 0.05], [tx + S * 0.01, ty + S * 0.08]], { closed: true, w: 0.7, fill: PAPER, fillAlpha: 1, step: 0 });
      zigzag(tx + S * 0.03, ty + S * 0.03, tx + S * 0.13, ty + S * 0.02, 3, S * 0.01, { w: 0.5 });
    }
  },
};
