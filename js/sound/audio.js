'use strict';
// Every sound is synthesized live with WebAudio: no files, nothing to download.
// Browsers only allow sound after a key press, so Sound.init() runs on every keydown (it's cheap).

// A lullaby in A minor, [midi note, beats]. The music box plays it slower and more out of tune as Dread rises.
const LULLABY = [
  [76, 1], [72, 1], [69, 1], [71, 1], [68, 1], [64, 1], [69, 1], [72, 1], [76, 1], [74, 3],
  [77, 1], [74, 1], [71, 1], [72, 1], [69, 1], [65, 1], [64, 1], [68, 1], [71, 1], [69, 3],
];
const DRONE_ROOT = [55, 49, 43.65, 41.2, 61.74, 36.71]; // one low hum per floor, in Hz

// On a phone the music box and the floor's hum are turned down (RULES.phone.musicVolume), so the
// narrator's voice comes through a small speaker. (Phone is worked out in js/draw/render.js.)
const musicLevel = () => (typeof Phone !== 'undefined' && Phone.on ? RULES.phone.musicVolume : 1);

const Sound = {
  ctx: null, master: null, boxBus: null, noiseBuf: null, drone: null, scene: null,
  muted: Settings.get('muted'),
  nextNote: 0, noteIdx: 0, nextBeat: 0,

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : RULES.audio.master;
    this.master.connect(comp);
    const len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    // The music box gets an echo, like it's playing in an empty room.
    this.boxBus = ctx.createGain();
    this.boxBus.gain.value = 0;
    const delay = ctx.createDelay(), fb = ctx.createGain();
    delay.delayTime.value = RULES.audio.echo;
    fb.gain.value = RULES.audio.echoFeedback;
    this.boxBus.connect(this.master);
    this.boxBus.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(this.master);
    const s = this.scene;
    this.scene = null;
    if (s != null) this.setScene(s);
  },

  toggleMute() {
    this.muted = !this.muted;
    Settings.set('muted', this.muted);
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : RULES.audio.master, this.ctx.currentTime, 0.05);
    if (this.muted) Voice.stop();
    return this.muted;
  },

  // scene: 'title' | 'dead' | 'win' | a floor number
  setScene(scene) {
    if (scene === this.scene) return;
    this.scene = scene;
    if (!this.ctx) return;
    this.stopDrone();
    if (typeof scene === 'number') this.startDrone(scene);
  },

  startDrone(depth) {
    const ctx = this.ctx, t = ctx.currentTime, base = DRONE_ROOT[depth - 1] || 50;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(RULES.audio.drone * musicLevel(), t + 3);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;
    lp.Q.value = 4;
    const lfo = ctx.createOscillator(), lfoAmt = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoAmt.gain.value = 120;
    lfo.connect(lfoAmt);
    lfoAmt.connect(lp.frequency);
    const oscs = [[base, 'triangle', 0], [base * 1.5, 'sawtooth', 7], [base * 2.01, 'sine', -5]].map(([f, type, det]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      return o;
    });
    const wind = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), wg = ctx.createGain();
    wind.buffer = this.noiseBuf;
    wind.loop = true;
    bp.type = 'bandpass';
    bp.frequency.value = 400;
    bp.Q.value = 0.8;
    wg.gain.value = depth === 4 ? RULES.audio.seaWind : RULES.audio.wind; // the Sea-Caves are windier
    const windLfo = ctx.createOscillator(), wAmt = ctx.createGain();
    windLfo.frequency.value = 0.05;
    wAmt.gain.value = 250;
    windLfo.connect(wAmt);
    wAmt.connect(bp.frequency);
    wind.connect(bp);
    bp.connect(wg);
    wg.connect(out);
    lp.connect(out);
    out.connect(this.master);
    const nodes = [...oscs, lfo, wind, windLfo];
    nodes.forEach(n => n.start());
    this.drone = { out, nodes, lp };
  },

  stopDrone() {
    if (!this.drone) return;
    const { out, nodes } = this.drone, t = this.ctx.currentTime;
    out.gain.cancelScheduledValues(t);
    out.gain.setValueAtTime(out.gain.value, t);
    out.gain.linearRampToValueAtTime(0, t + 1.5);
    nodes.forEach(n => n.stop(t + 1.6));
    this.drone = null;
  },

  // Called every frame. s = { danger 0-1, dread 0-1, box 0-1 (music box volume) }
  update(s) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    this.boxBus.gain.setTargetAtTime(s.box * RULES.audio.musicBox * musicLevel(), t, 0.4);
    if (s.box > 0.01) {
      if (this.nextNote < t) this.nextNote = t + 0.05;
      while (this.nextNote < t + 0.2) {
        const [midi, beats] = LULLABY[this.noteIdx++ % LULLABY.length];
        const cents = (Math.random() * 2 - 1) * (8 + s.dread * 60);
        this.boxNote(midi, this.nextNote, cents);
        this.nextNote += beats * (0.42 + s.dread * 0.35);
      }
    }
    if (s.danger > RULES.audio.heartbeatFrom) {
      if (this.nextBeat < t) this.nextBeat = t + 0.1;
      if (this.nextBeat < t + 0.15) {
        this.heartbeat(this.nextBeat, s.danger);
        this.nextBeat += 1.2 - s.danger * 0.7;
      }
    }
    if (this.drone) this.drone.lp.frequency.setTargetAtTime(220 + s.dread * 500, t, 1);
  },

  boxNote(midi, when, cents) {
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    for (const [mult, vol] of [[1, 0.5], [2, 0.08], [4.02, 0.12]]) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f * mult;
      o.detune.value = cents;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(vol, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
      o.connect(g);
      g.connect(this.boxBus);
      o.start(when);
      o.stop(when + 1.5);
    }
  },

  heartbeat(when, danger) {
    const v = 0.25 + danger * 0.5;
    this.tone(62, 0.2, 'sine', v, { when, slideTo: 38 });
    this.tone(58, 0.18, 'sine', v * 0.6, { when: when + 0.17, slideTo: 36 });
  },

  out(pan) {
    if (pan == null || !this.ctx.createStereoPanner) return this.master;
    const p = this.ctx.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    p.connect(this.master);
    return p;
  },

  tone(freq, dur, type, vol, o = {}) {
    const ctx = this.ctx, t = o.when || ctx.currentTime;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
    if (o.vibrato) {
      const l = ctx.createOscillator(), la = ctx.createGain();
      l.frequency.value = o.vibrato;
      la.gain.value = freq * 0.03;
      l.connect(la);
      la.connect(osc.frequency);
      l.start(t);
      l.stop(t + dur);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lowpass;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(this.out(o.pan));
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },

  noise(dur, vol, o = {}) {
    const ctx = this.ctx, t = o.when || ctx.currentTime;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = this.noiseBuf;
    src.loop = true;
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1000, t);
    f.Q.value = o.q || 1;
    if (o.slideTo) f.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.out(o.pan));
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  },

  // play('hit'), play('rustle', 0.4, -0.8) for quiet and on the left, play('bell', 1, 0, 1.2) to delay 1.2s
  play(name, vol = 1, pan, delay = 0) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running' || vol <= 0.01) return;
    const fn = SFX[name];
    if (fn) fn(this, this.ctx.currentTime + delay, vol, pan);
  },
};

