# MAMAAI Phase 2D.2 subscription navigation

## Root cause

The homepage plan-card controls used Next `Link` client-side navigation. In the local Chromium run, Playwright clicked the visible, correctly addressed `/subscription` link but the URL stayed at `/`. There was no overlay, authentication redirect, middleware redirect, hydration exception, or route-level redirect observed. The route rendered when reached through the browser journey after native navigation. This is treated as unreliable client-side interception in the local development runtime.

A separate console finding was also corrected: the CSP allowed Vercel Insights connections but omitted the configured script origin `https://va.vercel-scripts.com`, causing a browser CSP error.

## Correction

- Homepage plan cards now use ordinary keyboard-accessible anchors with plan-specific targets:
  - `/subscription?plan=starter`
  - `/subscription?plan=premium`
  - `/subscription?plan=family_plus`
- This retains normal browser navigation and preserves the selected plan in the URL. It does not create a subscription, bypass account checks, alter prices/trials, or initiate payment.
- Public footer legal links and mobile-primary-navigation links now use standard anchors for the same reliable public-route behavior.
- `next.config.mjs` permits the already-configured Vercel Analytics script origin in `script-src`.

## Files modified

- `C:\Users\HP\mamaai\app\page.tsx`
- `C:\Users\HP\mamaai\components\Footer.tsx`
- `C:\Users\HP\mamaai\components\MobilePrimaryNav.tsx`
- `C:\Users\HP\mamaai\next.config.mjs`
- `C:\Users\HP\rbil-testing\playwright.local-mamaai.config.ts`
- `C:\Users\HP\rbil-testing\tests\mamaai\local-readiness.spec.ts`

## Local Playwright results

The final local suite ran on fresh port 3101 with one worker.

| Check | Result |
|---|---|
| Public header, CTA, Ask MAMA launcher, footer link, overflow and console at 360 px | Pass |
| Same at 390 px | Pass |
| Same at 768 px | Pass |
| Same at 1440 px | Pass |
| Family Starter, Premium and Plus home-card navigation | Pass |
| Plan-specific route and browser back navigation | Pass |
| Direct `/subscription` URL | URL reached, but initial direct-render readiness did not complete within 10 seconds in the local dev server; blocked from full UI verification |
| Footer legal link click and mobile family navigation | Included in the final public-journey test but blocked after the direct subscription render issue |

Evidence is retained in the local central-QA Playwright output:

- `C:\Users\HP\rbil-testing\local-mamaai-readiness-report\index.html`
- `C:\Users\HP\rbil-testing\local-mamaai-readiness-results\results.json`
- Failed direct-route trace/screenshot, if retained by the runner: `C:\Users\HP\rbil-testing\test-results\local-readiness-direct-sub-61af4-boarding-entry-work-locally\`

## Regression verification

| Command | Result |
|---|---|
| `npm test` | Pass: 32 passed, 0 failed, 0 skipped |
| `npm run test` | Pass: 32 passed, 0 failed, 0 skipped |
| `npm run lint` | Pass |
| `npx tsc --noEmit --pretty false` | Pass |
| `npm run build` | Pass |

## Remaining blockers

1. Direct first-load rendering of `/subscription` must be traced in a clean local production-mode server or isolated Preview. The URL is reachable, but the local development renderer did not expose the expected document within the test window.
2. The subscription page still contains previous pet-oriented commercial copy. It was outside the narrow navigation fix but conflicts with the earlier decision that pet-food planning is unavailable.
3. Actual plan preselection from the new `plan` query parameter is not yet implemented in the subscription page. The selection is preserved in the URL only; payment remains unmodified and untested.
4. No payment, login, registration submission, account creation, cloud request, or production data action was performed.
