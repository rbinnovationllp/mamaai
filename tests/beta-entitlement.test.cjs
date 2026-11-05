const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(name, parent, ...args) {
  if (name.startsWith('@/')) name = path.join(root, name.slice(2)) + '.ts';
  if (name.startsWith('.') && parent?.filename.endsWith('.ts')) {
    const candidate = path.resolve(path.dirname(parent.filename), name + '.ts');
    if (fs.existsSync(candidate)) name = candidate;
  }
  return resolve.call(this, name, parent, ...args);
};
Module._extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
const { betaEntitlementConfiguration, buildBetaEntitlement } = require('../lib/services/beta-entitlement-service.ts');
const { hasCurrentEntitlement } = require('../lib/services/paid-entitlement.ts');
const route = fs.readFileSync(path.join(root, 'app/api/admin/beta-entitlements/route.ts'), 'utf8');

const safe = {
  MAMA_AI_ISOLATED_PREVIEW: 'true', MAMA_AI_AWS_IDENTITY_SCOPE: 'preview-isolated',
  MAMA_AI_DYNAMODB_TABLE_NAME: 'mamaai-preview-beta-qa', MAMA_AI_BETA_ACCESS_ENABLED: 'true',
  MAMA_AI_BETA_END_AT: '2099-01-01T00:00:00.000Z', MAMA_AI_BETA_PLAN: 'premium',
};

test('A1: an approved beta entitlement is server-shaped, time-bounded, and limited to Premium', () => {
  const config = betaEntitlementConfiguration(safe);
  const record = buildBetaEntitlement('fictional-approved-user', config, new Date('2026-11-05T00:00:00.000Z'));
  assert.equal(record.source, 'beta_operator');
  assert.equal(record.paymentChannel, 'manual');
  assert.equal(record.paymentStatus, 'not_required');
  assert.equal(record.plan, 'premium');
  assert.equal(record.memberLimit, 6);
  assert.equal(hasCurrentEntitlement(record, Date.parse('2026-11-06T00:00:00.000Z')), true);
  assert.equal(hasCurrentEntitlement(record, Date.parse('2100-01-01T00:00:00.000Z')), false);
});

test('A2: browser flags, production-like configuration, and Family Plus fail closed', () => {
  assert.throws(() => betaEntitlementConfiguration({ ...safe, MAMA_AI_BETA_ACCESS_ENABLED: 'false' }));
  assert.throws(() => betaEntitlementConfiguration({ ...safe, MAMA_AI_DYNAMODB_TABLE_NAME: 'MAMA_AI_APP' }));
  assert.throws(() => betaEntitlementConfiguration({ ...safe, MAMA_AI_BETA_PLAN: 'family_plus' }));
  assert.match(route, /requireAdmin\(request\)/);
  assert.match(route, /getCustomer\(input\.userId\)/);
  assert.match(route, /grantBetaEntitlement/);
  assert.match(route, /revokeBetaEntitlement/);
  assert.match(route, /beta_entitlement\.grant/);
  assert.match(route, /beta_entitlement\.revoke/);
});
