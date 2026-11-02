# MAMAAI Production Readiness Checklist

Date: 23 October 2026

## Local readiness

- [x] Local unit/security suite passes (34/34).
- [x] Local TypeScript check passes.
- [x] Local production compilation succeeds.
- [x] Local browser suite passes (8/8) at 360, 390, 768 and 1440 pixels.
- [x] Public subscription judge-bypass path removed locally.
- [x] Footer Help route restored locally.

- [x] Phase 2 local Preview/test plans completed; cloud and provider integrations remain unexecuted.

## Required before isolated Preview

- [ ] Recover AWS read-only/least-privilege access and verify the isolated table only.
- [ ] Use a separate Vercel Preview project or fully isolated Preview configuration.
- [ ] Remove all production AWS, Razorpay, email/OTP, S3, webhook and Gemini values from Preview.
- [ ] Provide dedicated Preview AUTH_SECRET and fail-closed isolated table configuration.
- [ ] Create only synthetic test identities after approval.
- [ ] Confirm no legacy fallback can reach production tables/buckets.

## Required before production release

- [ ] Legal/owner approval for privacy, refund, cancellation, export and deletion wording.
- [ ] A functional, audited deletion workflow with approved retention exceptions.
- [ ] Isolated test-mode Razorpay checkout, signature, duplicate-webhook and reconciliation evidence.
- [ ] Real controlled Gemini verification against synthetic allergy profiles and cost limits.
- [ ] Isolated persistence and cross-account authorization evidence.
- [ ] Update stale judge/demo and provider documentation.
- [ ] Security review of all DynamoDB table fallback paths.

## Decision

MAMAAI is suitable for further controlled local/isolated-Preview testing, subject to the listed cloud isolation work. Production release remains blocked by unverified external-service, deletion/retention and documentation-policy requirements.
