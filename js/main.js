'use strict';
// Keyboard in; an animation loop out (the game is turn-based, but the ink keeps moving).

const MOVE = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
const isDigit = k => /^[0-9]$/.test(k);
const digitSlot = k => (k === '0' ? 9 : Number(k) - 1);
const isEnter = k => k === 'Enter' || k === ' ';

function openOverlay(mode) { G.back = G.mode; G.mode = mode; }
function closeOverlay() { G.mode = G.back; }
function goTitle() {
  G.mode = 'title';
  G.back = 'title';
  G.page = null;
  tagline = RNG.pick(TEXT.taglines);
  Voice.stop();
  Sound.setScene('title');
}
function toPlay() {
  G.mode = 'play';
  G.back = 'play';
  G.page = null;
  Voice.stop();
  saveRun();
}

// Run a player action; if it used up time, the rest of the world takes its turn.
function act(fn) {
  G.logMark = G.log.length;
  if (fn()) endTurn();
}

function onPlayKey(k) {
  const armed = G.quitArmed;
  G.quitArmed = false;
  if (k === 'q' || k === 'Q') {
    if (armed) { clearRun(); return goTitle(); } // giving up is for good
    G.quitArmed = true;
    G.logMark = G.log.length;
    msg(TEXT.prompts.giveUp, C.orange);
    return;
  }
  if (MOVE[k]) return act(() => tryMove(MOVE[k][0], MOVE[k][1]));
  if (isDigit(k)) return act(() => usePocket(digitSlot(k)));
  switch (k) {
    case ' ': case '.': return act(wait);
    case 'r': case 'R': G.logMark = G.log.length; return startRhyme();
    case '>': case 'Enter': return act(tryDescend);
    case 'i': case 'I': return openPockets(null);
    case 'a': case 'A': return act(attackAdjacent);
    case 'u': case 'U': {
      const near = adjacentMonsters();
      return openPockets(currentThreat() || (near.length === 1 ? near[0] : null));
    }
    case 'e': case 'E': G.gearSel = 0; return openOverlay('gear');
    case 'g': case 'G': case ',': return act(pickUp);
    case '?': case '/': case 'h': case 'H': return openOverlay('help');
    case 'l': case 'L': return openOverlay('log');
    case 'b': case 'B': G.bestSel = 0; G.page = null; return openOverlay('bestiary'); // (the phone's menu has it too)
  }
}

// Pockets. Opened with a target (from U, or from facing a horror), potions can be thrown at it.
function openPockets(target) {
  G.invSel = 0;
  G.useTarget = target && G.level.monsters.includes(target) ? target : null;
  openOverlay('inventory');
}

function onInventoryKey(k) {
  const n = pocketRows().length, target = G.useTarget, sel = G.invSel, here = pocketAt(sel); // rows, as shown
  const close = () => { G.useTarget = null; closeOverlay(); };
  if (k === 'Escape' || k === 'i' || k === 'I') return close();
  if (k === 'e' || k === 'E') { G.useTarget = null; G.gearSel = 0; G.mode = 'gear'; return; }
  if (k === 'ArrowUp' && n) G.invSel = (G.invSel + n - 1) % n;
  else if (k === 'ArrowDown' && n) G.invSel = (G.invSel + 1) % n;
  else if (k === 'Enter' || k === 'u' || k === 'U' || isDigit(k)) {
    const row = isDigit(k) ? digitSlot(k) : sel;
    close();
    act(() => usePocket(row));
  } else if ((k === 't' || k === 'T') && target && G.player.inv[here] && G.player.inv[here].kind === 'potion') {
    close();
    act(() => throwPotion(here, target));
  } else if ((k === 'd' || k === 'D') && n) {
    close();
    act(() => dropFromPockets(here));
  }
}

