'use strict';
// check-text: the game's words and the code that looks them up agree.
//
//   node check-text.js              check the game, then prove the check can fail (self-test)
//   node check-text.js --no-self    just the check
//   node check-text.js --root DIR   check a copy of the game somewhere else
//
// It reads the content tables from the running game (TEXT, the odd rooms' words, and the
// per-entry text tables listed in ROOTS) and every script in index.html (parsed with acorn), and fails on:
//   missing   code asks for text that isn't there: TEXT.a.b, phrase('a.b'), BESTIARY[x].field
//   unfilled  a {token} that no fill()/phrase() call fills in, or a fill that leaves one out
//   unused    text that nothing in the code ever looks up
// It understands every way the game looks text up: phrase('a.b', vars) and phrase('a.' + x),
// direct access (TEXT.a.b, TEXT.a[x]), random picks (RNG.pick(TEXT.a)), callbacks and loops over
// a table (TEXT.a.map(l => fill(l, vars)), for (const l of TEXT.a)), and local names for an
// entry (const b = BESTIARY[type]; b.verse).

const fs = require('fs');
const os = require('os');
const path = require('path');
const acorn = require('acorn');
const { createGame, scriptList, ROOT } = require('./harness');

// The tables checked. 'tree': nested words, every key must be used. 'entries': one entry per
// id, and every text field of an entry (any field holding words, except those in `skip`) must
// be read somewhere.
const ROOTS = {
  TEXT: { kind: 'tree' },
  BESTIARY: { kind: 'entries', skip: [] },
  // the odd rooms' words; which {values} each outcome gets is checked by check-rooms.js
  VIGNETTE_WORDS: { kind: 'tree', tokens: 'check-rooms.js' },
  // each item's own words, next to its numbers in content/data.js
  POTION_BY: { kind: 'entries', skip: ['id'] },
  SCROLL_BY: { kind: 'entries', skip: ['id'] },
  FOOD_BY: { kind: 'entries', skip: ['id'] },
};
// Text known to be unused, allowed for now (step 5b to 5f held TEXT.rhymes and the bestiary's ASCII
// art here until 5f deleted them). Keep it empty.
const ALLOW_UNUSED = [];

const CALLBACK_METHODS = new Set(['map', 'forEach', 'flatMap', 'filter', 'find', 'findIndex', 'some', 'every', 'reduce']);
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const TOKEN_RE = /\{(\w+)\}/g;
const tokensOf = s => [...String(s).matchAll(TOKEN_RE)].map(m => m[1]);

function loadContent(root) {
  const H = createGame({ root, files: scriptList(path.join(root, 'index.html')), boot: false, echoConsole: false });
  const names = Object.keys(ROOTS);
  return JSON.parse(H.run(`JSON.stringify({ ${names.map(n => `${n}: typeof ${n} === 'undefined' ? null : ${n}`).join(', ')} })`));
}

// Every string under a value, with its path.
function strings(v, at, out = []) {
  if (typeof v === 'string') out.push([at, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, at.concat(String(i)), out));
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) strings(x, at.concat(k), out);
  return out;
}

// Follow a path (segments, '*' = any key) into the content. Returns { nodes, stop, missing }:
// the values reached, how many segments were real lookups (the rest are array/string methods),
// and the first segment that doesn't exist, if any.
function follow(content, segs) {
  let nodes = [content[segs[0]]], i = 1;
  if (nodes[0] == null) return { nodes: [], stop: 1, missing: segs[0] };
  for (; i < segs.length; i++) {
    const s = segs[i];
    if (nodes.every(n => typeof n === 'string' || Array.isArray(n))) break; // methods, indexes
    if (s === '*') { nodes = nodes.flatMap(n => (isObj(n) ? Object.values(n) : [n])); continue; }
    const next = nodes.filter(isObj).filter(n => Object.prototype.hasOwnProperty.call(n, s)).map(n => n[s]);
    if (!next.length) return { nodes: [], stop: i, missing: segs.slice(0, i + 1).join('.') };
    nodes = next;
  }
  return { nodes, stop: i, missing: null };
}

