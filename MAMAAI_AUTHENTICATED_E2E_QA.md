# MAMAAI authenticated end-to-end QA

Date: 31 October 2026 (Asia/Kolkata)  
Project: `C:\Users\HP\mamaai-preview-isolated`  
Scope: fictional data and isolated infrastructure only. No deployment, commit, push, AWS/Vercel modification, payment activation, production credential use, production table access, or real customer-data access occurred.

## Executive result

**Authenticated browser and DynamoDB E2E execution is blocked before first write.** The local checkout does not contain a browser-test runner, local DynamoDB-compatible environment, or complete isolated runtime credentials/configuration. The existing project infrastructure is suitable for an owner-approved isolated deployment, but that deployment and test-browser surface were not supplied to this session.

The verified regression baseline remains: `npm test` — **118 passed, 0 failed, 0 skipped, 0 cancelled, 0 todo** (8.94 s). The isolated build artifact records exit code **0**.

## Task 1 — QA infrastructure inventory

| Capability | Result | Reusable evidence |
| --- | --- | --- |
| Browser testing framework | **Unavailable** | `package.json` has no Playwright, Cypress, Puppeteer, WebDriver, or browser-E2E script/configuration. |
| Local DynamoDB / LocalStack | **Unavailable** | No Docker command, DynamoDB Local/LocalStack dependency, compose file, endpoint override, or emulator bootstrap was found. |
| Dedicated isolated DynamoDB configuration | **Present, not connected locally** | Central validation requires explicit isolated resource configuration and rejects production table names/static keys. Existing intended table: `mamaai-preview-test`, GSI `GSI1`, `ap-south-1`. |
| Synthetic fixtures | **Present** | `docs/qa/MAMAAI_AUTHENTICATED_SYNTHETIC_QA_PLAN.md`, `docs/MAMAAI_PHASE3B3_SYNTHETIC_TEST_PLAN.md`, fictional demo/reference meal data, and source-level fixtures. |
| Email adapter | **No mock adapter found** | Recovery-code safety is source-tested; a live email/SES delivery adapter is not configured for this QA scope. |
| Payment adapter | **Partial, intentionally disabled** | Razorpay returns an unconfigured/test-stage response without provider settings. An isolated transfer-payment simulator exists but is restricted to `MAMA_AI_ISOLATED_PREVIEW=true`; it is not a live payment adapter. |
| Safe environment template | **Present** | `.env.example` documents app, auth, isolated DynamoDB/OIDC, AI, payment, and service variables without supplying usable credentials. |
| Cleanup mechanism | **Present for smoke records; broader workflow requires approved cleanup** | `/api/internal/isolated-smoke` creates an `ISOLATED_SMOKE#<uuid>` item, reads it and its GSI, deletes it, with a 15-minute TTL backstop. |

## Task 2 — isolated database readiness

### Existing safe path

Use the existing isolated test table only, not a local substitute and never a production table:

- AWS account: `624719611353`
- Region: `ap-south-1`
- Table and analytics table: `mamaai-preview-test`
- GSI: `GSI1`
- Runtime role: `MAMAAI-Vercel-Preview-Role`
- Identity method: Vercel OIDC only; static `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` must be absent.

The application fails closed unless the isolated deployment supplies: `MAMA_AI_ISOLATED_PREVIEW=true`, `MAMA_AI_AWS_IDENTITY_SCOPE=preview-isolated`, `AWS_REGION`, `AWS_ROLE_ARN`, `MAMA_AI_DYNAMODB_TABLE_NAME`, `MAMA_AI_ANALYTICS_TABLE_NAME`, and `MAMA_AI_DYNAMODB_GSI1_NAME=GSI1`.

### Required owner setup before writes

1. Supply/select the protected isolated Vercel deployment only, with the above variables set by the owner and Vercel Authentication enabled.
2. Confirm its role is limited to the named isolated table and GSI operations, with no production-table permission, wildcard data resources, static credentials, or scan permission.
3. Enable the isolated smoke endpoint only temporarily; provide its secret directly to the authorised operator, not in source, chat, screenshots, or this report.
4. Run the smoke endpoint and require `ok`, `oidcDynamoDb`, `write`, `read`, `gsi1`, and `cleanup` to all be `true` before customer-journey testing.
5. Create only run-prefixed fictional accounts (for example, `qa-mobile-<run-id>@example.test`, `qa-email-<run-id>@example.test`, and `qa-isolation-b-<run-id>@example.test`). Record only the run ID and sanitised statuses.
6. Before cleanup, obtain the owner decision for removing workflow records. Never use the irreversible account-deletion flow as test cleanup.

