# MAMAAI Phase 3B.2 schema verification

## Verified source access patterns

- `PK=USER#{userId}` with subscription/payment/profile sort-key prefixes: no GSI.
- `PK=FAMILY#{familyId}` for family context and weekly plans: no GSI.
- `GSI1PK=PANTRY#{userId}`, `FAMILY_MEAL_PLANS#{familyId}`, `FAMILY_WEEKLY_PLANS#{familyId}`, `SAFETY_REPORTS#{status}`, `RAZORPAY_SUBSCRIPTION#{id}`, `ENTITLEMENT_STATUS#{status}`, and CRM keys: GSI1 required.
- `GSI2` is written by some repositories but not queried by current source. It is deferred.
- Sessions use token-hash primary keys. Bulk user-session lookup for deletion needs future design/index work; deletion remains disabled.

## Infrastructure definition for approval

```yaml
TableName: mamaai-preview-20261023
BillingMode: PAY_PER_REQUEST
AttributeDefinitions:
  - { AttributeName: PK, AttributeType: S }
  - { AttributeName: SK, AttributeType: S }
  - { AttributeName: GSI1PK, AttributeType: S }
  - { AttributeName: GSI1SK, AttributeType: S }
KeySchema:
  - { AttributeName: PK, KeyType: HASH }
  - { AttributeName: SK, KeyType: RANGE }
GlobalSecondaryIndexes:
  - IndexName: GSI1
    KeySchema:
      - { AttributeName: GSI1PK, KeyType: HASH }
      - { AttributeName: GSI1SK, KeyType: RANGE }
    Projection: { ProjectionType: ALL }
TimeToLive: expiresAt
```

The definition is unexecuted. It must contain synthetic data only.
