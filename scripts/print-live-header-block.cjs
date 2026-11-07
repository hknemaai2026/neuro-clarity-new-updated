const fs = require('fs');
const bundle = fs.readFileSync('scripts/live_L8e_full.js', 'utf8');

const idx = bundle.indexOf('EEG Cognitive Neurophysiology Report');
console.log(bundle.slice(idx - 200, idx + 2000));