// A turn taken from inside a menu (the equipment page): the world moves, the menu stays open
// unless something more important happens (a card, a page, death).
function actInMenu(fn) {
  const menu = G.mode;
  G.mode = 'play';
  act(fn);
  if (G.mode === 'play') G.mode = menu;
}

function onGearKey(k) {
  const [slot] = SLOTS[G.gearSel], fits = gearCandidates(slot);
  if (k === 'Escape' || k === 'e' || k === 'E') return closeOverlay();
  if (k === 'i' || k === 'I') { G.invSel = 0; G.useTarget = null; G.mode = 'inventory'; return; }
  if (k === 'ArrowUp') G.gearSel = (G.gearSel + SLOTS.length - 1) % SLOTS.length;
  else if (k === 'ArrowDown') G.gearSel = (G.gearSel + 1) % SLOTS.length;
  else if (/^[1-7]$/.test(k) && fits[Number(k) - 1] != null) actInMenu(() => equip(fits[Number(k) - 1]));
  else if (k === 't' || k === 'T' || k === 'Backspace' || k === 'Delete') actInMenu(() => unequip(slot));
  else if (k === 'Enter') actInMenu(() => (G.player.gear[slot] ? unequip(slot) : fits.length ? equip(fits[0]) : false));
}

// Face to face with a horror you walked into: attack, rhyme, use something, or back off.
function onEncounterKey(k) {
  const e = G.encounter, m = e.m;
  const close = () => { G.mode = 'play'; G.encounter = null; };
  if (!G.level.monsters.includes(m)) return close();
  const same = MOVE[k] && MOVE[k][0] === e.dx && MOVE[k][1] === e.dy;
  if (['a', 'A', '1', 'Enter'].includes(k) || same) {
    close();
    return act(() => { playerAttack(m); return true; });
  }
  if (['r', 'R', '2'].includes(k)) {
    close();
    G.logMark = G.log.length;
    return startRhyme();
  }
  if (['u', 'U', '3', 'i', 'I'].includes(k)) {
    close();
    return openPockets(m);
  }
  if (k === 'Escape' || k === ' ') {
    close();
    if (e.engaged) return act(() => backAway(m)); // already a fight: getting away is a gamble
    G.logMark = G.log.length;
    msg(phrase('prompts.leaveBe', { them: theM(m) }), C.gray);
    return;
  }
  if (MOVE[k]) {
    close();
    onPlayKey(k);
  }
}

function onRhymeKey(k) {
  const r = G.rhyme;
  if (G.page && G.page.hold) { // which kind of rhyme?
    const i = /^[1-3]$/.test(k) ? Number(k) - 1 : RHYME_KIND_KEYS.indexOf(k);
    if (i >= 0) chooseRhymeKind(RHYME_KINDS[i]);
    else if (isEnter(k)) chooseRhymeKind(G.player.lastRhymeKind || 'shove');
    else if (k === 'Escape') cancelRhyme();
    return;
  }
  if (r.result) {
    if (FX.now - r.result.t > RULES.ui.resultMs) finishRhyme();
    return;
  }
  if (!r.fuseT0) {
    if (isEnter(k)) pageAdvance(G.page);
    return;
  }
  const i = RHYME_KEYS.indexOf(k);
  if (i >= 0) answerRhyme(i);
  else if (/^[1-4]$/.test(k)) answerRhyme(Number(k) - 1);
}

// The odd rooms: read the verse, pick one of three, read what happened, go on.
function onChoiceKey(k) {
  const pg = G.page;
  if (pg.result) {
    if (FX.now - pg.result.t > RULES.ui.resultMs && (isEnter(k) || k === 'Escape')) { toPlay(); endTurn(); }
    return;
  }
  if (!pageDone(pg)) {
    if (isEnter(k)) pageAdvance(pg);
    return;
  }
  const n = pg.choices.length;
  if (k === 'ArrowUp') pg.sel = (pg.sel + n - 1) % n;
  else if (k === 'ArrowDown') pg.sel = (pg.sel + 1) % n;
  else if (/^[1-9]$/.test(k) && Number(k) <= n) chooseFixture(pg, Number(k) - 1);
  else if (k === 'Enter') {
    // Enter also hurries the verse along: just after it finishes, it must not pick a choice.
    if (FX.now - pg.t0 - pg.doneAt >= RULES.ui.choicePauseMs) chooseFixture(pg, pg.sel);
  }
  else if (k === 'Escape') chooseFixture(pg, n - 1);
}

