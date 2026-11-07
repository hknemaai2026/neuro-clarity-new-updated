const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const startIdx = bundle.lastIndexOf('function RLe', 1577095) !== -1 
  ? bundle.lastIndexOf('function RLe', 1577095) 
  : bundle.lastIndexOf('const RLe', 1577095);

console.log('startIdx:', startIdx);
// Let's find end: export or next function
const chunk = bundle.slice(startIdx, startIdx + 12000);
fs.writeFileSync('scripts/live_patients_component.js', chunk);
console.log('Written scripts/live_patients_component.js');
