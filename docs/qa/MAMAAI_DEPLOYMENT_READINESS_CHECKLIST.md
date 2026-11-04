# MAMAAI isolated preview readiness checklist

## Local evidence

- [x] Tests: 111 passed, 0 failed.
- [x] TypeScript: exit 0.
- [x] Lint: exit 0.
- [x] Controlled build: exit 0; see `artifacts/build-verification/result.json`.
- [x] Latest local UI-fix build: exit 0 in 72.675 seconds; see `artifacts/build-verification/ui-fixes.result.json`.
- [ ] Deploy the latest isolated-only source revision, then retest CSP-protected manifest loading, route metadata and the five-column mobile dock at 390px. This is not authorization to deploy.
- [x] Controlled isolated deployment completed: `dpl_ecnRJ1UvFNij822nMLz2xa7tDtwJ`; latest source browser-tested at 390px and 1440px.
- [ ] Resolve the Vercel Authentication manifest redirect/CORS behavior through an approved Vercel protection configuration review. Application CSP is no longer the cause.
- [x] Route-wide metadata/noindex source audit and regression test completed locally (113 tests, TypeScript/lint/build exit 0).
- [ ] Authorize a future isolated-only deployment of the metadata-audit source revision, then verify every public route title/description and every private route `noindex,nofollow` in the browser.
- [ ] RBIL operator: run the bounded smoke test using `docs/qa/MAMAAI_ISOLATED_SMOKE_OPERATOR_PROCEDURE.md`; record only the safe boolean result fields.
- [x] Deployed visual acceptance evidence: ISS-007 contrast 16.99:1 and ISS-021 hover transition/elevation verified.

## Current issue totals

- VERIFIED: 15
- PARTIAL: 9
- BLOCKED: 3

## 28 October continuation evidence

- [x] Fresh isolated-checkout test run: `npm test` 113 passed, 0 failed, skipped, todo or cancelled across 19 test files. The earlier 60 count was a truncated-output reporting error.
- [x] Fresh TypeScript verification: exit 0.
- [x] Fresh ESLint verification: exit 0.
- [x] Fresh production build verification: exit 0.
- [ ] RBIL operator access is still required to invoke the secret-protected, Vercel-authenticated isolated smoke endpoint. Do not send or expose its existing secret; follow `MAMAAI_ISOLATED_SMOKE_OPERATOR_PROCEDURE.md`.
- [ ] Authenticated synthetic customer browser testing remains required before database-backed issues can be verified.
- [ ] Production remains NO-GO: the 9 PARTIAL issues lack required runtime evidence and the 3 BLOCKED issues need RBIL/legal approval.

The remaining PARTIAL issues require either an authorized synthetic account/runtime workflow (ISS-001, ISS-003, ISS-005, ISS-008, ISS-014, ISS-015), approved payment/integration testing (ISS-002), or deployment/browser verification of the latest metadata source (ISS-019, ISS-020). BLOCKED items are legal-policy approvals: ISS-006, ISS-012 and ISS-013.

## Required before isolated preview deployment approval

- [ ] Verify isolated Vercel project protection and environment-variable scopes.
- [ ] Verify preview-only DynamoDB/OIDC identity and table isolation.
- [ ] Blocker recorded 27 October: AWS CLI STS returned `NoCredentials`; RBIL must establish an approved temporary preview-only AWS session before DynamoDB integration tests.
- [ ] Execute synthetic registration, login, entitlement, household replacement, cooldown, exception submission, recovery, transfer, data-export and deletion-preflight workflows.
- [ ] Verify authenticated 390px and 1440px browser behavior, including account and mobile navigation.
- [ ] Confirm payments and paid AI remain disabled.

## Explicitly excluded

No production deployment, production data access, real payment, Twilio activation, AWS infrastructure change, commit or push is authorized by this checklist.
