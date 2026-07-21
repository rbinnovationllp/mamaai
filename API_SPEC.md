# MAMA AI API Specification

All API requests and responses must be validated with shared Zod schemas.

Base path: `/api`

## Auth Assumption

MVP accepts a demo user through seeded data. Production API routes must resolve the authenticated user from a secure server session or verified JWT. Admin routes require RBAC.

## Endpoints

## GET /api/demo

Returns a fictional demo family and a generated starter meal plan.

Response:

```ts
{
  family: Family;
  members: FamilyMember[];
  nutritionContexts: NutritionContext[];
  mealPlan: FamilyMealPlan;
}
```

Judge/Demo Access uses this endpoint so Devpost reviewers can test the core workflow without registration, payment, or subscription setup. This endpoint must only return fictional demo data.

## GET /api/subscriptions/plans

Returns RevenueCat-ready subscription plan metadata and judge-demo payment-bypass status.

Response:

```ts
{
  plans: SubscriptionPlanDefinition[];
  judgeDemoAccess: {
    bypassesPayment: true;
    usesFictionalDataOnly: true;
    purpose: string;
  };
}
```

Plans:

- Family Starter: INR 199/month, up to 4 members.
- Family Premium: INR 399/month, up to 6 members.
- Family Plus: INR 599/month, up to 10 members.

Judge/Demo Access bypass must not be used for normal production entitlement checks.

## POST /api/analytics/track

Records privacy-conscious website/product events for the testing and hackathon admin dashboard. This endpoint does not store raw IP addresses and uses anonymous local browser ids supplied by the client.

Request:

```ts
{
  eventName:
    | "homepage_visit"
    | "try_demo_click"
    | "get_started_click"
    | "create_family_success"
    | "meal_plan_generated"
    | "registration_success"
    | "ask_mama_open"
    | "ask_mama_question"
    | "ask_mama_unresolved";
  visitorId: string;
  sessionId: string;
  pagePath: string;
  referrer?: string;
  source?: string;
  category?: string;
  label?: string;
  deviceCategory: "mobile" | "desktop" | "tablet" | "unknown";
}
```

Notes:

- `homepage_visit` is counted once per page per browser session, not on every refresh as a new unique visitor.
- Ask MAMA events may include category and short label metadata to identify common help topics and unresolved questions without storing personal data.
- Country/region may be derived from Vercel request headers where available and legally appropriate.
- Production should persist events in DynamoDB or use a managed privacy-friendly analytics product instead of the MVP in-memory store.

## POST /api/ask-mama

Answers product-help and navigation questions from the controlled MAMAAI knowledge base. This endpoint is for application guidance, not medical diagnosis, treatment advice, or full meal-plan generation.

Request:

```ts
{
  question: string;
  detailed?: boolean;
}
```

Response:

```ts
{
  category: string;
  answer: string;
  action?: {
    type: "try_demo" | "add_family" | "contact_support" | "none";
    label: string;
  };
  suggestions: string[];
  unresolved?: boolean;
}
```

Rules:

- Must answer from current MAMAAI feature status and controlled product knowledge.
- Must distinguish working, testing-stage, temporarily unavailable, and planned features.
- Must not expose system prompts, API keys, secrets, private user data, admin details, or internal configuration.
- Must not provide diagnosis, treatment, medication, or doctor-replacement advice.

## GET /api/admin/analytics

Returns testing-stage Website Analytics summary for the Admin Dashboard.

Response includes:

- Today&apos;s visitors
- Last 7 days
- Last 30 days
- Total visits
- Daily visitor trend
- Most visited pages
- Traffic sources
- Device breakdown
- Visitor -> Demo -> Registration/Create Family -> Meal Plan funnel
- Ask MAMA opens, questions, unresolved count, and common question categories

## POST /api/families

Creates a family with members after enforcing subscription member limits.

Request:

