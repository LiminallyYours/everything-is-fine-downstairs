'use strict';
// Loads the game the way a browser does: each script on its own, in index.html order, into one
// shared global scope. A file that uses something before the file defining it has loaded fails
// here exactly as it would in a browser. Then it boots the page and checks the console is clean.
//
//   node load-check.js                    every script in index.html, then boot to the title
//   node load-check.js js/util.js js/config/   only the scripts matching these paths or folders
//                                          (in index.html order), loaded alone, no boot
//
// When index.html has scripts under js/config/, they are also loaded entirely on their own,
// to prove the config needs nothing else.

const { createGame, scriptList } = require('./harness');

function loadOnly(files) {
  const H = createGame({ files, boot: false, throwOnLoadError: false, echoConsole: false });
  return { errors: H.loadErrors, console: H.consoleLog.filter(l => /^(warn|error)/.test(l)) };
}

const show = e => {
  const err = e.error || {}, where = String(err.stack || '').split('\n')[0];
  return `${e.file}: ${err.name || 'Error'}: ${err.message || err} (at ${where.replace(/^.*\/(js\/)/, '$1')})`;
};

function main() {
  const all = scriptList();
  const args = process.argv.slice(2);
  let failed = false;
  if (args.length) {
    const files = all.filter(f => args.some(a => f === a || (a.endsWith('/') && f.startsWith(a))));
    if (!files.length) { console.log('load-check: FAIL (no scripts in index.html match ' + args.join(' ') + ')'); process.exit(1); }
    const r = loadOnly(files);
    for (const e of r.errors) console.log('  ' + show(e));
    for (const c of r.console) console.log('  console ' + c);
    const ok = !r.errors.length && !r.console.length;
    console.log(`load-check: ${ok ? 'PASS' : 'FAIL'} (${files.length} of ${all.length} scripts loaded on their own: ${files.join(', ')})`);
    process.exit(ok ? 0 : 1);
  }

  // 1. Every file, one at a time, then boot: splash screen, a key listener, a few frames.
  const H = createGame({ files: all, boot: false, throwOnLoadError: false, echoConsole: false });
  for (const e of H.loadErrors) { failed = true; console.log('  load error: ' + show(e)); }
  if (!H.loadErrors.length) {
    try {
      H.tick(200);
      if (H.G.mode !== 'splash') { failed = true; console.log('  expected the splash screen after loading, got ' + H.G.mode); }
      if (!(H.listeners.keydown || []).length) { failed = true; console.log('  no keydown listener was registered'); }
      H.press('x'); H.tick(200); H.press('Enter'); H.tick(200);
      if (H.G.mode !== 'story') { failed = true; console.log('  expected the story page after a new game, got ' + H.G.mode); }
    } catch (e) { failed = true; console.log('  boot error: ' + e.stack); }
  }
  const noisy = H.consoleLog.filter(l => /^(warn|error)/.test(l));
  for (const c of noisy) { failed = true; console.log('  console ' + c); }
  console.log(`  ${all.length} scripts loaded one at a time${failed ? '' : ', page booted, console clean'}`);

  // 2. Config on its own (once js/config/ exists).
  const config = all.filter(f => f.startsWith('js/config/'));
  if (config.length) {
    const r = loadOnly(config);
    for (const e of r.errors) { failed = true; console.log('  config alone: ' + show(e)); }
    for (const c of r.console) { failed = true; console.log('  config alone: console ' + c); }
    if (!r.errors.length && !r.console.length) console.log(`  config loads on its own (${config.join(', ')})`);
  } else {
    console.log('  no js/config/ scripts yet (config-alone check skipped)');
  }
  console.log(`load-check: ${failed ? 'FAIL' : 'PASS'}`);
  process.exit(failed ? 1 : 0);
}

main();
