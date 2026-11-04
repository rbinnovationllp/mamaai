const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');

const root = path.resolve(__dirname, '..');
Module._extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
};

const { smartTiffinDraftSpecifications, scaleDraftRecipe } = require('../lib/services/smart-tiffin-draft-specifications.ts');

test('all six draft specifications have complete positive metric-or-count ingredients', () => {
  assert.equal(smartTiffinDraftSpecifications.length, 6);
  for (const spec of smartTiffinDraftSpecifications) {
    assert.equal(spec.status, 'DRAFT — AWAITING RBIL REVIEW');
    assert.ok(spec.servings > 0);
    assert.ok(spec.ingredients.length > 0, `${spec.recipeId} is missing ingredients`);
    for (const ingredient of spec.ingredients) {
      assert.ok(ingredient.name.trim());
      assert.ok(ingredient.quantity > 0);
      assert.ok(['g', 'ml', 'piece', 'slice', 'tsp'].includes(ingredient.unit));
    }
  }
});

test('serving scaling preserves identities and scales every approved draft quantity', () => {
  const source = smartTiffinDraftSpecifications[0];
  const scaled = scaleDraftRecipe(source, 4);
  assert.equal(scaled.recipeId, source.recipeId);
  assert.equal(scaled.servings, 4);
  assert.deepEqual(scaled.ingredients.map((item) => item.quantity), source.ingredients.map((item) => item.quantity * 2));
  assert.throws(() => scaleDraftRecipe(source, 0), /servings must be positive/);
});

test('timing claims disclose advance preparation and recipes exceeding ten minutes', () => {
  for (const spec of smartTiffinDraftSpecifications) {
    const total = spec.prepMinutes + spec.cookMinutes;
    if (spec.timing === 'within_10_with_preprepared') assert.ok(spec.preprepared.length > 0, `${spec.recipeId} must disclose advance work`);
    if (spec.timing === 'more_than_10') assert.ok(total > 10, `${spec.recipeId} must not overstate a ten-minute claim`);
  }
});

test('drafts retain allergy and packing constraints rather than authorising selection', () => {
  for (const spec of smartTiffinDraftSpecifications) {
    assert.ok(spec.packing.trim());
    assert.ok(spec.source.trim());
    assert.ok(spec.uncertainties.length > 0);
  }
  const catalogueSource = fs.readFileSync(path.join(root, 'lib/services/smart-tiffin-service.ts'), 'utf8');
  assert.match(catalogueSource, /status:\s*"INCOMPLETE"/);
});
