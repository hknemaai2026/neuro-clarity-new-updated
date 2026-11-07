const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const startIdx = bundle.lastIndexOf('function K8e', 1744411) !== -1 
  ? bundle.lastIndexOf('function K8e', 1744411) 
  : bundle.lastIndexOf('const K8e', 1744411);

console.log('startIdx for K8e:', startIdx);
if (startIdx !== -1) {
  const chunk = bundle.slice(startIdx, startIdx + 20000);
  fs.writeFileSync('scripts/live_reports_component.js', chunk);
  console.log('Saved scripts/live_reports_component.js');
} else {
  console.log('K8e not found');
}
