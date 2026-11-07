const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const startIdx = bundle.lastIndexOf('function M9', 1498410) !== -1 
  ? bundle.lastIndexOf('function M9', 1498410) 
  : bundle.lastIndexOf('const M9', 1498410);

console.log('startIdx for M9:', startIdx);
if (startIdx !== -1) {
  const chunk = bundle.slice(startIdx, startIdx + 20000);
  fs.writeFileSync('scripts/live_M9_component.js', chunk);
  console.log('Saved scripts/live_M9_component.js');
} else {
  // search anywhere for M9= or function M9
  let m9Idx = bundle.indexOf('function M9(');
  if (m9Idx === -1) m9Idx = bundle.indexOf('const M9=');
  console.log('m9Idx anywhere:', m9Idx);
  if (m9Idx !== -1) {
    const chunk = bundle.slice(m9Idx, m9Idx + 20000);
    fs.writeFileSync('scripts/live_M9_component.js', chunk);
  }
}
