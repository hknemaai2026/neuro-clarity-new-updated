const fs = require('fs');
const bundle = fs.readFileSync('scripts/live_L8e_full.js', 'utf8');

const idx = bundle.indexOf('grid grid-cols-2 gap-4 border-t');
console.log(bundle.slice(idx, idx + 2500));
