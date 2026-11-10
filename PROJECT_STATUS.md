# MAMA AI Project Status

## Current Launch Snapshot - August 14, 2026

## Controlled beta entitlement — 5 November 2026

- Added an isolated-runtime-only, operator-granted beta entitlement. It is non-paying, non-renewing, expiry-bound, and restricted to Starter or Premium; Family Plus, demo/judge paths, browser flags, and production tables are rejected.
- Local validation completed for grant, expiration, revocation, owner isolation, payment/Ask MAMA isolation, authentication, planning, grocery safety, TypeScript, clean production build, and public browser smoke tests. No cloud deployment or production data access occurred.

Overall status: controlled hackathon launch and colleague payment testing candidate, pending final deployed Razorpay verification.


## Weekly Procurement and Global Planning Update - August 29, 2026

- Added a persisted Monday-Sunday weekly meal-plan architecture behind `/api/weekly-meal-plans`.
- Weekly plans are keyed by `familyId + weekStartDate` so refreshes reuse the saved plan instead of creating duplicate weeks.
- Added a DynamoDB generation lock (`WEEKLY_PLAN_LOCK#weekStartDate`) so simultaneous tabs or repeated requests do not start duplicate weekly generation.
- Added Saturday/Sunday lazy preparation in the planner: when a paid/trial user with a saved family opens MAMAAI on Saturday or Sunday, the app prepares or reuses the next Monday-Sunday plan and shows a visible next-week readiness banner.
- Added next-week procurement intelligence from the saved weekly plan: buy/check in advance, Monday-Tuesday items, midweek/later items, buy-close-to-cooking items, and tomorrow ingredient reminders.
- Midweek meal replacement now recalculates the selected weekly slot, weekly grocery requirements, procurement schedule, tomorrow reminders, and SabSewa Local shopping handoff from the updated selected meal.
- Added customer-profile recovery for weekly planning so a persisted family profile can rebuild the meal-planning family context across devices/PWA sessions.
- Global planning now routes international/non-Indian family contexts into global meal candidate pools instead of falling back to Indian lunch/dinner defaults. Explicit Indian cuisine/history still keeps Indian/regional planning strong.
- Global fallback is cost-controlled and deterministic when Gemini is unavailable; weekly results are persisted so the same week is reused.

Remaining QA note: live multi-country QA with real Gemini production output should still be repeated on the deployed site before large-scale paid acquisition. The code path now supports the architecture, but final content quality must be checked with realistic families in India, Canada, UK, UAE and Australia.

## Production Personalization Update - August 27, 2026

- Added mixed-diet joint-family planning support so MAMAAI can prefer one common base meal with vegetarian, eggetarian, vegan, or non-vegetarian add-ons only for the members who eat them.
- Added optional family food budget preference to the family profile: economical, moderate, flexible, no specific limit, or custom monthly food budget.
- Budget preference is persisted with the customer family profile and passed into planner/Gemini context so recommendations can prefer affordable ingredients, moderate variety, flexible premium choices, or custom monthly guidance.
- Component-level quantity planning now scales optional protein/add-on ingredients only for assigned members, reducing unnecessary duplicate cooking and grocery cost.
- Planning priority is now: safety/restrictions, explicit family preferences, mixed-diet common meal structure, budget, regional/cultural habits, pantry availability, recent history, and variety.

Production-readiness status:

- Public Next.js app builds successfully with `npm run build`.
- TypeScript validation passes with `tsc --noEmit`.
- Admin UI and `/api/admin/*` are protected by the root `proxy.ts` matcher and require `ADMIN_SECRET_KEY` authorization/session setup.
- Razorpay checkout now uses the correct real flow: create a server-side Razorpay subscription through `/api/razorpay/subscriptions`, then open Checkout with the returned Razorpay subscription id.
- Razorpay subscription records, payment transactions, current entitlement records, and webhook idempotency records now use DynamoDB instead of the MVP in-memory store.
- Admin CRM now has DynamoDB-backed customer listing by entitlement status, support notes, minimized customer export, and audit logging endpoints under protected `/api/admin/*` routes.
- Razorpay pricing is aligned as Family Starter INR 399 / US$4.99, Family Premium INR 599 / US$7.99, and Family Plus INR 999 / US$12.99.
- Local Razorpay smoke tests create Razorpay subscription objects for India and international plan selections after normalizing pasted plan values to the required `plan_...` id format. Final real payment acceptance still needs manual Checkout completion and webhook verification on the deployed Vercel environment.
- Family Plus includes extended four-paw member meal planning with separate pet-appropriate guidance.
- Main consumer surfaces support English, Hindi, and Kannada through the language provider: home, subscription, pantry, family profile, culture profile, Ask MAMA UI, Ask MAMA knowledge-base answers, PWA install guidance, and voice-input status messages.
- Browser voice-to-text input is implemented for safe text fields without paid speech API usage. Users must review/edit recognized text before submitting.
- PWA foundation is present: manifest, icons, service worker, install button/guidance, and Ask MAMA installation instructions.

Latest completed production-readiness work:

- Added root `proxy.ts` protection for both `/admin/*` and `/api/admin/*`.
- Corrected Razorpay checkout flow so the subscription page creates a provider subscription before opening Checkout.
- Added INR/USD Razorpay plan selection from separate MAMAAI environment variables.
- Added English, Hindi, and Kannada language support to the standalone subscription, pantry, family profile, and culture profile pages.
- Added browser-based voice-to-text input on safe text fields without introducing paid speech API usage.
- Updated `README.md` and `PROJECT_STATUS.md` for judge review and future handover.

Critical caveats before broad public paid production:

