const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

let idx = bundle.indexOf('mOe=');
console.log('mOe= idx:', idx);
if (idx !== -1) {
  console.log(bundle.slice(idx - 50, idx + 2000));
  fs.writeFileSync('scripts/live_dashboard_component.js', bundle.slice(idx - 50, idx + 25000));
} else {
  // Let's search around 1743788 for mOe definition
  let snippet = bundle.slice(1743788 - 5000, 1743788);
  console.log('Snippet before route:');
  console.log(snippet.slice(-1000));
}
