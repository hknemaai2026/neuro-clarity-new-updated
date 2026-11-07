const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const startIdx = bundle.indexOf('function Xle(');
const returnIdx = bundle.indexOf('return o.jsxs(', startIdx);
console.log('Xle returnIdx:', returnIdx);
console.log(bundle.slice(returnIdx, returnIdx + 3000));
