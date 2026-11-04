# MAMAAI local authenticated QA results

Date: 1 November 2026 (Asia/Kolkata)  
Scope: project-local DynamoDB Local evaluation only. No AWS API request, cloud resource, Vercel setting, payment, SES action, production record, or fictional customer record was created.

## Result

**STOPPED: local database isolation could not be verified.** DynamoDB Local was successfully downloaded, checksum-verified, started, and immediately stopped after it was observed listening on all network interfaces rather than loopback only.

## DynamoDB Local setup

| Check | Result |
| --- | --- |
| Java | PASS — Temurin OpenJDK 17.0.14 installed. |
| Official emulator | PASS — AWS DynamoDB Local 3.3.2 downloaded into ignored `.qa/dynamodb-local/`. SHA-256: `667cde09f96f4785cede4d107d8066011e5eeceb5dd4566ea8c74c0d378fe919`. |
| Startup | PASS — started from the local Java JAR with a project-local data directory. |
| Listener isolation | **FAIL / STOP CONDITION** — `netstat` reported `0.0.0.0:8000` and `[::]:8000`, not only `127.0.0.1:8000`. |
| Shutdown | PASS — the exact emulator PID was stopped immediately; a follow-up port check returned no listener. |
| Local tables / records | NOT CREATED. |

Official DynamoDB Local does not provide an observed loopback-bind option in this execution. Binding it safely would require an approved local network-control mechanism (for example, a narrowly scoped firewall rule or a loopback-only proxy). Neither was added because that would be a new system-level change outside the approved project-local setup.

## Implemented local safeguards

- `.qa/` is Git-ignored.
- `MAMA_AI_DYNAMODB_LOCAL=true` adds an explicit local runtime branch.
- Local mode requires `NODE_ENV=test`, exact endpoint `http://127.0.0.1:8000`, `mamaai-local-qa-*` application and analytics table names, and literal fake credentials `LOCAL_TEST_ONLY`.
- Local mode rejects Vercel runtime variables, non-test mode, absent/mismatched endpoint, and invalid table names before client construction.
- The SDK client uses the explicit local endpoint and fake credentials only for local mode; production/preview OIDC behavior is retained.
- Project-local provisioning and cleanup scripts refuse every table name except `mamaai-local-qa-*`.

## Automated verification

`npm test` after the local-mode implementation:

| Metric | Result |
| --- | --- |
| Tests | 118 |
| Passed | 118 |
| Failed | 0 |
| Skipped / cancelled / todo | 0 / 0 / 0 |
| Duration | 12.71 s |

## Authenticated Playwright and persistence results

**NOT RUN.** No authenticated browser account, family, pet, meal plan, grocery list, Ask MAMA provider request, subscription entitlement, export, or deletion operation was attempted. Doing so would have required provisioned records against an emulator that failed the stated localhost-only isolation gate.

Accordingly, account ownership, cross-account denial, session revocation, password-hash persistence, deleted-account denial, and no-external-AWS-write verification remain unproven in live authenticated E2E.

## Firewall runtime verification and cleanup

| Check | Result |
| --- | --- |
| Direct bind option | FAIL — DynamoDB Local 3.3.2 exposes no documented host/bind-address option. |
| Temporary rule | Owner-created rule was correctly shown as enabled, inbound, block, TCP 8000, Java executable scoped, Profile Any. |
| Loopback | PASS — `127.0.0.1:8000` was reachable while the emulator was running. |
| Same-host non-loopback probes | Reachable: Wi-Fi IPv4 `192.168.1.53`, global/temporary IPv6, and virtual-switch IPv4. These are diagnostic only and do **not** prove external firewall enforcement. |
| Independent-device verification | NOT AVAILABLE — no authorised second LAN device was available. Therefore inbound isolation is **not proven**. |
| Test records | None created; provisioning scripts were not run. |
| Emulator cleanup | PASS — exact DynamoDB Local PID `30420` was stopped. |
| Firewall-rule cleanup | BLOCKED — `Remove-NetFirewallRule` returned `Access is denied` in this session. The rule must be removed manually from Administrator PowerShell: `Remove-NetFirewallRule -DisplayName "MAMAAI DynamoDB Local QA - block inbound"`. |

The firewall rule must be removed and its absence verified before this QA session is considered cleaned up. No account, table, plan, pet, export, or deletion test ran.

