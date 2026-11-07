const fs = require('fs');
const bundle = fs.readFileSync('scripts/live_L8e_full.js', 'utf8');

console.log(bundle.slice(7500, 11000));
