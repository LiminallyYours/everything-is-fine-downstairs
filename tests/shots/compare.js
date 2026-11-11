'use strict';
// Pixel-compare the current screenshots with a saved baseline, list the ones that differ, and
// write a picture of each difference (changed pixels in red over a faded copy) to look at.
//
//   node shots/compare.js --save   copy tests/out/shots/*.png to tests/out/baseline/
//   node shots/compare.js          compare tests/out/shots/ with tests/out/baseline/; diffs go to tests/out/diff/

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const OUT = path.join(__dirname, '..', 'out');
const SHOTS = path.join(OUT, 'shots'), BASE = path.join(OUT, 'baseline'), DIFF = path.join(OUT, 'diff');
const pngs = dir => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort() : []);

async function pixels(file) {
  const img = await loadImage(fs.readFileSync(file));
  const c = createCanvas(img.width, img.height), g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  return { w: img.width, h: img.height, data: g.getImageData(0, 0, img.width, img.height).data };
}

async function main() {
  if (process.argv.includes('--save')) {
    const list = pngs(SHOTS);
    if (!list.length) { console.log('shots:baseline: no screenshots in tests/out/shots (run npm run shots first)'); process.exit(1); }
    fs.rmSync(BASE, { recursive: true, force: true });
    fs.mkdirSync(BASE, { recursive: true });
    for (const f of list) fs.copyFileSync(path.join(SHOTS, f), path.join(BASE, f));
    console.log(`shots:baseline: saved ${list.length} screenshots to tests/out/baseline/`);
    return;
  }
  const base = pngs(BASE), cur = pngs(SHOTS);
  if (!base.length) { console.log('shots:compare: no baseline yet (npm run shots, then npm run shots:baseline)'); process.exit(1); }
  fs.rmSync(DIFF, { recursive: true, force: true });
  const differ = [];
  for (const f of base) {
    if (!cur.includes(f)) { differ.push(`${f}: missing from this run`); continue; }
    const a = await pixels(path.join(BASE, f)), b = await pixels(path.join(SHOTS, f));
    if (a.w !== b.w || a.h !== b.h) { differ.push(`${f}: size ${a.w}x${a.h} -> ${b.w}x${b.h}`); continue; }
    let n = 0;
    const out = createCanvas(a.w, a.h), g = out.getContext('2d'), img = g.createImageData(a.w, a.h);
    for (let i = 0; i < a.data.length; i += 4) {
      const same = a.data[i] === b.data[i] && a.data[i + 1] === b.data[i + 1] && a.data[i + 2] === b.data[i + 2] && a.data[i + 3] === b.data[i + 3];
      if (!same) n++;
      const grey = (b.data[i] + b.data[i + 1] + b.data[i + 2]) / 3;
      img.data[i] = same ? 255 - (255 - grey) * 0.25 : 230;
      img.data[i + 1] = same ? 255 - (255 - grey) * 0.25 : 20;
      img.data[i + 2] = same ? 255 - (255 - grey) * 0.25 : 40;
      img.data[i + 3] = 255;
    }
    if (n) {
      g.putImageData(img, 0, 0);
      fs.mkdirSync(DIFF, { recursive: true });
      fs.writeFileSync(path.join(DIFF, f), out.toBuffer('image/png'));
      differ.push(`${f}: ${n} pixels differ (${((100 * n) / (a.w * a.h)).toFixed(2)}%)`);
    }
  }
  for (const f of cur) if (!base.includes(f)) differ.push(`${f}: new (not in the baseline)`);
  for (const d of differ) console.log('  ' + d);
  console.log(`shots:compare: ${differ.length ? 'DIFFER' : 'SAME'} (${base.length} in the baseline, ${differ.length} differ${differ.length ? '; pictures of the differences in tests/out/diff/' : ''})`);
  process.exit(differ.length ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
