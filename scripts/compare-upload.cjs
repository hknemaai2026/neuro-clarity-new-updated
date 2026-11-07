const fs = require('fs');

const local = JSON.parse(fs.readFileSync('scripts/local_upload_actual.json', 'utf8'));
const live = JSON.parse(fs.readFileSync('scripts/live_upload_actual.json', 'utf8'));

console.log('=== UPLOAD SCREEN STEP 1 COMPARISON ===');
console.log('Pathname Match:', local.pathname === live.pathname, `(${local.pathname})`);
console.log('H1 Match:', JSON.stringify(local.h1) === JSON.stringify(live.h1), local.h1);
console.log('H2 Match:', JSON.stringify(local.h2) === JSON.stringify(live.h2), local.h2);
console.log('H3 Match:', JSON.stringify(local.h3) === JSON.stringify(live.h3), local.h3);

const liveBtns = live.buttons.map(b => b.text);
const localBtns = local.buttons.map(b => b.text);
console.log('Buttons Match:', JSON.stringify(localBtns) === JSON.stringify(liveBtns));
console.log('Live Buttons:', liveBtns);
console.log('Local Buttons:', localBtns);

const liveBadges = live.badges.map(b => b.text);
const localBadges = local.badges.map(b => b.text);
console.log('Badges Match:', JSON.stringify(localBadges) === JSON.stringify(liveBadges));
console.log('Live Badges:', liveBadges);
console.log('Local Badges:', localBadges);

console.log('\n--- BODY TEXT MATCH ---');
console.log('Local text (first 350 chars):');
console.log(local.bodySnippet.substring(0, 350));
console.log('Live text (first 350 chars):');
console.log(live.bodySnippet.substring(0, 350));
console.log('Exact snippet match:', local.bodySnippet.substring(0, 350) === live.bodySnippet.substring(0, 350));
