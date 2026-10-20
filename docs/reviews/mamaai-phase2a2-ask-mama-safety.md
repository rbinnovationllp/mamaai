# MAMAAI Phase 2A.2 — Secure Ask MAMA Meal Advice

**Date:** 2026-10-20  
**Scope:** Local P0 safety implementation and verification. No deployment, production data access/change, paid Gemini call, dependency install, commit, or push occurred.

## Files changed

- `lib/ai/ask-mama-response-safety.ts` — structured-response parsing, request classification, and deterministic decision gate.
- `app/api/ask-mama/route.ts` — JSON-only Gemini response contract, authorized saved-profile lookup, response validation, and safe fallback handling.
- `tests/safety-validation.test.cjs` — mocked Gemini-response regressions.
- `docs/reviews/mamaai-phase2a2-ask-mama-safety.md` — this record.

## Response classification and enforcement

Requests are classified as `general` or `specific_food_advice`. Meal, recipe, ingredient, substitution, allergy, fasting, infant, and multilingual Hindi/Kannada food requests require a structured `meal_recommendation` response. The required JSON includes a user-facing answer and one or more named meals with non-empty ingredient lists and optional preparation notes.

General product and non-food questions may return `general` JSON responses without a meal recommendation. A food-specific request cannot downgrade to a general response. Malformed JSON, an incomplete meal, absent authorized family context, blocked ingredients, and ambiguous composition all return a clarification instead of model text.

For signed-in users, the route retrieves the saved customer family profile and maps ages, food preferences, allergies, and medical restrictions to `FamilyMember` safety inputs. The response gate calls `evaluateIngredientSafety` across every recommended meal ingredient. `blocked` and `needs_clarification` never return an approved meal alternative.

The route also refuses policy-override and unsupported pet-feeding prompts before model use. If Gemini fails, the local fallback is available only for general conversation; food-specific requests never fall back to unvalidated text.

## Response paths audited

| Response type | Required handling |
|---|---|
| Specific meal, recipe, ingredient substitution, child or diet suggestion | Structured JSON plus deterministic validation |
| Allergy, Jain, fasting, infant, or medical dietary request | Structured validation; medical claims are not made; missing data requests clarification |
| General cooking/product education without a recommendation | Structured `general` response permitted |
| Prompt injection or policy override | Refused before model invocation |
| Malformed or unknown model output | Clarification response; raw model text withheld |
| No Gemini key | General knowledge-base answers only; food-specific prompts receive clarification |

## Verification

| Command | Result |
|---|---:|
| `npm test` | 19 passed, 0 failed, 0 skipped |
| `npm run test` | 19 passed, 0 failed, 0 skipped |
| `npm run lint` | passed |
| `npx tsc --noEmit --pretty false` | passed |

Tests use local mocked Gemini JSON and cover direct requests, hidden milk derivatives, Hindi and Kannada prompts, Jain restrictions, fasting (existing evaluator coverage), infant hazards, ambiguity, substitutions, prompt injection, malformed output, missing profiles, general conversation, and safe structured meals. No Gemini API request was made.

## Remaining limitations

- The taxonomy is not exhaustive and cannot prove allergen absence, cross-contact safety, safe preparation, or medical suitability.
- Child preparation/supervision and condition-specific care need qualified clinical advice.
- Saved family data must be accurate and complete. Unauthenticated users cannot receive specific meal recommendations through Ask MAMA.
- Staging HTTP tests with isolated accounts remain necessary before release.

## Rollback

Revert the four files listed above as one local batch. This has no database migration, configuration, or external service rollback.

## Beta readiness

**Conditionally ready for isolated staging verification, not production beta deployment yet.** The former Ask MAMA free-text bypass is closed locally. Complete controlled staging API tests with isolated accounts, validate Gemini JSON behavior and locale handling, and review safety rejection telemetry before enabling beta users.
