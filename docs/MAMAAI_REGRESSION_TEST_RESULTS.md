# MAMAAI Regression Test Results

Date: 23 October 2026

| Command / suite | Result | Evidence |
|---|---:|---|
| `npm test` | 34 passed, 0 failed | Food-safety, Ask MAMA, sessions, authorization, export/deletion preflight and new bypass/Help tests. |
| `npm run lint` | Completed without reported lint diagnostics | The process required additional local wait time; no error output was emitted. |
| `npx tsc --noEmit --pretty false` | Passed, exit code 0 | No diagnostics. |
| `npm run build` | Compilation succeeded | Next.js reported `Compiled successfully`; process completed after its TypeScript phase. No deployment occurred. |
| `npx playwright test --config playwright.local-mamaai.config.ts` | 8 passed, 0 failed, 0 skipped | One worker; viewports 360, 390, 768, 1440; JSON report at `C:\Users\HP\rbil-testing\local-mamaai-readiness-results\results.json`. |

## Browser coverage

- Homepage controls and no horizontal scroll at all four required widths.
- Primary mobile navigation at 360/390; desktop navigation at 768/1440.
- Ask MAMA launcher visible alongside mobile navigation.
- Homepage plan links, direct route/refresh, keyboard navigation and browser back.
- Footer legal route and Hindi language selection.

## Not executed

Real Gemini, Razorpay, AWS/DynamoDB, email/OTP and real account-deletion flows were intentionally not executed.
