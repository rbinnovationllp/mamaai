# MAMAAI Phase 2E.3 — Secure Vercel Preview isolation plan

Date: 2026-10-20. This is a plan based on read-only local inspection and the owner-provided authenticated Vercel variable listing. No Vercel values were retrieved, printed, changed, or copied. No AWS account is authenticated, so AWS account permissions, pricing, and existing resources are unverified.

## Decision

**A separate Vercel project is safer for MAMAAI isolated testing.** It provides a distinct environment-variable namespace, project linkage, deployment history, Preview protection configuration, and least-privilege cloud identity boundary. It materially reduces the risk of accidentally attaching a Preview deployment to the existing project’s Production-and-Preview credentials.

Using the existing Vercel project can be made safe only by removing every existing Preview-scoped production value and replacing it with isolated values. It has lower operational overhead but a higher configuration-error risk. It must not be used until all remediation checks below pass.

## Authenticated project finding

The authenticated Vercel project is `rbinnovationllps-projects/mamaai` (`prj_9h5IlJQ0tXf6rI3ckmWd26pFWa6h`), a Next.js project using Node.js 24.x. Its Preview scope currently shares production-sensitive variable categories. **Do not deploy Preview from this project in its current state.**

## Vercel variable matrix

The values were not inspected. “Shared” reflects the owner-provided `vercel env ls preview` output; a variable shown in both Preview and Production is treated as shared even if values happen to differ.

| Variable | Scope observed | Shared with Production | Source use | Infrastructure risk | Required Preview disposition |
|---|---|---:|---|---|---|
| `AWS_ACCESS_KEY_ID` | Preview, Production | Yes | DynamoDB/analytics client | Production AWS access | Remove from existing Preview; in a separate project use Preview-only short-lived identity or OIDC. |
| `AWS_SECRET_ACCESS_KEY` | Preview, Production | Yes | DynamoDB/analytics client | Production AWS access | Remove from existing Preview; never copy Production value. |
| `AWS_REGION` | Preview, Production | Yes | DynamoDB/analytics and planning code | May select production region | Set only to the approved isolated-resource region. |
| `MAMA_AI_S3_BUCKET` | Preview, Production | Yes | No current source reference found | Production object storage | Remove. Add only after a tested Preview-only bucket is approved. |
| `MAMA_AI_S3_PREFIX` | Preview, Production | Yes | No current source reference found | Production object namespace | Remove. |
| `MAMA_AI_EXPORTS_PREFIX` | Preview, Production | Yes | No current source reference found | Production export namespace | Remove. |
| `RAZORPAY_KEY_ID` | Preview, Production | Yes | Razorpay service/diagnostic route | Payment provider access | Remove from Preview. |
| `RAZORPAY_KEY_SECRET` | Preview, Production | Yes | Razorpay service/diagnostic route | Payment provider access | Remove from Preview. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Preview, Production | Yes | Subscription/diagnostic route | Enables client checkout configuration | Remove from Preview. |
| `RAZORPAY_PLAN_STARTER_MONTHLY` | Preview, Production | Yes | Subscription service | Payment-plan invocation | Remove from Preview. |
| `RAZORPAY_PLAN_PREMIUM_MONTHLY` | Preview, Production | Yes | Subscription service | Payment-plan invocation | Remove from Preview. |
| `RAZORPAY_PLAN_PLUS_MONTHLY` | Preview, Production | Yes | Subscription service | Payment-plan invocation | Remove from Preview. |
| `RAZORPAY_PLAN_STARTER_USD` | Preview, Production | Yes | Subscription service | Payment-plan invocation | Remove from Preview. |
| `RAZORPAY_PLAN_PREMIUM_USD` | Preview, Production | Yes | Subscription service | Payment-plan invocation | Remove from Preview. |
| `RAZORPAY_PLAN_PLUS_USD` | Preview, Production | Yes | Subscription service | Payment-plan invocation | Remove from Preview. |
| `razorpay_webhook_secret` | Preview, Production | Yes | Razorpay service | Production webhook verification | Remove from Preview. Also normalize/verify the source’s case-sensitive secret name before any future payment test. |
| `AUTH_SECRET` | Preview, Production | Yes | Session/auth/rate-limit code | Cross-environment token signing | Replace with a new random Preview-only secret. |
| `MAMAAI_JUDGE_TEST_KEY` | Preview, Production | Yes | Judge subscription/diagnostic routes | Test entitlement bypass | Remove from Preview. |
| `MAMA_AI_JUDGE_ACCESS_ENABLED` | Preview, Production | Yes | No current source reference found | Legacy/undeployed bypass configuration | Remove from Preview. |
| `MAMA_AI_DEMO_MODE` | Preview, Production | Yes | No current source reference found | Legacy/demo behavior ambiguity | Remove from Preview. |
| `NEXT_PUBLIC_APP_URL` | Preview, Production | Yes | No current source reference found | Wrong origins/links | Set to the protected generated Preview URL only when known. |
| `MAMA_AI_DYNAMODB_TABLE_NAME` | Not observed in current listing | Unknown | Shared DynamoDB client | Code fallback may select default/production table | Add only in isolated Preview with the exact isolated table name. |
| `MAMA_AI_TABLE_NAME` | Not observed in current listing | Unknown | DynamoDB client/planning code | Code fallback may select default/production table | Add only in isolated Preview with the exact isolated table name. |
| `DYNAMODB_USERS_TABLE`, `DYNAMODB_FAMILIES_TABLE`, `DYNAMODB_MEAL_PLANS_TABLE`, `DYNAMODB_PANTRY_TABLE`, `DYNAMODB_FEEDBACK_TABLE`, `DYNAMODB_ANALYTICS_TABLE` | Not observed | Unknown | Legacy Dynamo repository | Legacy fallback may select production tables | Set to distinct nonexistent `mamaai-preview-deny-*` names and deny them in IAM. |
| `MAMA_AI_ANALYTICS_TABLE` | Not observed | Unknown | Analytics routes | Analytics data mixing | Set to denied sentinel unless that route is explicitly isolated and tested. |
| `MAMA_AI_DYNAMODB_GSI1_NAME` | Not observed | Unknown | CRM/export/subscription/safety repositories | Missing index may cause failed operations | Set only when the isolated table design includes the required GSI; otherwise keep affected routes disabled. |
| `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED` | Not observed | Unknown | Server safety gate | Gemini/Dynamo access if enabled | Explicitly set `false`; do not omit. |
| `GEMINI_API_KEY` | Not observed | Unknown | Ask MAMA and meal-generation routes | Paid AI usage and sensitive prompts | Absent. |
| `MAMA_AI_ALLOW_DEMO_IDENTITY` | Not observed | Unknown | No current source reference found | Legacy identity fallback ambiguity | Do not add. |

