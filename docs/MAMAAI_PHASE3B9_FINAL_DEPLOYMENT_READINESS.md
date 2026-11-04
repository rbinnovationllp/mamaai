# MAMAAI Phase 3B.9 — Final Deployment Readiness

Date: 2026-10-24

## Scope and boundary

This report covers `C:\Users\HP\mamaai-preview-isolated` and `rbinnovationllps-projects/mamaai-preview-isolated`. No deployment, cloud configuration change, AWS access, production-data access, Git commit, or push was performed.

## Local quality evidence

| Check | Result | Evidence |
|---|---:|---|
| Unit tests | 47 passed, 0 failed, 0 skipped | Phase 3B.8 local result |
| TypeScript | Passed | Phase 3B.8 local result |
| ESLint | 0 errors, 1 non-blocking image warning | Phase 3B.8 local result |
| Production build | Passed | RBIL ordinary PowerShell |
| Local Playwright readiness | 13 passed, 0 failed | RBIL ordinary PowerShell, 1.9 minutes |

The Playwright suite covered direct subscription routes, plan preservation on refresh, keyboard and browser-back navigation, responsive widths from 320px through 1440px, homepage plan journeys, legal routes, language controls, help, and mobile Ask MAMA controls.

Codex sandbox execution was blocked from creating `.next\dev` by `EPERM`. That is a sandbox filesystem restriction, not a Playwright failure. RBIL PowerShell execution is the authoritative Playwright evidence.

## NODE_ENV warning

Next.js reported a non-standard `NODE_ENV` from the local process environment. Repository inspection found no application assignment of a non-standard value; code intentionally uses `production` and `test` for runtime checks. The likely source is the host shell or automation environment. No change was made because changing it without identifying the host-level cause could alter Next.js runtime behavior.

## Isolated linkage

`.vercel/project.json` identifies only `mamaai-preview-isolated` with project ID `prj_NQcC4LtOVDZtBNr5lxzdzfQTy8kv` and RBIL's team ID. The checkout has no Git hook directory and no executable deployment hook was found. The original `C:\Users\HP\mamaai` checkout and its Vercel linkage were not modified.

## DynamoDB and OIDC safeguards

`MAMA_AI_ISOLATED_PREVIEW=true` selects the isolated runtime before normal production-runtime detection. It requires explicit region, role ARN, table values, GSI name, and `preview-isolated` scope. It rejects static AWS keys and known production tables. The server DynamoDB client selects `@vercel/oidc-aws-credentials-provider` with the validated role ARN. Local regression tests cover missing configuration, missing role ARN, static credentials, production tables, and OIDC-provider failure.

## Vercel manual verification required

The sandbox Vercel CLI cannot use RBIL's authenticated Vercel session (`fetch failed`), so these cloud facts are not independently verified here. In the isolated project's **Production** environment, verify these 12 names and intended values:

```text
MAMA_AI_ISOLATED_PREVIEW=true
MAMA_AI_AWS_IDENTITY_SCOPE=preview-isolated
AWS_REGION=ap-south-1
AWS_ROLE_ARN=arn:aws:iam::624719611353:role/MAMAAI-Vercel-Preview-Role
MAMA_AI_DYNAMODB_TABLE_NAME=mamaai-preview-test
MAMA_AI_ANALYTICS_TABLE_NAME=mamaai-preview-test
MAMA_AI_DYNAMODB_GSI1_NAME=GSI1
AUTH_SECRET=<new isolated-only 32+ character secret>
MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=false
MAMA_AI_DEMO_MODE=false
MAMA_AI_JUDGE_ACCESS_ENABLED=false
NEXT_PUBLIC_APP_URL=https://mamaai-preview-isolated.vercel.app
```

Confirm the absence of static AWS keys, Razorpay, Gemini, S3, email/OTP, webhook, and legacy production DynamoDB variables. RBIL has stated that Vercel Authentication is set to **All Deployments**; confirm there is no unprotected custom domain, public exception, or shareable bypass.

## First deployment after explicit RBIL approval

1. Confirm the checklist in `mamaai-preview-isolated` only.
2. From `C:\Users\HP\mamaai-preview-isolated`, confirm `.vercel\project.json` names `mamaai-preview-isolated`.
3. Run:

```powershell
vercel --prod --scope rbinnovationllps-projects
```

4. Confirm the generated URL is protected before use.
5. Do not enable Ask MAMA, payments, Gemini, S3, email/OTP, webhooks, judge access, or deletion.

## Synthetic cloud smoke test

Use only Family A (milk allergy) and Family B (peanut allergy), each with a new synthetic identity.

1. Verify OIDC-backed session creation and verification through the deployed server.
2. Create/read synthetic profiles in `mamaai-preview-test` only.
3. Exercise a GSI1-backed synthetic record query.
4. Test cross-family denial only through application APIs; do not probe production tables.
5. Test logout revocation and expired-session rejection.
6. Confirm Ask MAMA, Razorpay, Gemini, S3, email/OTP, webhooks, judge access, and deletion remain disabled.
7. Delete only the synthetic records using the isolated-table cleanup procedure.

## Readiness result

**NOT READY for first deployment approval.** Local quality and fail-closed isolation code are verified. RBIL must manually confirm isolated Vercel Production variables, domain assignment, Deployment Protection, and forbidden-variable absence. OIDC/DynamoDB integration remains unverified until an approved protected deployment and synthetic smoke test.
