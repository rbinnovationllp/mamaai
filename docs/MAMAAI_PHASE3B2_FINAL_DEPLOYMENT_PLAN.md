# MAMAAI Phase 3B.2 final deployment plan

Date: 23 October 2026

## Gate decision

Do not deploy yet. Local configuration is fail-closed, but Preview must use a separate Vercel project, an isolated DynamoDB table with GSI1, and an identity restricted to that table/index.

## Local build-lock investigation

The former lock was absent before the fresh build attempt; no process was terminated and no lock was removed. `npm run build` started normally and created a new local `.next/lock` while compilation was active. At reporting time the fresh build had not emitted its completion result, so it is **in progress/unverified**, not a pass or failure.

## Required target

- Vercel project: `mamaai-preview-isolated`
- Table: `mamaai-preview-20261023` (unique, disposable, isolated)
- Region: `ap-south-1`
- Primary key: `PK` (String), `SK` (String)
- TTL: `expiresAt` (Number)
- Billing: on-demand
- Index: `GSI1` on `GSI1PK` (String), `GSI1SK` (String), `ALL` projection for the synthetic Preview test scope.

## Deployment protection and environment contract

Enable Vercel Deployment Protection before adding any variable. Configure Preview only:

```text
VERCEL_ENV=preview
AWS_REGION=ap-south-1
MAMA_AI_AWS_IDENTITY_SCOPE=preview-isolated
MAMA_AI_DYNAMODB_TABLE_NAME=mamaai-preview-20261023
MAMA_AI_ANALYTICS_TABLE_NAME=mamaai-preview-20261023
MAMA_AI_DYNAMODB_GSI1_NAME=GSI1
AUTH_SECRET=<fresh Preview-only random secret>
MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=false
MAMA_AI_DEMO_MODE=false
MAMA_AI_JUDGE_ACCESS_ENABLED=false
```

Do not set production aliases/credentials, Razorpay keys or webhooks, Gemini, S3, email/OTP, deletion activation, or analytics credentials. The app must fail closed if any isolated database value is absent.

## Remaining P0 gates

ISS-001 customer authentication/registration, ISS-005 functional authenticated export delivery, and ISS-006 deletion remain open. Do not enable deletion. Payment and real Gemini remain separate integration gates.

## Exact approval actions

1. Create the named isolated table and GSI1.
2. Create or approve a dedicated least-privilege Preview identity.
3. Create protected `mamaai-preview-isolated`.
4. Set only the Preview variables above.
5. Deploy and test only two synthetic households.
