'use strict';
// Every game file shares one global scope, so a top-level name defined twice is a bug waiting to
// happen: `const`/`let`/`class` twice stops a file loading, and `function` twice silently lets the
// later file replace the earlier one. This fails on any top-level name defined more than once.
//
//   node lint-globals.js              all scripts in index.html
//   node lint-globals.js js/a.js ...  just these files

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const { ROOT, scriptList } = require('./harness');

// Names a browser page must not redeclare (doing so throws, or breaks the page).
const RESERVED = new Set(['window', 'document', 'location', 'top', 'undefined', 'NaN', 'Infinity', 'globalThis']);

// Deliberate exceptions, with the reason. Keep this empty unless there is no other way.
const ALLOW = {
  // name: 'why it is fine',
};

function patternNames(p, out) {
  if (!p) return out;
  switch (p.type) {
    case 'Identifier': out.push(p); break;
    case 'ObjectPattern': for (const prop of p.properties) patternNames(prop.type === 'RestElement' ? prop.argument : prop.value, out); break;
    case 'ArrayPattern': for (const el of p.elements) patternNames(el, out); break;
    case 'RestElement': patternNames(p.argument, out); break;
    case 'AssignmentPattern': patternNames(p.left, out); break;
  }
  return out;
}

// `var` declarations hoist out of blocks to the global scope; collect those too.
function hoistedVars(node, out) {
  if (!node || typeof node !== 'object') return;
  if (/Function|Class/.test(node.type)) return;
  if (node.type === 'VariableDeclaration' && node.kind === 'var') {
    for (const d of node.declarations) for (const id of patternNames(d.id, [])) out.push(id);
  }
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && hoistedVars(c, out));
    else if (v && typeof v.type === 'string') hoistedVars(v, out);
  }
}

function topLevelNames(file, src) {
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', locations: true, allowHashBang: true });
  const defs = [];
  const add = (id, kind) => defs.push({ name: id.name, kind, file, line: id.loc.start.line });
  for (const st of ast.body) {
    if (st.type === 'FunctionDeclaration') add(st.id, 'function');
    else if (st.type === 'ClassDeclaration') add(st.id, 'class');
    else if (st.type === 'VariableDeclaration') {
      for (const d of st.declarations) for (const id of patternNames(d.id, [])) add(id, st.kind);
    } else if (st.type === 'ExpressionStatement' && st.expression.type === 'AssignmentExpression' && st.expression.operator === '=') {
      // window.foo = ..., globalThis.foo = ..., or a bare foo = ... (an implicit global)
      const left = st.expression.left;
      if (left.type === 'MemberExpression' && !left.computed && left.object.type === 'Identifier'
        && ['window', 'globalThis', 'self'].includes(left.object.name)) add(left.property, 'global assignment');
    } else {
      const vars = [];
      hoistedVars(st, vars);
      for (const id of vars) add(id, 'var (hoisted)');
    }
  }
  return defs;
}

// sources: [{ file, src }]
function lintSources(sources) {
  const byName = new Map();
  const problems = [];
  for (const { file: f, src } of sources) {
    let defs;
    try { defs = topLevelNames(f, src); } catch (e) { problems.push(`${f}: does not parse: ${e.message}`); continue; }
    for (const d of defs) {
      if (!byName.has(d.name)) byName.set(d.name, []);
      byName.get(d.name).push(d);
      if (RESERVED.has(d.name)) problems.push(`${f}:${d.line}: "${d.name}" is a reserved browser global and must not be declared`);
    }
  }
  for (const [name, defs] of byName) {
    if (defs.length < 2 || ALLOW[name]) continue;
    const where = defs.map(d => `${d.file}:${d.line} (${d.kind})`).join(', ');
    const silent = defs.every(d => d.kind === 'function' || d.kind === 'var' || d.kind === 'var (hoisted)' || d.kind === 'global assignment');
    problems.push(`"${name}" is defined ${defs.length} times: ${where}${silent ? ' (the later one silently replaces the earlier)' : ''}`);
  }
  return { problems, names: byName.size };
}

const lint = files => lintSources(files.map(file => ({ file, src: fs.readFileSync(path.join(ROOT, file), 'utf8') })));

// The lint must itself catch the cases it exists for.
function selfTest() {
  const cases = [
    [[['a.js', 'function draw() {}'], ['b.js', 'function draw() {}']], true],
    [[['a.js', 'const X = 1;'], ['b.js', 'let [Y, { z: X }] = [];']], true],
    [[['a.js', 'function f() {}\nfunction f() {}']], true],
    [[['a.js', 'var Q = 1;'], ['b.js', 'if (1) { var Q = 2; }']], true],
    [[['a.js', 'window.R = 1;'], ['b.js', 'function R() {}']], true],
    [[['a.js', 'function f() { const local = 1; }'], ['b.js', 'function g() { const local = 2; }']], false],
  ];
  for (const [srcs, shouldFail] of cases) {
    const { problems } = lintSources(srcs.map(([file, src]) => ({ file, src })));
    if (!!problems.length !== shouldFail) throw new Error('lint self-test failed on ' + JSON.stringify(srcs));
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const files = args.length ? args : scriptList();
  selfTest();
  const { problems, names } = lint(files);
  if (problems.length) {
    console.log(`lint-globals: FAIL (${problems.length} problem${problems.length > 1 ? 's' : ''})`);
    for (const p of problems) console.log('  ' + p);
    process.exit(1);
  }
  console.log(`lint-globals: PASS (${files.length} files, ${names} top-level names, none defined twice)`);
}

module.exports = { lint, lintSources, topLevelNames };
