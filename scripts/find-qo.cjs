const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const qO_match = bundle.match(/const qO=([^;]+);/) || bundle.match(/qO=([^,;)]+)/);
console.log('qO:', qO_match ? qO_match[0] : 'not found');

const M1_match = bundle.match(/const M1=([^;]+);/) || bundle.match(/M1=([^,;)]+)/);
console.log('M1:', M1_match ? M1_match[0] : 'not found');
