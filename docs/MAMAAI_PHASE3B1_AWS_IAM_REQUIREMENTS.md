# MAMAAI Phase 3B.1 — AWS IAM Requirements

Date: 23 October 2026

## Status

This is a proposed policy design only. No IAM policy, access key, role, or AWS resource was read or modified in this phase.

## Required identity

For the isolated Preview deployment, use a dedicated identity restricted to the isolated MAMAAI resource set. The earlier owner-provided identity name is `mamaai-preview-test-user`; its current effective policy was not verified in this phase.

Prefer a short-lived role/federated credential mechanism supported by the chosen Vercel deployment setup. If Vercel requires long-lived access keys, their creation, encrypted Preview-only storage, rotation window, and revocation process require a separate RBIL approval.

## Resource boundary

Initial table ARN, subject to read-only confirmation:

```text
arn:aws:dynamodb:ap-south-1:624719611353:table/mamaai-preview-test
```

If and only if isolated GSIs are later approved, the matching index ARN is:

```text
arn:aws:dynamodb:ap-south-1:624719611353:table/mamaai-preview-test/index/*
```

Production ARNs must never appear in this policy, including `MAMA_AI_APP`, `MAMA_AI_ANALYTICS_EVENTS`, and the RBIL visitor-counter table.

## Proposed least-privilege policy

Use this as a review template, not an instruction to apply it yet:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "MamaaiPreviewTableReadWrite",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchWriteItem",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:ap-south-1:624719611353:table/mamaai-preview-test"
    },
    {
      "Sid": "MamaaiPreviewIndexQueries",
      "Effect": "Allow",
      "Action": ["dynamodb:Query"],
      "Resource": "arn:aws:dynamodb:ap-south-1:624719611353:table/mamaai-preview-test/index/*"
    }
  ]
}
```

Remove `BatchWriteItem` if the repository scan confirms it is not needed. Do not grant `dynamodb:*`, `Resource: "*"`, account-level list actions, table creation/deletion, backup/export/import, streams, KMS administration, S3, STS administration, or IAM actions.

## Configuration contract

Preview variables must be set only in the isolated project:

```text
VERCEL_ENV=preview
AWS_REGION=ap-south-1
MAMA_AI_AWS_IDENTITY_SCOPE=preview-isolated
MAMA_AI_DYNAMODB_TABLE_NAME=mamaai-preview-test
MAMA_AI_ANALYTICS_TABLE_NAME=mamaai-preview-test
```

The first Preview deployment must omit production aliases, production AWS credentials, S3 configuration, Razorpay variables, Gemini key, email/OTP credentials, demo mode, and judge access.

## Index requirement

The known isolated table has zero GSIs. The code expects an index named by `MAMA_AI_DYNAMODB_GSI1_NAME` (currently defaulting to `GSI1`) for subscription provider lookup, safety-report status review, customer export, and CRM queries. Before those flows are tested, RBIL must approve either:

1. Adding a `GSI1` compatible with `GSI1PK` / `GSI1SK` to the isolated table; or
2. Creating a fresh disposable isolated table with the complete reviewed schema.

Do not point these paths at production as a substitute.

## Verification required later

A read-only AWS session must confirm account `624719611353`, region `ap-south-1`, exact table keys/TTL/indexes, IAM attachment, effective policy, and that policy simulation denies every production-table ARN. It must also confirm that Vercel uses only the dedicated identity. These are cloud checks and remain outside Phase 3B.1.
