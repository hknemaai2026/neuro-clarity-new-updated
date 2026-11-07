const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const match = bundle.match(/const hZ=([^;]+);/) || bundle.match(/hZ=it\("([^"]+)"/);
console.log('hZ match:', match ? match[0] : 'not found');
