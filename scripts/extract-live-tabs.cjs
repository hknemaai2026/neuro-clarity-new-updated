const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const l8ePos = 1459729;

// Extract age_profile
const ageProfileIdx = bundle.indexOf('S==="age_profile"', l8ePos);
const brainStatesIdx = bundle.indexOf('S==="brain_states"', l8ePos);
const insightsIdx = bundle.indexOf('S==="clinical_insights"', l8ePos);
const planIdx = bundle.indexOf('S==="personalised"', l8ePos);
const summaryIdx = bundle.indexOf('S==="summary"', l8ePos);

console.log('Indices:', { ageProfileIdx, brainStatesIdx, insightsIdx, planIdx, summaryIdx });

fs.writeFileSync('scripts/extracted_age_profile.js', bundle.slice(ageProfileIdx, brainStatesIdx));
fs.writeFileSync('scripts/extracted_tab_switch.js', bundle.slice(brainStatesIdx, summaryIdx + 800));

// Extract M8e, E8e, A8e
const m8ePos = 1454450;
fs.writeFileSync('scripts/extracted_m8e.js', bundle.slice(m8ePos, m8ePos + 6000));

const e8ePos = 1447482;
fs.writeFileSync('scripts/extracted_e8e.js', bundle.slice(e8ePos, e8ePos + 7500));

const a8ePos = 1426249;
fs.writeFileSync('scripts/extracted_a8e.js', bundle.slice(a8ePos, a8ePos + 22000));

console.log('Successfully extracted tab code to scripts/');
