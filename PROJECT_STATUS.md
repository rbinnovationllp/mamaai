# MAMA AI Project Status

## Current Launch Snapshot - August 14, 2026

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

