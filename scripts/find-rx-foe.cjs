const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const rxIdx = bundle.indexOf('Rx=');
console.log('Rx snippet:');
console.log(bundle.slice(rxIdx, rxIdx + 300));

const foeIdx = bundle.indexOf('fOe=');
console.log('fOe snippet:');
console.log(bundle.slice(foeIdx, foeIdx + 300));

const b8Idx = bundle.indexOf('B8=');
console.log('B8 snippet:');
console.log(bundle.slice(b8Idx, b8Idx + 300));
