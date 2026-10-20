# MAMAAI Phase 2E.6 — AWS IAM and isolated Vercel readiness

Date: 2026-10-20. Read-only verification and local preparation only. No AWS IAM policy, table, item, TTL, Vercel project, environment variable, deployment, production record, payment, Gemini request, commit, or push was changed.

## AWS authentication result

AWS CLI v2 is installed but has **no configured credentials/profile** on this computer. Every read-only AWS CLI operation returned `NoCredentials`. Therefore the following remain owner-confirmed, not independently verified by CLI:

- account `624719611353`;
- IAM user `mamaai-preview-test-user`;
- policy attachment `MamaaiPreviewDynamoDBOnly`;
- policy default version and effective permissions;
- `mamaai-preview-test` metadata and TTL state.

### Exact Console verification steps

Use the AWS Console while signed into account `624719611353`:

1. Open **IAM → Users → mamaai-preview-test-user → Permissions**.
2. Confirm `MamaaiPreviewDynamoDBOnly` is attached directly or through one intended group only.
3. Open the policy → **Permissions** → **JSON**. Confirm its resource is exactly:
   `arn:aws:dynamodb:ap-south-1:624719611353:table/mamaai-preview-test`
4. Check the policy has no additional statement granting `dynamodb:*`, `Resource: "*"`, `MAMA_AI_APP`, `MAMA_AI_ANALYTICS_EVENTS`, or the visitor-counter table.
5. Open **DynamoDB → Tables → mamaai-preview-test → Additional settings** and confirm `expiresAt` TTL status is Enabled.

The resource string supplied in the task omitted the required `:table/` component. If that omission exists in the actual policy JSON, it does **not** identify the DynamoDB table correctly and must be corrected by an authorized owner before use.

## IAM policy compatibility and AWS warning

The exact policy action names were not provided and cannot be inspected without AWS authentication. AWS warns when an action has no applicable resource type in the policy statement, commonly because account-level actions such as `dynamodb:ListTables` or `dynamodb:DescribeLimits` are attached to a table ARN. Those actions are not required by the runtime and should be removed from the Preview runtime identity.

The application repository operations require these table-scoped actions:

- `dynamodb:GetItem`
- `dynamodb:PutItem`
- `dynamodb:UpdateItem`
- `dynamodb:DeleteItem`
- `dynamodb:Query`
- `dynamodb:TransactWriteItems`

`Scan`, `ListTables`, wildcard DynamoDB resources, S3 permissions, and IAM permissions are not required for the approved Preview test scope. A policy restricted to the single exact table ARN grants no Production-table access, provided no additional policy statement, group, permission boundary, or role assumption broadens it.

## DynamoDB table compatibility

Owner-confirmed table configuration is compatible with core shared-table paths:

| Field | Status |
|---|---|
| Region | `ap-south-1` |
| Keys | `PK` String / `SK` String |
| Capacity | On-demand |
| Table status | Active |
| TTL | Enabled on `expiresAt` |
| Existing GSI count | 0 |

Sessions, customer/family profiles, rate limits, quotas, direct subscription records, and direct safety-report records can coexist safely using their distinct PK/SK prefixes. Server-side expiry still applies even though DynamoDB TTL deletion is asynchronous.

### GSI-dependent workflows

The zero-index table cannot yet support all workflow queries. The repository requirements are:

| Workflow | Repository | Required index |
|---|---|---|
| Customer export aggregation | `customer-data-repository.ts` | `MAMA_AI_DYNAMODB_GSI1_NAME`, `GSI1PK` partition key; GSI sort key recommended for unified schema |
| Safety-report review list | `safety-report-repository.ts` | `MAMA_AI_DYNAMODB_GSI1_NAME`, `GSI1PK` partition key and `GSI1SK` sort key |
| Subscription listing | `subscription-repository.ts` | `MAMA_AI_DYNAMODB_GSI1_NAME`, `GSI1PK` partition key and `GSI1SK` sort key |

If those workflows are needed later, create exactly one named GSI with `GSI1PK` (String) as partition key and `GSI1SK` (String) as sort key, projection `ALL` or a reviewed minimal projection. This is a future owner-approved table modification. Until then, leave `MAMA_AI_DYNAMODB_GSI1_NAME` unset and treat those list/export workflows as unavailable.

## Application isolation

The primary shared-table client requires `MAMA_AI_DYNAMODB_TABLE_NAME` or `MAMA_AI_TABLE_NAME` and throws if neither is configured. The Phase 2E.4 Preview safeguard in `lib/repositories/dynamo.ts` remains present: in `VERCEL_ENV=preview`, every legacy `DYNAMODB_*_TABLE` variable must be explicitly configured. A missing value cannot silently use historical fallback names.

For the isolated Vercel project:

- set `MAMA_AI_DYNAMODB_TABLE_NAME=mamaai-preview-test` and `MAMA_AI_TABLE_NAME=mamaai-preview-test`;
- set every legacy `DYNAMODB_*_TABLE` variable to a unique denied sentinel;
- set `MAMA_AI_ANALYTICS_TABLE` to a denied sentinel;
- provide only the dedicated test identity, never existing Production credentials;
- omit all S3 variables; current checkout has no active source references to the present S3 settings;
- omit all Razorpay keys, plan IDs, and webhook secrets;
- omit Gemini keys and set `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=false`;
- omit judge keys/flags and demo flags;
- use a new random `AUTH_SECRET` and `MAMA_AI_RATE_LIMIT_SALT`;
- use synthetic customers only.

## Vercel isolated project preparation

Recommended project: `mamaai-preview-isolated`.

Create it only after approval. It should be separate from the live `mamaai` project, use a fixed reviewed branch/commit, and have Deployment Protection enabled before URL sharing. A separate project is safer because it avoids the current project’s Preview/Production variable overlap.

### Authentication approach

Prefer a temporary workload identity/OIDC role if the Vercel/AWS setup can bind it only to `mamaai-preview-isolated` Preview deployments and only to the exact table ARN. This avoids a long-lived AWS secret in Vercel.

If Vercel-to-AWS OIDC is unavailable, a dedicated long-lived IAM access key is a fallback, but it increases exposure and rotation burden. It requires separate owner approval before creation. Store it only as a sensitive value in the isolated Vercel project, never in code, `.env` files, terminal output, or chat.

## Local validation

| Check | Result |
|---|---|
| `npm test` | Passed: 32 passed, 0 failed, 0 skipped. |
| Security coverage | Included in the 32 test suite; session, cross-account, Ask MAMA, rate-limit, payment-disable, export/deletion, and safety-report checks passed. |
| Browser checks | Latest local Chromium suite remains 8 passed, 0 failed, 0 skipped; no UI code changed in this phase. |
| `npm run lint`, `npx tsc --noEmit --pretty false`, `npm run build` | Started as safe local checks after the guard review; record their terminal completion before proposing deployment. |

## Remaining owner-approved actions

1. Configure a read-only AWS CLI/CloudShell session and run the metadata/IAM checks above.
2. Review and correct the exact IAM policy resource ARN/action list if necessary.
3. Approve a GSI only if export, safety-review listing, or subscription-list testing is required.
4. Approve a separate protected Vercel project.
5. Approve the isolated Preview environment variable setup.
6. Choose OIDC role or explicitly approve creation of a dedicated long-lived Preview access key.
7. Approve protected Preview deployment.
8. Approve synthetic account creation and database-backed tests.

No cloud modification should occur before those approvals.