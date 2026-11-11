'use strict';
// check-rooms: every odd room has its three parts, and they agree, by room id and choice id.
//
//   node check-rooms.js            check the game, then prove the check can fail (self-test)
//   node check-rooms.js --no-self  just the check
//
// - words (content/vignette-words.js), rules (rules/vignettes.js) and a drawing
//   (draw/vignette-art.js) for every room, and every room a floor can have exists;
// - every choice in the rules has words (a label) and every choice in the words has rules;
// - every outcome a choice's rule can return has lines, and every outcome in the words is one
//   some rule returns (read from the rules' code with acorn: return ['took', { n }], a ?: of
//   two outcomes, or a name picked from a list of them);
// - every {value} in an outcome's lines is filled by every return of that outcome.

const fs = require('fs');
const os = require('os');
const path = require('path');
const acorn = require('acorn');
const { createGame, scriptList, ROOT } = require('./harness');

const ROOM_KEYS = ['name', 'found', 'usedMsg', 'verse', 'choices'];
const tokensOf = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]);

function analyze(root) {
  const problems = [];
  const bad = msg => problems.push(msg);
  const H = createGame({ root, files: scriptList(path.join(root, 'index.html')), boot: false, echoConsole: false });
  const game = JSON.parse(H.run(`JSON.stringify({
    words: typeof VIGNETTE_WORDS === 'undefined' ? null : VIGNETTE_WORDS,
    rules: typeof VIGNETTES === 'undefined' ? null : Object.fromEntries(Object.entries(VIGNETTES).map(([k, v]) => [k, v.choices.map(c => c[0])])),
    art: typeof VIGNETTE_ART === 'undefined' ? null : Object.keys(VIGNETTE_ART).filter(k => typeof VIGNETTE_ART[k] === 'function'),
    floors: VIGNETTE_FLOORS,
  })`));
  const { words, rules, art, floors } = game;
  if (!words || !rules || !art) { bad('VIGNETTE_WORDS, VIGNETTES or VIGNETTE_ART is missing'); return { problems, rooms: 0, choices: 0, outcomes: 0 }; }

  // the outcomes each choice's rule can return, read from its code
  const file = path.join(root, 'js/rules/vignettes.js');
  const src = fs.readFileSync(file, 'utf8');
  const ast = acorn.parse(src, { ecmaVersion: 'latest', locations: true });
  let table = null;
  (function find(n) {
    if (!n || typeof n.type !== 'string' || table) return;
    if (n.type === 'VariableDeclarator' && n.id.name === 'VIGNETTES') { table = n.init; return; }
    for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(find); else if (v && typeof v.type === 'string') find(v); }
  })(ast);
  const returns = {}; // room.choice -> [{ outcome, keys, line }]
  for (const room of table ? table.properties : []) {
    const rid = room.key.name || room.key.value;
    const choices = room.value.properties.find(p => (p.key.name || p.key.value) === 'choices');
    for (const el of choices ? choices.value.elements : []) {
      const cid = el.elements[0].value, fn = el.elements[1];
      const list = returns[`${rid}.${cid}`] = [];
      const literals = n => {
        if (n.type === 'Literal' && typeof n.value === 'string') return [n.value];
        if (n.type === 'ConditionalExpression') { const a = literals(n.consequent), b = literals(n.alternate); return a && b ? a.concat(b) : null; }
        if (n.type === 'Identifier') { // a name picked from a list of outcomes: const boon = RNG.pick(['a', 'b'])
          let found = null;
          (function look(m) {
            if (!m || typeof m.type !== 'string' || found) return;
            if (m.type === 'VariableDeclarator' && m.id.name === n.name && m.init && m.init.type === 'CallExpression'
              && m.init.arguments[0] && m.init.arguments[0].type === 'ArrayExpression') found = m.init.arguments[0].elements.map(literals).flat();
            for (const k of Object.keys(m)) { const v = m[k]; if (Array.isArray(v)) v.forEach(look); else if (v && typeof v.type === 'string') look(v); }
          })(fn.body);
          return found && found.every(x => typeof x === 'string') ? found : null;
        }
        return null;
      };
      const ret = (n, line) => {
        if (n.type === 'ConditionalExpression') { ret(n.consequent, line); ret(n.alternate, line); return; }
        if (n.type !== 'ArrayExpression' || !n.elements.length) { bad(`rules/vignettes.js:${line}: ${rid}.${cid} returns something that is not [outcome, { values }]`); return; }
        const outs = literals(n.elements[0]);
        const v = n.elements[1];
        const keys = !v ? [] : v.type === 'ObjectExpression' && v.properties.every(p => p.type === 'Property' && !p.computed)
          ? v.properties.map(p => p.key.name || p.key.value) : null;
        if (!outs) { bad(`rules/vignettes.js:${line}: can't tell which outcome ${rid}.${cid} returns here`); return; }
        if (keys === null) { bad(`rules/vignettes.js:${line}: ${rid}.${cid}'s values must be written out as { name: value }`); return; }
        for (const outcome of outs) list.push({ outcome, keys, line });
      };
      if (fn.body.type !== 'BlockStatement') ret(fn.body, fn.loc.start.line);
      else {
        (function walk(n) {
          if (!n || typeof n.type !== 'string') return;
          if (n !== fn.body && /Function/.test(n.type)) return; // returns inside a callback aren't the choice's
          if (n.type === 'ReturnStatement' && n.argument) ret(n.argument, n.loc.start.line);
          for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
        })(fn.body);
      }
    }
  }

  let nChoices = 0, nOutcomes = 0;
  const rooms = new Set(Object.keys(words).concat(Object.keys(rules), art));
  for (const kinds of Object.values(floors)) for (const k of kinds) if (!rooms.has(k)) bad(`floors have a room "${k}" that has no words, rules or drawing`);
  for (const rid of rooms) {
    const w = words[rid], r = rules[rid];
    if (!w) { bad(`${rid}: has rules or a drawing but no words`); continue; }
    if (!r) { bad(`${rid}: has words but no rules`); continue; }
    if (!art.includes(rid)) bad(`${rid}: has no drawing in VIGNETTE_ART`);
    for (const k of ['name', 'found', 'usedMsg']) if (typeof w[k] !== 'string' || !w[k]) bad(`${rid}: words have no ${k}`);
    if (!Array.isArray(w.verse) || !w.verse.length) bad(`${rid}: words have no verse`);
    for (const k of Object.keys(w)) {
      if (!ROOM_KEYS.includes(k) && !src.includes(`VIGNETTE_WORDS.${rid}.${k}`)) bad(`${rid}.${k}: words the rules never use`);
    }
    const wc = w.choices || {};
    for (const cid of r) if (!wc[cid]) bad(`${rid}.${cid}: a choice with rules but no words`);
    for (const cid of Object.keys(wc)) if (!r.includes(cid)) bad(`${rid}.${cid}: a choice with words but no rules`);
    for (const cid of r) {
      const c = wc[cid];
      if (!c) continue;
      nChoices++;
      if (typeof c.label !== 'string' || !c.label) bad(`${rid}.${cid}: no label`);
      const rets = returns[`${rid}.${cid}`] || [];
      if (!rets.length) bad(`${rid}.${cid}: its rule returns no outcome`);
      for (const { outcome, keys, line } of rets) {
        const lines = c[outcome];
        if (outcome === 'label' || !Array.isArray(lines) || !lines.length || !lines.every(l => typeof l === 'string')) {
          bad(`rules/vignettes.js:${line}: ${rid}.${cid} can come out "${outcome}", which has no lines in the words`);
          continue;
        }
        for (const l of lines) for (const t of tokensOf(l)) if (!keys.includes(t)) bad(`rules/vignettes.js:${line}: ${rid}.${cid}.${outcome} leaves {${t}} unfilled: "${l}"`);
      }
      for (const outcome of Object.keys(c)) {
        if (outcome === 'label') continue;
        nOutcomes++;
        if (!rets.some(x => x.outcome === outcome)) bad(`${rid}.${cid}.${outcome}: words for an outcome its rule never returns`);
      }
    }
  }
  return { problems, rooms: rooms.size, choices: nChoices, outcomes: nOutcomes };
}

