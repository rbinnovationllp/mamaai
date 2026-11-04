# MAMAAI authentication final verification

Date: 31 October 2026 (Asia/Kolkata). Scope: local isolated working copy only. No deployment, commit, push, AWS/Vercel configuration, SES activation, payment action, or production data access occurred.

## Implemented changes

- Account Access accepts either a mobile number or an email address for sign-in.
- Registration requires a full name, password confirmation, and **at least one** of email or mobile; neither identifier is individually compulsory.
- Email-backed accounts use a server-side HMAC lookup key. Mobile remains optional for email accounts, and existing mobile-only records remain valid without migration or automatic account linking.
- Argon2id password hashes, opaque HttpOnly session cookies, durable rate limits, CSRF/origin checks, device binding, password-version session invalidation, logout revocation, and single-use recovery codes remain in place.
- `/login` redirects to `/account/access`.
- The Pet Meal Plan remains separate from human planning, authenticated, owner-scoped, and Family+-entitlement-protected.

## Local test evidence

| Check | Result |
| --- | --- |
| `npm test` | **114 passed, 0 failed, 0 skipped, 0 todo** |
| TypeScript | Completed without reported errors in the final local verification run. |
| ESLint | Completed without reported errors in the final local verification run. |
| Production build | Local build process was invoked; do not treat it as verified until its process completion/output is captured. |

Automated coverage verifies source-level Argon2id, optional mobile/email account handling, session/device checks, recovery-code one-time use, logout/session revocation, pet ownership/entitlement boundaries, family/pantry route ownership, export interface safety, payment fail-closed behavior, and Ask MAMA safety gates.

## Authentication scenario status

| Scenario | Status |
| --- | --- |
| Mobile-only registration/login | Implemented; automated/source coverage. Live DynamoDB/browser verification blocked. |
| Email-only registration/login | Implemented; automated/source coverage. Live DynamoDB/browser verification blocked. |
| Both identifiers | Implemented in the account record/registration route. Live verification blocked. |
| Existing mobile-only accounts | Preserved; no forced email migration or account merge. Live compatibility verification blocked. |
| Invalid credentials/duplicate identifiers | Rate-limited, generic sign-in failure; duplicate lookup protections in server code. Live verification blocked. |
| Same-device persistent session | Implemented with a 30-day durable session when selected; browser verification blocked. |
| New-device login | Existing device-transfer/risk control remains required; browser verification blocked. |
| Logout/session revocation | Implemented and source-tested. |
| Recovery-code reset | Existing single-use hashed recovery-code route remains implemented; live verification blocked. |

## Optional Amazon SES preparation

SES is deliberately **not activated**. The repository does not currently include an SES SDK client or a configured sender, so no mail, reset token, or credential is created or logged.

Before enabling email recovery, an owner must configure server-only isolated-project values for: AWS region, verified SES sender/domain, reset URL origin, and least-privilege role access. DNS/domain verification and SES production-sandbox status are owner/AWS-console operations and were not changed.

Required IAM scope is limited to sending transactional email from the approved identity (for example `ses:SendEmail` and `ses:SendRawEmail` constrained by approved sender identity), with no frontend credential exposure. Recovery implementation must add a random, hashed, single-use token stored under the owner account; expiry should be 15 minutes or less; request and redemption must be rate-limited; successful reset must increment password version and revoke existing sessions. Responses must not reveal whether an email exists. Templates must be reviewed in English, Hindi, and Kannada and must contain no secret or reset token in logs.

Mobile-only users must continue to use their registration-time recovery codes until a separately approved, secure SMS recovery design is evaluated. An unverified phone number, name, birth date, or profile data must never reset a password.

## External-service-dependent checks

- **BLOCKED:** SES send/recovery-link integration — no approved SES sender/domain, SDK dependency, or isolated IAM configuration.
- **BLOCKED:** authenticated browser/DynamoDB tests for family profiles, planner, pantry, subscriptions, pet records/plans, export, account deletion, and same/new-device session behavior.
- **BLOCKED:** live Ask MAMA provider response testing — paid AI remains disabled/unapproved.
- **BLOCKED:** Razorpay test-mode verification — payment activation is not authorized.

## Security concerns and recommendation

The current account model is conservative and avoids identity derivation, automatic merging, browser token storage, routine OTP prompts, and unverified-phone recovery. Email-reset delivery must not be enabled until its send path, reset-token persistence, templates, IAM policy, and audit behavior are independently reviewed.

**Release recommendation: NO-GO for public production.** A controlled isolated environment may proceed only after the build completion is captured, the SES design is implemented and tested with fictional accounts (if email recovery is desired), and authenticated synthetic browser/DynamoDB evidence is recorded. Legal approval remains required for deletion/retention, terms, and refunds.
