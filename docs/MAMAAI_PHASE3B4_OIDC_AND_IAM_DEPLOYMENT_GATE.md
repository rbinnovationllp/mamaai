# MAMAAI Phase 3B.4: OIDC and IAM deployment gate

## Local implementation

The isolated-project marker (`MAMA_AI_ISOLATED_PREVIEW=true`) selects a dedicated DynamoDB runtime even when Vercel sets `VERCEL_ENV=production`. That runtime requires all of the following before a database client is created:

- `MAMA_AI_AWS_IDENTITY_SCOPE=preview-isolated`
- `AWS_REGION`
- `AWS_ROLE_ARN`, in valid IAM role-ARN format
- explicit `MAMA_AI_DYNAMODB_TABLE_NAME` and `MAMA_AI_ANALYTICS_TABLE_NAME`
- isolated resource names only

It rejects static `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, legacy table aliases, production table names, missing configuration, and an incorrect identity scope. The DynamoDB client uses `@vercel/oidc-aws-credentials-provider` only in isolated or Vercel-preview runtimes. The established live production credential behavior is unchanged.

The official Vercel provider exchanges a Function OIDC token for short-lived AWS credentials using `AssumeRoleWithWebIdentity`. It refreshes credentials through the AWS SDK provider interface. No token, credential, role session, or secret is logged.

## Exact Production variables: `mamaai-preview-isolated`

```ini
MAMA_AI_ISOLATED_PREVIEW=true
MAMA_AI_AWS_IDENTITY_SCOPE=preview-isolated
AWS_REGION=ap-south-1
AWS_ROLE_ARN=arn:aws:iam::624719611353:role/MAMAAI-Vercel-Preview-Role
MAMA_AI_DYNAMODB_TABLE_NAME=mamaai-preview-test
MAMA_AI_ANALYTICS_TABLE_NAME=mamaai-preview-test
MAMA_AI_DYNAMODB_GSI1_NAME=GSI1
AUTH_SECRET=<new random preview-only secret of at least 32 characters>
MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=false
MAMA_AI_DEMO_MODE=false
MAMA_AI_JUDGE_ACCESS_ENABLED=false
NEXT_PUBLIC_APP_URL=<protected isolated deployment URL>
```

Leave absent: static AWS keys, legacy table aliases, `GEMINI_API_KEY`, all Razorpay and webhook variables, S3 configuration, email/OTP configuration, deletion enablement, judge credentials, admin credentials, and every production-project secret. Do not manually define Vercel's OIDC token variables.

## Minimum replacement IAM permissions policy

Use this as the permissions policy for `MAMAAI-Vercel-Preview-Role`, subject to RBIL's AWS review:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "MAMAAIPreviewTableItems",
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
    },
    {
      "Sid": "MAMAAIPreviewSafetyReportIndex",
      "Effect": "Allow",
      "Action": "dynamodb:Query",
      "Resource": "arn:aws:dynamodb:ap-south-1:624719611353:table/mamaai-preview-test/index/GSI1"
    }
  ]
}
```

`TransactWriteItems` covers conditional writes inside the subscription repository. There is no SDK use of `BatchGetItem`, `BatchWriteItem`, or `TransactGetItems`. `Scan` exists only in the protected admin-metrics route; the isolated configuration intentionally omits `ADMIN_SECRET_KEY`, so the route is unavailable and `Scan` is excluded. `DescribeTable` is not used by the application runtime and is excluded.

## Live validation boundary

Local tests mock the OIDC provider and do not prove that Vercel can assume the role. Before approval to deploy, RBIL must verify the role's **effective** trust and permissions policies in AWS, confirm Vercel Deployment Protection, and confirm the exact role ARN. After deployment, an authorized synthetic-account smoke test must prove OIDC role assumption, permitted access to the preview table, denied access to production resources, and continued disabling of Gemini, payments, email/OTP, S3, webhooks, admin metrics, and destructive deletion.

## Local verification

- `npm run lint`: 0 errors; one existing `@next/next/no-img-element` warning in `app/page.tsx` remains.
- `npm test`: 47 passed, 0 failed, 0 skipped.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; Next.js compiled and generated 43 static pages.
- Local Playwright readiness suite: 13 passed, 0 failed, against `http://localhost:3101` with one worker.
