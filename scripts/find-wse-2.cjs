const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('Wse=');
console.log('Wse= idx:', idx);
if (idx !== -1) {
  console.log(bundle.slice(idx, idx + 500));
}
