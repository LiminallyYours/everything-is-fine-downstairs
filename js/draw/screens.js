'use strict';
// The title page, the splash, the bestiary book, and the typewritten cards laid over the page:
// pockets, help, the log, and the graveyard.

let tagline = RNG.pick(TEXT.taglines);

function drawSplash() {
  Ink.calm(60);
  drawCandle(W / 2, H * 0.5, H * 0.12, 22, true, 90);
  ellipse(W / 2, H * 0.5 + 3, 46, 7, { w: 1, fill: '#8a847a', fillAlpha: 0.3 });
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  serif(clamp(H * 0.04, 20, 40));
  ctx.fillStyle = INK;
  ctx.fillText(Phone.on ? TEXT.ui.phone.splash : TEXT.ui.splash.press, W / 2, H * 0.64);
  serif(clamp(H * 0.028, 15, 26), 'italic');
  ctx.fillStyle = C.gray;
  ctx.fillText(TEXT.ui.splash.dare, W / 2, H * 0.64 + H * 0.05);
  serif(clamp(H * 0.018, 11, 16), 'italic');
  ctx.fillStyle = C.dim;
  ctx.fillText(TEXT.ui.splash.best, W / 2, H * 0.9);
}

function drawTitle() {
  if (Phone.on) return drawPhoneTitle(); // js/draw/phone.js
  const U = TEXT.ui.title;
  Ink.setMood(0.15, 60);
  Ink.leanY = H * 0.3;
  const S = clamp(H * 0.26, 110, 240), cx = W / 2, by = H * 0.36;
  // somebody who went down before you
  ellipse(cx, by + S * 0.13, S * 0.3, S * 0.22, { w: 1.6, fill: PAPER, fillAlpha: 1 }, 0.05);
  for (const ex of [-0.11, 0.11]) {
    line(cx + (ex - 0.04) * S, by + 0.08 * S, cx + (ex + 0.04) * S, by + 0.16 * S, { w: 1.4 });
    line(cx + (ex + 0.04) * S, by + 0.08 * S, cx + (ex - 0.04) * S, by + 0.16 * S, { w: 1.4 });
  }
  zigzag(cx - 0.08 * S, by + 0.24 * S, cx + 0.08 * S, by + 0.24 * S, 3, 0.02 * S, { w: 1.2 });
  stroke([[cx - S * 0.02, by - S * 0.08], [cx + S * 0.03, by - S * 0.24], [cx + S * 0.17, by - S * 0.29], [cx + S * 0.24, by - S * 0.2], [cx + S * 0.14, by - S * 0.15]], { w: 1.6 });
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const ts = clamp(H * 0.075, 32, 80);
  ctx.font = `italic ${Math.round(ts)}px ${FONT_TITLE}`;
  const a = U.before, b = U.rot;
  const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width, tx = cx - (wa + wb) / 2, ty = by + S * 0.66;
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.fillText(a, tx, ty);
  ctx.fillStyle = C.red;
  ctx.fillText(b, tx + wa, ty);
  ctx.textAlign = 'center';
  serif(clamp(H * 0.026, 14, 24), 'italic');
  ctx.fillStyle = C.gray;
  ctx.fillText(U.subtitle, cx, ty + ts * 0.62);
  serif(clamp(H * 0.019, 12, 17), 'italic');
  ctx.fillStyle = C.dim;
  ctx.fillText(tagline, cx, ty + ts * 1.05);
  let menu = U.menu;
  if (savedRun) {
    const who = phrase('somebody', { n: savedRun.runNo });
    menu = [['C', fill(U.carryOn, { who, n: savedRun.depth })], ['Enter', fill(U.beginAgain, { who })]].concat(menu.slice(1));
  }
  const ms = clamp(H * 0.027, 15, 24);
  menu.forEach(([k, label], i) => {
    const y = ty + ts * 1.8 + i * ms * 1.6;
    serif(ms, 'bold');
    ctx.textAlign = 'right';
    ctx.fillStyle = C.red;
    ctx.fillText(k, cx - ms * 0.6, y);
    serif(ms);
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.fillText(label, cx + ms * 0.3, y);
  });
  const lost = Store.load('graveyard', []).filter(g => !g.won);
  const onOne = lost.filter(g => g.depth === 1).length;
  ctx.textAlign = 'center';
  serif(clamp(H * 0.019, 12, 17), 'italic');
  ctx.fillStyle = C.gray;
  let note = lost.length ? fill(U.lost, { n: lost.length }) : U.noneLost;
  if (onOne >= 3) note += fill(U.floorOne, { n: onOne });
  else if (lost.length) note += fill(U.recent, { run: lost[lost.length - 1].run, killer: lost[lost.length - 1].killer });
  ctx.fillText(note, cx, H * 0.92);
  ctx.fillStyle = C.dim;
  ctx.fillText(fill(U.settings, { mute: Sound.muted ? U.unmute : U.mute, voice: Voice.on ? U.on : U.off, calm: FX.reduced ? U.on : U.off }), cx, H * 0.96);
}

