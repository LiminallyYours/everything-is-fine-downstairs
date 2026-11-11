'use strict';
// Level generation (rooms + corridors), field of view, and walking-distance maps.

const MAP_W = RULES.map.w, MAP_H = RULES.map.h; // read on every cell, so kept as plain constants
const T = { WALL: 0, FLOOR: 1, STAIRS: 2, WATER: 3, GRASS: 4, DECO: 5, PROP: 6, DEEP: 7 };
const FAR = 9999;

const idx = (x, y) => y * MAP_W + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
const passable = t => t !== T.WALL && t !== T.PROP;
const opaque = t => t === T.WALL || t === T.GRASS;
const center = r => ({ x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2) });

function makeLevel(depth) {
  const floor = FLOORS[depth - 1];
  const isBoss = depth === FLOORS.length;
  const L = {
    depth, floor, isBoss,
    tiles: new Uint8Array(MAP_W * MAP_H), // starts as solid WALL (0)
    seen: new Uint8Array(MAP_W * MAP_H),
    visible: new Uint8Array(MAP_W * MAP_H),
    rooms: [], monsters: [], items: [],
    start: null, stairs: null, bossSpot: null,
  };
  if (isBoss) {
    const arena = { x: MAP_W - 24, y: 7, w: 21, h: 12 };
    L.rooms.push(arena);
    L.bossSpot = center(arena);
  }
  placeRooms(L, isBoss ? RULES.map.bossRooms : RNG.int(...RULES.map.rooms));
  for (const r of L.rooms) carveRoom(L, r);
  connectRooms(L);
  decorate(L);
  chooseEnds(L);
  return L;
}

function placeRooms(L, want) {
  for (let tries = 0; tries < 500 && L.rooms.length < want; tries++) {
    const w = RNG.int(4, 11), h = RNG.int(3, 6);
    const r = { x: RNG.int(1, MAP_W - w - 1), y: RNG.int(1, MAP_H - h - 1), w, h };
    const apart = o => r.x + r.w + 1 < o.x || o.x + o.w + 1 < r.x || r.y + r.h + 1 < o.y || o.y + o.h + 1 < r.y;
    if (L.rooms.every(apart)) L.rooms.push(r);
  }
}

function carveRoom(L, r) {
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) L.tiles[idx(x, y)] = T.FLOOR;
}

function connectRooms(L) {
  const rooms = L.rooms.slice().sort((a, b) => a.x - b.x);
  for (let i = 1; i < rooms.length; i++) corridor(L, center(rooms[i - 1]), center(rooms[i]));
  for (let k = 0; k < RULES.map.loops; k++) corridor(L, center(RNG.pick(rooms)), center(RNG.pick(rooms))); // a few loops
}

function corridor(L, a, b) {
  let x = a.x, y = a.y;
  const dig = () => { if (L.tiles[idx(x, y)] === T.WALL) L.tiles[idx(x, y)] = T.FLOOR; };
  const horiz = () => { while (x !== b.x) { x += Math.sign(b.x - x); dig(); } };
  const vert = () => { while (y !== b.y) { y += Math.sign(b.y - y); dig(); } };
  if (RNG.chance(0.5)) { horiz(); vert(); } else { vert(); horiz(); }
}

// Paint a roughly round patch of `tile` over plain floor somewhere in a room.
function blob(L, tile, radius) {
  const c = pickSpot(L, RNG.pick(L.rooms));
  for (let y = c.y - radius; y <= c.y + radius; y++) {
    for (let x = c.x - radius; x <= c.x + radius; x++) {
      const dx = x - c.x, dy = y - c.y;
      if (inMap(x, y) && dx * dx + dy * dy <= radius * radius + 1 && L.tiles[idx(x, y)] === T.FLOOR) L.tiles[idx(x, y)] = tile;
    }
  }
}

function decorate(L) {
  const f = L.floor;
  for (let i = 0; i < f.grass; i++) blob(L, T.GRASS, RNG.int(1, 3));
  for (let i = 0; i < f.water; i++) blob(L, T.WATER, RNG.int(2, 3));
  for (let i = 0; i < L.tiles.length; i++) {
    if (L.tiles[i] === T.FLOOR && RNG.chance(f.deco.density)) L.tiles[i] = T.DECO;
  }
  // Props never touch a wall or another prop, so they can never block a path.
  let placed = 0;
  for (let tries = 0; tries < 400 && placed < f.prop.count; tries++) {
    const r = RNG.pick(L.rooms);
    const x = RNG.int(r.x, r.x + r.w - 1), y = RNG.int(r.y, r.y + r.h - 1);
    if (!passable(L.tiles[idx(x, y)])) continue;
    if (DIR8.every(([dx, dy]) => passable(L.tiles[idx(x + dx, y + dy)]))) {
      L.tiles[idx(x, y)] = T.PROP;
      placed++;
    }
  }
}

function pickSpot(L, r) {
  for (let i = 0; i < 60; i++) {
    const x = RNG.int(r.x, r.x + r.w - 1), y = RNG.int(r.y, r.y + r.h - 1);
    if (passable(L.tiles[idx(x, y)])) return { x, y };
  }
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) if (passable(L.tiles[idx(x, y)])) return { x, y };
  }
  return center(r);
}

