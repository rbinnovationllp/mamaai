# MAMA AI Project Status

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

## In Progress

- Final manual browser click-through of the judge-facing flow.
- Public deployment preparation.
- Replacing MVP in-memory persistence with production DynamoDB repositories when infrastructure is available.

## Not Started

- Production DynamoDB repository implementation.
- Production authentication provider integration.
- RevenueCat and Google Play Billing production integration.
- Admin/CRM screens beyond contract foundation.
- YouTube recipe integration.
- Pantry, leftover, analytics, PDF/export, and multilingual production rollout.

## Known Bugs

- The project is not currently initialized as a git repository.
- `npm audit` reports a moderate PostCSS advisory inherited through `next@16.2.10`. npm suggests `npm audit fix --force`, but that would downgrade Next to `9.3.3`, which is not an acceptable fix. Track upstream Next/PostCSS patch availability.
- Runtime browser click-through is pending.
- Dev server logs warn about a non-standard `NODE_ENV` value from the surrounding environment.
- RevenueCat webhook currently validates and acknowledges events but does not persist entitlement changes until the production subscription repository is connected.
- Git working tree currently has normal uncommitted changes from Judge Access and RevenueCat contract work.

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

## Required Environment Variables

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `AWS_REGION`
- `MAMA_AI_TABLE_NAME`
- `REVENUECAT_WEBHOOK_SECRET`
- `REVENUECAT_PROJECT_ID`
- `REVENUECAT_API_KEY`
- `REVENUECAT_ENTITLEMENT_STARTER`
- `REVENUECAT_ENTITLEMENT_PREMIUM`
- `REVENUECAT_ENTITLEMENT_PLUS`
- `YOUTUBE_API_KEY`
- `MAMA_AI_DEMO_MODE`
- `MAMA_AI_JUDGE_ACCESS_ENABLED`

## Demo/Judge Access Instructions

- Open the deployed app.
- Select `Try Demo / Judge Access` on the home page.
- Review the fictional multi-generation family profiles.
- Review the generated common meal, individual portions/modifications, fruit and hydration recommendations, grocery list, and MAMA Family Table.
- Select `Replace Meal` to verify grocery recalculation.
- Submit feedback from the Family Feedback section.
- No registration, payment, subscription, real personal data, or real medical data is required.

## Deployment Status

- Not deployed.
- Local build is production-valid.
- Dev server is running locally at `http://127.0.0.1:3000`.
- Public Devpost-ready deployment pending.
