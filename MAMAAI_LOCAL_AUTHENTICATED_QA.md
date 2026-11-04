# MAMAAI local DynamoDB and authenticated QA

Date: 1 November 2026 (Asia/Kolkata)  
Project: `C:\Users\HP\mamaai-preview-isolated`  
Scope: evaluation only. No AWS request, cloud resource creation, production data access, deployment, payment activation, external account creation, or authenticated browser test occurred.

## Executive result

**BLOCKED before database installation and before any authenticated fixture creation.** Java is suitable, but the official DynamoDB Local package is not installed. More importantly, the application currently has no local endpoint configuration path and deliberately rejects static AWS credentials in its test/isolated runtime. Starting an emulator without a code/configuration change would not make the app use `localhost`; it could instead rely on normal AWS SDK endpoint resolution, which is unacceptable.

No AWS endpoint was contacted.

## Phase 1 — DynamoDB Local evaluation

| Check | Result |
| --- | --- |
| Java runtime | PASS: Eclipse Temurin OpenJDK `17.0.14` (64-bit) is installed and meets DynamoDB Local Java requirements. |
| Docker | Not installed; no Docker installation was attempted. |
| Official DynamoDB Local | Not present in the project or local QA locations. |
| Docker-free operation | Feasible in principle: AWS distributes DynamoDB Local as a Java archive/ZIP that runs with `java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port <port>`. |
| Required distribution files | `DynamoDBLocal.jar`, `DynamoDBLocal_lib/` native library directory, and the distribution licence/readme files. A project-local data directory and launch script/configuration are also required. |
| Existing endpoint support | BLOCKED: `lib/repositories/dynamodb-client.ts` constructs `DynamoDBClient` with only `region` and OIDC credentials. It has no endpoint override or localhost guard. |
| Existing isolated guard | PASS for cloud isolation: `lib/server/dynamodb-configuration.ts` rejects production table names and static credentials in `test`/`preview`/`isolated` runtime. This is incompatible with DynamoDB Local’s fake credentials until an explicitly local-only branch is designed. |

## Compatibility finding

The AWS SDK v3 Document Client used by the repositories is compatible with DynamoDB Local once constructed with a localhost endpoint and dummy credentials. The current application client is not yet compatible as configured because:

1. It does not accept `endpoint: "http://127.0.0.1:<port>"`.
2. It always follows the existing runtime/credential branch; an isolated runtime expects Vercel OIDC, while test runtime forbids static credentials.
3. Its table schema has not been provisioned locally. The isolated cloud table expects `PK`, `SK`, `GSI1PK`, `GSI1SK`, and `GSI1`; some legacy repository code also refers to older named tables/indexes and must be exercised against the chosen local schema before a full E2E claim.

## Required local-only isolation design

Do not run authenticated QA until all of the following are implemented and verified:

1. Add a dedicated `MAMA_AI_DYNAMODB_LOCAL=true` branch that is accepted only with `NODE_ENV=test` and an exact `http://127.0.0.1:<approved-port>` endpoint. Reject `localhost` alternatives, private LAN IPs, HTTPS endpoints, non-test runtimes, production table names, and any endpoint not loopback.
2. Require a test-only table name such as `mamaai-local-qa-<run-id>`; reject all existing production and preview table identifiers. Use a separate matching analytics table or an explicitly documented single-table local schema.
3. Require non-secret dummy values such as `AWS_ACCESS_KEY_ID=LOCAL_TEST_ONLY` and `AWS_SECRET_ACCESS_KEY=LOCAL_TEST_ONLY`; reject any credential that resembles an AWS access-key format or any non-local endpoint. Do not read host AWS profiles, metadata credentials, OIDC, or `.aws` files in local mode.
4. Construct `DynamoDBClient` with the explicit loopback endpoint and dummy credentials only in that local branch. All other runtimes retain their current fail-closed/OIDC behavior.
5. Create the local table and `GSI1` only through a project-local provisioning script, verify the schema, and delete or rotate the run-prefixed table/data after QA. Bind the emulator to loopback only and use `-sharedDb` with a project-local ignored data directory.
6. Add tests that prove the local branch rejects an absent endpoint, non-loopback endpoint, production/preview table, AWS-like credentials, and missing local runtime flag before client construction.

## Authenticated browser and database results

| Requested area | Result |
| --- | --- |
| Mobile/email registration, login/logout, persistence, recovery | NOT RUN — no verified local database endpoint. |
| Five-member meal, fasting, tiffin, paneer, child/senior plan, saved plan, grocery | NOT RUN — no fictional records created. |
| Personalised Ask MAMA | NOT RUN — provider remains separately unapproved; no live provider call made. |
| English/Hindi/Kannada | Public browser coverage exists; authenticated persistence coverage NOT RUN. |
| Family Plus pet / entitlement restrictions | NOT RUN — requires local authenticated persistence and fixture setup. |
| Export / account deletion | NOT RUN — deletion remains an irreversible action requiring separate approval. |
| Ownership, cross-account access, session revocation, password hashing | Existing source/automated coverage only; live local verification NOT RUN. |

## Fictional fixture plan (not created)

- `qa-mobile-<run-id>`: mobile-only account.
- `qa-email-<run-id>@example.test`: email-only account.
- Five fictional members: Father 66 (Tuesday fasting), Mother 66, Son 33 (working), Daughter-in-law 30 (working, paneer preference), Granddaughter 3.5.
- `qa-isolation-b-<run-id>@example.test`: separate household to prove cross-account denial.
- A fictional Family Plus pet only after a local entitlement is explicitly provisioned.

Passwords, recovery codes, cookies, exports, and identifiers must stay out of source, screenshots, reports, and chat logs.

## Defects found / corrected

No product code was changed. One QA-blocking configuration gap was identified: **no localhost-only DynamoDB endpoint branch exists**. This must be corrected and covered by automated negative tests before any local authenticated run.

## Exact approval needed to continue

Please approve all of the following together:

1. Downloading the official DynamoDB Local distribution to a project-local ignored directory only (no system-wide installation, no Docker, no administrator action).
2. Adding the dedicated localhost-only configuration/client branch, local provisioning script, and negative isolation tests described above.
3. Starting DynamoDB Local bound to `127.0.0.1` with a project-local data directory and creating/deleting only run-prefixed fictional local tables/records.
4. Running authenticated Playwright tests only after the local isolation tests and schema provisioning pass.

## Production readiness recommendation

**NO-GO for authenticated release verification.** The current build and regression baseline remain positive, but local authenticated E2E cannot be safely started until the requested local-only endpoint implementation and official emulator download are explicitly approved and verified.
