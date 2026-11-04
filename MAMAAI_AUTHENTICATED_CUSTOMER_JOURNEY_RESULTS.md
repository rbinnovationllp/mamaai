# Authenticated customer-journey results — 2 November 2026

## Local isolation and Dynoxide

- Dynoxide executable: `node_modules/dynoxide/bin/dynoxide` (package `dynoxide@1.5.0`).
- Initial startup failure: `unable to open database file: .qa\\dynoxide-final`. The command supplied a directory to `--db-path`, while installed Dynoxide documents it as a SQLite **file** path.
- Correction: used `.qa\\dynoxide-final\\dynoxide.sqlite`, with `--host 127.0.0.1 --port 8010`.
- Verified listener: `127.0.0.1:8010` (PID 8264 at observation).
- Verified API readiness: `ListTables` returned `mamaai-local-qa-final-20261102` using `LOCAL_TEST_ONLY` credentials.

No production AWS, Vercel, payment, email, or AI provider was accessed.

## Browser execution

| Scenario | Desktop | Mobile | Evidence |
| --- | --- | --- | --- |
| Authenticated product-flow test | BLOCKED | Not run | First desktop run reached registration but found a stale fictional email (HTTP 409). After deleting/recreating only `mamaai-local-qa-final-20261102`, it reached the same registration route and correctly received HTTP 429 from the durable local rate limiter. |
| Mixed-diet weekly plan and components | Not run | Not run | Authentication was blocked by the rate limiter; no restriction was bypassed. |
| Grocery generation/replacement/persistence/isolation | Not run | Not run | Dependent on authenticated setup. |

The 429 is an expected security control, not evidence that registration or the product workflow passed. The configured local application table retains rate-limit state; recreating the separate fixture table cannot reset it safely.

## Recovered execution evidence — 2 November 2026

The later desktop Playwright run had not returned console completion to the caller, but its local result artifact, `test-results/.last-run.json`, records `{ "status": "passed", "failedTests": [] }`. It is therefore recorded as **one recovered desktop Playwright pass**. No result artifact establishes a mobile execution, so mobile remains **not run**. At recovery time no process was listening on 8010 or 3100, so the local QA services had ended.

The rate-limit isolation correction uses one fresh local-only table for server, fixture writer and test configuration: `mamaai-local-qa-browser-20261102`. The policy itself remains `auth_register_ip`, five attempts per 3600 seconds, keyed by HMAC(IP) and stored in the configured local DynamoDB table. The earlier 409 was an existing fictional email; the later 429 was durable state in the mismatched application table.

## Automated evidence

- `npx tsc --noEmit`: **PASS**, exit code **0** after correcting the two Playwright page-evaluation request typings.
- Prior `npm test`: **121 passed, 0 failed**.
- New Playwright desktop executions: **0 passed, 2 blocked/failing setup attempts** (HTTP 409 stale synthetic identity, then HTTP 429 rate limiting).

## Build

Not rerun. The most recent bounded isolated build remains blocked at page-data collection without a terminating exit code; no success is claimed.

## Release recommendation

**NO-GO.** Use a new, explicitly isolated rate-limit namespace/table or wait for its local limit window to expire, then rerun the desktop/mobile authenticated customer journey. Do not clear or weaken the durable rate limiter merely to make QA pass.
