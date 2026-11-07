const fs = require('fs');

const liveJs = fs.readFileSync('./live-bundle.js', 'utf8');
const localJs = fs.readFileSync('./dist/assets/index-06nbnPCX.js', 'utf8');

console.log('--- FILE SIZES ---');
console.log('Live bundle size:', liveJs.length);
console.log('Local bundle size:', localJs.length);

const terms = [
  '/login',
  '/signup',
  '/',
  '/upload',
  '/patients',
  '/reports',
  '/report/',
  '/report-eeg/',
  '/eeg-technician-report',
  '/neuro-intake',
  '/longitudinal',
  '/evidence',
  '/settings',
  '/patient-history',
  '/report-summary',
  '/admin',
  '/admin-keys',
  '/followups',
  '/eeg-analysis'
];

console.log('\n--- ROUTE / STRING SEARCH ---');
for (const t of terms) {
  console.log(`Term "${t}": Live = ${liveJs.includes(t)}, Local = ${localJs.includes(t)}`);
}

// Find App.tsx component definitions in both bundles
function findRoutesInBundle(js, label) {
  console.log(`\n--- ROUTES IN ${label} ---`);
  // React Router v6 usually transpiles <Route path="/xyz" element=...
  // In minified code: path:"/xyz" or path:'/xyz'
  const re = /path:\s*["']([^"']+)["']/g;
  let m;
  const paths = new Set();
  while ((m = re.exec(js)) !== null) {
    if (m[1].startsWith('/') || m[1] === '*') {
      paths.add(m[1]);
    }
  }
  console.log(Array.from(paths));
  return paths;
}

findRoutesInBundle(liveJs, 'LIVE');
findRoutesInBundle(localJs, 'LOCAL');
