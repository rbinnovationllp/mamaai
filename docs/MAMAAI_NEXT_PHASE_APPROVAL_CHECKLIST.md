# MAMAAI next-phase approval checklist

Date: 23 October 2026

## Already completed and verified locally

- Phase 2 deterministic food-safety and Ask MAMA mock regression coverage.
- Durable customer-session interface/mock coverage and verified-identity route coverage.
- Phase 3B.1 Preview/test DynamoDB guard with synthetic negative tests.
- Generated-artifact lint correction: `npm run lint` is clean.
- Unit suite: 42 passed, 0 failed, 0 skipped.
- TypeScript: passed.
- Earlier production build: passed.
- Earlier local Playwright: 13 passed, 0 failed, 0 skipped across 320–1440px.

## RBIL approval required before any cloud action

| Action | Why approval is required | Safe boundary |
| --- | --- | --- |
| Add `GSI1` to `mamaai-preview-test` or create an equivalent isolated table | Cloud resource modification | Isolated Preview table only; no production-table ARN. |
| Create/use a dedicated Preview AWS role or IAM identity | Credential and IAM change | Least privilege to isolated table and GSI1 only; no long-lived access keys unless separately approved. |
| Create `mamaai-preview-isolated` Vercel project | New cloud project | Deployment Protection enabled; separate from live project. |
| Add Preview-only variables | Cloud configuration change | Explicit isolated table/region/scope, fresh auth secret; omit production payment, email, webhook, S3 and Gemini values. |
| Deploy Preview | External execution | Protected URL and synthetic data only. |
| Create two synthetic accounts / records | State change | Fictional identities only. |
| Enable Ask MAMA / real Gemini calls | Cost and AI-data processing | Gate initially closed; capped, synthetic prompts only. |
| Test Razorpay or OTP/email | External side effects | Separate test-mode plan and approval. |

## Cloud-side verification still required

1. Vercel Preview has no inherited Production AWS, Razorpay, S3, email, OTP, webhook, Gemini, demo, or judge credentials.
2. Dedicated identity can query/write only the isolated table/index and receives `AccessDenied` for production resources without probing customer data.
3. Missing Preview configuration produces controlled application failures.
4. GSI1 matches repository key patterns and contains only synthetic test records.
5. Protected Preview access is restricted to RBIL testers.
6. Session expiry/revocation, customer isolation, export, safety review and error paths work against the isolated environment.

## Evidence still needed

Place the original consultant evidence as `C:\Users\HP\mamaai\audit-input\MAMAAI_QA_Audit.zip` and provide the earlier 27-issue reconciliation prompt or its issue list. This is needed to perform the requested one-by-one reconciliation without fabricating issue identifiers or results.

## Commercial-launch blockers

- Complete consultant-evidence reconciliation.
- Complete protected isolated Preview and synthetic end-to-end verification.
- Resolve/retire legacy split-table repository paths before claiming single-table persistence coverage.
- Obtain business/legal decisions for deletion, retention, refunds, support escalation and payment activation.
- Complete approved payment, account-recovery, real-AI, monitoring, accessibility and security review work.

**Current decision: no commercial launch and no cloud deployment without the approvals above.**
