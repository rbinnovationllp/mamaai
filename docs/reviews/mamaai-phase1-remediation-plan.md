# Phase 1 remediation plan

## P0 - food safety
1. Add an ingredient taxonomy with aliases, derivatives, hidden-risk and cross-contact status; validate before display/persistence. Files: `lib/ai/safety-validation-service.ts`, new food-safety data module, tests. Rollback: feature flag and existing validator retained.
2. Add deterministic infant, Jain/fasting and pet toxicity validators; gate pet personalization until tests pass. Risk: false positives; use manual-review state for unknown data.
3. Add adversarial Ask MAMA and multilingual safety tests. No external calls.

## P1 - identity/persistence
1. Remove silent in-memory fallback for authenticated production paths; return a recoverable persistence error. Affected services: family, meal planning, retention, analytics. Rollback: staging feature flag only.
2. Add two-identity authorization integration tests for every customer repository/API path.
3. Add session expiry/logout/recovery coverage and replace broad admin shared-secret use with reviewed role/session design.

## P2
1. Verify legal/refund/deletion/export routes and actual policy content against operations.
2. Extend accessible mobile and localization regression coverage.

## P3
Brand and icon corrections after P0/P1.

## Safe test results
- `npm test`: 7 passed, 0 failed, 0 skipped.
- `npm run test:security`: 7 passed, 0 failed, 0 skipped.
- Lint was started; final outcome was not captured before this report and remains unverified.

Each batch is independently reviewable and must run lint, unit tests, safety regressions, and staging authorization tests before merge. No pricing, retention, payment, migration or deployment change is included.
