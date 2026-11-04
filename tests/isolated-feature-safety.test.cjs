const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('isolated Ask MAMA guard blocks isolated production, preview, missing enable flag, and direct API requests', () => {
  const guard = read('lib/ai/ask-mama-runtime-safety.ts');
  const shared = read('lib/server/isolated-runtime-safety.ts');
  const route = read('app/api/ask-mama/route.ts');
  assert.match(shared, /MAMA_AI_ISOLATED_PREVIEW/);
  assert.match(shared, /MAMA_AI_AWS_IDENTITY_SCOPE/);
  assert.match(guard, /MAMA_AI_PREVIEW_ASK_MAMA_ENABLED/);
  assert.match(guard, /isIsolatedFeatureBlocked/);
  assert.match(route, /isAskMamaPreviewBlocked\(\)/);
});

test('demo API fails closed in isolated runtime unless its explicit enable flag is true', () => {
  const route = read('app/api/demo/route.ts');
  assert.match(route, /isIsolatedFeatureBlocked\("MAMA_AI_DEMO_MODE"\)/);
  assert.match(route, /status: 503/);
  assert.match(route, /isolatedFeatureDisabledResponse/);
});

test('payments and webhooks fail closed in isolated runtime', () => {
  const service = read('lib/services/razorpay-service.ts');
  assert.match(service, /isIsolatedRuntime\(\)\) return false/);
  assert.match(service, /Payments are disabled in this isolated environment/);
  assert.match(read('app/api/revenuecat/webhook/route.ts'), /if \(isIsolatedRuntime\(\)\)/);
});

test('temporary isolated smoke endpoint is POST-only, secret-protected, bounded, and cleans up synthetic records', () => {
  const route = read('app/api/internal/isolated-smoke/route.ts');
  assert.match(route, /export async function POST/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /MAMA_AI_ISOLATED_SMOKE_TEST_ENABLED/);
  assert.match(route, /MAMA_AI_ISOLATED_SMOKE_TEST_SECRET/);
  assert.match(route, /ISOLATED_SMOKE#/);
  assert.match(route, /expiresAt/);
  assert.match(route, /DeleteCommand/);
  assert.match(route, /await client\.send\(new DeleteCommand/);
  assert.match(route, /IndexName: EXPECTED_GSI/);
  assert.doesNotMatch(route, /request\.json\(/);
});
