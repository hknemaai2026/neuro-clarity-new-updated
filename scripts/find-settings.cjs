const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

let pos = 0;
while ((pos = bundle.indexOf('/settings', pos)) !== -1) {
  console.log('Found /settings at', pos, ':', bundle.slice(pos - 60, pos + 100));
  pos += 9;
}

pos = 0;
while ((pos = bundle.indexOf('settings', pos)) !== -1) {
  const s = bundle.slice(pos - 40, pos + 60);
  if (s.includes('path') || s.includes('route') || s.includes('Component') || s.includes('Lazy')) {
    console.log('Found settings at', pos, ':', s);
  }
  pos += 8;
}
