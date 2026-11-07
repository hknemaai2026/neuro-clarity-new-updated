const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('qO=');
console.log('qO snippet:');
console.log(bundle.slice(idx, idx + 400));
