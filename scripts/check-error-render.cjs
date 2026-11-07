const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('EEG processing failed');
console.log(bundle.slice(idx - 100, idx + 400));
