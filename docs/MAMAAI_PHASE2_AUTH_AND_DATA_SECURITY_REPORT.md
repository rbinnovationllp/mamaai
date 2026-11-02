# MAMAAI Phase 2 Authentication and Data Security Report

Date: 23 October 2026

## Verified local behavior

- Protected customer routes use `requireUser(request)` and derive identity from a verified customer-session record or signed trusted header.
- Customer profile records use user-scoped keys: `USER#<userId>` with distinct profile/family sort keys.
- Session records store a token hash, expiry and revocation state; raw opaque tokens are not stored in DynamoDB.
- Export invokes `exportForVerifiedUser(user.userId)`, excluding session token material.
- Account deletion returns preflight-only status 409 and is not executable.

## Gaps and blockers

- Separate customer registration/login/recovery endpoints were not found; onboarding currently creates a customer session through family-profile flow. Registration, invalid credential, recovery and repeated-login live scenarios are blocked until an approved auth product flow exists.
- DynamoDB and two synthetic household identities are unavailable locally; cross-account persistence tests are prepared but not executed against a durable store.
- `FamilyService` permits an in-memory fallback outside production after DynamoDB errors. This supports local demo operation but must be disabled or proven unreachable in Preview for customer data.
- Legacy modules still reference default production-like table names. Preview is not ready until every path fails closed without the explicit isolated table.

## Prepared synthetic test matrix

| Scenario | Expected result | Status |
|---|---|---|
| Household A profile/save/read | Only A's records returned | Mock/local preparation |
| Household B reads A familyId | 403/404, no data leakage | Mock/local preparation |
| Missing/revoked/expired session | 401/503 fail closed | Unit tests executed |
| Concurrent A/B profile updates | No cross-owner overwrite | Blocked by isolated DynamoDB |
| A export request for B | Denied; A export only | Code-reviewed, live blocked |
| Unauthorized deletion | 401; authorized request remains preflight only | Unit/code-reviewed |

## Security conclusion

No live customer data or cloud data was accessed. Customer isolation is implemented in route/repository design but requires isolated DynamoDB execution evidence before release.