// Break a copy of the game each way the check should catch, and make sure it does.
const MUTATIONS = [
  ['a choice with rules but no words', 'js/content/vignette-words.js', "      tiptoe: {\n        label: 'Tiptoe away',\n        done: ['You tiptoe away. Very wise. Rude, but wise.'],\n      },\n", ''],
  ['an outcome with no lines', 'js/content/vignette-words.js', "        nobody: ['DING.', 'Nobody rings the bell. Luckily, nobody came.'],\n", ''],
  ['an outcome nothing returns', 'js/rules/vignettes.js', "return [n ? 'everybody' : 'nobody'];", "return ['everybody'];"],
  ['a {value} left unfilled', 'js/rules/vignettes.js', "return ['took', { n }];", "return ['took'];"],
  ['a room with no drawing', 'js/draw/vignette-art.js', '  namepile(cx, by, S) {', '  namepileX(cx, by, S) {'],
];

function selfTest() {
  const out = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-rooms-'));
  try {
    for (const [label, file, from, to] of MUTATIONS) {
      const dir = fs.mkdtempSync(path.join(tmp, 'game-'));
      fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(dir, 'index.html'));
      fs.cpSync(path.join(ROOT, 'js'), path.join(dir, 'js'), { recursive: true });
      const f = path.join(dir, file), s = fs.readFileSync(f, 'utf8');
      if (!s.includes(from)) { out.push([`${label}: the self-test could not find its text in ${file}`, false]); continue; }
      fs.writeFileSync(f, s.replace(from, to));
      const r = analyze(dir);
      out.push([`${label} fails`, r.problems.length > 0, r.problems.slice(0, 2)]);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return out;
}

if (require.main === module) {
  const r = analyze(ROOT);
  for (const p of r.problems) console.log('  ' + p);
  let ok = !r.problems.length, tail = '';
  if (!process.argv.includes('--no-self')) {
    const st = selfTest();
    for (const [name, pass, detail] of st) console.log(`  self-test ${pass ? 'PASS' : 'FAIL'} ${name}${detail && detail.length ? '  ' + JSON.stringify(detail) : ''}`);
    if (st.some(x => !x[1])) ok = false;
    tail = `; self-test ${st.filter(x => x[1]).length} of ${st.length}`;
  }
  console.log(`check-rooms: ${ok ? 'PASS' : 'FAIL'} (${r.rooms} rooms, ${r.choices} choices, ${r.outcomes} outcomes, each with words, rules and a drawing; ${r.problems.length} problems${tail})`);
  process.exit(ok ? 0 : 1);
}

module.exports = { analyze };
