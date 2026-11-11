'use strict';
// npm test: every check, each in its own process (run side by side), then one summary.
// It never re-records anything. A suite's full output is shown only if it fails (or with -v).

const { spawn } = require('child_process');

const SUITES = [
  ['lint-globals', ['lint-globals.js']],
  ['load-check', ['load-check.js']],
  ['guards', ['guards.js']],
  ['check-text', ['check-text.js']],
  ['check-rooms', ['check-rooms.js']],
  ['golden', ['golden/golden.js']],
  ['targeted', ['suites/targeted.js']],
  ['newstuff (rooms)', ['suites/newstuff.js']],
  ['newfeat (39 checks)', ['suites/newfeat.js']],
  ['withdraw (16 checks)', ['suites/withdraw.js']],
  ['oldgraves', ['suites/oldgraves.js']],
  ['saveresume', ['suites/saveresume.js']],
  ['danger', ['suites/danger.js']],
  ['howyouplay', ['suites/howyouplay.js']],
  ['looks', ['suites/looks.js']],
  ['smoke (quick)', ['suites/smoke.js', '--quick']],
];
const verbose = process.argv.includes('-v');

const t0 = Date.now();
const runs = SUITES.map(([name, args]) => new Promise(resolve => {
  const started = Date.now();
  const p = spawn(process.execPath, args, { cwd: __dirname });
  let out = '';
  p.stdout.on('data', d => { out += d; });
  p.stderr.on('data', d => { out += d; });
  p.on('close', code => resolve({ name, code, out, secs: (Date.now() - started) / 1000 }));
}));

Promise.all(runs).then(results => {
  let failed = 0;
  for (const r of results) {
    const last = r.out.trim().split('\n').filter(l => /PASS|FAIL/.test(l)).pop() || r.out.trim().split('\n').pop();
    const ok = r.code === 0;
    if (!ok) failed++;
    if (!ok || verbose) console.log(`\n----- ${r.name} -----\n${r.out.trim()}`);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(22)} ${r.secs.toFixed(1).padStart(5)}s  ${last}`);
  }
  console.log(`\n${failed ? 'FAILED' : 'ALL PASSED'}: ${results.length - failed} of ${results.length} suites passed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  process.exit(failed ? 1 : 0);
});
