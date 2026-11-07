const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

// Find route for "/reports"
let idx = 0;
while ((idx = bundle.indexOf('path:"/reports"', idx)) !== -1) {
  console.log('Found path:"/reports" at:', idx);
  console.log(bundle.slice(Math.max(0, idx - 100), idx + 250));
  idx += 15;
}
