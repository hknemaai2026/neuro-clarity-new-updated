const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const targets = ['Search by name or patient ID...', 'patients registered', 'Add New Patient', 'Delete patient?'];
for (const t of targets) {
  let idx = bundle.indexOf(t);
  console.log(`Target "${t}" found at:`, idx);
  if (idx !== -1) {
    console.log('--- SNIPPET ---');
    console.log(bundle.slice(Math.max(0, idx - 1500), idx + 2500));
    console.log('--- END SNIPPET ---');
    break;
  }
}
