# MAMAAI third-party P0 remediation

**Review source:** `E:\MamaAI Review\MAMAAI_Product_Review_Detailed.pdf` (18 pages, reviewed 20 October 2026)

## Scope and verification boundary

This local batch addresses the review's launch-critical trust, safety, abuse-prevention, branding and unsupported-pet claims. It did not deploy code, invoke Gemini, access production data, create AWS/Vercel resources, alter payments or subscriptions, or commit/push. Passing local tests do not establish production readiness.

## Recommendation matrix

| PDF finding | Status | Local implementation and evidence | Owner/cloud decision still required |
|---|---|---|---|
| p. 5–7: compact language control, readable header, clear daily-meal CTA, accessible mobile navigation | Implemented locally | `app/page.tsx` uses the compact language selector, nonwrapping desktop nav, and prominent Plan Today’s Meal CTA. Existing `MobilePrimaryNav` supplies a five-item mobile navigation bar. | Browser validation needs a running isolated local/preview build. |
| p. 5–7: floating Ask MAMA must not overlap content | Implemented locally | Removed the page-specific duplicate launcher. The global `AskMamaLauncher` remains positioned above the mobile navigation. | Verify at 360/390/768/1440 in a running build. |
| p. 5–7: branding, non-placeholder feature icons, equal cards, pricing periods and plan actions | Partially implemented | `MAMAAI` is now consistently named in metadata/home header; feature labels use meaningful emoji; feature grid cards share grid row height; all plan prices state `/month`; homepage cards link individually to subscription. The existing subscription page retains its 3-day trial disclosure and individual action buttons. | Final visual/design review, legal/commercial approval of trial wording. |
| p. 5–7: stop unsupported pet-plan claims | Implemented locally | Public copy now says pet-food planning/advice is unavailable. Ask MAMA already rejects pet-feeding requests; the disclaimer repeats the limit. | Review paid-plan wording/contract impact before a release. |
| p. 8–9: deterministic food safety, structured AI, prompt-resistance | Implemented in earlier Phase 2A–2B.3 and regression-tested | Existing taxonomy, validator, meal-generation enforcement, structured Ask MAMA response validation and Preview safety gate remain in place. Current suite exercises aliases, Hindi/Kannada, Jain/fasting, child hazards, malformed output and injection. | Real isolated Gemini and browser/integration testing remain required. |
| p. 8: rate limiting/cost containment | Partially implemented locally | New `lib/server/durable-rate-limit.ts` uses conditional DynamoDB updates, per-IP and per-user Ask MAMA limits, hashes keys, and fails closed if the durable store is unavailable. Feedback reports also have a per-user durable limit. | Per-plan quotas and cost telemetry need approved entitlement definitions, durable operational telemetry and an isolated deployment configuration. |
| p. 9: visible disclaimer and report-a-problem workflow | Partially implemented locally | New food/health disclaimer route and footer link. `FamilyFlow` has a Report a problem control; `/api/feedback` now requires authenticated durable storage, accepts a limited category and returns failure rather than claiming a session-only save. | A review queue, staff workflow, retention policy and deployed DynamoDB permissions are required. The present button records an `unsafe_or_inaccurate` category; it does not collect optional user narrative. |
| p. 10/15: privacy, terms, refund/cancellation, delete/export | Partially implemented locally | Added `/privacy`, `/terms`, `/refund-policy`, `/disclaimer`, `/account/delete`, `/account/export` and footer links. Text describes observed implementation and avoids invented promises. Delete/export pages explicitly state the operation is not enabled. | Legal review and approved retention/refund/cancellation/deletion/export operating procedures before release. Functional delete/export is not implemented. |
| p. 10: secure sessions/auth isolation | Implemented locally in earlier Phase 2B | Opaque server-validated/revocable customer sessions and protected routes were implemented and covered by existing tests. | Needs isolated DynamoDB/Vercel verification before any production claim. |
| p. 15: subscription-plan limits | Deferred | No entitlement, price or payment behavior was changed. | Owner must approve plan-specific AI quotas and the customer-facing limit disclosures. |
| p. 15: analytics/monitoring | Deferred | No analytics events or sensitive request logging were introduced. | Define privacy-minimizing operational metrics, retention, access control and alerting. |

## Exact source changes

- `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/refund-policy/page.tsx`, `app/disclaimer/page.tsx`: truthful legal/trust pages.
- `app/account/delete/page.tsx`, `app/account/export/page.tsx`: explicit request/information pages which intentionally do not perform deletion/export.
- `components/LegalDocument.tsx`, `components/Footer.tsx`: shared legal layout and discoverable links.
- `lib/server/durable-rate-limit.ts`: DynamoDB conditional-counter limiter with hashed identities and fail-closed storage behavior.
- `app/api/ask-mama/route.ts`: 20 requests/minute per IP and 10/minute per authenticated customer by default. Values are server environment overrides, not customer plan entitlements.
- `app/api/feedback/route.ts`, `lib/shared/schemas.ts`, `lib/repositories/family-learning-repository.ts`, `components/FamilyFlow.tsx`: authenticated, durable and rate-limited problem reporting with minimal category/review metadata.
- `app/page.tsx`, `app/layout.tsx`, `lib/i18n.ts`: local UI/copy corrections and explicit removal of pet-food claims.
- `tests/security.test.cjs`: regression checks for durable limits, reporting, legal routes and disclaimer wording.

## Verification

| Command | Result |
|---|---|
| `npm test` | Pass — 29 tests, 0 failures, 0 skipped |
| `npm run test` | Pass — 29 tests, 0 failures, 0 skipped |
| `npm run lint` | Pass — no output/errors |
| `npx tsc --noEmit --pretty false` | Pass — no output/errors |
| `npm run build` | Pass — clean rerun compiled successfully and emitted `.next/BUILD_ID`. The earlier hung local build was stopped before the clean rerun. |
| Playwright layout checks | Not run for this local source batch. The central suite targets `https://mamaai.in`, which would test the deployed public build rather than these un-deployed changes. |

## Deployment requirements and rollback

Before any preview deployment, configure an isolated table and ensure its role grants conditional `UpdateItem`/`PutItem` only for that isolated table. Set a strong `MAMA_AI_RATE_LIMIT_SALT` and explicit appropriate limits. Missing DynamoDB configuration intentionally causes protected AI/report writes to fail closed. Preview must keep Ask MAMA disabled until the earlier Phase 2B.3 gate is explicitly configured and tested.

Rollback is a source rollback of the files above. Do not remove a live rate limiter unless a tested alternative is ready: otherwise AI traffic could become unbounded. Reverting the feedback route restores its earlier unsafe “saved for this session” claim and is not recommended.

## Remaining production risks and unimplemented review recommendations

1. Legal approval has not occurred. The new documents are implementation descriptions, not final legal policies.
2. Functional account export/deletion, its retention inventory, identity verification and audit process are unimplemented.
3. Per-plan AI entitlement limits, cost telemetry, spend caps and reviewer workflow are unimplemented pending commercial and operational decisions.
4. No isolated cloud preview, DynamoDB permissions, synthetic accounts, real Gemini verification or production browser validation has run.
5. Desktop/mobile layout evidence at 360, 390, 768 and 1440 pixels is pending a completed local build or isolated preview.
6. Food safety is deterministic and fail-closed for the known rule set but cannot certify food safety, cross-contact, medical suitability or an exhaustive ingredient taxonomy.
7. The subscription trial/price copy needs owner and legal review before deployment; no price or payment behavior was changed here.

