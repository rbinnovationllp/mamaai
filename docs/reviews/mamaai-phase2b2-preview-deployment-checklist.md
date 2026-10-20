# MAMAAI Phase 2B.2 — Isolated Preview Deployment Checklist

Date: 2026-10-20. This is a preparation and local-verification report. No AWS or Vercel resource was created or modified; no preview was deployed; no Gemini, payment, email, OTP, webhook, or production-data operation occurred.

## Local security review

The durable customer cookie is created only by `POST /api/customer/family-profile` after the customer/family record path completes. It writes an opaque-token hash to `DynamoDbSessionRepository`, then sets the HttpOnly cookie. `requireUser` is asynchronous and protected customer routes found by source search await it: customer session/profile/attendance, Ask MAMA when a personalized profile is requested, pantry, meal plans, weekly plans, feedback, subscription status, and protected Razorpay subscription routes.

The verifier rejects absent, malformed, expired, and revoked opaque tokens. Logout verifies the record, revokes it, and clears the cookie only after a successful revocation. DynamoDB errors become controlled failure responses; no in-memory session fallback exists. Legacy signed `mamaai_customer_session` cookies do not meet the opaque-token format and are rejected. The HMAC signed-header mechanism remains separate, requires `AUTH_SECRET`, and is not a cookie fallback or a demo identity mechanism.

Ask MAMA deliberately permits unauthenticated *general* conversation. It obtains family dietary context only from `requireUser` and then retrieves that verified user’s profile; a caller-provided family identifier is not used. Its optional authentication branch catches authorization/repository errors, so a personalized food request without an authorized profile must remain a clarification/blocked safety outcome. This requires preview verification before exposure.

**Open preview blocker:** when `GEMINI_API_KEY` is absent, the Ask MAMA route currently returns its local fallback answer path. Keep Ask MAMA inaccessible in a preview until the Phase 2A safety test confirms that this fallback cannot make a specific unvalidated food recommendation. This report does not change application code.

## Isolated DynamoDB definition

Use one purpose-built on-demand table for the approved session, onboarding, family-profile, and Ask MAMA safety-profile flows:

| Setting | Value |
|---|---|
| Table name | `mamaai-preview-2b2-<random-suffix>` |
| Region | `ap-south-1` |
| Primary key | `PK` (String) |
| Sort key | `SK` (String) |
| Billing | `PAY_PER_REQUEST` |
| Encryption | AWS owned key server-side encryption (`SSEType: AES256`) |
| TTL | Enabled on numeric top-level attribute `expiresAt` |
| Indexes | None required for the approved session/profile/Ask MAMA safety tests |
| Point-in-time recovery | Not required for disposable synthetic data; enable only if the owner needs investigation recovery |

The new session repository can safely share this isolated single-table resource with `CustomerProfileRepository`: their `PK`/`SK` values do not overlap. TTL cleanup is asynchronous, but server verification enforces expiry independently.

Legacy route code also has `DYNAMODB_USERS_TABLE`, `DYNAMODB_FAMILIES_TABLE`, `DYNAMODB_MEAL_PLANS_TABLE`, `DYNAMODB_PANTRY_TABLE`, `DYNAMODB_FEEDBACK_TABLE`, and `DYNAMODB_ANALYTICS_TABLE` conventions. Set every one in Preview to a unique nonexistent `mamaai-preview-deny-*` name and grant no access. This is safer and cheaper than creating unused compatible tables; an accidental call fails closed and cannot reach a production default table. Ask MAMA’s optional old Users/Pantry enrichment logs a controlled fallback, while its safety profile uses the isolated single table.

## Least-privilege preview IAM policy

