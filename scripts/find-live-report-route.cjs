const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

let pos = 0;
while ((pos = bundle.indexOf('/report', pos)) !== -1) {
  console.log('Found /report at', pos, ':', bundle.slice(pos - 40, pos + 120));
  pos += 7;
}
