const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('function NLe(');
const idx2 = bundle.indexOf('const NLe=');
console.log('NLe:', idx, idx2);
const start = idx > -1 ? idx : idx2;
console.log(bundle.slice(start - 50, start + 500));