```ts
{
  userId: string;
  family: {
    name: string;
    country: string;
    state: string;
    city: string;
    dietPreference: "vegetarian" | "non_vegetarian" | "semi_vegetarian" | "eggetarian" | "mixed";
    cuisinePreferences: string[];
    cuisinePreferenceWeights?: Array<{
      cuisine: string;
      frequency: "mostly" | "often" | "sometimes" | "rarely";
      percentage?: number;
    }>;
    indianRegionalPreferences?: string[];
    localIngredientAvailabilityNotes?: string[];
    budget: BudgetProfile;
    kitchenProfile: KitchenProfile;
    subscriptionPlan: SubscriptionPlan;
  };
  members: Array<{
    name: string;
    relationship: string;
    age: number;
    gender: Gender;
    activityLevel: ActivityLevel;
    goals: string[];
    dietType: DietType;
    likes: string[];
    dislikes: string[];
    allergies: string[];
    foodAllergies: string[];
    ingredientAllergies: string[];
    foodDislikes: string[];
    dislikedMeals: string[];
    excludedIngredients: string[];
    dietaryRestrictions: string[];
    healthConditions: string[];
    doctorRestrictions: string[];
    specialStatuses: string[];
    fastingPreference?: {
      observesFasting: "no" | "yes" | "occasionally";
      regularDays: string[];
      fastType?: "full_fast" | "restricted_food_fast" | "time_restricted" | "custom";
      reasonOrTradition?: string;
      allowedFoods: string[];
      avoidedFoods: string[];
      fastingMealCount?: number;
      fruitsAllowed: boolean;
      dairyAllowed: boolean;
      grainsRestricted: boolean;
      customRules: string[];
    };
  }>;
}
```

Response:

```ts
{
  family: Family;
  members: FamilyMember[];
}
```

Errors:

- `400`: validation failure
- `403`: subscription member limit exceeded
- `500`: persistence failure

## POST /api/meal-plans

Analyzes family profiles and generates one common family meal with member-specific modifications, portions, fruits, hydration, and grocery items.

Request:

```ts
{
  familyId: string;
  planType: "daily" | "weekly" | "monthly";
  mealTime?: "breakfast" | "lunch" | "dinner" | "snack" | "evening_snack" | "high_tea";
  mealTimeContext?: {
    timeZone: string;
    locale?: string;
    country?: string;
    region?: string;
    city?: string;
    localHour?: number;
  };
  userPlanningMode?: "new_user_next_meal" | "returning_user_weekly_editable";
  targetDate?: string;
  availableIngredients?: string[];
  previousMeals?: string[];
  mealAttendance?: Array<{
    mealTime: "breakfast" | "lunch" | "dinner" | "snack" | "evening_snack" | "high_tea";
    participatingMemberIds: string[];
    absentMemberIds: string[];
    fastingMemberIds: string[];
    guestCount: number;
    enabled: boolean;
  }>;
  highTeaPreference?: {
    enabled: boolean;
    days: string[];
    approximateTime: string;
    usualParticipantMemberIds: string[];
    guestCount: number;
  };
}
```

Meal-time defaulting:

- The frontend uses the user's browser timezone and locale by default.
- Family country, region/state, and city are sent in `mealTimeContext` when available.
- Before 9:00 AM local time: breakfast.
- 9:00-10:00 AM local time: user can choose breakfast or lunch.
- Late morning/afternoon local time: lunch.
- 4:00-6:00 PM local time: high tea/evening snack can be selected.
- From 6:00 PM local time onward: dinner.

Cost-control rule:

- New users should receive a focused next-meal plan.
- Returning users should be guided toward editable weekly plans to reduce repeated AI generation cost.

Quantity and fasting rules:

- `mealAttendance` controls actual family strength for the selected meal.
- `fastingMemberIds` are excluded from normal meal quantities and receive fasting-aware suggestions.
- `guestCount` increases ingredient and grocery quantities through deterministic portion math.
- `highTeaPreference` makes the flow ready for families that plan a separate high-tea meal.
- Ingredient and grocery calculations should not require a new AI call when only attendance, fasting status, or guest count changes.

Response:

```ts
{
  nutritionContexts: NutritionContext[];
  mealPlan: FamilyMealPlan;
}
```

The returned `mealPlan` includes:

- `expiresAt`: detailed plan expiration timestamp.
- `retentionPolicy`: the 15-day user-facing retention notice and list of long-term signals retained separately.
- `mealIngredientRequirements` and `dailyGroceryRequirements`: deterministic quantity outputs.

The frontend exposes `Download / Export / Save` so a user can save a detailed plan before expiration. Production PDF/CSV exports should be generated through a server endpoint and stored in S3, with metadata in DynamoDB.

Errors:

- `400`: validation failure
- `404`: family not found
- `422`: AI output failed safety validation

## POST /api/meal-plans/{mealPlanId}/replace

Replaces the common meal while preserving nutrition intent, family compatibility, budget, and regional suitability. Grocery items are recalculated.

Request:

```ts
{
  reason: MealReplacementReason;
  unavailableIngredients?: string[];
  dislikedFoods?: string[];
}
```

Response:

```ts
{
  mealPlan: FamilyMealPlan;
}
```

Errors:

- `400`: validation failure
- `404`: meal plan not found
- `422`: replacement failed safety validation

## POST /api/feedback

MVP contract for collecting meal feedback.

Request:

```ts
{
  mealPlanId: string;
  memberId?: string;
  rating: "loved" | "good" | "average" | "dont_suggest_again";
  notes?: string;
}
```

