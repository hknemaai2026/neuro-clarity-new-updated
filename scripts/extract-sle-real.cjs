const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const start = 1544503;
// Find the next top-level declaration after return o.jsx(wa, ...
const returnIdx = bundle.indexOf('return o.jsx(wa,', start);
console.log('returnIdx:', returnIdx);

// Look for ending of SLe
const endIdx = bundle.indexOf('};', returnIdx + 2000);
console.log('endIdx:', endIdx);

fs.writeFileSync('scripts/live_SLe_full.js', bundle.slice(start, endIdx + 2));
console.log('Length:', endIdx + 2 - start);
