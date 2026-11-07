const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

let idx = 0;
while ((idx = bundle.indexOf('patient-history', idx)) !== -1) {
  console.log('Found patient-history at:', idx);
  console.log(bundle.slice(Math.max(0, idx - 200), idx + 200));
  idx += 15;
}
