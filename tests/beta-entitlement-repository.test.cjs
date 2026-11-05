const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
const load = Module._load;
let calls = [];
let current;
Module._resolveFilename = function(name, parent, ...args) {
  if (name.startsWith('@/')) name = path.join(root, name.slice(2)) + '.ts';
  if (name.startsWith('.') && parent?.filename.endsWith('.ts')) {
    const candidate = path.resolve(path.dirname(parent.filename), name + '.ts');
    if (fs.existsSync(candidate)) name = candidate;
  }
  return resolve.call(this, name, parent, ...args);
};
Module._extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
Module._load = function(name, parent, ...args) {
  if (name === './dynamodb-client') return { getMamaAiTableName: () => 'mamaai-preview-beta-qa', mamaAiDynamoDb: { send: async command => { calls.push(command.input); if (command.input.Key) return { Item: current }; return {}; } } };
  return load.call(this, name, parent, ...args);
};
const { SubscriptionRepository } = require('../lib/repositories/subscription-repository.ts');

function record(userId = 'fictional-approved') {
  return { subscriptionRecordId: 'beta-fixture', userId, plan: 'premium', status: 'trialing', paymentChannel: 'manual', paymentStatus: 'not_required', source: 'beta_operator', memberLimit: 6, startsAt: '2026-11-05T00:00:00.000Z', expiresAt: '2099-01-01T00:00:00.000Z', createdAt: '2026-11-05T00:00:00.000Z', updatedAt: '2026-11-05T00:00:00.000Z' };
}

test('A1 retest: beta grant persists only the server-built owner record with expiry TTL', async () => {
  calls = []; current = undefined;
  await new SubscriptionRepository().grantBetaEntitlement(record());
  const put = calls[0];
  assert.equal(put.TableName, 'mamaai-preview-beta-qa');
  assert.equal(put.Item.PK, 'USER#fictional-approved');
  assert.equal(put.Item.SK, 'SUBSCRIPTION#BETA#CURRENT');
  assert.equal(put.Item.record.source, 'beta_operator');
  assert.equal(put.Item.record.plan, 'premium');
  assert.equal(typeof put.Item.expiresAt, 'number');
});

test('A2 retest: revocation is owner-scoped and cannot revoke another account or a non-beta subscription', async () => {
  calls = []; current = { PK: 'USER#fictional-approved', SK: 'SUBSCRIPTION#BETA#CURRENT', record: record() };
  assert.equal(await new SubscriptionRepository().revokeBetaEntitlement('fictional-unapproved'), false);
  assert.equal(calls.length, 1);
  calls = []; current = { PK: 'USER#fictional-approved', SK: 'SUBSCRIPTION#BETA#CURRENT', record: record() };
  assert.equal(await new SubscriptionRepository().revokeBetaEntitlement('fictional-approved', '2026-11-06T00:00:00.000Z'), true);
  const put = calls[1];
  assert.equal(put.Item.record.status, 'cancelled');
  assert.equal(put.Item.record.cancelledAt, '2026-11-06T00:00:00.000Z');
});
