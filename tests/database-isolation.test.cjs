const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request.startsWith('@/')) return path.join(root, request.slice(2)) + '.ts';
  return originalResolve.call(this, request, parent, isMain, options);
};
Module._extensions['.ts'] = function(mod, filename) {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  mod._compile(output, filename);
};

const { getDynamoDbConfiguration, getLegacyDynamoTableName, DynamoDbConfigurationError } = require('../lib/server/dynamodb-configuration.ts');

const preview = (overrides = {}) => ({
  VERCEL_ENV: 'preview',
  AWS_REGION: 'ap-south-1',
  AWS_ROLE_ARN: 'arn:aws:iam::624719611353:role/MAMAAI-Vercel-Preview-Role',
  MAMA_AI_DYNAMODB_GSI1_NAME: 'GSI1',
  MAMA_AI_AWS_IDENTITY_SCOPE: 'preview-isolated',
  MAMA_AI_DYNAMODB_TABLE_NAME: 'mamaai-preview-test',
  MAMA_AI_ANALYTICS_TABLE_NAME: 'mamaai-preview-test',
  ...overrides,
});

test('Preview requires an explicit isolated table before any DynamoDB configuration is returned', () => {
  assert.throws(() => getDynamoDbConfiguration(preview({ MAMA_AI_DYNAMODB_TABLE_NAME: undefined })), DynamoDbConfigurationError);
  assert.throws(() => getDynamoDbConfiguration(preview({ MAMA_AI_DYNAMODB_TABLE_NAME: undefined, MAMA_AI_TABLE_NAME: 'MAMA_AI_APP' })), /legacy and production fallbacks are disabled/);
});

test('Preview requires an explicit valid AWS region and isolated identity declaration', () => {
  assert.throws(() => getDynamoDbConfiguration(preview({ AWS_REGION: undefined })), /AWS_REGION must be explicitly configured/);
  assert.throws(() => getDynamoDbConfiguration(preview({ AWS_REGION: 'invalid region' })), /AWS_REGION is invalid/);
  assert.throws(() => getDynamoDbConfiguration(preview({ MAMA_AI_AWS_IDENTITY_SCOPE: undefined })), /isolated identity scope/);
  assert.throws(() => getDynamoDbConfiguration(preview({ AWS_ROLE_ARN: undefined })), /AWS_ROLE_ARN must be explicitly configured/);
  assert.throws(() => getDynamoDbConfiguration(preview({ MAMA_AI_DYNAMODB_GSI1_NAME: undefined })), /GSI1.*explicitly set/);
});

test('Preview rejects known production table identifiers and non-isolated names', () => {
  for (const tableName of ['MAMA_AI_APP', 'MAMA_AI_ANALYTICS_EVENTS', 'rbil-visitor-counter-VisitorCounterTable-8WYWZCV6BTIY', 'random-table']) {
    assert.throws(() => getDynamoDbConfiguration(preview({ MAMA_AI_DYNAMODB_TABLE_NAME: tableName })), /not an approved isolated Preview or test resource/);
  }
});

test('test runtime is fail-closed and only accepts explicit test resources', () => {
  const testEnvironment = {
    NODE_ENV: 'test', AWS_REGION: 'ap-south-1', MAMA_AI_AWS_IDENTITY_SCOPE: 'test-isolated',
    MAMA_AI_DYNAMODB_TABLE_NAME: 'mamaai-test-unit', MAMA_AI_ANALYTICS_TABLE_NAME: 'mamaai-test-unit', MAMA_AI_DYNAMODB_GSI1_NAME: 'GSI1',
  };
  assert.equal(getDynamoDbConfiguration(testEnvironment).tableName, 'mamaai-test-unit');
  assert.throws(() => getDynamoDbConfiguration({ ...testEnvironment, MAMA_AI_DYNAMODB_TABLE_NAME: undefined }), DynamoDbConfigurationError);
  assert.throws(() => getLegacyDynamoTableName('DYNAMODB_USERS_TABLE', 'mamaai_users', testEnvironment), /must be explicitly configured/);
});

test('existing production variable names and legacy defaults remain compatible only in production', () => {
  const production = { NODE_ENV: 'production', AWS_REGION: 'ap-south-1', MAMA_AI_TABLE_NAME: 'MAMA_AI_APP', MAMA_AI_ANALYTICS_TABLE: 'MAMA_AI_ANALYTICS_EVENTS' };
  const configuration = getDynamoDbConfiguration(production);
  assert.equal(configuration.tableName, 'MAMA_AI_APP');
  assert.equal(configuration.analyticsTableName, 'MAMA_AI_ANALYTICS_EVENTS');
  assert.equal(getLegacyDynamoTableName('DYNAMODB_USERS_TABLE', 'mamaai_users', production), 'mamaai_users');
});