## Source-code fallback risks

The source inventory found 85 environment references. The highest-risk paths are:

- `lib/repositories/dynamodb-client.ts` consumes `MAMA_AI_DYNAMODB_TABLE_NAME` and `MAMA_AI_TABLE_NAME`; it must be reviewed under an isolated configuration to confirm a missing variable cannot select a production/default table.
- `lib/repositories/dynamo.ts` consumes multiple legacy `DYNAMODB_*_TABLE` names. All must be denied explicitly in Preview because older routes can use different repository paths.
- `app/api/analytics/track/route.ts`, `app/api/admin/analytics/route.ts`, `lib/fair-use.ts`, and `lib/monthly-memory.ts` read AWS/table configuration outside the main customer repository path.
- `lib/services/razorpay-service.ts` and subscription routes read Razorpay identifiers; absence must be tested to fail closed before Preview is exposed.
- `lib/server/auth.ts`, `lib/auth/session.ts`, and `lib/server/customer-session.ts` depend on `AUTH_SECRET`; Preview must use a separate random value.
- `lib/ai/ask-mama-runtime-safety.ts` uses `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED`; explicitly setting it to `false` is required.

No source references were found for the currently configured S3 prefixes/bucket, demo mode, judge-access flag, `NEXT_PUBLIC_APP_URL`, or `MAMA_AI_ALLOW_DEMO_IDENTITY`. They are stale or handled outside this checkout; do not reproduce them in an isolated Preview without a new source-backed requirement.

## Minimum AWS design

AWS is required only for the synthetic session/customer/family/subscription/safety-report workflows that use DynamoDB. S3 is **not required** for the approved Preview test scope because no active source reference requires the current S3 variables. Do not create a bucket unless a later, specifically approved export workflow requires it.