No AWS command was run because a cloud read/write would require the unsupplied isolated configuration and could otherwise exceed scope.

## Task 3 — authenticated browser journey

| Required scenario | Execution result | Reason / planned evidence |
| --- | --- | --- |
| Mobile-only registration and login | BLOCKED | Requires protected deployment and browser runner/surface. |
| Email-only registration and login | BLOCKED | Same. |
| Persistent same-device session | BLOCKED | Requires browser reload/cookie evidence against isolated runtime. |
| Password recovery codes | BLOCKED | Requires synthetic account session and controlled recovery-code capture. |
| Five family profiles | BLOCKED | Requires isolated persistence. Household: Father 66 (Tuesday fast), Mother 66, Son 33 working, Daughter-in-law 30 working/paneer preference, Granddaughter 3.5. |
| Seven-day vegetarian plan; Tuesday fast; two weekday office tiffins; paneer; senior/child meals | BLOCKED | Requires authenticated persisted planner and approved AI/runtime configuration or explicit disabled-state evidence. |
| Grocery list; save/reopen plan | BLOCKED | Requires isolated DynamoDB persistence. |
| Personalised Ask MAMA | BLOCKED | Provider-dependent runtime is deliberately unapproved; must remain blocked unless separately approved. |
| English, Hindi, Kannada | BLOCKED for browser execution | Source-level multilingual safety coverage is in the 118-test baseline. |
| Subscription entitlements | BLOCKED | Payment activation is not authorised. Only non-payment entitlement restriction behaviour may be tested after isolated setup. |
| Pet Meal Plan | BLOCKED | Requires authenticated Family+ entitlement and isolated pet persistence. |
| Data export and account deletion | BLOCKED | Export needs isolated authenticated data; irreversible deletion requires separate owner approval. |

No screenshots exist because no browser journey was run. Future screenshots must be sanitised and must not expose passwords, recovery codes, cookies, secrets, full exports, or personal data.

## Task 4 — security and regression status

| Check | Current evidence | E2E status |
| --- | --- | --- |
| Account ownership / cross-account family, pantry, pet isolation | Automated coverage includes owner-scoped repository and route checks. | BLOCKED pending two isolated synthetic accounts. |
| Session persistence and revocation | Automated coverage includes opaque durable sessions, tamper/expiry/revocation, device checks, and logout routes. | BLOCKED pending browser/session exercise. |
| CSRF and origin enforcement | Automated coverage includes customer mutation origin checks, password/recovery/device protections. | BLOCKED pending isolated HTTP/browser verification. |
| Access restrictions | Automated coverage covers unauthenticated/invalid-session denial and isolated configuration fail-closed behavior. | BLOCKED pending live isolated route verification. |

## Exact blockers

1. No Playwright/Cypress/WebDriver configuration or installed browser runner in this checkout.
2. No local DynamoDB-compatible runtime: Docker is unavailable and no DynamoDB Local/LocalStack project setup exists.
3. No authorised protected isolated deployment URL, browser surface, or complete isolated environment configuration in this session.
4. No owner-approved synthetic-record cleanup decision for end-to-end workflow records.
5. Live AI, payment, SES, and irreversible account deletion remain separate approval gates.

## Recommendation

**NO-GO for public production.** The local regression/build baseline is green, but no authenticated browser or DynamoDB E2E scenario has been executed. Once the six setup steps above are complete, run the existing synthetic plan in two clean browser contexts, capture only sanitised evidence, verify cross-account denial and session revocation, and clean up solely under the owner-approved retention decision.
# Authenticated customer-journey execution — 2 November 2026

## Environment

Dynoxide 1.5.0 was started on `127.0.0.1:8010` only. A real local `ListTables` readiness request succeeded for the fictional `mamaai-local-qa-e2e-20261102` table using only `LOCAL_TEST_ONLY` credentials. Next.js served `/account/access` from `127.0.0.1:3100` with HTTP 200.

## Executed browser-driven local journey

One Playwright desktop Chromium test passed (1 passed, 0 failed; 4.0 s) against real local persistence:

