# MAMA AI Architecture

## Product Focus

MAMA AI is a family food planning system built around one principle: one common family meal with personalized portions and modifications for each member. The hackathon MVP prioritizes this vertical slice:

Create Family -> Add Members -> Analyze Profiles -> Generate One Common Family Meal -> Member-Specific Modifications and Portions -> Fruits/Hydration -> Replace Meal -> Auto-Update Grocery List -> MAMA Family Table -> Feedback.

Advanced modules such as YouTube recipes, pantry automation, monthly planning, analytics, and full payment production integration remain roadmap items until the MVP flow works end to end.

## 40-Hour Hackathon Priority

Current priority order:

1. Working core MVP.
2. Judge/Demo Access.
3. AI integration.
4. Testing.
5. Production deployment.
6. Devpost-ready demo.
7. RevenueCat integration.
8. Non-critical features.

RevenueCat and Google Play Billing must not delay the judge-facing demo. Billing remains integration-ready, while Judge Access uses a safe fictional-data-only payment bypass.

## Region-Aware Meal Planning

The MVP includes a meal-time selector with user-local defaults. The browser detects the user's timezone and locale, then the meal-plan request also carries the family country, region/state, and city when available.

- Before 9:00 AM local time: breakfast.
- 9:00-10:00 AM local time: let the user choose breakfast or lunch.
- Late morning/afternoon local time: lunch.
- From 6:00 PM local time onward: dinner.

The frontend sends `mealTime` and `mealTimeContext` to the API so AI/service logic can plan the appropriate meal for the user's region instead of assuming India-only timing.

## Diet Preference and Nutrition Estimates

First-time family setup captures the family food pattern:

- Vegetarian
- Non vegetarian
- Semi vegetarian
- Eggetarian
- Mixed family

The meal optimizer uses this contract before suggesting the common meal. Mixed and semi-vegetarian families receive a vegetarian base meal with optional egg/chicken add-ons so one family table can still work.

Each generated common meal includes `nutritionEstimate` with estimated calories, protein, carbs, fat, and fiber. The UI also allows the user to add an extra food or custom values and recalculates the estimate immediately. MVP values are educational estimates based on public food-composition concepts such as USDA FoodData Central nutrient fields and ICMR/NIN food-group guidance. Production should connect verified ingredient-weight nutrition lookup before claiming precise nutrition analysis.

## AI Cost-Control Strategy

To protect the economics of low-price plans, the product should avoid unnecessary full regeneration:

- New users: generate a focused next-meal plan for onboarding.
- Returning users: prefer an editable weekly plan and reuse previous structure where possible.
- Meal replacement should update only affected meal/grocery data rather than regenerating everything.

## Application Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS-compatible styling.
- Backend: Next.js route handlers as modular serverless APIs.
- Validation: Zod schemas in shared contracts.
- Database target: DynamoDB through repository abstractions.
- MVP persistence: in-memory demo repository with the same service/repository boundaries, replaceable by DynamoDB.
- AI: OpenAI API architecture with deterministic local fallback for hackathon demos.
- Auth: session/JWT architecture with guest mode for MVP demo, upgradeable to email, Google, OTP, and Apple sign-in.

## Runtime Flow

Frontend screens call API routes only. UI components must not call database SDKs or AI clients directly.

Frontend -> API Route -> Service -> Repository -> Database

AI output follows:

API Route -> MealPlanningService -> NutritionContextService -> AIService -> SafetyValidationService -> GroceryService -> Repository

## Workstreams

## A. Architecture

Owns shared contracts, folder boundaries, API specs, database schema, service interfaces, and documentation consistency.

## B. Frontend/UX

Owns mobile-first user flow, family creation UI, member capture, meal plan display, grocery UI, meal replacement action, feedback, and MAMA Family Table.

## C. Backend/Database

Owns API routes, repositories, persistence, validation, CRUD rules, and subscription member limit enforcement.

## D. AI Family Food Optimizer

Owns centralized prompts, structured AI output, meal optimization, nutrition context, fruit/hydration logic, replacement logic, grocery intelligence, and safety checks.

## E. Admin/CRM

Owns RBAC-protected admin and CRM foundations. MVP scope is documentation and contract readiness only unless the core family flow is complete.

## F. QA/Security

Owns tests, security review, accessibility, responsive checks, error states, and final hackathon release gate.

## Folder Architecture

```text
app/
  api/
    demo/route.ts
    families/route.ts
    meal-plans/route.ts
    meal-plans/[mealPlanId]/replace/route.ts
  page.tsx
  layout.tsx
  globals.css
components/
  FamilyFlow.tsx
  MamaFamilyTable.tsx
lib/
  ai/
    prompts/family-meal-plan.ts
    ai-service.ts
    safety-validation-service.ts
  repositories/
    in-memory-store.ts
  services/
    family-service.ts
    grocery-service.ts
    meal-planning-service.ts
    nutrition-context-service.ts
    subscription-service.ts
  shared/
    contracts.ts
    demo-data.ts
    schemas.ts
```

## Shared Contracts

The shared contract layer defines database entities, API payloads, AI structured outputs, subscription plans, and safety validation types. All workstreams must import from `lib/shared/contracts.ts` and validate runtime input/output with `lib/shared/schemas.ts`.

## Authentication Approach

MVP supports a demo/guest user and contract-ready authenticated users. API routes assume a current user via `x-demo-user-id` in demo mode or a future verified session/JWT. The database schema stores `authProvider`, `role`, `healthDataConsentAt`, and `aiMemoryConsentAt`.

Judge/Demo Access is a deliberate guest mode for Codex Hackathon judges. It loads fictional family profiles immediately and does not require registration, payment, or subscription setup.

Production-ready next steps:

- Add NextAuth/Auth.js or equivalent managed auth.
- Use secure HTTP-only session cookies.
- Add Google login and email magic link/password login.
- Keep OTP and Apple login as adapter-ready auth providers.
- Enforce RBAC for `/admin`.

## AI Structured Output Contract

AI meal generation must return a validated `FamilyMealPlan` containing:

- `commonMeal`
- `commonMeal.nutritionEstimate`
- `memberCustomizations`
- `fruits`
- `hydration`
- `estimatedCost`
- `groceryItems`
- `familySatisfactionScore`
- `warnings`
- `disclaimer`

Known allergies and doctor restrictions are hard constraints. Unsafe AI output must be rejected before display or persistence.

## DynamoDB Architecture

Use single-table design for production scalability:

- Table: `MAMA_AI_APP`
- Partition key: `pk`
- Sort key: `sk`
- GSI1: `gsi1pk`, `gsi1sk`
- GSI2: `gsi2pk`, `gsi2sk`

Repositories own key construction. Services must not know DynamoDB key shapes.

## Architecture Decisions

- The MVP starts with deterministic fallback AI so the demo can run without an OpenAI key.
- Service and repository boundaries are implemented from day one to avoid UI/database coupling.
- DynamoDB is documented as production target, while the local in-memory store enables immediate hackathon iteration.
- Admin/CRM contracts are documented but not prioritized over the family meal vertical slice.
- RevenueCat plan metadata is defined in code, but production billing is not allowed to block hackathon submission.
- Judge Access bypasses payment only for fictional demo data and does not weaken normal production entitlement logic.