// Start somewhere; put the stairs (or, at the bottom, yourself) as far away as walking allows.
function chooseEnds(L) {
  if (L.isBoss) {
    L.tiles[idx(L.bossSpot.x, L.bossSpot.y)] = T.FLOOR;
    L.start = farthestSpot(L, L.bossSpot, L.rooms.slice(1));
    return;
  }
  L.start = pickSpot(L, RNG.pick(L.rooms));
  L.stairs = farthestSpot(L, L.start, L.rooms);
  L.tiles[idx(L.stairs.x, L.stairs.y)] = T.STAIRS;
}

function farthestSpot(L, from, rooms) {
  const dist = distanceMap(L, from.x, from.y);
  let best = null, bestD = -1;
  for (const r of rooms) {
    const s = pickSpot(L, r);
    const d = dist[idx(s.x, s.y)];
    if (d < FAR && d > bestD) { bestD = d; best = s; }
  }
  return best || pickSpot(L, RNG.pick(L.rooms));
}

// Bresenham line: can light get from (x0,y0) to (x1,y1)? The end cell itself may be solid.
function lineClear(L, x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  for (;;) {
    if (x === x1 && y === y1) return true;
    if ((x !== x0 || y !== y0) && opaque(L.tiles[idx(x, y)])) return false;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

function computeFOV(L, px, py, r) {
  const vis = L.visible;
  vis.fill(0);
  const r2 = r * r + r;
  for (let y = Math.max(0, py - r); y <= Math.min(MAP_H - 1, py + r); y++) {
    for (let x = Math.max(0, px - r); x <= Math.min(MAP_W - 1, px + r); x++) {
      const dx = x - px, dy = y - py;
      if (L.darkRoom && inDarkRoom(L, x, y) && Math.max(Math.abs(dx), Math.abs(dy)) > 1) continue; // the light will not go in
      if (dx * dx + dy * dy <= r2 && lineClear(L, px, py, x, y)) vis[idx(x, y)] = 1;
    }
  }
  // Light the walls bordering lit floor, so rooms don't look moth-eaten.
  const extra = [];
  for (let i = 0; i < vis.length; i++) {
    if (!vis[i] || opaque(L.tiles[i])) continue;
    const x = i % MAP_W, y = (i / MAP_W) | 0;
    for (const [dx, dy] of DIR8) {
      const nx = x + dx, ny = y + dy;
      if (inMap(nx, ny) && opaque(L.tiles[idx(nx, ny)])) extra.push(idx(nx, ny));
    }
  }
  for (const i of extra) vis[i] = 1;
  for (let i = 0; i < vis.length; i++) if (vis[i]) L.seen[i] = 1;
}

// Breadth-first walking distance from (tx,ty) to every reachable cell. Walls are FAR.
function distanceMap(L, tx, ty) {
  const n = MAP_W * MAP_H;
  const dist = new Int32Array(n).fill(FAR);
  const qx = new Int16Array(n), qy = new Int16Array(n);
  let head = 0, tail = 0;
  dist[idx(tx, ty)] = 0;
  qx[tail] = tx; qy[tail++] = ty;
  while (head < tail) {
    const x = qx[head], y = qy[head++];
    const d = dist[idx(x, y)] + 1;
    for (const [dx, dy] of DIR4) {
      const nx = x + dx, ny = y + dy;
      if (!inMap(nx, ny)) continue;
      const i = idx(nx, ny);
      if (dist[i] !== FAR || !passable(L.tiles[i])) continue;
      dist[i] = d;
      qx[tail] = nx; qy[tail++] = ny;
    }
  }
  return dist;
}

function revealMap(L) {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (L.tiles[idx(x, y)] === T.WALL) {
        const nearFloor = DIR8.some(([dx, dy]) => inMap(x + dx, y + dy) && L.tiles[idx(x + dx, y + dy)] !== T.WALL);
        if (!nearFloor) continue;
      }
      L.seen[idx(x, y)] = 1;
    }
  }
}

// A random empty, walkable room cell at least `minDist` steps (as the crow walks) from the start.
function freeTile(L, minDist) {
  for (let i = 0; i < 400; i++) {
    const r = RNG.pick(L.rooms);
    const x = RNG.int(r.x, r.x + r.w - 1), y = RNG.int(r.y, r.y + r.h - 1);
    const t = L.tiles[idx(x, y)];
    if (!passable(t) || t === T.STAIRS) continue;
    if (Math.abs(x - L.start.x) + Math.abs(y - L.start.y) < minDist) continue;
    if (L.monsters.some(m => m.x === x && m.y === y)) continue;
    if (L.items.some(it => it.x === x && it.y === y)) continue;
    if (L.fixtures && L.fixtures.some(f => f.x === x && f.y === y)) continue;
    if (G.player && G.level === L && G.player.x === x && G.player.y === y) continue;
    return [x, y];
  }
  return null;
}

function freeNeighbor(L, x, y) {
  for (const [dx, dy] of RNG.shuffle(DIR8.slice())) {
    const nx = x + dx, ny = y + dy;
    if (!inMap(nx, ny) || !passable(L.tiles[idx(nx, ny)])) continue;
    if (L.monsters.some(m => m.x === nx && m.y === ny)) continue;
    if (L.fixtures && L.fixtures.some(f => f.x === nx && f.y === ny)) continue;
    if (G.player.x === nx && G.player.y === ny) continue;
    return [nx, ny];
  }
  return null;
}
