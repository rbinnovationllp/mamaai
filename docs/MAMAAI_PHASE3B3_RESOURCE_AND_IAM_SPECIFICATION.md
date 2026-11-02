# MAMAAI Phase 3B.3 resource and IAM specification

## DynamoDB

Table `mamaai-preview-test`; PAY_PER_REQUEST; `PK` String HASH, `SK` String RANGE; TTL attribute `expiresAt`; encryption at rest enabled. GSI1 is required: `GSI1PK` String HASH and `GSI1SK` String RANGE, `ALL` projection because current repositories return `record` after querying pantry, family meal/weekly plan, safety status, subscription/provider, CRM and export patterns. GSI2 is not queried and is excluded.

## IAM

Allow only GetItem, PutItem, UpdateItem, DeleteItem, Query, ConditionCheckItem, TransactWriteItems, DescribeTable on `arn:aws:dynamodb:ap-south-1:624719611353:table/mamaai-preview-test`; allow Query only on `/index/GSI1`. Deny by omission all production tables, wildcard resources, Scan, IAM, S3, KMS, Secrets Manager, table management and exports. Prefer short-lived role/federated credentials; long-lived keys need separate approval.

Reuse is preferred because the existing table is empty and PK/SK-compatible. RBIL must first approve creating GSI1 and enabling TTL `expiresAt`; no resource was changed by this specification.

