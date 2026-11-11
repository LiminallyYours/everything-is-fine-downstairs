'use strict';
// Your previous Somebodies haunt the floors where they died. Their bones still have their stuff.

const GHOST_COLOR = '#3d5aa8';

function placeGhosts(L) {
  const R = RULES.ghosts;
  const graves = Store.load('graveyard', [])
    .filter(g => !g.won && !g.looted && g.depth === L.depth && g.run !== G.runNo)
    .slice(-R.graves);
  RNG.shuffle(graves);
  const count = graves.length ? (RNG.chance(R.two) ? 2 : 1) : 0;
  for (const g of graves.slice(0, count)) {
    const pos = freeTile(L, R.minDist);
    if (!pos) continue;
    const [x, y] = pos;
    const bones = { kind: 'bones', run: g.run, killer: g.killer, loot: g.bones || [] };
    dropItem(L, x, y, bones);
    L.ghosts.push({ x, y, run: g.run, lines: (g.epitaph || []).slice(0, R.lines), said: 0, met: false, gone: false });
  }
}

function ghostTurn(L) {
  const p = G.player, R = RULES.ghosts;
  for (const gh of L.ghosts) {
    if (gh.gone || !L.visible[idx(gh.x, gh.y)] || manhattan(gh, p) > R.near) continue;
    if (!gh.met) {
      gh.met = true;
      msg(phrase('ghosts.met', { who: phrase('somebody', { n: gh.run }) }), GHOST_COLOR);
      Sound.play('ghost');
      addDread(8);
    }
    if (gh.said < gh.lines.length && G.turn % R.talkEvery === 0) {
      FX.say(gh, gh.lines[gh.said++], GHOST_COLOR, 3200);
      if (gh.said === 1) Voice.say(gh.lines.join(' '), 'whisper');
    }
  }
}

function lootBones(L, entry) {
  const p = G.player, b = entry.item;
  L.items.splice(L.items.indexOf(entry), 1);
  msg(phrase('ghosts.bones', { who: phrase('somebody', { n: b.run }), killer: b.killer }), GHOST_COLOR);
  if (!b.loot.length) msg(TEXT.ghosts.nothing, C.gray);
  for (const item of b.loot) {
    if (!pocketsFull(p)) {
      p.inv.push(item);
      msg(phrase('ghosts.take', { item: itemName(item) }), C.teal);
    } else {
      dropItem(L, p.x, p.y, item);
    }
  }
  const gh = L.ghosts.find(g => g.run === b.run);
  if (gh) {
    FX.say(gh, TEXT.ghosts.farewell, GHOST_COLOR, 3000);
    gh.gone = true;
  }
  Sound.play('ghost', 0.7);
  const graves = Store.load('graveyard', []);
  const g = graves.find(x => x.run === b.run);
  if (g) {
    g.looted = true;
    Store.save('graveyard', graves);
  }
}

// What a dying Somebody leaves behind for the next one.
function bonesFor(p) {
  const loot = [];
  for (const slot of ['hand', 'body', 'head']) if (p.gear[slot]) loot.push(p.gear[slot]);
  for (const it of p.inv) {
    if (loot.length >= RULES.ghosts.bones) break;
    if (['potion', 'scroll', 'food', 'armor', 'weapon', 'pair'].includes(it.kind)) loot.push(it);
  }
  return loot;
}