// Every horror babbles in its own voice: [pitch Hz, waveform, syllable length s, gap s, pitch spread (semitones), vibrato Hz, volume]
const BABBLE = {
  mite: [380, 'triangle', 0.07, 0.03, 3, 0, 0.07], bat: [950, 'square', 0.04, 0.02, 5, 0, 0.04],
  putaway: [640, 'triangle', 0.06, 0.03, 6, 0, 0.06], opinion: [240, 'sawtooth', 0.08, 0.03, 4, 0, 0.06],
  zombie: [105, 'sawtooth', 0.16, 0.06, 2, 3, 0.08], wraith: [520, 'sine', 0.14, 0.04, 3, 6, 0.07],
  mimic: [170, 'square', 0.07, 0.02, 6, 0, 0.05], thing: [430, 'triangle', 0.05, 0.02, 7, 0, 0.06],
  tot: [720, 'square', 0.04, 0.02, 8, 0, 0.04], giraffe: [135, 'sawtooth', 0.12, 0.04, 2, 2, 0.07],
  sockling: [560, 'triangle', 0.05, 0.03, 5, 0, 0.05], tuck: [300, 'sine', 0.2, 0.08, 2, 5, 0.09],
  nibbler: [85, 'sawtooth', 0.14, 0.04, 3, 4, 0.1], ghost: [440, 'sine', 0.18, 0.06, 2, 7, 0.06],
};

Sound.babble = function (text, voice, pan) {
  if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
  const [f0, wave, len, gap, spread, vib, vol] = BABBLE[voice] || BABBLE.thing;
  const n = clamp((String(text).match(/[aeiouy]+/gi) || []).length, 2, 9);
  let t = this.ctx.currentTime + 0.03;
  for (let i = 0; i < n; i++) {
    const f = f0 * Math.pow(2, ((Math.random() * 2 - 1) * spread) / 12), d = len * (0.7 + Math.random() * 0.6);
    this.tone(f, d, wave, vol, { when: t, slideTo: f * (0.8 + Math.random() * 0.35), lowpass: 2400, vibrato: vib, pan });
    t += d + gap;
  }
};

