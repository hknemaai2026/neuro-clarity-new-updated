const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const names = ['Xg', 'bZ', 'yl', 'v1', 'Cs', 'Dm', 'm1', 'yh', 'Ko', 'Ws', 'uZ', 'dZ'];
const regex = /const\s+([a-zA-Z0-9_$]+)\s*=\s*it\("([^"]+)"/g;
let match;
const icons = {};
while ((match = regex.exec(bundle)) !== null) {
  if (names.includes(match[1])) {
    icons[match[1]] = match[2];
  }
}
console.log(icons);