function drawBestiary() {
  const seen = bestiarySeen(), U = TEXT.ui.bestiary;
  if (!seen.length) {
    ctx.textAlign = 'center';
    serif(clamp(H * 0.03, 16, 28), 'italic');
    ctx.fillStyle = INK;
    const lines = s => (Phone.on ? wrapPx(s, W * 0.86) : [s]); // a phone is too narrow for one line
    lines(U.empty).forEach((l, i) => ctx.fillText(l, W / 2, H * 0.45 + i * 30));
    serif(clamp(H * 0.022, 13, 20), 'italic');
    ctx.fillStyle = C.gray;
    lines(U.wait).forEach((l, i) => ctx.fillText(l, W / 2, H * 0.52 + (Phone.on ? 30 : 0) + i * 24));
    pagePrompt(U.close);
    return;
  }
  G.bestSel = clamp(G.bestSel, 0, seen.length - 1);
  if (!G.page || G.page.style !== 'beast' || G.page.title !== MONSTERS[seen[G.bestSel]].name) showBeastPage(seen[G.bestSel], true);
  drawPage(G.page);
  ctx.textAlign = 'right';
  serif(Phone.on ? sm(14) : 14, 'italic');
  ctx.fillStyle = C.dim;
  ctx.fillText(fill(U.page, { n: G.bestSel + 1, seen: seen.length, all: Object.keys(BESTIARY).length }), W - 24, 30 + (Phone.on ? Safe.t : 0));
}

function drawInventory() {
  const p = G.player, target = G.useTarget, U = TEXT.ui.pockets;
  const x0 = 3, y0 = 2, w = 54, h = 27;
  box(x0, y0, w, h, target ? fill(U.useOn, { m: target.d.name }) : fill(U.title, { n: p.inv.length, of: RULES.player.pockets }));
  if (!p.inv.length) text(x0 + 3, y0 + 2, U.empty, C.gray);
  const rows = pocketRows(p);
  rows.forEach(({ it, idx: all }, i) => {
    const y = y0 + 2 + i, sel = i === G.invSel;
    const name = cap(all.length > 1 ? fill(U.count, { name: itemName(it), n: all.length }) : itemName(it));
    if (sel) for (let x = x0 + 1; x < x0 + w - 1; x++) put(x, y, ' ', null, C.select);
    text(x0 + 2, y, slotKey(i) + ')', sel ? C.red : C.gray);
    Ink.calm(cellH * 1.4);
    drawItem(it, GRID_X + (x0 + 6.5) * cellW, (y + 0.5) * cellH, cellH * 1.3);
    gridFont();
    const tag = target && it.kind === 'potion' ? U.throwTag : gearSlot(it) ? fill(U.wearTag, { slot: gearSlot(it) }) : '';
    text(x0 + 9, y, trunc(name, w - 11 - tag.length), sel ? C.white : C.ink);
    if (tag) text(x0 + 9 + Math.min(name.length, w - 11 - tag.length), y, tag, target && it.kind === 'potion' ? C.red : C.gray);
  });
  const it = rows[G.invSel] && rows[G.invSel].it;
  if (it) wrap(itemDesc(it), w - 6).slice(0, 3).forEach((ln, k) => text(x0 + 3, y0 + 13 + k, ln, C.teal));
  const stats = [
    fill(U.level, { level: p.level, xp: p.xp, next: p.xpNext }),
    fill(U.numbers, { atk: playerAtk(), def: playerDef(), gold: p.gold }),
    fill(U.floor, { floor: phrase('floorOf', { n: G.depth, of: FLOORS.length }), name: G.level.floor.name }),
    U.gear,
  ];
  stats.forEach((s2, k) => text(x0 + 3, y0 + 17 + k, trunc(s2, w - 6), k < 3 ? C.gray : C.blue));
  text(x0 + 2, y0 + h - 3, target ? U.keysUse : U.keys, C.gray);
  text(x0 + 2, y0 + h - 2, U.keys2, C.gray);
}