- Families, meal plans, pantry state, most analytics, and some admin dashboard summaries still rely on MVP in-memory services or partial DynamoDB endpoints.
- Full production authentication is still not connected. Payment routes now support a signed server-side user header and demo-compatibility mode, but a real auth provider must be connected before broad public launch.
- Razorpay must be verified end-to-end on the deployed Vercel environment with live/test keys, 19-character MAMAAI subscription plan ids, webhook URL, and webhook secret before inviting paying testers.
- `npm audit --omit=dev` currently reports high-severity advisories in the Next/PostCSS/sharp dependency chain; assess available safe updates before broad production exposure.
- Some deep planner microcopy remains English-first inside the large FamilyFlow experience, though core public pages and assistant flows now support the three target languages.

## Completed

- Added local **Snap a Meal** foundation beside Family Profile meal history: mobile camera/gallery input, text-description fallback, server-side Gemini dish/rough-portion draft, editable dish/portion review, selected household members, and confirm-before-save. Snap entries append to the existing `recentMealHistory` strings used by the weekly planner and retain per-member metadata separately. Photos are request-only and never update allergy or clinician records.
- Added authenticated `/api/meal-history/snap` read/analyse/save/delete route. The save path is idempotent when the same entry id is retried and does not create a second history marker.

- Added **Fill your family profile from a document** to the Family Profile page. It provides a printable/copyable blank form, filled example, typed-note import, and multi-page photo/scan/PDF selection with a review-before-apply flow. The import never saves original text or files; only the user-reviewed profile and history use the existing normal profile save.
- Pasted documents are parsed conservatively into household details, person records, and partial seven-day meal history. The review distinguishes **no known allergies** from **unanswered** and blocks applying a draft with unanswered allergy information or an uncertain allergy/clinician field. Existing member IDs/values are preserved when a document leaves a field blank.
- Image/PDF import is intentionally validated and gated: the browser can select up to five allowed pages, but OCR provider activation remains required before media content is extracted. No uploaded original is persisted by the application.
- Validation passed: `npx tsc --noEmit --incremental false` and `npm test` (177 passing tests, including typed document review, multi-file selection, and unresolved-allergy guard coverage).
- Document-import verification environment: **local** (`C:\\Users\\HP\\mamaai`). Synthetic handwritten two-page PNG fixtures are in `work/family-document-fixtures/`; the typed fixture is `FAMILY_PROFILE_DOCUMENT_EXAMPLE` in `lib/shared/family-profile-document.ts`. **Passed:** typed parsing/review guards and automated profile/planner safety regressions. **Blocked:** authenticated mobile upload → account save → sign-out/sign-in → seven-day plan verification; this environment has no authorised synthetic customer session or local DynamoDB test profile. The `GEMINI_API_KEY` is present locally and `MAMAAI_FAMILY_DOCUMENT_OCR_ENABLED=true` was enabled locally, but the protected OCR route cannot be exercised without that authenticated session. No staging or production system was touched.
- Verification results (local): **Passed** — `npm test` (177/177) and focused document-import tests (2/2); confirmed typed source preserves the similarly named fictional members, peanut allergy, partial history, and dietitian instruction. **Failed then fixed** — “Dietitian advice” was initially matched as diet type and dropped; parser precedence now records clinician/dietitian advice before diet type. **Blocked** — actual authenticated mobile OCR upload (PNG/PDF), save cancellation/in-place update, sign-out/sign-in persistence, and normal seven-day-plan inspection require an authorised synthetic account plus isolated DynamoDB/session configuration. Exact next steps: start the local app with the local OCR flag, sign in to a synthetic account, upload both fixture PNG pages and a scanned-PDF equivalent, review flagged ambiguity, cancel once, then apply/edit/save; sign out/in and generate the weekly plan. Confirm peanut is excluded from shared and member-specific meals and low-salt advice appears in plan constraints.
- Combined import/Snap verification: **Passed (mocked/static)** — local QA harness inspection confirms it creates normal fictional accounts against `http://127.0.0.1:8010` and `mamaai-local-qa-*` only; Snap retry now reuses one entry id and saved entries have local UI edit/delete controls. **Blocked (live mobile/Gemini/storage)** — this Codex shell lacks the required local-QA process environment from `.env.gemini-qa.local`, so no isolated account was created and no protected route was bypassed. Run `scripts/run-local-qa.ps1`, register a fictional account normally, then exercise profile import and Snap on a mobile viewport; do not use production credentials or tables.

- 23 October 2026: Phase 2 local Preview preparation completed. The public mobile Ask MAMA launcher overlap at 320px was corrected and the final local browser suite passed 13/13. Cloud, Gemini and Razorpay integrations remain intentionally unexecuted pending owner approval.

- 23 October 2026: Local executive-audit remediation removed the public subscription judge bypass, restored the footer Help route, and passed 34 local unit/security tests plus 8 local Playwright tests. No cloud, payment, Gemini, deployment, commit, or production-data action was performed.


