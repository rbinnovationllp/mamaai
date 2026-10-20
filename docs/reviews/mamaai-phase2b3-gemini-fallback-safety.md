# MAMAAI Phase 2B.3 — Gemini Fallback Safety and Preview Gate

Date: 2026-10-20. Local implementation and verification only. No deployment, AWS change, Gemini API call, payment operation, production-data access, credential rotation, commit, or push occurred.

## Files modified

- `app/api/ask-mama/route.ts`
- `lib/ai/ask-mama-response-safety.ts`
- `lib/ai/ask-mama-runtime-safety.ts` (new)
- `tests/safety-validation.test.cjs`

## Implemented behavior

Ask MAMA now classifies a request as food-specific unless it positively matches a known MAMAAI product/general-information topic. This conservative default prevents a food recommendation disguised as a vague general question from reaching a free-text fallback.

For a food-specific request, a missing Gemini key returns `503 ASK_MAMA_FOOD_ADVICE_UNAVAILABLE` with a safe clarification message. It never returns the legacy local knowledge-base answer as a meal, recipe, ingredient, substitution, or child-feeding recommendation. Gemini exceptions, invalid credentials, timeouts, empty output, malformed JSON, incomplete structured data, and unexpected response structures either reach the existing structured validator or return the same controlled unavailable response. Internal exception messages are not returned to the caller.

Gemini results still must parse as a structured response and pass `validateAskMamaModelResponse`. Specific meal results require a complete ingredient list, an authorized saved family profile, and deterministic validation. Blocked and uncertain results return a safety clarification rather than a recommendation. Prompt-injection and unsupported pet-feeding requests remain rejected before model invocation.

For positively classified general MAMAAI product information, the existing local knowledge-base answer may remain available during a Gemini outage. This preserves non-food conversation without representing it as individualized food advice.

## Preview safety gate

`isAskMamaPreviewBlocked()` blocks the API server-side when `VERCEL_ENV=preview` unless `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=true` is explicitly set in the Preview environment. The gate runs before session, customer-profile, DynamoDB-context, or Gemini work. It returns `503 ASK_MAMA_PREVIEW_DISABLED` and does not depend on a hidden frontend control.

Production is unaffected because the gate applies only when Vercel declares the environment as `preview`. Preview enabling is intentionally explicit and must not be set until the conditions below are satisfied.

## Regression tests and results

Added coverage for:

- missing Gemini-key food fallback;
- invalid-key, timeout, empty, malformed, and unexpected model-response fail-closed paths through route/validator behavior;
- prompt injection;
- ambiguous food prompts classified as food-specific;
- no authorized family context;
- Preview gate enabled and disabled states;
- no internal exception detail in API responses.

Results:

- `npm test` — passed: 26 tests, 0 failed, 0 skipped.
- `npm run test` — passed: 26 tests, 0 failed, 0 skipped.
- `npm run lint` — passed with no diagnostics.
- `npx tsc --noEmit --pretty false` — passed with no diagnostics.

## Conditions before enabling Ask MAMA in Preview

1. Vercel Preview must be deployment-protected and use the isolated DynamoDB table and least-privilege role from Phase 2B.2.
2. All legacy `DYNAMODB_*_TABLE` variables must point to denied preview-only sentinels, never production defaults.
3. Payments, email/OTP, webhooks, and unrelated production integrations must remain unset or disabled.
4. Use only the approved synthetic family profiles and separate browser contexts.
5. Keep `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED` unset until the owner approves controlled testing.
6. Before real model tests, use a distinct Gemini key with the approved request and ₹100 limits; execute only the approved synthetic prompt set.

## Remaining risks

The taxonomy is intentionally conservative but not exhaustive. A validated model response is not medical certification. Local tests mock provider failures; live provider transport, Vercel environment scoping, and DynamoDB IAM require isolated Preview verification. General product-information classification is keyword based, so ambiguous prompts deliberately receive the more restrictive food-specific treatment.
