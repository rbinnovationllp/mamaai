# MAMAAI Playwright setup and public QA

Date: 31 October 2026 (Asia/Kolkata)  
Project: `C:\Users\HP\mamaai-preview-isolated`  
Scope: local public-page QA only. No production data, AWS resource, Vercel setting, deployment, commit, push, payment activation, or external customer record was used.

## Installation result

| Item | Result |
| --- | --- |
| Node.js | `v24.21.0` |
| npm | `11.13.0` |
| Existing system browsers | Google Chrome and Microsoft Edge detected |
| Playwright | Installed as development dependency: `@playwright/test ^1.64.1` |
| Browser binary | Chromium-only Playwright browser installed/reused; no browser extension or Docker installation occurred |
| Test command | `npm run test:browser` |
| Configuration | `playwright.config.ts`: project-local server on `127.0.0.1:3100`, desktop Chromium (1440×1000), mobile Chromium (390×844), dedicated `e2e/` tests |
| Generated artifacts | Ignored local `test-results/` and `playwright-report/`; screenshots retained in `test-results/screenshots/` |

The server uses normal `NODE_ENV=development` and the project's separate `.next-dev` output; production deployment settings were not changed.

## Public browser-test results

Final public coverage is **6 passing scenario/project executions**: three scenarios in desktop Chromium and the same three at the 390px mobile viewport. The registration/recovery scenario was rerun after fixing its test fixture to satisfy the browser's required email field; it does not submit registration or create an account.

| Scenario | Desktop | Mobile 390px | Result |
| --- | --- | --- | --- |
| Homepage, mobile navigation visibility, Hindi/Kannada language selection, sign-in screen reachability, subscription information | PASS | PASS | Language selector updates document language to `hi` and `kn`; mobile primary navigation is rendered. |
| Public registration/login UI, masked password inputs, browser-required field validation, password-recovery disabled state | PASS | PASS | Password fields render as `type=password`; missing required fields are browser-invalid; recovery accurately states email delivery is unconfigured in the test environment. No external record created. |
| Privacy, Terms, Refund navigation and public Ask MAMA knowledge-base question | PASS | PASS | Legal pages render; Ask MAMA opens and accepts “How does MAMAAI work?” through the public local UI. |

### Screenshots

The final targeted rerun retains sanitised registration/recovery screenshots under [test-results/screenshots](C:\Users\HP\mamaai-preview-isolated\test-results\screenshots):

- `desktop-chromium-registration-required-validation.png`
- `desktop-chromium-recovery-disabled-state.png`
- `mobile-chromium-registration-required-validation.png`
- `mobile-chromium-recovery-disabled-state.png`

The earlier full public run also captured Hindi/Kannada home, subscription, legal-page, and Ask MAMA screenshots; Playwright clears `test-results/` at each run, so those intermediate files were deliberately replaced by the final targeted rerun rather than retained as misleading stale artifacts.

No screenshot contains an account password, recovery code, session cookie, provider secret, real-person data, or downloaded export.

## Issues observed and resolved in the test harness

1. Initial selectors were ambiguous because the page contains both a `MAMAAI` brand link and an `admin@mamaai.in` mail link, and both Password/Confirm password include the word “Password.” The suite now uses exact accessible locators.
2. The optional analytics preference dialog intercepted the public Ask MAMA launcher. The test explicitly declines optional analytics before public interactions.
3. HTML required-field validation prevents submitting an empty recovery email. The test now uses `qa-public@example.test` solely to render the configured-disabled recovery message; it sends no network registration request.

These are test-harness corrections, not product defects.

## Isolated DynamoDB assessment

### Existing safeguards

- Central DynamoDB configuration rejects production table names and static AWS keys in isolated runtime.
- The intended isolated resource is `mamaai-preview-test` in `ap-south-1`, account `624719611353`, with `GSI1` and the `MAMAAI-Vercel-Preview-Role` OIDC role.
- The guarded `/api/internal/isolated-smoke` workflow uses an `ISOLATED_SMOKE#<uuid>` record, verifies write/read/GSI access, deletes it, and retains TTL as a failed-cleanup backstop.
- Synthetic test plans and fictional fixtures already exist in `docs/qa/MAMAAI_AUTHENTICATED_SYNTHETIC_QA_PLAN.md` and `docs/MAMAAI_PHASE3B3_SYNTHETIC_TEST_PLAN.md`.

### Local emulator recommendation

**Do not introduce a local emulator at this stage.** The checkout has no DynamoDB Local/LocalStack setup, endpoint override, compose configuration, or emulator dependency. Docker is not installed and must not be installed without separate approval. Java and AWS CLI are installed, but downloading/running DynamoDB Local would be a new external dependency and would still require a safe endpoint/configuration adaptation.

The preferred next step is the existing dedicated isolated AWS test table through owner-configured Vercel OIDC—not production tables and not local credential reuse.

## Prepared authenticated fixtures (not created)

The following fixture plan is ready, but **no external record exists**:

| Fixture | Fictional identity / data | Intended scope |
| --- | --- | --- |
| Mobile-only customer | `qa-mobile-<run-id>`; local generated password/recovery codes held only by the operator | Register, login, same-device session, recovery. |
| Email-only customer | `qa-email-<run-id>@example.test`; local generated password/recovery codes held only by the operator | Register, login, session and export isolation. |
| Five-member vegetarian household | Father 66 / Tuesday fast; Mother 66; Son 33 working; Daughter-in-law 30 working/paneer preference; Granddaughter 3.5 | Seven-day plan, office tiffins, fasting, paneer, senior/child suitability, grocery and saved-plan checks. |
| Family Plus pet fixture | Fictional supported-species pet, no health claim or invented portion | Entitlement, owner scoping, Pet Meal Plan safety boundary. |
| Isolation customer B | `qa-isolation-b-<run-id>@example.test`, distinct fictional household | Cross-account family/pantry/pet/export denial checks. |

## Remaining blockers and exact approvals needed

1. Owner supplies/selects a protected isolated Vercel deployment and authorises its URL for Playwright; it must have Vercel Authentication and no production connection.
2. Owner configures/validates only the isolated OIDC runtime: `MAMA_AI_ISOLATED_PREVIEW=true`, `MAMA_AI_AWS_IDENTITY_SCOPE=preview-isolated`, `AWS_REGION=ap-south-1`, the isolated role ARN, both table variables set to `mamaai-preview-test`, and `MAMA_AI_DYNAMODB_GSI1_NAME=GSI1`. Static AWS keys must remain absent.
3. Owner authorises temporary isolated-smoke enablement and a smoke result with all six booleans true (`ok`, `oidcDynamoDb`, `write`, `read`, `gsi1`, `cleanup`) before fixture creation.
4. Owner approves creation and cleanup of the listed run-prefixed fictional records in the isolated table only, including the exact retention/removal decision.
5. Separate approvals remain required for live AI provider calls, payment activation, SES email, and irreversible account deletion. Without them, those runtime checks stay blocked.

## Recommendation

**Public browser readiness: PASS for the local unauthenticated scenarios above.**

**Authenticated E2E: BLOCKED pending the five isolated-environment approvals/configuration steps.** Do not use a production table, real account, static credential, or irreversible deletion flow to unblock it.
