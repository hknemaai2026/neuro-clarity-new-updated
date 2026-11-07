const fs = require('fs');
const path = require('path');

const liveSpa = JSON.parse(fs.readFileSync('scripts/live_spa_pages.json', 'utf8'));
const localSpa = JSON.parse(fs.readFileSync('scripts/local_spa_pages.json', 'utf8'));

console.log('=== LIVE VS LOCAL SPA PAGE OVERVIEW ===');

const mapLive = {};
for (const p of liveSpa) mapLive[p.pathname] = p;

const mapLocal = {};
for (const p of localSpa) mapLocal[p.pathname] = p;

const allPaths = Array.from(new Set([...Object.keys(mapLive), ...Object.keys(mapLocal)]));

for (const p of allPaths) {
  console.log(`\nPath: ${p}`);
  const live = mapLive[p];
  const local = mapLocal[p];
  if (!live) {
    console.log('  STATUS: [NEW IN LOCAL CODE - NOT IN LIVE]');
    console.log(`  H1: ${JSON.stringify(local.h1)}`);
    console.log(`  Buttons: ${local.buttons.join(', ')}`);
    console.log(`  Tables: ${JSON.stringify(local.tables)}`);
  } else if (!local) {
    console.log('  STATUS: [REMOVED IN LOCAL CODE - ONLY IN LIVE]');
    console.log(`  H1: ${JSON.stringify(live.h1)}`);
  } else {
    console.log('  STATUS: [EXISTS IN BOTH]');
    console.log(`  Live H1: ${JSON.stringify(live.h1)} | Local H1: ${JSON.stringify(local.h1)}`);
    console.log(`  Live H2: ${JSON.stringify(live.h2)} | Local H2: ${JSON.stringify(local.h2)}`);
    console.log(`  Live Buttons (${live.buttons.length}): ${live.buttons.slice(0, 10).join(', ')}`);
    console.log(`  Local Buttons (${local.buttons.length}): ${local.buttons.slice(0, 10).join(', ')}`);
    console.log(`  Live Tables: ${JSON.stringify(live.tables)}`);
    console.log(`  Local Tables: ${JSON.stringify(local.tables)}`);
    console.log(`  Live Inputs: ${live.inputs.length} | Local Inputs: ${local.inputs.length}`);
  }
}