- Read `PRD.md` and `AGENTS.md` completely.
- Audited the initial repository folder: only `PRD.md` and `AGENTS.md` existed; no git repository or application scaffold was present.
- Established architecture direction for a focused hackathon MVP.
- Defined required foundation documents.
- Created Next.js, React, TypeScript, and Zod application scaffold.
- Defined shared TypeScript contracts and Zod schemas for families, members, nutrition context, meal plans, grocery items, replacement, feedback, and API payloads.
- Created service boundaries for family, subscription limit enforcement, nutrition context, meal planning, grocery generation, AI fallback generation, and safety validation.
- Added centralized AI prompt foundation under `lib/ai/prompts`.
- Implemented MVP API routes for demo data, family creation, meal generation, meal replacement, and feedback.
- Implemented mobile-first MAMA Family Table UI with family setup, member editing, profile analysis, meal generation, replacement, grocery update, feedback, and disclaimer display.
- Installed dependencies using a project-local npm cache.
- Validation passed: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Local dev server started at `http://127.0.0.1:3000`.
- Demo API smoke test passed for `GET /api/demo`, returning fictional family data and a complete common meal plan.
- Added prominent Judge Access / Try Demo path for Devpost reviewers.
- Judge Access loads fictional family data without registration, payment, or subscription barriers.
- Added on-screen judge demo checklist for the core innovation flow.
- Added RevenueCat-ready plan metadata for Family Starter, Family Premium, and Family Plus.
- Added `GET /api/subscriptions/plans` for subscription plan metadata.
- Added `POST /api/revenuecat/webhook` contract endpoint; entitlement persistence remains pending DynamoDB repository integration.
- Validation passed after Judge Access and RevenueCat contract work: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Smoke test passed for `GET /api/subscriptions/plans`.
- Smoke test passed for `POST /api/revenuecat/webhook` with a sample RevenueCat-style event.
- Updated `README.md` for Devpost judging with Judge Access, Built With, OpenAI Codex usage, GPT-5.6/OpenAI API architecture, RevenueCat readiness, setup, safety notes, and limitations.
- Validation passed after README update: `npm run typecheck` and `npm run lint`.
- Improved Judge Access presentation after live text review: Judge Mode now shows clean read-only fictional family profile cards instead of the large editable form.
- Replaced non-ASCII separator bullets in key UI text with ASCII hyphens to avoid mojibake such as `Ã‚Â·` in deployments or text captures.
- Validation passed after Judge Access UI cleanup: `npm run lint`, `npm run build`, and `npm run typecheck`.
- Added region-aware meal selection with breakfast/lunch/dinner defaults based on the user's browser timezone and manual override.
- Added `mealTimeContext` API contract so meal planning can receive timezone, locale, country, region/state, city, and local hour.
- Added new-user vs returning-user planning mode to support AI cost control.
- Updated meal-plan API contract with `mealTime` and `userPlanningMode`.
- Updated deterministic demo meal generation to return breakfast, lunch, dinner, or replacement meals based on selected meal time.
- Updated meal-plan target date to use the user's local timezone instead of UTC-only date slicing.
- Validation passed after region-aware meal planning work: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Added first-time family food-pattern selection: vegetarian, non-vegetarian, semi-vegetarian, eggetarian, and mixed family.
- Updated family contracts and schemas with `dietPreference`.
- Updated the meal generator to choose diet-compatible common meals and optional add-on meals for mixed families.
- Added structured common-meal nutrition estimates for calories, protein, carbs, fat, and fiber.
- Added editable nutrition calculator so users can add common extra foods or custom values and see recalculated estimates.
- Documented nutrition estimate source basis and the need for verified ingredient-weight lookup after the hackathon.
- Validation passed after diet preference and nutrition estimate work: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Fixed custom family creation flow so `Create Family` immediately analyzes profiles and generates the MAMA Family Table instead of requiring a separate `Plan Today` tap.
- Validation passed after Create Family flow fix: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Added separate member preference fields for food allergies, ingredient allergies, food dislikes, disliked meals, excluded ingredients, and dietary restrictions.
- Updated meal planning to inspect hard restrictions and soft dislikes before finalizing member modifications.
- Updated safety validation to check common meal and recipe ingredients against all hard restriction fields.
- Added `View Recipe / How to Cook` modal for every generated common meal.
- Recipe details now include ingredients, quantities, servings, steps, prep time, cook time, difficulty, estimated nutrition, estimated cost, member-specific adjustments, alternatives, and video recommendation metadata.
- Validation passed after allergy/dislike and recipe work: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Added soft-dislike preference-resolution flow so one member's disliked ingredient does not automatically restrict the whole family meal.
- Added three user-facing choices: separate simple alternative, one common family meal, and two compatible options with a small second component.
- Validation passed after soft-dislike preference-resolution work: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Added `POST /api/recipes/videos` recipe-video discovery endpoint using the official YouTube Data API when `YOUTUBE_API_KEY` is configured.
- Added clear testing-stage status handling when `YOUTUBE_API_KEY` or another optional external service is not activated; no scraping is used.
- Added `Watch How to Cook` action in the recipe modal with third-party content disclaimer.
- Validation passed after recipe-video discovery work: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Smoke test passed for `POST /api/recipes/videos` fallback mode without `YOUTUBE_API_KEY`.
- Added meal-wise family strength controls so users can select which members are eating a specific meal, who is fasting today, and how many guests are present.
- Added high-tea and evening-snack meal options with late-afternoon local-time recommendation.
- Added fasting profile contract with allowed foods, avoided foods, fasting type, meal count, fruit/dairy/grain rules, and custom traditions.
- Added deterministic quantity planning service so ingredient quantities, grocery requirements, and meal cost update from actual attendance and fasting status without extra AI calls.
- Added meal-wise ingredient requirement display and fasting-aware food suggestions to the user flow.
- Demo data now includes fictional fasting preferences for judge testing.
- Validation passed after meal strength, high tea, fasting, and deterministic quantity work: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Audited current storage architecture: user/family/meal data is currently stored only in the MVP in-memory repository; no Supabase integration exists.
- Documented AWS production architecture using DynamoDB for structured app data, S3 for files/exports/media/backups, Next.js APIs/Lambda for server-side access, and Cognito or equivalent auth for production identity.
- Added 15-day detailed meal-plan retention metadata (`expiresAt`, `retentionPolicy`) and in-memory purge helper that maps to DynamoDB TTL in production.
- Added user-facing detailed meal-plan retention notice and `Download / Export / Save` JSON export action.
- Added custom-family country of residence and preferred food culture/cuisine input so cuisine is not inferred only from nationality.
- Updated `.env.example` with MAMAAI-specific AWS table, S3, TTL, namespace, and Cognito placeholders.
- Validation passed after AWS storage architecture, retention, export, and cuisine-persona work: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Added general testing-version notice for hackathon users and judges.
- Updated optional recipe-video integration UX so `Watch How to Cook` remains visible, written recipes remain usable, and missing external API activation is labeled as `Currently Unavailable in Test Version` without exposing technical configuration details.
- Validation passed after testing-stage external-service notice work: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Redesigned the homepage into a more colorful, premium, mobile-first consumer landing experience with sticky navigation, strong hero, family-needs storytelling, How It Works, feature cards, MAMA Family Table showcase, daily plan preview, emotional brand story, and final CTA.
- Integrated Vercel Web Analytics through `@vercel/analytics/next`.
- Added privacy-conscious MVP analytics event tracking for homepage visits, Try Demo clicks, Get Started clicks, family creation/registration-style events, and meal-plan generation.
- Added `/admin` Website Analytics dashboard with Today's Visitors, Last 7 Days, Last 30 Days, Total Visits, daily trend, pages, traffic sources, device breakdown, and conversion funnel.
- Validation passed after homepage redesign and website analytics work: 
pm run typecheck, 
pm run lint, and 
pm run build.
- Added Ask MAMA floating product-help assistant with controlled MAMAAI knowledge-base answers, quick questions, short guidance, Judge Demo/Add Family/Support actions, safety refusals, and prompt-injection/secret-disclosure protection.
- Added /api/ask-mama route and anonymous Ask MAMA analytics events for opens, questions, unresolved topics, and common categories.
- Added support contact support@mamaai.in and owner contact 
binnovationllp@gmail.com.

