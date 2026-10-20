# Phase 1 authentication audit

## Confirmed implementation

- Customer identity can use HMAC-signed headers or a signed `mamaai_customer_session` cookie.
- Admin routes use `proxy.ts` and `ADMIN_SECRET_KEY` cookie/bearer equality checks.
- Existing tests confirm no hard-coded auth-secret fallback and that selected routes call `requireUser`.

## Gaps and status

| Area | Status | Finding |
|---|---|---|
| Login/signup | PARTIALLY IMPLEMENTED | Customer session route exists; full lifecycle not executed. |
| Expiry/logout/invalidation/recovery | NOT VERIFIED | No dedicated tests or verified routes found. |
| Customer isolation | NOT VERIFIED | Repository keying uses user/family IDs, but two-account tests were not found. |
| Unauthorized API access | PARTIALLY IMPLEMENTED | Seven static tests cover selected guards only. |
| Admin auth | PARTIALLY IMPLEMENTED | Shared secret works but needs production role/session audit. |

## Required isolated tests

Use two staging identities. Verify every family, pantry, meal-plan, grocery, profile and subscription endpoint rejects other-user IDs and unauthenticated calls. Verify expiry, logout and recovery without real customer data.
