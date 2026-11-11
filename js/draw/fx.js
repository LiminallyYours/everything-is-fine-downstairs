'use strict';
// Short-lived visual effects that live in real time (milliseconds), not game turns:
// shake, flashes, speech bubbles, floating numbers, rustling grass, biting walls, fake eyes.

const FX = {
  now: 0,
  shake: 0, flash: 0, flashColor: '#ff2040',
  reduced: Settings.get('reducedFx'),
  bubbles: [], floats: [], rustles: [], teeth: [], eyes: [], deaths: [], words: [],

  clear() {
    this.bubbles = []; this.floats = []; this.rustles = []; this.teeth = []; this.eyes = []; this.deaths = []; this.words = [];
    this.shake = 0; this.flash = 0;
  },

  // A speech bubble over a monster, ghost, the player, or any {x, y}. It follows the target as it moves.
  say(target, text, color, ms) {
    this.bubbles = this.bubbles.filter(b => b.target !== target);
    this.bubbles.push({ target, lines: wrap(text, 26).slice(0, 3), color: color || C.ink, until: this.now + (ms || RULES.fx.bubbleMs) });
    if (this.bubbles.length > 4) this.bubbles.shift();
    if (typeof onSpeak === 'function') onSpeak(target, text);
  },

  // A quick jab toward (dx, dy), or a flinch away from it. Purely for show.
  lunge(e, dx, dy) { e.lunge = { dx, dy, t0: this.now }; },
  recoil(e, dx, dy) { e.recoil = { dx, dy, t0: this.now }; },

  // A dead horror gets crossed out by a frantic pen, then fades into a blot.
  death(m) {
    this.deaths.push({ m: { type: m.type, d: m.d, x: m.x, y: m.y, stun: 0, frenzy: 0, enraged: false }, t0: this.now });
  },

  // A sound, written where it happened ("tick…", "rustle"), for when you can't see the source.
  word(x, y, text, big) {
    this.words.push({ x, y, text, big: !!big, t0: this.now, seed: Math.random() });
    if (this.words.length > 12) this.words.shift();
  },

  float(x, y, text, color) {
    this.floats.push({ x, y, text, color: color || C.red, t0: this.now });
  },

  hit(strength) {
    if (this.reduced) return;
    this.shake = Math.min(9, this.shake + strength);
    this.flash = Math.min(0.45, this.flash + strength * 0.07);
    this.flashColor = '#ff2040';
  },

  jolt(amount, color) {
    if (this.reduced) return;
    this.shake = Math.max(this.shake, amount);
    this.flash = 0.35;
    this.flashColor = color || '#1b1519';
  },

  rustle(x, y) { this.rustles.push({ x, y, until: this.now + RULES.fx.rustleMs }); },
  bite(x, y) { this.teeth.push({ x, y, until: this.now + RULES.fx.biteMs }); },

  // Eyes in the dark. space 'map': x, y are map cells. space 'screen': fractions of the page.
  eye(x, y, color, ms, space) {
    this.eyes.push({ x, y, space: space || 'map', color: color || '#ffd84a', until: this.now + ms, seed: Math.random() * 5000 });
  },

  update(dt) {
    const n = this.now, R = RULES.fx;
    this.shake = Math.max(0, this.shake - dt * 0.03);
    this.flash = Math.max(0, this.flash - dt * 0.0012);
    this.bubbles = this.bubbles.filter(b => b.until > n);
    this.floats = this.floats.filter(f => n - f.t0 < R.floatMs);
    this.rustles = this.rustles.filter(r => r.until > n);
    this.teeth = this.teeth.filter(r => r.until > n);
    this.eyes = this.eyes.filter(e => e.until > n);
    this.deaths = this.deaths.filter(d => n - d.t0 < R.deathMs);
    this.words = this.words.filter(w => n - w.t0 < R.wordMs);
  },

  toggleReduced() {
    this.reduced = !this.reduced;
    Settings.set('reducedFx', this.reduced);
    this.shake = 0;
    this.flash = 0;
    return this.reduced;
  },
};