## In Progress

- Final manual browser click-through of the judge-facing flow.
- Public deployment preparation.
- Replacing MVP in-memory persistence with production DynamoDB repositories when infrastructure is available.
- Implementing production DynamoDB/S3/Cognito integration after the hackathon demo remains stable.
- Moving MVP in-memory analytics events to production DynamoDB or a managed privacy-friendly analytics backend.
- Expanding Ask MAMA from controlled product help to authenticated, OpenAI-assisted guidance after production privacy, safety, and cost controls are ready.

## Not Started

- Production DynamoDB repository implementation for family, meal plan, pantry, analytics, and broader CRM lifecycle records.
- Production S3 export/report/upload implementation with signed URLs.
- Production authentication provider integration.
- RevenueCat and Google Play Billing production integration.
- Full CRM dashboards beyond paid-customer list/support-note/export basics.
- Pantry persistence, leftover planning, production analytics persistence, PDF/export, full authentication, durable DynamoDB repositories, and remaining deep planner microcopy translation.

## Known Bugs

- `npm audit --omit=dev` reports high-severity advisories in the current Next/PostCSS/sharp dependency chain. Track upstream fixes and assess safe dependency updates before broad public production exposure.
- Runtime browser click-through is pending.
- Dev server logs warn about a non-standard `NODE_ENV` value from the surrounding environment.
- RevenueCat webhook currently validates and acknowledges events but does not persist entitlement changes until the production subscription repository is connected.
- Git working tree currently has normal uncommitted changes from the current homepage redesign and analytics work.
- Ask MAMA currently answers product-help/navigation questions from a controlled knowledge base; it is not yet connected to OpenAI for free-form conversation.

## Architecture Decisions

- Use Next.js App Router with route handlers for MVP.
- Use repository abstraction so DynamoDB can replace the MVP in-memory repository.
- Use Zod for API and AI structured-output validation.
- Keep prompts centralized under `lib/ai/prompts`.
- Use deterministic AI fallback for demo reliability when `OPENAI_API_KEY` is unavailable.
- Prioritize the Family -> Meal Plan -> Replacement -> Grocery -> MAMA Family Table flow over future modules.
- Pin Next workspace root through `next.config.mjs` because a parent `C:\Users\HP\package-lock.json` caused Turbopack to infer the wrong root.
- Keep admin/CRM as documented contracts until the core family planning flow is fully hardened.
- Judge Access bypasses payment only for fictional demo data and must stay separate from production entitlement checks.
- RevenueCat/Google Play Billing must not block the hackathon submission; production billing follows core MVP, judge demo, testing, deployment, and Devpost demo readiness.
- Meal-time defaults must use the user's local timezone and family region context, not India-only assumptions.
- Nutrition values in the MVP are estimates for education and demo clarity; production requires verified ingredient weights and nutrition database integration before precision claims.
- YouTube recipe search uses the official API when configured and otherwise returns a clearly labeled fallback search link.
- Optional external-service features must show one of these statuses instead of failing silently: fully functional, demo/test-only, temporarily disabled, or planned.
- Soft dislikes must stay separate from allergy/medical safety handling; allergies and medical restrictions always remain hard constraints.
- Meal-wise quantities should be calculated deterministically from selected family attendance, fasting members, guest count, and adult-equivalent portion factors. This keeps recurring subscription cost lower by avoiding unnecessary AI calls for simple grocery math.
- High tea is treated as a real meal slot for families that use it, especially in late afternoon local time. Dinner remains the default from 6:00 PM onward.
- Subscription pricing updated for AI/API sustainability: Family Starter is India INR 399/month or international US$4.99/month, Family Premium is India INR 599/month or international US$7.99/month, and Family Plus is India INR 999/month or international US$12.99/month. Meal attendance, high tea, fasting, voice input, and quantity calculation remain deterministic or browser-native low-cost features; expensive AI operations need fair-use controls and usage tracking.
- Supabase is not used. Production persistence should use AWS with DynamoDB for structured application records and S3 only for objects/files.
- MAMAAI can share the same AWS account as education projects only with separate tables/buckets or prefixes, least-privilege IAM, separate environment variables, tags, logs, and alarms.
- Detailed meal plans should expire after 15 days using DynamoDB TTL in production; safety and personalization signals remain in long-term records until the user deletes or changes them.
- Website analytics should use Vercel Web Analytics where possible and track product events with anonymous visitor/session ids. Do not store raw IP addresses for visitor counting.
- Ask MAMA should stay grounded in controlled MAMAAI product knowledge, clearly label testing-stage limitations, and never expose prompts, secrets, internal configuration, private user data, or admin details.

