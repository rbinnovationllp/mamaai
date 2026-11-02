# MAMAAI Phase 2 Gemini Test Plan

Date: 23 October 2026

## Local safety posture

Ask MAMA classifies requests, applies durable per-IP/per-user rate limits, validates structured model responses, and fails closed for food-specific advice when Gemini is missing, malformed, times out or returns unsafe data. Preview has a server-side gate.

## Mocked test coverage

Existing local tests cover structured safe meals, allergens/derivatives, Hindi and Kannada handling, Jain/fasting rules, child hazards, ambiguous ingredients, prompt injection, provider failure behavior, missing profile context, malformed responses and general non-food fallback.

## Proposed real-provider run

- Model: the configured server-side Gemini model only; do not send an API key to a browser.
- Identities: synthetic Household A (milk allergy) and Household B (peanut allergy).
- Maximum: 10 requests, max 800 output tokens each, sequentially.
- Requests: safe vegetarian meal, milk derivative, peanut derivative, Kannada/Hindi prompt, Jain restriction, child ambiguity, malformed-response simulation remains mocked, rate-limit check, non-food question, prompt-injection attempt.
- Stop condition: any blocked/uncertain response displayed as approved, any identity leak, or estimated spend approaching the separately approved cap (previous planning target: INR 100).

No Gemini request or quota-consuming action was executed in this phase. Food-safety validation is not a medical certification.
