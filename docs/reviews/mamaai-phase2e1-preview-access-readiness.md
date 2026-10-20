# MAMAAI Phase 2E.1 — Cloud access verification and isolated Preview readiness

Date: 2026-10-20. This phase used local and read-only CLI inspection only. No cloud resource, IAM policy, Vercel setting, deployment, Gemini request, payment operation, production record, credential, commit, or push was changed.

## Readiness decision

**Not ready to provision the isolated Preview environment.** The local application and browser suite are ready, but AWS identity and live Vercel project access remain unverified. Provisioning must wait for owner authentication and a read-only confirmation of the intended account/project configuration.

## AWS verification

| Check | Result |
|---|---|
| AWS CLI v2 | Installed at the current-user path; version `2.38.2`. |
| Authenticated AWS profile | Not present. No current-user `.aws/config` file or profile was found. |
| Account ID / identity type | Unverified because no authenticated profile exists. |
| Region | Unverified. `ap-south-1` is only the application fallback, not cloud-account evidence. |
| Read-only DynamoDB permissions | Unverified. |
| Proposed isolated DynamoDB table | Unverified; it cannot be listed or described without authenticated read-only access. |

Do not create access keys or use root credentials. The owner should authenticate an existing IAM Identity Center or least-privilege read-only identity, for example:

```powershell
& "$env:LOCALAPPDATA\Programs\Amazon\AWSCLIV2\aws.exe" configure sso --profile mamaai-readonly
& "$env:LOCALAPPDATA\Programs\Amazon\AWSCLIV2\aws.exe" sso login --profile mamaai-readonly
```

After the owner completes the browser login, only these read-only checks are needed:

```powershell
aws sts get-caller-identity --profile mamaai-readonly --output json
aws dynamodb list-tables --region <owner-confirmed-region> --profile mamaai-readonly --output json
aws dynamodb describe-table --table-name <confirmed-preview-table> --region <owner-confirmed-region> --profile mamaai-readonly
```

## Vercel verification

| Check | Result |
|---|---|
| Vercel CLI | Installed: `58.9.5`. |
| Local repository linkage | Locally linked to MAMAAI according to the prior Phase 2C reports. |
| Live CLI authentication | Unverified. The read-only `vercel whoami` / Preview environment listing did not complete and was stopped; no login or setting was changed. |
| Preview variable names and scopes | Unverified. |
| Deployment Protection | Unverified in the live project/dashboard. |
| Production/Preview isolation | Unverified until Preview-scoped variable names and inheritance are inspected. |

The owner should run `vercel login` interactively from `C:\Users\HP\mamaai`; do not paste a token into chat, project files, or environment files. After login, inspect only:

```powershell
vercel whoami
vercel env ls preview
```

Deployment Protection and plan availability require an owner dashboard check. No deployment is authorized by this phase.

## Preview security readiness

The required safe Preview design remains the Phase 2C.1 plan:

- One disposable on-demand DynamoDB table using `PK`, `SK`, and numeric `expiresAt` TTL.
- Preview-only least-privilege credentials restricted to that exact table ARN.
- A new Preview-only `AUTH_SECRET`.
- `MAMA_AI_DYNAMODB_TABLE_NAME` and `MAMA_AI_TABLE_NAME` set only to the isolated table.
- Legacy `DYNAMODB_*_TABLE` values set to denied Preview-only sentinel names.
- Razorpay, webhooks, email/OTP, RevenueCat, and Gemini credentials unset in Preview.
- `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED` unset or `false` initially.
- Vercel Preview access protected before sharing any URL.
- Only synthetic Family A (milk allergy) and Family B (peanut allergy) records used after approval.

Until AWS and Vercel verification is complete, none of these controls can be confirmed as active. The existing public MAMAAI deployment remains unchanged.

## Browser-suite timeout

The prior timeout was **a local test-design defect**, not a reproduced product defect. The former test combined direct subscription, a footer privacy-link click, language selection, and mobile family navigation into one development-server test. Its footer navigation wait consumed the entire test budget.