function analyze(root) {
  const content = loadContent(root);
  const problems = [];
  const uses = [];        // paths the code looks up
  const filled = new Set(); // 'TEXT.a.b.0' strings reached by some fill
  let lookups = 0, fills = 0;
  const files = scriptList(path.join(root, 'index.html'));

  for (const file of files) {
    const src = fs.readFileSync(path.join(root, file), 'utf8');
    const ast = acorn.parse(src, { ecmaVersion: 'latest', locations: true });
    const where = n => `${file}:${n.loc.start.line}`;
    // parent links, and the `const name = <expr>` declarations of each function (and the file)
    const decls = new Map();
    const scopeOf = n => { let p = n.parent; while (p && !/Function|Program/.test(p.type)) p = p.parent; return p; };
    (function link(n, parent) {
      if (!n || typeof n.type !== 'string') return;
      n.parent = parent;
      if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init) {
        if (!decls.has(n.id.name)) decls.set(n.id.name, []);
        decls.get(n.id.name).push(n.init);
      }
      for (const k of Object.keys(n)) {
        if (k === 'parent') continue;
        const v = n[k];
        if (Array.isArray(v)) v.forEach(x => link(x, n)); else if (v && typeof v.type === 'string') link(v, n);
      }
    })(ast, null);

    const seen = new Set();
    // The content path an expression stands for, or null.
    function pathOf(n, depth = 0) {
      if (!n || depth > 8) return null;
      if (n.type === 'Identifier') {
        if (ROOTS[n.name]) return [n.name];
        const b = bindingOf(n);
        if (b) return b;
        return declPath(n.name, depth, n);
      }
      if (n.type === 'MemberExpression') {
        const base = pathOf(n.object, depth + 1);
        if (!base) return null;
        if (!n.computed) return base.concat(n.property.name);
        if (n.property.type === 'Literal') return base.concat(String(n.property.value));
        return base.concat('*');
      }
      if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && !n.callee.computed
        && n.callee.object.type === 'Identifier' && n.callee.object.name === 'RNG' && n.callee.property.name === 'pick') {
        return pathOf(n.arguments[0], depth + 1);
      }
      return null;
    }
    // A local name for a table or an entry (const f = FOOD_BY[it.id]): its path, if every
    // declaration of that name in the file says the same.
    // The nearest function (or the file) that declares it decides; if that scope declares it
    // more than once, every declaration must say the same.
    function declPath(name, depth = 0, from = null) {
      const all = decls.get(name);
      if (!all) return null;
      let d = all;
      if (from) {
        for (let sc = scopeOf(from); sc; sc = sc.type === 'Program' ? null : scopeOf(sc)) {
          const here = all.filter(x => scopeOf(x.parent) === sc);
          if (here.length) { d = here; break; }
        }
      }
      const ps = d.map(x => pathOf(x, depth + 1));
      return ps[0] && ps.every(q => q && q.join('.') === ps[0].join('.')) ? ps[0] : null;
    }
    // A callback parameter or loop variable over a content table: TEXT.a.map(l => ...), for (const l of TEXT.a).
    function bindingOf(id) {
      for (let p = id.parent; p; p = p.parent) {
        if ((p.type === 'ArrowFunctionExpression' || p.type === 'FunctionExpression') && p.params.some(q => q.type === 'Identifier' && q.name === id.name)) {
          const call = p.parent;
          if (call && call.type === 'CallExpression' && call.arguments[0] === p && call.callee.type === 'MemberExpression'
            && !call.callee.computed && CALLBACK_METHODS.has(call.callee.property.name)) {
            const base = pathOf(call.callee.object);
            return base ? base.concat('*') : null;
          }
          return null;
        }
        if (p.type === 'ForOfStatement' && p.left.type === 'VariableDeclaration'
          && p.left.declarations.some(d => d.id.type === 'Identifier' && d.id.name === id.name)) {
          const base = pathOf(p.right);
          return base ? base.concat('*') : null;
        }
      }
      return null;
    }
    // The keys a fill()'s vars can fill, or null if they can't be told.
    function varKeys(n) {
      if (!n) return [];
      if (n.type === 'ObjectExpression') {
        if (n.properties.some(p => p.type !== 'Property' || p.computed)) return null;
        return n.properties.map(p => (p.key.type === 'Identifier' ? p.key.name : String(p.key.value)));
      }
      if (n.type === 'Identifier') {
        const d = decls.get(n.name);
        if (d && d.length === 1) return varKeys(d[0]);
      }
      return null;
    }
    function use(segs, node) {
      const key = segs.join('.') + '@' + node.start;
      if (seen.has(key)) return;
      seen.add(key);
      lookups++;
      const f = follow(content, segs);
      if (f.missing) problems.push(['missing', `${where(node)}: no text called ${f.missing}`]);
      else uses.push(segs.slice(0, f.stop));
    }
    function checkFill(segs, keys, node) {
      fills++;
      const f = follow(content, segs);
      if (f.missing) { problems.push(['missing', `${where(node)}: no text called ${f.missing}`]); return; }
      uses.push(segs.slice(0, f.stop));
      const base = segs.slice(0, f.stop);
      for (const v of f.nodes) {
        for (const [at, s] of strings(v, [])) {
          const id = base.concat(at).join('.');
          filled.add(s);
          filled.add(id);
          if (keys === null) continue;
          for (const t of tokensOf(s)) {
            if (!keys.includes(t)) problems.push(['unfilled', `${where(node)}: {${t}} is never filled in: "${s}"`]);
          }
        }
      }
    }

    (function visit(n) {
      if (!n || typeof n.type !== 'string') return;
      // phrase() and fill() themselves are the lookup machinery, not lookups
      if (n.type === 'FunctionDeclaration' && n.id && (n.id.name === 'phrase' || n.id.name === 'fill')) return;
      if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && (n.callee.name === 'phrase' || n.callee.name === 'fill')) {
        const [a0, a1] = n.arguments;
        const keys = varKeys(a1);
        if (n.callee.name === 'phrase') {
          let segs = null;
          if (a0.type === 'Literal' && typeof a0.value === 'string') segs = ['TEXT'].concat(a0.value.split('.'));
          else {
            const lead = a0.type === 'TemplateLiteral' ? a0.quasis[0].value.cooked
              : a0.type === 'BinaryExpression' && a0.left.type === 'Literal' ? String(a0.left.value) : null;
            if (lead && lead.includes('.')) segs = ['TEXT'].concat(lead.slice(0, lead.lastIndexOf('.')).split('.'), '*');
          }
          if (!segs) problems.push(['unclear', `${where(n)}: phrase() with a key the check cannot read; start it with a fixed 'group.' prefix`]);
          else {
            if (a1 && keys === null) problems.push(['unclear', `${where(n)}: phrase() vars must be an object literal (or a const holding one)`]);
            checkFill(segs, keys === null ? null : keys, n);
          }
        } else {
          // fill(a ? TEXT.x : TEXT.y, vars) fills either
          const branches = x => (x.type === 'ConditionalExpression' ? branches(x.consequent).concat(branches(x.alternate)) : [x]);
          for (const b of branches(a0)) {
            const segs = pathOf(b);
            if (!segs) continue;
            if (keys === null && !ROOTS[segs[0]].tokens) problems.push(['unclear', `${where(n)}: fill() vars must be an object literal (or a const holding one)`]);
            checkFill(segs, keys, n);
          }
        }
      }
      // A lookup: the outermost member chain rooted in a content table (or a name for one).
      if (n.type === 'MemberExpression' && !(n.parent.type === 'MemberExpression' && n.parent.object === n)) {
        const segs = pathOf(n);
        const declInit = n.parent.type === 'VariableDeclarator' && n.parent.init === n;
        const inPick = n.parent.type === 'CallExpression' && n.parent.arguments[0] === n && pathOf(n.parent);
        const inFill = n.parent.type === 'CallExpression' && n.parent.callee.type === 'Identifier' && ['fill', 'phrase'].includes(n.parent.callee.name);
        if (segs && !declInit && !inFill && !(inPick && n.parent.parent && n.parent.parent.type === 'CallExpression'
          && n.parent.parent.callee.type === 'Identifier' && n.parent.parent.callee.name === 'fill')) use(segs, n);
      }
      // A table (or a name for one) used whole, e.g. passed along: everything in it counts as used.
      if (n.type === 'Identifier' && n.parent && !(n.parent.type === 'MemberExpression' && n.parent.object === n)
        && !(n.parent.type === 'MemberExpression' && n.parent.property === n && !n.parent.computed)
        && !(n.parent.type === 'VariableDeclarator' && n.parent.id === n) && !(n.parent.type === 'Property' && n.parent.key === n && !n.parent.shorthand)) {
        const objectKeys = n.parent.type === 'CallExpression' && n.parent.callee.type === 'MemberExpression'
          && !n.parent.callee.computed && n.parent.callee.object.name === 'Object' && n.parent.callee.property.name === 'keys';
        const declaredHere = ROOTS[n.name] && n.parent.type === 'VariableDeclarator';
        const segs = !objectKeys && !declaredHere && (ROOTS[n.name] ? [n.name] : declPath(n.name, 0, n) ? pathOf(n) : null);
        const inFill = n.parent.type === 'CallExpression' && n.parent.callee.type === 'Identifier' && ['fill', 'phrase'].includes(n.parent.callee.name) && n.parent.arguments[0] === n;
        if (segs && !inFill && !bindingOf(n)) use(segs, n);
      }
      for (const k of Object.keys(n)) {
        if (k === 'parent') continue;
        const v = n[k];
        if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v.type === 'string') visit(v);
      }
    })(ast);
  }

  // {tokens} that nothing fills in
  for (const name of Object.keys(ROOTS)) {
    for (const [at, s] of strings(content[name], [name])) {
      if (tokensOf(s).length && !filled.has(at.join('.')) && !filled.has(s)) problems.push(['unfilled', `${at.join('.')}: has {${tokensOf(s).join('}, {')}} but nothing fills it in: "${s}"`]);
    }
  }

  // text nothing looks up
  const matches = (pattern, segs) => pattern.length <= segs.length && pattern.every((p, i) => p === '*' || segs[i] === '*' || p === segs[i]);
  const allow = ALLOW_UNUSED.map(a => a.split('.'));
  const leaves = [];
  for (const [name, R] of Object.entries(ROOTS)) {
    const v = content[name];
    if (v == null) continue;
    if (R.kind === 'tree') {
      (function walk(x, at) {
        if (isObj(x)) for (const [k, y] of Object.entries(x)) walk(y, at.concat(k));
        else leaves.push(at);
      })(v, [name]);
    } else {
      // each text field of each entry (a field holding several named lines: each line)
      for (const [id, entry] of Object.entries(v)) {
        for (const [f, x] of Object.entries(entry || {})) {
          if (R.skip.includes(f) || !strings(x, []).length) continue;
          if (isObj(x)) for (const k of Object.keys(x)) leaves.push([name, id, f, k]);
          else leaves.push([name, id, f]);
        }
      }
    }
  }
  const unusedAllowed = [];
  for (const leaf of leaves) {
    if (uses.some(u => matches(u, leaf))) continue;
    if (allow.some(a => matches(a, leaf) && a.length === leaf.length)) { unusedAllowed.push(leaf.join('.')); continue; }
    problems.push(['unused', `${leaf.join('.')}: nothing in the code looks this up`]);
  }
  for (const a of ALLOW_UNUSED) {
    if (!leaves.some(l => matches(a.split('.'), l) && a.split('.').length === l.length)) problems.push(['unused', `ALLOW_UNUSED lists ${a}, which no longer exists: take it off the list`]);
    else if (!unusedAllowed.some(u => matches(a.split('.'), u.split('.')))) problems.push(['unused', `ALLOW_UNUSED lists ${a}, which is used now: take it off the list`]);
  }
  return { problems, uses, stats: { texts: leaves.length, lookups, fills, files: files.length, allowed: unusedAllowed.length } };
}

