# MAMA AI

Meal & Aahaar Management Assistant.

**The Wisdom of Maa. The Intelligence of AI.**

**One Family. Different Needs. One Intelligent Meal Plan.**

MAMA AI is an AI-powered Family Food Operating System for household meal planning. It is designed around a practical family reality: most homes do not want to cook five separate meals, but different family members often need different portions, adjustments, fruits, hydration, and health-aware guidance.

## Core Idea

MAMA AI generates:

1. One common family meal.
2. Member-specific portions.
3. Member-specific modifications.
4. Fruit and hydration recommendations.
5. Grocery list updates when a meal is replaced.
6. A visual MAMA Family Table for quick family-level understanding.

The product is not intended to diagnose disease, prescribe medicine, or replace medical advice.

## Hackathon MVP

The submitted MVP focuses on this working vertical slice:

Create Family -> Add Members -> Analyze Profiles -> Generate One Common Family Meal -> Member-Specific Modifications and Portions -> Fruits/Hydration -> Replace Meal -> Auto-Update Grocery List -> MAMA Family Table -> Feedback.

## Judge Access / Try Demo

Devpost judges should use the prominent **Try Demo / Judge Access** button on the home page.

Judge Access:

- Uses fictional family data only.
- Requires no registration.
- Requires no payment.
- Bypasses subscription checks only for the demo flow.
- Shows the full family meal planning flow immediately.
- Allows meal replacement and grocery-list update testing.

Demo family members:

- Grandmother, age 72, needs soft preparation and easy digestion.
- Father, age 50, has Type 2 diabetes context.
- Mother, age 45, balanced nutrition goal.
- Son, age 19, high activity and protein support goal.
- Daughter, age 10, growth-supportive nutrition goal.

No real personal or medical data is used in the demo.

## Ask MAMA

MAMAAI includes a floating **Ask MAMA** assistant for product help and navigation. In the hackathon build, Ask MAMA answers from a controlled MAMAAI knowledge base so it can explain only the features that are actually working, demo/test-only, temporarily unavailable, or planned.

Ask MAMA can guide users through Judge/Demo Mode, family creation, allergies and dislikes, fasting support, ingredient quantities, recipes, meal replacement, grocery planning, subscription plans, testing-stage limitations, and support.

It is not a doctor, dietitian, or replacement for the core meal-planning engine.

## Built With

- OpenAI Codex
- Next.js
- React
- TypeScript
- Zod
- Vercel-ready deployment
- GitHub

## Integration-Ready / Planned

These are represented through architecture, contracts, documentation, or non-blocking endpoint stubs, but are not required for the judge demo:

- OpenAI API / GPT-5.6 structured meal reasoning
- AWS DynamoDB persistence
- AWS Lambda/serverless expansion
- RevenueCat subscriptions
- Google Play Billing
- YouTube Data API

## How We Used OpenAI Codex

OpenAI Codex was used as the primary coding partner for this hackathon build.

Codex helped with:

- Repository audit and project setup.
- Architecture planning and documentation.
- Shared TypeScript contracts.
- Zod validation schemas.
- Service and repository boundaries.
- API route implementation.
- Judge/Demo Access mode.
- RevenueCat-ready subscription contracts.
- Safety validation rules.
- Mobile-first UI implementation.
- Debugging TypeScript, lint, build, Git, and deployment-readiness issues.
- Continuous `PROJECT_STATUS.md` updates for completed work, remaining tasks, environment variables, deployment status, and known limitations.

## How GPT-5.6 / OpenAI API Fits Into MAMA AI

MAMA AI is designed for GPT-5.6-style structured reasoning over family profiles, health context, preferences, regional food habits, budget, and grocery constraints.

In this hackathon build, the following AI foundation is implemented:

- Centralized prompt location under `lib/ai/prompts/`.
- Structured `FamilyMealPlan` output contract.
- Zod validation before display and persistence.
- Safety validation for allergies and doctor restrictions.
- Deterministic demo fallback so judges can test the workflow reliably without production API keys.

The submitted build does not require a live OpenAI API key for Judge Access. A production OpenAI API integration can replace the deterministic fallback while preserving the same structured output contract and safety validation layer.

## RevenueCat Subscription Architecture

MAMA AI is RevenueCat-ready but does not require live billing for the hackathon demo.

Plans:

- Family Starter: India INR 399/month; international US$4.99/month; up to 4 family members.
- Family Premium: India INR 599/month; international US$6.99/month; up to 6 family members.
- Family Plus: India INR 799/month; international US$8.99/month; up to 10 family members.

