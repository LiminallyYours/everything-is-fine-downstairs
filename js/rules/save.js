'use strict';
// Saving a run as you go, and carrying on with it later.
//
// The run is saved every time you are back on the map with a turn behind you, under one key in
// the browser's storage ('rot.run'). C on the title page carries on from exactly there. The save
// is wiped when you die, win, give up or start again, so death stays permanent and there is no
// going back to undo a mistake. A save from another version of the game, or one that won't
// load, is thrown away rather than trusted.

const SAVE_VERSION = 1; // raise this whenever what a run holds changes shape

// Things a run points at but doesn't own (a horror's entry, a floor's entry). They are saved as
// a name and looked up again on loading, so a save never carries a stale copy of the content.
const saveShared = () => [['MONSTERS', MONSTERS], ['FLOORS', FLOORS]];

// Left out of a save: where a drawing was in the middle of a hop or a lunge.
const SAVE_SKIP = new Set(['ax', 'ay', 'fromX', 'fromY', 'moveT0', 'drawAt', 'lunge', 'recoil']);

// The run's own state: these fields of G, and everything they hold.
const SAVE_FIELDS = ['runNo', 'depth', 'turn', 'level', 'player', 'log', 'logMark', 'msgSeq', 'known', 'looks',
  'seenTypes', 'stats', 'alias', 'finaleWon', 'uiNibble'];

// Turn a web of objects into plain data: every object becomes a numbered node, and anything that
// points at it says so by number, so two things that share an object (the level's stalker is
// also one of its monsters) still share it after loading.
function packRun(root) {
  const shared = new Map(), ids = new Map(), nodes = [];
  for (const [name, table] of saveShared()) for (const [key, entry] of Object.entries(table)) shared.set(entry, [name, key]);
  const pack = v => {
    if (v === undefined || typeof v === 'function') return null;
    if (v === null || typeof v !== 'object') return typeof v === 'number' && !Number.isFinite(v) ? null : v;
    if (shared.has(v)) return { $d: shared.get(v) };
    if (ids.has(v)) return { $r: ids.get(v) };
    const id = nodes.length;
    nodes.push(null);
    ids.set(v, id);
    if (v instanceof Uint8Array) nodes[id] = { u8: Array.from(v) };
    else if (v instanceof Set) nodes[id] = { set: [...v].map(pack) };
    else if (Array.isArray(v)) nodes[id] = { a: v.map(pack) };
    else {
      const o = {};
      for (const [k, x] of Object.entries(v)) if (!SAVE_SKIP.has(k) && x !== undefined && typeof x !== 'function') o[k] = pack(x);
      nodes[id] = { o };
    }
    return { $r: id };
  };
  return { root: pack(root), nodes };
}

function unpackRun(packed) {
  const tables = Object.fromEntries(saveShared());
  const made = packed.nodes.map(n => (n.u8 ? new Uint8Array(n.u8) : n.set ? new Set() : n.a ? [] : {}));
  const un = v => {
    if (v === null || typeof v !== 'object') return v;
    if (v.$d) {
      const entry = tables[v.$d[0]] && tables[v.$d[0]][v.$d[1]];
      if (!entry) throw new Error('save: no ' + v.$d.join('.'));
      return entry;
    }
    return made[v.$r];
  };
  packed.nodes.forEach((n, i) => {
    if (n.set) for (const x of n.set) made[i].add(un(x));
    else if (n.a) for (const x of n.a) made[i].push(un(x));
    else if (n.o) for (const [k, x] of Object.entries(n.o)) made[i][k] = un(x);
  });
  return un(packed.root);
}

// What the title page says about the run in progress, or null. Kept in step by saveRun and
// clearRun, so the title page never has to read the whole save.
let savedRun = Store.load('runInfo', null);

function saveRun() {
  const p = G.player;
  if (G.mode !== 'play' || !p || !G.level || p.hp <= 0) return;
  const state = {};
  for (const k of SAVE_FIELDS) state[k] = G[k];
  savedRun = { runNo: G.runNo, depth: G.depth, turn: G.turn };
  Store.save('run', { version: SAVE_VERSION, run: packRun(state) });
  Store.save('runInfo', savedRun);
}

function clearRun() {
  if (!savedRun && Store.load('run', null) == null) return;
  savedRun = null;
  Store.save('run', null);
  Store.save('runInfo', null);
}

// C on the title page: put the saved run back and stand you on the map. False if there was
// nothing to carry on with (or it would not load, in which case it is thrown away).
function continueRun() {
  const saved = Store.load('run', null);
  let state = null;
  try {
    if (saved && saved.version === SAVE_VERSION) state = unpackRun(saved.run);
    if (state && !(state.player && state.level && state.level.tiles.length === MAP_W * MAP_H && state.level.floor)) state = null;
  } catch (e) {
    state = null;
  }
  if (!state) {
    clearRun();
    return false;
  }
  for (const k of SAVE_FIELDS) G[k] = state[k];
  // The clock started again when the page was opened: nothing saved is "just now" any more.
  for (const line of G.log) line.t = -1e9;
  for (const stain of G.level.stains || []) stain.t0 = -1e9;
  Object.assign(G, {
    won: false, epitaph: null, fact: '', killer: '', killerId: '', invSel: 0, cardQueue: [], card: null, rhyme: null,
    encounter: null, threat: null, useTarget: null, quitArmed: false,
  });
  FX.clear();
  Voice.stop();
  Sound.setScene(G.depth);
  computeFOV(G.level, G.player.x, G.player.y, lightRadius());
  G.mode = 'play';
  G.back = 'play';
  G.page = null;
  G.logMark = G.log.length;
  msg(TEXT.prompts.carriedOn, C.purple);
  return true;
}
