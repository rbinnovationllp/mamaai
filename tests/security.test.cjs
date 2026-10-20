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
  assert.match(source, /const user = await requireUser\(request\)/);
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



test('Ask MAMA uses durable per-IP and per-user rate limits and fails closed on storage errors', () => {
  const limiter = read('lib/server/durable-rate-limit.ts');
  const route = read('app/api/ask-mama/route.ts');
  assert.match(limiter, /UpdateCommand/);
  assert.match(limiter, /ConditionExpression: "attribute_not_exists\(#count\) OR #count < :limit"/);
  assert.match(limiter, /throw new RateLimitStorageError/);
  assert.match(route, /scope: "ask_mama_ip"/);
  assert.match(route, /scope: "ask_mama_user"/);
  assert.match(route, /REQUEST_LIMIT_UNAVAILABLE/);
});

test('problem reports require an authenticated durable save and keep review metadata minimal', () => {
  const route = read('app/api/feedback/route.ts');
  const schema = read('lib/shared/schemas.ts');
  assert.match(route, /const user = await requireUser\(request\)/);
  assert.match(route, /new FamilyLearningRepository\(\)\.saveFeedbackEvent/);
  assert.match(route, /FEEDBACK_SAVE_FAILED/);
  assert.doesNotMatch(route, /saved for this session/);
  assert.match(schema, /problemCategory/);
  assert.match(schema, /max\(1000\)/);
});

test('public legal routes and food-safety disclosure are present without claiming automated account deletion', () => {
  for (const file of ['app/privacy/page.tsx', 'app/terms/page.tsx', 'app/refund-policy/page.tsx', 'app/disclaimer/page.tsx', 'app/account/delete/page.tsx', 'app/account/export/page.tsx']) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} should exist`);
  }
  assert.match(read('app/account/delete/page.tsx'), /not enabled/);
  assert.match(read('app/disclaimer/page.tsx'), /not a substitute for medical advice/);
});

test('Phase 2D export and deletion preflight require verified identity and do not delete records', () => {
  const exportRoute = read('app/api/customer/data-export/route.ts');
  const deletionRoute = read('app/api/customer/account-deletion/route.ts');
  assert.match(exportRoute, /await requireUser\(request\)/);
  assert.match(exportRoute, /exportForVerifiedUser\(user\.userId\)/);
  assert.match(deletionRoute, /await requireUser\(request\)/);
  assert.match(read('lib/repositories/customer-data-repository.ts'), /executable: false/);
});

test('Phase 2D quota and safety-review frameworks are disabled or denied without explicit configuration', () => {
  const quota = read('lib/server/ai-usage-quota.ts');
  const admin = read('lib/server/admin.ts');
  assert.match(quota, /MAMA_AI_QUOTAS_ENABLED !== "true"/);
  assert.match(quota, /AiQuotaConfigurationError/);
  assert.match(quota, /ConditionExpression/);
  assert.match(admin, /MAMA_AI_SAFETY_REVIEWER_IDS/);
  assert.match(admin, /Safety-review access is not configured/);
});

test('Safety review routes redact customer identity from reviewer list responses', () => {
  const route = read('app/api/admin/safety-reports/route.ts');
  assert.match(route, /requireSafetyReviewer\(request\)/);
  assert.match(route, /userId: _userId/);
  assert.match(read('app/api/admin/safety-reports/[reportId]/route.ts'), /requireSafetyReviewer\(request\)/);
});

