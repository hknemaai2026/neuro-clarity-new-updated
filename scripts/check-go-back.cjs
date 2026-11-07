const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('Go back');
console.log(bundle.slice(idx - 250, idx + 250));
