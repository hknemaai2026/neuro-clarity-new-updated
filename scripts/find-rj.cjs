const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const rjMatch = bundle.match(/const Rj=([^;]+);/) || bundle.match(/Rj="([^"]+)"/);
console.log('Rj:', rjMatch ? rjMatch[0] : 'not found');
