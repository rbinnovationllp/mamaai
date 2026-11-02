# MAMAAI Security and Payment Review

Date: 23 October 2026

## Confirmed controls

- Customer-facing Razorpay creation requires `requireUser`.
- Verification rejects a client user ID that differs from the verified identity and resolves plan data from the provider subscription.
- Webhooks verify signatures and use repository-backed idempotency keys.
- Ask MAMA has per-IP and per-user durable rate limiting and fails closed on rate-limit storage errors.
- Food-specific Ask MAMA fallbacks fail closed when Gemini is unavailable or output is invalid.
- Public judge bypass code was removed from the subscription UI, API and request schema.

## Remaining security blockers

| Area | Risk | Required action |
|---|---|---|
| DynamoDB Preview | Multiple modules retain fallback table names. | Provision and configure isolated resources; prove no production fallback in Preview. |
| Razorpay | Local code inspection cannot prove provider-to-account reconciliation. | Use synthetic account and test-mode webhook in isolated Preview. |
| Account deletion | Current flow does not delete data. | Approve legal retention and implement a durable, auditable deletion workflow. |
| Documentation | Legacy judge/demo text can mislead operators. | Owner-approved documentation cleanup. |
| Real AI | Local mocks do not prove provider availability/cost behavior. | Controlled Gemini test budget and Preview safety gate verification. |

No secrets, payment values, AWS credentials or production data were printed or changed in this audit.