## Required Environment Variables

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `AWS_REGION`
- `AWS_ACCOUNT_ID`
- `AWS_PROJECT_NAMESPACE`
- `MAMA_AI_TABLE_NAME`
- `MAMA_AI_DYNAMODB_TABLE_NAME`
- `MAMA_AI_DYNAMODB_TTL_ATTRIBUTE`
- `MAMA_AI_DYNAMODB_GSI1_NAME`
- `MAMA_AI_DYNAMODB_GSI2_NAME`
- `MAMA_AI_S3_BUCKET`
- `MAMA_AI_S3_PREFIX`
- `MAMA_AI_EXPORTS_PREFIX`
- `MAMA_AI_REPORTS_PREFIX`
- `MAMA_AI_BACKUPS_PREFIX`
- `MAMA_AI_COGNITO_USER_POOL_ID`
- `MAMA_AI_COGNITO_CLIENT_ID`
- `MAMA_AI_COGNITO_REGION`
- `REVENUECAT_WEBHOOK_SECRET`
- `REVENUECAT_PROJECT_ID`
- `REVENUECAT_API_KEY`
- `REVENUECAT_ENTITLEMENT_STARTER`
- `REVENUECAT_ENTITLEMENT_PREMIUM`
- `REVENUECAT_ENTITLEMENT_PLUS`
- `YOUTUBE_API_KEY`
- `MAMA_AI_DEMO_MODE`
- `MAMA_AI_JUDGE_ACCESS_ENABLED`
- `MAMA_AI_ALLOW_DEMO_IDENTITY`
- `MAMA_AI_ALLOWED_ORIGINS`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RAZORPAY_PLAN_STARTER_MONTHLY`
- `RAZORPAY_PLAN_PREMIUM_MONTHLY`
- `RAZORPAY_PLAN_PLUS_MONTHLY`
- `RAZORPAY_PLAN_STARTER_USD`
- `RAZORPAY_PLAN_PREMIUM_USD`
- `RAZORPAY_PLAN_PLUS_USD`

## Demo/Judge Access Instructions

- Open the deployed app.
- Select `Try Demo / Judge Access` on the home page.
- Review the fictional multi-generation family profiles.
- Review the generated common meal, individual portions/modifications, fruit and hydration recommendations, grocery list, and MAMA Family Table.
- Select `Replace Meal` to verify grocery recalculation.
- Submit feedback from the Family Feedback section.
- No registration, payment, subscription, real personal data, or real medical data is required.

## Deployment Status

- Vercel project and custom domain setup are in progress/previously configured by the user.
- Local build is production-valid after the current milestone.
- Public Devpost-ready deployment should be verified at `https://mamaai.in` after pushing and Vercel redeploys.

## Tiffin Integration Update — October 26, 2026

- Added authenticated, human-pantry-only Smart Tiffin suggestions at `/tiffin` and `/api/tiffin-suggestions`. The deterministic fallback filters expired pantry items, saved member allergies/restrictions/dislikes, and requested active cooking time; it never deducts pantry stock.
- Added persisted member school/work schedule, attendance days, leave/holiday dates, tiffin preferences, and packing/storage limits to the saved family-profile contract. Weekly planning now carries those fields into its planning context and omits school/office slots with no eligible member.
- The supplied authoritative reference-plan path `docs/reference-meal-plans/healthy-vegetarian-family-weekly-plan.md` was not present in this checkout. The requested complete reference fixture therefore remains blocked rather than being fabricated.
- Verification for this update: `npm test` passed 71 tests; `npx tsc --noEmit --incremental false --pretty false`, `npm run lint`, and `npm run build` completed successfully. Browser verification remains unavailable because local browser use is disabled in this Work environment.



- Fixed Try Demo/Judge Access CTA behavior so it visibly loads demo data, shows loading/failure state, and scrolls users into the live planner.
- Improved mobile demo usability: Try Demo now opens the family profile section first, key controls use explicit button behavior, and Ask MAMA no longer spans the full mobile screen bottom.
- Added user-facing meal budget constraints in the family profile flow: budget period, INR amount, strict/flexible priority, low-cost preference, demo budget display, and generated-plan budget comparison.
- Added mobile hamburger navigation, explicit app-style install guidance, PWA manifest, service worker, and branded app icons for the web/PWA launch path.
- Added `/api/subscriptions/status` as a server-side testing-stage entitlement endpoint with plan, status, payment channel, payment status, member limit, and feature access fields.
- Clarified monetization in UI and docs: no fake payment buttons, Judge Access bypass is fictional-data-only, web payments are planned with backend webhook verification, and RevenueCat/Google Play remain integration-ready.
- Replaced previous subscription prices with regional configured tiers: India INR 399/599/999 and international US$4.99/7.99/12.99; added plan fair-use limits and admin AI/API usage tracking for cost-sensitive operations.
- Audited payment readiness: Razorpay was not previously integrated; only subscription contracts, testing entitlement, and RevenueCat webhook contract existed.
- Added Razorpay India web/PWA readiness: server-side subscription creation, Checkout signature verification, signed webhook handling, subscription/payment records, status endpoint integration, admin visibility, and UI subscription CTAs that show a safe testing-stage message when Razorpay env is not configured.
- Documented that the same Razorpay account can be used for MAMAAI and Syllabus Synk only with separate MAMAAI plan IDs, webhook URL, webhook secret, metadata, env variables, and entitlement records.

## Hackathon Screenshot & Feature-Image Package - August 16, 2026

Output folders created:

- `docs/hackathon/screenshots/raw`
- `docs/hackathon/screenshots/redacted`
- `docs/hackathon/screenshots/final`
- `docs/hackathon/screenshots/contact-sheet`

Package status:

