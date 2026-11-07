const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const startIdx = bundle.indexOf('const z8=90,mOe=');
console.log('startIdx for mOe:', startIdx);
// Let's find end: next component or export
const nextIdx = bundle.indexOf('const ', startIdx + 50);
console.log('nextIdx:', nextIdx);
const chunk = bundle.slice(startIdx, startIdx + 15000);
fs.writeFileSync('scripts/live_dashboard_component.js', chunk);
console.log('Saved scripts/live_dashboard_component.js');
