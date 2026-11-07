const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');
const pos = 1467980;
console.log(bundle.slice(pos + 3000, pos + 8000));
