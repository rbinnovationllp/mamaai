# MAMAAI Phase 2C.1 — Cloud Setup Approval

Date: 2026-10-20. Preparation and read-only local inspection only. No AWS resource, Vercel setting, deployment, account, payment, Gemini call, production record, credential, commit, or push was changed.

## What was verified

- The repository is locally linked to Vercel project `mamaai` through `.vercel/repo.json`.
- The Vercel CLI is installed, but its local token is invalid. It could not authenticate to inspect the project’s actual Preview environment variables, plan, deployment protection, or inheritance settings.
- No AWS CLI is installed and no local `~/.aws` configuration/profile exists. No AWS account identity can be established from this machine without owner-provided read-only AWS access.
- The application’s configured default region in code is `ap-south-1` when `AWS_REGION` is absent. This is not evidence of the account or actual deployed-region configuration.

Therefore the production and staging account relationship is **unverified**. Treat them as the same account until the owner proves otherwise. The safeguards below remain mandatory even if a separate AWS account is later used.

## Proposed isolated DynamoDB resource

Create only after approval:

| Setting | Proposed value |
|---|---|
| Table | `mamaai-preview-2c1-<random-suffix>` |
| Region | `ap-south-1`, after owner verifies deployment region |
| Keys | `PK` String partition key; `SK` String sort key |
| Billing | On-demand (`PAY_PER_REQUEST`) |
| Encryption | DynamoDB server-side encryption with AWS owned key (`AES256`) |
| TTL | Top-level numeric `expiresAt` |
| Indexes | None for the approved session, onboarding, family-profile, and safety-profile tests |
| Recovery | Disabled for the disposable synthetic test table unless owner explicitly needs investigation recovery |

The durable session repository and `CustomerProfileRepository` can safely share this one isolated table because their `PK`/`SK` values do not overlap. It stores only synthetic session hashes and synthetic profile records. TTL cleanup is asynchronous, but server-side verification enforces expiry immediately.

Set every legacy `DYNAMODB_*_TABLE` Preview variable to a distinct nonexistent `mamaai-preview-deny-*` sentinel. The preview IAM policy must not permit those names. This prevents code defaults such as `mamaai_users` from reaching a production resource, even in a shared account.

## Proposed IAM policy

