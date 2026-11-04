# Authenticated synthetic customer QA plan

Scope: the isolated Vercel project and `mamaai-preview-test` only, after RBIL approves protected smoke-test access. Use fictional accounts and records only. Do not activate live payments or AI services.

## Test data

- Customer A: `qa-smoke-a-<run-id>@example.test`; fictional household with two adult members and one child.
- Customer B: `qa-smoke-b-<run-id>@example.test`; separate fictional household.
- Pantry examples: rice, lentils, tomatoes and a fictional expired item. No real addresses, phone numbers, medical histories or payment data.
- Record the generated run ID and cleanup outcome, but never passwords, session cookies, secrets or raw exports.

## Preconditions

1. RBIL confirms the protected smoke test returned all six expected `true` booleans.
2. Test only the current isolated deployment at 1440px and 390px after Vercel Authentication has granted the operator/viewer access.
3. Confirm payments and paid AI are disabled before registration.

## Workflows and acceptance evidence

1. Registration and login: register Customer A, complete login, reload, confirm the session persists, then log out and confirm protected customer APIs return no data.
2. Session isolation: log in as Customer B in a separate clean browser context; confirm neither household, pantry, export nor session data can be read or changed across accounts.
3. Household profile: create Customer A's synthetic family, edit an ordinary profile field, reload and confirm persistence. Attempt only documented, safe household-replacement flows; record cooldown and audit behaviour without bypassing limits.
4. Pantry: add, edit and delete the synthetic pantry entries; reload after each operation and confirm the expired item is handled according to the UI contract.
5. Planner: with a persisted profile, open the planner and confirm it supplies clear authenticated/profile-completion behaviour without a redirect loop. Keep AI-disabled failure messaging explicit if generation is unavailable.
6. Export: request Customer A's export, verify it is authenticated and contains only Customer A's synthetic information; do not store or share the downloaded package beyond the RBIL-controlled test workstation.
7. Account/security: verify session listing, logout, password-change and recovery-code interfaces only to the extent the synthetic account and approved flow permit. Do not disclose generated credentials or recovery material.
8. Cleanup: delete only the synthetic pantry/household test records through approved test cleanup mechanisms; record identifiers and confirmation. Do not invoke irreversible account-deletion functionality while ISS-006 remains blocked.

## Evidence to record

For each workflow record: run ID, deployment URL and time, 390px/1440px result, HTTP status categories, expected user-visible result, account-isolation result and cleanup result. Record only booleans/statuses and sanitized screenshots; never secrets, cookies, passwords, full exports or customer data.

## Stop conditions

Stop and report immediately if Vercel protection is bypassed unintentionally, a request reaches a non-isolated resource, a test requires payment/AI activation, cleanup cannot be confirmed, or any cross-account data is visible.