const SFX = {
  step: (s, t, v) => s.noise(0.05, 0.025 * v, { freq: 900, q: 2, when: t }),
  hit: (s, t, v) => {
    s.noise(0.09, 0.35 * v, { type: 'lowpass', freq: 900, when: t });
    s.tone(130, 0.12, 'square', 0.12 * v, { slideTo: 55, lowpass: 600, when: t });
  },
  miss: (s, t, v) => s.tone(1300, 0.35, 'sine', 0.1 * v, { slideTo: 260, when: t }),
  hurt: (s, t, v) => {
    s.tone(95, 0.3, 'sawtooth', 0.3 * v, { slideTo: 40, lowpass: 500, when: t });
    s.noise(0.15, 0.25 * v, { type: 'lowpass', freq: 400, when: t });
  },
  thud: (s, t, v) => s.tone(80, 0.25, 'sine', 0.3 * v, { slideTo: 50, when: t }),
  kill: (s, t, v) => {
    s.tone(620, 0.2, 'sine', 0.2 * v, { slideTo: 110, when: t });
    s.noise(0.05, 0.2 * v, { freq: 2500, when: t });
  },
  pickup: (s, t, v) => {
    s.tone(880, 0.12, 'triangle', 0.1 * v, { when: t });
    s.tone(1320, 0.18, 'triangle', 0.1 * v, { when: t + 0.07 });
  },
  drink: (s, t, v) => [0, 0.13, 0.26].forEach(o => s.noise(0.09, 0.2 * v, { freq: 350, q: 6, slideTo: 200, when: t + o })),
  scroll: (s, t, v) => s.noise(0.35, 0.08 * v, { type: 'highpass', freq: 3000, attack: 0.05, when: t }),
  rhymeGood: (s, t, v) => [523, 659, 784, 1046].forEach((f, i) => s.tone(f, 0.4, 'triangle', 0.13 * v, { when: t + i * 0.07 })),
  wah: (s, t, v) => [311, 294, 277].forEach((f, i) =>
    s.tone(f, i === 2 ? 0.8 : 0.28, 'sawtooth', 0.12 * v, { lowpass: 1100, vibrato: i === 2 ? 6 : 0, when: t + i * 0.3 })),
  death: (s, t, v) => [311, 294, 277, 262].forEach((f, i) =>
    s.tone(f, i === 3 ? 1.5 : 0.42, 'sawtooth', 0.14 * v, { lowpass: 1000, vibrato: i === 3 ? 5 : 0, when: t + 0.3 + i * 0.45 })),
  levelup: (s, t, v) => [392, 494, 587, 784, 988].forEach((f, i) => s.tone(f, 0.3, 'triangle', 0.1 * v, { when: t + i * 0.06 })),
  stairs: (s, t, v) => [0, 0.22, 0.44, 0.66].forEach((o, i) => {
    s.tone(95 - i * 8, 0.15, 'sine', 0.25 * v, { slideTo: 50, when: t + o });
    s.noise(0.06, 0.08 * v, { type: 'lowpass', freq: 700, when: t + o });
  }),
  sting: (s, t, v) => {
    [233, 247, 370, 523].forEach(f => s.tone(f, 1.4, 'sawtooth', 0.07 * v, { lowpass: 2500, attack: 0.005, when: t }));
    s.noise(1.0, 0.2 * v, { type: 'highpass', freq: 1500, slideTo: 6000, when: t });
    s.tone(1900, 0.8, 'sine', 0.05 * v, { slideTo: 1500, vibrato: 11, when: t });
  },
  whisper: (s, t, v, pan) => s.noise(1.3, 0.07 * v, { freq: 900, q: 8, slideTo: 2400, attack: 0.4, pan, when: t }),
  splash: (s, t, v) => s.noise(0.25, 0.15 * v, { type: 'lowpass', freq: 1400, when: t }),
  bell: (s, t, v) => [[1, 0.22], [2.76, 0.09], [5.4, 0.05], [8.93, 0.03]].forEach(([m, a]) =>
    s.tone(196 * m, 3, 'sine', a * v, { attack: 0.005, when: t })),
  rustle: (s, t, v, pan) => [0, 0.06, 0.13].forEach(o => s.noise(0.05, 0.09 * v, { type: 'highpass', freq: 2500, pan, when: t + o })),
  chew: (s, t, v) => [0, 0.12, 0.24].forEach(o => s.noise(0.07, 0.3 * v, { freq: 500, q: 3, when: t + o })),
  ghost: (s, t, v) => {
    s.tone(520, 1.6, 'sine', 0.08 * v, { slideTo: 300, vibrato: 5, attack: 0.3, when: t });
    s.tone(780, 1.6, 'sine', 0.04 * v, { slideTo: 450, vibrato: 4, attack: 0.3, when: t });
  },
  candle: (s, t, v) => s.noise(0.3, 0.15 * v, { freq: 600, slideTo: 2000, when: t }),
  snuff: (s, t, v) => s.noise(0.5, 0.12 * v, { type: 'highpass', freq: 4000, slideTo: 1500, when: t }),
  tick: (s, t, v, pan) => s.tone(2400, 0.03, 'square', 0.05 * v, { pan, when: t }),
  laugh: (s, t, v) => [0, 0.12, 0.24].forEach((o, i) => s.tone(900 + i * 60, 0.09, 'triangle', 0.08 * v, { vibrato: 20, when: t + o })),
};
