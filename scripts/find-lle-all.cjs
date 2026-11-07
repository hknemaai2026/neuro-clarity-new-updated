const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

let pos = 0;
while ((pos = bundle.indexOf('LLe', pos)) !== -1) {
  console.log('LLe at', pos, ':', bundle.slice(pos - 30, pos + 80));
  pos += 4;
}
