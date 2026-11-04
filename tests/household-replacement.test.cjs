const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('household replacement shares the established family-member contract', () => {
  const shared = read('lib/shared/family-member-schema.ts');
  const normal = read('app/api/customer/family-profile/route.ts');
  const replace = read('app/api/customer/household/replace/route.ts');
  assert.match(shared, /holidayOrLeaveDates/);
  assert.match(shared, /foodPreference/);
  assert.match(shared, /packingStorageLimitations/);
  assert.match(normal, /import \{ familyMemberSchema \} from "@\/lib\/shared\/family-member-schema"/);
  assert.match(replace, /import \{ familyMemberSchema \} from "@\/lib\/shared\/family-member-schema"/);
  assert.match(replace, /z\.array\(familyMemberSchema\)\.min\(1\)\.max\(10\)/);
});

test('replacement transaction is atomic and preserves snapshot, audit, and legacy version compatibility', () => {
  const repository = read('lib/repositories/customer-profile-repository.ts');
  assert.match(repository, /new TransactWriteCommand/);
  assert.match(repository, /FAMILY_PROFILE#CURRENT/);
  assert.match(repository, /FAMILY_PROFILE#HISTORY#/);
  assert.match(repository, /HOUSEHOLD_AUDIT#/);
  assert.match(repository, /HOUSEHOLD_REPLACEMENT/);
  assert.match(repository, /attribute_not_exists\(#record\.#replacementVersion\) OR #record\.#replacementVersion = :version/);
  assert.match(repository, /TransactionCanceledException/);
});

test('transaction cancellation reasons map only known cooldown and version conditions', () => {
  const repository = read('lib/repositories/customer-profile-repository.ts');
  assert.match(repository, /reasons\[3\]\?\.Code==="ConditionalCheckFailed"/);
  assert.match(repository, /HOUSEHOLD_REPLACEMENT_COOLDOWN_ACTIVE/);
  assert.match(repository, /reasons\[0\]\?\.Code==="ConditionalCheckFailed"/);
  assert.match(repository, /HOUSEHOLD_REPLACEMENT_CONFLICT/);
  assert.match(repository, /throw error/);
});

test('replacement API requires session, origin, password, explicit confirmation, limits, and unique members', () => {
  const route = read('app/api/customer/household/replace/route.ts');
  assert.match(route, /requireSameOrigin\(request\)/);
  assert.match(route, /requireUser\(request\)/);
  assert.match(route, /verifyCurrentPassword/);
  assert.match(route, /confirmation:z\.literal\(true\)/);
  assert.match(route, /reason:z\.string\(\)\.trim\(\)\.min\(5\)/);
  assert.match(route, /getLatestSubscriptionForUser/);
  assert.match(route, /sub\.memberLimit/);
  assert.match(route, /DUPLICATE_MEMBER_ID/);
});

test('replacement API has durable account/IP limits and safe typed failures', () => {
  const route = read('app/api/customer/household/replace/route.ts');
  assert.match(route, /scope:"household_replace_user"/);
  assert.match(route, /scope:"household_replace_ip"/);
  assert.match(route, /HOUSEHOLD_REPLACEMENT_RATE_LIMITED/);
  assert.match(route, /e instanceof HouseholdReplacementError/);
  assert.match(route, /status:409/);
  assert.doesNotMatch(route, /CancellationReasons/);
});

test('ordinary profile editing rejects membership-set changes', () => {
  const route = read('app/api/customer/family-profile/route.ts');
  assert.match(route, /HOUSEHOLD_MEMBERSHIP_CHANGE_REQUIRES_REPLACEMENT/);
  assert.match(route, /existingIds\.length !== requestedIds\.length/);
  assert.match(route, /existingIds\.some/);
});
