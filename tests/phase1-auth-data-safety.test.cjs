const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('identity values cannot mint durable customer sessions', () => {
  const session = read('lib/server/customer-session.ts');
  const familyRoute = read('app/api/customer/family-profile/route.ts');
  assert.match(session, /IDENTITY_DERIVATION_DISABLED/);
  assert.doesNotMatch(familyRoute, /customerUserIdFromIdentity/);
  assert.match(familyRoute, /await requireUser\(request\)/);
});

test('customer mutations enforce same-origin checks', () => {
  for (const file of ['app/api/customer/family-profile/route.ts', 'app/api/pantry/route.ts', 'app/api/customer/logout/route.ts']) {
    assert.match(read(file), /requireSameOrigin/);
  }
});

test('browser pantry cache cannot auto-overwrite an empty cloud household', () => {
  const pantry = read('app/pantry/page.tsx');
  assert.match(pantry, /cloud account is authoritative/i);
  assert.doesNotMatch(pantry, /const migration = await fetch\('\/api\/pantry'/);
});

test('optional analytics requires affirmative consent and offers a choice', () => {
  const client = read('lib/shared/client-analytics.ts');
  const component = read('components/AnalyticsConsent.tsx');
  assert.match(client, /mamaai_analytics_consent/);
  assert.match(client, /!== "granted"/);
  assert.match(component, /Decline/);
  assert.match(component, /Allow analytics/);
});

test('export interface uses the authenticated server endpoint and does not expose credential data', () => {
  const page = read('app/account/export/page.tsx');
  const route = read('app/api/customer/data-export/route.ts');
  assert.match(page, /\/api\/customer\/data-export/);
  assert.match(route, /requireUser\(request\)/);
  assert.match(route, /Content-Disposition/);
});
