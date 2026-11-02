# MAMAAI QA Remediation Implementation

Date: 23 October 2026

## Implemented in this local change set

| Defect | Root cause | Files | Implementation | Test result |
|---|---|---|---|---|
| P1-02 public evaluator bypass | The public subscription page sent `judgeBypassKey`, and the plans route recognized it. | `app/subscription/page.tsx`, `app/api/subscriptions/plans/route.ts`, `lib/shared/schemas.ts` | Removed the public modal/handler, server bypass response and schema field. Normal plan resolution remains. | 34 unit/security tests pass. |
| P1-04 broken Help link | Footer pointed to a missing route. | `app/help/page.tsx` | Added Help & Support content using existing footer contacts and no new commercial commitment. | Browser and security route checks pass. |

## Intentionally not implemented

- Automated account deletion: blocked by retention, durable session revocation lookup and legal-policy approval.
- Real Gemini recovery/retry validation: requires owner-approved controlled API budget and isolated accounts.
- Payment activation: no Razorpay test checkout was initiated.
- Database schema/index changes: no cloud resources were created or modified.

## Preserve-before-release work

1. Remove or rewrite obsolete judge-access instructions in README and PROJECT_STATUS.
2. Reconcile policy text with the actual export/deletion workflow and approved retention policy.
3. Complete isolated Preview verification with a separate Vercel project, isolated DynamoDB table/credentials and disabled payment/email/webhook paths.
4. Add real test-mode Razorpay webhook and account-isolation tests only after owner approval.
