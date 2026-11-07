const fs = require('fs');

const code = fs.readFileSync('scripts/live_M9_full.js', 'utf8');

// Let's print in 2000-char blocks
for (let i = 0; i < code.length; i += 2000) {
  console.log(`\n=== BLOCK ${i} - ${i + 2000} ===`);
  console.log(code.slice(i, i + 2000));
}