- Final branded images created: 26 / 26, all 1920 x 1080 PNG.
- Redacted images created: 26 / 26, all 1920 x 1080 PNG.
- Raw folder populated: 26 / 26. Genuine production raw screenshots were captured for homepage, Ask MAMA, pantry, subscription page, multilingual/homepage, and PWA/mobile/homepage; remaining raw items are labelled evidence cards for diagrams/feature graphics where a clean live screenshot was not captured.
- Contact sheet created: `docs/hackathon/screenshots/contact-sheet/mamaai_hackathon_contact_sheet.png`.
- Manifest created: `docs/hackathon/screenshots/IMAGE_PACKAGE_MANIFEST.json`.

Features demonstrated truthfully:

- Live/verified: homepage, subscription page/pricing, Ask MAMA surface, multilingual public surfaces, PWA foundation, Razorpay subscription-creation flow, admin-protected CRM endpoints, DynamoDB payment/CRM persistence slice, safety/responsibility messaging.
- Gemini-powered features demonstrated: Ask MAMA uses `gemini-2.5-flash`; other Gemini helper paths remain present for proactive/meal reasoning with `gemini-1.5-flash` and `gemini-1.5-pro` code paths.
- Test Mode / controlled pilot labels used: Razorpay verified-access/payment journey, subscription payment completion and webhook entitlement pending trusted real tester confirmation.
- Beta labels used: pantry, recipe/cooking support, voice input, four-paw Family Plus support, privacy/trust controls, CRM slice.
- Prototype/data-pending labels used: durable family learning, subscription adoption/business intelligence where real historical customer data is not yet available.
- Four-paw feature image completed with separate pet-appropriate planning and veterinarian disclaimer.
- CRM image completed without invented customers, revenue, or fake conversion data.
- Razorpay image completed without secrets or payment details.
- Privacy check completed: no API keys, AWS credentials, Razorpay secrets, auth tokens, real customer details, private medical information, unmasked phone numbers, addresses, card/bank information, or unsupported compliance claims are intentionally included.

Remaining screenshot caveat:

- Several final images are truthful diagrams/feature graphics, not raw live screenshots, because the current app does not expose every concept as a clean standalone public UI screen and because some capabilities remain beta/prototype/test-mode. These are labelled accordingly in the image status chips and manifest.

## Pet profiles and separate pet meal plans — October 30, 2026

- Existing work already provided authenticated, owner-scoped DynamoDB pet profiles, pet pantry records, feeding schedules, species checks, allergy checks, unsafe-ingredient screening, and customer-data export coverage. Pet access remains intentionally restricted to the existing Family+ entitlement.
- The family-profile view now identifies cats and dogs as optional, separate household records and links to pet profile management. Pet onboarding accepts a name and species while allowing age, weight, food preferences, allergies, current food, and veterinarian dietary instructions to be skipped when unknown.
- The human planner now displays a separate **Pet Meal Plan** when the signed-in Family+ account has pet profiles. It is deterministic: it selects a species/life-stage appropriate complete-food reminder, preserves recorded allergies and veterinarian instructions, never suggests human leftovers or homemade recipes as a complete diet, and never invents feeding quantities.
- Medical conditions, a veterinary/prescription diet, pregnancy, or any special dietary instruction are marked for veterinarian review. Portions must come from the selected product label or a veterinarian.
- Verification: `npx tsc --noEmit --incremental false --pretty false`, `npm run lint`, `npm test` (114 passing, 0 failed), and `npm run build` completed locally. Browser testing still requires an authenticated Family+ test account and no production deployment is implied.

## Approved preview integration — 4 November 2026

### Completed
- Integrated the owner-approved source from mamaai-preview-isolated into the main mamaai checkout: 140 added files and 48 updated files.
- Verified source parity across app, components, lib, public, tests, e2e, scripts, and docs.
- Installed locked dependencies including required development/build tools.
- Automated tests passed: 121/121. Production build passed with exit code 0, including its TypeScript check and generation of all 70 static pages.
- Preserved main environment files and deployment identity. Backups of replaced files and SHA-256 manifest are retained in the integration chat workspace.

### Deployment Status
- Local source integration complete. No commit, push, or production deployment performed.
- Live payment/email/authenticated browser journeys and production database compatibility have not been reverified in this integration. Historical preview reports remain historical and are not a fresh launch-readiness certification.

## Ask MAMA product-help and planner diagnostics — 4 November 2026

- Owner authorized local fixes after the read-only audit. No commit, push or deployment performed.
- Fixed exact offered product-help questions being rejected as pet-feeding advice or classified as specific food advice. Pet knowledge-base matching now precedes generic overview matching.
- Added actual API-handler tests with mocked rate-limit/auth/storage/provider boundaries; unsupported pet-feeding requests remain rejected.
- Planner now distinguishes authentication, subscription, permission, rate-limit and timeout failures, and reports allowlisted HTTP/error references without raw backend error text. Weekly timeout timer is cleared on every exit. Removed an obsolete hardcoded next-week date label.
- Fresh main-project regression suite: 127 passed, zero failed, exit 0. Production build including TypeScript: exit 0.
- The production planner failure shown in customer screenshots remains undiagnosed pending runtime status/error evidence. These changes improve diagnosis; they do not establish live meal generation as repaired.

## Mobile-only password recovery — 4 November 2026

### Completed
- Removed email-only Forgot Password flow. Mobile/email method selection and saved-code recovery now support English, Hindi and Kannada; registration displays issued recovery codes once without browser persistence.
- Preserved mobile-only identity lookups and original account IDs. Legacy mobile+recoveryCode API input remains accepted. Atomic proof consumption/password update revokes password-account sessions and clears current device/session cookies.
- Added OTP challenge storage, hashing, expiry, attempt controls, verified-contact checks and an injected delivery boundary. Default production delivery is unavailable and never claims a code was sent.
- Main regression suite: 142/142, exit 0. Security/authentication/recovery subset: 48/48, exit 0. New recovery tests: 15/15. Standalone TypeScript and production build: exit 0.
- Local browser checks passed for method switching, zero email inputs for mobile mode, English/Hindi/Kannada, honest disabled-delivery state and mocked mobile/email reset success.

