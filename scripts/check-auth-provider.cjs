const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('function $p(');
const idx2 = bundle.indexOf('const $p=');
const idx3 = bundle.indexOf('$p=');
console.log('$p:', idx, idx2, idx3);
const start = [idx, idx2, idx3].filter(x => x > -1)[0];
console.log(bundle.slice(start, start + 1000));
