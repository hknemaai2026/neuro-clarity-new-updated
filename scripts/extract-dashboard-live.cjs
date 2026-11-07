const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const startIdx = bundle.lastIndexOf('function mOe', 1743788) !== -1 
  ? bundle.lastIndexOf('function mOe', 1743788) 
  : bundle.lastIndexOf('const mOe', 1743788);

console.log('startIdx for mOe:', startIdx);
if (startIdx !== -1) {
  // Let's find end: next function
  const nextFuncIdx = bundle.indexOf('function ', startIdx + 50);
  console.log('mOe size:', nextFuncIdx !== -1 ? nextFuncIdx - startIdx : 20000);
  const chunk = bundle.slice(startIdx, nextFuncIdx !== -1 ? nextFuncIdx : startIdx + 20000);
  fs.writeFileSync('scripts/live_dashboard_component.js', chunk);
  console.log('Saved scripts/live_dashboard_component.js');
} else {
  console.log('mOe not found');
}
