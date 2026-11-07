const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const p = bundle.indexOf('function bDe(');
// Find where bDe ends (next component or export)
const pNext = bundle.indexOf('function jDe(', p);
console.log('p:', p, 'pNext:', pNext);
const bDeCode = bundle.slice(p, pNext !== -1 ? pNext : p + 20000);
fs.writeFileSync('scripts/bde-live.js', bDeCode);
console.log('Saved bde-live.js, length:', bDeCode.length);
