# Daily Planner QA Report — Local Implementation

| Check | Result | Evidence |
| --- | --- | --- |
| Shared TypeScript validation | Passed | `npx tsc --noEmit --incremental false` completed successfully after implementation. |
| Focused daily planner / Ask MAMA regression | Passed | 12/12 tests across daily-planner and Ask MAMA routing checks. |
| Full regression | Passed | `npm test`: 188 passed, 0 failed. |
| Production build | Passed | `npm run build` (`next build --webpack`) completed with native exit code 0. |
| Jain/Satvik and separate-meal visible controls | Passed (static/form contract) | The approved formatted `/today` page presents both controls; the validated request schema accepts them, the route forwards the separate-alternative instruction, and the plan view renders existing member guidance. |
| Authenticated local mobile generation | Passed | Fresh fictional account in Playwright Chromium at a 390px mobile viewport completed normal registration and `/today` generation against the loopback-only QA server. The real daily-plan POST returned 201. |
| Isolated QA environment | Passed | Dynoxide listened only on `127.0.0.1:8010`; repository provisioner created only `mamaai-local-qa-gemini` and `mamaai-local-qa-gemini-analytics`. |
| Normal fictional registration | Passed after environment repair | First normal UI request safely failed 500 while the loopback emulator was absent. Once restored, the same UI flow returned HTTP 201 and reached `/today`. |
| Repository local verifier | Passed with mocked provider | Registration 201, profile save 200, and saved fictional peanut allergy confirmed. Ask MAMA mock/provider path returned its safe 500 unavailable result; no live provider was called. |
| 390px daily-planner controls | Passed | Jain/Satvik diet options and per-member separate-meal checkbox appeared and accepted fictional two-member selections. |
| Daily-plan POST payload | Passed | Sanitized Playwright request summary confirmed consent, two members with ages, one `jain` diet, and one `needsSeparateMeal: true`; no personal values or credentials were retained in the report. |
| Generated separate-meal guidance | Passed | The normal rendered plan showed “Family-member guidance” and the selected separate-meal member’s guidance. |
| Reload and sign-out persistence | Passed | The saved plan and member-specific guidance survived reload; the profile review was then saved (family-profile POST 200), followed by normal logout (200), sign-in, and return to the same saved `/today` plan. |
| Missing-age handling | Passed (automated/static) | The free schema permits omitted age while `NutritionContextService` suppresses personalised nutrition/hydration estimates; permanent profile save rejects missing ages. Browser assertion remains not run. |
| Mobile bottom navigation overlap | Passed | The 390px Playwright journey selected lower ingredient and consent controls, generated the plan, and completed save/logout/sign-in without the fixed navigation intercepting controls. |
| Authenticated browser, local DynamoDB | Passed | Local launcher used only loopback DynamoDB (`127.0.0.1:8010`) and `mamaai-local-qa-gemini*` tables. |
| Safe `/today` sign-in return | Fixed and passed | `/today` was added to the existing safe same-origin destination allowlist. A normal sign-in from `/account/access?next=/today` now returned the fictional account to its saved daily plan instead of silently falling back to `/planner`. |
| Isolated Vercel preview | Not run | No deployment was made by this change set. |
| Live Gemini / OCR | Blocked | Preview-only authorised Gemini configuration and browser QA are still required. |
| Razorpay Test Mode | Blocked | Rotated test credentials, webhook, and an isolated deployment are required. |

Do not treat static tests as a real payment, AI, or browser verification.