| Resource | Proposed configuration |
|---|---|
| DynamoDB table | `mamaai-preview-<random-suffix>` |
| Region | Explicit owner-approved region; `ap-south-1` is a candidate only, not verified. |
| Keys | `PK` (String), `SK` (String) |
| TTL | Numeric top-level `expiresAt` enabled |
| Billing | `PAY_PER_REQUEST` |
| Encryption | DynamoDB server-side encryption with AWS-owned key (`AES256`) |
| Indexes | None only if the currently used repositories do not require `GSI1`; otherwise provision precisely the required GSI after source verification. |
| Data | Synthetic prefixes such as `PREVIEW#family-a` and `PREVIEW#family-b`; no customer data. |
| AWS identity | Dedicated Preview-only role/credential, never Production credentials. |

The minimum identity permits only `GetItem`, `PutItem`, `UpdateItem`, and `DeleteItem` on the exact Preview table ARN. Add `Query` only if repository integration tests prove it is required. Do not grant `Scan`, `ListTables`, wildcard table ARNs, S3 access, or IAM administration.

## Safer Vercel option: separate project

Create an independent `mamaai-preview-isolated` Vercel project only after owner approval. Link it to the same repository at an explicitly chosen commit/branch and use an isolated project-level variable namespace. Enable Deployment Protection before first deployment. This avoids accidental inheritance from the existing MAMAAI project.

| Option | Safety | Cost | Complexity |
|---|---|---|---|
| Existing project with Preview cleanup | Moderate only after a two-person scope review | No new project assumed | Lower, but high risk of a missed shared variable |
| Separate Preview project | Stronger variable/project boundary | No paid upgrade assumed; verify account plan | Slightly higher setup effort; recommended |

A separate Vercel project does not isolate AWS by itself. The DynamoDB table and IAM identity must still be separate.

## Owner-approved change procedure — do not execute in this phase

1. Owner confirms an RBIL-owned AWS account and grants a dedicated administrator the authority to create only the specified disposable Preview resources.
2. Owner creates the isolated DynamoDB table and Preview-only identity after a separate approval.
3. Owner creates a separate Vercel project, enables Deployment Protection, and confirms it has no inherited Production variables.
4. Owner sets only the following Preview values: isolated AWS identity, explicit isolated table/region, new `AUTH_SECRET`, `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=false`, and a protected Preview URL once issued.
5. Owner removes/omits all Razorpay, webhook, Gemini, judge, S3, demo, and legacy table credentials in the separate project.
6. Before deploy, a second reviewer compares variable **names and scopes only** against this document. No secret values enter logs or chat.
7. Deploy only after a separate owner approval. First request must verify the Preview safety gate returns its controlled disabled response and that a missing/denied legacy-table path fails closed.
8. Do not enable Ask MAMA or add a Gemini key without a further explicit approval.

## Proposed commands for the next approved phase

These commands are documentation only; do not run them until the owner separately authorizes every mutation and supplies the confirmed account/region/role values.

```powershell
# Read-only preflight after AWS access is established
aws sts get-caller-identity --profile mamaai-preview-admin --output json

# Mutating AWS commands, only after approval
aws dynamodb create-table --table-name <PREVIEW_TABLE> --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE --billing-mode PAY_PER_REQUEST --sse-specification Enabled=true,SSEType=AES256 --region <REGION>
aws dynamodb update-time-to-live --table-name <PREVIEW_TABLE> --time-to-live-specification Enabled=true,AttributeName=expiresAt --region <REGION>

# Vercel commands, only after owner approves a separate project and variables
vercel link
vercel env add <VARIABLE_NAME> preview
vercel deploy
```

## Cost, cleanup, and approvals

No cost was incurred. DynamoDB on-demand cost is driven by requests and storage; eligibility for free-tier allowance and final pricing cannot be verified without AWS account access. A separate Vercel project and Deployment Protection may be available without a paid upgrade, but the team plan must be verified in the dashboard. Gemini remains disabled; the earlier ₹100 operational limit is not an enforceable provider-side cap.

After approved testing: delete the disposable DynamoDB table, remove the Preview AWS identity/policy, delete the isolated Vercel project/deployments, and revoke all Preview-only credentials. Do not point cleanup commands at any existing MAMAAI Production resource.

### Required owner approvals

- RBIL-owned AWS account and isolated-resource creation.
- Exact DynamoDB region, table name, and IAM identity.
- Separate Vercel project creation and Deployment Protection.
- Preview variable creation/removal.
- Protected Preview deployment.
- Synthetic account creation.
- Gemini test key and real Gemini calls, separately.