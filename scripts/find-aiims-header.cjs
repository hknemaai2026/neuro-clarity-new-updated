const fs = require('fs');
const bundle = fs.readFileSync('scripts/live_L8e_full.js', 'utf8');

const idx = bundle.indexOf('AIIMS');
console.log(bundle.slice(idx - 100, idx + 400));
