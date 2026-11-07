const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const m9Idx = bundle.indexOf('function M9({');
// find end of M9
const nextIdx = bundle.indexOf('function ', m9Idx + 50);
console.log('M9 size:', nextIdx - m9Idx);
fs.writeFileSync('scripts/live_M9_full.js', bundle.slice(m9Idx, nextIdx));
console.log('Saved scripts/live_M9_full.js');
