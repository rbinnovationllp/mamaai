const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..'); const resolve = Module._resolveFilename;
Module._extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
Module._resolveFilename = function (request, parent, ...rest) { if (request.startsWith('@/')) request = path.join(root, request.slice(2)) + '.ts'; return resolve.call(this, request, parent, ...rest); };
const { parseFamilyProfileDocumentText, FAMILY_PROFILE_DOCUMENT_ACCEPT, FAMILY_PROFILE_DOCUMENT_TEMPLATE, FAMILY_PROFILE_DOCUMENT_EXAMPLE } = require('../lib/shared/family-profile-document.ts');
const { extractDocxText, DocxExtractionError } = require('../lib/server/docx-text-extraction.ts');
test('typed document preserves no-known-allergy separately from unanswered and reads partial history', () => {
  const draft = parseFamilyProfileDocumentText(FAMILY_PROFILE_DOCUMENT_EXAMPLE);
  assert.equal(draft.members[0].name, 'Asha'); assert.equal(draft.members[0].allergyStatus, 'no_known'); assert.deepEqual(draft.members[1].allergies, ['peanuts']);
  assert.deepEqual(draft.members[0].doctorAdvice, ['keep salt low']);
  assert.equal(draft.mealHistory[0].breakfast, 'idli'); assert.equal(draft.mealHistory[0].dinner, 'roti and dal');
  assert.match(FAMILY_PROFILE_DOCUMENT_TEMPLATE, /Number of people/); assert.match(FAMILY_PROFILE_DOCUMENT_TEMPLATE, /Doctor or dietitian advice/);
});
test('import UI is review-first, accepts multiple files, and blocks unresolved allergy data', () => {
  const component = fs.readFileSync(path.join(root, 'components/FamilyProfileDocumentImport.tsx'), 'utf8');
  const route = fs.readFileSync(path.join(root, 'app/api/family-profile/import/route.ts'), 'utf8');
  assert.match(component, /multiple/); assert.match(component, /Nothing has been saved yet/); assert.match(component, /allergyStatus === "unanswered"/);
  assert.match(route, /requireSameOrigin\(request\)/); assert.match(route, /await requireUser\(request\)/); assert.match(route, /Original text is not saved/);
  assert.match(FAMILY_PROFILE_DOCUMENT_ACCEPT, /\.docx/); assert.match(route, /extractDocxText/);
  assert.match(route, /aiProcessingConsent: z\.boolean\(\)\.optional\(\)/);
});
test('DOCX table-style values map to member card and editable meal preference fields', () => {
  const draft = parseFamilyProfileDocumentText('Breakfast: Poha\nLunch: Dal rice\nSnacks: Roasted chana\nDinner: Roti bhindi\nMember name: Test Member A\nRelation: Self\nAge: 30\nMember food preference: Leave Vegetarian');
  assert.deepEqual(draft.household.mealPreferences, { breakfast: 'Poha', lunch: 'Dal rice', snacks: 'Roasted chana', dinner: 'Roti bhindi' });
  assert.equal(draft.members[0].name, 'Test Member A'); assert.equal(draft.members[0].relation, 'Self'); assert.equal(draft.members[0].age, 30); assert.equal(draft.members[0].dietType, 'vegetarian');
});
test('food habits, specialist advice, allergy status, and partial seven-day history remain explicit', () => {
  const draft = parseFamilyProfileDocumentText('Person 1: Fictional Asha\nFood likes: dosa, rajma\nFoods disliked or avoided: bitter gourd\nAllergies: peanuts\nDoctor advice: keep salt low\nMonday\nBreakfast: idli\nLunch: sambar rice\nDinner: roti dal');
  assert.deepEqual(draft.members[0].favouriteFoods, ['dosa', 'rajma']); assert.deepEqual(draft.members[0].dislikes, ['bitter gourd']);
  assert.deepEqual(draft.members[0].allergies, ['peanuts']); assert.equal(draft.members[0].allergyStatus, 'provided'); assert.deepEqual(draft.members[0].doctorAdvice, ['keep salt low']);
  assert.deepEqual(draft.mealHistory[0], { day: 'monday', breakfast: 'idli', lunch: 'sambar rice', dinner: 'roti dal', uncertain: [] });
});
test('an unreadable DOCX is rejected before it can produce a profile draft', () => {
  assert.throws(() => extractDocxText(Buffer.from('not a DOCX archive')), DocxExtractionError);
});
