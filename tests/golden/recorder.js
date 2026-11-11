'use strict';
// Watches a running game and writes down what a player would see and hear, as a list of short
// lines. It records behaviour, never structure: text on the screen, the log, speech, mode
// changes, and a compact fingerprint of the numbers that matter (health, candle, dread, where
// everything is). It never calls anything that changes the game or uses its random numbers.
//
// Line prefixes:
//   k  a key press                      #  a scenario note
//   m  mode change (from>to)            l  a new log line
//   b  a speech bubble (x,y: text)      v  spoken by the narrator (rate/pitch: text)
//   r  a room's result                  e  the epitaph and the death fact
//   +  text that started being drawn   -  text no longer drawn (both @ms since the step began)
//   s  player numbers that changed      i  pockets   g  gear
//   M  a monster (id type hp/max @x,y flags), or "M#id gone"
//   I  an item on the floor             F  a room centrepiece      P  a hallucination
//   h  a ghost                          L  a new floor              t  the floor's tiles changed (hash)
//   a  sound: number of audio events and a hash of them            c  console output
//   =  a bulk measurement (from scenarios-rules.js)                 !  the scenario crashed
// Events seen while time passes carry "@ms" since the step's key press. "[screen N]" introduces a
// whole screenful of new text; "[screen N again]" means exactly that screenful came back.

const crypto = require('crypto');

const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);

