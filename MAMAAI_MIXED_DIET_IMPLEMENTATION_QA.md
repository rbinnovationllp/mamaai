# Mixed-diet implementation QA

## Local implementation

`familyMemberSchema` now accepts optional, backward-compatible `dietaryPermissions`, `weekdayDietRules` and customer-confirmed `festivalDietRules`; it adds `jain` and `pescatarian` labels without changing existing saved labels. `lib/food/dietary-permissions.ts` provides a deterministic exclusion baseline: explicit false permissions add exclusions and diet presets never remove explicit exclusions.

## Scope limitation

This change establishes validated data and deterministic policy primitives only. The current food catalogue and weekly engine have not yet been extended with recipe-level egg/fish/shellfish/poultry/red-meat/onion/garlic/root-vegetable metadata or individual variation generation. Therefore mixed-diet weekly plan and consolidated grocery QA are **not passed**. Applying rules to candidate selection requires a separately reviewed catalogue migration and engine integration.

## Safety and migration

- Existing profiles omit the new optional fields and remain valid.
- Festival rules require `confirmedByCustomer: true`; no calendar service or inferred festival restriction was added.
- No production migration, database write, AI provider, AWS, email, payment or external call occurred.

## Verification

Added regression source checks for schema compatibility and deterministic permission handling. Full regression, TypeScript, lint, browser QA and build verification remain required after the next engine/catalogue integration phase.

## Release recommendation

**NO-GO.** The data contract is safely prepared, but customer-visible mixed-diet planning is not complete.

## Incremental enforcement update — 2 November 2026

The authenticated family-profile route now persists `dietaryPermissions`, weekday rules and customer-confirmed festival rules. The recovered weekly-planning context propagates those fields into `FamilyMember`, and the deterministic safety gate blocks known denied egg, fish, seafood, poultry, meat, onion, garlic and root-vegetable ingredients before a plan can be saved.

This is a fail-closed safety improvement, not completion of the requested catalogue integration: the regional candidate selector still has no per-recipe, reviewed ingredient classification and therefore cannot reliably select a Jain/allergen-safe alternative or construct member-specific variations. Many catalogue records contain aggregate ingredient labels such as `mixed vegetables`, `seasonal sabzi`, or a spice base; they must be expanded and reviewed before being eligible for strict restrictions.

The candidate selector now applies the conservative audit before ranking. Strict member profiles exclude records with aggregate/unreviewed ingredient composition and reject records with known conflicts. This improves safe refusal, but does not make the aggregate recipes reviewed or add individual variations.

Verification: `npm test` completed with **121 passed, 0 failed, 0 skipped**. No local database/browser run, external call, or build was performed in this incremental pass.
