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

## In Progress

- Manual browser click-through of the full UI flow.
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

## Architecture Decisions

- Use Next.js App Router with route handlers for MVP.
- Use repository abstraction so DynamoDB can replace the MVP in-memory repository.
- Use Zod for API and AI structured-output validation.
- Keep prompts centralized under `lib/ai/prompts`.
- Use deterministic AI fallback for demo reliability when `OPENAI_API_KEY` is unavailable.
- Prioritize the Family -> Meal Plan -> Replacement -> Grocery -> MAMA Family Table flow over future modules.
- Pin Next workspace root through `next.config.mjs` because a parent `C:\Users\HP\package-lock.json` caused Turbopack to infer the wrong root.
- Keep admin/CRM as documented contracts until the core family planning flow is fully hardened.

## Required Environment Variables

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `AWS_REGION`
- `MAMA_AI_TABLE_NAME`
- `REVENUECAT_WEBHOOK_SECRET`
- `YOUTUBE_API_KEY`

## Deployment Status

- Not deployed.
- Local build is production-valid.
- Dev server is running locally at `http://127.0.0.1:3000`.
