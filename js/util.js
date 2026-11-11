'use strict';
// Small helpers shared by every other file.

const RNG = {
  int(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  chance(p) { return Math.random() < p; },
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
  // table: [[value, weight], ...]
  weighted(table) {
    let total = 0;
    for (const [, w] of table) total += w;
    let r = Math.random() * total;
    for (const [v, w] of table) { if ((r -= w) < 0) return v; }
    return table[table.length - 1][0];
  },
};

const DIR4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const DIR8 = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// A rule that changes with depth, level or tier, written { base, per, min, max } in
// config/rules.js: base + per * n, kept between min and max. A plain number is just itself.
function ruleAt(rule, n) {
  if (typeof rule === 'number') return rule;
  let v = rule.per ? rule.base + rule.per * n : rule.base;
  if (rule.min != null) v = Math.max(rule.min, v);
  if (rule.max != null) v = Math.min(rule.max, v);
  return v;
}

// Names that take no "a" or "the": ones that bring their own ("the Nibbler"), and ones that
// belong to somebody ("Yesterday's Soup", "Somebody Else's Breakfast").
const ownName = name => /^the /i.test(name) || /^(\S+ )?\S+'s /.test(name);

// "a Put-Away", "an Ahem", but never "a the Nibbler" or "a Yesterday's Soup".
function aName(name) {
  if (ownName(name)) return name;
  return (/^[aeiou]/i.test(name) ? 'an ' : 'a ') + name;
}

// "the Put-Away", but plain "Yesterday's Soup".
function theName(name) {
  return ownName(name) ? name : 'the ' + name;
}

// fill("Hello {who}", {who: 'Bob'}) -> "Hello Bob"
function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

// phrase('killers.spoiled', { food: 'Ham' }) -> "a spoiled Ham": one line of TEXT (content/text.js),
// looked up by its dotted key and filled in. It only looks up and fills, and never picks: for a
// line chosen at random, the caller still picks it (fill(RNG.pick(TEXT.hit), vars)), so the
// random numbers are drawn exactly where and when they always were. tests/check-text.js checks
// every key exists and every {token} is filled.
function phrase(key, vars) {
  let t = TEXT;
  for (const k of key.split('.')) t = t == null ? undefined : t[k];
  if (typeof t !== 'string') throw new Error('phrase: no text called ' + key);
  return vars ? fill(t, vars) : t;
}

// Word-wrap to lines no longer than `width`. Respects \n.
function wrap(text, width) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      if (line && (line + ' ' + word).length > width) { out.push(line); line = word; }
      else line = line ? line + ' ' + word : word;
    }
    out.push(line);
  }
  return out;
}

// localStorage can throw (private windows, odd file:// rules), so never trust it.
const Store = {
  load(key, fallback) {
    try {
      const v = localStorage.getItem('rot.' + key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  save(key, value) {
    try { localStorage.setItem('rot.' + key, JSON.stringify(value)); } catch (e) { /* the void keeps it */ }
  },
};
