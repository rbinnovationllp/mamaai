# MAMAAI consolidated remediation status

Date: 23 October 2026

## Evidence and scope

Reconciled against `audit-input/MAMAAI_QA_Audit.zip`, including `Issue_Register.csv`, technical registers and supplied screenshots. The audit records live-site observations on 22–23 October; this report classifies the current local source and local tests. No deployment, AWS/Vercel/IAM change, database access, payment, Gemini call, customer-data access, commit, or push occurred.

## 27-issue reconciliation

| ID | Current classification | Evidence / current disposition |
| --- | --- | --- |
| ISS-001 | Confirmed, unresolved (P0) | Durable-session primitives exist, but `/login`, `/signup`, and `/register` remain absent; no customer-registration lifecycle is deployable. |
| ISS-002 | Partially confirmed | Razorpay routes require verified identity in local tests, but a real test-mode payment/webhook has not run. |
| ISS-003 | Partially confirmed | Ask MAMA fails closed on missing/invalid Gemini and validates structured food advice; real-provider resilience remains unverified. |
| ISS-004 | Previously fixed | Current fixed horizontal `MobilePrimaryNav` and lifted launcher passed earlier local responsive checks. |
| ISS-005 | Confirmed, unresolved (P0) | Authenticated export API exists, but the public page still correctly discloses that self-service delivery is not enabled; no full cloud inventory test exists. |
| ISS-006 | Confirmed, unresolved (P0) | Deletion is deliberately non-executable pending retention policy and bulk session-revocation design. |
| ISS-007 | Previously fixed | Current homepage uses dark text on light backgrounds; the reported white-on-cream hero source is not present. |
| ISS-008 | Partially confirmed | Profile persistence route exists, but localStorage remains part of the workflow and cloud synchronization is unverified. |
| ISS-009 | Previously fixed | Public judge bypass was removed and security tests cover it. |
| ISS-010 | Previously fixed | `/help` route exists. |
| ISS-011 | Confirmed and corrected now | `app/pricing/page.tsx` redirects to `/subscription`. |
| ISS-012 | Requires RBIL legal/commercial approval | Policy truthfully makes no unapproved refund promise. |
| ISS-013 | Requires RBIL legal approval | Terms remain marked draft pending authorized legal wording. |
| ISS-014 | Partially confirmed | Account/family repositories exist, but unauthenticated/local fallback remains and cross-device persistence needs isolated Preview proof. |
| ISS-015 | Confirmed, unresolved | Pantry page still persists locally; durable synced pantry requires authenticated isolated storage validation. |
| ISS-016 | Previously fixed | `VoiceTextInput` has a contextual `aria-label`. |
| ISS-017 | Confirmed and corrected now | Floating launcher has `aria-label="Open Ask MAMA assistant"`. |
| ISS-018 | Previously fixed | Hindi `homeCopy` contains localized headline text. |
| ISS-019 | Confirmed, unresolved | Root metadata is shared; route-specific titles are not implemented. |
| ISS-020 | Confirmed, unresolved | Route-specific descriptions are not implemented. |
| ISS-021 | Design preference | Motion polish is not a verified functional or safety defect; defer to a design pass. |
| ISS-022 | Confirmed and corrected now | Anonymous "Free Trial Active" text replaced with eligibility confirmation after sign-in. |
| ISS-023 | Partially corrected | Subscription claims now state pet planning is unavailable; legacy knowledge-base/product wording still needs a full pet-capability removal audit. |
| ISS-024 | Requires RBIL privacy/legal approval | No consent banner exists; consent scope and analytics activation need an approved policy. |
| ISS-025 | Previously fixed alternative | Mobile primary navigation is present; it is a fixed bottom navigation rather than the consultant's hamburger design. |
| ISS-026 | Confirmed, unresolved (P2) | `MobilePrimaryNav` still uses Unicode glyphs; replace with an approved SVG icon system in a design pass. |
| ISS-027 | Confirmed and corrected now | Footer navigation links now have `min-h-11` touch targets. |

## Counts

- **Genuinely confirmed:** 22 (including partial and unresolved code findings; excludes legal/design-only items).
- **Fixed locally or previously verified locally:** 12.
- **Partially resolved:** 5.
- **Confirmed unresolved:** 7.
- **Requires RBIL decision:** 3.
- **Design preference:** 1.
- **Open P0s:** ISS-001, ISS-005, ISS-006. ISS-002/003 remain P0 integration-verification gates.

## Current local corrections

- `eslint.config.mjs`: ignores only generated `.next.locked-*` and `.vercel` artifacts; lint is clean.
- `app/pricing/page.tsx`: adds safe `/pricing` alias redirect.
- `components/ask-mama/AskMamaLauncher.tsx`: accessible launcher name.
- `components/Footer.tsx`: 44px-equivalent Tailwind touch targets for internal footer links.
- `app/subscription/page.tsx`: removes anonymous active-trial claim and unsupported pet-planning promises from visible subscription copy.
- `tests/audit-reconciliation.test.cjs`: regression coverage for ISS-011/017/022/023/027.

## Database isolation and schema

Phase 3B.1 Preview/test configuration remains fail-closed before client creation for missing region, missing explicit tables, missing isolated identity scope, unsafe table names, and known production names. The current isolated table has no GSI. `GSI1 (GSI1PK, GSI1SK)` is required for export, safety review, subscriptions, CRM, pantry, and family-plan queries. See `docs/MAMAAI_PREVIEW_DYNAMODB_SCHEMA_AND_GSI_PLAN.md`.

## Verification

| Check | Result |
| --- | --- |
| `npm test` | 45 passed, 0 failed, 0 skipped |
| TypeScript | Passed after current audit-copy changes |
| Lint | Passed: 0 errors, 0 warnings after generated-artifact correction |
| Build | Earlier Phase 3B.1 build passed; a fresh attempt was blocked by an existing Next.js build lock and the lock was not removed. |
| Playwright | Earlier local suite: 13 passed, 0 failed, 0 skipped at 320–1440px. Fresh result not claimed because its report did not update during the stale lock condition. |

## Release recommendation

**No-go for commercial launch or Preview deployment.** Local configuration is fail-closed, but RBIL must approve isolated cloud resources/GSI1, a protected separate Vercel project, a least-privilege identity, synthetic-account testing, legal policies, and real provider tests. Commercial launch also requires resolving the three open P0s, payment/Gemini integration verification, and route metadata/pantry/mobile-icon work.

