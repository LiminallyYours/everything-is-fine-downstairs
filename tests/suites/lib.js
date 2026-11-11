'use strict';
// Shared bits for the suites: a pass/fail list that sets the exit code, and getting into a game.

const { createGame, arrowFor } = require('../harness');

function checker(title) {
  const out = [];
  const check = (name, ok, detail) => {
    out.push([ok ? 'PASS' : 'FAIL', name, detail === undefined ? '' : JSON.stringify(detail)]);
    return !!ok;
  };
  const finish = () => {
    for (const [s, name, detail] of out) console.log(s, name, detail);
    const failed = out.filter(o => o[0] === 'FAIL').length;
    console.log(`${title}: ${failed ? 'FAIL' : 'PASS'} (${out.length - failed} of ${out.length} checks passed)`);
    process.exitCode = failed ? 1 : 0;
    return failed;
  };
  return { check, finish, out };
}

// From wherever the game is, start a new game and get to the map (optionally jump to a floor).
function startGame(H, depth = 1) {
  const G = H.G;
  H.run('goTitle()');
  H.press('Enter');
  for (let i = 0; i < 80 && G.mode !== 'play'; i++) { H.press('Enter'); H.tick(40); }
  if (G.mode !== 'play') throw new Error('never reached play, stuck in ' + G.mode);
  if (depth > 1) H.run(`enterFloor(${depth}); toPlay();`);
}

module.exports = { createGame, arrowFor, checker, startGame };
