# MAMAAI isolated Preview DynamoDB schema and GSI plan

Date: 23 October 2026

## Scope

This is a design and local-source analysis. The known `mamaai-preview-test` table was not read, changed, or queried in this phase. No AWS resource or IAM policy was created or changed.

## Existing table and configuration assumptions

| Item | Proposed Preview value |
| --- | --- |
| Table name | `mamaai-preview-test` (or a newly approved isolated equivalent) |
| Primary key | `PK` (String), `SK` (String) |
| Billing | On-demand |
| TTL | `expiresAt` (Number, epoch seconds) |
| Encryption | AWS-owned or AWS-managed encryption is sufficient for synthetic Preview data; RBIL decides if a customer-managed KMS key is required. |
| Data | Synthetic test households only |
| Region | `ap-south-1` only when explicitly configured |

The current code may point both `MAMA_AI_DYNAMODB_TABLE_NAME` and `MAMA_AI_ANALYTICS_TABLE_NAME` to the same isolated table for this limited test. Analytics records use the same PK/SK form and do not currently require a GSI.

## Observed access patterns

| Repository / workflow | Primary key access | Index requirement |
| --- | --- | --- |
| Customer and family profile | `USER#{userId}` + fixed `SK` | No GSI |
| Family context / members | `FAMILY#{familyId}` + query | No GSI |
| Pantry for user | `GSI1PK=PANTRY#{userId}` | GSI1 |
| Family meal plans / weekly plans | `GSI1PK=FAMILY_MEAL_PLANS#{familyId}` or `FAMILY_WEEKLY_PLANS#{familyId}` | GSI1 |
| Customer data export | same family meal/weekly queries | GSI1 |
| Safety-review queue | `GSI1PK=SAFETY_REPORTS#{status}` | GSI1 |
| Subscription provider/payment/entitlement lookup | `GSI1PK=RAZORPAY_SUBSCRIPTION#{id}`, provider payment id, or `ENTITLEMENT_STATUS#{status}` | GSI1 |
| CRM support notes / actor audit | `GSI1PK=SUPPORT_NOTES#{userId}` or `ADMIN_ACTOR#{actorId}` | GSI1 |
| Date-oriented operational queries | code writes `GSI2PK` for meal-plan/weekly date and user subscription/payment status but no current query was found | GSI2 is deferred unless a selected test/workflow needs it |
| Session bulk revocation for deletion | current session key is token-hash only | Future GSI2 or dedicated session lookup required; deletion remains non-executable |

## Required GSI for the approved Preview test scope

### `GSI1`

| Property | Definition |
| --- | --- |
| Index name | `GSI1` (set `MAMA_AI_DYNAMODB_GSI1_NAME=GSI1`) |
| Partition key | `GSI1PK` (String) |
| Sort key | `GSI1SK` (String) |
| Projection | `ALL` for this synthetic Preview test, because current repository queries return `record`; reduce to `INCLUDE` only after enumerating each required attribute and reviewing sensitive-data exposure. |
| Operations | `Query` only; do not use Scan for tenant-facing access. |

This one polymorphic index is the minimum needed for account export, safety-report status review, subscription/payment lookup, CRM, pantry listing, and family-plan listing as they are currently coded.

### `GSI2` — not required for the first isolated functional test

The source writes `GSI2PK/GSI2SK` for date and some subscription/payment views but no `QueryCommand` currently targets GSI2. Do **not** add it solely because items include these attributes.

Before enabling an account-deletion workflow, either add `GSI2` with `GSI2PK/GSI2SK` and store session records under `GSI2PK=USER_SESSIONS#{userId}`, or build a separate authorized session-revocation design. This is a future approval boundary, not part of the preview smoke schema.

## Tenant isolation

- User-facing operations must derive `userId` from a verified durable session; callers never supply a target customer identity as authority.
- Family identifiers must be checked against the verified owner before records are queried or returned.
- GSI partition values encode ownership/status but are not authorization. Authorization must happen before any query.
- Staff review must remain authenticated and redact family identity as the current safety-report route does.

## Legacy incompatibility to resolve before testing all routes

`lib/repositories/dynamo.ts` supports legacy split tables and expects lowercase key attributes and `UserIdIndex`. It is fail-closed in Preview/test due to the configuration guard, but it cannot operate against the proposed single-table PK/SK schema without migration. Do not create legacy tables merely to hide this inconsistency. Migrate or retire callers before validating persistence for routes that depend on it.

## Least-privilege IAM design

A future Preview identity should allow only these actions against the isolated table and its approved `GSI1` ARN:

- `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `ConditionCheckItem`, `TransactWriteItems`, `DescribeTable`

It must not have wildcard table access, `Scan` unless a separately reviewed admin metric requires it, table/index management actions, production-table ARNs, S3 access, Secrets Manager access, or IAM permissions. A separate Vercel project should supply only this identity, never Production AWS credentials.

## Cost and migration considerations

On-demand DynamoDB cost is request/storage driven. A two-household Preview exercise should be very small, but no hard spending cap is enforced by this design. GSI1 duplicates indexed item storage and write work; keep synthetic test duration short and delete the table after approval/testing. Adding a GSI to an existing table requires cloud approval and an online backfill; validate query results with synthetic data before creating test accounts.

## Local verification plan

1. Keep `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=false`, payment/email/webhook variables absent, and use an isolated `AUTH_SECRET`.
2. Configure explicit Preview table/analytics names, region, identity scope and GSI1 name.
3. Confirm the app returns a controlled failure if any value is missing or a production name appears.
4. Insert only two approved synthetic households after separate approval.
5. Verify primary-key profile operations and GSI1 customer export, safety review, subscription lookup, pantry and plan reads.
6. Verify denied production-table access using the dedicated identity, without attempting production data reads.
7. Remove synthetic records and later delete approved isolated resources.

## Required owner approvals

- Create/modify the isolated table to add `GSI1`.
- Create a dedicated least-privilege identity or role, preferably short-lived/federated rather than long-lived access keys.
- Create a separate protected Vercel project and Preview-only variables.
- Execute synthetic data, Gemini, payment-test, or account-lifecycle exercises only under their separate approvals.
