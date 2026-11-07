const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const poeIdx = bundle.indexOf('function pOe(');
console.log('poeIdx:', poeIdx);
// Let's find end of pOe: next function or const
const nextIdx = bundle.indexOf('function ', poeIdx + 50);
console.log('nextIdx:', nextIdx);
const chunk = bundle.slice(poeIdx, nextIdx !== -1 ? nextIdx : poeIdx + 10000);
fs.writeFileSync('scripts/live_pOe_full.js', chunk);
console.log('Saved scripts/live_pOe_full.js');