Replace `ACCOUNT_ID` with the owner account identifier and `TABLE_NAME` with the generated isolated table name. Attach this only to the preview credential/role; do not grant the Vercel role any other DynamoDB resource access.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PreviewSyntheticSessionAndProfileOnly",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-south-1:ACCOUNT_ID:table/TABLE_NAME"
    }
  ]
}
```

No wildcard action, table ARN, index ARN, production ARN, `Scan`, `ListTables`, or account-wide IAM permission is needed. If the deployment uses OIDC, bind the trust policy to the identified Vercel project and preview environment; otherwise use a short-lived preview-only credential managed in Vercel. Do not put an administrator key in Preview.

## Preview-only environment checklist

Set values in Vercel’s **Preview** scope only; never copy Production values.

| Variable | Preview requirement |
|---|---|
| `AWS_REGION` | `ap-south-1` |
| `MAMA_AI_DYNAMODB_TABLE_NAME` | isolated table name only |
| `MAMA_AI_TABLE_NAME` | same isolated table name, to prevent an older shared-table caller using a default |
| `MAMA_AI_DYNAMODB_GSI1_NAME`, `MAMA_AI_DYNAMODB_GSI2_NAME` | unset for this narrow test |
| Every `DYNAMODB_*_TABLE` variable | distinct nonexistent `mamaai-preview-deny-*` sentinel |
| `AUTH_SECRET` | new preview-only value; never reuse production |
| `MAMA_AI_ALLOW_DEMO_IDENTITY`, `MAMA_AI_DEMO_MODE` | `false` |
| `MAMA_AI_ALLOWED_ORIGINS` | preview URL only after it is created |
| `NEXT_PUBLIC_APP_URL` | generated protected preview URL |
| `GEMINI_API_KEY` | leave unset until separate approval for capped real calls; use a distinct test key when approved |
| Razorpay keys, plans, webhook secret, public key | all unset |
| RevenueCat secret/key | unset |
| `OPENAI_API_KEY`, `YOUTUBE_API_KEY`, `MAMA_AI_S3_BUCKET` | unset unless separately approved and isolated |

Enable Vercel Deployment Protection for Preview and restrict access to the owner/team. Do not expose a public preview URL. The local `.vercel/repo.json` identifies project `mamaai` (project ID retained locally) but no `project.json`, preview URL, or preview environment configuration was found. Confirm project permissions and protection in the Vercel dashboard before deployment.

## Synthetic identities (do not create yet)

- **Customer A — Anaya Preview:** `preview_customer_a`; family member `Anaya Child`, age 6, allergy `milk`. Expected blocked terms include milk, paneer, whey, casein, ghee.
- **Customer B — Bharat Preview:** `preview_customer_b`; family member `Bharat Child`, age 8, allergy `peanut`. Expected blocked terms include peanut, groundnut, and configured Hindi/Kannada aliases.

Use separate browser profiles/cookie jars. Store no real email, mobile, address, payment, or medical record. Customer A must never retrieve Customer B’s profile, grocery/meal data, or safety context.

## Controlled test plan

| Test | Preview method | Gemini needed |
|---|---|---|
| Onboarding, login/session creation, refresh | synthetic profile and cookie only | No |
| Family profile retrieval and cross-account denial | two browser contexts | No |
| Logout and immediate revocation | verify prior cookie fails after logout | No |
| Expired/missing session and DynamoDB outage | controlled request/restricted IAM test | No |
| Ask MAMA safe/unsafe structured meals, aliases, Jain, fasting, child hazards | mocked responses locally first; preview only after safety gate is confirmed | Real calls only after approval |
| Malformed Gemini output and timeout | deterministic local mock | No |
| Payments, email/OTP, and webhooks disabled | configuration inspection plus route refusal | No |

Use at most ten real Gemini requests if separately approved: safe meal, milk derivative, peanut alias, Hindi/Kannada, Jain, fasting, child hazard, general question, malformed-response simulation (mock only), and cross-user attempt. Payment, email/OTP, subscription creation, and webhooks remain disabled throughout.

## Costs and cleanup

Preparation cost is ₹0 because no resources or calls were made. A disposable on-demand DynamoDB table holding two profiles and sessions should be negligible, but AWS free-tier eligibility and Vercel plan allowances must be confirmed by the owner. Do not assume they are free. Keep the previously proposed hard Gemini cap of ₹100 and ten calls; no Gemini cost exists until approval.

After testing: revoke/delete synthetic sessions; delete all synthetic records; delete the isolated table; remove Preview environment variables and preview credentials; delete the preview deployment; revoke the isolated Gemini key if one was created. Retain only non-sensitive test-result summaries.

## Prepared deployment commands — do not run without approval

From `C:\Users\HP\mamaai`, after the owner creates the isolated resources and Preview variables:

```powershell
vercel pull --environment=preview
vercel deploy
```

The owner must verify the generated URL is deployment-protected before any browser testing. Roll back by promoting no preview, deleting the preview deployment, removing its Preview variables/credentials, and deleting the isolated table after collecting the minimal evidence required.

## Required approvals

1. Create the isolated DynamoDB table, TTL configuration, and least-privilege preview role/credential.
2. Configure Vercel Preview variables and Deployment Protection.
3. Create the two synthetic accounts only in the isolated table.
4. Resolve or explicitly accept the Ask MAMA no-Gemini fallback blocker before exposing the route.
5. Approve a protected preview deployment.
6. Separately approve a distinct Gemini test key, ₹100 cap, and up to ten real calls.
