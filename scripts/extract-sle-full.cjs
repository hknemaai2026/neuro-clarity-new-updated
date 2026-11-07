const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const start = 1544503;
// Find next component or export
const end = bundle.indexOf('const ', start + 100);
console.log('Start:', start, 'End:', end, 'Length:', end - start);

fs.writeFileSync('scripts/live_SLe_full.js', bundle.slice(start, start + 15000));
console.log('Saved to scripts/live_SLe_full.js');
