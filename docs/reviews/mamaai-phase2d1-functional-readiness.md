# MAMAAI Phase 2D.1 functional readiness

## Scope

This phase made only local source and central-QA changes. No cloud resource, production data, Gemini call, payment, subscription, commit or deployment occurred.

## Customer-data location and ownership matrix

| Data group | Current storage/key | Owner boundary | Export state | Deletion state |
|---|---|---|---|---|
| Customer identity and preferences | MAMAAI DynamoDB: `USER#{userId}` / `CUSTOMER#PROFILE` | Verified `requireUser()` ID | Included | Preflight only |
| Family profile, members, allergies, restrictions | `USER#{userId}` / `FAMILY_PROFILE#CURRENT`; older family context uses `FAMILY#{familyId}` | Verified user ID plus family ownership | Included from profile; family-context legacy records need inventory | Preflight only |
| Pantry | `USER#{userId}` / `PANTRY#...` | Verified user ID | Included | Preflight only |
| Meal and weekly-plan history | family GSI records (`FAMILY_MEAL_PLANS`, `FAMILY_WEEKLY_PLANS`) | Family ID obtained only from the verified user profile | Included when GSI is configured | Preflight only |
| Feedback and safety reports | user learning events; safety-report index | Feedback export includes user-owned events. Staff list redacts `userId`. | Included / staff access restricted | Retention approval required |
| Subscription and payments | `USER#{userId}` / `SUBSCRIPTION#...`, `PAYMENT#...`, entitlement | Verified user ID | Included | Legal/financial retention approval required |
| Customer sessions | `SESSION#{tokenHash}` only | Hash validates a specific cookie | Explicitly excluded from exports | Bulk customer-session revocation blocked: no user-session GSI |
| Analytics | in-memory/local anonymous visitor IDs and separate analytics configuration | Not currently joined to a customer account | Excluded | Retention/inventory decision required |

## Implemented local features

- `CustomerDataRepository` assembles an authenticated, customer-scoped JSON export. The API route is `GET /api/customer/data-export` and uses `requireUser()`; it never accepts a caller-supplied user ID.
- `POST /api/customer/account-deletion` performs only a customer-scoped deletion preflight and returns HTTP 409. It never deletes records.
- `ai-usage-quota.ts` is a durable, conditional DynamoDB quota reservation framework for Ask MAMA, meal generation and regeneration. It remains disabled unless `MAMA_AI_QUOTAS_ENABLED=true`; enabling it without explicit per-plan request and cost values fails closed.
- A safety-report repository, pending/in-review/resolved transitions, severity classification, audit history, and reviewer-only routes were added. A reviewer requires both existing admin authorization and an explicit `MAMA_AI_SAFETY_REVIEWER_IDS` allowlist. List/update responses redact customer identity.
- Mounted the existing footer globally. This fixed a local browser finding: legal links had existed but were unreachable from the home page.

## Files changed

- `lib/repositories/customer-data-repository.ts`
- `app/api/customer/data-export/route.ts`
- `app/api/customer/account-deletion/route.ts`
- `lib/server/ai-usage-quota.ts`
- `lib/repositories/safety-report-repository.ts`
- `lib/server/admin.ts`
- `app/api/admin/safety-reports/route.ts`
- `app/api/admin/safety-reports/[reportId]/route.ts`
- `app/api/feedback/route.ts`
- `app/layout.tsx`
- `tests/security.test.cjs`
- Central QA only: `C:\Users\HP\rbil-testing\playwright.local-mamaai.config.ts`, `C:\Users\HP\rbil-testing\tests\mamaai\local-readiness.spec.ts`

## Verification

| Check | Result |
|---|---|
| `npm test` | Pass: 32 passed, 0 failed, 0 skipped |
| `npm run test` | Pass: 32 passed, 0 failed, 0 skipped |
| `npm run lint` | Pass |
| `npx tsc --noEmit --pretty false` | Pass |
| `npm run build` | Pass; `.next/BUILD_ID` present |
| Local Playwright | 4 viewport tests passed at 360, 390, 768, 1440 px: header/nav, language selector, Ask MAMA launcher, footer link and horizontal-overflow checks. One interaction test failed: clicking a homepage `Choose Family Starter` link did not change route during local Playwright, despite a correct `/subscription` href. This remains a local client-navigation defect and must not be counted as verified. |

## Infrastructure and owner decisions required

1. **Deletion:** add a secure user-to-session index, approve payment/safety-report retention, implement a separately authorized deletion worker with idempotent audit trail, and grant scoped DynamoDB deletes only to isolated resources first.
2. **Exports:** approve delivery authentication, data-format/retention policy and production GSI validation. Browser download must be tested with synthetic account data.
3. **AI quotas:** approve plan limits, daily cost ceilings, provider price assumptions, telemetry retention, and an emergency kill switch. No quota is active until then.
4. **Safety review:** configure a separate reviewer identity allowlist, staff operating procedure, urgent escalation process, notifications policy and review retention. No customer notifications are sent.
5. **Preview:** use an isolated DynamoDB table/GSI, customer test accounts, non-production payment/email/webhook settings, strong session/rate-limit secrets and the still-disabled Ask MAMA Preview gate before any real Gemini test.

## Remaining security risks

- The existing admin mechanism is still a configured shared secret; safety review adds an explicit allowlist but does not replace this with a staff identity provider.
- Existing sessions cannot be revoked in bulk by user until a user-session index is approved and deployed.
- Family-meal export relies on the configured GSI and needs isolated DynamoDB verification.
- The client-navigation test failure prevents a complete functional approval for home plan-card actions.
