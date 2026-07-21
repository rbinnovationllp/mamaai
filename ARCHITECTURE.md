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
- 4:00-6:00 PM local time: high tea or evening snack can be selected.
- From 6:00 PM local time onward: dinner.

The frontend sends `mealTime` and `mealTimeContext` to the API so AI/service logic can plan the appropriate meal for the user's region instead of assuming India-only timing.

## Meal Strength, High Tea, and Fasting

The MVP now supports meal-wise family strength. Before generating a plan, the UI can send who is eating the selected meal, who is absent, who is fasting, and how many guests are present. The backend uses these values to calculate adult-equivalent portion units and ingredient quantities.

High tea is modeled as a real `MealTime` value instead of a text note. This allows families in any region to plan late-afternoon food separately from dinner without forcing the entire flow into lunch/dinner assumptions.

Fasting is stored per member as a structured preference: frequency, regular days, fast type, allowed foods, avoided foods, fruit/dairy/grain rules, meal count, and custom traditions. Fasting members are excluded from normal meal quantities and receive a fasting-aware suggestion. These rules are user-configurable because fasting practices vary by country, faith, family tradition, health context, and personal preference.

Ingredient quantity and grocery updates are deterministic service logic, not repeated AI generation. AI should be used for meal intelligence and structured recommendations; attendance changes, guest count changes, and fasting toggles should reuse the existing plan and recalculate quantities locally wherever possible.

## Diet Preference and Nutrition Estimates

First-time family setup captures the family food pattern:

- Vegetarian
- Non vegetarian
- Semi vegetarian
- Eggetarian
- Mixed family

The meal optimizer uses this contract before suggesting the common meal. Mixed and semi-vegetarian families receive a vegetarian base meal with optional egg/chicken add-ons so one family table can still work.

Each generated common meal includes `nutritionEstimate` with estimated calories, protein, carbs, fat, and fiber. The UI also allows the user to add an extra food or custom values and recalculates the estimate immediately. MVP values are educational estimates based on public food-composition concepts such as USDA FoodData Central nutrient fields and ICMR/NIN food-group guidance. Production should connect verified ingredient-weight nutrition lookup before claiming precise nutrition analysis.

## Allergy, Dislike, and Recipe Handling

Member profiles capture separate fields for food allergies, ingredient allergies, food dislikes, disliked meals/dishes, ingredients never to include, dietary restrictions, and doctor restrictions. The planner treats allergies, excluded ingredients, dietary restrictions, and doctor restrictions as hard constraints. Dislikes are softer preferences and should first be handled through individual member modifications when only one member is affected.

Soft dislikes use a preference-resolution flow instead of automatically weakening the entire family meal. When a member dislikes a meal or ingredient that is otherwise suitable for the rest of the family, MAMA AI presents three options: prepare a separate simple alternative, keep only one common meal and regenerate, or suggest two compatible options with a small second component. The default recommendation favors minimum additional cooking while preserving maximum family satisfaction.

Every generated common meal includes a `recipe` object. The UI exposes it through `View Recipe / How to Cook`, showing recipe name, ingredient quantities, servings, step-by-step cooking instructions, prep time, cook time, difficulty, estimated nutrition, estimated cost, family-member-specific adjustments, alternatives, and a video recommendation.

The `Watch How to Cook` action calls `/api/recipes/videos`. When `YOUTUBE_API_KEY` is available, that route uses the official YouTube Data API `search.list` endpoint with query context for dish, country/region, language, cuisine, diet preference, healthy preparation, and family requirements. When the key is absent in the testing version, the UI shows `Currently Unavailable in Test Version` and keeps the written recipe available. If an activated external service has a temporary issue, the route may return a clearly labeled demo/test-only fallback. External videos are third-party content that MAMA AI has not medically or nutritionally verified.

Optional API-dependent features must present a clear status: fully functional, demo/test-only, temporarily disabled, or planned. They must not fail silently, expose API keys, or block the core family meal-planning flow.

## AI Cost-Control Strategy

To protect the economics of low-price plans, the product should avoid unnecessary full regeneration:

- New users: generate a focused next-meal plan for onboarding.
- Returning users: prefer an editable weekly plan and reuse previous structure where possible.
- Meal replacement should update only affected meal/grocery data rather than regenerating everything.
- Attendance, fasting, and guest-count changes should update deterministic ingredient quantities without a fresh AI call.

