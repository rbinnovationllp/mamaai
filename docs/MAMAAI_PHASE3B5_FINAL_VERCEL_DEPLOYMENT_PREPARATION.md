# MAMAAI Phase 3B.5: final Vercel deployment preparation

## Readiness: NOT READY for deployment

The local implementation and quality checks are ready. Deployment is blocked because this checkout is currently linked to the live Vercel project, `rbinnovationllps-projects/mamaai`, rather than `mamaai-preview-isolated`.

Read-only Vercel inspection also confirmed that the live project's Production/Preview scopes contain static AWS credentials, Razorpay variables, S3 configuration, and other production variables. Those must never be copied to the isolated project.

## Verified local security behavior

- The isolated runtime uses `awsCredentialsProvider({ roleArn })` from the official Vercel provider.
- `AWS_ROLE_ARN`, isolated identity scope, region, both table names, and GSI1 are required before an isolated client can be created.
- Static `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are rejected.
- Known production tables and legacy fallback aliases are rejected.
- A provider-construction failure blocks creation of the DynamoDB client.
- The live production runtime retains its established default credential behavior when `MAMA_AI_ISOLATED_PREVIEW` is absent.

Local tests mock the provider. They do **not** prove live Vercel-to-AWS role assumption.

## Required isolated-project Production variables

```ini
MAMA_AI_ISOLATED_PREVIEW=true
MAMA_AI_AWS_IDENTITY_SCOPE=preview-isolated
AWS_REGION=ap-south-1
AWS_ROLE_ARN=arn:aws:iam::624719611353:role/MAMAAI-Vercel-Preview-Role
MAMA_AI_DYNAMODB_TABLE_NAME=mamaai-preview-test
MAMA_AI_ANALYTICS_TABLE_NAME=mamaai-preview-test
MAMA_AI_DYNAMODB_GSI1_NAME=GSI1
AUTH_SECRET=<new isolated random secret, at least 32 characters>
MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=false
MAMA_AI_DEMO_MODE=false
MAMA_AI_JUDGE_ACCESS_ENABLED=false
NEXT_PUBLIC_APP_URL=<actual protected deployment URL>
```

Do not define `VERCEL_ENV`; Vercel sets it. Do not define static AWS keys, legacy table aliases, Gemini, Razorpay, RevenueCat, S3, email/OTP, webhook, deletion, admin, judge, or production-project variables. The installed provider reads the Vercel Function OIDC token from the function request context/token source and needs no manually supplied OIDC token variable.

## IAM policy boundary

The approved minimum policy in `MAMAAI_PHASE3B4_OIDC_AND_IAM_DEPLOYMENT_GATE.md` covers the current runtime operations: `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, and `TransactWriteItems` on the table plus `Query` on GSI1. It intentionally excludes production resources, wildcard resources, static identities, Scan, batch operations, and table management.

## Deployment Protection: owner verification steps

1. In Vercel, switch to `rbinnovationllps-projects` and open **mamaai-preview-isolated**.
2. Open **Settings → Deployment Protection**.
3. Enable protection for Production deployments before creating one.
4. Choose the RBIL-authorized tester access mode and verify an unauthenticated browser cannot open the deployment.
5. Record the protected deployment URL; use that exact URL for `NEXT_PUBLIC_APP_URL`.
6. Confirm the live **mamaai** project settings remain unchanged.

## Safe Git-to-Vercel procedure after RBIL approval

1. Do not push `main`; the remote `origin` is `https://github.com/rbinnovationllp/mamaai.git` and this checkout is currently linked to the live project.
2. Create a dedicated deployment branch only after review, for example `codex/mamaai-isolated-preview`.
3. In a separate clean checkout or deployment worktree, link only to `mamaai-preview-isolated` using Vercel's interactive project-link flow. Verify `.vercel/project.json` names the isolated project before any deploy command.
4. Configure only the listed Production variables in the isolated project; verify names and scopes without copying values from the live project.
5. Confirm Deployment Protection.
6. Deploy the reviewed branch only to the isolated project. Do not use the current live-linked checkout to deploy.
7. Verify the resulting deployment URL and run the authorized synthetic smoke test.

## First cloud smoke test, after separate authorization

Use only two synthetic customer identities and a unique run prefix, for example `TESTRUN#<random-id>`.

1. Open the protected isolated URL and confirm the application loads with disabled integrations still unavailable.
2. Authenticate only synthetic users through the approved test path.
3. Perform a minimal authorized DynamoDB write and read for Family A; verify the generated `PK`/`SK` starts with the test-run prefix.
4. Create one safety report fixture and query it through GSI1.
5. Attempt a controlled request selecting `MAMA_AI_APP`; expect the application configuration guard to reject it before a database request.
6. Confirm no Razorpay, Gemini, S3, webhooks, email/OTP, judge, admin metrics, or deletion operation is reachable.
7. Delete only records with the test-run prefix and verify they are gone. Do not touch any other item.
8. Capture the result, AWS request identifiers, and Vercel logs with no tokens or personal data.

## Final local evidence

- `npm run lint`: 0 errors; one existing image-optimization warning.
- `npm test`: 47 passed, 0 failed, 0 skipped.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed.
- Local Playwright readiness suite: 13 passed, 0 failed.

## Required RBIL approvals

1. Authorize a separate checkout/project linkage to `mamaai-preview-isolated`.
2. Authorize isolated-project Production environment-variable creation.
3. Confirm Deployment Protection is enabled.
4. Authorize the first protected deployment.
5. Authorize the synthetic cloud smoke test.

No production deployment, cloud configuration change, push, commit, customer-data access, payment operation, Gemini call, or real account creation occurred in this phase.
