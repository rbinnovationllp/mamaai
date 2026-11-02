# MAMAAI Phase 3B.2 cost approval

## Cost status

AWS/Vercel account pricing and entitlements were not queried. Values below are estimates, not quotes.

| Item | Expected cost driver | Status |
| --- | --- | --- |
| DynamoDB on-demand table | requests and storage | Very low for two synthetic households; account-specific price not verified. |
| GSI1 | indexed storage and writes | Additional request/storage cost; required for tested repository queries. |
| IAM identity/policy | IAM itself | Usually no direct IAM charge; credential-management controls may have operational cost. |
| Vercel project/protection | plan entitlement | Unknown; verify RBIL plan before creation. |
| Function logs | Vercel/AWS retention and ingestion | Unknown; retain minimally and redact sensitive values. |
| Gemini/Razorpay/S3/email | provider use | Disabled for initial deployment; zero intended usage. |

No enforceable spending limit is supplied by this plan. RBIL must approve the applicable account cost exposure before provisioning.
