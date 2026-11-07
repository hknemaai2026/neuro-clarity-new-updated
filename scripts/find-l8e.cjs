const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('function L8e(');
const idx2 = bundle.indexOf('const L8e=');
console.log('L8e:', idx, idx2);
const start = idx > -1 ? idx : idx2;
console.log(bundle.slice(start, start + 2500));
