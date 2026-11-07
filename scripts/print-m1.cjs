const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('M1=');
console.log('M1 snippet:');
console.log(bundle.slice(idx, idx + 400));

const wgIdx = bundle.indexOf('wg=');
console.log('wg snippet:');
console.log(bundle.slice(wgIdx, wgIdx + 400));
