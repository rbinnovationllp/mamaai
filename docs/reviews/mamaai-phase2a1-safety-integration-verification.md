# MAMAAI Phase 2A.1 — Food Safety Integration Verification

**Date:** 2026-10-19  
**Scope:** Local verification and narrowly scoped fail-closed safety corrections only. No deployment, production-data activity, payment, authentication, schema, retention, commit, or push occurred.

## Paths examined

| Path | Finding |
|---|---|
| Daily generation (`MealPlanningService.generate`) | Generated plans are checked before acceptance, after fallback generation, after localization, and before save. Cached plans are checked before return. |
| Daily replacement (`MealPlanningService.replace`) | Replacement output is checked before localization, after localization, and before save. |
| Weekly generation (`WeeklyMealPlanningService.generateOrGet`) | Each generated slot is checked before localization and after localization before it contributes to the weekly grocery requirements or saved plan. |
| Weekly slot substitution (`WeeklyMealPlanningService.selectSlot`) | Corrected in this phase: the selected substitution is checked against the recovered family context before the weekly plan or derived grocery list is saved. |
| Grocery output | Daily grocery items derive from the validated `FamilyMealPlan`; weekly grocery requirements derive from validated selected slots. No independent meal generator writes a grocery list. |
| Localization | It maps ingredient labels but does not add ingredients. A second validation now follows localization for daily, replacement, and weekly outputs. |
| API routes | `/api/meal-plans`, `/api/meal-plans/[mealPlanId]/replace`, `/api/weekly-meal-plans`, and `/api/demo` delegate to the guarded services. The obsolete `replace-slot` endpoint returns HTTP 410. |
| Ask MAMA | Prompt-injection and pet-feeding requests are rejected before model invocation. Its free-form Gemini meal advice is **not** structured and therefore cannot be deterministically validated after generation. This remains a beta blocker for personalized meal recommendations. |
| `lib/geminiService.ts` | Contains independent experimental human/pet/global generators but has no call sites in the application. It is not a current product path; do not wire it into production without structured validation. |

## Confirmed enforcement

`blocked` and `needs_clarification` both produce `ok: false`. All guarded daily, replacement, weekly, localization, and substitution paths throw before returning an approved plan or writing it. The checks operate on synthetic `FamilyMember` data including allergy fields, dietary restrictions, fasting data, and age.

The taxonomy is token/phrase based. It recognized tested milk derivatives, peanut aliases, Hindi and Kannada terms, and does not falsely treat `coconut` as peanut. Unknown or ambiguous composition returns `needs_clarification` rather than approval.

## Files modified

- `lib/services/meal-planning-service.ts`
- `lib/services/weekly-meal-planning-service.ts`
- `tests/safety-validation.test.cjs`
- `docs/reviews/mamaai-phase2a1-safety-integration-verification.md`

## Verification results

| Command | Result |
|---|---:|
| `npm test` | 16 passed, 0 failed, 0 skipped |
| `npm run test` | 16 passed, 0 failed, 0 skipped |
| `npm run lint` | passed |
| `npx tsc --noEmit --pretty false` | passed |

The tests cover direct and derivative allergens, Hindi/Kannada aliases, false-positive resistance, vegetarian/egg restrictions, Jain and fasting restrictions, infant honey, child choking-hazard clarification, ambiguity, safe meals, prompt attacks, pet-request refusal, and static service-path enforcement assertions.

## Remaining safety limitations

- The taxonomy cannot prove an ingredient is allergen-free, determine cross-contact, or replace professional medical advice.
- Child safety cannot infer texture, cutting, cooking, portion size, or supervision.
- Persisted profiles must contain complete and accurate age/allergy data. The daily workflow passes persisted members to the validator; the weekly recovery mapping explicitly carries profile allergies and age.
- Ask MAMA’s generative meal recommendation text lacks a structured output contract and deterministic post-generation validation.
- Local tests use synthetic data and static service-path assertions; isolated staging tests are still needed for actual HTTP request-to-persistence behavior.

## Deployment readiness

**Not ready for beta deployment.** The core meal-plan, replacement, localization, and weekly-substitution paths are fail-closed locally, but personalized free-form Ask MAMA meal advice still bypasses structured validation. Before beta, constrain Ask MAMA meal recommendations to a structured ingredient-bearing response and validate it before responding, or limit Ask MAMA to general non-personalized food-planning guidance. Then run controlled staging tests with isolated accounts and representative family profiles.

## Rollback

Revert the three code/test files listed above together with the prior Phase 2A safety files if the entire batch must be withdrawn. No database migration, service configuration, or external rollback is required.
