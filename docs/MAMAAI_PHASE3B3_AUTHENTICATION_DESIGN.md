# MAMAAI Phase 3B.3 authentication design

Existing: opaque random session token, server-side hash, 14-day expiry, HttpOnly/SameSite cookie, durable lookup, revocation endpoint, verified-user protected routes and family-profile session issuance.

Missing: registration UI, login, recovery, verified contact method, reauthentication and durable account identity lifecycle. Do not add a test bypass.

Recommendation: retain the opaque-session architecture. RBIL must select one identity proofing method: (1) password plus verified email, (2) OTP, (3) OAuth, or (4) invite-only pilot. Implement registration → verification → customer record → durable session; login → session; logout → revoke; recovery via selected verified channel; reauthentication before export/deletion; every family/profile/pantry/export operation derives owner from the verified session.

Email/OTP infrastructure is not available locally; no production-equivalent flow is claimed.
