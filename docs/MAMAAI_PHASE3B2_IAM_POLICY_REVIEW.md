# MAMAAI Phase 3B.2 IAM policy review

Use this policy only after RBIL approval. It intentionally names only the proposed isolated table and GSI1.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {"Sid":"PreviewTableItems","Effect":"Allow","Action":["dynamodb:GetItem","dynamodb:PutItem","dynamodb:UpdateItem","dynamodb:DeleteItem","dynamodb:Query","dynamodb:ConditionCheckItem","dynamodb:TransactWriteItems","dynamodb:DescribeTable"],"Resource":"arn:aws:dynamodb:ap-south-1:624719611353:table/mamaai-preview-20261023"},
    {"Sid":"PreviewGsiQuery","Effect":"Allow","Action":["dynamodb:Query"],"Resource":"arn:aws:dynamodb:ap-south-1:624719611353:table/mamaai-preview-20261023/index/GSI1"}
  ]
}
```

No production table ARN, wildcard resource, `Scan`, IAM, S3, KMS, Secrets Manager, table-management, backup, export, or import permission is allowed. Prefer short-lived/federated credentials; long-lived Vercel access keys require separate RBIL approval, encrypted Preview-only storage, rotation and revocation procedures.
