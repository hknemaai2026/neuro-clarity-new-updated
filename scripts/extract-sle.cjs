const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('function SLe(');
const idx2 = bundle.indexOf('const SLe=');
const idx3 = bundle.indexOf('var SLe=');
console.log('SLe indices:', idx, idx2, idx3);
const start = [idx, idx2, idx3].filter(x => x > -1)[0];
console.log(bundle.slice(start, start + 3000));
