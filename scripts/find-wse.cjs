const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const wseIdx = bundle.lastIndexOf('function Wse', 472342);
console.log('Wse idx:', wseIdx);
if (wseIdx !== -1) {
  console.log(bundle.slice(wseIdx, wseIdx + 500));
}
