const fs = require('fs');

const code = fs.readFileSync('scripts/live_dashboard_component.js', 'utf8');

for (let i = 0; i < code.length; i += 2000) {
  console.log(`\n=== CHUNK ${i} - ${i + 2000} ===`);
  console.log(code.slice(i, i + 2000));
}
