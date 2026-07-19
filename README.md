# MAMA AI

Meal & Aahaar Management Assistant.

The Wisdom of Maa. The Intelligence of AI.

One Family. Different Needs. One Intelligent Meal Plan.

MAMA AI is an AI-powered Family Food Operating System that creates one intelligent family meal plan with personalized nutrition, portions, health-aware adjustments, grocery planning, and regional and seasonal food intelligence.

## Hackathon MVP

The current build prioritizes one end-to-end vertical slice:

Create Family -> Add Members -> Analyze Profiles -> Generate One Common Family Meal -> Member-Specific Modifications and Portions -> Fruits/Hydration -> Replace Meal -> Auto-Update Grocery List -> MAMA Family Table.

## Judge Access

Devpost judges should use the prominent `Try Demo / Judge Access` button on the home page.

Judge Access:

- Uses fictional family data only.
- Requires no registration.
- Requires no payment.
- Shows the full family meal planning flow immediately.
- Allows meal replacement and grocery-list update testing.

Production subscriptions remain RevenueCat-ready and are separate from the judge demo bypass.

## Setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill production values when needed. The MVP can run in demo mode without an OpenAI key.

## Required Docs

- `PRD.md`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `DATABASE_SCHEMA.md`
- `API_SPEC.md`
- `SECURITY.md`
- `TEST_PLAN.md`
- `PROJECT_STATUS.md`
- `.env.example`
