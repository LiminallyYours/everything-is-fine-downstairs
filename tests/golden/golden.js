'use strict';
// The golden transcript: run every scenario and compare what the player saw and heard with
// tests/golden/baseline.json, line by line. Any difference fails, and the first differences are
// printed with their scenario and line number.
//
//   node golden/golden.js              compare with the baseline (what npm test runs)
//   node golden/golden.js --record     write a new baseline (only when a change is meant to show)
//   node golden/golden.js --only screens,rooms     just these scenarios (compare only)
//   node golden/golden.js --print rooms            print one scenario's transcript
//   node golden/golden.js --twice      run everything twice and check both runs are identical
//   node golden/golden.js --list       list the scenarios
//   --jobs N                           worker threads (default: one less than the CPUs, at most 6)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { Worker, isMainThread, parentPort } = require('worker_threads');

const BASELINE = path.join(__dirname, 'baseline.json');
const OUT_DIR = path.join(__dirname, '..', 'out');

function runScenario(sc) {
  const { createGame } = require('../harness');
  const { createRecorder } = require('./recorder');
  const { makeCtx } = require('./scenarios');
  const H = createGame({ seed: sc.seed, store: sc.store, boot: false, echoConsole: false });
  const rec = createRecorder(H);
  rec.push(`# scenario ${sc.name}, seed ${sc.seed}`);
  H.tick(100);
  let error = null;
  try {
    sc.run(makeCtx(H, rec));
  } catch (e) {
    error = e;
  }
  const lines = rec.finish();
  if (error) lines.push(`! ${error.name}: ${error.message}`);
  lines.push(`# end: mode ${H.G.mode}, turn ${H.G.turn}, frames ${H.frames()}`);
  return { lines, error: error ? error.stack : null };
}

if (!isMainThread) {
  // A worker runs one scenario at a time, each in a brand-new game, and asks for the next.
  const { scenarios } = require('./scenarios');
  parentPort.on('message', name => {
    if (name === null) { process.exit(0); }
    const sc = scenarios.find(s => s.name === name);
    const t0 = Date.now();
    const r = runScenario(sc);
    parentPort.postMessage({ name, ms: Date.now() - t0, lines: r.lines, error: r.error });
  });
  return;
}

// Run the scenarios on `jobs` worker threads. The longest (by the baseline's size) go first, and
// each worker takes the next one when it is free. Every scenario starts its own fresh game, so
// which worker runs it, and in what order, cannot change its transcript.
function runAll(names, jobs) {
  let cost = {};
  try { const b = JSON.parse(fs.readFileSync(BASELINE, 'utf8')).scenarios; for (const n of Object.keys(b)) cost[n] = b[n].length; } catch (e) { cost = {}; }
  const queue = names.slice().sort((a, b) => (cost[b] || 0) - (cost[a] || 0));
  const results = {};
  return Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, () => new Promise((resolve, reject) => {
    const w = new Worker(__filename);
    const next = () => w.postMessage(queue.length ? queue.shift() : null);
    w.on('message', m => { results[m.name] = m; next(); });
    w.on('error', reject);
    w.on('exit', code => (code ? reject(new Error('worker exited with ' + code)) : resolve()));
    next();
  }))).then(() => results);
}

function showDiff(name, want, got) {
  let i = 0;
  while (i < want.length && i < got.length && want[i] === got[i]) i++;
  const lines = [`  ${name}: first difference at line ${i + 1} (baseline has ${want.length} lines, this run ${got.length})`];
  for (let k = Math.max(0, i - 6); k < i; k++) lines.push(`      ${k + 1}  ${got[k]}`);
  for (let k = i; k < Math.min(want.length, i + 8); k++) lines.push(`    - ${k + 1}  ${want[k]}`);
  for (let k = i; k < Math.min(got.length, i + 8); k++) lines.push(`    + ${k + 1}  ${got[k]}`);
  return lines.join('\n');
}

function serialize(scen) {
  // One entry per line, so git diffs of the baseline are readable.
  const parts = Object.keys(scen).map(n => `  ${JSON.stringify(n)}: [\n${scen[n].map(l => '    ' + JSON.stringify(l)).join(',\n')}\n  ]`);
  return `{\n "note": "Golden transcript. Do not edit by hand: run npm run golden:record from tests/ when a change is meant to show.",\n "scenarios": {\n${parts.join(',\n')}\n }\n}\n`;
}

async function main() {
  const args = process.argv.slice(2);
  const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
  const { scenarios } = require('./scenarios');
  if (args.includes('--list')) { for (const s of scenarios) console.log(s.name, '(seed ' + s.seed + ')'); return; }
  const only = opt('--only') || opt('--print');
  const names = only ? only.split(',') : scenarios.map(s => s.name);
  for (const n of names) if (!scenarios.some(s => s.name === n)) { console.log('golden: no scenario called ' + n); process.exit(2); }
  const jobs = Number(opt('--jobs')) || Math.max(1, Math.min(6, os.cpus().length - 1));
  const t0 = Date.now();
  const results = await runAll(names, jobs);
  const errors = names.filter(n => results[n].error);
  for (const n of errors) console.log(`golden: scenario ${n} crashed:\n${results[n].error}`);
  const got = {};
  for (const n of names) got[n] = results[n].lines;
  const total = names.reduce((s, n) => s + got[n].length, 0);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  if (opt('--print')) { for (const l of got[names[0]]) console.log(l); return; }

  if (args.includes('--twice')) {
    const again = await runAll(names, jobs);
    const differ = names.filter(n => JSON.stringify(again[n].lines) !== JSON.stringify(got[n]));
    for (const n of differ) console.log(showDiff(n + ' (run 1 vs run 2)', got[n], again[n].lines));
    console.log(`golden --twice: ${differ.length ? 'FAIL' : 'PASS'} (${names.length} scenarios, ${total} lines, identical twice)`);
    process.exit(differ.length ? 1 : 0);
  }

  if (args.includes('--record')) {
    if (errors.length) { console.log('golden: not recording, because a scenario crashed'); process.exit(1); }
    if (only) { console.log('golden: --record always records every scenario (leave out --only)'); process.exit(2); }
    fs.writeFileSync(BASELINE, serialize(got));
    const kb = Math.round(fs.statSync(BASELINE).size / 1024);
    console.log(`golden: recorded ${names.length} scenarios, ${total} lines, ${kb} KB, in ${secs}s -> ${path.relative(process.cwd(), BASELINE)}`);
    return;
  }

  if (!fs.existsSync(BASELINE)) { console.log('golden: FAIL (no baseline yet; run npm run golden:record)'); process.exit(1); }
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8')).scenarios;
  const failed = [];
  for (const n of names) {
    if (!base[n]) { failed.push(n); console.log(`  ${n}: not in the baseline`); continue; }
    if (JSON.stringify(base[n]) !== JSON.stringify(got[n])) { failed.push(n); console.log(showDiff(n, base[n], got[n])); }
  }
  if (!only) for (const n of Object.keys(base)) if (!names.includes(n)) { failed.push(n); console.log(`  ${n}: in the baseline but no longer a scenario`); }
  if (failed.length) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const file = path.join(OUT_DIR, 'golden-current.json');
    fs.writeFileSync(file, serialize(got));
    console.log(`  (this run's full transcript: ${path.relative(process.cwd(), file)})`);
  }
  console.log(`golden: ${failed.length ? 'FAIL' : 'PASS'} (${names.length - failed.length} of ${names.length} scenarios identical to the baseline, ${total} lines, ${secs}s)`);
  process.exit(failed.length ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
