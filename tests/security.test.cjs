const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('authentication has no hard-coded secret fallback', () => {
  const source = read('lib/auth/session.ts');
  assert.match(source, /AUTH_SECRET/);
  assert.doesNotMatch(source, /mamaai-production-secret-key/);
  assert.match(source, /at least 32 characters/);
});
test('weekly planning is fail-closed and authenticated', () => {
  const source = read('app/api/weekly-meal-plans/route.ts');
  assert.match(source, /const user = requireUser\(request\)/);
  assert.match(source, /return \{ ok: false, userId: resolvedUserId \}/);
});
test('subscription status does not trust query-string identity', () => {
  const source = read('app/api/subscriptions/status/route.ts');
  assert.match(source, /requireUser\(request\)/);
  assert.doesNotMatch(source, /x-demo-user-id/);
});
test('Razorpay verification derives tier from provider plan', () => {
  assert.match(read('app/api/razorpay/verify/route.ts'), /resolveProviderPlan/);
  assert.match(read('app/api/razorpay/verify/route.ts'), /plan: providerPlan\.plan/);
});
test('obsolete replacement routes are disabled', () => {
  assert.match(read('app/api/meal-plan/replace-slot/route.ts'), /status: 410/);
  assert.match(read('app/meal-plans/replace-dish/route.ts'), /status: 410/);
});
test('production diagnostics and client judge mode are disabled', () => {
  assert.match(read('app/api/razorpay/diagnostics/route.ts'), /Diagnostics are disabled in production/);
  assert.doesNotMatch(read('app/api/ask-mama/route.ts'), /body\.isJudgeMode/);
});
test('meal persistence is awaited before success', () => {
  const source = read('lib/services/meal-planning-service.ts');
  assert.match(source, /await this\.repository\.saveMealPlan\(finalizedMealPlan\)/);
  assert.doesNotMatch(source, /saveMealPlan\(finalizedMealPlan\)\.catch/);
});
