# MAMAAI final local QA evidence

Date: 27 October 2026. Scope: isolated checkout only; no deployment or production data.

## Verified local commands

- `npm test`: 111 passed, 0 failed, exit 0.
- `npx tsc --noEmit --incremental false --pretty false`: exit 0.
- `npm run lint`: exit 0; prior lint output included no errors.
- Controlled `npm run build`: exit 0; duration 77.162 seconds. Logs: `artifacts/build-verification/stdout.log`, `stderr.log`, and `result.json`.

## Important limits

- Household and exception tests are source/contract regressions, not live DynamoDB integration evidence.
- Exception approval is intentionally unavailable pending individual administrator identity, MFA, roles and auditable sessions.
- No isolated browser, Vercel runtime or DynamoDB integration workflow has been run.

## 27 October browser QA and latest local corrections

- Authorized 390px browser testing confirmed that the deployed demo can edit Monday breakfast, restore the original sample, and edit an office-tiffin slot. The demo explicitly identifies edits as temporary browser-local data; no customer persistence endpoint was invoked during these checks.
- Hindi switching on the deployed home page set `document.documentElement.lang` to `hi` and rendered Hindi content. The five mobile navigation controls were visible and 48px high, but a real deployed layout defect was found: a legacy global CSS selector collapsed the navigation grid into five vertical rows.
- The isolated source now fixes that defect by explicitly setting the five-column navigation grid, replaces the raw icon substitutes with labelled SVGs, adds page-specific metadata for key client routes, adds account `noindex,nofollow`, and permits the Vercel-authenticated manifest request through `manifest-src`.
- Console errors were triaged: Vercel/FedCM identity and Vercel JWT errors are authentication-environment messages; Sentry `429` is third-party ingestion throttling; only the manifest CSP rejection required a MAMAAI code change.
- Latest local verification after these changes: `npm test` 111 passed/0 failed (exit 0), TypeScript exit 0, lint exit 0, controlled build exit 0 in 72.675 seconds. Logs: `artifacts/build-verification/ui-fixes.stdout.log`, `ui-fixes.stderr.log`, and `ui-fixes.result.json`.
- The deployed isolated alias has not been updated with these corrections. Consequently neither metadata nor the mobile navigation fix is treated as deployed-browser verified.

## 27 October controlled isolated deployment verification

- Deployment: `dpl_ecnRJ1UvFNij822nMLz2xa7tDtwJ`, Production target for `rbinnovationllps-projects/mamaai-preview-isolated`; alias: `https://mamaai-preview-isolated.vercel.app`.
- Domain isolation: Vercel reports `mamaai.in` and `www.mamaai.in` only on the separate `mamaai` project.
- 390px: five equal horizontal dock controls, SVG icons, 48px targets and working My Kitchen navigation; Account Access form controls were not overlapped by the dock. Demo breakfast edit and Restore original sample passed.
- 1440px: no horizontal overflow; mobile dock is hidden as designed.
- Metadata: the deployed home, demo, pantry and account routes now expose route-appropriate titles; Account Security provides `noindex, nofollow`. Hindi/English switching passed.
- Manifest: the MAMAAI CSP change removed the earlier CSP violation. Vercel Authentication still redirects the manifest fetch to its own SSO endpoint, which fails browser CORS. This must be resolved in Vercel protection configuration (for example a safe static-manifest allowance), not by weakening application CSP.
- Do not interpret the unauthenticated Account Security `/api/customer/devices` 401 as an application defect; it confirms the endpoint did not disclose device data without a customer session.

## 28 October metadata, browser and operator-readiness update

- Route-wide source audit now covers every public/legal/help route with an explicit title and description, including the `/pricing` redirect. Customer, account, profile, Family+, shopping-list, tiffin, More and admin segments are excluded from indexing where appropriate.
- `tests/route-metadata.test.cjs` is executable regression coverage for those metadata/noindex contracts. Latest local verification: 113 passed, 0 failed; TypeScript exit 0; lint exit 0; controlled build exit 0 in 166.081 seconds (`artifacts/build-verification/metadata-audit.result.json`).
- Deployed non-database QA additionally confirmed the mobile planner’s clear profile-completion feedback and no horizontal overflow at 390px. Expected unauthenticated 401 API responses did not disclose data.
- The exact protected operator procedure is documented in `docs/qa/MAMAAI_ISOLATED_SMOKE_OPERATOR_PROCEDURE.md`. It uses the existing secret only in an RBIL-controlled PowerShell prompt, reports six safe booleans, and requires no secret to be sent to engineering or chat.
- These newest metadata changes have not been deployed; ISS-019 and ISS-020 remain PARTIAL.

