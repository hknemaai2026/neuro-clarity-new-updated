const fs = require('fs');

const code = fs.readFileSync('scripts/live_pOe_clean.js', 'utf8');

console.log(code.slice(3000));
