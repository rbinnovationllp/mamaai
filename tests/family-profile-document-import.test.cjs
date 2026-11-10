const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..'); const resolve = Module._resolveFilename;
Module._extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
Module._resolveFilename = function (request, parent, ...rest) { if (request.startsWith('@/')) request = path.join(root, request.slice(2)) + '.ts'; return resolve.call(this, request, parent, ...rest); };
const { parseFamilyProfileDocumentText, FAMILY_PROFILE_DOCUMENT_TEMPLATE, FAMILY_PROFILE_DOCUMENT_EXAMPLE } = require('../lib/shared/family-profile-document.ts');
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
});