// Enter on a verse page: next line sooner, or the next stanza, or (when finished) `then`.
function turnPage(k, then) {
  if (isEnter(k) && pageAdvance(G.page)) then();
}

function handleKey(k) {
  if ((k === 's' || k === 'S') && canSkip()) return skipPage(G.page);
  switch (G.mode) {
    case 'splash':
      G.mode = 'title';
      break;
    case 'title':
      if (k === 'Enter' || k === ' ' || k === 'n' || k === 'N') newGame();
      else if (k === 'c' || k === 'C') continueRun();
      else if (k === 'g' || k === 'G') { G.graveSel = 0; openOverlay('graveyard'); }
      else if (k === 'b' || k === 'B') { G.bestSel = 0; G.page = null; openOverlay('bestiary'); }
      else if (k === '?' || k === '/' || k === 'h' || k === 'H') openOverlay('help');
      break;
    case 'story': turnPage(k, showFloorPage); break;
    case 'floorcard': turnPage(k, toPlay); break;
    case 'card': turnPage(k, () => (G.cardQueue.length ? showNextCard() : toPlay())); break;
    case 'play': onPlayKey(k); break;
    case 'rhyme': onRhymeKey(k); break;
    case 'choice': onChoiceKey(k); break;
    case 'inventory': onInventoryKey(k); break;
    case 'gear': onGearKey(k); break;
    case 'encounter': onEncounterKey(k); break;
    case 'graveyard':
      if (k === 'ArrowUp') G.graveSel = Math.max(0, G.graveSel - 1);
      else if (k === 'ArrowDown') G.graveSel++;
      else if (['Escape', 'Enter', 'g', 'G', ' '].includes(k)) closeOverlay();
      break;
    case 'bestiary':
      if (k === 'ArrowLeft' || k === 'ArrowUp') G.bestSel = Math.max(0, G.bestSel - 1);
      else if (k === 'ArrowRight' || k === 'ArrowDown') G.bestSel++;
      else if (['Escape', 'Enter', 'b', 'B', ' '].includes(k)) { G.page = null; closeOverlay(); }
      break;
    case 'help': case 'log': closeOverlay(); break;
    case 'dead':
      if (!pageDone(G.page)) { if (isEnter(k)) pageAdvance(G.page); break; }
      if (k === 'Enter') newGame();
      else if (k === 'g' || k === 'G') { G.graveSel = 0; openOverlay('graveyard'); }
      else if (k === 't' || k === 'T' || k === 'Escape') goTitle();
      break;
    case 'win': turnPage(k, goTitle); break;
  }
}

// Keys that work everywhere.
function globalKey(k) {
  if (k === 'm' || k === 'M') { Sound.toggleMute(); return true; }
  if (k === 'v' || k === 'V') { Voice.toggle(); return true; }
  if (k === 'f' || k === 'F') { FX.toggleReduced(); return true; }
  return false;
}

function dangerInView() {
  const L = G.level;
  return L.monsters.some(m => m.awake && !m.disguised && L.visible[idx(m.x, m.y)]) || L.phantoms.length > 0;
}

// Every key press comes through here, from the keyboard or (on a phone) from a tap (js/touch.js).
// `repeat` is a key held down. False when a held key is refused (the walk stops there).
let lastInputAt = -1e9;
function pressKey(k, repeat) {
  lastInputAt = performance.now();
  Sound.init();
  if (Sound.scene == null) Sound.setScene('title');
  // Holding a key down: fine for walking an empty hall, not for skipping pages or walking into teeth.
  if (repeat && (G.mode !== 'play' || !MOVE[k] || dangerInView())) return false;
  if (G.mode !== 'rhyme' && globalKey(k)) return true;
  handleKey(k);
  return true;
}

