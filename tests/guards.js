'use strict';
// Guard searches: numbers and words that used to be typed in several places now have one home
// each. This fails if a raw copy creeps back into the game files (comment lines don't count).
//
//   node guards.js

const fs = require('fs');
const path = require('path');
const { ROOT } = require('./harness');

// [pattern, why, its one home (a line that may match)]
const GUARDS = [
  [/inv\.length\s*(>=|<=|===|!==|==|!=|<|>)\s*10\b/, 'a raw pocket-size check: use pocketsFull() (RULES.player.pockets)'],
  [/dread\s*\/\s*100\b/, 'a raw Dread scale: use dreadFrac() (RULES.dread.max)'],
  [/Somebody #/, "a raw 'Somebody #': use phrase('somebody', { n }) (TEXT.somebody)", /^\s*somebody: 'Somebody #\{n\}',/],
];

function jsFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...jsFiles(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out.sort();
}

const files = jsFiles(path.join(ROOT, 'js'));
const hits = [];
for (const f of files) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/^\s*\/\//.test(line)) return; // a comment
    for (const [re, why, home] of GUARDS) {
      if (re.test(line) && !(home && home.test(line))) hits.push(`  ${path.relative(ROOT, f)}:${i + 1}: ${why}\n      ${line.trim()}`);
    }
  });
}
for (const h of hits) console.log(h);
console.log(hits.length
  ? `guards: FAIL (${hits.length} raw duplicate${hits.length === 1 ? '' : 's'} found)`
  : `guards: PASS (${GUARDS.length} guards, ${files.length} files under js/, nothing found)`);
process.exit(hits.length ? 1 : 0);
