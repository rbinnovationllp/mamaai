const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const publicLayouts = [
  'app/layout.tsx',
  'app/demo/layout.tsx',
  'app/ask-mama/layout.tsx',
  'app/planner/layout.tsx',
  'app/pantry/layout.tsx',
  'app/subscription/layout.tsx',
  'app/pricing/layout.tsx',
  'app/help/layout.tsx',
  'app/privacy/layout.tsx',
  'app/terms/layout.tsx',
  'app/refund-policy/layout.tsx',
  'app/disclaimer/layout.tsx',
];
const privateLayouts = [
  'app/account/layout.tsx',
  'app/profile/layout.tsx',
  'app/family-plus/layout.tsx',
  'app/shopping-list/layout.tsx',
  'app/tiffin/layout.tsx',
  'app/more/layout.tsx',
  'app/admin/layout.tsx',
];

function source(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('public and redirectable routes define meaningful metadata instead of inheriting the generic root title', () => {
  for (const file of publicLayouts) {
    const content = source(file);
    assert.match(content, /title\s*:/, `${file} has a title`);
    assert.match(content, /description\s*:/, `${file} has a description`);
  }
});

test('private route segments are excluded from indexing', () => {
  for (const file of privateLayouts) {
    const content = source(file);
    assert.match(content, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/, `${file} is noindex,nofollow`);
  }
});
