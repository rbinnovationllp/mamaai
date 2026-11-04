# Public launch readiness — 2 November 2026

| Feature | Status | Evidence | Severity | Required correction |
| --- | --- | --- | --- | --- |
| Registration / durable sessions | PASS (local scope) | Prior local authenticated and regression evidence; rate limiter remained active | P1 | Run an isolated staging smoke test before public use. |
| Family profile persistence | PASS (limited desktop API coverage) | Recovered desktop test persisted a five-member profile | P1 | Add browser UI coverage. |
| Weekly mixed-diet plan | BLOCKED | Focused test started but never produced a terminal result; earlier run was not against a newly verified listener | P0 | Diagnose the weekly request/worker hang and obtain saved/retrieved seven-day-plan evidence. |
| Grocery list / replacement | BLOCKED | No conclusive weekly-plan prerequisite | P0 | Test refresh, persistence, and replacement only after weekly creation succeeds. |
| Dietary component safety | PASS (unit/integration scope) | Deterministic final safety gate and 121-test suite | P1 | Exercise actual weekly response with mixed members. |
| Mobile journey | NOT TESTED | No mobile artifact | P1 | Run isolated mobile Chromium acceptance suite. |
| Payment / live entitlement | BLOCKED | No authorised provider sandbox or live payment test | P1 | Owner-approved provider test environment and webhook verification. |
| Account deletion | BLOCKED by deliberate preflight | Existing API returns safe 409; destructive path not approved | P1 | Approve/implement retention policy and controlled deletion worker. |
| Production build | BLOCKED | Previous bounded build stalled at page-data collection, no exit code 0 | P0 | Identify build-time page-data blocker and capture a normal exit 0. |
| Production source parity | BLOCKED | Tested checkout is dirty and separate Vercel preview project | P0 | Select release commit and compare it to production source before deployment. |

## Decision

- Invitation-only pilot: **NO-GO** — weekly plan and build are unverified.
- Free public launch: **NO-GO** — same P0 blockers plus mobile coverage absent.
- Paid public launch: **NO-GO** — P0 blockers and live payment/deletion operational evidence absent.