India and international prices are configured regional tiers, not live currency conversions. Production checkout must match the configured prices in RevenueCat, Google Play, and the selected web payment provider before billing is enabled.

Implemented:

- Subscription plan definitions.
- Backend member-limit enforcement logic.
- `/api/subscriptions/plans` endpoint.
- `/api/subscriptions/status` server-side testing-stage entitlement endpoint.
- `/api/revenuecat/webhook` contract endpoint.
- Judge Access payment bypass limited to fictional demo data.
- No fake payment buttons in the hackathon build.

Not yet implemented:

- Live RevenueCat SDK connection.
- Persistent subscription history.
- Google Play Billing production connection.
- DynamoDB-backed entitlement storage.

Recommended web/PWA payment approach: launch with a production web payment provider using server-side webhook verification, then store the verified entitlement in DynamoDB. Future RevenueCat, Google Play Billing, and iOS subscription events should update the same MAMAAI user entitlement so one account has one reliable subscription status.

## Mobile / PWA Access

MAMAAI is currently a mobile-first web app with a PWA foundation. Users can open the site from a phone and use **Install MAMAAI** / browser **Add to Home Screen** behavior where supported.

Implemented:

- Web app manifest.
- App icons.
- Basic service worker.
- Mobile hamburger navigation.
- Install guidance for Android/iPhone browser limitations.

## Safety Notes

MAMA AI must never:

- Diagnose disease.
- Prescribe medicine.
- Change medication.
- Recommend stopping medication.
- Override doctor instructions.
- Guarantee health outcomes.

Generated meal plans include an informational disclaimer. Users with chronic medical conditions, allergies, pregnancy, recent hospitalization, surgery, medication requirements, or other special health needs should consult a doctor, registered dietitian, or qualified healthcare professional before following or materially changing a meal plan.

## Local Setup

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

For the hackathon demo, the app can run without real OpenAI, AWS, RevenueCat, or YouTube keys.

Testing-stage notice:

```text
You are using a testing version of MAMAAI. Some features that depend on external services may be limited or temporarily unavailable. These integrations are planned to be enabled or expanded as the application progresses toward production.
```

For example, written recipes remain available in the demo. If recipe-video discovery is not activated because the YouTube Data API is not configured, MAMAAI labels it as currently unavailable in the testing version instead of showing a confusing technical error.

Minimal local/demo environment:

```env
MAMA_AI_DEMO_MODE=true
MAMA_AI_JUDGE_ACCESS_ENABLED=true
AUTH_SECRET=replace-with-a-long-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Do not commit `.env` or `.env.local`.

## Validation

The project has been validated with:

```bash
npm run typecheck
npm run lint
npm run build
```

## Analytics

The Vercel build includes Vercel Web Analytics for lightweight page analytics. The hackathon build also records privacy-conscious product events for the Admin Dashboard:

- Homepage visits
- Try Demo clicks
- Get Started clicks
- Family creation / registration-style success
- Meal plans generated
- Ask MAMA opens, questions, unresolved topics, and common categories
- Meal budget constraints and estimated-cost comparison

Admin analytics are visible at:

```text
/admin
```

The MVP analytics store anonymous visitor/session ids only and does not store raw IP addresses.

## Important Project Docs

- `PRD.md`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `DATABASE_SCHEMA.md`
- `API_SPEC.md`
- `SECURITY.md`
- `TEST_PLAN.md`
- `PROJECT_STATUS.md`
- `.env.example`

## Current Limitations

- The MVP uses in-memory demo persistence.
- Production DynamoDB repositories are documented but not connected yet.
- Live OpenAI API integration is architecture-ready but not required for Judge Access.
- RevenueCat and Google Play Billing are integration-ready but not production-complete.
- PWA install support depends on browser behavior; iPhone users may need Safari's Share -> Add to Home Screen option.
- Optional external-service features are labeled as fully functional, demo/test-only, temporarily disabled, or planned.
- Website analytics are in-memory for the hackathon demo; production should persist analytics events in DynamoDB or a managed privacy-friendly analytics service.
- Admin/CRM, pantry, production video discovery, analytics, production PDF/CSV exports, and multilingual rollout are post-hackathon priorities.

## Repository

Code repository:

```text
https://github.com/rbinnovationllp/mamaai
```

## Contact

- Support: support@mamaai.in
- Owner: rbinnovationllp@gmail.com
