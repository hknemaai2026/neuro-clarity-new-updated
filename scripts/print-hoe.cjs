const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('const hOe=');
console.log('hOe snippet:');
console.log(bundle.slice(idx, idx + 500));
