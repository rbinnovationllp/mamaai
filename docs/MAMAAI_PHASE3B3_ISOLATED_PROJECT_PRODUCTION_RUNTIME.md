# MAMAAI Phase 3B.3 isolated-project production-runtime checklist

## Local correction

`MAMA_AI_ISOLATED_PREVIEW=true` now creates an `isolated` DynamoDB runtime before the normal Vercel production branch. It requires explicit isolated table names, `preview-isolated` scope, region, and rejects known production table names and `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`. Real production behavior and legacy production fallback remain unchanged when this marker is absent.

## Required Vercel Production variables for `mamaai-preview-isolated`

```text
MAMA_AI_ISOLATED_PREVIEW=true
MAMA_AI_AWS_IDENTITY_SCOPE=preview-isolated
AWS_REGION=ap-south-1
AWS_ROLE_ARN=arn:aws:iam::624719611353:role/MAMAAI-Vercel-Preview-Role
MAMA_AI_DYNAMODB_TABLE_NAME=mamaai-preview-test
MAMA_AI_ANALYTICS_TABLE_NAME=mamaai-preview-test
MAMA_AI_DYNAMODB_GSI1_NAME=GSI1
AUTH_SECRET=<new random 32+ character Preview-only secret>
MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=false
MAMA_AI_DEMO_MODE=false
MAMA_AI_JUDGE_ACCESS_ENABLED=false
NEXT_PUBLIC_APP_URL=<protected deployment URL after deployment>
```

Do **not** set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, legacy table aliases, Gemini, Razorpay, S3, email/OTP, webhook, deletion, or production variables. Do not manually expose a Vercel OIDC token as an environment variable. The server-side DynamoDB client now uses Vercel's official `awsCredentialsProvider({ roleArn })` in the isolated runtime. It obtains short-lived credentials through `AssumeRoleWithWebIdentity`; a live exchange remains unverified until an approved deployment test.

## IAM review boundary

The described OIDC issuer, audience and subject are consistent with a production deployment in the separate project. The actual attached permissions JSON was not provided to this local repository, so its effective permissions are **unverified**. The initial isolated policy should permit only `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, and `TransactWriteItems` for `mamaai-preview-test`, plus `Query` for `.../index/GSI1`. No production ARN, wildcard, Scan, IAM, S3, KMS, Secrets Manager or table-management permission is required for the initial test scope.

## First-deployment blocker

No code blocker remains for the runtime marker. Before deployment, RBIL must confirm the Vercel OIDC-to-role credential mechanism is available at runtime and review the effective attached policy. Then separately approve deployment. Cloud integration remains untested.
