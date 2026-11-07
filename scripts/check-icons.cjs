const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const regex = /const\s+([a-zA-Z0-9_$]+)\s*=\s*it\("([^"]+)"/g;
let match;
const icons = {};
while ((match = regex.exec(bundle)) !== null) {
  icons[match[1]] = match[2];
}

console.log('v7:', icons['v7']);
console.log('$_:', icons['$_']);
console.log('o3:', icons['o3']);
console.log('Jd:', icons['Jd']);
console.log('Fl:', icons['Fl']);
