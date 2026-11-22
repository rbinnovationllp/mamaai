# Daily Planner QA Report — Local Implementation

| Check | Result | Evidence |
| --- | --- | --- |
| Shared TypeScript validation | Passed | `npx tsc --noEmit --incremental false` completed successfully after implementation. |
| Focused daily planner / Ask MAMA regression | Passed | 12/12 tests across daily-planner and Ask MAMA routing checks. |
| Full regression | Passed | `npm test`: 188 passed, 0 failed. |
| Production build | Passed | `npm run build` (`next build --webpack`) completed with native exit code 0. |
| Jain/Satvik and separate-meal visible controls | Passed (static/form contract) | The approved formatted `/today` page presents both controls; the validated request schema accepts them, the route forwards the separate-alternative instruction, and the plan view renders existing member guidance. |
| Authenticated local mobile generation | Not run | The available local browser had no isolated QA account/session or loopback DynamoDB access. Unauthenticated mobile routing to sign-in passed; do not treat that as generation or persistence evidence. |
| Isolated QA environment | Passed | Dynoxide listened only on `127.0.0.1:8010`; repository provisioner created only `mamaai-local-qa-gemini` and `mamaai-local-qa-gemini-analytics`. |
| Normal fictional registration | Passed after environment repair | First normal UI request safely failed 500 while the loopback emulator was absent. Once restored, the same UI flow returned HTTP 201 and reached `/today`. |
| Repository local verifier | Passed with mocked provider | Registration 201, profile save 200, and saved fictional peanut allergy confirmed. Ask MAMA mock/provider path returned its safe 500 unavailable result; no live provider was called. |
| 390px daily-planner controls | Passed | Jain/Satvik diet options and per-member separate-meal checkbox appeared and accepted fictional two-member selections. |
| Daily-plan POST payload | Blocked | Browser action approval quota ended before Generate could be clicked after control selection. No request body is reported. |
| Generated separate-meal guidance | Blocked | Depends on the unperformed authenticated generation request. Static route/prompt/result rendering checks passed, but this is not a browser pass. |
| Reload and sign-out persistence | Blocked | Depends on the unperformed authenticated generation request and browser action availability. |
| Missing-age handling | Passed (automated/static) | The free schema permits omitted age while `NutritionContextService` suppresses personalised nutrition/hydration estimates; permanent profile save rejects missing ages. Browser assertion remains not run. |
| Mobile bottom navigation overlap | Fixed locally; browser recheck blocked | The fixed nav intercepted lower controls at 390px. `/today` now has mobile bottom-safe padding (`pb-28`); TypeScript, tests and build passed after the fix. |
| Authenticated browser, local DynamoDB | Not run | Requires the isolated local QA launcher and a browser surface. |
| Isolated Vercel preview | Not run | No deployment was made by this change set. |
| Live Gemini / OCR | Blocked | Preview-only authorised Gemini configuration and browser QA are still required. |
| Razorpay Test Mode | Blocked | Rotated test credentials, webhook, and an isolated deployment are required. |

Do not treat static tests as a real payment, AI, or browser verification.
