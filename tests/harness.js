'use strict';
// Loads the real game into a fake browser inside a Node vm context.
//
//   const { createGame } = require('./harness');
//   const H = createGame({ seed: 7 });   // H.G is the game state; H.press('Enter'); H.tick(500)
//
// - The project root is found from this file's own location.
// - Scripts are found the way build.py finds them: <script src="..."></script> in index.html.
// - Each file runs separately (one vm.runInContext per file, with its file name), so a load-order
//   mistake fails the way it would in a browser. Errors are collected per file, like window.onerror.
// - Math.random is seeded, Date is fixed, and time (rAF, performance.now, timers, the audio clock)
//   only moves when the test calls tick(). Same seed + same keys = same game, every time.
// - Canvas: a recording stub by default (every fillText/strokeText string goes to onText), or a
//   real @napi-rs/canvas when `canvas: require('@napi-rs/canvas')` is passed (for screenshots).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT_RE = /<script src="([^"]+)"><\/script>/g; // the same pattern build.py uses
const FRAME_MS = 34;
const FIXED_DATE = Date.UTC(2026, 8, 28, 12, 0, 0); // 28 Sep 2026, noon UTC

function scriptList(htmlFile) {
  const html = fs.readFileSync(htmlFile || path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(SCRIPT_RE)].map(m => m[1]);
}

// sfc32, seeded through splitmix32. Small, fast, and identical on every machine.
function makeRandom(seed) {
  let s = (seed >>> 0) || 0x9e3779b9;
  const split = () => {
    s = (s + 0x9e3779b9) | 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) >>> 0;
  };
  let a = split(), b = split(), c = split(), d = split();
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();
  return next;
}

// ---------------------------------------------------------------------------------------
// A canvas that draws nothing but remembers every string it was asked to write.

const CTX_DEFAULTS = {
  globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '#000000', strokeStyle: '#000000',
  lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', miterLimit: 10, lineDashOffset: 0,
  font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic', direction: 'ltr',
  shadowBlur: 0, shadowColor: 'rgba(0, 0, 0, 0)', shadowOffsetX: 0, shadowOffsetY: 0,
  imageSmoothingEnabled: true, filter: 'none',
};

function stubCanvas(textSink, w, h) {
  const noop = () => {};
  const canvas = { width: w, height: h, style: {}, getContext: () => ctx, toDataURL: () => 'data:,', addEventListener: noop };
  const target = Object.assign({}, CTX_DEFAULTS, {
    canvas,
    fillText(s, x, y) { textSink(String(s), x, y); },
    strokeText(s, x, y) { textSink(String(s), x, y); },
    measureText: s => ({ width: String(s).length * 9, actualBoundingBoxAscent: 7, actualBoundingBoxDescent: 2 }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createPattern: () => ({ setTransform: noop }),
    createImageData: (cw, ch) => ({ width: cw, height: ch, data: new Uint8ClampedArray(cw * ch * 4) }),
    getImageData: (x, y, cw, ch) => ({ width: cw, height: ch, data: new Uint8ClampedArray(cw * ch * 4) }),
    getLineDash: () => [],
    isPointInPath: () => false,
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
  });
  const ctx = new Proxy(target, {
    get: (t, k) => (k in t ? t[k] : noop),
    set: (t, k, v) => { t[k] = v; return true; },
  });
  return canvas;
}

// The menu cards are typed one character at a time on a grid. Join consecutive single characters
// on the same baseline back into the strings they spell (gaps become spaces), so tests see words.
function makeTextJoiner(emit) {
  let run = null, step = 0;
  const flush = () => { if (run) { emit(run.s); run = null; } };
  const sink = (s, x, y) => {
    if (s.length === 1 && run && y === run.y && x > run.x) {
      const dx = x - run.x;
      if (!step || dx < step - 0.01) step = dx;
      const gap = Math.max(0, Math.round(dx / step) - 1);
      run.s += ' '.repeat(Math.min(gap, 40)) + s;
      run.x = x;
      return;
    }
    flush();
    if (s.length === 1) { run = { s, x, y }; return; }
    emit(s);
  };
  return { sink, flush };
}

// ---------------------------------------------------------------------------------------
// WebAudio and speech, faked. Every audio parameter change and every utterance is logged so the
// golden test can notice when what you'd hear changes.

function roundNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? String(+v.toPrecision(6)) : String(v);
}

