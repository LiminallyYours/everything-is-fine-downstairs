'use strict';
// The single-file build: run python3 build.py, check it bundled as many scripts as index.html
// lists, then load the built page's scripts (each on its own, as a browser would) and play a few
// turns. Saves tests/out/single-file.png.
//
//   node shots/single.js

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createGame, scriptList, ROOT } = require('../harness');

const fail = m => { console.log('single: FAIL (' + m + ')'); process.exit(1); };
const said = execFileSync('python3', [path.join(ROOT, 'build.py')], { cwd: ROOT, encoding: 'utf8' }).trim();
console.log(said);
const count = Number((said.match(/Bundled (\d+) scripts/) || [])[1]);
const want = scriptList().length;
if (count !== want) fail(`build.py bundled ${count} scripts, index.html has ${want}`);

const html = fs.readFileSync(path.join(ROOT, 'dist', 'everything-is-fine-downstairs.html'), 'utf8');
const sources = [...html.matchAll(/<script>\n\/\/ ---- ([^\n]+) ----\n([\s\S]*?)\n<\/script>/g)].map(m => ({ file: 'dist:' + m[1], code: m[2] }));
if (sources.length !== want) fail(`found ${sources.length} bundled scripts in the dist file, expected ${want}`);
if (/<script src=/.test(html)) fail('the dist file still loads scripts from js/');

const H = createGame({ seed: 1, sources, canvas: require('@napi-rs/canvas') });
const G = H.G;
H.press('x'); H.press('Enter');
for (let i = 0; i < 80 && G.mode !== 'play'; i++) { H.press('Enter'); H.tick(40); }
for (const k of ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', ' ', 'ArrowRight']) {
  for (let i = 0; i < 20 && G.mode === 'card'; i++) { H.press('Enter'); H.tick(100); } // a bestiary page
  H.press(k); H.tick(150);
}
for (let i = 0; i < 20 && G.mode === 'card'; i++) { H.press('Enter'); H.tick(100); }
const out = path.join(__dirname, '..', 'out');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'single-file.png'), H.png());
const noisy = H.consoleLog.filter(l => /^(warn|error)/.test(l));
if (noisy.length) fail('console: ' + noisy.join(' | '));
if (!H.files.every(f => typeof f === 'object' && f.file.startsWith('dist:'))) fail('the scripts did not come from the dist file');
if (!['play', 'encounter'].includes(G.mode) || G.turn < 1) fail(`did not reach play (mode ${G.mode}, turn ${G.turn})`);
console.log(`single: PASS (${sources.length} scripts run from the dist file, reached play, mode ${G.mode}, turn ${G.turn}; screenshot in tests/out/single-file.png)`);
