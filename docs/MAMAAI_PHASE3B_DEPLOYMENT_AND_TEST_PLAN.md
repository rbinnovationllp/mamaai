# MAMAAI Phase 3B — Deployment and Test Plan

Date: 23 October 2026

## Preconditions

- RBIL approves the items in `MAMAAI_PHASE3_APPROVAL_CHECKLIST.md`.
- The Preview-isolation P0 code work is complete and locally verified.
- A current read-only AWS inspection confirms the isolated table, TTL, region, indexes, and least-privilege policy.
- A separate protected Vercel project exists. The live `mamaai` project is not used.

## Sequential execution plan

| Step | Action | Safety condition | Evidence to retain |
|---:|---|---|---|
| 1 | Create/review isolated Vercel project | No production environment values are copied | Project ID, protection setting, variable-name/scope checklist |
| 2 | Verify or provision isolated DynamoDB schema | Dedicated table only; no production ARN permissions | Table metadata, GSI metadata, IAM policy JSON with values redacted |
| 3 | Configure Preview variables | Fresh Preview `AUTH_SECRET`; only isolated table; Gemini/Razorpay/S3/email/OTP absent | Variable names/scopes only |
| 4 | Deploy Preview | Protected URL only; no production promotion | Deployment URL, commit SHA, build logs |
| 5 | Verify isolation before user data | Confirm wrong/missing DB config fails closed; confirm payment and Ask MAMA are disabled | Controlled API/browser responses, logs redacted |
| 6 | Create two disposable synthetic households | No real customer identity or health data | Synthetic IDs and cleanup inventory |
| 7 | Test customer session lifecycle | Login/session issue, refresh, expiry, logout/revocation; no header spoofing | Test report and redacted logs |
| 8 | Test household isolation | Attempt cross-account profile, meal, grocery, export, and feedback access; every attempt must fail | Authorization test results |
| 9 | Test persistence | Family profile, restrictions, meal plan, grocery, feedback report, session record, and TTL metadata persist in the isolated table | Repository/API test evidence |
| 10 | Test public/mobile journeys | Desktop/mobile navigation, legal routes, subscription screen, focus behavior, Ask MAMA launcher; no payment initiation | Playwright HTML/JSON report and screenshots |
| 11 | Optional Gemini stage | Requires separate approval; enable only the Preview gate and test key, use <=10 synthetic prompts and <=₹100 budget | Prompt class/result ledger, provider usage record |
| 12 | Optional Razorpay test stage | Requires separate approval; test credentials/plan IDs/webhook endpoint only; no live payment | Provider test evidence and webhook idempotency results |
| 13 | Optional export/deletion stage | Requires deletion/retention design approval; destructive operations limited to disposable profiles | Export manifest, deletion audit, cleanup confirmation |
| 14 | Failure recovery | Simulate DynamoDB unavailable, revoked/expired session, malformed Gemini response, disabled payment credentials | Error behavior results; no secrets in logs |
| 15 | Review and cleanup | Revoke Preview credentials, remove test data/variables, remove deployment/resources only when approved | Signed-off cleanup checklist |

## Acceptance gates

### Gate A — Before synthetic accounts

- Protected Preview URL is inaccessible to unauthorised visitors.
- No production AWS table, S3 bucket, Razorpay key, Gemini key, email/OTP configuration, or judge/demo access is present.
- Application fails closed when isolated persistence is absent.
- No production default is reachable through a legacy environment fallback.

### Gate B — Before Gemini

- Gate A passes.
- Two-household isolation and durable session tests pass.
- Owner approves a concrete provider/test-key configuration and ₹100 maximum budget.
- Prompt suite is synthetic and contains no real dietary or personal data.

### Gate C — Before Razorpay

- Gate A passes.
- Owner confirms distinct Razorpay test credentials, plan IDs, webhook secret, and the test account terms.
- The test deployment has no live payment credentials.

### Gate D — Before any destructive deletion test

- Owner approves the deletion/retention design.
- Only disposable synthetic data exists in the Preview table.
- Cleanup and verification steps are written before execution.

## Stop conditions

Stop immediately and roll back the current test stage if a production ARN, bucket, credential name/value, live payment request, real user record, unexpected Gemini charge, or unauthorised access path is observed.

## Rollback

Disable the Preview deployment or remove its deployment alias; remove Preview environment variables; revoke the Preview-only AWS identity; delete only approved synthetic records/resources; then confirm the live project and production domains were unchanged. Do not delete shared resources.