### Known Bugs / Remaining Work
- No legitimate SMS/email delivery adapter or verified-contact enrollment service is installed. OTP journeys were tested only with fictional injected transport and mocked repositories.
- An unverified legacy contact with no saved recovery code cannot safely self-reset yet. It needs a separately verified enrollment/support process, without requiring email. Do not mark it verified merely because a number is present.
- Historical signed legacy-token transition/revocation remains separate from password-account session versioning.

### Deployment Status
- Local implementation only; no commit, push, production deployment, real SMS/email, customer-data access or live resource/configuration change performed.

## Remembered device validation — 4 November 2026

- Valid saved sessions resume without a password prompt. New remembered sessions last 365 days and renew near expiry on the same verified device. Legacy sessions keep their original expiry.
- Local regression suite: 150 passed. Standalone TypeScript and production build exited 0. Local browser checks with mocked responses verified repeat opens, sign-in when signed out, and Retry during outages.
- The recording shows the stopped temporary server at 127.0.0.1:3127. Changes are local and unpublished.

## Paid subscriber recognition — 4 November 2026

- Shared owner-scoped paid-period checks prefer valid paid records over pending checkout attempts. Unresolved billing state offers Retry or reconciliation. Checkout confirmation verifies Razorpay capture and period. Webhook markers commit with entitlement writes.
- Local regression: 155 passed. Full fictional provider-backed staging journey and approved live reconciliation remain pending.

## Functional QA, 4 November 2026

- Fixed legacy family authorization, weekly cached-plan ownership, fractional ages, weekly candidate selection and auth origin error handling.
- Verified vegetarian seven-day planning, weekday tiffin slots and persisted grocery purchases in loopback storage. Full browser suite still fails mixed-diet slot replacement. Production unchanged.

## Isolated local QA — 10 November 2026

- Environment: **Passed** — all browser and verifier work used `MAMA_AI_LOCAL_QA=true`, `http://127.0.0.1:8010`, and `mamaai-local-qa-*` DynamoDB tables. No production service, credential, data, deployment, or payment flow was used.
- Browser sign-in bootstrap: **Passed** — a fresh Chromium mobile viewport now hydrates at `http://127.0.0.1:3106/account/access` and reaches the sign-in/registration screen. The root cause of the prior indefinite spinner was Next development-resource origin blocking: HMR/client resources were rejected at `127.0.0.1`, so the client effect that calls `/api/customer/session` never ran. `allowedDevOrigins` now permits the loopback QA origin while normal session checks and authentication remain active.
- Browser registration: **Passed** — fictional `browser-qa-20261110b@example.test` registration returned **201** and displayed one-time recovery codes. The browser then used the new explicit **Continue to family profile** action to reach `/profile/family`. The local QA launcher now allowlists only `http://127.0.0.1:<port>` for same-origin mutation checks; it does not weaken production origin validation.
- Browser family-profile save: **Passed** — a fictional one-member profile saved with **200** and transitioned from `/profile/family` to `/planner`, where the saved household was displayed.
- Browser session persistence: **Passed** — refreshing `/planner` in the same browser context retained the authenticated session and the saved fictional household.
- Browser session failure/retry: **Passed** — a separate fresh local browser tab received a local-QA-only simulated **503** from `/api/customer/session`, displayed the recoverable error and Retry control, then Retry removed the QA-only flag and restored the signed-in `/planner` session. The simulation is guarded by `MAMA_AI_LOCAL_QA=true` and is not active in normal environments.
- `scripts/verify-local-qa.ps1`: **Passed** — clean isolated rerun recorded registration **201**, family-profile save **200**, verified the peanut allergy fixture, and intentionally observed mocked Ask MAMA provider failure **500 / LOCAL_QA_PROVIDER_FAILURE**. This expected mocked-provider result is not a browser or Gemini-live pass.
- TypeScript: **Passed** — `npx tsc --noEmit --incremental false --pretty false` completed after removal of a stale, generated `.next-dev` directory. The isolated `.next-qa-local` output was retained.
- Remaining blocker: **Blocked** — live Gemini/OCR validation was not run by this verification; it requires launching the QA workflow with the real-provider option and remains separate from the mocked verifier result.

## Family-profile persistence and meal-history upload QA — 10 November 2026

