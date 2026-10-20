# MAMAAI Phase 2B — Secure Customer Session Lifecycle Design

**Date:** 2026-10-20. Design and local baseline only. No implementation, deployment, database change, AWS resource creation, credential rotation, Gemini call, payment change, commit, or push occurred.**

## Current architecture

`mamaai_customer_session` is issued after family-profile save. It contains `{ userId, signature }`, where the signature is an HMAC of the user ID. `requireUser()` accepts that cookie (or a signed header) synchronously. The cookie is `HttpOnly`, `SameSite=Lax`, `Secure` in production, path `/`, and has a browser `maxAge` of 180 days.

There is no issue time, expiry claim, session ID, server-side session record, revocation state, logout route, session enumeration, or replay prevention after cookie theft. Cookie expiry alone is not server-enforced. Protected APIs that use `requireUser()` include customer profile/session, pantry, weekly plans, subscriptions, payments, replacements, feedback, attendance, and Ask MAMA. Ask MAMA now shares the verified customer identity path for family-profile lookup.

## Required durable design

Use the existing configured MAMAAI DynamoDB table only after approval, with new session items:

- `PK = SESSION#{sha256(sessionId)}`, `SK = SESSION#CURRENT`
- record: `userId`, `sessionIdHash`, `issuedAt`, `expiresAt`, `revokedAt?`, `deviceLabel?`, `lastSeenAt?`, and a DynamoDB TTL epoch attribute.
- cookie: opaque 256-bit random `sessionId`; never store the raw token.
- validation: hash cookie ID, `GetItem`, require not revoked and `expiresAt > now`; update `lastSeenAt` only under controlled policy.
- logout: mark the record revoked then clear the cookie using the same security attributes.
- all devices: one independent record per issued session; revoke one or all sessions by user-key lookup/index.

This requires an asynchronous `requireUser()` (or a new async equivalent) and coordinated changes to every protected route. It also requires a durable session-store item model, DynamoDB TTL enablement, IAM permissions, migration policy, and local mocked repository tests.

## Migration

Do not accept legacy `{userId, signature}` cookies indefinitely. On first verified legacy use during a short, configurable beta grace window, issue an opaque durable session, replace the cookie, and record the migration. After the window, reject legacy cookies. This changes issuance and cookie format; do not deploy it without a rollback window and user communication plan. Do not rotate `AUTH_SECRET` as part of this migration.

## Required tests after approval

Valid/expired/tampered/revoked sessions; logout; cross-account profile access; Ask MAMA identity; cookie attributes; simultaneous devices; legacy migration; database outage fail-closed behavior; and revoked-token replay.

## Local baseline

| Command | Result |
|---|---:|
| `npm test` | 21 passed, 0 failed, 0 skipped |
| `npm run test` | 21 passed, 0 failed, 0 skipped |
| `npm run lint` | passed |
| `npx tsc --noEmit --pretty false` | passed |

## Rollback and approvals

Rollback after a future deployment must keep the legacy verifier available only during the documented migration window, revoke newly issued opaque sessions if needed, clear cookies, and redeploy the prior artifact. No rollback action is required now.

Before implementation, approve: (1) DynamoDB session-item/TTL data model and least-privilege IAM changes, (2) async authorization refactor across protected APIs, (3) cookie/token format change and legacy grace period, (4) logout endpoint and session revocation behavior, and (5) isolated preview test resources.
