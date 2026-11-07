const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

// Find route for path:"/"
let idx = 0;
while ((idx = bundle.indexOf('path:"/"', idx)) !== -1) {
  console.log('Found path:"/" at:', idx);
  console.log(bundle.slice(Math.max(0, idx - 100), idx + 250));
  idx += 10;
}
