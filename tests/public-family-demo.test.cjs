const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('public demo is an immutable fictional seven-day vegetarian reference', () => {
  const fixture = read('lib/shared/public-sample-family-plan.ts');
  assert.match(fixture, /publicSampleWeek/);
  for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) assert.match(fixture, new RegExp(`day: "${day}"`));
  assert.match(fixture, /Father follows Tuesday fasting rules/);
  assert.match(fixture, /No regular office tiffin scheduled/);
  assert.match(fixture, /Granddaughter/);
});

test('anonymous demo editing is client-local and never invokes paid AI or persistence', () => {
  const page = read('app/demo/page.tsx');
  assert.match(page, /useState/);
  assert.match(page, /Restore original sample/);
  assert.match(page, /publicVegetarianAlternatives/);
  assert.doesNotMatch(page, /fetch\(|api\/ask-mama|localStorage|DynamoDb|repository/i);
});

test('demo refuses fabricated grocery quantities and directs subscriber conversion safely', () => {
  const page = read('app/demo/page.tsx');
  assert.match(page, /no validated recipe-weight specifications/i);
  assert.match(page, /Create Your Family Plan/);
  assert.match(page, /Choose a Subscription/);
  assert.match(page, /Save Your Meal Plan/);
});

test('homepage public demo call-to-action does not route visitors into paid AI', () => {
  const home = read('app/page.tsx');
  assert.match(home, /href="\/demo"/);
});
