# MAMAAI Phase 2A.4 — Low-Cost Isolated Beta Testing Plan

**Date:** 2026-10-20. Preparation only: no deployment, AWS operation, Gemini call, account creation, payment action, or production database access occurred.**

## Existing resources

- The repository contains `.vercel` metadata and uses Next.js/Vercel Analytics. Vercel preview deployments are supported by the platform and normally receive a Vercel-generated URL; a separate paid domain is unnecessary.
- Local metadata does not contain `project.json`, a preview URL, or evidence of a distinct Vercel project. The owner must confirm the linked project and preview capability in the Vercel dashboard.
- Environment-key names support a separate DynamoDB table and Gemini key. No values were inspected.

## Minimum isolated infrastructure

Use one new DynamoDB table, for example `mamaai-askmama-beta-test`, in `ap-south-1` with on-demand billing:

| Resource | Required schema/configuration |
|---|---|
| Customer profile table | Primary key `PK` (String), sort key `SK` (String). Ask MAMA reads `USER#{syntheticUserId}` + `FAMILY_PROFILE#CURRENT`; profile writes also use `CUSTOMER#PROFILE`. |
| GSI1 | Optional for the narrow Ask MAMA profile test, but recommended for parity: partition `GSI1PK`, sort `GSI1SK`. |
| GSI2 | Not needed for Ask MAMA-only tests. |
| IAM test role | `dynamodb:GetItem`, `PutItem`, `DeleteItem`, and optionally `Query` only on this test table and its indexes. No wildcard production-table permissions. |

The route also attempts optional legacy Users and Pantry reads. Their failures are caught, but to avoid noisy test logs configure `DYNAMODB_USERS_TABLE` and `DYNAMODB_PANTRY_TABLE` to isolated test tables or a deliberately empty compatible test table. Do not point either setting at production. The customer profile path itself uses `MAMA_AI_DYNAMODB_TABLE_NAME` (or `MAMA_AI_TABLE_NAME`).

## Synthetic identities

Create only after approval:

- **Family A**: synthetic user ID A, one adult with `allergies: ["milk"]`; test that milk, casein, whey, paneer and ghee recommendations are rejected.
- **Family B**: synthetic user ID B, one adult with `allergies: ["peanut"]`; test that groundnut and multilingual peanut terms are rejected.
- Use different browser profiles/cookie jars. Attempt to request with A while supplying B-like client context; the server must read A’s saved profile only.
- Test session expiry by using an expired or cleared synthetic session cookie, then test logout by clearing it. No real email, phone, OTP, or customer account is required if the owner provisions signed synthetic sessions in the isolated environment.

**Important constraint:** Ask MAMA currently calls `getSession()` (`mamaai_session`), whereas customer-profile routes use `mamaai_customer_session`. Verify and align the active isolated session path before tests; otherwise Ask MAMA will have no authorized safety profile and correctly return clarification.

## Gemini budget

The Ask MAMA route uses `gemini-2.5-flash`, temperature `0.2`, and a maximum of `800` output tokens. A 10-call suite with synthetic profiles is likely well below ₹100 at typical Flash pricing, but exact cost depends on the selected account, model availability, input-token size, and any free allowance. Set a **hard ₹100 account/project budget alert and a 10-call operational cap**; stop after either limit. Do not assume a free tier.

## Controlled sequence

1. Owner creates/links a Vercel preview target; confirm its generated preview URL.
2. Owner creates the isolated on-demand DynamoDB table and least-privilege role.
3. Configure preview-only variables: distinct app URL, isolated table names, non-production AWS credentials, distinct Gemini key, `AUTH_SECRET`, and disabled/empty payment provider credentials.
4. Provision two synthetic sessions/profiles without email, OTP, or payment.
5. Run at most 10 Gemini calls: safe structured meal; milk/casein; peanut/groundnut; Hindi/Kannada; Jain; fasting; infant honey; malformed output; profile substitution; general product question.
6. Record only test case ID, HTTP status, parser result and safety status. Do not log prompts, profile details, ingredients, session values, or secrets.
7. Delete synthetic table records and synthetic sessions; remove preview environment variables or delete the preview deployment. Revoke the Gemini test key if it was created solely for this run.

## Risks

A preview can reach production if any preview environment variable reuses a production DynamoDB table, Gemini key, Razorpay key/secret, webhook secret, email/OTP provider, or public URL. Payment must remain disabled. The current project has multiple DynamoDB access conventions; configure every relevant `DYNAMODB_*` and `MAMA_AI_*` table variable explicitly.

## Owner approval gates

1. Confirm Vercel preview deployment is permitted for this repository.
2. Create/configure an isolated DynamoDB table and least-privilege test role.
3. Provide a distinct Gemini test key, a ₹100 hard budget alert, and approval for at most 10 calls.
4. Provision two synthetic session identities and confirm no real data is present.
5. Approve deployment to the preview URL and subsequent cleanup.

Until these are completed, use only the existing local mocked tests. No production beta deployment is authorized.
