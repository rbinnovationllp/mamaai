const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { answerAskMama } = require('../lib/ask-mama/knowledge-base.ts');

test('Ask MAMA answers reviewed visitor account and privacy questions locally', () => {
  assert.equal(answerAskMama('How do I sign in?', true, 'en').category, 'account_access');
  assert.equal(answerAskMama('How do I reset my password?', true, 'en').category, 'password_recovery');
  assert.equal(answerAskMama('How is my data protected?', true, 'en').category, 'privacy');
  assert.equal(answerAskMama('How can I export my data?', true, 'en').category, 'data_export');
  assert.equal(answerAskMama('How do I delete my account?', true, 'en').category, 'account_deletion');
});

test('Ask MAMA offers safe product guidance for pets, support and policies', () => {
  const pet = answerAskMama('How does Pet Meal Plan work?', true, 'en');
  assert.equal(pet.category, 'pet_meal_plan');
  assert.match(pet.answer, /never treats leftovers or AI recipes as a complete diet/i);
  assert.equal(answerAskMama('The page is not working', true, 'en').category, 'troubleshooting');
  assert.equal(answerAskMama('Where are the refund policy and terms?', true, 'en').category, 'legal');
});

test('account, privacy and policy help are treated as general requests, not meal advice', () => {
  const classifier = fs.readFileSync(path.join(__dirname, '../lib/ai/ask-mama-response-safety.ts'), 'utf8');
  assert.match(classifier, /"privacy", "export", "delete account", "pet profile", "pet plan", "troubleshoot", "not working", "refund", "terms"/);
  const route = fs.readFileSync(path.join(__dirname, '../app/api/ask-mama/route.ts'), 'utf8');
  assert.match(route, /reviewed_local_mamaai_knowledge_base/);
});

test('personalized Ask MAMA uses the authorised profile and retains fasting safety data', () => {
  const route = fs.readFileSync(path.join(__dirname, '../app/api/ask-mama/route.ts'), 'utf8');
  assert.match(route, /authorizedProfile = await new CustomerProfileRepository\(\)\.getFamilyProfile\(authenticatedUser\.userId\)/);
  assert.match(route, /safetyMembers = safetyMembersFromProfile\(authorizedProfile\)/);
  assert.match(route, /grainsRestricted: fasting\?\.grainsRestricted === true/);
  assert.match(route, /regularDays: Array\.isArray\(fasting\?\.regularDays\)/);
});
