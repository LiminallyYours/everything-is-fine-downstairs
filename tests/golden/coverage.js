'use strict';
// Which of the game's player-facing texts never show up in the golden baseline? A report, not a
// test: it reads the game's own text tables (TEXT, SPEECH, COUPLETS, BESTIARY, VIGNETTE_WORDS, FLOORS,
// MONSTERS, items, GAGS...) and every string literal of the game, and looks for each one in
// baseline.json. Templates count as found when their longest fixed piece is found.
//
//   node golden/coverage.js            summary by table, and the missing table entries
//   node golden/coverage.js --literals also list string literals (in any js file) that never show

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const { createGame, scriptList, ROOT } = require('../harness');

const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'baseline.json'), 'utf8')).scenarios;
const norm = s => String(s).replace(/\s+/g, ' ').trim();
// Bubbles are wrapped into lines joined by " / "; undo that for searching. Long texts drawn on
// the canvas are wrapped over several "+" lines in a row; join those back up too.
const lines = Object.values(base).flat();
const joined = [];
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].startsWith('+')) continue;
  let run = '';
  for (let k = i; k < lines.length && k < i + 6 && lines[k].startsWith('+'); k++) run += ' ' + lines[k].replace(/^\+(@\d+)? /, '');
  joined.push(run);
}
const blob = norm(lines.map(l => (l.startsWith('b') ? l.replace(/ \/ /g, ' ') : l)).concat(joined).join('\n'));
const blobLower = blob.toLowerCase();
const found = s => {
  const pieces = String(s).split(/\{\w+\}|\$\{[^}]*\}/).map(norm).filter(p => p.length >= 4);
  if (!pieces.length) return true;
  const longest = pieces.sort((a, b) => b.length - a.length)[0];
  return blob.includes(longest) || blob.includes(longest.charAt(0).toUpperCase() + longest.slice(1)) || (longest.length < 20 && blobLower.includes(longest.toLowerCase()));
};

const H = createGame({ seed: 1, boot: false });
const tables = H.run(`(() => {
  const t = {};
  const put = (name, list) => { t[name] = list.filter(s => typeof s === 'string' && s.trim() && !/^#[0-9a-f]{6}$/i.test(s)); };
  const deep = v => (Array.isArray(v) ? v.flatMap(deep) : v && typeof v === 'object' ? Object.values(v).flatMap(deep) : [v]);
  for (const [k, v] of Object.entries(TEXT)) put('TEXT.' + k, deep(v));
  for (const [m, kinds] of Object.entries(SPEECH)) for (const [k, v] of Object.entries(kinds)) put('SPEECH.' + m + '.' + k, v);
  put('WHISPERS', WHISPERS); put('BROKEN_ENDINGS', BROKEN_ENDINGS); put('ALIASES', ALIASES);
  put('COUPLETS', COUPLETS.flatMap(c => [c[0], c[1].replace('___', '{x}')]));
  put('COUPLETS words', COUPLETS.flatMap(c => [c[2]].concat(c[3])));
  put('BOSS_COUPLETS', BOSS_COUPLETS.flatMap(c => [c[0], c[1].replace('___', '{x}')].concat(c[2], c[3])));
  put('BESTIARY', Object.values(BESTIARY).flatMap(b => b.verse.concat(b.tip || [])));
  put('FLOORS', FLOORS.flatMap(f => [f.name].concat(f.verse.slice(0, 3))));
  put('MONSTERS', Object.values(MONSTERS).flatMap(m => [m.name, m.blurb, m.death].concat(m.verbs)));
  put('VIGNETTES', Object.values(VIGNETTE_WORDS).flatMap(v => [v.name, v.found, v.usedMsg].concat(v.verse, Object.values(v.choices).map(c => c.label))));
  put('VIGNETTES outcomes', Object.values(VIGNETTE_WORDS).flatMap(v => Object.values(v.choices).flatMap(c => Object.entries(c).filter(([k]) => k !== 'label').flatMap(([, l]) => l)).concat(v.names || [])));
  put('GAGS', GAGS.map(g => g[2]));
  put('items', POTIONS.concat(SCROLLS, FOODS).flatMap(x => [x.name, x.desc, x.bad || '', x.drink || '', x.splash || ''].concat(deep(x.read || ''))).concat(WEAPONS.concat(ARMORS, [MIRROR_SHARD]).flatMap(x => [x.name, x.desc])));
  put('looks', POTION_LOOKS.map(l => l[0]).concat(SCROLL_TITLES));
  return t;
})()`);
let total = 0, hit = 0;
const missing = [];
for (const [name, list] of Object.entries(tables)) {
  const miss = list.filter(s => !found(s));
  total += list.length; hit += list.length - miss.length;
  console.log(`${String(list.length - miss.length).padStart(4)} / ${String(list.length).padEnd(4)} ${name}`);
  for (const m of miss) missing.push(`${name}: ${m}`);
}
console.log(`\n${hit} of ${total} table texts appear in the baseline.`);
if (missing.length) { console.log('\nNever shown:'); for (const m of missing) console.log('  ' + m); }

if (process.argv.includes('--literals')) {
  console.log('\nString literals (and template pieces) of 12+ characters that never show:');
  for (const f of scriptList()) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const ast = acorn.parse(src, { ecmaVersion: 'latest', locations: true });
    const lits = [];
    (function walk(n) {
      if (!n || typeof n.type !== 'string') return;
      if (n.type === 'Literal' && typeof n.value === 'string') lits.push([n.value, n.loc.start.line]);
      if (n.type === 'TemplateLiteral') lits.push([n.quasis.map(q => q.value.cooked).join('{x}'), n.loc.start.line]);
      for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
    })(ast);
    for (const [s, line] of lits) {
      if (s.length < 12 || !/[a-z] [a-z]/i.test(s) || /^[#\d(]|px |rgba|serif|monospace/.test(s)) continue;
      if (!found(s)) console.log(`  ${f}:${line}  ${s.slice(0, 110)}`);
    }
  }
}
