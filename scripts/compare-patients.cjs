const fs = require('fs');

const live = JSON.parse(fs.readFileSync('scripts/live_patients_actual.json', 'utf8'));
const local = JSON.parse(fs.readFileSync('scripts/local_patients_actual.json', 'utf8'));

console.log('=== COMPARISON: Live vs Local /patients ===\n');

console.log('1. Page Title:');
console.log('   Live: ', live.title);
console.log('   Local:', local.title);
console.log('   Match:', live.title === local.title);

console.log('\n2. H1:');
console.log('   Live: ', live.h1);
console.log('   Local:', local.h1);
console.log('   Match:', JSON.stringify(live.h1) === JSON.stringify(local.h1));

console.log('\n3. Inputs:');
console.log('   Live count:', live.inputs.length);
console.log('   Local count:', local.inputs.length);
console.log('   Live placeholder:', live.inputs.map(i => i.placeholder));
console.log('   Local placeholder:', local.inputs.map(i => i.placeholder));
console.log('   Match:', JSON.stringify(live.inputs.map(i => i.placeholder)) === JSON.stringify(local.inputs.map(i => i.placeholder)));

console.log('\n4. Buttons:');
const liveButtons = live.buttons.map(b => b.text);
const localButtons = local.buttons.map(b => b.text);
console.log('   Live buttons: ', liveButtons);
console.log('   Local buttons:', localButtons);
const actionBtns = ['Export Excel', 'Add Patient'];
console.log('   Action buttons present in both:', actionBtns.every(b => liveButtons.includes(b) && localButtons.includes(b)));

console.log('\n5. Cards Count:');
console.log('   Live: ', live.cardsCount);
console.log('   Local:', local.cardsCount);
console.log('   Match:', live.cardsCount === local.cardsCount);

console.log('\n6. Top 5 Cards sample:');
for (let i = 0; i < Math.min(5, live.cards.length); i++) {
  console.log(`   Card ${i + 1}:`);
  console.log('     Live: ', live.cards[i].text);
  console.log('     Local:', local.cards[i]?.text);
  console.log('     Class Match:', live.cards[i].classes === local.cards[i]?.classes);
}

console.log('\n7. Badges count:');
console.log('   Live badges count: ', live.badges.length);
console.log('   Local badges count:', local.badges.length);

const liveBadges = live.badges.map(b => `${b.text} [${b.className}]`);
const localBadges = local.badges.map(b => `${b.text} [${b.className}]`);
let badgeDiffs = 0;
for (let i = 0; i < Math.max(liveBadges.length, localBadges.length); i++) {
  if (liveBadges[i] !== localBadges[i]) {
    badgeDiffs++;
    if (badgeDiffs <= 5) {
      console.log(`   Badge mismatch at ${i}:`);
      console.log('     Live: ', liveBadges[i]);
      console.log('     Local:', localBadges[i]);
    }
  }
}
if (badgeDiffs === 0) {
  console.log('   ALL BADGES MATCH 100%!');
} else {
  console.log(`   Total badge mismatches: ${badgeDiffs}`);
}

console.log('\n8. Body text check:');
const checkWords = ['Patient Directory', '27 patients registered', 'Export Excel', 'Add Patient', 'Search by name or patient ID...', 'test', 'P011', '23 yrs · Female', 'Moderate Cognitive Risk'];
checkWords.forEach(w => {
  const inLive = live.bodySnippet.includes(w);
  const inLocal = local.bodySnippet.includes(w);
  console.log(`   "${w}": inLive=${inLive}, inLocal=${inLocal}, Match=${inLive === inLocal}`);
});
