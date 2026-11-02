# MAMAAI Phase 3 — Owner Approval Checklist

Date: 23 October 2026

No action in this checklist has been performed by Phase 3A.

| # | Proposed action | Why it is needed | Expected cost/impact | RBIL approval required? | Rollback/cleanup |
|---:|---|---|---|---|---|
| 1 | Approve local fail-closed Preview-isolation correction | Removes direct fallbacks to `MAMA_AI_APP` / analytics production table and prevents in-memory persistence from validating Preview flows | No cloud cost | Yes | Revert local change before deployment |
| 2 | Read-only AWS verification of `mamaai-preview-test` and preview IAM policy | Confirms table schema, TTL, indexes, account/region, and no production ARNs | No resource change | Yes, if credentials are supplied/interactive login used | Read-only only |
| 3 | Create separate Vercel project `mamaai-preview-isolated` | Keeps Preview variables and deployments independent from the live linked `mamaai` project | Plan/build usage; must be confirmed | Yes | Delete isolated project after testing |
| 4 | Enable Vercel Authentication/Deployment Protection on the isolated project | Restricts Preview to RBIL testers | Plan feature must be confirmed | Yes | Disable/delete isolated project |
| 5 | Create or modify only isolated DynamoDB resources/GSIs after schema review | Enables real persistence and GSI-backed export/safety/subscription tests | On-demand request/storage/index usage | Yes | Delete disposable table/index only after test completion |
| 6 | Create a least-privilege Preview AWS identity/role | Gives deployment access only to isolated table/indexes | IAM direct cost normally none; credential risk is material | Yes | Revoke/delete identity/role and credentials |
| 7 | Set Preview-only environment variables | Connects isolated deployment without production fallback | No direct cost | Yes | Remove Preview variables |
| 8 | Create two synthetic customer households | Enables session, family, and isolation tests | No expected external cost with integrations disabled | Yes | Delete synthetic records/sessions |
| 9 | Enable Gemini in Preview | Tests real model response safety | Hard operational limit ₹100; exact provider cost must be checked first | Separate explicit approval | Remove key/gate and revoke test key |
| 10 | Enable Razorpay test mode | Tests subscription creation/webhook flows | Provider terms/charges must be verified | Separate explicit approval | Remove keys/webhook; cancel only test subscriptions |
| 11 | Enable S3/export storage | Tests real export file storage/download | Storage/request/transfer usage | Separate explicit approval | Delete isolated objects/bucket only |
| 12 | Run account deletion | Tests retention/deletion implementation | Destructive to test data | Separate explicit approval after retention review | Use disposable synthetic data only |

## Configuration required for the first isolated deployment

Required, Preview-only:

- `AUTH_SECRET`: newly generated, unique to Preview.
- `AWS_REGION=ap-south-1` only after account/region verification.
- `MAMA_AI_DYNAMODB_TABLE_NAME=mamaai-preview-test` only after the table schema is confirmed compatible.
- The required GSI names only after those indexes exist in the isolated table.
- Application URL set to the protected generated Preview URL.
- Explicit false/disabled feature controls for Ask MAMA, demo mode, and judge access, where supported.

Must be absent from first Preview deployment:

- `MAMA_AI_TABLE_NAME` and `MAMA_AI_ANALYTICS_TABLE` production fallback names.
- Production AWS keys, production S3 bucket/prefixes, production `AUTH_SECRET`.
- All Razorpay keys, plan IDs, and webhook secret.
- Gemini key.
- Email/OTP/webhook provider credentials.
- Judge or bypass keys.

## Permissions required

- Vercel: RBIL team member who can create a project, set Preview-only variables, and configure Deployment Protection.
- AWS: a principal able to create or validate only the isolated DynamoDB table/indexes and attach a policy restricted to their exact ARNs. No production-table permission.
- Razorpay/Gemini: only for their separately approved test stages.

## Required decision before Phase 3B

Approve **all of 1–8** only if RBIL accepts the separate-project design, the Preview fail-closed correction, and the stated limited scope. Items 9–12 remain separate approval gates.

Phase 3A recommends a separate Vercel project. It is safer than using the live project because earlier Vercel inventory showed shared Preview/Production infrastructure variables. The isolated project keeps the live deployment, live variables, and test project boundary distinct.