Replace placeholders only during approved execution. Attach it to a Preview-only role or short-lived credential, never a production role.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "MAMAAIPreviewSyntheticDataOnly",
    "Effect": "Allow",
    "Action": [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem"
    ],
    "Resource": "arn:aws:dynamodb:ap-south-1:<ACCOUNT_ID>:table/<PREVIEW_TABLE_NAME>"
  }]
}
```

No wildcard DynamoDB action, resource, index access, `Scan`, `ListTables`, production table ARN, or IAM administration permission is required. If Vercel OIDC is used, its role trust policy must be limited to this Vercel project and Preview deployment context.

## Preview configuration and safeguards

The following Preview-only variables must be set by an authorized owner in Vercel. Do not copy Production values.

| Variable | Required Preview value |
|---|---|
| `AWS_REGION` | approved isolated-table region |
| `MAMA_AI_DYNAMODB_TABLE_NAME`, `MAMA_AI_TABLE_NAME` | isolated table name only |
| All `DYNAMODB_*_TABLE` values | denied `mamaai-preview-deny-*` sentinels |
| `AUTH_SECRET` | new Preview-only value |
| `MAMA_AI_ALLOW_DEMO_IDENTITY`, `MAMA_AI_DEMO_MODE` | `false` |
| `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED` | unset or `false` initially |
| `GEMINI_API_KEY` | unset initially |
| Razorpay keys, plans, webhook secret, public key | unset |
| RevenueCat, OpenAI, YouTube, S3 keys/identifiers | unset unless separately approved and isolated |
| `MAMA_AI_ALLOWED_ORIGINS`, `NEXT_PUBLIC_APP_URL` | protected generated Preview URL only |

Enable Vercel Authentication / Standard Deployment Protection for Preview before sharing the URL. Vercel documents that Standard Protection for preview deployments is available across plans, but the owner must verify the project plan and current setting. [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)

The Ask MAMA server gate remains disabled by default in Preview. It returns 503 before session, profile, DynamoDB, or Gemini access unless `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=true` is explicitly configured after the Preview verification checklist passes.

## Prepared commands — do not execute yet

These commands are review material only. They require a separately authenticated AWS CLI and an owner-supplied Preview role name/table suffix.

```powershell
aws dynamodb create-table --table-name <PREVIEW_TABLE_NAME> --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE --billing-mode PAY_PER_REQUEST --sse-specification Enabled=true,SSEType=AES256 --region ap-south-1
aws dynamodb update-time-to-live --table-name <PREVIEW_TABLE_NAME> --time-to-live-specification Enabled=true,AttributeName=expiresAt --region ap-south-1
aws iam put-role-policy --role-name <PREVIEW_ROLE_NAME> --policy-name MAMAAIPreviewSyntheticDataOnly --policy-document file://mamaai-preview-policy.json
```

After the owner configures only Preview variables and enables Preview protection:

```powershell
vercel pull --environment=preview
vercel deploy
```

Before enabling Ask MAMA: confirm the protected URL, inspect only synthetic table records, verify all denied legacy table calls fail rather than reach production, verify payments/webhooks/email are unconfigured, then set `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=true`. A separate approval is still required before adding a test Gemini key or making any model call.

Cleanup after approved testing:

```powershell
aws dynamodb delete-table --table-name <PREVIEW_TABLE_NAME> --region ap-south-1
vercel remove <PREVIEW_DEPLOYMENT_URL>
```

Also remove Preview variables and the Preview-only IAM policy/credential. Do not use these commands against production names.

## Cost and spending controls

DynamoDB on-demand has no capacity reservation and charges for requests/storage; a two-profile, short-lived table should have very low usage, but cost cannot be guaranteed without the account’s AWS pricing/free-tier status. DynamoDB’s first 25 GB of Standard storage is included in the current free tier where eligible. [AWS DynamoDB pricing](https://aws.amazon.com/dynamodb/pricing/?c=db&p=ft&z=3)

Vercel Preview deployments do not inherently require a paid upgrade; Vercel’s documented Standard Preview protection is available across plans. Usage and any team-plan charges remain account-specific and must be checked in the dashboard. [Vercel plans](https://vercel.com/docs/plans)

The Gemini budget remains **at most ₹100**. A ten-call operational cap is enforceable only by the test operator stopping after ten calls. AWS/Vercel/Gemini budget alerts are alerts, not automatic transaction caps. A provider quota or manually disabling the isolated key after the test is the practical hard stop. Do not buy a plan upgrade or enable a paid add-on; stop and obtain owner approval if either is required.

## Approval table

| Proposed action | Expected cost | Production impact | Rollback / cleanup | Owner approval needed |
|---|---:|---|---|---|
| Read AWS identity with approved credentials | ₹0 | None | None | Yes, credential/access provision |
| Create isolated DynamoDB table and TTL | Low usage-based; verify account | None if name/IAM are correct | Delete table | Yes |
| Attach Preview-only IAM policy | ₹0 | None if ARN is isolated | Remove inline policy/role access | Yes |
| Set Preview Vercel variables and protection | Plan-dependent; no upgrade assumed | None if Preview scope only | Remove variables/protection setting | Yes |
| Deploy protected Preview | Usage-based Vercel cost possible | None; no production promotion | Remove deployment | Yes |
| Create synthetic A/B profiles | Negligible DynamoDB usage | None | Delete isolated records/table | Yes |
| Enable Ask MAMA Preview gate | No Gemini cost itself | Preview only | Unset variable / remove preview | Yes, after preflight |
| Add Gemini test key and make up to ten calls | Maximum ₹100 operational cap | Preview only | Revoke/delete test key | Separate explicit approval |

## Blocking items before execution

1. Owner must provide an authenticated, read-only way to identify the intended AWS account and confirm it is not a production table target.
2. Owner must restore Vercel CLI/dashboard access so Preview variables, plan, inheritance, and Deployment Protection can be inspected.
3. Owner must approve the listed cloud changes individually before any command is executed.
