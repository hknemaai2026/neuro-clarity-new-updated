const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

console.log(bundle.slice(1561740, 1562500));
