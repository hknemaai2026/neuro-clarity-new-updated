const fs = require('fs');
const code = fs.readFileSync('scripts/bde-live.js', 'utf8');

// Let's see all parts of bDe
console.log('Total length:', code.length);

// Let's check the top bar when authenticated
const pPanel = code.indexOf('return a?');
console.log('Panel start:', pPanel);
console.log(code.slice(pPanel, pPanel + 2000));
