const fs = require('fs');

const liveCss = fs.readFileSync('live-bundle.css', 'utf8');
const localCss = fs.readFileSync('dist/assets/index-CDeB9Zy-.css', 'utf8');

function extractClassNames(css) {
  const matches = css.match(/\.[a-zA-Z0-9_\-\:]+/g) || [];
  return new Set(matches.map(c => c.slice(1)));
}

const liveClasses = extractClassNames(liveCss);
const localClasses = extractClassNames(localCss);

console.log('Live classes count:', liveClasses.size);
console.log('Local classes count:', localClasses.size);

const onlyLocal = [...localClasses].filter(c => !liveClasses.has(c));
const onlyLive = [...liveClasses].filter(c => !localClasses.has(c));

console.log('Only in local CSS count:', onlyLocal.length);
console.log('Sample only in local:', onlyLocal.slice(0, 30));

console.log('Only in live CSS count:', onlyLive.length);
console.log('Sample only in live:', onlyLive.slice(0, 30));