## Application Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS-compatible styling.
- Backend: Next.js route handlers as modular serverless APIs.
- Validation: Zod schemas in shared contracts.
- Database target: DynamoDB through repository abstractions.
- MVP persistence: in-memory demo repository with the same service/repository boundaries, replaceable by DynamoDB.
- AI: OpenAI API architecture with deterministic local fallback for hackathon demos.
- Auth: session/JWT architecture with guest mode for MVP demo, upgradeable to email, Google, OTP, and Apple sign-in.

## AWS Data Storage Architecture

Supabase is not used in the current codebase. The current hackathon build stores data in an in-memory repository under `lib/repositories/in-memory-store.ts`; this keeps Judge/Demo Access reliable but does not persist production user data after server restarts.

Production MAMAAI should use AWS storage with clear separation between database records and file objects:

- Amazon DynamoDB: structured application data that must be queried, filtered, updated, related to users/families, protected by authorization, or expired by TTL.
- Amazon S3: larger objects and downloadable files such as meal-plan exports, PDFs, user-uploaded images/documents, recipe media, reports, backups, and CSV/JSON exports.
- Next.js API routes or AWS Lambda: secure backend layer that validates requests, checks authorization, and accesses DynamoDB/S3 server-side. Frontend components must never receive AWS credentials or call DynamoDB/S3 directly.
- Amazon Cognito or an equivalent existing auth solution: production identity provider. Cognito is a good AWS-native option for email/social/mobile-ready authentication, but the current hackathon demo can keep guest mode until login is wired safely.

S3 must not be used as the primary application database. It is object storage, not the right place for frequent user/family queries, entitlement checks, meal-plan filtering, CRM pipelines, or safety-relevant preference updates.

The same AWS account can host MAMAAI and education projects if each project is isolated by:

- Separate DynamoDB tables, for example `MAMA_AI_APP` and separate education-project tables.
- Separate S3 buckets or strict project prefixes, for example `s3://mamaai-prod-assets/mamaai/`.
- Separate IAM roles and policies scoped only to MAMAAI table ARNs and MAMAAI bucket/prefix ARNs.
- Separate environment variables per deployed app/project.
- Separate CloudWatch log groups and alarms.
- Optional separate AWS accounts later for stronger billing/security isolation.

For Vercel deployment, route handlers should access AWS using server-side environment variables only. Use least-privilege IAM credentials or an AWS-supported identity flow; never expose AWS keys through `NEXT_PUBLIC_` variables.

## Website Analytics

Vercel Web Analytics is integrated through `@vercel/analytics/next` for lightweight hosted page analytics on Vercel. MAMAAI also includes a small MVP analytics event endpoint for hackathon product metrics:

- Homepage visit
- Try Demo click
- Get Started click
- Create Family / registration-style success
- Meal plan generated
- Ask MAMA opens, questions, unresolved topics, and common categories

The internal tracker uses anonymous local visitor/session ids and does not store raw IP addresses. It clearly separates page views, visits/sessions, and estimated unique visitors. In production, analytics should move from the in-memory store to DynamoDB, a managed privacy-friendly analytics product, or Vercel Analytics where the metric is supported.
## Ask MAMA Assistant

Ask MAMA is a floating product-help and navigation assistant. The hackathon version uses a controlled MAMAAI knowledge base in `lib/ask-mama/knowledge-base.ts` and the `/api/ask-mama` route instead of sending a large open-ended prompt on every question. This keeps answers short, predictable, and aligned with the actual submitted build.

Current scope:

- Explain what MAMAAI is and how the family meal-planning flow works.
- Guide users to Judge/Demo Mode or family creation.
- Explain allergies, dislikes, fasting support, ingredient quantities, recipes, meal replacement, grocery planning, subscriptions, testing-stage limitations, and support contact.
- Refuse requests for secrets, internal prompts, private data, admin details, diagnosis, treatment, or medication guidance.
- Track anonymous `ask_mama_open`, `ask_mama_question`, and `ask_mama_unresolved` events with category labels.

Future scope:

- Add multilingual responses.
- Add authenticated user-aware guidance with strict privacy boundaries.
- Add OpenAI-powered answer generation constrained by the same structured knowledge base and safety rules.

## Retention and Exports

