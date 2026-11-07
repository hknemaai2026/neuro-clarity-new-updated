const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const start = 1459729;
// Find next component declaration
const end = bundle.indexOf('const gDe=', start);
console.log('start:', start, 'end:', end, 'length:', end - start);

fs.writeFileSync('scripts/live_L8e_full.js', bundle.slice(start, end));
console.log('Saved to scripts/live_L8e_full.js');