test('all direct DynamoDB access paths use the centralized validated configuration', () => {
  const guarded = ['lib/repositories/dynamodb-client.ts', 'lib/repositories/dynamo.ts', 'lib/fair-use.ts', 'lib/monthly-memory.ts', 'app/api/analytics/track/route.ts', 'app/api/admin/analytics/route.ts'];
  for (const file of guarded) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(source, /AWS_REGION\s*\|\||MAMA_AI_TABLE_NAME\s*\|\||MAMA_AI_ANALYTICS_TABLE\s*\|\|/);
  }
  assert.match(fs.readFileSync(path.join(root, 'lib/repositories/dynamodb-client.ts'), 'utf8'), /getDynamoDbConfiguration\(\)/);
  const retiredRoute = fs.readFileSync(path.join(root, 'app/meal-plans/replace-dish/route.ts'), 'utf8');
  assert.doesNotMatch(retiredRoute, /from ['"]@aws-sdk|from ['"]@google|new [A-Za-z]+Client/);
});

test('invalid configuration fails before client delegation and errors do not expose secrets', () => {
  const clientSource = fs.readFileSync(path.join(root, 'lib/repositories/dynamodb-client.ts'), 'utf8');
  assert.match(clientSource, /getMamaAiDynamoDb\(\)\.send/);
  assert.match(clientSource, /const configuration = getDynamoDbConfiguration\(\)/);
  let error;
  try { getDynamoDbConfiguration(preview({ AWS_REGION: undefined })); } catch (caught) { error = caught; }
  assert.ok(error instanceof DynamoDbConfigurationError);
  assert.doesNotMatch(error.message, /secret|token|access.?key/i);
});



test('Preview rejects a production analytics table and blocks command delegation before a request', () => {
  assert.throws(() => getDynamoDbConfiguration(preview({ MAMA_AI_ANALYTICS_TABLE_NAME: 'MAMA_AI_ANALYTICS_EVENTS' })), /not an approved isolated Preview or test resource/);

  const { mamaAiDynamoDb } = require('../lib/repositories/dynamodb-client.ts');
  const original = {
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
    AWS_REGION: process.env.AWS_REGION,
    MAMA_AI_DYNAMODB_TABLE_NAME: process.env.MAMA_AI_DYNAMODB_TABLE_NAME,
    MAMA_AI_ANALYTICS_TABLE_NAME: process.env.MAMA_AI_ANALYTICS_TABLE_NAME,
    MAMA_AI_AWS_IDENTITY_SCOPE: process.env.MAMA_AI_AWS_IDENTITY_SCOPE,
  };
  try {
    process.env.VERCEL_ENV = 'preview';
    delete process.env.MAMA_AI_DYNAMODB_TABLE_NAME;
    delete process.env.MAMA_AI_ANALYTICS_TABLE_NAME;
    delete process.env.AWS_REGION;
    delete process.env.MAMA_AI_AWS_IDENTITY_SCOPE;
    assert.throws(() => mamaAiDynamoDb.send({}), /isolated identity scope/);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('isolated Vercel production deployment remains fail-closed and rejects static credentials', () => {
  const isolated = { VERCEL_ENV: 'production', NODE_ENV: 'production', MAMA_AI_ISOLATED_PREVIEW: 'true', AWS_REGION: 'ap-south-1', AWS_ROLE_ARN: 'arn:aws:iam::624719611353:role/MAMAAI-Vercel-Preview-Role', MAMA_AI_AWS_IDENTITY_SCOPE: 'preview-isolated', MAMA_AI_DYNAMODB_TABLE_NAME: 'mamaai-preview-test', MAMA_AI_ANALYTICS_TABLE_NAME: 'mamaai-preview-test', MAMA_AI_DYNAMODB_GSI1_NAME: 'GSI1' };
  assert.equal(getDynamoDbConfiguration(isolated).runtime, 'isolated');
  assert.throws(() => getDynamoDbConfiguration({ ...isolated, MAMA_AI_DYNAMODB_TABLE_NAME: 'MAMA_AI_APP' }), /approved isolated Preview or test resource/);
  assert.throws(() => getDynamoDbConfiguration({ ...isolated, AWS_ACCESS_KEY_ID: 'forbidden', AWS_SECRET_ACCESS_KEY: 'forbidden' }), /Static AWS access keys/);
});

test('isolated runtimes select the Vercel OIDC provider and fail before DynamoDB client creation when it fails', () => {
  const { getDynamoCredentials } = require('../lib/repositories/dynamodb-client.ts');
  const configuration = getDynamoDbConfiguration({
    VERCEL_ENV: 'production', NODE_ENV: 'production', MAMA_AI_ISOLATED_PREVIEW: 'true', AWS_REGION: 'ap-south-1',
    AWS_ROLE_ARN: 'arn:aws:iam::624719611353:role/MAMAAI-Vercel-Preview-Role', MAMA_AI_AWS_IDENTITY_SCOPE: 'preview-isolated',
    MAMA_AI_DYNAMODB_TABLE_NAME: 'mamaai-preview-test', MAMA_AI_ANALYTICS_TABLE_NAME: 'mamaai-preview-test', MAMA_AI_DYNAMODB_GSI1_NAME: 'GSI1',
  });
  const expectedCredentials = async () => ({ accessKeyId: 'mock', secretAccessKey: 'mock' });
  let passedRoleArn;
  const received = getDynamoCredentials(configuration, ({ roleArn }) => { passedRoleArn = roleArn; return expectedCredentials; });
  assert.equal(passedRoleArn, configuration.roleArn);
  assert.equal(received, expectedCredentials);
  assert.throws(() => getDynamoCredentials(configuration, () => { throw new Error('OIDC unavailable'); }), /OIDC unavailable/);

  const production = getDynamoDbConfiguration({ NODE_ENV: 'production', AWS_REGION: 'ap-south-1' });
  assert.equal(getDynamoCredentials(production, () => { throw new Error('must not be called'); }), undefined);
});
