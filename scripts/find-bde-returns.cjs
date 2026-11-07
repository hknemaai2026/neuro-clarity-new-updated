const fs = require('fs');
const code = fs.readFileSync('scripts/bde-live.js', 'utf8');

let pos = 0;
while(true) {
  let idx = code.indexOf('return', pos);
  if (idx === -1) break;
  console.log('--- return at ' + idx + ':');
  console.log(code.slice(idx, idx + 250));
  pos = idx + 10;
}
