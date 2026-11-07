const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');
const p = bundle.indexOf('children:"My Plan"');
console.log(bundle.slice(p, p + 500));