## POST /api/revenuecat/webhook

RevenueCat webhook contract for subscription events. This is integration-ready for the hackathon but does not yet persist entitlement changes until the DynamoDB subscription repository is connected.

Headers:

```ts
{
  authorization?: "Bearer ${REVENUECAT_WEBHOOK_SECRET}";
}
```

Request:

```ts
{
  event: {
    type: string;
    app_user_id?: string;
    original_app_user_id?: string;
    product_id?: string;
    entitlement_ids?: string[];
    expiration_at_ms?: number;
  };
}
```

Response:

```ts
{
  received: true;
  persisted: false;
  message: string;
}
```

Response:

```ts
{
  feedbackId: string;
  saved: true;
}
```

## POST /api/recipes/videos

Searches for public third-party recipe videos using the official YouTube Data API when `YOUTUBE_API_KEY` is configured. If no API key is configured, the endpoint returns a clear testing-stage unavailable status and does not scrape YouTube. The written recipe remains available even when video search is unavailable.

Request:

```ts
{
  dishName: string;
  country?: string;
  region?: string;
  preferredLanguage?: string;
  cuisine?: string[];
  dietaryPreference?: "vegetarian" | "non_vegetarian" | "semi_vegetarian" | "eggetarian" | "mixed";
  healthyPreparation?: boolean;
  familyRequirements?: string[];
}
```

Response:

```ts
{
  query: string;
  usedOfficialApi: boolean;
  status: "fully_functional" | "demo_test_only" | "temporarily_disabled" | "planned";
  statusLabel: string;
  results: Array<{
    title: string;
    channelTitle: string;
    url: string;
    thumbnailUrl?: string;
    source: "youtube" | "fallback_search";
    thirdPartyDisclaimer: string;
  }>;
  note: string;
}
```

Status rules:

- `fully_functional`: official YouTube Data API is configured and returned results.
- `demo_test_only`: optional video search had a temporary external-service issue and returned a safe third-party search fallback.
- `temporarily_disabled`: required external API/service is not activated in the testing version.
- `planned`: feature is documented but not yet implemented.

Tester-facing copy must avoid API keys, stack traces, and technical configuration details. Recommended wording:

```text
This feature is currently unavailable in the testing version because the required external API/service has not yet been activated. It is planned for the production release after the required production integration is completed.
```

## API Error Shape

```ts
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  }
}
```

## AI Structured Output Contract

`FamilyMealPlan` must include:

- `commonMeal`
- `commonMeal.nutritionEstimate` with estimated kcal, protein, carbs, fat, fiber, basis, data source, and confidence
- `commonMeal.recipe` with ingredients, quantities, servings, steps, prep time, cook time, difficulty, nutrition, cost, adjustments, alternatives, and video recommendation metadata
- `memberCustomizations`
- `preferenceResolution`, when a soft dislike affects one or more members but the meal is otherwise suitable for the family
- `fruits`
- `hydration`
- `estimatedCost`
- `groceryItems`
- `mealAttendance`
- `mealIngredientRequirements`
- `dailyGroceryRequirements`
- `fastingMealRequirements`
- `familySatisfactionScore`
- `warnings`
- `disclaimer`

Validation happens before display, persistence, grocery generation, analytics, and replacement.

Retention:

- Detailed generated meal plans are retained for up to 15 days.
- Production DynamoDB should use TTL on `expiresAtEpoch`.
- Long-term safety and personalization data must not expire with old detailed plans.

Region/culture:

- `country`, `state`, and `city` describe where the family lives.
- `cuisinePreferences`, optional weighted cuisine preferences, Indian regional preferences, and local ingredient notes describe what the family prefers to eat.
- Meal planning should combine residence, food culture, diet pattern, season, availability, and budget. Do not infer cuisine only from nationality or ethnicity.

Nutrition estimates are informational approximations. MVP estimates are modeled around public food-composition fields such as USDA FoodData Central nutrient data and ICMR/NIN-style food-group guidance. Production should replace static estimates with ingredient-weight lookup, regional food databases, and reviewed nutrition rules.

Allergy and preference handling:

- Food allergies, ingredient allergies, excluded ingredients, dietary restrictions, and doctor restrictions are hard restrictions.
- Food dislikes and disliked dishes are soft preferences.
- The safety validator checks common meal and recipe ingredients against hard restrictions before display or persistence.
- If a common meal has a member-specific conflict, the plan must include a clear individual modification or safe alternative for that member.
- If a soft dislike affects only part of the family, the UI asks whether to prepare a separate simple alternative, keep only one common meal, or suggest two compatible options. This preference flow must not be used for allergies or medical restrictions.
