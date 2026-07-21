# MAMA AI Database Schema

## Production Database

Preferred production database: AWS DynamoDB.

Table name: `MAMA_AI_APP`

Supabase is not part of the current implementation. The current MVP uses `lib/repositories/in-memory-store.ts` only for hackathon/demo persistence. Production should replace that repository with DynamoDB repositories without changing frontend components.

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
- `projectNamespace` = `mamaai`

Detailed meal-plan items that can expire also include:

- `expiresAt`
- `expiresAtEpoch`

Enable DynamoDB TTL on `expiresAtEpoch` for detailed meal-plan history. Keep safety and personalization records separate so TTL never deletes allergies, dietary restrictions, fasting preferences, permanent dislikes, favourites, feedback signals, or subscription/account data.

## Entity Keys

| Entity | pk | sk | Notes |
| --- | --- | --- | --- |
| User | `USER#{userId}` | `PROFILE` | Auth, consent, role |
| Family | `USER#{userId}` | `FAMILY#{familyId}` | Household settings |
| FamilyMember | `FAMILY#{familyId}` | `MEMBER#{memberId}` | Profile, health, preferences |
| HealthProfile | `MEMBER#{memberId}` | `HEALTH` | Sensitive health details |
| FoodPreference | `MEMBER#{memberId}` | `FOOD_PREFERENCE` | Likes, dislikes, diet type |
| FastingPreference | `MEMBER#{memberId}` | `FASTING_PREFERENCE` | Fasting rules and allowed/avoided foods |
| MealPlan | `FAMILY#{familyId}` | `MEAL_PLAN#{mealPlanId}` | Plan metadata |
| MealPlanDay | `MEAL_PLAN#{mealPlanId}` | `DAY#{date}` | Daily grouping |
| Meal | `MEAL_PLAN#{mealPlanId}` | `MEAL#{mealId}` | Common meal |
| MealCustomization | `MEAL#{mealId}` | `CUSTOMIZATION#{memberId}` | Member-specific adjustments |
| MealAttendance | `MEAL_PLAN#{mealPlanId}` | `ATTENDANCE#{date}#{mealTime}` | Who eats, who is absent, who is fasting, guest count |
| IngredientRequirement | `MEAL#{mealId}` | `INGREDIENT_REQUIREMENT#{itemId}` | Meal-wise adjusted ingredient quantity |
| DailyGroceryRequirement | `MEAL_PLAN#{mealPlanId}` | `DAILY_GROCERY_REQUIREMENT#{itemId}` | Consolidated deterministic grocery requirement |
| FastingMealRequirement | `MEAL#{mealId}` | `FASTING_REQUIREMENT#{memberId}` | Fasting-aware member alternative |
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
| AppSetting | `APP#mamaai` | `SETTING#{settingKey}` | Region, retention, feature flag, and AI config metadata |
| AnalyticsEvent | `ANALYTICS#{date}` | `EVENT#{eventId}` | Privacy-conscious visit/product event |
| AskMamaTopicSummary | `ANALYTICS#{date}` | `ASK_MAMA_TOPIC#{category}` | Aggregated assistant topic metrics |

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
- `fastingPreference`

## FastingPreference

- `memberId`
- `observesFasting`
- `regularDays`
- `fastType`
- `reasonOrTradition`
- `allowedFoods`
- `avoidedFoods`
- `fastingMealCount`
- `fruitsAllowed`
- `dairyAllowed`
- `grainsRestricted`
- `customRules`

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
- `expiresAt`
- `expiresAtEpoch`
- `retentionPolicy`
- `commonMeal`
- `commonMeal.nutritionEstimate`
- `commonMeal.recipe`
- `memberCustomizations`
- `mealAttendance`
- `mealIngredientRequirements`
- `dailyGroceryRequirements`
- `fastingMealRequirements`
- `fruits`
- `hydration`
- `estimatedCost`
- `groceryItems`
- `familySatisfactionScore`
- `warnings`
- `disclaimer`

## 15-Day Retention Split

