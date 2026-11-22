const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
Module._resolveFilename = function (request, parent, ...rest) { if (request.startsWith('@/')) request = path.join(root, request.slice(2)) + '.ts'; return resolve.call(this, request, parent, ...rest); };

const { DAILY_INGREDIENT_CATALOGUE, quickDailyMealRequestSchema, freeDailyFamilyId } = require('../lib/shared/daily-meal-planner.ts');
const { subscriptionLimits, subscriptionPlans } = require('../lib/services/subscription-service.ts');

test('daily planner accepts a reviewed free-plan questionnaire and rejects missing consent or ingredients', () => {
  const input = {
    ingredients: ['Potato / Aloo', 'Moong Dal', 'Wheat flour / Atta'],
    otherIngredients: ['leftover dal'], memberCount: 2,
    members: [{ name: 'Fictional Anaya', diet: 'vegetarian', allergies: ['peanuts'], restrictions: ['low salt'] }],
    householdDiet: 'vegetarian', meals: ['breakfast', 'lunch', 'dinner'], schoolTiffins: 0, officeTiffins: 1,
    cookingPreference: 'use_available', preferredLanguage: 'en', aiProcessingConsent: true,
  };
  const parsed = quickDailyMealRequestSchema.parse(input);
  assert.equal(parsed.members[0].allergies[0], 'peanuts');
  assert.equal(quickDailyMealRequestSchema.parse({ ...input, householdDiet: 'jain', members: [{ ...input.members[0], diet: 'jain', needsSeparateMeal: true }] }).members[0].needsSeparateMeal, true);
  assert.throws(() => quickDailyMealRequestSchema.parse({ ...input, aiProcessingConsent: false }));
  assert.throws(() => quickDailyMealRequestSchema.parse({ ...input, ingredients: [] }));
});

test('ingredient catalogue covers the required everyday kitchen groups', () => {
  const categories = new Set(DAILY_INGREDIENT_CATALOGUE.map((category) => category.id));
  for (const category of ['vegetables', 'pulses', 'grains', 'spices', 'dairy', 'salad', 'essentials', 'fruit_snacks', 'non_veg', 'leftovers']) assert.ok(categories.has(category));
  assert.equal(freeDailyFamilyId('fixture'), 'free_daily_fixture');
});

test('approved Indian large-family tier is uncapped while international prices remain unchanged', () => {
  assert.equal(subscriptionLimits.starter, 4);
  assert.equal(subscriptionLimits.premium, 6);
  assert.equal(subscriptionLimits.family_plus, Number.MAX_SAFE_INTEGER);
  const prices = Object.fromEntries(subscriptionPlans.map((plan) => [plan.plan, [plan.priceMonthlyInr, plan.priceMonthlyUsd]]));
  assert.deepEqual(prices.starter, [399, 4.99]);
  assert.deepEqual(prices.premium, [599, 7.99]);
  assert.deepEqual(prices.family_plus, [999, 12.99]);
});

test('free daily route is authenticated, server-enforced, idempotent, and only finalizes after generation', () => {
  const route = fs.readFileSync(path.join(root, 'app/api/daily-meal-plan/route.ts'), 'utf8');
  const repository = fs.readFileSync(path.join(root, 'lib/repositories/free-daily-experience-repository.ts'), 'utf8');
  assert.match(route, /await requireUser\(request\)/);
  assert.match(route, /requireSameOrigin\(request\)/);
  assert.match(route, /await repository\.finalize/);
  assert.match(route, /await repository\.abandon/);
  assert.match(route, /Clearly label a safe separate alternative for/);
  assert.match(repository, /TransactWriteCommand/);
  assert.match(repository, /FREE_DAILY_DEVICE_ALREADY_USED/);
  assert.match(repository, /status: "generated"/);
  assert.match(route, /getSubscribedLatest\(user\.userId\).*getForUser\(user\.userId\)/s);
  const nutrition = fs.readFileSync(path.join(root, 'lib/services/nutrition-context-service.ts'), 'utf8');
  assert.match(nutrition, /const hasKnownAge = Number\.isFinite\(member\.age\) && member\.age > 0/);
  assert.match(nutrition, /personalised nutrition and hydration estimates are not calculated/);
  const page = fs.readFileSync(path.join(root, 'app/today/page.tsx'), 'utf8');
  assert.match(page, /"jain", "satvik"/);
  assert.match(page, /Needs a separate meal or substitute/);
  assert.match(page, /Family-member guidance/);
});

test('paid checkout requires complete profile, ages, explicit history outcome, and a plan large enough for the household', () => {
  const route = fs.readFileSync(path.join(root, 'app/api/razorpay/subscriptions/route.ts'), 'utf8');
  assert.match(route, /MEMBER_AGE_REQUIRED/);
  assert.match(route, /MEAL_HISTORY_REQUIRED/);
  assert.match(route, /PLAN_TOO_SMALL/);
  assert.match(route, /memberCount >= 7 \? "family_plus"/);
});
