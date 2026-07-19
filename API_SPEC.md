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

## POST /api/families

Creates a family with members after enforcing subscription member limits.

Request:

```ts
{
  userId: string;
  family: CreateFamilyInput;
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
  targetDate?: string;
  availableIngredients?: string[];
  previousMeals?: string[];
}
```

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
- `memberCustomizations`
- `fruits`
- `hydration`
- `estimatedCost`
- `groceryItems`
- `familySatisfactionScore`
- `warnings`
- `disclaimer`

Validation happens before display, persistence, grocery generation, analytics, and replacement.