Expire after 15 days:

- Detailed generated meal-plan body
- Full recipe instructions attached to old generated plans
- Detailed grocery quantities for expired plans
- Meal-wise ingredient requirements for expired plans
- Temporary AI structured output used only for that plan

Retain until user deletes/changes data:

- User account and consent records
- Family profile and member profile
- Allergies, doctor restrictions, dietary restrictions, fasting preferences
- Food dislikes, favourites, rejected meals, cuisine preferences
- Lightweight suggested-dish history to reduce repetition
- Feedback and satisfaction signals
- Subscription entitlement and billing status
- CRM/support/audit records according to their own retention rules

## Website Analytics

Testing-stage analytics are stored in memory. Production should persist only privacy-conscious event records:

- `eventId`
- `eventName`
- `visitorId` anonymous local id
- `sessionId` anonymous session id
- `pagePath`
- `referrer` or source domain where available
- `category`
- `label`
- `deviceCategory`
- `country` and `region` from hosting headers where legally appropriate
- `createdAt`

Do not store raw IP addresses for visitor counting. Separate page views, visits/sessions, and estimated unique visitors in reports.

Ask MAMA production analytics should store aggregated topic/category counts and unresolved-question counts where possible. Avoid storing full sensitive user questions unless consent, retention, redaction, and admin access controls are in place.

## S3 Object Storage

Use S3 for larger files and exports, not as the primary application database.

Recommended bucket/prefix model:

- Bucket: `mamaai-prod-assets` or a shared company bucket with strict project prefixes.
- Project prefix: `mamaai/`
- Exports: `mamaai/exports/{userId}/{mealPlanId}/`
- Reports/PDFs: `mamaai/reports/{userId}/{reportId}.pdf`
- Uploads: `mamaai/uploads/{userId}/`
- Backups: `mamaai/backups/{yyyy}/{mm}/{dd}/`

S3 object metadata should store only non-sensitive lookup metadata. The authoritative relationship between a user, family, export, and permission remains in DynamoDB.

## AWS Isolation

MAMAAI may share the same AWS account used by education projects only if isolated by:

- Separate DynamoDB table names or table prefixes.
- Separate S3 buckets or prefixes.
- IAM policies restricted to MAMAAI table ARN and MAMAAI S3 bucket/prefix ARN.
- Separate environment variables and deployment secrets.
- CloudWatch logs and alarms tagged with `Project=mamaai`.

## Subscription Plans

| Plan | India Price | International Price | Member Limit |
| --- | ---: | ---: | ---: |
| Family Starter | INR 399/month | US$4.99/month | 4 |
| Family Premium | INR 599/month | US$6.99/month | 6 |
| Family Plus | INR 799/month | US$8.99/month | 10 |

Member limits must be enforced in backend services and API routes, not only in UI.

RevenueCat-ready fields:

- `revenueCatCustomerId`
- `revenueCatEntitlementId`
- `revenueCatProductId`
- `revenueCatInternationalProductId`
- `googlePlayProductId`
- `googlePlayInternationalProductId`
- `status`
- `source`
- `paymentChannel`
- `paymentStatus`
- `startsAt`
- `renewsAt`
- `cancelledAt`
- `currentPeriodEndsAt`
- `lastRevenueCatEventType`
- `lastRevenueCatEventAt`

Judge/Demo Access uses `source = demo_judge_access`, `isActive = true`, and `bypassPaymentForDemo = true` only for fictional demo data.

Production subscription records must be written from verified backend payment/webhook events. The frontend can display the returned entitlement, but it must not create or trust its own premium flag.

## Sensitive Data Rules

- Health conditions, doctor restrictions, allergies, recovery status, pregnancy/lactation, and AI memory require explicit consent.
- Admin roles may only see sensitive health data when their role requires it.
- Important admin actions must create `AuditLog` records.

## Migration Strategy

The MVP uses an in-memory repository to make the vertical slice runnable immediately. Production migration replaces repository implementations with DynamoDB repositories while keeping service interfaces and API contracts stable.
