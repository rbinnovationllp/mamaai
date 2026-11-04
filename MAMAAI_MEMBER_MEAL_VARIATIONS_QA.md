# Per-member meal variations and grocery QA

## Local implementation review — 2 November 2026

### Existing compatible model

No destructive migration was needed. `CommonMeal.components` already represents a shared base and member-specific vegetarian, eggetarian, non-vegetarian and vegan options through assigned member IDs. `componentMealRequirements` scales each component by the assigned members' adult-equivalent portions and excludes absent/fasting members; weekly grocery aggregation then consolidates compatible units and applies pantry stock. Shared component ingredients are therefore calculated once, not once per recipient.

### Safety correction

The final safety validator was corrected to evaluate a common/optional component only against its assigned members. This permits a separately prepared egg or non-vegetarian option while still blocking it for an assigned vegetarian, Jain, allergy-restricted, or explicitly excluded member. An unassigned component is blocked. This preserves the second pre-persistence safety gate.

### Quantity limitation

The quantity service scales existing ingredient lines; it does not create quantities. Regional catalogue entries with unreviewed aggregate ingredients remain unsuitable for strict restrictions. The generic `recipeForMeal` serving count is an existing planning baseline rather than verified recipe-yield evidence, so it must not be represented as validated catalogue yield coverage.

### Verification

- `npm test`: **121 passed, 0 failed, 0 skipped**.
- TypeScript: fixed `e2e/local-customer-journey.spec.ts:10-12` and `e2e/local-product-flows.spec.ts:9` by replacing the cross-context `RequestInit` parameter with the serializable `{ method, headers, body }` browser request shape. Full `npx tsc --noEmit` completed with **exit code 0**.
- Browser QA, Dynoxide persistence QA, ESLint completion, and a terminating production build were not run in this pass.

### Release recommendation

**NO-GO.** Before release, repair the pre-existing E2E TypeScript helper incompatibility, add direct per-member-component selection regression coverage, run the isolated authenticated browser journey, and resolve the separate bounded production-build page-data blocker.
