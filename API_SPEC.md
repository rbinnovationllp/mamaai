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
    budget: BudgetProfile;
    kitchenProfile: KitchenProfile;
    subscriptionPlan: SubscriptionPlan;
  };
  members: CreateFamilyMemberInput[];
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
  mealTime?: "breakfast" | "lunch" | "dinner" | "snack";
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
}
```

Meal-time defaulting:

- The frontend uses the user's browser timezone and locale by default.
- Family country, region/state, and city are sent in `mealTimeContext` when available.
- Before 9:00 AM local time: breakfast.
- 9:00-10:00 AM local time: user can choose breakfast or lunch.
- Late morning/afternoon local time: lunch.
- From 6:00 PM local time onward: dinner.

Cost-control rule:

- New users should receive a focused next-meal plan.
- Returning users should be guided toward editable weekly plans to reduce repeated AI generation cost.

Response:

```ts
{
  nutritionContexts: NutritionContext[];
  mealPlan: FamilyMealPlan;
}
```

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
- `memberCustomizations`
- `fruits`
- `hydration`
- `estimatedCost`
- `groceryItems`
- `familySatisfactionScore`
- `warnings`
- `disclaimer`

Validation happens before display, persistence, grocery generation, analytics, and replacement.

Nutrition estimates are informational approximations. MVP estimates are modeled around public food-composition fields such as USDA FoodData Central nutrient data and ICMR/NIN-style food-group guidance. Production should replace static estimates with ingredient-weight lookup, regional food databases, and reviewed nutrition rules.