## 28 October deployed visual acceptance update

- ISS-007 is VERIFIED: deployed Family+ card text rendered `rgb(34,27,22)` on white, measured at 16.99:1 contrast.
- ISS-021 is VERIFIED: deployed Family+ card hover provided a 150ms transition, 2px upward transform and visible elevation shadow.
- These checks used the deployed isolated preview only; no customer record, payment, AI, or database mutation was involved.

## 28 October continuation verification

- Scope remained the isolated checkout only. No deployment, commit, push, production access, payment activation, AWS write, or customer-data access occurred.
- Fresh local verification: a complete TAP run of `npm test` passed 113 tests with 0 failures, skips, todos or cancellations across 19 test files. The earlier report of 60 was a partial/truncated test transcript, not the test total. `npx tsc --noEmit --incremental false --pretty false` exited 0; `npm run lint` exited 0; and `npm run build` exited 0.
- The reviewed protected `/api/internal/isolated-smoke` route is usable only by an RBIL operator who already has both Vercel-authorized access and the preconfigured smoke secret. It validates the explicit isolated flags and expected preview-only role, region, table and GSI; writes, reads, queries and deletes one generated `ISOLATED_SMOKE#` record. Engineering cannot safely execute it without that authority. The operator procedure remains `docs/qa/MAMAAI_ISOLATED_SMOKE_OPERATOR_PROCEDURE.md`.
- Browser and database-dependent acceptance criteria were not fabricated from source inspection. The current overall result remains 15 VERIFIED, 9 PARTIAL and 3 BLOCKED. Production status remains NO-GO.

## 27 October isolated-integration readiness check

- Local Vercel linkage identifies `mamaai-preview-isolated` (`prj_NQcC4LtOVDZtBNr5lxzdzfQTy8kv`); this is local linkage evidence only, not a verified deployment alias or protection setting.
- `.env.local` exposes only the `VERCEL_OIDC_TOKEN` variable name during this check; no secret values were read.
- AWS CLI is installed, but `aws sts get-caller-identity` returned `NoCredentials`. Consequently the expected preview account, `ap-south-1`, `mamaai-preview-test`, IAM permissions and OIDC runtime identity are UNVERIFIED.
- No DynamoDB reads or writes, browser integration workflow, deployment, production access or payment activation occurred.

## 27 October deployed-alias verification

- Vercel lists the newest Ready deployment as `mamaai-preview-isolated-35pqn6trj-rbinnovationllps-projects.vercel.app` (Production, 5 minutes old during inspection).
- The `mamaai-preview-isolated.vercel.app` alias is listed against that same deployment source with an age of 3 days, so the alias cannot be confirmed to point to the newest deployment from available evidence.
- Both the alias and the newest deployment returned a Vercel SSO redirect (`302` to `vercel.com/sso-api`) to unauthenticated HTTP requests. This is evidence that Vercel Authentication protection is enabled.
- Smoke, database and browser workflows were intentionally not run against an alias whose current-build mapping is unverified.

## Required synthetic integration procedure after RBIL supplies approved preview access

1. Confirm STS account ID, region and table metadata before writing.
2. Create unique `integration-<uuid>` customer and household records in `mamaai-preview-test`.
3. Exercise ordinary editing, replacement, cooldown, concurrent replacement, Pending exception lock, cross-account rejection and cleanup.
4. Run authenticated desktop (1440px) and mobile (390px) workflows against the current isolated build.
5. Record cleanup confirmation and browser outcomes in this report.

## P0/P1 release blockers

1. Run synthetic isolated DynamoDB integration tests for household replacement, cooldown, exception lock and account isolation.
2. Run authenticated mobile and desktop browser workflows.
3. Implement secure individual administrator authentication before enabling exception decisions.
4. Obtain legal approval for deletion execution, terms and refund policy items recorded as BLOCKED in the tracker.
