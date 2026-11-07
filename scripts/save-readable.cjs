const fs = require('fs');

const liveCode = fs.readFileSync('scripts/live_SLe_full.js', 'utf8');

// Let's print out the exact JSX structure
fs.writeFileSync('scripts/live_settings_readable.js', liveCode);
console.log('Saved to scripts/live_settings_readable.js');
