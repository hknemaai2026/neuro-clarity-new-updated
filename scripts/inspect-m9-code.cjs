const fs = require('fs');
const code = fs.readFileSync('scripts/live_M9_component.js', 'utf8');

console.log('live_M9 length:', code.length);
console.log(code.slice(0, 3000));
