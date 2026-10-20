# MAMAAI Phase 2E.4 — Existing DynamoDB test table and isolated Preview preparation

Date: 2026-10-20. Preparation and read-only verification only. No AWS table, TTL setting, item, IAM identity, Vercel project, Vercel variable, deployment, payment, Gemini request, production record, commit, or push was changed.

## AWS access and table metadata

AWS CLI v2.38.2 is installed at the current-user path, but no local AWS profile is configured. Therefore CLI authentication, billing mode, and TTL status could not be independently read.

The owner-confirmed AWS Console metadata is:

| Field | Confirmed value |
|---|---|
| Account | `624719611353` |
| Region | `ap-south-1` (Mumbai) |
| Table | `mamaai-preview-test` |
| Status | Active |
| Partition key | `PK` (String) |
| Sort key | `SK` (String) |
| Secondary indexes | 0 |

The protected tables `MAMA_AI_APP`, `MAMA_AI_ANALYTICS_EVENTS`, and `rbil-visitor-counter-VisitorCounterTable-8WYWZCV6BTIY` were not read or modified.

### TTL check and owner-only Console steps

TTL status remains unverified. In the AWS Console: **DynamoDB → Tables → mamaai-preview-test → Additional settings → Time to live (TTL) → Turn on**. Enter exactly `expiresAt` as the TTL attribute, confirm it is a top-level Number attribute, then save. TTL cleanup is asynchronous; application code must continue enforcing expiry before TTL deletion occurs. Do not enable it until the owner approves that cloud change.

## Compatibility assessment

### Safe on the current table

The current `PK`/`SK` table is compatible with the shared-table repository design for:

- durable opaque customer sessions;
- customer and family-profile records;
- rate-limit records;
- quota records;
- safety-report writes and direct lookup by known key;
- subscription writes/direct lookup.

Those records use distinct key prefixes, so synthetic identities can coexist safely. The code uses the top-level `expiresAt` attribute for sessions, rate limits, quotas, and some entitlement records. TTL should therefore be configured exactly as `expiresAt`.

### Not compatible yet for every workflow

The current table has zero secondary indexes. The following repositories contain `QueryCommand` operations using a configured `MAMA_AI_DYNAMODB_GSI1_NAME`:

- `lib/repositories/customer-data-repository.ts` — export-related aggregation;
- `lib/repositories/safety-report-repository.ts` — reviewer list/query path;
- `lib/repositories/subscription-repository.ts` — subscription list/query paths.

Therefore, **do not claim export, staff safety-review listing, or subscription-list workflows are ready against this table**. They require either a specifically designed GSI added after owner approval, or remain unavailable in the isolated Preview. The minimal session/profile security test scope does not require a GSI.

The legacy repository `lib/repositories/dynamo.ts` uses separate historical table names and includes a `UserIdIndex` query. It cannot operate correctly on the zero-index shared table. It should be kept unavailable in Preview unless an approved compatibility migration is designed.

No protected table name or `mamaai-preview-test` is hardcoded in scanned TypeScript source.

## Local safety correction

Changed `lib/repositories/dynamo.ts` to fail closed in Vercel Preview when any legacy `DYNAMODB_*_TABLE` variable is missing. Previously it silently used names such as `mamaai_users` and `mamaai_families`; a Preview with credentials that happened to permit those tables could reach a non-isolated resource. In Preview, missing legacy configuration now throws a controlled configuration error instead.

This guard does not alter non-Preview behavior. Preview configuration should set each legacy `DYNAMODB_*_TABLE` variable to a distinct denied sentinel name. The Preview IAM policy must grant no access to those sentinel names.

## Required Vercel Preview variables

For a separate protected project, use variable names only; never copy Production values.

