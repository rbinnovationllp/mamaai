# MAMAAI Phase 2A.5 — Session Integration

**Date:** 2026-10-20. Local verification only; no deployment, cloud access, Gemini call, account creation, payment/OTP action, production-data access, commit, or push occurred.**

## Confirmed session architecture

| Mechanism | Issuance | Verification | Consumers |
|---|---|---|---|
| `mamaai_session` | No active issuer was found in this repository; `signToken` exists in `lib/auth/session.ts`. | HMAC token verified by `getSession()`. | Previously Ask MAMA and entitlement-oriented routes. |
| `mamaai_customer_session` | `POST /api/customer/family-profile` creates it after saving a profile. | HMAC verified by `requireUser(request)`. | Customer profile, pantry, weekly plan, subscription, payment and other customer APIs. |

The mechanisms are not interchangeable. The customer profile workflow only issues `mamaai_customer_session`, so Ask MAMA’s previous `getSession()`-only profile lookup did not reliably identify the customer profile.

## Correction applied

`app/api/ask-mama/route.ts` now calls `requireUser(request)` and uses the verified `authenticatedUser.userId` for all profile, user, and pantry lookups. The client-provided profile context remains prompt context only and cannot substitute the server-selected profile. Missing/invalid sessions leave the safety-member list empty, so food-specific advice returns clarification rather than using an unverified profile. General structured conversation remains available.

No cookie format, issuance behavior, or authentication architecture was changed.

## Session lifecycle finding

`mamaai_customer_session` has a 180-day cookie `maxAge` but its signed payload contains no expiry; there is no logout route or cookie-clear flow found. It becomes invalid only when missing, malformed, or signed with a different secret. Implementing absolute expiry, revocation, or logout needs session-format/issuance changes and therefore requires separate approval.

## Local verification

| Command | Result |
|---|---:|
| `npm test` | 21 passed, 0 failed, 0 skipped |
| `npm run test` | 21 passed, 0 failed, 0 skipped |
| `npm run lint` | passed |
| `npx tsc --noEmit --pretty false` | passed |

Added regression coverage verifies that Ask MAMA uses `requireUser`, uses the verified identity for `getFamilyProfile`, retains the structured safety gate, and has no legacy free-text food fallback. Existing synthetic validator tests cover Family A/B-style allergy isolation, missing context, malformed responses, and cross-context resistance. Route-level DynamoDB tests remain pending because no injectable repository/test environment exists locally.

## Vercel preview readiness

`.vercel/repo.json` confirms the local repository is linked to a Vercel project named `mamaai`; its project/team identifiers are intentionally omitted here. Preview deployment capability and protection settings must be checked in the Vercel dashboard. Preview variables must use isolated DynamoDB/Gemini credentials and blank/disabled payment, webhook, email, and OTP integrations. Vercel previews can be removed from the deployment dashboard; rollback is redeploying the previous preview artifact or removing the preview.

## Remaining risks and approvals

- Separate approval is needed to add expiration/logout/revocation to customer sessions.
- Preview testing requires two synthetic profiles in an isolated DynamoDB table, a distinct Gemini test key/budget, and a preview-specific `AUTH_SECRET`.
- Before cloud testing, verify Vercel preview access controls and ensure no production variable is inherited.
- No public-beta deployment is ready or authorized.

## Files modified

- `app/api/ask-mama/route.ts`
- `tests/safety-validation.test.cjs`
- `docs/reviews/mamaai-phase2a5-session-integration.md`
