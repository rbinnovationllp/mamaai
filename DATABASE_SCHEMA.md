# MAMA AI Database Schema

## Production Database

Preferred production database: AWS DynamoDB.

Table name: `MAMA_AI_APP`

Primary key:

- `pk`: string
- `sk`: string

Secondary indexes:

- `GSI1`: `gsi1pk`, `gsi1sk`
- `GSI2`: `gsi2pk`, `gsi2sk`

Every item includes:

- `entityType`
- `createdAt`
- `updatedAt`

## Entity Keys

| Entity | pk | sk | Notes |
| --- | --- | --- | --- |
| User | `USER#{userId}` | `PROFILE` | Auth, consent, role |
| Family | `USER#{userId}` | `FAMILY#{familyId}` | Household settings |
| FamilyMember | `FAMILY#{familyId}` | `MEMBER#{memberId}` | Profile, health, preferences |
| HealthProfile | `MEMBER#{memberId}` | `HEALTH` | Sensitive health details |
| FoodPreference | `MEMBER#{memberId}` | `FOOD_PREFERENCE` | Likes, dislikes, diet type |
| MealPlan | `FAMILY#{familyId}` | `MEAL_PLAN#{mealPlanId}` | Plan metadata |
| MealPlanDay | `MEAL_PLAN#{mealPlanId}` | `DAY#{date}` | Daily grouping |
| Meal | `MEAL_PLAN#{mealPlanId}` | `MEAL#{mealId}` | Common meal |
| MealCustomization | `MEAL#{mealId}` | `CUSTOMIZATION#{memberId}` | Member-specific adjustments |
| FruitRecommendation | `MEAL_PLAN#{mealPlanId}` | `FRUIT#{memberId}` | Member fruit guidance |
| HydrationRecommendation | `MEAL_PLAN#{mealPlanId}` | `HYDRATION#{memberId}` | Member hydration guidance |
| GroceryList | `MEAL_PLAN#{mealPlanId}` | `GROCERY_LIST` | Grocery summary |
| GroceryItem | `GROCERY_LIST#{groceryListId}` | `ITEM#{itemId}` | Ingredient item |
| PantryItem | `FAMILY#{familyId}` | `PANTRY#{pantryItemId}` | Optional pantry |
| MealFeedback | `MEAL_PLAN#{mealPlanId}` | `FEEDBACK#{feedbackId}` | Satisfaction and rejection |
| Subscription | `USER#{userId}` | `SUBSCRIPTION` | RevenueCat entitlement |
| Lead | `CRM` | `LEAD#{leadId}` | CRM lead |
| CRMActivity | `LEAD#{leadId}` | `ACTIVITY#{activityId}` | CRM timeline |
| SupportTicket | `USER#{userId}` | `TICKET#{ticketId}` | Support |
| AuditLog | `AUDIT` | `LOG#{createdAt}#{auditLogId}` | Admin/security actions |

## Required Entities

## User

- `userId`
- `name`
- `email`
- `mobile`
- `country`
- `state`
- `city`
- `preferredLanguage`
- `authProvider`
- `role`
- `healthDataConsentAt`
- `aiMemoryConsentAt`

## Family

- `familyId`
- `userId`
- `name`
- `region`
- `dietPreference`
- `cuisinePreferences`
- `budget`
- `kitchenProfile`
- `memberCount`
- `subscriptionPlan`

## FamilyMember

- `memberId`
- `familyId`
- `name`
- `relationship`
- `dateOfBirth`
- `age`
- `gender`
- `heightCm`
- `weightKg`
- `activityLevel`
- `goals`
- `dietType`
- `likes`
- `dislikes`
- `allergies`
- `foodAllergies`
- `ingredientAllergies`
- `foodDislikes`
- `dislikedMeals`
- `excludedIngredients`
- `dietaryRestrictions`
- `healthConditions`
- `doctorRestrictions`
- `specialStatuses`

## NutritionContext

Stored on generated plans or computed on demand:

- `memberId`
- `bmi`
- `bmiCategory`
- `estimatedCalories`
- `proteinGuidanceGrams`
- `carbGuidance`
- `fatGuidance`
- `fiberGuidance`
- `hydrationGuidanceMl`
- `calculationNotes`
- `requiresProfessionalGuidance`

## MealPlan

- `mealPlanId`
- `familyId`
- `date`
- `planType`
- `status`
- `commonMeal`
- `commonMeal.nutritionEstimate`
- `commonMeal.recipe`
- `memberCustomizations`
- `fruits`
- `hydration`
- `estimatedCost`
- `groceryItems`
- `familySatisfactionScore`
- `warnings`
- `disclaimer`

## Subscription Plans

| Plan | Price | Member Limit |
| --- | ---: | ---: |
| Family Starter | INR 199/month | 4 |
| Family Premium | INR 399/month | 6 |
| Family Plus | INR 599/month | 10 |

Member limits must be enforced in backend services and API routes, not only in UI.

RevenueCat-ready fields:

- `revenueCatCustomerId`
- `revenueCatEntitlementId`
- `revenueCatProductId`
- `googlePlayProductId`
- `status`
- `source`
- `currentPeriodEndsAt`
- `lastRevenueCatEventType`
- `lastRevenueCatEventAt`

Judge/Demo Access uses `source = demo_judge_access`, `isActive = true`, and `bypassPaymentForDemo = true` only for fictional demo data.

## Sensitive Data Rules

- Health conditions, doctor restrictions, allergies, recovery status, pregnancy/lactation, and AI memory require explicit consent.
- Admin roles may only see sensitive health data when their role requires it.
- Important admin actions must create `AuditLog` records.

## Migration Strategy

The MVP uses an in-memory repository to make the vertical slice runnable immediately. Production migration replaces repository implementations with DynamoDB repositories while keeping service interfaces and API contracts stable.
