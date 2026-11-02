const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('ISS-011: the pricing alias redirects to the subscription route', () => {
  const source = read('app/pricing/page.tsx');
  assert.match(source, /redirect\(["']\/subscription["']\)/);
});

test('ISS-017 and ISS-027: global assistant and footer links have accessible names and touch targets', () => {
  assert.match(read('components/ask-mama/AskMamaLauncher.tsx'), /aria-label="Open Ask MAMA assistant"/);
  const footer = read('components/Footer.tsx');
  assert.match(footer, /min-h-11/);
  assert.match(footer, /href="\/account\/export"/);
});

test('ISS-022 and ISS-023: subscription copy does not claim an active anonymous trial or unsupported pet advice', () => {
  const source = read('app/subscription/page.tsx');
  assert.doesNotMatch(source, /Free Trial Active - 3 Days Remaining/);
  assert.doesNotMatch(source, /Separate pet-appropriate meal planning/);
  assert.match(source, /Trial eligibility is confirmed after sign-in/);
  assert.match(source, /not currently available/);
});
