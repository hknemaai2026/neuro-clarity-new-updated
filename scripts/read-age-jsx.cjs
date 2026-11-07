const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');
const l8ePos = 1459729;
const idx = bundle.indexOf('S==="age_profile"?', l8ePos);
console.log('JSX age_profile idx:', idx);
if (idx !== -1) {
  console.log(bundle.slice(idx, idx + 4000));
}
