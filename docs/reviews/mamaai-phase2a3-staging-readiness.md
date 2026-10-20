# MAMAAI Phase 2A.3 — Staging Readiness

**Date:** 2026-10-20. No deployment, cloud resource creation, environment-variable change, database access, or Gemini call was performed.**

## Environment findings

The repository is a Next.js application with a `.vercel` directory and Vercel Analytics dependency, so Vercel is the likely frontend/API host. Repository configuration contains DynamoDB and Gemini environment variable names, but no committed preview/staging URL, separate staging table, or dedicated test identity was found. Secrets were not read.

The architecture documents identify the in-memory store as MVP behavior and DynamoDB as the production target. Because the local environment has `.env` and `.env.local`, it must be treated as potentially production-connected until a separately named test table/project and Gemini test key are verified. It is not safe to call the live site for these tests.

## Safety architecture verified

`user -> session -> server-owned userId -> CustomerProfileRepository.getFamilyProfile(userId) -> Gemini JSON -> parser -> deterministic evaluator -> response`.

The request body profile is prompt context only; it is not used as the validator identity. A caller cannot select another user ID for the safety profile. Specific food advice requires structured JSON and a server-loaded profile. Invalid JSON, blocked/uncertain results, missing profiles, prompt overrides, and food-specific error fallbacks fail closed. General responses are allowed only through the explicit structured `general` branch.

## Local verification

Synthetic/mocked coverage includes safe meals, milk derivative conflicts, Hindi/Kannada requests, Jain restrictions, fasting and child safety (validator coverage), missing profiles, malformed JSON, prompt injection, legacy fallback prevention, and general conversation. Concurrent synthetic decisions are pure and request-scoped; no shared mutable safety state was found. Route-level HTTP/Dynamo/Gemini calls were not executed.

| Command | Result |
|---|---:|
| `npm test` | 20 passed, 0 failed, 0 skipped |
| `npm run test` | 20 passed, 0 failed, 0 skipped |
| `npm run lint` | passed |
| `npx tsc --noEmit --pretty false` | passed |

## Real Gemini plan (approval required)

Use a separate Gemini key with a daily cap, an isolated staging deployment, and two synthetic authenticated accounts with separate saved family profiles. Send at most 10 prompts: safe vegetarian meal; casein/milk allergy; Hindi peanut request; Kannada Jain garlic request; fasting grains; infant honey; malformed JSON simulation; policy override; no profile; general product question. Expected outcomes: one allowed structured meal, blocked/clarification for all safety cases, and structured general output for the last case.

Gemini 2.5 Flash token pricing/configuration must be confirmed in the selected account before any real call. At this scale the expected usage is small (roughly 10 requests × up to 800 output tokens plus prompt context), but no cost is asserted without the configured account price.

## Staging requirements and rollback

Use a Vercel preview/staging project with a distinct `NEXT_PUBLIC_APP_URL`, isolated DynamoDB table, non-production AWS credentials, a Gemini test key, and two synthetic accounts. Monitor only request IDs, outcome category, parser status, and safety status; do not log prompts, profiles, ingredients, or secrets. Rollback is reverting the Phase 2A.2/2A.3 source batch and redeploying the previous preview artifact. No database rollback is needed.

## Required approvals

1. Written approval for real Gemini requests and a spend cap.
2. An isolated Vercel preview/staging target and its non-secret URL.
3. Confirmation of a separate DynamoDB table and two synthetic test identities.
4. Approval to deploy to that preview target.

Without all four, production and public-beta testing must not proceed.

