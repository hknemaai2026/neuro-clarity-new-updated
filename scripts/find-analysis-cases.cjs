const fs = require('fs');
const bundle = fs.readFileSync('scripts/live_L8e_full.js', 'utf8');

// Find S==="analysis" or S=="analysis" or case "analysis":
let pos = 0;
while ((pos = bundle.indexOf('"analysis"', pos)) !== -1) {
  console.log('pos:', pos, bundle.slice(pos - 60, pos + 100));
  pos += 10;
}