- Environment: **Passed** — repeated in the isolated local QA app at `http://127.0.0.1:3106` using loopback DynamoDB at `http://127.0.0.1:8010` and the `mamaai-local-qa-*` table prefix. Only the existing fictional QA household was used.
- Profile reload path: **Passed** — the page originally loaded only `/api/customer/session` and `/api/meal-history/snap`; it did not request `/api/customer/family-profile`. The saved family record existed but the client could not restore its customer meal-history data. The authenticated family-profile read now returns both the household and customer record, and the profile page reads that endpoint on reopen. Initial browser-storage writes are also held until hydration completes.
- Manual history save/readback: **Passed** — the normal UI submitted 1 household member, 2 populated history days and 4 populated meal fields. `POST /api/customer/family-profile` returned **200** with the same counts. A direct, sanitized loopback-DynamoDB read under the repository keys (`USER#…` / `CUSTOMER#PROFILE` and `FAMILY_PROFILE#CURRENT`) matched the same counts; the owner identifier was hashed in QA evidence. The reopened form displayed all four baseline meals: Poha, Rajma chawal, Fruit and Roti dal.
- Unreadable-upload preservation: **Passed** — the unreadable fictional fixture cleared the loading state, displayed the recoverable timeout/manual-entry message, and left all four baseline entries intact immediately. A stale browser draft initially hid those entries after refresh; the confirmed-profile hydration fix restored the authoritative server record on reopen, and the four baseline meals were again present after reload.
- Controlled timeout/retry: **Passed** — Playwright appended the local-QA-only `qaMealHistoryTimeout=1` flag to the normal upload request. The route returned **504** after about 17 seconds; “Reading file…” cleared and recovery guidance was displayed. A retry button-state defect was fixed: failed files remain only in memory until retry or reselection. After removing interception, Retry issued `/api/meal-history/extract` without the QA flag and reached the real route. Its real-provider result was **504**, which is recorded separately from the controlled recovery check.
- Live Gemini PNG extraction: **Blocked** — fictional clear PNG request reached the real local route but returned **502 / MEAL_HISTORY_PROVIDER_REJECTION** after about 7.3 seconds. No extracted draft, correction, approval, or extraction-save persistence result can be claimed.
- Live Gemini JPEG extraction: **Blocked** — fictional clear JPEG request reached the real local route but returned **502 / MEAL_HISTORY_PROVIDER_REJECTION** after about 7.0 seconds. No extracted draft, correction, approval, or extraction-save persistence result can be claimed.
- TypeScript and local regression suite: **Passed** — `npx tsc --noEmit --incremental false --pretty false` and `npm test` completed after the profile hydration and retry fixes.
- Remaining release blocker: live Gemini extraction must be accepted by the authorised non-production provider before editable-draft accuracy, explicit-confirmation saving, and OCR-derived persistence can pass. Manual save/readback and upload-failure preservation passed independently.

## Gemini meal-history extraction provider diagnosis — 10 November 2026

- Environment: **Passed** — diagnosis used the existing fictional authenticated account, loopback QA DynamoDB, and the authorised non-production Gemini configuration only. Credentials, image payloads, authorization headers, and raw provider bodies were not logged or retained.
- Authenticated synthetic PNG reproduction: **Blocked** — the normal mobile upload UI reached `POST /api/meal-history/extract` and returned **502 / MEAL_HISTORY_PROVIDER_REJECTION** in about 8.9 seconds. The UI showed its recoverable manual-entry/retry guidance.
- Provider evidence: **Blocked** — local route diagnostics classify the underlying provider response as HTTP **503** (`provider_unavailable`). The configured model is `gemini-3.8-flash`; the legacy SDK (`@google/generative-ai` 0.24.1) uses the Gemini `v1beta` endpoint. The authorised key successfully listed generate-content models, including the configured model and image-capable/current Flash options, so credentials/project access and request authentication are not indicated as the cause.
- Model capability checks: **Blocked** — text-only probes for the configured model and `gemini-flash-latest` both returned provider HTTP **503**. Direct `gemini-2.5-flash` and `gemini-2.0-flash` generation probes returned **404** despite catalogue metadata advertising `generateContent`; this indicates a provider/API-version availability mismatch for those fallback names, not a safe application fallback. No evidence supports changing the upload media format or request shape.
- Required provider action: verify the non-production Gemini project/service availability and quota/region health for the current `v1beta` Generative Language endpoint, then provide a model identifier that successfully accepts `generateContent` for that project. Re-run the synthetic PNG and JPEG UI checks after provider availability is restored.
- Image-import blocker: **Blocked** — not resolved. PNG/JPEG extraction draft accuracy, approval-gated saving, and OCR-derived persistence remain unverified because the provider rejects generation before extraction output is returned. Existing profile persistence, failed-upload preservation, timeout recovery, and retry behavior remain verified.

## Gemini blocker recheck — 10 November 2026

- Provider probe: **Blocked** — one minimal text-only request used the same authorised QA configuration as the upload route: model `gemini-3.8-flash` through the Gemini `v1beta` endpoint. It returned HTTP **503**, sanitized as `provider_unavailable`. No credential, header, prompt, payload, or raw provider response was logged.
- App-side action: **Not required** — the result matches the documented provider-side outage and adds no evidence of a request-format, image-input, or local configuration defect. The existing profile persistence, failed-upload preservation, timeout recovery, and retry behavior were not changed.
- Required next action: **Blocked pending provider** — restore/verify generation service availability and quota/region/model access for the authorised non-production project on the `v1beta` Generative Language endpoint. Once a generation probe succeeds, run separate PNG and JPEG authenticated UI imports through draft review, explicit save, and reload before closing the image-import blocker.

## Vercel build fix: imported cuisine preferences — 10 November 2026

- Root cause: **Fixed** — the deployment revision (`1c185d4`) defined `MealPreferenceInputs` as strings but document-import cuisine merging returned arrays for lunch and dinner. The editable form convention is comma-separated text: `splitCsv` converts it to saved arrays, while `mealPreferenceInputsFromSaved` displays arrays joined with `, `.
- Change: **Passed** — document import now merges its cuisines with the existing `splitCsv` helper, deduplicates them, and joins them with `, ` before setting the lunch and dinner form fields. This preserves existing values and keeps the form state type intact without casts. Applying a reviewed typed document draft also now treats that explicit review action as the document confirmation boundary; it no longer creates an unreachable photo-upload approval requirement.
- Browser verification: **Passed** — a synthetic typed document with duplicate South Indian cuisine and North Indian cuisine produced `South Indian, North Indian` in both editable lunch and dinner fields. The normal Save Family action returned **200**; reopening the profile after navigation retained the same values in both fields. This test used no Gemini/OCR generation.
- TypeScript and regression: **Passed** — `npx tsc --noEmit --incremental false --pretty false` and `npm test` completed locally.
- Production build: **Passed** — `npm run build` (`next build --webpack`) completed locally and produced `.next/BUILD_ID` (`wKaaMe8a5XbokdhxAw38I`). No separate build blocker appeared.
- Live Gemini image-import blocker: **Blocked, unchanged** — provider generation remains unavailable in the authorised QA environment; PNG/JPEG OCR-derived draft/save verification is tracked separately above.
