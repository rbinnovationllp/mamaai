# MAMAAI Phase 2B.1 — Secure Session Implementation

Date: 2026-10-20
Scope: local source changes and mocked verification only. No deployment, AWS call, database change, secret change, payment operation, Gemini call, commit, or push was performed.

## Implemented design

Customer browser sessions now use a random 32-byte opaque token (`mamaai_customer_session`). DynamoDB stores only its SHA-256 hash. A record uses `PK = SESSION#<tokenHash>` and `SK = SESSION#CURRENT`, with `entityType = customer_session` and a nested `record` containing `userId`, `tokenHash`, `createdAt`, `expiresAt`, `expiresAtEpoch`, optional `revokedAt`, and optional non-personal `deviceLabel` metadata. The top-level `expiresAt` is the DynamoDB TTL attribute.

The server lifetime is 14 days. The browser cookie is HttpOnly, `SameSite=Lax`, path `/`, uses `Secure` in production, and has matching Max-Age and Expires values. Verification checks opaque-token format, hashes the token, fetches its record, and rejects missing, expired, or revoked sessions. A DynamoDB failure becomes a controlled `503 SESSION_UNAVAILABLE`; there is no in-memory production fallback.

`POST /api/customer/logout` verifies the current durable session, revokes it in the repository, then clears the cookie. It returns an error instead of claiming success if durable revocation cannot complete.

The existing HMAC-signed internal header path remains a separately verified compatibility mechanism. It is not treated as a customer-cookie session and the removed demo-identity fallback is not accepted. Existing legacy signed `mamaai_customer_session` values fail the opaque format check, so they are not silently accepted.

## Files changed

- `lib/repositories/session-repository.ts` — DynamoDB-backed repository interface and implementation.
- `lib/server/customer-session.ts` — opaque token creation, hash, 14-day expiry, verification, and cookie helpers.
- `lib/server/auth.ts` — asynchronous durable customer-session verification; retained separately verified signed-header compatibility.
- `app/api/customer/family-profile/route.ts` — issues an opaque durable session after anonymous customer onboarding and awaits verified identity.
- `app/api/customer/logout/route.ts` — durable revocation and cookie clearing.
- Protected customer route callers now await `requireUser`, including Ask MAMA, family profile/session, attendance, pantry, meal plans, weekly planning, subscription status, feedback, and relevant protected Razorpay subscription routes.
- `tests/safety-validation.test.cjs` — mocked session lifecycle, cross-user isolation, store-outage, expiry, revocation, legacy-value, and cookie-path checks.
- `tests/security.test.cjs` — updated asynchronous authorization assertion.

## Required AWS setup before deployment

No AWS resource was created. The configured MAMAAI DynamoDB table must support the keys above and enable TTL using the top-level numeric `expiresAt` attribute. The execution role needs only `dynamodb:PutItem`, `dynamodb:GetItem`, and `dynamodb:UpdateItem` for that table (plus existing customer-data permissions). The application must use a non-production test table for preview verification.

Before activating this code, provision and validate TTL on the isolated table, grant least-privilege permissions, verify the table name environment configuration, and use two synthetic accounts only. DynamoDB TTL is asynchronous cleanup; verification always enforces `expiresAt`, so delayed TTL deletion does not extend access.

## Migration strategy

The new verifier accepts only 43-character base64url opaque tokens. Existing beta `mamaai_customer_session` values are rejected on first protected request and users must sign in/onboard again to receive an opaque session. This is the deliberately limited transition: no legacy compatibility window and no indefinite acceptance. Deployment communications should state that beta users may need to sign in again.

## Verification

- `npm test` — passed: 24 tests, 0 failed, 0 skipped.
- `npm run test` — passed: 24 tests, 0 failed, 0 skipped.
- `npm run lint` — passed with no diagnostics.
- `npx tsc --noEmit --pretty false` — passed with no diagnostics.

Mocked coverage verifies valid, missing, malformed/tampered, expired, revoked, concurrent customer sessions, cross-user separation, repository outage failure, logout source behavior, and cookie attributes. It does not prove live DynamoDB IAM, TTL, cookie behavior through a deployed HTTPS endpoint, or existing-account migration.

## Risks and rollback

The principal deployment risk is missing DynamoDB TTL/IAM configuration, which will make customer sessions fail closed with 503 rather than permit access. A second risk is deliberate legacy-session rejection causing beta users to sign in again. Validate in an isolated preview first.

Rollback is code-only: revert the listed source changes and remove the new logout route before deployment. Do not remove session records as a rollback mechanism; their TTL expiry handles cleanup. If deployed and a severe issue appears, route traffic back to the previous deployment, keep the durable session data until expiry, and investigate without widening authorization fallbacks.

## Remaining approvals

Owner approval is still required for: creating/configuring an isolated DynamoDB table and TTL, granting its IAM policy, setting non-production environment variables, deploying a protected preview, creating synthetic accounts, and running controlled preview tests. Production deployment and any production database or secret action remain unapproved.