// What you wear and wield: four slots, apart from your pockets. Changing takes a turn each.
function drawGear() {
  const p = G.player, U = TEXT.ui.gear;
  const x0 = 3, y0 = 2, w = 54, h = 27;
  box(x0, y0, w, h, U.title);
  SLOTS.forEach(([slot, label], i) => {
    const y = y0 + 2 + i * 2, sel = i === G.gearSel, it = p.gear[slot];
    if (sel) for (let yy = y; yy <= y + 1; yy++) for (let x = x0 + 1; x < x0 + w - 1; x++) put(x, yy, ' ', null, C.select);
    text(x0 + 2, y, label, sel ? C.red : C.gray);
    Ink.calm(cellH * 1.6);
    Ink.alpha = it ? 1 : 0.3;
    drawItem(it || BLANK_GEAR[slot],
      GRID_X + (x0 + 16.5) * cellW, (y + 0.7) * cellH, cellH * 1.5);
    Ink.alpha = 1;
    gridFont();
    text(x0 + 19, y, trunc(it ? cap(itemName(it)) : TEXT.items.empty[slot], w - 22), it ? (sel ? C.white : C.ink) : C.gray);
    text(x0 + 19, y + 1, it ? fill(slot === 'hand' ? U.attack : U.defense, { n: gearBonus(it) }) : U.nothing, C.dim);
  });
  const [slot, label] = SLOTS[G.gearSel];
  const fits = gearCandidates(slot);
  let y = y0 + 11;
  text(x0 + 2, y++, fill(U.from, { slot: label.toLowerCase() }), C.gray);
  if (!fits.length) text(x0 + 4, y++, U.none, C.dim);
  fits.slice(0, 7).forEach((i, k) => {
    const it = p.inv[i], diff = gearBonus(it) - gearBonus(p.gear[slot]);
    text(x0 + 4, y, `${k + 1})`, C.red);
    Ink.calm(cellH * 1.4);
    drawItem(it, GRID_X + (x0 + 8.5) * cellW, (y + 0.5) * cellH, cellH * 1.3);
    gridFont();
    text(x0 + 11, y, trunc(cap(itemName(it)), w - 22), C.ink);
    const verdict = diff > 0 ? fill(U.better, { n: diff }) : diff < 0 ? fill(U.worse, { n: diff }) : U.same;
    text(x0 + w - 2 - verdict.length, y, verdict, diff > 0 ? C.green : diff < 0 ? C.red : C.dim);
    y++;
  });
  text(x0 + 3, y0 + h - 5, fill(U.numbers, { atk: playerAtk(), def: playerDef() }), C.ink);
  text(x0 + 3, y0 + h - 4, U.turn, C.dim);
  text(x0 + 2, y0 + h - 3, U.keys, C.gray);
  text(x0 + 2, y0 + h - 2, U.keys2, C.gray);
}

// Pocket slots holding things that would fit the given equipment slot.
function gearCandidates(slot) {
  return G.player.inv.map((it, i) => (gearSlot(it) === slot ? i : -1)).filter(i => i >= 0);
}

// The legend is drawn, not typed: the same pictures you'll see on the map.
function legendIcon(ch, cx, cy, S) {
  const L = G.level || { depth: 1, floor: FLOORS[0] };
  switch (ch) {
    case '@': return drawPlayer(cx, cy + S * 0.45, S * 0.9, {});
    case '>': return drawStairs(cx - S / 2, cy - S / 2, S, true);
    case '!': return drawItem({ kind: 'potion' }, cx, cy, S, C.pink);
    case '?': return drawItem({ kind: 'scroll' }, cx, cy, S);
    case '%': return drawItem({ kind: 'food', id: 'eggs' }, cx, cy, S);
    case ')': return drawItem(BLANK_GEAR.hand, cx, cy, S);
    case '[': return drawItem(BLANK_GEAR.head, cx, cy, S);
    case '$': return drawItem({ kind: 'gold' }, cx, cy, S);
    case '¡': return drawItem({ kind: 'candle' }, cx, cy, S);
    case '§': return drawItem({ kind: 'sock', id: 'argyle' }, cx, cy, S);
    case '†': return drawItem({ kind: 'bones' }, cx, cy, S);
    case '~': return drawWater(cx - S / 2, cy - S / 2, S, false, 0, 0);
    case '"': return tuft(cx, cy + S * 0.4, S * 0.6, 4, 0, { w: 0.9, color: '#3f6a2a' });
    case 'o': return drawBarrel(unit(cx, cy + S * 0.45, S * 0.9), S * 0.9, false);
    case ',': return drawDeco(L.depth, cx, cy, S, 0.5, L.floor.deco.color);
  }
}