| Variable | Required isolated Preview disposition |
|---|---|
| `AWS_REGION` | `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | Preview-only identity, after approval; never Production credentials |
| `AWS_SECRET_ACCESS_KEY` | Preview-only identity, after approval; never Production credentials |
| `MAMA_AI_DYNAMODB_TABLE_NAME` | `mamaai-preview-test` |
| `MAMA_AI_TABLE_NAME` | `mamaai-preview-test` |
| `DYNAMODB_USERS_TABLE`, `DYNAMODB_FAMILIES_TABLE`, `DYNAMODB_MEAL_PLANS_TABLE`, `DYNAMODB_PANTRY_TABLE`, `DYNAMODB_FEEDBACK_TABLE`, `DYNAMODB_ANALYTICS_TABLE` | Distinct `mamaai-preview-deny-*` sentinel names; IAM denies access |
| `MAMA_AI_ANALYTICS_TABLE` | Denied sentinel name unless an isolated analytics design is separately approved |
| `AUTH_SECRET` | New random Preview-only value |
| `MAMA_AI_RATE_LIMIT_SALT` | New random Preview-only value |
| `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED` | Explicit `false` |
| `MAMA_AI_QUOTAS_ENABLED` | Explicit `false` until quota test configuration is approved |
| `MAMA_AI_SAFETY_REVIEWER_IDS` | Synthetic reviewer identity only, or omit while review routes are unavailable |
| `MAMA_AI_DYNAMODB_GSI1_NAME` | Omit until an approved GSI exists; dependent list/export routes remain unavailable |
| `GEMINI_API_KEY` | Absent |
| all `RAZORPAY_*`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, and webhook secrets | Absent |
| S3 bucket/prefix/export variables | Absent |
| judge/demo flags and judge keys | Absent or explicitly disabled |
| `NEXT_PUBLIC_APP_URL` | Protected generated Preview URL after the deployment target is created |

## Least-privilege IAM policy

The following policy is for a future dedicated Preview identity. It grants no table wildcard, no Production table, no S3, no IAM administration, and no `Scan` or `ListTables` access. `Query` and `TransactWriteItems` are included because the current shared-table repositories use them; GSI-dependent features still remain disabled until an index is approved.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "MAMAAIPreviewTestTableOnly",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:TransactWriteItems"
      ],
      "Resource": "arn:aws:dynamodb:ap-south-1:624719611353:table/mamaai-preview-test"
    }
  ]
}
```

If a GSI is approved later, add only the corresponding index ARN to `Resource`; do not broaden access to `table/*` or other tables.

## Proposed Preview project settings

Use the separate project `mamaai-preview-isolated`, with Deployment Protection enabled before any URL is shared. Connect it to a fixed reviewed branch or commit. It must have no inherited variables from `rbinnovationllps-projects/mamaai`.

The Preview must operate with S3, Razorpay, payment webhooks, Gemini, Judge access, and demo access disabled. Ask MAMA’s existing server-side Preview gate remains disabled. With these settings, the public site and anonymous routes can render, while database-backed routes fail closed if configuration is incomplete rather than contacting Production.

## Security verification

- Production DynamoDB access is prevented only after the dedicated IAM policy is active; it is not yet configured.
- Missing primary shared-table variables already throw through `getMamaAiTableName`.
- This phase adds the missing legacy Preview guard.
- Payment APIs cannot receive Preview credentials when all Razorpay variables are absent; their missing-configuration response must be verified only after approved Preview deployment.
- Customer sessions and test data are isolated only after a Preview-only `AUTH_SECRET`, dedicated IAM identity, and synthetic records are configured.
- No production credential was printed or written into generated files/logs during this phase.

## Costs and cleanup

No cost was incurred. The existing on-demand table’s actual billing mode is still unverified by CLI. Expected cost drivers are DynamoDB requests/storage, Vercel deployment usage, and later optional Gemini calls. No S3 cost is expected for the approved scope.

After approved testing, delete only `mamaai-preview-test`, remove the Preview IAM identity/policy and isolated Vercel project/deployments, and revoke Preview-only secrets. Do not delete the protected tables.

## Remaining approvals

1. AWS CLI read-only authentication to inspect `mamaai-preview-test` metadata and TTL state.
2. Enabling TTL on `expiresAt` if currently disabled.
3. Creating a dedicated Preview-only AWS identity with the supplied policy.
4. Adding a GSI only if export/reviewer/subscription-list testing is required.
5. Creating the separate protected Vercel project and its Preview-only variables.
6. Deploying the protected Preview.
7. Creating synthetic customer records and enabling any database-backed test.
8. Gemini activation and real Gemini requests, separately.