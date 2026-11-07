const fs = require('fs');

const liveCode = fs.readFileSync('scripts/live_SLe_full.js', 'utf8');

// Print all tabs and their children
let pos = liveCode.indexOf('return o.jsx(wa,');
const jsx = liveCode.slice(pos);

// Let's print in chunks of 2000
for (let i = 0; i < jsx.length; i += 2500) {
  console.log(`\n=== CHUNK ${i / 2500 + 1} ===\n`);
  console.log(jsx.slice(i, i + 2500));
}