function makeAudio(now, log) {
  const rec = (...parts) => log.push(parts.map(roundNum).join(' '));
  class Param {
    constructor(owner, name, v) { this._o = owner; this._n = name; this._v = v; }
    get value() { return this._v; }
    set value(v) { this._v = v; rec(this._o, this._n, '=', v); }
    setValueAtTime(v, t) { this._v = v; rec(this._o, this._n, 'set', v, t); return this; }
    linearRampToValueAtTime(v, t) { rec(this._o, this._n, 'lin', v, t); return this; }
    exponentialRampToValueAtTime(v, t) { rec(this._o, this._n, 'exp', v, t); return this; }
    setTargetAtTime(v, t, c) { rec(this._o, this._n, 'tgt', v, t, c); return this; }
    cancelScheduledValues(t) { rec(this._o, this._n, 'cancel', t); return this; }
    connect() {}
  }
  const PARAMS = {
    gain: { gain: 1 }, osc: { frequency: 440, detune: 0 }, filter: { frequency: 350, Q: 1, gain: 0, detune: 0 },
    delay: { delayTime: 0 }, pan: { pan: 0 }, src: { playbackRate: 1, detune: 0 },
    comp: { threshold: -24, knee: 30, ratio: 12, attack: 0.003, release: 0.25 }, dest: {},
  };
  class Node {
    constructor(kind) {
      this._k = kind;
      for (const [n, v] of Object.entries(PARAMS[kind])) this[n] = new Param(kind, n, v);
    }
    connect(n) { return n; }
    disconnect() {}
    start(t, off) { rec(this._k, 'start', t, off === undefined ? '' : off, this.type || ''); }
    stop(t) { rec(this._k, 'stop', t); }
  }
  class AudioContext {
    constructor() { this.state = 'running'; this.sampleRate = 8000; this.destination = new Node('dest'); rec('ctx'); }
    get currentTime() { return now() / 1000; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
    createGain() { return new Node('gain'); }
    createOscillator() { return new Node('osc'); }
    createBiquadFilter() { return new Node('filter'); }
    createDelay() { return new Node('delay'); }
    createStereoPanner() { return new Node('pan'); }
    createBufferSource() { return new Node('src'); }
    createDynamicsCompressor() { return new Node('comp'); }
    createBuffer(ch, len, rate) {
      const data = Array.from({ length: ch }, () => new Float32Array(len));
      return { numberOfChannels: ch, length: len, sampleRate: rate, duration: len / rate, getChannelData: i => data[i] };
    }
  }
  return AudioContext;
}

function makeSpeech(spoken) {
  class SpeechSynthesisUtterance {
    constructor(text) { this.text = String(text); this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null; }
  }
  const speechSynthesis = {
    speaking: false, pending: false, paused: false, onvoiceschanged: null,
    getVoices: () => [],
    speak: u => spoken.push(u),
    cancel: () => {},
    pause: () => {}, resume: () => {},
  };
  return { SpeechSynthesisUtterance, speechSynthesis };
}

// ---------------------------------------------------------------------------------------

// Run scripts into a sandbox, one vm.runInContext per script, each with its own file name.
// Each entry is a path under root (read from disk) or { file, code } (already-read source, e.g.
// the scripts inlined in the dist file). Returns the errors, one per script that threw.
function loadFiles(context, files, root) {
  const errors = [];
  for (const f of files) {
    const name = typeof f === 'string' ? f : f.file;
    const file = typeof f === 'string' ? path.join(root || ROOT, f) : f.file;
    try {
      const code = typeof f === 'string' ? fs.readFileSync(file, 'utf8') : f.code;
      vm.runInContext(code, context, { filename: file });
    } catch (e) {
      errors.push({ file: name, error: e });
    }
  }
  return errors;
}

/**
 * Make a game in a fake browser.
 * opts: seed (number, default 1), files (script paths; default: all of index.html, in order),
 *       sources ([{ file, code }] to run instead of files, e.g. the dist file's inlined scripts),
 *       width/height (default 1440x900), store (initial localStorage, { 'rot.x': '...' }),
 *       canvas (the @napi-rs/canvas module, for real pixels), boot (default true: tick 100 ms),
 *       audio / voice (default true: fake AudioContext / speechSynthesis), throwOnLoadError (default true)
 */
function createGame(opts = {}) {
  const seed = opts.seed === undefined ? 1 : opts.seed;
  const Wd = opts.width || 1440, Ht = opts.height || 900;
  const files = opts.sources || opts.files || scriptList();
  const store = Object.assign({}, opts.store || {});
  const listeners = {};
  const spoken = [], audioLog = [], consoleLog = [];
  let clock = opts.startTime || 1000;
  let rafs = [], timers = [], timerSeq = 0, frames = 0;
  const rand = makeRandom(seed), forced = [];

  const api = {
    G: null, store, spoken, audioLog, consoleLog, files, seed,
    onText: null,       // (string) => void, for every string written on any canvas
    afterFrame: null,   // () => void, after every animation frame
    loadErrors: [],
  };
  const joiner = makeTextJoiner(s => { if (api.onText) api.onText(s); });

  let main, makeCanvas;
  if (opts.canvas) {
    const { createCanvas } = opts.canvas;
    main = createCanvas(Wd, Ht);
    main.style = {};
    makeCanvas = () => { const c = createCanvas(1, 1); c.style = {}; return c; };
  } else {
    main = stubCanvas(joiner.sink, Wd, Ht);
    makeCanvas = () => stubCanvas(joiner.sink, 0, 0);
  }
  const element = () => ({ style: {}, textContent: '', innerHTML: '', appendChild() {}, addEventListener() {} });
  const fakeConsole = {};
  for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
    fakeConsole[level] = (...a) => {
      consoleLog.push(level + ': ' + a.map(x => (typeof x === 'string' ? x : String(x))).join(' '));
      if (opts.echoConsole !== false && (level === 'warn' || level === 'error')) console[level](...a);
    };
  }
  const now = () => clock;
  const { SpeechSynthesisUtterance, speechSynthesis } = makeSpeech(spoken);
  const sandbox = {
    console: fakeConsole,
    innerWidth: Wd, innerHeight: Ht, devicePixelRatio: 1,
    addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
    removeEventListener: (ev, fn) => { listeners[ev] = (listeners[ev] || []).filter(f => f !== fn); },
    requestAnimationFrame: cb => { rafs.push(cb); return rafs.length; },
    cancelAnimationFrame: () => {},
    setTimeout: (fn, ms) => { timers.push({ id: ++timerSeq, at: clock + (ms || 0), fn }); return timerSeq; },
    clearTimeout: id => { timers = timers.filter(t => t.id !== id); },
    setInterval: (fn, ms) => { const t = { id: ++timerSeq, at: clock + (ms || 1), fn, every: ms || 1 }; timers.push(t); return t.id; },
    clearInterval: id => { timers = timers.filter(t => t.id !== id); },
    performance: { now },
    localStorage: {
      getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    },
    document: {
      getElementById: id => (id === 'screen' ? main : element()),
      createElement: tag => (tag === 'canvas' ? makeCanvas() : element()),
      body: element(),
    },
    navigator: { userAgent: 'node-test-harness', language: 'en-US' },
  };
  if (opts.audio !== false) sandbox.AudioContext = makeAudio(now, audioLog);
  if (opts.voice !== false) Object.assign(sandbox, { SpeechSynthesisUtterance, speechSynthesis });
  const context = vm.createContext(sandbox);

  // Make it look like a browser page: window is the global object, Math.random is seeded,
  // and the date is always the same.
  vm.runInContext(`(function (rand, fixed) {
    globalThis.window = globalThis;
    globalThis.self = globalThis;
    Math.random = rand;
    const RealDate = Date;
    const pad = n => String(n);
    class FakeDate extends RealDate {
      constructor(...a) { if (a.length) super(...a); else super(fixed()); }
      static now() { return fixed(); }
      toLocaleDateString() { return pad(this.getUTCMonth() + 1) + '/' + pad(this.getUTCDate()) + '/' + this.getUTCFullYear(); }
      toLocaleTimeString() { return this.toISOString().slice(11, 19); }
      toLocaleString() { return this.toLocaleDateString() + ', ' + this.toLocaleTimeString(); }
    }
    globalThis.Date = FakeDate;
  })`, context, { filename: 'harness-prelude.js' })(() => (forced.length ? forced.shift() : rand()), () => FIXED_DATE + clock);

  api.loadErrors = loadFiles(context, files, opts.root);
  if (api.loadErrors.length && opts.throwOnLoadError !== false) {
    const e = api.loadErrors[0];
    const err = new Error(`${api.loadErrors.length} file(s) failed to load. First: ${e.file}: ${e.error && e.error.stack || e.error}`);
    err.loadErrors = api.loadErrors;
    throw err;
  }

  const run = code => vm.runInContext(code, context, { filename: 'test-code.js' });
  const runTimers = () => {
    for (;;) {
      const due = timers.filter(t => t.at <= clock).sort((a, b) => a.at - b.at || a.id - b.id)[0];
      if (!due) return;
      if (due.every) due.at += due.every; else timers = timers.filter(t => t !== due);
      due.fn();
    }
  };
  const frame = () => {
    clock += FRAME_MS;
    runTimers();
    const cbs = rafs;
    rafs = [];
    for (const cb of cbs) cb(clock);
    frames++;
    joiner.flush();
    if (api.afterFrame) api.afterFrame();
  };
  Object.assign(api, {
    context, sandbox, main, run, frame,
    has: name => run(`typeof ${name} !== 'undefined'`),
    get: name => run(name),
    now,
    frames: () => frames,
    // The next Math.random() calls return these values (then the seeded stream carries on).
    forceRandom: (...vals) => { forced.push(...vals); },
    forcedLeft: () => forced.length,
    listeners,
    // Press a key the way a browser would deliver it.
    press(key, repeat = false, mods = {}) {
      const ev = Object.assign({ key, code: key, repeat, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, preventDefault() {}, stopPropagation() {} }, mods);
      for (const fn of listeners.keydown || []) fn(ev);
      joiner.flush();
    },
    // Let `ms` milliseconds of animation pass, one 34 ms frame at a time.
    tick(ms) { const end = clock + ms; while (clock < end) frame(); },
    // The real canvas (screenshots): draw one more frame and return PNG bytes.
    png() { frame(); return main.toBuffer('image/png'); },
  });
  try { api.G = run('typeof G !== "undefined" ? G : null'); } catch (e) { api.G = null; }
  if (opts.boot !== false && api.G) api.tick(100);
  return api;
}

const arrowFor = d => ({ '0,-1': 'ArrowUp', '1,0': 'ArrowRight', '0,1': 'ArrowDown', '-1,0': 'ArrowLeft' })[String(d)];

module.exports = { ROOT, SCRIPT_RE, FRAME_MS, scriptList, makeRandom, loadFiles, createGame, arrowFor };