### Owner-confirmed cleanup

The owner subsequently ran the prescribed Administrator PowerShell removal command and its follow-up lookup returned no matching rule. The temporary firewall rule is therefore **removed**. DynamoDB Local remained stopped and no test table or record was created.

## Recommended safer replacement: Dynoxide

**Recommendation: approve a pinned project-local Dynoxide development dependency, not Dynalite.** Dynoxide is a DynamoDB-compatible local emulator that documents a direct `127.0.0.1` listener and supports the application-relevant API surface including GSI and transactions. This avoids the Java emulator's all-interface binding and does not require Docker, a firewall change, AWS credential, AWS profile, or cloud endpoint.

Dynalite is rejected for authenticated MAMAAI QA because its own documented TODO list includes transactions, while account registration, session/device handling and household replacement use DynamoDB `TransactWrite` operations. An in-process mock is unsuitable for the requested browser workflows because the Next server and browser test runner need a shared persistent HTTP endpoint.

### Exact proposed install and run

```powershell
npm install --save-dev dynoxide@1.5.0
npx dynoxide --host 127.0.0.1 --port 8000 --data .qa\dynoxide\mamaai-local-qa.db
```

Before use, the implementation must pin the version, place data under ignored `.qa/dynoxide/`, retain the existing `MAMA_AI_DYNAMODB_LOCAL=true` endpoint validation, use only `LOCAL_TEST_ONLY` credentials, require `mamaai-local-qa-*` tables, and test that `127.0.0.1:8000` listens without an IPv6/all-interface socket. Local provisioning/cleanup must continue to reject non-local table names. The emulator must be stopped and its `.qa` data removed after QA.

### Approval required

Owner approval is required to download/install this new third-party npm package and its platform-specific binary, add the Dynoxide local-launch configuration, and run its compatibility smoke test before fictional account creation. No additional approval is needed for the existing public/database-independent tests.

## Defects found and corrected

| Finding | Action |
| --- | --- |
| Application had no explicit localhost-only DynamoDB endpoint path. | Added a fail-closed local runtime configuration/client branch and local-only provision/cleanup scripts. |
| Official DynamoDB Local listener exposed all interfaces. | Stopped immediately. No workaround or system firewall/proxy change was attempted. |

## Remaining blockers and next approval

1. Direct-bind investigation completed: DynamoDB Local 3.3.2 `-help` exposes no bind-address/host option. It cannot be configured through a documented option to bind directly to `127.0.0.1`.
2. Windows Firewall inspection returned **Access denied** for this session. A firewall rule therefore requires administrator elevation and separate approval before it may be created or tested.
3. Proposed narrowly scoped temporary rule (not applied):

   ```powershell
   New-NetFirewallRule -DisplayName "MAMAAI DynamoDB Local QA - block inbound" -Direction Inbound -Action Block -Protocol TCP -LocalPort 8000 -Program "C:\Program Files\Eclipse Adoptium\jdk-17.0.14.7-hotspot\bin\java.exe" -Profile Any
   ```

   Removal command after QA (also not run):

   ```powershell
   Remove-NetFirewallRule -DisplayName "MAMAAI DynamoDB Local QA - block inbound"
   ```

   Before use, the administrator must verify that Windows loopback traffic remains allowed despite the block rule; if it does not, this rule must be removed immediately and a different approved mechanism selected. No unrelated policy, firewall profile, or existing rule may be modified.
4. Add targeted tests for every local-mode rejection path and run them before restarting the emulator.
5. After loopback-only verification, provision a `mamaai-local-qa-<run-id>` table with `GSI1`, create only fictional fixtures, execute the authenticated Playwright suite, and delete the run-prefixed local table.
6. Live AI, payment, SES, and irreversible deletion still require their own owner approvals.

## Production readiness recommendation

**NO-GO.** The regression suite remains green, but the required loopback-only local database isolation failed. No authenticated end-to-end result should be claimed until a separately approved enforcement mechanism is in place and verified.

## Dynoxide replacement evaluation — 1 November 2026

