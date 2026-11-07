const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');
const idx = bundle.indexOf('ILe=');
if (idx !== -1) {
  console.log('ILe:', bundle.slice(idx, idx + 100));
} else {
  console.log('ILe not found');
}
