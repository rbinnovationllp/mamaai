const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
const load = Module._load;
let query;
Module._resolveFilename = function(name, parent, ...args) {
  if (name.startsWith('@/')) name = path.join(root, name.slice(2)) + '.ts';
  if (name.startsWith('.') && parent?.filename.endsWith('.ts')) {
    const candidate = path.resolve(path.dirname(parent.filename), name + '.ts');
    if (fs.existsSync(candidate)) name = candidate;
  }
  return resolve.call(this, name, parent, ...args);
};
Module._extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
Module._load = function(name, parent, ...args) {
  if (name === './dynamodb-client') return { getMamaAiTableName: () => 'fictional', mamaAiDynamoDb: { send: command => query(command.input) } };
  return load.call(this, name, parent, ...args);
};
const { hasCurrentEntitlement, needsPaymentReconciliation } = require('../lib/services/paid-entitlement.ts');
const { SubscriptionService } = require('../lib/services/subscription-service.ts');
const { SubscriptionRepository } = require('../lib/repositories/subscription-repository.ts');
const paid = { userId:'original', plan:'premium', memberLimit:6, status:'active', paymentStatus:'paid', paymentChannel:'razorpay', startsAt:'2026-11-01', expiresAt:'2099-12-01', updatedAt:'2026-11-01' };

test('₹599 monthly Premium covers five family members including a child', () => {
  const service = new SubscriptionService();
  assert.equal(service.getPlan('family_premium').priceMonthlyInr, 599);
  assert.equal(service.getPlan('premium').memberLimit, 6);
  assert.doesNotThrow(() => service.assertMemberLimit('premium', [{age:3.5},{age:25},{age:26},{age:50},{age:51}].length));
});
test('current paid period is required, and cancellation, expiry and failed payments deny access', () => {
  assert.equal(hasCurrentEntitlement(paid), true);
  for (const overrides of [{expiresAt:'2000-01-01'},{status:'cancelled'},{status:'expired'},{paymentStatus:'failed'},{paymentStatus:'pending'},{status:'trialing'},{startsAt:'2099-01-01'}]) {
    assert.equal(hasCurrentEntitlement({...paid,...overrides}), false);
  }
  assert.equal(needsPaymentReconciliation({...paid, expiresAt:undefined}), true);
  assert.equal(needsPaymentReconciliation({...paid, status:'past_due', paymentStatus:'pending',providerStatus:'created'}), true);
});
test('paged account lookup prefers a valid paid record over a newer pending record and ignores another owner', async () => {
  query = input => {
    assert.equal(input.ConsistentRead,true);
    assert.equal(input.ExpressionAttributeValues[':pk'],'USER#original');
    return input.ExclusiveStartKey ? {Items:[{record:paid}]} : {LastEvaluatedKey:{PK:'next'},Items:[{record:{...paid,userId:'different',updatedAt:'2026-11-03'}},{record:{...paid,paymentStatus:'pending',updatedAt:'2026-11-04'}}]};
  };
  assert.equal(await new SubscriptionRepository().getLatestSubscriptionForUser('original'),paid);
});
test('a duplicate webhook is conditioned in the same transaction as payment and entitlement', async () => {
  query = input => {
    assert.equal(input.TransactItems[0].Put.Item.SK,'razorpay:atomic:fictional-event');
    assert.equal(input.TransactItems[0].Put.ConditionExpression,'attribute_not_exists(PK)');
    assert.equal(input.TransactItems[2].Put.Item.SK,'PAYMENT#RAZORPAY#fictional-payment');
    assert.equal(input.TransactItems[3].Put.Item.PK,'USER#original');
  };
  await new SubscriptionRepository().saveSubscriptionAndPayment({subscription:paid,payment:{userId:'original',providerPaymentId:'fictional-payment',paymentStatus:'paid',createdAt:'2026-11-04'},webhookKey:'fictional-event',expectedUpdatedAt:paid.updatedAt});
});
const { RazorpayService } = require('../lib/services/razorpay-service.ts');
test('captured charge arriving after checkout creates the paid period on the original customer', async () => {
  let saved;
  query = input => {
    if (input.Key) {
      assert.equal(input.Key.PK, 'USER#original');
      return {Item:{record:{...paid,status:'past_due',paymentStatus:'pending',lastProviderEventAt:'2026-11-04T00:01:00Z'}}};
    }
    saved = input.TransactItems[1].Put.Item.record;
  };
  await new RazorpayService().upsertSubscriptionFromProvider({
    userId:'original', razorpaySubscriptionId:'sub_fictional', razorpayPaymentId:'pay_fictional',
    eventType:'subscription.charged', providerStatus:'active', startsAt:'2026-11-01', renewsAt:'2099-12-01',
    eventAt:'2026-11-04T00:00:00Z', webhookKey:'delayed-fictional'
  });
  assert.equal(saved.userId,'original');
  assert.equal(saved.plan,'premium');
  assert.equal(saved.expiresAt,'2099-12-01');
  assert.equal(hasCurrentEntitlement(saved),true);
});