window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return; // leave Cmd+R, Cmd+Q etc. alone
  if (e.key.startsWith('Arrow') || e.key === ' ' || e.key === '/' || e.key === "'") e.preventDefault();
  pressKey(e.key, e.repeat);
});

// How the soundtrack should feel right now.
function soundState() {
  const s = { danger: 0, dread: 0, box: 0 }, A = RULES.audio;
  if (['title', 'story', 'graveyard', 'bestiary', 'splash'].includes(G.mode)) { s.box = G.mode === 'splash' ? 0 : A.titleBox; return s; }
  if (!G.player || !G.level || G.mode === 'dead' || G.mode === 'win') return s;
  const p = G.player, L = G.level;
  s.dread = dreadFrac(p);
  const hpDanger = clamp((0.5 - p.hp / p.maxHp) * 2, 0, 1);
  const close = L.monsters.some(m => m.awake && !m.disguised && manhattan(m, p) <= A.closeSteps) ? A.closeDanger : 0;
  s.danger = Math.max(hpDanger, close, s.dread > RULES.dread.tiers.afraid / RULES.dread.max ? s.dread * A.fearDanger : 0);
  if (L.depth === 5) s.box = A.nurseryBox;
  if (L.stalker) s.box = clamp(1 - manhattan(L.stalker, p) / A.bedtimeBox.near, A.bedtimeBox.least, 1);
  else if (!L.isBoss) {
    const lead = RULES.stalker.musicBoxLead, soon = L.turnsHere - (stalkerDue(L.depth) - lead);
    if (soon >= 0) s.box = Math.max(s.box, A.warningBox.from + (soon / lead) * A.warningBox.rise);
  }
  return s;
}

// Nothing happening on a phone: no key or tap for a moment (a held walk presses keys), and
// nothing on the page moving (no bubble, number, death, shake or flash, no verse still appearing,
// no fuse burning). Frames can then come at RULES.phone.idleFrameMs, which as set is the same as always.
function phoneIdle(t) {
  if (t - lastInputAt < RULES.phone.idleAfterMs) return false;
  if (FX.bubbles.length || FX.floats.length || FX.deaths.length || FX.shake > 0.2 || FX.flash > 0.01) return false;
  return G.mode === 'play' || G.mode === 'title' || (!!G.page && pageDone(G.page) && G.mode !== 'rhyme');
}

let last = 0;
function frame(t) {
  requestAnimationFrame(frame);
  if (t - last < (Phone.on && phoneIdle(t) ? RULES.phone.idleFrameMs : RULES.ui.frameMs)) return; // ~30 fps is plenty for candlelight
  const dt = Math.min(100, t - (last || t));
  last = t;
  FX.now = t;
  FX.update(dt);
  dreadFrame(dt);
  if ((G.mode === 'title' || G.mode === 'splash') && RNG.chance(dt * RULES.ui.titleEyes)) {
    const edge = RNG.chance(0.5) ? RNG.int(4, 22) / 100 : RNG.int(78, 96) / 100;
    FX.eye(edge, RNG.int(8, 80) / 100, RNG.pick(['#ffd84a', '#ff5b5b', '#c8ffb0']), RNG.int(1200, 3500), 'screen');
  }
  if (G.page) pageTick(G.page);
  if (G.mode === 'rhyme') {
    const r = G.rhyme;
    if (!r.result && r.fuseT0 && FX.now - r.fuseT0 > r.ms) answerRhyme(-1);
    else if (r.result && FX.now - r.result.t > RULES.ui.rhymeResultMs) finishRhyme();
  }
  Sound.update(soundState());
  draw();
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);