| Check | Result |
| --- | --- |
| Package verification | PASS — `dynoxide@1.5.0`, npm integrity `sha512-cDDMGxLUJb5oo3iSOnH4Uept+G9l2gMLmtN7DZwtqxlNSUiZozKL1bds0AbMp/jezr+8BQoakrZA8XufQmMtdA==`, Node requirement `>=16`; runtime Node is 24.21.0. |
| Windows companion binary | PASS — official `@dynoxide/win32-x64@1.5.0` materialised after overriding this machine's `npm omit=dev` setting for the local install only. |
| Listener isolation | PASS — Dynoxide was started with `--host 127.0.0.1 --port 8010`; `netstat` showed only `127.0.0.1:8010`, with no IPv6 or all-interface listener. |
| Fake credentials/table | PASS — only `LOCAL_TEST_ONLY` credentials and `mamaai-local-qa-20261101` were used. |
| Real emulator compatibility | PASS — `TransactWrite`, a conditional `Update`, and `GSI1` `Query` completed against Dynoxide. |
| Authenticated Playwright registration | FAIL — after fixing the local origin allow-list to `http://127.0.0.1:3100`, both desktop and mobile runs returned the app's generic `We could not complete that request.` response. No broader workflow was attempted. |
| Cleanup | PASS — `LOCAL_TABLE_DELETED=mamaai-local-qa-20261101`; Dynoxide and the local Playwright server were stopped; port checks showed no listener (only closing `TIME_WAIT` connections). |

### Defect corrected

The local Playwright runtime initially rejected its own loopback origin. `MAMA_AI_ALLOWED_ORIGINS=http://127.0.0.1:3100` was added only to the local Playwright web-server environment; the production configuration was not changed. The later generic registration failure is unresolved and requires server-side diagnostics before the fictional account flow can continue.

### Current status

Dynoxide is the verified loopback-only database solution and supports the core DynamoDB operations required by the app. However, authenticated Playwright is **BLOCKED** by the local registration failure. No mobile-only/email-only account, family, meal plan, grocery list, Ask MAMA, subscription, pet, export, deletion, or cross-account workflow can be claimed as executed.

## Registration root-cause update — 2 November 2026

### Corrected local defect

The initial registration rejection was **not** caused by Dynoxide. `requireSameOrigin` compared only the incoming request URL origin and ignored the pre-existing `MAMA_AI_ALLOWED_ORIGINS` configuration. Under local Turbopack routing, the canonical request host differed from the browser's `http://127.0.0.1:3100` origin. The minimal correction in `lib/server/request-security.ts` now accepts an exact, comma-separated configured origin in addition to strict request-origin equality. No wildcard, scheme relaxation, password policy, session control, or CSRF bypass was added.

`playwright.config.ts` supplies that one loopback origin only for local QA; no production deployment environment was changed.

### Evidence after correction

The next fictional email-registration request persisted the complete expected local record set before the browser response lifecycle stalled:

- password-account record;
- email lookup record;
- device-transfer-policy record;
- eight hashed recovery-code records (hashes only; no recovery values recorded);
- trusted-device record; and
- opaque hashed-session record.

This establishes that Argon2 hashing, account transaction, recovery-code persistence, device/session transaction, loopback Dynoxide endpoint, fake credentials, and the local table schema all executed successfully. It does **not** establish a successful browser registration because the client request remained pending and the UI stayed in its submitting state instead of rendering its success status.

### Remaining authenticated QA blocker

**Response-lifecycle defect: unresolved.** After persistence completes, the local browser request does not settle. The local table and all fictional records were deleted immediately (`LOCAL_TABLE_DELETED=mamaai-local-qa-20261101`), and the Dynoxide/Next servers were stopped. This defect must be diagnosed with a controlled response/cookie trace before registration, login, or any wider authenticated journey can be passed.

## Next route-resolution correction — 2 November 2026

`/account/access` is the correct MAMAAI App Router page: `app/account/access/page.tsx`; links and `/login` redirect consistently target it. The fresh-server 404 was caused by `next.config.mjs` using `process.cwd()` for both Turbopack root discovery and the `@` alias. The spawned Windows `npx.cmd` process inherited the workspace directory rather than the MAMAAI project directory, so Next served a project root with no MAMAAI routes.

The minimal correction derives `projectRoot` from `next.config.mjs` using `fileURLToPath(import.meta.url)` and uses that fixed directory for Turbopack root and the Webpack alias. It does not change routes, authentication, deployment settings, or build output policy.