// ---------------------------------------------------------------------------------------
// The self-test: break a copy of the game each way the check is meant to catch, and make sure
// it does (and that the untouched copy passes).

const MUTATIONS = [
  ['missing', 'a lookup of text that is not there', 'js/rules/game.js', 'TEXT.bossIntro', 'TEXT.bossIntroo'],
  ['missing', 'a phrase() key that is not there', 'js/rules/game.js', "phrase('killers.unknown')", "phrase('killers.unknwn')"],
  ['unfilled', 'a {token} nobody fills in', 'js/content/text.js', "'You bonk {the}.'", "'You bonk {the}, {oops}.'"],
  ['unused', 'a line nothing looks up', 'js/content/text.js', 'const TEXT = {', "const TEXT = {\n  forgotten: 'Nobody ever reads this.',"],
  ['unused', "an item's line under a name nothing reads", 'js/content/data.js', "splash: '{Them} laps it up", "splosh: '{Them} laps it up"],
];

function selfTest() {
  const results = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-text-'));
  const copy = () => {
    const dir = fs.mkdtempSync(path.join(tmp, 'game-'));
    fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(dir, 'index.html'));
    fs.cpSync(path.join(ROOT, 'js'), path.join(dir, 'js'), { recursive: true });
    return dir;
  };
  try {
    const clean = analyze(copy());
    results.push(['the untouched copy passes', clean.problems.length === 0, clean.problems.map(p => p[1]).slice(0, 3)]);
    for (const [kind, label, file, from, to] of MUTATIONS) {
      const dir = copy(), f = path.join(dir, file), src = fs.readFileSync(f, 'utf8');
      if (!src.includes(from)) { results.push([`${label}: the self-test could not find ${JSON.stringify(from)} in ${file}`, false]); continue; }
      fs.writeFileSync(f, src.replace(from, to));
      const r = analyze(dir);
      const caught = r.problems.filter(p => p[0] === kind);
      results.push([`${label} fails as "${kind}"`, caught.length > 0, caught.map(p => p[1]).slice(0, 2)]);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return results;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const at = args.indexOf('--root');
  const root = at >= 0 ? path.resolve(args[at + 1]) : ROOT;
  const { problems, stats } = analyze(root);
  for (const [kind, text] of problems) console.log(`  ${kind.padEnd(8)} ${text}`);
  let ok = problems.length === 0;
  const summary = `${stats.texts} texts, ${stats.lookups} lookups, ${stats.fills} fills, ${stats.files} files`
    + (ALLOW_UNUSED.length ? `; known unused for now: ${ALLOW_UNUSED.join(', ')}` : '');
  if (!args.includes('--no-self')) {
    const st = selfTest();
    for (const [name, pass, detail] of st) console.log(`  self-test ${pass ? 'PASS' : 'FAIL'} ${name}${detail && detail.length ? '  ' + JSON.stringify(detail) : ''}`);
    if (st.some(r => !r[1])) ok = false;
    console.log(`check-text: ${ok ? 'PASS' : 'FAIL'} (${problems.length} problems; ${summary}; self-test ${st.filter(r => r[1]).length} of ${st.length})`);
  } else {
    console.log(`check-text: ${ok ? 'PASS' : 'FAIL'} (${problems.length} problems; ${summary})`);
  }
  process.exit(ok ? 0 : 1);
}

module.exports = { analyze, ROOTS, ALLOW_UNUSED };