- created a fictional email account and a test-only active Family Plus entitlement;
- saved and reread a five-member vegetarian household;
- persisted Tuesday fasting for the father, weekday office-tiffin preferences for both working adults, paneer preference for the daughter-in-law, and child-friendly/senior restriction context;
- created and reread fictional dog and cat profiles under the Family Plus gate;
- exported account A and verified its five members and two pets were present;
- verified account deletion responds as a safe **409 non-executable preflight**, not a deletion; and
- created a separate fictional account B with a separate test-only Family Plus entitlement, then verified it received no family profile, no pets, and an export with no account-A pet records.

## Blocked / not executed

- Meal-plan generation, saved-plan modification/reopen, grocery and pantry workflow: not executed in this run.
- Ask MAMA public/personalized queries: blocked. The route may invoke a live generative-AI provider for unresolved queries; no provider activation or external request is authorized.
- Subscription payment creation: not executed; only local manual fixture entitlements were used.
- Pet Meal Plan: not executed.
- Account deletion: correctly preflight-only by design; executable deletion remains unavailable pending approved retention rules and bulk session-revocation support.
- Hindi/Kannada interactive UI: not executed in this run.

## Recommendation

**NO-GO.** The local authenticated persistence and account-isolation journey is proven for family, pet, export, and safe deletion preflight, but meal planning/grocery persistence, AI-independent Ask MAMA coverage, multilingual UI, Pet Meal Plan, and a controlled executable deletion workflow remain outstanding.

Cleanup: the fictional `mamaai-local-qa-e2e-20261102` table was deleted; Next.js PID 18592 and Dynoxide PID 6316 were stopped. Only `TIME_WAIT` connections remained, with no active listener.

## Remaining local product execution — 2 November 2026

### Defect corrected

`app/api/meal-plan/route.ts` re-exported Next.js route metadata (`dynamic`) from another module. Next.js 16 rejects re-exported route-segment configuration and returned HTTP 500 before meal generation. The minimal fix exports `POST` only and declares `export const dynamic = "force-dynamic"` locally. No auth, AI, provider, or deployment setting changed.

### Passed browser-driven local test

`e2e/local-product-flows.spec.ts`: **1 passed, 0 failed** (Playwright recorded status `passed`). It used a new local table, fake credentials, a fictional active Family Plus fixture, and no AI/payment/email call.

- generated deterministic local vegetarian plans for 2–8 November 2026 (Monday–Sunday); 
- generated breakfast, lunch, dinner, and snack/high-tea slots, then reopened the Tuesday lunch plan through the same saved-plan route;
- supplied Tuesday fasting attendance and weekday office-tiffin attendance for both working adults; supplied paneer preference and child/senior restriction context;
- created, edited, reloaded, and cross-account-isolated a pantry Paneer item (1 kg → 2 kg);
- created a fictional dog with age, weight, chicken allergy, and veterinary instruction, then retrieved the supported local Kannada Pet Meal Plan; and
- verified a separate authenticated account had an empty pantry.

The meal route emitted harmless local fallback warnings for an unconfigured legacy `DYNAMODB_USERS_TABLE`; entitlement was nevertheless verified through the real local `SubscriptionRepository` fixture and every plan request returned HTTP 200. This compatibility fallback should be cleaned up before release, but did not access AWS or affect local plan persistence.

### Blocked / remaining

- Ask MAMA was not called: unresolved prompts can invoke the live provider and that is not authorised.
- No external payment, email, AI, or AWS request was made.
- UI-level English/Hindi/Kannada navigation persistence, grocery-list persistence, and an executable deletion workflow remain unverified. Account deletion's HTTP 409 remains an intentional documented safety preflight, not a defect.

### Final verification and cleanup

| Check | Result |
| --- | --- |
| Automated regression | **118 passed, 0 failed, 0 skipped/cancelled/todo**; 11.92 s |
| ESLint | PASS — exit 0 |
| TypeScript | PASS — `npx tsc --noEmit`, exit 0 |
| Fresh isolated build | **Exit code unverified.** The runner emitted `Creating an optimized production build ...` but returned no completion/exit record; no build-success claim is made. |
| Final fictional data cleanup | PASS — `LOCAL_TABLE_DELETED=mamaai-local-qa-final-20261102` |
| Service cleanup | PASS — Dynoxide PID 27020 stopped; no 3100/8010 listener remained (only a closed `TIME_WAIT` connection). |

Final recommendation remains **NO-GO** until grocery-list persistence/UI localization and the other blocked/outstanding workflows are completed, and a fresh build has a captured exit code.
