const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith('@/')) request = path.join(root, request.slice(2)) + '.ts';
  return resolve.call(this, request, parent, ...rest);
};

const {
  MAX_MEAL_HISTORY_UPLOAD_BYTES,
  MealHistoryUploadError,
  canonicalMealHistoryDay,
  parseMealHistoryUploadDataUrl,
  prefillMealHistoryReview,
  validateMealHistoryFile,
} = require('../lib/shared/meal-history-upload.ts');

const page = fs.readFileSync(path.join(root, 'app/profile/family/page.tsx'), 'utf8');
const route = fs.readFileSync(path.join(root, 'app/api/meal-history/extract/route.ts'), 'utf8');

test('manual entry, upload, and skip remain visible choices in the family profile', () => {
  assert.match(page, /Manual entry/);
  assert.match(page, /Upload photo \/ screenshot \/ file/);
  assert.match(page, /Skip for now/);
  assert.match(page, /<option value="photo">/);
  assert.doesNotMatch(page, /smartHistoryUploadEnabled/);
});

test('safe images, screenshots, and PDFs are accepted while unsafe or oversized files are rejected', () => {
  for (const type of ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']) {
    assert.doesNotThrow(() => validateMealHistoryFile({ type, size: 1024 }));
  }
  assert.throws(() => validateMealHistoryFile({ type: 'text/html', size: 1024 }), (error) => error instanceof MealHistoryUploadError && error.code === 'INVALID_MEAL_HISTORY_FILE');
  assert.throws(() => validateMealHistoryFile({ type: 'image/png', size: MAX_MEAL_HISTORY_UPLOAD_BYTES + 1 }), (error) => error instanceof MealHistoryUploadError && error.code === 'MEAL_HISTORY_FILE_TOO_LARGE');
  assert.equal(parseMealHistoryUploadDataUrl('data:application/pdf;base64,JVBERi0=').mimeType, 'application/pdf');
});

test('extracted meals prefill only recognised day and meal fields without inventing missing meals', () => {
  const prefilled = prefillMealHistoryReview([
    { day: 'Monday', breakfast: 'idli', dinner: 'dal rice', uncertain: ['lunch', 'snacks'] },
    { day: 'day_2', lunch: 'vegetable pulao' },
    { day: 'unrecognised', breakfast: 'must not be placed' },
  ]);
  assert.deepEqual(prefilled[0], { day: 'monday', breakfast: 'idli', lunch: '', snacks: '', dinner: 'dal rice' });
  assert.deepEqual(prefilled[1], { day: 'tuesday', breakfast: '', lunch: 'vegetable pulao', snacks: '', dinner: '' });
  assert.deepEqual(prefilled[2], { day: 'wednesday', breakfast: '', lunch: '', snacks: '', dinner: '' });
  assert.equal(canonicalMealHistoryDay('Friday'), 'friday');
  assert.equal(canonicalMealHistoryDay('not a day'), undefined);
});

test('the extracted draft is editable and needs explicit user approval before save', () => {
  assert.match(page, /setRecentMealHistory\(extracted\)/);
  assert.match(page, /mealHistoryHasExtractedDraft && !mealHistoryReviewApproved/);
  assert.match(page, /type="checkbox"/);
  assert.match(page, /setMealHistoryReviewApproved\(false\)/);
});

test('the server validates uploads, keeps extraction feature-gated, and returns safe failures', () => {
  assert.match(route, /requireSameOrigin\(request\)/);
  assert.match(route, /await requireUser\(request\)/);
  assert.doesNotMatch(route, /FAMILY_PROFILE_NOT_FOUND/);
  assert.match(route, /MAMAAI_SMART_HISTORY_UPLOAD_ENABLED/);
  assert.match(route, /GEMINI_API_KEY/);
  assert.match(route, /parseMealHistoryUploadDataUrl/);
  assert.match(route, /MEAL_HISTORY_AI_NOT_CONFIGURED/);
  assert.match(route, /aiProcessingConsent/);
  assert.match(route, /Unable to read that meal-history file/);
  assert.doesNotMatch(route, /console\.(log|info|error).*fileDataUrl/);
  assert.match(page, /data\.error\?\.code === 'FEATURE_DISABLED'/);
  assert.match(page, /data\.error\?\.code === 'MEAL_HISTORY_AI_NOT_CONFIGURED'/);
  assert.match(page, /mealHistoryAiProcessingConsent/);
});
