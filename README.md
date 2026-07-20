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

- Family Starter: INR 199/month, up to 4 family members.
- Family Premium: INR 399/month, up to 6 family members.
- Family Plus: INR 599/month, up to 10 family members.

Implemented:

- Subscription plan definitions.
- Backend member-limit enforcement logic.
- `/api/subscriptions/plans` endpoint.
- `/api/revenuecat/webhook` contract endpoint.
- Judge Access payment bypass limited to fictional demo data.

Not yet implemented:

- Live RevenueCat SDK connection.
- Persistent subscription history.
- Google Play Billing production connection.
- DynamoDB-backed entitlement storage.

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
- Admin/CRM, pantry, YouTube recipe search, analytics, exports, and multilingual rollout are post-hackathon priorities.

## Repository

Code repository:

```text
https://github.com/rbinnovationllp/mamaai
```
