const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

console.log(bundle.slice(1567579, 1569000));