Detailed generated meal plans use a 15-day retention policy. The plan includes `expiresAt` and `retentionPolicy` metadata and the UI shows a `Download / Export / Save` action. In production, DynamoDB TTL should use an epoch timestamp attribute such as `expiresAtEpoch` to expire detailed meal-plan items automatically.

Do not expire long-term personalization and safety records just because a detailed meal plan expires. Keep family profiles, allergies, dietary restrictions, disliked/rejected foods, fasting preferences, favourite meals, feedback, subscription/account data, and lightweight meal-preference patterns until the user deletes or changes them.

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
    ask-mama/route.ts
    demo/route.ts
    families/route.ts
    meal-plans/route.ts
    meal-plans/[mealPlanId]/replace/route.ts
  page.tsx
  layout.tsx
  globals.css
components/
  AskMamaWidget.tsx
  FamilyFlow.tsx
  MamaFamilyTable.tsx
lib/
  ask-mama/
    knowledge-base.ts
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

## Mobile App Access / PWA Approach

The hackathon build is a mobile-first web/PWA application. This is the fastest stable route because users can open `mamaai.in` from any phone and add MAMAAI to the home screen without waiting for Google Play or App Store approval.

Implemented PWA foundation:

- Web app manifest with standalone display, app name, theme color, start URL, and app icons.
- Service worker for basic app-shell caching and faster repeat opening.
- Visible `Install MAMAAI` action with browser fallback instructions for iPhone and Android.
- Mobile hamburger menu for in-page app navigation.

Future native app architecture remains compatible: the same backend APIs, user IDs, family records, meal plans, and subscription entitlements can be reused by Android/iOS clients.

## Monetization and Entitlements

MAMAAI should use one server-side entitlement record per user, regardless of payment channel.

Planned flow:

Visitor -> Demo/Free Experience -> Registration -> Subscription Selection -> Payment -> Backend Verification -> Subscription Activated -> Premium Features Unlocked -> Renewal/Cancellation Management.

Plans:

- Family Starter: India INR 399/month; international US$4.99/month; up to 4 members.
- Family Premium: India INR 599/month; international US$6.99/month; up to 6 members.
- Family Plus: India INR 799/month; international US$8.99/month; up to 10 members.

Pricing is region-configured, not calculated through live currency conversion. India uses INR pricing; supported international markets use configured international USD pricing unless a payment provider has an approved localized price for that market.

Hackathon status:

- `/api/subscriptions/plans` returns plan metadata and honest billing readiness.
- `/api/subscriptions/status` returns a server-resolved testing-stage entitlement.
- `/api/razorpay/subscriptions` can create Indian web/PWA Razorpay subscriptions when MAMAAI test keys and plan IDs are configured.
- `/api/razorpay/verify` verifies Razorpay Checkout signatures before activating entitlement.
- `/api/razorpay/webhook` verifies Razorpay webhook signatures and records subscription/payment status changes.
- RevenueCat webhook contract exists but does not persist production records until DynamoDB is connected.
- No fake payment should activate premium access. If Razorpay is not configured, the app returns a clear testing-stage message.

Recommended Indian web/PWA payment path: use Razorpay Subscriptions with server-side subscription creation, Checkout signature verification, webhook verification, and DynamoDB-backed entitlements. Future RevenueCat/Google Play/iOS events should update the same user entitlement record, not create separate accounts.

Razorpay account sharing: the same Razorpay business account can be used for MAMAAI and other projects such as Syllabus Synk, but each project must have separate plan IDs, webhook URLs, webhook secrets, metadata tag (`project=mamaai`), environment variables, and entitlement records.

GST/invoices: production Razorpay/GST invoice setup must match the legal billing entity and tax configuration before real collection. The hackathon build stores payment/subscription status only and does not issue production invoices.

Fair-use controls should protect high-cost AI operations by plan tier. Track meal-plan generation, meal replacement/regeneration, recipe regeneration, Ask MAMA questions, and future AI calls per user/plan in the admin dashboard before changing production limits.

## AI Structured Output Contract

AI meal generation must return a validated `FamilyMealPlan` containing:

- `commonMeal`
- `commonMeal.nutritionEstimate`
- `commonMeal.recipe`
- `memberCustomizations`
- `preferenceResolution` when soft dislikes need user choice
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
- Web/PWA access is the current launch path; native Android/iOS remains a later client using the same API and entitlement contracts.

