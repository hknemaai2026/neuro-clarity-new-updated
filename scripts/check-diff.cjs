const fs = require('fs');
const local = JSON.parse(fs.readFileSync('scripts/local_patient_history_actual.json', 'utf8'));
const live = JSON.parse(fs.readFileSync('scripts/live_patient_history_actual.json', 'utf8'));

console.log('Badges count: Local =', local.badges.length, ', Live =', live.badges.length);
console.log('Sample badges compare:');
for (let i = 0; i < Math.min(10, local.badges.length); i++) {
  console.log('Badge ' + i + ': Local="' + local.badges[i].text + '", Live="' + live.badges[i].text + '" match=' + (local.badges[i].text === live.badges[i].text));
}

console.log('\n--- BODY SNIPPET ---');
console.log('Local snippet (first 350 chars):');
console.log(local.bodySnippet.substring(0, 350));
console.log('\nLive snippet (first 350 chars):');
console.log(live.bodySnippet.substring(0, 350));