function createRecorder(H) {
  const G = H.G;
  const out = [];
  const fn = name => H.get(name);
  const itemName = fn('itemName'), playerAtk = fn('playerAtk'), playerDef = fn('playerDef');
  const FX = H.get('FX');
  let segStart = H.now();
  let shown = new Set(), frameSet = new Set();
  let quiet = false;
  const blocks = new Map();
  let lastMode = G.mode;
  const seenLog = new WeakSet(), seenBubbles = new WeakSet(), seenResults = new WeakSet();
  let lastEpitaph = null;
  let spokenIdx = 0, consoleIdx = 0;
  const ids = new WeakMap();
  let nextId = 1;
  const idOf = o => { if (!ids.has(o)) ids.set(o, nextId++); return ids.get(o); };
  let lastLevel = null, lastTiles = '';
  let lastPlayer = {}, lastInv = '', lastGear = '';
  let lastMons = new Map(), lastItems = new Map(), lastFix = new Map(), lastPh = new Map(), lastGh = new Map();
  for (const l of G.log) seenLog.add(l);

  const ofs = () => { const d = H.now() - segStart; return d > 0 ? '@' + d : ''; };
  const push = line => out.push(line);
  const safe = (f, fallback = '?') => { try { return f(); } catch (e) { return fallback; } };

  H.onText = s => { if (s && s.trim()) frameSet.add(s); };

  // After each frame: what appeared and what went away, with the time since the step began.
  function frameDiff() {
    if (quiet) { shown = frameSet; frameSet = new Set(); return; }
    const at = ofs();
    const added = [...frameSet].filter(s => !shown.has(s));
    if (added.length > 3) {
      // A whole screen (re)appearing: write it out the first time, then refer to it by number.
      const key = added.join('\n');
      if (blocks.has(key)) push(`+${at} [screen ${blocks.get(key)} again: ${added.length} strings]`);
      else {
        blocks.set(key, blocks.size + 1);
        push(`+${at} [screen ${blocks.size}: ${added.length} strings]`);
        for (const s of added) push(`+${at} ${s}`);
      }
    } else for (const s of added) push(`+${at} ${s}`);
    // Text going away was written down when it appeared; list it only when a few things go.
    const gone = [...shown].filter(s => !frameSet.has(s));
    if (gone.length > 3) push(`-${at} (${gone.length} strings)`);
    else for (const s of gone) push(`-${at} ${s}`);
    shown = frameSet;
    frameSet = new Set();
  }

  // Things that can happen at any moment (a frame, a key): poll for them.
  function poll() {
    if (quiet) { skipAll(); return; }
    if (G.mode !== lastMode) { push(`m${ofs()} ${lastMode}>${G.mode}`); lastMode = G.mode; }
    for (const l of G.log) {
      if (seenLog.has(l)) continue;
      seenLog.add(l);
      push(`l${ofs()} ${l.text}`);
    }
    for (const b of FX.bubbles || []) {
      if (seenBubbles.has(b)) continue;
      seenBubbles.add(b);
      const t = b.target || {};
      push(`b${ofs()} ${t.x},${t.y}: ${b.lines.join(' / ')}`);
    }
    while (spokenIdx < H.spoken.length) {
      const u = H.spoken[spokenIdx++];
      push(`v${ofs()} ${u.rate}/${u.pitch}: ${u.text}`);
    }
    while (consoleIdx < H.consoleLog.length) push(`c${ofs()} ${H.consoleLog[consoleIdx++]}`);
    const pg = G.page;
    if (pg && pg.result && !seenResults.has(pg.result)) {
      seenResults.add(pg.result);
      push(`r${ofs()} ${pg.result.choice}: ${(pg.result.lines || []).join(' | ')}`);
    }
    if (G.epitaph && G.epitaph !== lastEpitaph) {
      lastEpitaph = G.epitaph;
      push(`e${ofs()} ${G.epitaph.join(' | ')} || ${G.fact}`);
    }
  }

  // Mark everything so far as seen without writing it down (for the bulk statistics runs).
  function skipAll() {
    lastMode = G.mode;
    for (const l of G.log) seenLog.add(l);
    for (const b of FX.bubbles || []) seenBubbles.add(b);
    spokenIdx = H.spoken.length;
    if (G.page && G.page.result) seenResults.add(G.page.result);
    lastEpitaph = G.epitaph;
    H.audioLog.length = 0;
  }

  const deltaMap = (prefix, prev, list, repr) => {
    const now = new Map();
    for (const o of list) {
      if (!o || typeof o !== 'object') { push(`${prefix}? not an object: ${o}`); continue; }
      now.set(idOf(o), repr(o));
    }
    for (const [id, r] of now) if (prev.get(id) !== r) push(`${prefix}#${id} ${r}`);
    for (const id of prev.keys()) if (!now.has(id)) push(`${prefix}#${id} gone`);
    return now;
  };

  const monRepr = m => {
    let r = `${m.type} ${m.hp}/${m.maxHp} @${m.x},${m.y}`;
    if (!m.awake) r += ' asleep';
    for (const k of ['stun', 'fear', 'frenzy', 'poison', 'dazed', 'bonusAtk', 'phase', 'gen']) if (m[k]) r += ` ${k}${m[k]}`;
    if (m.enraged) r += ' enraged';
    if (m.disguised) r += ' disguised';
    if (m.speed) r += ` speed${+m.speed.toFixed(3)}`;
    if (m.carry) r += ` carrying ${safe(() => itemName(m.carry))}`;
    return r;
  };

  // The state fingerprint, written when a step ends (before the next key, or at a checkpoint).
  function fingerprint() {
    const p = G.player, L = G.level;
    if (!p || !L) return;
    if (L !== lastLevel) {
      lastLevel = L;
      push(`L floor ${L.depth}: ${L.floor.name}, ${L.rooms.length} rooms, start ${L.start.x},${L.start.y}, stairs ${L.stairs ? L.stairs.x + ',' + L.stairs.y : '-'}`);
      lastMons = new Map(); lastItems = new Map(); lastFix = new Map(); lastPh = new Map(); lastGh = new Map(); lastTiles = '';
    }
    let vis = 0, seen = 0;
    for (let i = 0; i < L.visible.length; i++) { vis += L.visible[i]; seen += L.seen[i]; }
    const cur = {
      hp: `${p.hp}/${p.maxHp}`, xp: `${p.xp}/${p.xpNext}`, lvl: p.level, atk: safe(playerAtk), def: safe(playerDef),
      gold: p.gold, wick: p.wick, dread: +p.dread.toFixed(2), verve: `${p.verve}/${p.maxVerve}`, at: `${p.x},${p.y}`,
      depth: G.depth, turn: G.turn, conf: p.confused, pois: p.poisoned, sens: p.sensing, hid: p.hidden ? 1 : 0,
      dark: p.darkTurns, slow: p.slowed ? 1 : 0, kills: p.kills, vis, seen, here: L.turnsHere, nib: G.uiNibble || 0,
    };
    const changed = Object.keys(cur).filter(k => lastPlayer[k] !== cur[k]).map(k => `${k}=${cur[k]}`);
    if (changed.length) push('s ' + changed.join(' '));
    lastPlayer = cur;
    const inv = p.inv.map(it => safe(() => itemName(it))).join(', ');
    if (inv !== lastInv) { push('i ' + (inv || '(empty)')); lastInv = inv; }
    const gear = ['hand', 'head', 'body', 'feet'].map(s => `${s}=${p.gear[s] ? safe(() => itemName(p.gear[s])) : '-'}`).join(' ');
    if (gear !== lastGear) { push('g ' + gear); lastGear = gear; }
    lastMons = deltaMap('M', lastMons, L.monsters, monRepr);
    lastItems = deltaMap('I', lastItems, L.items, e => `${safe(() => itemName(e.item))} @${e.x},${e.y}`);
    lastFix = deltaMap('F', lastFix, L.fixtures || [], f => `${f.kind} @${f.x},${f.y}${f.seen ? ' seen' : ''}${f.used ? ' used' : ''}`);
    lastPh = deltaMap('P', lastPh, L.phantoms || [], ph => `${ph.kind} ${ph.name} @${ph.x},${ph.y} ttl${ph.ttl}`);
    lastGh = deltaMap('h', lastGh, L.ghosts || [], g => `#${g.run} @${g.x},${g.y} said${g.said}${g.met ? ' met' : ''}${g.gone ? ' gone' : ''}`);
    const th = hash(Buffer.from(L.tiles));
    if (th !== lastTiles) { push('t ' + th); lastTiles = th; }
  }

  // End the current step: what was drawn, what changed, what you heard.
  function flush() {
    poll();
    if (H.audioLog.length) { push(`a ${H.audioLog.length} ${hash(H.audioLog.join('\n'))}`); H.audioLog.length = 0; }
    fingerprint();
    segStart = H.now();
  }

  const prevAfterFrame = H.afterFrame;
  H.afterFrame = () => { if (prevAfterFrame) prevAfterFrame(); poll(); frameDiff(); };

  // Wrap press so every key becomes a step.
  const rawPress = H.press;
  H.press = (key, repeat = false, mods) => {
    flush();
    push(`k ${repeat ? '(held) ' : ''}${key}`);
    rawPress(key, repeat, mods);
    poll();
  };

  return {
    out,
    poll,
    flush,
    note: text => { flush(); push('# ' + text); },
    // Run test code (setup the player could not do by hand), as its own step.
    run: (label, code) => { flush(); push('# ' + label); const r = H.run(code); poll(); return r; },
    // Run code whose individual messages are not wanted (bulk statistics), then note a summary.
    quietly: fn => { flush(); quiet = true; try { return fn(); } finally { skipAll(); frameSet = new Set(); quiet = false; } },
    push,
    finish: () => { flush(); H.press = rawPress; H.onText = null; return out; },
  };
}

module.exports = { createRecorder };
