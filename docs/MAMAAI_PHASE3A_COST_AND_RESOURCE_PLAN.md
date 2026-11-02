# MAMAAI Phase 3A — Cost and Resource Plan

Date: 23 October 2026

## Planning basis

No billing account, AWS credits, Vercel plan, or provider price was accessed in this phase. Amounts below are planning ranges, not quotations or spend authorizations. DynamoDB on-demand billing charges for requests and storage, so a small synthetic test run is usage-based rather than a fixed server cost. Confirm actual Mumbai-region pricing and account credits in the AWS Billing console before approval. [AWS DynamoDB pricing](https://aws.amazon.com/dynamodb/pricing/)

## Resources

| Resource | Reuse safely? | Proposed action | Cost characteristics | Approval |
|---|---|---|---|---|
| Live `mamaai` Vercel project | No | Keep untouched | Existing cost not assessed | No change authorized |
| New `mamaai-preview-isolated` Vercel project | No | Create after approval | Depends on current team plan and build/function usage | Required |
| Vercel Authentication protection | Yes, as a platform feature after project creation | Enable on the isolated project | Standard protection is documented as available across plans; confirm team entitlement in dashboard | Required |
| `mamaai-preview-test` DynamoDB table | Potentially | Reuse only after read-only schema/IAM verification and GSI decision | On-demand request/storage billing; small synthetic use expected to be low but not guaranteed | Required for any modification/use |
| DynamoDB GSIs | No | Add only after a compatibility decision, or create a fresh compatible test table | Index writes/storage add usage charges | Required |
| Dedicated AWS identity/role | No | Create least-privilege access to the isolated table/indexes only | IAM itself normally has no direct charge; credential misuse creates service-cost risk | Required |
| S3 Preview bucket | No, likely unnecessary for initial tests | Omit unless export/object workflows are explicitly selected | Storage/request/egress usage | Separate approval |
| Gemini Preview key | No | Keep absent for initial deployment; later create/use a restricted test key | Provider/model usage is billable or quota-based; no paid call is authorized | Separate approval, hard budget <= ₹100 |
| Razorpay test credentials | No | Keep absent for initial deployment; later configure separate test-mode account/keys | Provider/account terms must be confirmed | Separate approval |
| Synthetic accounts | Yes, within isolated table | Create only after environment verification | No expected provider cost if no email/OTP service is configured | Required Phase 3B step |

## Expected additional monthly cost

| Phase | Expected incremental cost | Assumptions and limit |
|---|---:|---|
| Protected deployment with no external calls | `₹0` to a small Vercel-plan-dependent amount | No custom domain, no paid Vercel add-on, no production resource reuse. Confirm plan/build allowance first. |
| DynamoDB synthetic test storage/requests | Low, variable usage | On-demand table, a few synthetic households, short retention via `expiresAt`, no backup/export/restore. Do not treat “low” as free. |
| Initial Gemini verification | Maximum **₹100** only after separate written approval | Enforce at most ten small, synthetic prompts and stop on the first unexpected charge/limit signal. This is an operational cap, not a provider-enforced account spending limit. |
| Razorpay test-mode run | To be confirmed | Do not assume zero cost; verify test-mode/account terms before activation. |
| S3/object-export validation | `₹0` if omitted | If included later, cost is storage/request/transfer based and must be separately estimated. |

No AWS-credit balance was verified. Credits may not cover every service, region, request type, transfer, or Vercel charge. Do not rely on credits as a safety control.

## Cost controls

1. Use only one isolated DynamoDB table and only the required GSIs.
2. Set `expiresAt` for synthetic records and manually verify cleanup after the test window.
3. Do not enable S3, Razorpay, email, OTP, or Gemini in the initial Preview deployment.
4. Restrict Preview access to RBIL testers to avoid unplanned requests.
5. Record the test start/end time, request count, and any provider dashboard charges after each approved stage.
6. Remove credentials and delete only approved disposable resources after testing.

## Vercel protection and plan caveat

Vercel documents standard deployment protection/Vercel Authentication for preview deployments, while some stronger methods and add-ons can be plan-specific. Verify the RBIL team’s available protection choice in the Vercel dashboard before selecting it. [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)

## Decision

The lowest-cost safe path is: separate protected Vercel project + existing isolated table **only after** GSI compatibility and fail-closed code are approved. It excludes S3, Gemini, Razorpay, email, and OTP from the first deployment.
