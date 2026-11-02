# MAMAAI Audit Defect Verification

Date: 23 October 2026

## Evidence boundary

The requested `MAMAAI_Executive_Audit_Report (1).pdf` was not available in the supplied local locations during this audit. This register therefore verifies the findings named in the owner-provided audit instructions against the repository; it is not a substitute for page-by-page reconciliation of the missing 24-page report. The earlier review and Phase 2A–2E reports were available under `docs/reviews`.

## Confirmed findings

| ID | Finding | Code evidence and reproduction | Status | Severity | Correction / evidence |
|---|---|---|---|---|---|
| P0-01 | Auth/session and profile isolation | Durable opaque-session code and `requireUser` protect customer routes. Full production persistence cannot be verified without isolated DynamoDB credentials. | Partially confirmed | P0 | Existing session tests pass; Preview-only verification remains required. |
| P0-02 | Ask MAMA ordinary recipe path | `app/api/ask-mama/route.ts` classifies requests, applies durable rate limits and rejects unvalidated food-specific fallbacks. Real Gemini is deliberately not called locally. | Partially confirmed | P0 | Controlled error is expected without configured Gemini; mock safety tests pass. |
| P0-03 | Mobile navigation/Ask MAMA overlap | `MobilePrimaryNav.tsx` is fixed at z-50; `AskMamaLauncher.tsx` is fixed at z-40 and bottom-24 on mobile. | Not reproduced locally | P0 | Playwright passed at 360, 390, 768 and 1440px with no horizontal scroll or console errors. Keyboard-open behavior needs device/browser testing. |
| P0-04 | Payment identity and webhook trust | Razorpay creation requires `requireUser`; verification resolves plan server-side; webhook verifies signature and idempotency. | Partially confirmed | P0 | Unit/security assertions pass. Razorpay test-mode integration is blocked pending isolated credentials. |
| P0-05 | Data export | `app/api/customer/data-export/route.ts` requires the verified user and exports that user’s repository records. Public page still correctly says self-service delivery is not enabled. | Partially confirmed | P0 | API code is account-scoped; isolated DynamoDB test needed for complete data inventory. |
| P0-06 | Account deletion | Deletion endpoint is deliberately preflight-only and returns 409; repository marks it `executable: false`. | Confirmed open | P0 | A real deletion worker is blocked by approved retention policy and session lookup design. |
| P1-02 | Public evaluator/judge bypass | Public subscription UI accepted a judge key; `/api/subscriptions/plans` returned an entitlement-like bypass response for a matching key. | Confirmed and corrected locally | P1 | Removed UI handler/modal, API bypass branch and schema field; security regression test passes. |
| P1-04 | Footer Help link was broken | `components/Footer.tsx` linked `/help`; route did not exist. | Confirmed and corrected locally | P1 | Added `app/help/page.tsx`; regression test and local browser journey pass. |

## Findings requiring credentials or business decisions

- Real registration/login recovery and cross-user persistence: requires synthetic identities and the isolated DynamoDB environment.
- Payment capture, webhook replay from Razorpay and reconciliation: require test-mode Razorpay credentials and a non-production webhook target.
- Actual export completeness and deletion: require a settled record-retention/deletion policy and isolated table indexes.
- Legal/refund/cancellation wording: owner/legal approval required; no commercial promise was invented.
- The source audit's full list of 27 findings: unverified because the cited PDF was missing.

## Reproduction evidence

- Local unit/security: 34 passed, 0 failed.
- Local Playwright: 8 passed, 0 failed, 0 skipped; JSON: `C:\Users\HP\rbil-testing\local-mamaai-readiness-results\results.json`.
- Direct subscription URLs returned HTTP 200 locally for starter, premium and family_plus.
