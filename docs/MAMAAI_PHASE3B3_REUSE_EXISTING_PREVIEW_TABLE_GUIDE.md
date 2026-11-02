# MAMAAI — Manual AWS setup guide: reuse `mamaai-preview-test`

## Decision

Reuse is safe **after** the owner approves one schema update. The table is empty, isolated by name, on-demand, and already has the required primary key shape: `PK` (String) and `SK` (String). It must never be pointed at `MAMA_AI_APP`, `MAMA_AI_ANALYTICS_EVENTS`, or the visitor-counter table.

## Required console configuration

In AWS Console → DynamoDB → Tables → `mamaai-preview-test` in **ap-south-1**:

1. Confirm status `Active`, billing `On-demand`, PK `PK` String and sort key `SK` String.
2. Create one global secondary index:
   - Index name: `GSI1`
   - Partition key: `GSI1PK` (String)
   - Sort key: `GSI1SK` (String)
   - Projection: `All`
   - Capacity: inherit table/on-demand.
3. Enable TTL with attribute name exactly `expiresAt`.
4. Keep AWS-owned/server-side encryption enabled. Do not enable a production stream, global table, backup, export, or replication for this test table.
5. After the index becomes Active, create/attach only a dedicated Preview identity restricted to this table ARN and `.../index/GSI1`.

## Why these attributes are exact

Repositories query `GSI1PK`/`GSI1SK` for pantry, family meal/weekly plans, safety-review status, provider subscriptions, entitlement status, CRM and account export. Projection `ALL` is required for current code because these queries return the stored `record` document. `GSI2` is written by some records but is not queried by current code; do not add it for Gate B.

TTL `expiresAt` is required: session records, generation locks, detailed meal plans and analytics already write epoch seconds to that attribute. TTL deletion is asynchronous; application authorization/expiry checks remain mandatory.

## Preview environment values

```text
VERCEL_ENV=preview
AWS_REGION=ap-south-1
MAMA_AI_AWS_IDENTITY_SCOPE=preview-isolated
MAMA_AI_DYNAMODB_TABLE_NAME=mamaai-preview-test
MAMA_AI_ANALYTICS_TABLE_NAME=mamaai-preview-test
MAMA_AI_DYNAMODB_GSI1_NAME=GSI1
```

The centralized guard accepts this name because it matches `mamaai-preview-*`. Omit all legacy `MAMA_AI_TABLE_NAME`, `MAMA_AI_ANALYTICS_TABLE`, split-table variables, and every Production AWS/Razorpay/Gemini/S3/email/OTP value.

## IAM boundary

Limit Preview identity to `arn:aws:dynamodb:ap-south-1:624719611353:table/mamaai-preview-test` for item/query/transaction/describe actions and `...:table/mamaai-preview-test/index/GSI1` for Query. No wildcard resources, Scan, management actions, or production ARNs.

## Verification before deployment

- Describe table: confirm GSI1 Active and TTL `expiresAt` Enabled.
- Validate identity can Describe/Query only the Preview table/index.
- Verify policy simulation denies all three production table ARNs without reading their contents.
- Deploy no app until separate Vercel project has Deployment Protection and only Preview variables.
- Use two synthetic households only; clean up records after approval.

## Reuse vs new table

| Option | Isolation | Cost/operations | Recommendation |
| --- | --- | --- | --- |
| Reuse `mamaai-preview-test` | Strong: empty dedicated table plus dedicated identity | One GSI/TTL update; no extra base table | **Recommended** |
| New table | Equivalent if separately named/credentialed | Extra table, IAM and cleanup work | Unnecessary unless table metadata cannot be changed safely |

No AWS action was performed to prepare this guide.