Independent route readiness verification after the correction: fresh `npx next dev --hostname 127.0.0.1 --port 3100` returned **HTTP 200** for `/account/access` and compiled that exact page. No database table was created during this route-only verification.

## Authenticated registration completion and same-device login correction — 2 November 2026

### Environment and isolation

Dynoxide 1.5.0 was started on `127.0.0.1:8010`; the listener check showed IPv4 loopback only. A fresh `mamaai-local-qa-20261102` table was provisioned with the fail-closed scripts. The Next server ran at `127.0.0.1:3100` with only `LOCAL_TEST_ONLY` credentials, exact local endpoint validation, explicit local QA mode, and test-table-name enforcement. `/account/access` returned HTTP 200 before any account was submitted.

### Registration response evidence

The formerly pending browser registration now completed. Sanitised route checkpoints reached `device_cookie_set` in 550 ms and Next recorded `POST /api/customer/auth/register 201` in 1.07 s. Playwright received HTTP 201 in 3.77 s for the first browser submission. No password, session token, cookie value, or recovery code was recorded.

### Defect corrected: same-device re-login transaction

After logout, a correct-password re-login initially returned HTTP 500. The local-only sanitised marker identified Dynoxide's faithful DynamoDB response: `ValidationException: Transaction request cannot include multiple operations on one item`.

Root cause: `AccountSecurityRepository.activateDevice` added both the current-device write and a previous-device revocation write when the previous and current device IDs were the same. DynamoDB prohibits multiple transaction operations on one item. The minimal correction in `lib/repositories/account-security-repository.ts` revokes a previous device only when its ID differs from the current device. It preserves device binding, prior-device revocation for transfers, opaque sessions, and logout revocation.

### Browser results

| Workflow | Desktop Chromium | Mobile Chromium | Result |
| --- | --- | --- | --- |
| Email-only registration and recovery-code presentation | 201 | 201 | PASS |
| Same-device session after registration and reload | 200 | 200 | PASS |
| Logout and session revocation | session becomes 401 | session becomes 401 | PASS |
| Incorrect password | 401 | 401 | PASS |
| Correct-password same-device re-login | 200 | 200 | PASS after correction |
| Duplicate email registration | 409 | 409 | PASS |
| Mobile-only registration and authenticated session | 201 / 200 | 201 / 200 | PASS |

The parallel four-test execution produced one expected 429 because all browser projects share one loopback IP and the registration control permits five attempts per hour. The affected mobile-only test was rerun sequentially against a fresh table and passed (1 passed, 0 failed). The rate limit was not bypassed or changed.

### Current scope and remaining blockers

The registration-response blocker is resolved. Authenticated family creation, seven-day planning, grocery/saved plans, Ask MAMA, subscription entitlement, pet planning, export/deletion, recovery-code consumption, and cross-account household/pantry/pet isolation have **not yet been run** in this resumed execution. They remain required before a production release recommendation can change from **NO-GO**. Local Playwright failure artifacts that contained test form values were deleted before the clean rerun.

### Final checks and cleanup

| Check | Exact result |
| --- | --- |
| Node automated regression suite | **118 passed, 0 failed, 0 skipped/cancelled/todo**, 7.62 s |
| ESLint | PASS — `npm run lint`, exit 0 |
| TypeScript | PASS — `npx tsc --noEmit`, exit 0 |
| Authenticated focused Playwright | 3 passed / 1 rate-limited in the intentionally parallel run; affected mobile-only case rerun sequentially: **1 passed, 0 failed** |
| Isolated build rerun | **Exit code not verified.** `npm run build` emitted `Creating an optimized production build ...` but did not return its completion or exit record to the QA runner; no pass claim is made. The separately captured earlier isolated build remains exit 0. |
| Fictional data cleanup | PASS — `LOCAL_TABLE_DELETED=mamaai-local-qa-20261102` |
| Service cleanup | PASS — Next listener PID 40884 and Dynoxide listener PID 34848 stopped. No 3100/8010 listener remained; the only residual was a closed `TIME_WAIT` connection to 8010. |
| Playwright artifact cleanup | PASS — `test-results` removed after the run. |

### Production recommendation

