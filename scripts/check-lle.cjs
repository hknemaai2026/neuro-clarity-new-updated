const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('const LLe=');
console.log(bundle.slice(idx, idx + 1500));