function drawHelp() {
  const x0 = 2, y0 = 1, w = 76, h = 32;
  box(x0, y0, w, h, TEXT.ui.help.title);
  let y = y0 + 2;
  for (const [k, desc] of TEXT.help) {
    text(x0 + 3, y, k, C.red);
    text(x0 + 16, y, desc, C.ink);
    y++;
  }
  y++;
  text(x0 + 3, y++, TEXT.ui.help.pictures, C.gray);
  const half = Math.ceil(TEXT.legend.length / 2);
  TEXT.legend.forEach(([ch, , desc], i) => {
    const cx = x0 + 4 + (i < half ? 0 : 36), cy = y + (i % half);
    Ink.calm(cellH);
    legendIcon(ch, GRID_X + (cx + 0.5) * cellW, (cy + 0.5) * cellH, cellH * 0.95);
    gridFont();
    text(cx + 2, cy, desc, C.ink);
  });
  y += half + 1;
  for (const l of TEXT.ui.help.after) text(x0 + 3, y++, l, C.gray);
  text(x0 + 3, y0 + h - 2, TEXT.ui.close, C.dim);
}

function drawLogOverlay() {
  const x0 = 2, y0 = 1, w = 76, h = 31;
  box(x0, y0, w, h, TEXT.ui.logTitle);
  const lines = [];
  for (let i = G.log.length - 1; i >= 0 && lines.length < h - 4; i--) {
    const wrapped = wrap(G.log[i].text, w - 6);
    for (let k = wrapped.length - 1; k >= 0 && lines.length < h - 4; k--) lines.unshift([wrapped[k], G.log[i].color]);
  }
  lines.forEach(([ln, col], k) => text(x0 + 3, y0 + 2 + k, ln, col));
  text(x0 + 3, y0 + h - 2, TEXT.ui.close, C.dim);
}

function drawGraveyard() {
  const x0 = 2, y0 = 1, w = 76, h = 31, U = TEXT.ui.graveyard;
  box(x0, y0, w, h, U.title);
  const list = Store.load('graveyard', []).slice().reverse();
  if (!list.length) centerText(y0 + 10, U.empty, C.gray);
  G.graveSel = clamp(G.graveSel, 0, Math.max(0, list.length - 1));
  const shown = list.slice(0, 15);
  shown.forEach((g, i) => {
    const y = y0 + 2 + i, sel = i === G.graveSel;
    if (sel) for (let x = x0 + 1; x < x0 + w - 1; x++) put(x, y, ' ', null, C.select);
    const left = g.won
      ? fill(U.escaped, { run: g.run })
      : fill(U.lost, { run: g.run, depth: g.depth, killer: g.killer, looted: g.looted ? U.looted : '' });
    const right = fill(U.row, { level: g.level, turns: g.turns, date: g.date || '' });
    text(x0 + 2, y, trunc(left, w - right.length - 6), g.won ? C.red : C.ink);
    text(x0 + w - 2 - right.length, y, right, C.gray);
  });
  const g = shown[G.graveSel];
  if (g) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    serif(clamp(cellH * 0.95, 13, 22), 'italic');
    let y = (y0 + 19) * cellH;
    for (const line of g.epitaph || []) {
      for (const ln of wrapPx(line, (w - 10) * cellW)) {
        if (y < (y0 + h - 3) * cellH) {
          ctx.fillStyle = C.purple;
          ctx.fillText(ln, W / 2, y);
          y += cellH * 1.15;
        }
      }
    }
    gridFont();
  }
  text(x0 + 3, y0 + h - 2, U.keys, C.dim);
}
