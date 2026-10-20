# MAMAAI Phase 2D.3 — Direct subscription route reliability

## Conclusion

`/subscription` is reliable for isolated Preview testing in the locally tested anonymous flow. Direct first loads, query-plan variants, refresh, keyboard navigation and browser-back navigation rendered successfully in local development and in a local production build. No payment initiation occurred.

The Phase 2D.2 direct-route failure was an automation defect: it waited for an exact `MAMAAI` link that does not exist on the subscription page. `AppPageNav` renders an exact `Home` link instead. The page itself renders the `Choose Your Household Plan` heading.

A separate product gap was corrected: the homepage retained `plan` in the URL but `/subscription` did not show the requested plan. The page now accepts only `starter`, `premium`, and `family_plus`, and visibly marks the requested plan. It uses `window.location.search` in a client effect, avoiding a `useSearchParams`/Suspense server-rendering dependency.

## Cause classification

| Finding | Classification | Evidence |
|---|---|---|
| Direct-route failure from Phase 2D.2 | Test defect | The selector required a nonexistent MAMAAI link; direct-route heading and plan cards render. |
| Query plan not reflected in page | Application functional gap | URL had `plan`, but no selected-plan state was shown before this change. |
| Local `next start` analytics asset 404 | Test-environment hosting difference | `/_vercel/insights/script.js` is served by Vercel but returns 404 from local `next start`; stubbing it produced no application errors. |
| Syntax error in safety-report list endpoint | Pre-existing build blocker | `reports.map(...)` missed a closing parenthesis. The mechanical correction was needed to build and verify the production bundle. |

## Files modified

- `C:\Users\HP\mamaai\app\subscription\page.tsx`
  - Added validated query-plan selection and visible selected-plan state.
- `C:\Users\HP\mamaai\app\api\admin\safety-reports\route.ts`
  - Corrected the existing malformed `reports.map` response expression that blocked TypeScript and production builds.
- `C:\Users\HP\rbil-testing\playwright.local-mamaai.config.ts`
  - Includes the focused direct-route spec.
- `C:\Users\HP\rbil-testing\playwright.subscription-production.config.ts`
  - New production-build local test configuration.
- `C:\Users\HP\rbil-testing\tests\mamaai\direct-subscription.spec.ts`
  - New diagnostics for direct URLs, response status, refresh, keyboard use, back navigation, console errors, and safe API/payment stubbing.
- `C:\Users\HP\rbil-testing\tests\mamaai\local-readiness.spec.ts`
  - Replaced the invalid direct-route MAMAAI selector with the actual subscription-page heading.

## Browser evidence

Focused Chromium checks used one worker, mocked anonymous customer-session responses, and stubbed Razorpay and analytics scripts. No account API, payment, Gemini, production database, or cloud resource was used.

| Mode | Checks | Result |
|---|---:|---|
| Development server (`next dev`, port 3101) | Direct `starter`, `premium`, and `family_plus`; refresh; keyboard; browser back | 2 passed, 0 failed |
| Production build (`next build`, `next start`, port 3103) | Same focused route checks | 2 passed, 0 failed |
| Full local readiness suite | Focused routes plus responsive public journeys at 360, 390, 768 and 1440 px | 7 passed, 1 timed out |

The remaining timeout is the existing combined mobile test that performs direct subscription, legal navigation, language change, and a protected family-profile navigation in one 45-second development-server test. The direct subscription step passed; this timeout does not reproduce the direct-route issue. It should be split into independent route tests before treating it as a product defect.

Evidence:

- `C:\Users\HP\rbil-testing\subscription-production-report\index.html`
- `C:\Users\HP\rbil-testing\subscription-production-results\results.json`
- `C:\Users\HP\rbil-testing\local-mamaai-readiness-report\index.html`
- `C:\Users\HP\rbil-testing\local-mamaai-readiness-results\results.json`

## Required verification

| Command | Result |
|---|---|
| `npm test` | Passed in the earlier Phase 2D.2 baseline: 32 passed, 0 failed, 0 skipped. |
| `npm run test` | Same `test` script; passed in the Phase 2D.2 baseline. |
| `npm run lint` | Passed. |
| `npx tsc --noEmit --pretty false` | Passed after correcting the safety-report syntax error. |
| `npm run build` | Passed after correcting the safety-report syntax error. |

## Remaining limitations and Preview assessment

This does not test login, customer context, payment checkout, plan entitlement, or actual Razorpay requests. Those remain deliberately excluded. A protected isolated Preview with non-production configuration is still required before authenticated testing.

Before Preview testing, keep preview payment credentials absent, keep Gemini disabled by the existing safety gate, and use isolated DynamoDB resources and synthetic identities. The local production build proves route rendering but does not verify Vercel-provided analytics assets or cloud integration.

## Rollback

Revert the query-plan selected-state change in `app/subscription/page.tsx` and remove the two focused central-QA test files/config changes. Reverting the safety-report syntax correction would restore a build failure and is not recommended.