# MAMAAI Phase 2 Payment Test Plan

Date: 23 October 2026

## Code-reviewed controls

- Subscription creation calls `requireUser` and sends the verified user ID to the server service.
- Verification rejects a conflicting client-supplied user ID and resolves the plan from provider subscription data.
- Webhooks require signature validation and repository-backed idempotency.
- Cancellation first checks ownership of the subscription record.
- The former public judge bypass was removed locally.

## Test-mode plan (not executed)

Use only two synthetic households and Razorpay test credentials in isolated Preview:

1. Unauthenticated create: expect 401.
2. Household A test checkout: provider subscription notes and local record map only to A.
3. Forged A-as-B verification body: expect 403.
4. Invalid webhook signature: expect 401.
5. Valid simulated activation: one active entitlement for A.
6. Duplicate event: acknowledged as duplicate; no second entitlement/payment record.
7. B cancellation of A subscription: denied.
8. A cancellation: test-mode provider call only after explicit approval.
9. Expired/cancelled event: entitlement removed according to provider state.

## Pricing and commercial boundary

UI and plan resolver show Starter INR 399 / USD 4.99, Premium INR 599 / USD 7.99 and Family Plus INR 999 / USD 12.99. No price, trial, payment, refund or cancellation behavior was changed. Displayed terms must be reconciled with approved commercial policy before test-mode checkout.

## Approval required

Owner approval for Razorpay test credentials, a non-production webhook URL, synthetic accounts and any test subscription/cancellation. No financial transaction has been performed.