The local readiness test now independently verifies:

- direct subscription rendering;
- the footer privacy link target and direct `/privacy` route;
- language selection;
- the mobile family-entry link target, deliberately recorded as authentication-blocked rather than treated as public workflow.

Result: **8 passed, 0 failed, 0 skipped** in Chromium with one worker. This includes 360, 390, 768, and 1440 pixel public-layout checks plus the direct subscription diagnostics.

Evidence:

- `C:\Users\HP\rbil-testing\local-mamaai-readiness-report\index.html`
- `C:\Users\HP\rbil-testing\local-mamaai-readiness-results\results.json`
- `C:\Users\HP\rbil-testing\subscription-production-report\index.html`
- `C:\Users\HP\rbil-testing\subscription-production-results\results.json`

## Required owner approvals

| Action | Current status | Owner approval needed |
|---|---|---|
| Authenticate read-only AWS profile | Blocked | Yes |
| Authenticate Vercel CLI | Blocked | Yes |
| Inspect live Preview scopes/protection | Blocked until login | Yes, read-only inspection |
| Create isolated DynamoDB table and TTL | Not started | Separate explicit approval |
| Apply Preview-only IAM access | Not started | Separate explicit approval |
| Set Preview variables/protection | Not started | Separate explicit approval |
| Deploy protected Preview | Not started | Separate explicit approval |
| Create synthetic accounts | Not started | Separate explicit approval |
| Enable Gemini / Ask MAMA | Not started | Separate explicit approval; Gemini calls require their own approval |

## Cost and cleanup

No cost was incurred in this phase. The proposed disposable DynamoDB table uses on-demand billing, so cost is usage-based and requires the owner to verify account/free-tier status. No Vercel plan upgrade should be assumed. Gemini remains capped by the prior operational plan at ₹100 only after separate approval; a budget alert is not a hard spending limit.

After approved testing, delete the isolated DynamoDB table, remove Preview-only variables and IAM access, delete the Preview deployment, and remove synthetic records if the table is retained temporarily. Do not use cleanup commands against production resources.
## Addendum — authenticated Vercel inspection

Authenticated inspection on 2026-10-20 confirmed the local project is `rbinnovationllps-projects/mamaai` (project ID `prj_9h5IlJQ0tXf6rI3ckmWd26pFWa6h`) using Next.js and Node.js 24.x.

**Preview is not isolated and must not be deployed in its current state.** Preview and Production are both assigned the following categories of variables:

- AWS access credentials and region;
- S3 bucket and export prefixes;
- Razorpay keys, plan identifiers, and webhook secret;
- the judge test key and judge-access flag;
- `AUTH_SECRET`, demo mode, and application URL values.

This creates a credible risk that a Preview deployment could access production AWS/S3 data, invoke payment configuration, accept a production webhook secret, or share production authentication behavior. The variable values were not recorded, copied, or changed.

### Revised decision

The application is **not ready for isolated Preview provisioning or deployment**. AWS CLI access is still unavailable because RBIL has no AWS account or delegated read-only identity on this computer, and the Vercel variable scopes show Preview is currently coupled to Production.

### Required approval boundary before any Preview deployment

An owner with AWS and Vercel administration must approve and perform all of the following as a coordinated change:

1. Establish RBIL-owned AWS access and an isolated DynamoDB/S3 environment, or explicitly choose a different approved isolated persistence provider.
2. Replace every Preview-scoped production credential with a Preview-only value or remove it. This includes AWS, S3, Razorpay, webhook, judge-access, authentication, demo-mode, and app-URL variables.
3. Leave all Razorpay keys, plan IDs, and webhook secrets absent in Preview until a separate payment-test authorization exists.
4. Disable judge access and Ask MAMA in Preview until their isolated dependencies and safety gate are verified.
5. Set a new Preview-only `AUTH_SECRET`, isolated table/bucket names, denied legacy table sentinels, and a protected Preview URL.
6. Enable and verify Vercel Deployment Protection before any preview URL is shared.

No cloud change was performed in this phase.