**NO-GO for full release.** The registration-response and same-device re-login defects are corrected and the focused local authentication flows pass, but the required five-member household, meal planning, groceries, Ask MAMA, subscription, pet, export/deletion, recovery-code consumption, and cross-account data-isolation journeys remain unexecuted. A complete authenticated QA cycle on the verified loopback-only emulator is required before release approval.

## Customer-journey execution — 2 November 2026

| Area | Actual result |
| --- | --- |
| Isolation/readiness | PASS — Dynoxide listener was `127.0.0.1:8010` only; a real `ListTables` request succeeded against `mamaai-local-qa-e2e-20261102` with fake credentials. |
| Access route | PASS — `/account/access` returned HTTP 200 on `127.0.0.1:3100`. |
| Five-member vegetarian profile | PASS — persisted and reread with father Tuesday-fasting restriction, two working weekday-tiffin members, daughter-in-law paneer preference, and child/senior context. |
| Test-only subscription entitlement | PASS — an explicit local manual `family_plus` fixture was used; no payment provider request occurred. |
| Pet persistence | PASS — fictional dog and cat were created and reread through the Family Plus routes. |
| Export | PASS — account A export contained its five-member profile and two pets. |
| Cross-account isolation | PASS — fictional account B, independently authenticated and entitled, had no account-A family profile, pet records, or exported pet records. |
| Deletion workflow | PASS as safe block — `/api/customer/account-deletion` returned its documented HTTP 409 non-executable preflight. No customer/test record deletion was falsely claimed. |
| Browser test count | PASS — 1 Playwright desktop Chromium customer-journey test, 1 passed / 0 failed, 4.0 s. |
| Ask MAMA | BLOCKED — unresolved prompts may contact a live generative-AI provider, which is not authorised. No request was sent. |
| Meal planning, grocery/pantry, saved-plan reopen, multilingual UI, Pet Meal Plan | NOT RUN — still required before release. |

The earlier statement that pet, export, and cross-account workflows were unexecuted is superseded by this section. Full release remains **NO-GO** because the remaining customer-journey areas have not been completed.

Cleanup completed: `LOCAL_TABLE_DELETED=mamaai-local-qa-e2e-20261102`; Next.js listener PID 18592 and Dynoxide listener PID 6316 were stopped. Final port output contained only closed `TIME_WAIT` connections, not listeners. Playwright artifacts were removed.

## Remaining product-flow execution — 2 November 2026

| Check | Result |
| --- | --- |
| Local isolation | PASS — Dynoxide PID 27020 listened only at `127.0.0.1:8010`; real ListTables readiness passed for `mamaai-local-qa-final-20261102`. |
| Meal route defect | FIXED — Next 16 rejected re-exported `dynamic` metadata in `app/api/meal-plan/route.ts`; route now declares metadata locally. |
| Seven-day deterministic vegetarian planning | PASS — 2–8 November, 7 daily lunch plans, each HTTP 200 and persisted/reopened through the plan route. |
| Meal slots | PASS — breakfast, lunch, dinner, and snack/high-tea requests each returned HTTP 200. |
| Fasting/tiffin/preferences context | PASS — Tuesday father fasting and two weekday office-tiffin attendances were included in actual request data; paneer and child/senior restriction context were persisted in the family profile. |
| Pantry | PASS — create, edit (1 kg to 2 kg), reload, and account-B empty-pantry isolation. |
| Pet Meal Plan | PASS — supported local Kannada plan returned HTTP 200 for fictional dog with allergy/veterinary context. |
| Ask MAMA | BLOCKED — not called because unresolved prompts may use an unapproved live provider. |
| Payment/email/AWS | PASS — no external payment, email, AI, or AWS call was made. |

The Playwright runner's terminal stream was truncated, but its authoritative `test-results/.last-run.json` reported `{ "status": "passed", "failedTests": [] }`. Full release remains **NO-GO** pending grocery persistence/UI localization, provider-safe Ask MAMA coverage, and the remaining end-to-end workflows.

Final checks: `npm test` passed **118/118** in 11.92 s; `npm run lint` and `npx tsc --noEmit` both exited 0. A fresh `npm run build` produced only its startup output and no captured final exit record, so build status is **unverified**. Cleanup passed: `LOCAL_TABLE_DELETED=mamaai-local-qa-final-20261102`, Dynoxide PID 27020 stopped, and Playwright artifacts were removed. Only a closed `TIME_WAIT` connection remained.
