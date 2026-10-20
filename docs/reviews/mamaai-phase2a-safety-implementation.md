# MAMAAI Phase 2A — Deterministic Food Safety Implementation

**Date:** 2026-10-19  
**Scope:** Local P0 implementation only. No deployment, production-data change, payment, pricing, subscription, retention, authentication, or UI change was made.

## Source files changed

- `lib/ai/food-safety-taxonomy.ts` — new versioned taxonomy (`2026-10-19`) and conservative normalization/matching helpers.
- `lib/ai/safety-validation-service.ts` — structured safety decision and deterministic meal-ingredient evaluation.
- `lib/services/meal-planning-service.ts` — final fail-closed validation gate after generation or fallback and before localization/save.
- `lib/ai/ask-mama-safety.ts` — new prompt-injection and unsupported pet-feeding request classifier.
- `app/api/ask-mama/route.ts` — rejects those requests before model invocation.
- `tests/safety-validation.test.cjs` — local regression coverage.

## Taxonomy design

The taxonomy uses canonical ingredients and exact normalized word/phrase matching. It normalizes Unicode, case, punctuation and whitespace, then recognizes English, Hindi and Kannada aliases for selected high-risk ingredients relevant to Indian households. It includes milk derivatives (casein, whey, paneer, ghee and curd), peanut/groundnut aliases, egg/anda, animal ingredients, Jain root ingredients, infant hazards, and pet toxins.

A taxonomy match identifies a known risk. Lack of a match does **not** certify safety. Empty or composition-ambiguous ingredient labels such as `mixed masala`, `spices`, or `unknown` return `needs_clarification`. Matching uses token/phrase boundaries, avoiding unsafe broad substring matching such as treating `coconut` as peanut.

## Safety enforcement

`SafetyValidationService` returns one of:

- `allowed` — no recognized conflict and no composition uncertainty.
- `blocked` — declared restriction, allergen/derivative, dietary, fasting, or age conflict.
- `needs_clarification` — ingredients or preparation details are incomplete or ambiguous.

For every generated daily plan, `MealPlanningService` now validates before accepting generation and validates again after any fallback generation. Any result other than `allowed` throws before the meal is localized or saved. Weekly planning already had a fail-closed gate; its existing behavior remains in place.

The Ask MAMA route rejects attempts to override safety policy or obtain unsupported pet-feeding advice before sending the request to a model. MAMAAI has pet-related product messaging, but this phase did not create a pet-feeding feature; pet advice is explicitly refused.

## Test results

| Command | Result |
|---|---:|
| `npm test` | 13 passed, 0 failed, 0 skipped |
| `npm run test` | 13 passed, 0 failed, 0 skipped |
| `npm run lint` | passed (no diagnostics) |
| `npx tsc --noEmit --pretty false` | passed (no diagnostics) |

New regression cases cover direct allergens, milk derivatives, Hindi aliases, false-positive resistance, vegetarian/egg conflict, Jain restrictions, fasting grain restrictions, infant honey, child choking-hazard clarification, unknown/ambiguous composition, a safe meal, final generation enforcement, prompt injection, and pet-feeding refusal.

## Remaining limitations

- The taxonomy is intentionally limited; it cannot establish absence of allergens, cross-contact, contamination, or preparation safety.
- A known-but-composition-incomplete ingredient must be clarified rather than considered safe.
- Child choking rules cannot assess cutting, cooking, texture, serving size, or supervision.
- Diabetes and other health-condition guidance is not medically certified; this batch only enforces configured ingredient restrictions.
- Component-level per-member serving alternatives should be modeled with a complete ingredient list before they can safely exempt an ingredient from a household-level conflict.
- Production acceptance needs isolated test identities and controlled integration tests; none were run here.

## Rollback

Revert the six source/test files listed above as one reviewable local batch. That restores the prior validator and removes the Ask MAMA request gate. No database migration or external rollback is required.

## Deployment risk

Fail-closed enforcement can reject plans that prior behavior saved, especially where the generator emits incomplete ingredient labels. This is intentional for P0 safety. Before deployment, run controlled staging generation tests with representative family profiles and review rejected-plan telemetry without storing raw sensitive diet or health data.
