const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

// Find settings in routes
const regex = /path:\s*["']settings["'][^}]+element:\s*([^,}]+)/g;
let match;
while ((match = regex.exec(bundle)) !== null) {
  console.log('Match:', match[0]);
}

// Also search for Settings word in bundle
let pos = 0;
while ((pos = bundle.indexOf('Settings', pos)) !== -1) {
  const snippet = bundle.slice(Math.max(0, pos - 50), pos + 100);
  if (snippet.includes('Hospital') || snippet.includes('Password') || snippet.includes('h1') || snippet.includes('Change')) {
    console.log('Settings snippet at', pos, ':\n', snippet, '\n---');
  }
  pos += 8;
}
