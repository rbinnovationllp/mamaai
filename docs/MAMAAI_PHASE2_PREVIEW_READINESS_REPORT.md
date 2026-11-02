# MAMAAI Phase 2 Preview Readiness Report

Date: 23 October 2026

## Actual architecture

- Runtime: Next.js App Router and route handlers on Vercel-compatible hosting.
- Persistence code: AWS SDK DynamoDB repositories; the configured table is required by `getMamaAiTableName`.
- Authentication: durable opaque `mamaai_customer_session` cookie, with server verification through `DynamoDbSessionRepository`; signed-header support remains a separate trusted-server mechanism.
- AI: Gemini libraries and `GEMINI_API_KEY` server configuration; Preview Ask MAMA is server-gated unless `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=true`.
- Billing: Razorpay routes/service code; provider credentials and plan IDs are environment variables.
- Not confirmed active from code alone: AWS Amplify, Lambda, Cognito, a live DynamoDB deployment, a connected Gemini project, or test-mode Razorpay.

## Required isolated Preview boundary

| Area | Preview requirement | Production fallback allowed? |
|---|---|---|
| Vercel | Separate protected Preview project/URL, distinct Preview variables | No |
| DynamoDB | Dedicated single table, synthetic-only PK namespace, TTL and least-privilege identity | No |
| Authentication | Separate `AUTH_SECRET`; synthetic accounts only | No |
| Gemini | Disabled until explicit approval; Preview safety gate stays closed | No |
| Razorpay | Absent/disabled until separate test-mode approval | No |
| Email/OTP/webhooks/S3 | Absent or safely mocked | No |

## Preview configuration checklist

- Set `VERCEL_ENV=preview`, a unique Preview `AUTH_SECRET`, `AWS_REGION`, and `MAMA_AI_DYNAMODB_TABLE_NAME` for the isolated table.
- Do not set production AWS credentials, `MAMA_AI_TABLE_NAME`, production S3 variables, Razorpay keys/plan IDs/webhook secret, judge flags, or Gemini key in Preview.
- Confirm every `MAMA_AI_*` table reference fails closed if the Preview table variable is missing. Current source still contains legacy default-table fallbacks in some modules, which blocks approval.
- Enable Vercel Deployment Protection and restrict Preview access to RBIL testers.
- Delete synthetic records, revoke Preview credentials, remove Preview variables and delete the Preview deployment/table after testing.

## Cost and approvals

No cost was incurred. DynamoDB on-demand, protected Vercel Preview, a separate IAM identity, Razorpay test mode, and up to ten bounded Gemini requests require owner approval before use. AWS pricing and permissions cannot be verified without authenticated AWS read-only access.

## Status

Prepared locally. Not provisioned, not deployed and not cloud-validated.
